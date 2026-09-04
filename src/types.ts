export type Outcome = "PENDING" | "SATISFIED" | "BREACHED" | "INSUFFICIENT_PROOF";
export type TxStatus = "READY" | "WALLET_CONFIRMATION" | "SUBMITTED" | "CONSENSUS_PENDING" | "FINALIZED" | "FAILED";

export type Covenant = {
  creator: string;
  title: string;
  scope: string;
  designated_executor: string;
  milestone_count: number;
  is_frozen: boolean;
  created_at: string;
};

export type Milestone = {
  covenant_id: string;
  index: number;
  title: string;
  criterion_count: number;
  status: Outcome;
  resolved_at: string;
};

export type DeliverableProof = {
  submitter: string;
  covenant_id: string;
  milestone_index: number;
  source_url: string;
  provenance_hash: string;
  category: string;
  label: string;
  submitted_at: string;
};

export type CriterionVerdict = {
  verdict: "PASS" | "FAIL" | "UNKNOWN";
  used_proof_count: number;
};

export type MilestoneVerdict = {
  covenant_id: string;
  milestone_index: number;
  outcome: Outcome;
  source_integrity: "PASS" | "FAIL" | "UNCERTAIN";
  summary: string;
  resolved_at: string;
};

export type ExecutorDossier = {
  executor: string;
  total_covenants: number;
  satisfied_milestones: number;
  breached_milestones: number;
  insufficient_milestones: number;
  latest_verdict_key: string;
  updated_at: string;
};
