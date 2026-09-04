import hashlib
import pytest

CONTRACT = "contracts/DracoProof.py"
SAMPLE_BODY = "Artifact data"
SAMPLE_HASH = hashlib.sha256(SAMPLE_BODY.encode()).hexdigest()

def test_executor_dossier_and_composability_checks(direct_deploy, direct_vm):
    direct_vm.mock_web(r"evidence\.org", {"status": 200, "body": "Artifact data"})
    direct_vm.mock_llm(r".*", "{\"source_integrity\":\"PASS\",\"criteria\":[{\"index\":0,\"verdict\":\"PASS\",\"used_proof_ids\":[\"proof-1\"]}],\"summary\":\"Completed successfully\"}")
    
    contract = direct_deploy(CONTRACT)
    executor_address = "0x2222222222222222222222222222222222222222"
    cid = contract.create_covenant("Model Release", "Production deployment", executor_address, ["Milestone 1"])
    contract.set_milestone_criteria(cid, 0, ["Deploy container and verify health endpoint"])
    contract.freeze_covenant(cid)
    pid = contract.register_deliverable_proof(cid, 0, "https://evidence.org/release", SAMPLE_HASH, "DEPLOYMENT_ENDPOINT", "Endpoint")
    
    assert contract.is_covenant_satisfied(cid, 0) is False
    
    outcome = contract.adjudicate_milestone(cid, 0, [pid])
    assert outcome == "SATISFIED"
    
    assert contract.is_covenant_satisfied(cid, 0) is True
    
    dossier = contract.get_executor_dossier(executor_address)
    assert dossier.total_covenants == 1
    assert dossier.satisfied_milestones == 1
    assert dossier.breached_milestones == 0
