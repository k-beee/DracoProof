import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, type CalldataEncodable } from "genlayer-js/types";
import { contract } from "./config";
import type {
  Covenant,
  CriterionVerdict,
  DeliverableProof,
  ExecutorDossier,
  Milestone,
  MilestoneVerdict,
  Outcome,
  TxStatus,
} from "./types";

type WalletProvider = {
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: WalletProvider;
  }
}

const STUDIO_CHAIN_ID_HEX = "0xf22f";
const GENLAYER_SNAP_ID = "npm:genlayer-wallet-plugin";

export function describeWalletError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as {
      code?: unknown;
      message?: unknown;
      shortMessage?: unknown;
      data?: { message?: unknown };
    };
    const message = [value.shortMessage, value.message, value.data?.message].find(
      (item) => typeof item === "string" && item.length > 0
    );
    const code = value.code === undefined ? "" : ` [provider code ${String(value.code)}]`;
    if (message) return `${message}${code}`;
    try {
      return `${JSON.stringify(error)}${code}`;
    } catch {
      return `Wallet request failed${code}.`;
    }
  }
  return String(error || "Protocol transaction failed.");
}

const readClient = createClient({ chain: studionet });
const call = <T>(functionName: string, args: CalldataEncodable[] = []) =>
  readClient.readContract({
    address: contract.address,
    functionName,
    args,
  }) as Promise<T>;

export const dracoProof = {
  getCovenant: (id: string) => call<Covenant>("get_covenant", [id]),
  getCovenantCount: () => call<number>("get_covenant_count"),
  getCovenantIdAt: (index: number) => call<string>("get_covenant_id_at", [index]),
  getCreatorCovenantCount: (address: string) => call<number>("get_creator_covenant_count", [address]),
  getCovenantPage: (start: number, limit: number) => call<Covenant[]>("get_covenant_page", [start, limit]),

  getMilestone: (covenantId: string, index: number) => call<Milestone>("get_milestone", [covenantId, index]),
  getMilestoneCriterion: (covenantId: string, milestoneIndex: number, criterionIndex: number) =>
    call<string>("get_milestone_criterion", [covenantId, milestoneIndex, criterionIndex]),

  getProof: (id: string) => call<DeliverableProof>("get_proof", [id]),
  getProofCount: () => call<number>("get_proof_count"),
  getProofIdAt: (index: number) => call<string>("get_proof_id_at", [index]),
  getProofPage: (start: number, limit: number) => call<DeliverableProof[]>("get_proof_page", [start, limit]),

  getMilestoneVerdict: (covenantId: string, milestoneIndex: number) =>
    call<MilestoneVerdict>("get_milestone_verdict", [covenantId, milestoneIndex]),
  getCriterionVerdict: (covenantId: string, milestoneIndex: number, criterionIndex: number) =>
    call<CriterionVerdict>("get_criterion_verdict", [covenantId, milestoneIndex, criterionIndex]),
  getCriterionUsedProofId: (covenantId: string, milestoneIndex: number, criterionIndex: number, usedIndex: number) =>
    call<string>("get_criterion_used_proof_id", [covenantId, milestoneIndex, criterionIndex, usedIndex]),

  getExecutorDossier: (executor: string) => call<ExecutorDossier>("get_executor_dossier", [executor]),
  isCovenantSatisfied: (covenantId: string, milestoneIndex: number) =>
    call<boolean>("is_covenant_satisfied", [covenantId, milestoneIndex]),
};

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("No Web3 wallet found. Install or unlock a StudioNet-compatible wallet.");
  }
  const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts[0]) throw new Error("Wallet did not return an active account.");
  return accounts[0];
}

async function preflightWallet(account: string): Promise<void> {
  if (!window.ethereum) throw new Error("No Web3 wallet found.");
  const [accounts, chainId] = await Promise.all([
    window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>,
    window.ethereum.request({ method: "eth_chainId" }) as Promise<string>,
  ]);
  if (!accounts.some((cand) => cand.toLowerCase() === account.toLowerCase())) {
    throw new Error("Connected wallet account changed. Please reconnect and retry.");
  }
  if (chainId !== STUDIO_CHAIN_ID_HEX) {
    throw new Error(
      `Wallet connected to chain ID ${parseInt(chainId, 16)}. Switch network to GenLayer StudioNet (61999).`
    );
  }
  try {
    const snaps = (await window.ethereum.request({ method: "wallet_getSnaps" })) as Record<string, unknown>;
    if (!snaps || typeof snaps !== "object") throw new Error("Invalid response from wallet_getSnaps.");
    const snapInstalled = Object.prototype.hasOwnProperty.call(snaps, GENLAYER_SNAP_ID);
    if (snapInstalled) return;
  } catch (error) {
    throw new Error(
      `Injected wallet cannot provide GenLayer Snap access (${describeWalletError(error)}). Ensure MetaMask Snaps is enabled.`,
      { cause: error }
    );
  }
}

export async function writeDracoProof(
  method: "create_covenant" | "set_milestone_criteria" | "freeze_covenant" | "register_deliverable_proof" | "adjudicate_milestone",
  args: CalldataEncodable[],
  account: string,
  setStatus: (status: TxStatus, hash?: string) => void
): Promise<string> {
  if (!window.ethereum) throw new Error("No Web3 wallet found.");
  setStatus("WALLET_CONFIRMATION");
  await preflightWallet(account);

  const client = createClient({
    chain: studionet,
    account: account as `0x${string}`,
    provider: window.ethereum,
  });

  await client.connect("studionet");
  const hash = await client.writeContract({
    address: contract.address,
    functionName: method,
    args,
    value: 0n,
  });

  setStatus("SUBMITTED", hash);
  setStatus("CONSENSUS_PENDING", hash);

  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
  });

  if (receipt.txExecutionResultName && receipt.txExecutionResultName !== "FINISHED_WITH_RETURN") {
    throw new Error(`Consensus finalized but execution did not return successfully: ${receipt.txExecutionResultName}`);
  }

  setStatus("FINALIZED", hash);
  return hash;
}
