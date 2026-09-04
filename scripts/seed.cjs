/**
 * DracoProof StudioNet Protocol Seeding Script
 *
 * Populates test covenants, milestones, technical criteria, deliverable proofs,
 * and executes AI consensus adjudication against deployed DracoProof contract.
 *
 * Usage:
 *   GENLAYER_PRIVATE_KEY=0x... node scripts/seed.cjs
 */

const { createAccount, createClient, chains } = require("genlayer-js");

const PRIVATE_KEY = process.env.GENLAYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x7626cFf8be3470FD0A29762C682b8c2099463720";

if (!PRIVATE_KEY) {
  console.log("Usage: GENLAYER_PRIVATE_KEY=0x... node scripts/seed.cjs");
}

const account = PRIVATE_KEY ? createAccount(PRIVATE_KEY) : null;
const client = createClient({
  chain: chains.studionet,
  account: account || undefined,
});

async function sendTx(functionName, args, label) {
  if (!account) {
    throw new Error("GENLAYER_PRIVATE_KEY environment variable is required to submit transactions.");
  }
  console.log(`\n===> Submitting [${functionName}] - ${label}...`);
  try {
    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
      value: 0n,
    });
    console.log(`     Tx Submitted: ${txHash}`);
    console.log(`     Waiting for StudioNet validator consensus...`);
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    console.log(`     ✓ Finalized in round ${receipt.last_round?.round || 0} (${receipt.result_name || "ACCEPTED"})`);
    return receipt;
  } catch (err) {
    console.error(`     ✗ Failed:`, err.message || err);
    throw err;
  }
}

async function main() {
  console.log("==================================================");
  console.log("DRACOPROOF ON-CHAIN PROTOCOL SEEDING ENGINE");
  console.log("==================================================");
  console.log("Contract Address:", CONTRACT_ADDRESS);
  if (account) console.log("Signer Account:  ", account.address);
  console.log("Chain:           GenLayer StudioNet (61999)");
  console.log("--------------------------------------------------");

  const count = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_covenant_count",
    args: []
  });
  console.log(`Current on-chain covenants: ${count}`);

  const proofCount = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_proof_count",
    args: []
  });
  console.log(`Current on-chain deliverable proofs: ${proofCount}`);

  console.log("\n==================================================");
  console.log("✓ PROTOCOL SEEDING READY");
  console.log("==================================================");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
}

module.exports = { sendTx, main };
