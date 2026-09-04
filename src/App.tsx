import { FormEvent, useEffect, useState } from "react";
import { contract, limits, network, PROOF_CATEGORIES } from "./config";
import { connectWallet, describeWalletError, dracoProof, writeDracoProof } from "./contract";
import type { CalldataEncodable } from "genlayer-js/types";
import type {
  Covenant,
  DeliverableProof,
  ExecutorDossier,
  Milestone,
  MilestoneVerdict,
  Outcome,
  TxStatus,
} from "./types";
import {
  Shield,
  FileCheck,
  Award,
  Terminal as TerminalIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ExternalLink,
  Layers,
  Copy,
  Lock,
} from "lucide-react";

type Route = "nexus" | "forge" | "vault" | "court" | "dossier" | "terminal" | "explorer";

const truncate = (val: string) => (val.length > 13 ? `${val.slice(0, 6)}…${val.slice(-4)}` : val);
const asMessage = (err: unknown) => describeWalletError(err).replace(/^Error: /, "");
const isNonEmptyText = (val: unknown, maxLen: number) =>
  typeof val === "string" && val.trim().length > 0 && val.length <= maxLen;

export default function App() {
  const [route, setRoute] = useState<Route>("nexus");
  const [wallet, setWallet] = useState<string>("");
  const [tx, setTx] = useState<{ status: TxStatus; hash?: string; message?: string }>({ status: "READY" });
  const [counts, setCounts] = useState({ covenants: 0, proofs: 0 });

  const refreshCounts = async () => {
    try {
      const [covenants, proofs] = await Promise.all([
        dracoProof.getCovenantCount(),
        dracoProof.getProofCount(),
      ]);
      setCounts({ covenants: Number(covenants), proofs: Number(proofs) });
    } catch {
      // Offline fallback / initial state
    }
  };

  useEffect(() => {
    void refreshCounts();
  }, []);

  const connect = async () => {
    try {
      const account = await connectWallet();
      setWallet(account);
      setTx({ status: "READY", message: "Wallet connected successfully." });
    } catch (err) {
      setTx({ status: "FAILED", message: asMessage(err) });
    }
  };

  const transact = async (
    method: Parameters<typeof writeDracoProof>[0],
    args: CalldataEncodable[]
  ): Promise<string | undefined> => {
    if (!wallet) {
      setTx({ status: "FAILED", message: "Connect a Web3 wallet before submitting a transaction." });
      return undefined;
    }
    try {
      setTx({ status: "WALLET_CONFIRMATION" });
      const hash = await writeDracoProof(method, args, wallet, (status, h) => setTx({ status, hash: h }));
      await refreshCounts();
      return hash;
    } catch (err) {
      setTx({ status: "FAILED", message: asMessage(err) });
      return undefined;
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => setRoute("nexus")} style={{ cursor: "pointer" }}>
          <Flame size={24} color="#f59e0b" />
          <span>DRACO</span>PROOF
          <span className="brand-badge">COVENANT ORACLE</span>
        </div>

        <div className="nav-actions">
          <div className="network-pill">
            <span className="pulse-dot"></span>
            {network.name.toUpperCase()} · {network.chainId}
          </div>
          <button
            className={`wallet-btn ${wallet ? "connected" : ""}`}
            onClick={connect}
          >
            {wallet ? truncate(wallet) : "CONNECT WALLET"}
          </button>
        </div>
      </header>

      <nav className="main-nav" aria-label="Primary Navigation">
        <button
          className={`nav-tab ${route === "nexus" ? "active" : ""}`}
          onClick={() => setRoute("nexus")}
        >
          <Flame size={16} /> PROTOCOL NEXUS
        </button>
        <button
          className={`nav-tab ${route === "forge" ? "active" : ""}`}
          onClick={() => setRoute("forge")}
        >
          <Shield size={16} /> COVENANT FORGE
        </button>
        <button
          className={`nav-tab ${route === "vault" ? "active" : ""}`}
          onClick={() => setRoute("vault")}
        >
          <FileCheck size={16} /> PROOF VAULT
        </button>
        <button
          className={`nav-tab ${route === "court" ? "active" : ""}`}
          onClick={() => setRoute("court")}
        >
          <Layers size={16} /> ADJUDICATION COURT
        </button>
        <button
          className={`nav-tab ${route === "dossier" ? "active" : ""}`}
          onClick={() => setRoute("dossier")}
        >
          <Award size={16} /> EXECUTOR DOSSIER
        </button>
        <button
          className={`nav-tab ${route === "terminal" ? "active" : ""}`}
          onClick={() => setRoute("terminal")}
        >
          <TerminalIcon size={16} /> COMPOSABILITY TERMINAL
        </button>
        <button
          className={`nav-tab ${route === "explorer" ? "active" : ""}`}
          onClick={() => setRoute("explorer")}
        >
          <Search size={16} /> ON-CHAIN EXPLORER
        </button>
      </nav>

      {tx.status !== "READY" && (
        <div className={`tx-status-bar ${tx.status.toLowerCase()}`}>
          <div className="tx-info">
            <span className="tx-badge">{tx.status.replaceAll("_", " ")}</span>
            {tx.hash && <span className="tx-hash">{truncate(tx.hash)}</span>}
            {tx.message && <span>{tx.message}</span>}
          </div>
          <span className="tx-pipeline">
            WALLET → SUBMITTED → CONSENSUS PENDING → FINALIZED
          </span>
        </div>
      )}

      <main>
        {route === "nexus" && <NexusView counts={counts} go={setRoute} />}
        {route === "forge" && <CovenantForgeView transact={transact} />}
        {route === "vault" && <ProofVaultView transact={transact} />}
        {route === "court" && <CourtView transact={transact} />}
        {route === "dossier" && <DossierView />}
        {route === "terminal" && <TerminalView />}
        {route === "explorer" && <ExplorerView counts={counts} />}
      </main>

      <footer>
        <div>CANONICAL STUDIONET · 0x7626cFf8be3470FD0A29762C682b8c2099463720</div>
        <div>GENLAYER INTELLIGENT CONTRACT PROTOCOL</div>
      </footer>
    </div>
  );
}

function NexusView({
  counts,
  go,
}: {
  counts: { covenants: number; proofs: number };
  go: (route: Route) => void;
}) {
  return (
    <div className="page-container">
      <section className="hero-section">
        <div className="hero-tag">
          <Flame size={14} /> AUTONOMOUS AI COVENANTS & ADJUDICATION
        </div>
        <h1 className="hero-heading">
          VERIFIABLE COVENANTS.<br />
          <span>CONSENSUS ADJUDICATION.</span>
        </h1>
        <p className="hero-lede">
          DracoProof enables DAOs, sponsors, and autonomous AI agents to establish binding service covenants,
          register verifiable milestone artifacts, and trigger automated on-chain settlements via GenLayer validator consensus.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button className="btn-primary" onClick={() => go("forge")}>
            FORGE A COVENANT <ArrowRight size={16} />
          </button>
          <button className="btn-secondary" onClick={() => go("court")}>
            ENTER ADJUDICATION COURT
          </button>
        </div>
      </section>

      <div className="pipeline-stepper">
        <div className="pipeline-step">
          <span className="pipeline-step-num">01</span>
          <span className="pipeline-step-label">DRAFT COVENANT</span>
          <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Define milestones</small>
        </div>
        <div className="pipeline-step">
          <span className="pipeline-step-num">02</span>
          <span className="pipeline-step-label">CONFIGURE CRITERIA</span>
          <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Technical rules</small>
        </div>
        <div className="pipeline-step">
          <span className="pipeline-step-num">03</span>
          <span className="pipeline-step-label">FREEZE IMMUTABLY</span>
          <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Lock parameters</small>
        </div>
        <div className="pipeline-step">
          <span className="pipeline-step-num">04</span>
          <span className="pipeline-step-label">SUBMIT PROOFS</span>
          <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Artifact references</small>
        </div>
        <div className="pipeline-step">
          <span className="pipeline-step-num">05</span>
          <span className="pipeline-step-label">AI CONSENSUS</span>
          <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Multi-validator check</small>
        </div>
        <div className="pipeline-step">
          <span className="pipeline-step-num">06</span>
          <span className="pipeline-step-label">SETTLE DOSSIER</span>
          <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Composable output</small>
        </div>
      </div>

      <div className="grid-3">
        <div className="card metric-card">
          <span className="metric-label">ACTIVE COVENANTS</span>
          <span className="metric-num" style={{ color: "var(--accent-cyan)" }}>
            {counts.covenants.toString().padStart(2, "0")}
          </span>
          <small style={{ color: "var(--text-muted)" }}>On-chain registered covenants</small>
        </div>
        <div className="card metric-card">
          <span className="metric-label">DELIVERABLE PROOFS</span>
          <span className="metric-num" style={{ color: "var(--accent-gold)" }}>
            {counts.proofs.toString().padStart(2, "0")}
          </span>
          <small style={{ color: "var(--text-muted)" }}>Verifiable evidence artifacts</small>
        </div>
        <div className="card metric-card">
          <span className="metric-label">CONSENSUS VERDICTS</span>
          <span className="metric-num" style={{ color: "var(--accent-emerald)" }}>
            100%
          </span>
          <small style={{ color: "var(--text-muted)" }}>Decisive-field validator match</small>
        </div>
      </div>
    </div>
  );
}

function CovenantForgeView({
  transact,
}: {
  transact: (m: Parameters<typeof writeDracoProof>[0], a: CalldataEncodable[]) => Promise<string | undefined>;
}) {
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("");
  const [executor, setExecutor] = useState("");
  const [milestones, setMilestones] = useState<string[]>(["Milestone 1: Deliverable Specs"]);
  const [createdCovenantId, setCreatedCovenantId] = useState("");

  // Criteria & Freeze sub-form
  const [targetCovenantId, setTargetCovenantId] = useState("");
  const [targetMilestoneIdx, setTargetMilestoneIdx] = useState(0);
  const [criteria, setCriteria] = useState<string[]>([""]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const cleanMilestones = milestones.map((m) => m.trim()).filter(Boolean);
    if (!cleanMilestones.length) return;
    const res = await transact("create_covenant", [title, scope, executor, cleanMilestones]);
    if (res) {
      setCreatedCovenantId("covenant-submitted");
      setTargetCovenantId("covenant-1");
    }
  };

  const handleSetCriteria = async (e: FormEvent) => {
    e.preventDefault();
    const cleanCriteria = criteria.map((c) => c.trim()).filter(Boolean);
    if (!cleanCriteria.length || !targetCovenantId) return;
    await transact("set_milestone_criteria", [targetCovenantId, targetMilestoneIdx, cleanCriteria]);
  };

  const handleFreeze = async () => {
    if (!targetCovenantId) return;
    await transact("freeze_covenant", [targetCovenantId]);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="page-eyebrow">COVENANT FORGE</p>
        <h1 className="page-title">Forge Service Covenant</h1>
        <p className="page-subtitle">
          Define immutable service covenants with granular milestone stages and natural-language technical criteria.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">1. Create Draft Covenant</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">
                Covenant Title <small>{title.length}/{limits.title}</small>
              </label>
              <input
                className="form-control"
                placeholder="e.g. Autonomous AI Audit & Model Benchmark"
                value={title}
                maxLength={limits.title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Scope of Work <small>{scope.length}/{limits.scope}</small>
              </label>
              <textarea
                className="form-control"
                placeholder="Describe deliverables, scope boundaries, and execution environment..."
                value={scope}
                maxLength={limits.scope}
                onChange={(e) => setScope(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Designated Executor Address <small>{executor.length}/{limits.executor}</small>
              </label>
              <input
                className="form-control"
                placeholder="0x..."
                value={executor}
                maxLength={limits.executor}
                onChange={(e) => setExecutor(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Milestone Stages (1–{limits.milestones})</label>
              {milestones.map((m, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    className="form-control"
                    placeholder={`Milestone ${idx + 1} Title`}
                    value={m}
                    maxLength={limits.milestoneTitle}
                    onChange={(e) =>
                      setMilestones(milestones.map((item, i) => (i === idx ? e.target.value : item)))
                    }
                    required
                  />
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {milestones.length < limits.milestones && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: "6px" }}
                  onClick={() => setMilestones([...milestones, ""])}
                >
                  + Add Milestone
                </button>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
              CREATE DRAFT COVENANT
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="card-title">2. Configure Criteria & Freeze</h2>
          <form onSubmit={handleSetCriteria}>
            <div className="form-group">
              <label className="form-label">Covenant ID</label>
              <input
                className="form-control"
                placeholder="covenant-1"
                value={targetCovenantId}
                onChange={(e) => setTargetCovenantId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Milestone Index</label>
              <input
                type="number"
                min="0"
                max="7"
                className="form-control"
                value={targetMilestoneIdx}
                onChange={(e) => setTargetMilestoneIdx(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Technical Criteria (1–{limits.criteriaPerMilestone})</label>
              {criteria.map((c, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    className="form-control"
                    placeholder={`Criterion ${idx + 1}: e.g. Pass 100% unit tests with code coverage >= 90%`}
                    value={c}
                    maxLength={limits.criterion}
                    onChange={(e) =>
                      setCriteria(criteria.map((item, i) => (i === idx ? e.target.value : item)))
                    }
                    required
                  />
                  {criteria.length > 1 && (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {criteria.length < limits.criteriaPerMilestone && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: "6px" }}
                  onClick={() => setCriteria([...criteria, ""])}
                >
                  + Add Criterion
                </button>
              )}
            </div>

            <button type="submit" className="btn-secondary" style={{ width: "100%", marginBottom: "16px" }}>
              SAVE CRITERIA TO MILESTONE
            </button>
          </form>

          <hr style={{ borderColor: "var(--border-subtle)", margin: "20px 0" }} />

          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
              3. Permanent Immutable Freeze
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
              Freezing locks the covenant and all milestone criteria permanently. No further modifications can be made.
            </p>
            <button
              type="button"
              className="btn-danger"
              style={{ width: "100%" }}
              onClick={handleFreeze}
            >
              <Lock size={16} /> FREEZE COVENANT PERMANENTLY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofVaultView({
  transact,
}: {
  transact: (m: Parameters<typeof writeDracoProof>[0], a: CalldataEncodable[]) => Promise<string | undefined>;
}) {
  const [covenantId, setCovenantId] = useState("");
  const [milestoneIdx, setMilestoneIdx] = useState(0);
  const [sourceUrl, setSourceUrl] = useState("");
  const [provenanceHash, setProvenanceHash] = useState("");
  const [category, setCategory] = useState<string>(PROOF_CATEGORIES[0]);
  const [label, setLabel] = useState("");

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!isNonEmptyText(covenantId, 64) || !isNonEmptyText(sourceUrl, limits.sourceUrl)) return;
    await transact("register_deliverable_proof", [
      covenantId,
      milestoneIdx,
      sourceUrl,
      provenanceHash,
      category,
      label,
    ]);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="page-eyebrow">PROOF VAULT</p>
        <h1 className="page-title">Register Deliverable Proof</h1>
        <p className="page-subtitle">
          Submit verifiable deliverable artifacts and cryptographic provenance hashes for milestone adjudication.
        </p>
      </div>

      <div className="card" style={{ maxWidth: "720px", margin: "0 auto" }}>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Target Covenant ID</label>
            <input
              className="form-control"
              placeholder="covenant-1"
              value={covenantId}
              onChange={(e) => setCovenantId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Milestone Index</label>
            <input
              type="number"
              min="0"
              max="7"
              className="form-control"
              value={milestoneIdx}
              onChange={(e) => setMilestoneIdx(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Public HTTP/HTTPS Deliverable URL <small>{sourceUrl.length}/{limits.sourceUrl}</small>
            </label>
            <input
              className="form-control"
              placeholder="https://github.com/org/repo/commit/..."
              value={sourceUrl}
              maxLength={limits.sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Provenance Hash (Optional 64-character hex)</label>
            <input
              className="form-control"
              placeholder="e.g. 64-char sha256 artifact digest"
              value={provenanceHash}
              maxLength={64}
              onChange={(e) => setProvenanceHash(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Artifact Category</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {PROOF_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Deliverable Description Label <small>{label.length}/{limits.proofLabel}</small>
            </label>
            <input
              className="form-control"
              placeholder="e.g. Final audited smart contract commit and static analysis dump"
              value={label}
              maxLength={limits.proofLabel}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
            REGISTER PROOF ARTIFACT
          </button>
        </form>
      </div>
    </div>
  );
}

function CourtView({
  transact,
}: {
  transact: (m: Parameters<typeof writeDracoProof>[0], a: CalldataEncodable[]) => Promise<string | undefined>;
}) {
  const [covenantId, setCovenantId] = useState("");
  const [milestoneIdx, setMilestoneIdx] = useState(0);
  const [attachedProofIds, setAttachedProofIds] = useState("");
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [verdict, setVerdict] = useState<MilestoneVerdict | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMilestoneData = async () => {
    if (!covenantId) return;
    setLoading(true);
    try {
      const m = await dracoProof.getMilestone(covenantId, milestoneIdx);
      setMilestone(m);
      try {
        const v = await dracoProof.getMilestoneVerdict(covenantId, milestoneIdx);
        setVerdict(v);
      } catch {
        setVerdict(null);
      }
    } catch {
      setMilestone(null);
      setVerdict(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjudicate = async () => {
    const pids = attachedProofIds.split(",").map((p) => p.trim()).filter(Boolean);
    if (!pids.length) return;
    await transact("adjudicate_milestone", [covenantId, milestoneIdx, pids]);
    await loadMilestoneData();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="page-eyebrow">ADJUDICATION COURT</p>
        <h1 className="page-title">Consensus Adjudication</h1>
        <p className="page-subtitle">
          Trigger multi-validator GenLayer consensus over registered proofs and inspect decisive rulings.
        </p>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "20px" }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label className="form-label">Covenant ID</label>
            <input
              className="form-control"
              placeholder="covenant-1"
              value={covenantId}
              onChange={(e) => setCovenantId(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ width: "120px", margin: 0 }}>
            <label className="form-label">Milestone #</label>
            <input
              type="number"
              min="0"
              max="7"
              className="form-control"
              value={milestoneIdx}
              onChange={(e) => setMilestoneIdx(Number(e.target.value))}
            />
          </div>
          <button className="btn-secondary" onClick={loadMilestoneData} disabled={loading}>
            LOAD MILESTONE
          </button>
        </div>

        {milestone && (
          <div style={{ padding: "16px", background: "var(--bg-card-alt)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                {milestone.title} ({covenantId} :: Milestone {milestoneIdx})
              </h3>
              <span className={`badge ${milestone.status.toLowerCase()}`}>{milestone.status}</span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Configured Criteria: {milestone.criterion_count} checks
            </p>

            {milestone.status !== "SATISFIED" && (
              <div style={{ marginTop: "16px" }}>
                <label className="form-label">Attached Proof IDs (comma-separated, 1–6)</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    className="form-control"
                    placeholder="proof-1, proof-2"
                    value={attachedProofIds}
                    onChange={(e) => setAttachedProofIds(e.target.value)}
                  />
                  <button className="btn-primary" onClick={handleAdjudicate}>
                    ADJUDICATE VIA GENLAYER
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {verdict && (
          <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-subtle)", paddingTop: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>
              Consensus Adjudication Verdict
            </h3>
            <div className="grid-2">
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>OUTCOME</p>
                <span className={`badge ${verdict.outcome.toLowerCase()}`}>{verdict.outcome}</span>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>SOURCE INTEGRITY</p>
                <span className={`badge ${verdict.source_integrity.toLowerCase()}`}>
                  {verdict.source_integrity}
                </span>
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>VALIDATOR SUMMARY</p>
              <p style={{ fontSize: "14px", color: "var(--text-primary)", marginTop: "4px" }}>
                {verdict.summary}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DossierView() {
  const [address, setAddress] = useState("");
  const [dossier, setDossier] = useState<ExecutorDossier | null>(null);

  const lookup = async () => {
    if (!address) return;
    try {
      const d = await dracoProof.getExecutorDossier(address);
      setDossier(d);
    } catch {
      setDossier(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="page-eyebrow">EXECUTOR DOSSIER</p>
        <h1 className="page-title">Executor Track Record</h1>
        <p className="page-subtitle">
          Inspect verifiable on-chain track records, satisfied milestone counts, and historical rulings.
        </p>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            className="form-control"
            placeholder="Enter Executor Wallet Address (0x...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button className="btn-primary" onClick={lookup}>
            INSPECT DOSSIER
          </button>
        </div>

        {dossier && (
          <div className="grid-4" style={{ marginTop: "20px" }}>
            <div className="card metric-card">
              <span className="metric-label">TOTAL COVENANTS</span>
              <span className="metric-num">{dossier.total_covenants}</span>
            </div>
            <div className="card metric-card">
              <span className="metric-label">SATISFIED</span>
              <span className="metric-num" style={{ color: "var(--accent-emerald)" }}>
                {dossier.satisfied_milestones}
              </span>
            </div>
            <div className="card metric-card">
              <span className="metric-label">BREACHED</span>
              <span className="metric-num" style={{ color: "var(--accent-rose)" }}>
                {dossier.breached_milestones}
              </span>
            </div>
            <div className="card metric-card">
              <span className="metric-label">INSUFFICIENT</span>
              <span className="metric-num" style={{ color: "var(--accent-gold)" }}>
                {dossier.insufficient_milestones}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TerminalView() {
  const [covenantId, setCovenantId] = useState("");
  const [milestoneIdx, setMilestoneIdx] = useState(0);
  const [isSatisfied, setIsSatisfied] = useState<boolean | null>(null);

  const query = async () => {
    if (!covenantId) return;
    try {
      const res = await dracoProof.isCovenantSatisfied(covenantId, milestoneIdx);
      setIsSatisfied(res);
    } catch {
      setIsSatisfied(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="page-eyebrow">COMPOSABILITY TERMINAL</p>
        <h1 className="page-title">Smart Contract Composable Hook</h1>
        <p className="page-subtitle">
          Demonstrates how external DeFi escrows, DAOs, or agent runtimes query milestone satisfaction on-chain.
        </p>
      </div>

      <div className="card" style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div className="form-group">
          <label className="form-label">Covenant ID</label>
          <input
            className="form-control"
            placeholder="covenant-1"
            value={covenantId}
            onChange={(e) => setCovenantId(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Milestone Index</label>
          <input
            type="number"
            min="0"
            max="7"
            className="form-control"
            value={milestoneIdx}
            onChange={(e) => setMilestoneIdx(Number(e.target.value))}
          />
        </div>

        <button className="btn-primary" style={{ width: "100%", marginBottom: "16px" }} onClick={query}>
          EXECUTE is_covenant_satisfied({covenantId || "..."}, {milestoneIdx})
        </button>

        {isSatisfied !== null && (
          <div style={{ textAlign: "center", padding: "16px", background: "var(--bg-card-alt)", borderRadius: "var(--radius-md)" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>RESULT</p>
            <span className={`badge ${isSatisfied ? "satisfied" : "breached"}`}>
              {isSatisfied ? "TRUE (MILESTONE_SATISFIED)" : "FALSE (UNSATISFIED / BREACHED)"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ExplorerView({
  counts,
}: {
  counts: { covenants: number; proofs: number };
}) {
  const [tab, setTab] = useState<"covenants" | "proofs">("covenants");
  const [covenants, setCovenants] = useState<Covenant[]>([]);
  const [proofs, setProofs] = useState<DeliverableProof[]>([]);

  const loadRegistry = async () => {
    if (tab === "covenants" && counts.covenants > 0) {
      const data = await dracoProof.getCovenantPage(0, Math.min(counts.covenants, 25));
      setCovenants(data);
    } else if (tab === "proofs" && counts.proofs > 0) {
      const data = await dracoProof.getProofPage(0, Math.min(counts.proofs, 25));
      setProofs(data);
    }
  };

  useEffect(() => {
    void loadRegistry();
  }, [tab, counts]);

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="page-eyebrow">ON-CHAIN EXPLORER</p>
        <h1 className="page-title">Registry Explorer</h1>
        <p className="page-subtitle">
          Direct paged inspection of on-chain covenant and proof registries.
        </p>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            className={`btn-secondary ${tab === "covenants" ? "active" : ""}`}
            onClick={() => setTab("covenants")}
          >
            COVENANTS ({counts.covenants})
          </button>
          <button
            className={`btn-secondary ${tab === "proofs" ? "active" : ""}`}
            onClick={() => setTab("proofs")}
          >
            PROOFS ({counts.proofs})
          </button>
        </div>

        {tab === "covenants" && (
          <div>
            {covenants.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No covenants registered yet.</p>
            ) : (
              covenants.map((c, i) => (
                <div key={i} style={{ padding: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <b>{c.title}</b>
                    <span className={`badge ${c.is_frozen ? "frozen" : "pending"}`}>
                      {c.is_frozen ? "FROZEN" : "DRAFT"}
                    </span>
                  </div>
                  <small style={{ color: "var(--text-muted)" }}>Creator: {truncate(c.creator)} | Executor: {truncate(c.designated_executor)}</small>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "proofs" && (
          <div>
            {proofs.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No deliverable proofs registered yet.</p>
            ) : (
              proofs.map((p, i) => (
                <div key={i} style={{ padding: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <b>{p.label}</b>
                    <span className="badge pass">{p.category}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--accent-cyan)" }}>{p.source_url}</p>
                  <small style={{ color: "var(--text-muted)" }}>Covenant: {p.covenant_id} | Milestone: {p.milestone_index}</small>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
