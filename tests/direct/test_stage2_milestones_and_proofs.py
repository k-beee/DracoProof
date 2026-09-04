import pytest

CONTRACT = "contracts/DracoProof.py"
SAMPLE_HASH = "a" * 64

def setup_frozen_covenant(contract):
    cid = contract.create_covenant("Model Audit", "Scope details", "0x1111111111111111111111111111111111111111", ["Milestone 1"])
    contract.set_milestone_criteria(cid, 0, ["Accuracy >= 95% on benchmark dataset"])
    contract.freeze_covenant(cid)
    return cid

def test_valid_proof_registration(direct_deploy, direct_owner):
    contract = direct_deploy(CONTRACT)
    cid = setup_frozen_covenant(contract)
    
    proof_id = contract.register_deliverable_proof(
        cid, 0, "https://github.com/org/repo/commit/12345", SAMPLE_HASH, "CODE_REPOSITORY", "Benchmark evaluation script"
    )
    assert proof_id == "proof-1"
    assert contract.get_proof_count() == 1
    
    proof = contract.get_proof(proof_id)
    assert proof.covenant_id == cid
    assert proof.milestone_index == 0
    assert proof.source_url == "https://github.com/org/repo/commit/12345"
    assert proof.provenance_hash == SAMPLE_HASH
    assert proof.category == "CODE_REPOSITORY"
    assert proof.label == "Benchmark evaluation script"

def test_duplicate_proof_url_reverts(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT)
    cid = setup_frozen_covenant(contract)
    
    contract.register_deliverable_proof(cid, 0, "https://github.com/org/repo/commit/12345", SAMPLE_HASH, "CODE_REPOSITORY", "Proof 1")
    with direct_vm.expect_revert("Duplicate deliverable source URL for milestone"):
        contract.register_deliverable_proof(cid, 0, "https://github.com/org/repo/commit/12345", SAMPLE_HASH, "CODE_REPOSITORY", "Duplicate Proof")

def test_invalid_url_and_hash_reverts(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT)
    cid = setup_frozen_covenant(contract)
    
    with direct_vm.expect_revert("Deliverable source must use HTTP or HTTPS protocol"):
        contract.register_deliverable_proof(cid, 0, "ftp://invalid-url.com", SAMPLE_HASH, "CODE_REPOSITORY", "Invalid protocol")
        
    with direct_vm.expect_revert("Provenance hash must be empty or 64 lowercase hexadecimal characters"):
        contract.register_deliverable_proof(cid, 0, "https://valid.com", "not-hex-64", "CODE_REPOSITORY", "Invalid hash")
