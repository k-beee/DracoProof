# DracoProof Protocol Specification V1

## Abstract
DracoProof is an Intelligent Contract protocol establishing decentralized service covenants and milestone deliverable adjudication via GenLayer validator consensus.

## System Architecture

1. **Covenants:** Immutable contracts binding sponsors, designated executors, and bounded milestone criteria.
2. **Deliverables:** Decoupled external evidence references with optional cryptographic SHA-256 provenance digests.
3. **Court Engine:** Non-deterministic execution in `gl.vm.run_nondet_unsafe` using `gl.nondet.web.get` and `gl.nondet.exec_prompt`.
4. **Equivalence Principle:** Decisive-field equivalence matching in `validator_fn` ensuring Byzantine-resistant consensus without brittle string equality on natural-language summaries.
5. **Composability:** Clean read APIs enabling third-party smart contracts to verify deliverable satisfaction in real-time.
