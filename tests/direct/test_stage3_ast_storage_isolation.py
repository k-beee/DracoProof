import ast
from pathlib import Path

CONTRACT = "contracts/DracoProof.py"

def test_nondeterministic_closures_are_storage_free():
    contract_tree = ast.parse(Path(CONTRACT).read_text(encoding="utf-8"))
    adjudicate_func = next(
        node for node in ast.walk(contract_tree)
        if isinstance(node, ast.FunctionDef) and node.name == "adjudicate_milestone"
    )
    closures = {
        node.name: {
            child.id for child in ast.walk(node)
            if isinstance(child, ast.Name) and isinstance(child.ctx, ast.Load)
        }
        for node in adjudicate_func.body
        if isinstance(node, ast.FunctionDef) and node.name in {"evaluate", "validator_fn"}
    }
    assert set(closures.keys()) == {"evaluate", "validator_fn"}
    forbidden_storage_names = {"self", "covenants", "milestones", "proofs", "covenant", "milestone"}
    for closure_name, captured in closures.items():
        intersection = captured.intersection(forbidden_storage_names)
        assert len(intersection) == 0, f"Closure {closure_name} captured storage variables: {intersection}"
