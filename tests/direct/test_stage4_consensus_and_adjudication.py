import pytest

CONTRACT = "contracts/DracoProof.py"
SAMPLE_HASH = "b" * 64

def setup_ready_milestone(contract):
    cid = contract.create_covenant("Audit Covenant", "Complete audit", "0x1111111111111111111111111111111111111111", ["Milestone 1"])
    contract.set_milestone_criteria(cid, 0, ["All static checks pass"])
    contract.freeze_covenant(cid)
    pid = contract.register_deliverable_proof(cid, 0, "https://evidence.org/report", SAMPLE_HASH, "AUDIT_REPORT", "Report")
    return cid, pid

def mock_payload(integrity="PASS", verdict="PASS", summary="Verified artifact against frozen criteria."):
    return (
        "{\"source_integrity\":\"" + integrity + "\","
        "\"criteria\":[{\"index\":0,\"verdict\":\"" + verdict + "\",\"used_proof_ids\":[\"proof-1\"]}],"
        "\"summary\":\"" + summary + "\"}"
    )

@pytest.mark.parametrize(
    ("integrity", "verdict", "expected_status"),
    [
        ("PASS", "PASS", "SATISFIED"),
        ("PASS", "FAIL", "BREACHED"),
        ("PASS", "UNKNOWN", "INSUFFICIENT_PROOF"),
        ("FAIL", "PASS", "INSUFFICIENT_PROOF"),
    ],
)
def test_adjudication_outcome_transitions(direct_deploy, direct_vm, integrity, verdict, expected_status):
    direct_vm.mock_web(r"evidence\.org", {"status": 200, "body": "Audit report contents: all checks verified."})
    direct_vm.mock_llm(r".*", mock_payload(integrity, verdict))
    
    contract = direct_deploy(CONTRACT)
    cid, pid = setup_ready_milestone(contract)
    
    outcome = contract.adjudicate_milestone(cid, 0, [pid])
    assert outcome == expected_status
    
    milestone = contract.get_milestone(cid, 0)
    assert milestone.status == expected_status
    
    verdict_obj = contract.get_milestone_verdict(cid, 0)
    assert verdict_obj.outcome == expected_status
    assert verdict_obj.source_integrity == integrity

def test_validator_equivalence_tolerates_prose_variations(direct_deploy, direct_vm):
    direct_vm.mock_web(r"evidence\.org", {"status": 200, "body": "Audit report content."})
    direct_vm.mock_llm(r".*", mock_payload(summary="Leader rationale A"))
    
    contract = direct_deploy(CONTRACT)
    cid, pid = setup_ready_milestone(contract)
    
    outcome = contract.adjudicate_milestone(cid, 0, [pid])
    assert outcome == "SATISFIED"
    
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"evidence\.org", {"status": 200, "body": "Audit report content."})
    direct_vm.mock_llm(r".*", mock_payload(summary="Validator rationale B (different words)"))
    assert direct_vm.run_validator() is True
