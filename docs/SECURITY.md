# DracoProof Security Model & Threat Assessment

## 1. Prompt Injection Hardening
All external web content retrieved via `gl.nondet.web.get()` is treated as untrusted data. Prompts are constructed with explicit protocol rules commanding the LLM evaluator to ignore instructions embedded inside deliverable artifacts.

## 2. Storage Mutation Protection
In accordance with GenVM best practices, non-deterministic closures (`evaluate` and `validator_fn`) operate strictly on copied plain Python memory values, eliminating persistent storage mutation vulnerabilities.

## 3. Fail-Closed Invariants
Transient web failures (HTTP 4xx/5xx or timeouts) fail closed to `TRANSIENT:EVIDENCE_SOURCE_UNAVAILABLE`, keeping the milestone in a retryable `PENDING` state and preventing invalid finalizations.
