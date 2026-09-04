# DracoProof Deployment & Verification Runbook

## Pre-Deployment Verification

1. Typecheck and lint contract source:
   ```bash
   genvm-lint check contracts/DracoProof.py --json
   ```
2. Run direct test suite:
   ```bash
   pytest tests/direct/ -v
   ```
3. Generate and verify the contract ABI schema:
   ```bash
   genvm-lint schema contracts/DracoProof.py --json
   ```

## Studio Deployment Steps

1. Open GenLayer Studio and select the **StudioNet** or **Bradbury** network.
2. Create a new Intelligent Contract, paste the exact source from `contracts/DracoProof.py`.
3. Verify that class `DracoProof` is detected with an empty constructor.
4. Deploy the contract and record the resulting contract address and transaction hash.
5. Update `src/config.ts` with the new contract address.
