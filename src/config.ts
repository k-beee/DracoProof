export const network = {
  name: "StudioNet",
  chainId: 61999,
  rpcUrl: "https://studio.genlayer.com/api",
} as const;

export const contract = {
  address: "0x7626cFf8be3470FD0A29762C682b8c2099463720" as `0x${string}`,
  className: "DracoProof",
  runner: "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6",
} as const;

export const limits = {
  title: 120,
  scope: 500,
  executor: 160,
  milestones: 8,
  milestoneTitle: 120,
  criteriaPerMilestone: 8,
  criterion: 300,
  sourceUrl: 512,
  proofLabel: 100,
  proofsPerAdjudication: 6,
  summary: 500,
} as const;

export const PROOF_CATEGORIES = [
  "CODE_REPOSITORY",
  "AUDIT_REPORT",
  "DEPLOYMENT_ENDPOINT",
  "RESEARCH_DATA",
  "TELEMETRY_LOG",
  "TEST_SUITE_PROOF",
  "LEGAL_CONTRACT",
  "CUSTOM_DELIVERABLE",
] as const;
