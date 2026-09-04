import pytest

CONTRACT = "contracts/DracoProof.py"
HASH_1 = "d" * 64
HASH_2 = "e" * 64

def test_full_multi_milestone_adjudication_lifecycle(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT)
    executor = "0x3333333333333333333333333333333333333333"
    
    # 1. Create 2-stage covenant
    cid = contract.create_covenant(
        "Decentralized Data Pipeline",
        "Build scalable sub-second indexing engine",
        executor,
        ["Stage 1: Core Engine", "Stage 2: Stress Testing"]
    )
    
    # 2. Configure criteria
    contract.set_milestone_criteria(cid, 0, ["Latency < 50ms on 10k RPS", "Zero memory leaks"])
    contract.set_milestone_criteria(cid, 1, ["Fault tolerance verification under network partition"])
    
    # 3. Freeze
    contract.freeze_covenant(cid)
    
    # 4. Register proofs
    p1 = contract.register_deliverable_proof(cid, 0, "https://evidence.org/stage1", HASH_1, "CODE_REPOSITORY", "Stage 1 Code")
    p2 = contract.register_deliverable_proof(cid, 1, "https://evidence.org/stage2", HASH_2, "TELEMETRY_LOG", "Stage 2 Telemetry")
    
    # Mock stage 1: PASS
    direct_vm.mock_web(r"evidence\.org/stage1", {"status": 200, "body": "Performance benchmarks passed with 22ms latency."})
    direct_vm.mock_llm(r".*", "{\"source_integrity\":\"PASS\",\"criteria\":[{\"index\":0,\"verdict\":\"PASS\",\"used_proof_ids\":[\"proof-1\"]},{\"index\":1,\"verdict\":\"PASS\",\"used_proof_ids\":[\"proof-1\"]}],\"summary\":\"All criteria satisfied\"}")
    
    outcome_1 = contract.adjudicate_milestone(cid, 0, [p1])
    assert outcome_1 == "SATISFIED"
    assert contract.is_covenant_satisfied(cid, 0) is True
    assert contract.is_covenant_satisfied(cid, 1) is False
