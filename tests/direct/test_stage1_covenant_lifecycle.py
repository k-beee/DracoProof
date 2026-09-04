import pytest

CONTRACT = "contracts/DracoProof.py"

def create_sample_covenant(contract, title="AI Security Audit", scope="Full audit of protocol smart contracts", executor="0x1111111111111111111111111111111111111111", milestones=None):
    if milestones is None:
        milestones = ["Milestone 1: Static Analysis", "Milestone 2: Fuzz Testing Report"]
    return contract.create_covenant(title, scope, executor, milestones)

def test_valid_covenant_creation_and_attributes(direct_deploy, direct_owner):
    contract = direct_deploy(CONTRACT)
    covenant_id = create_sample_covenant(contract)
    assert covenant_id == "covenant-1"
    
    cov = contract.get_covenant(covenant_id)
    assert cov.title == "AI Security Audit"
    assert cov.scope == "Full audit of protocol smart contracts"
    assert cov.designated_executor == "0x1111111111111111111111111111111111111111"
    assert cov.milestone_count == 2
    assert cov.is_frozen is False
    assert contract.get_covenant_count() == 1
    assert contract.get_creator_covenant_count(cov.creator) == 1

def test_milestone_criteria_configuration_and_freezing(direct_deploy):
    contract = direct_deploy(CONTRACT)
    covenant_id = create_sample_covenant(contract)
    
    contract.set_milestone_criteria(covenant_id, 0, ["Zero critical vulnerabilities", "Automated scan output published"])
    contract.set_milestone_criteria(covenant_id, 1, ["10,000 fuzz runs completed", "PoC exploits documented"])
    
    m0 = contract.get_milestone(covenant_id, 0)
    assert m0.criterion_count == 2
    assert contract.get_milestone_criterion(covenant_id, 0, 0) == "Zero critical vulnerabilities"
    assert contract.get_milestone_criterion(covenant_id, 0, 1) == "Automated scan output published"
    
    contract.freeze_covenant(covenant_id)
    cov = contract.get_covenant(covenant_id)
    assert cov.is_frozen is True

def test_cannot_freeze_with_empty_criteria(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT)
    covenant_id = create_sample_covenant(contract)
    contract.set_milestone_criteria(covenant_id, 0, ["Criteria 1"])
    with direct_vm.expect_revert("All milestones must have criteria configured before freezing"):
        contract.freeze_covenant(covenant_id)

def test_frozen_covenant_cannot_be_modified(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT)
    covenant_id = create_sample_covenant(contract)
    contract.set_milestone_criteria(covenant_id, 0, ["Criteria 1"])
    contract.set_milestone_criteria(covenant_id, 1, ["Criteria 2"])
    contract.freeze_covenant(covenant_id)
    
    with direct_vm.expect_revert("Frozen covenant cannot be modified"):
        contract.set_milestone_criteria(covenant_id, 0, ["New Criteria"])
        
    with direct_vm.expect_revert("Covenant is already frozen"):
        contract.freeze_covenant(covenant_id)

def test_non_creator_cannot_modify_or_freeze(direct_deploy, direct_vm, direct_bob):
    contract = direct_deploy(CONTRACT)
    covenant_id = create_sample_covenant(contract)
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("Only the covenant creator may perform this action"):
            contract.set_milestone_criteria(covenant_id, 0, ["Malicious Criteria"])
        with direct_vm.expect_revert("Only the covenant creator may perform this action"):
            contract.freeze_covenant(covenant_id)
