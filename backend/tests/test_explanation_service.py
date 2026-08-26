import pytest
from ai.models import (
    ExplanationRequest,
    ExplanationLevel,
    ProgramSummaryRequest,
)
from ai.explanation_service import AIExplanationService

@pytest.fixture
def sample_trace():
    return {
        "language": "python",
        "total_steps": 5,
        "status": "completed",
        "steps": [
            {
                "id": "step-0001",
                "step_index": 1,
                "line_start": 1,
                "line_end": 1,
                "action": "assign",
                "variable": "x",
                "value": 5,
                "state": {"x": {"value": 5, "type": "int"}},
                "description": "Assign 5 to variable x",
            },
            {
                "id": "step-0002",
                "step_index": 2,
                "line_start": 2,
                "line_end": 2,
                "action": "assign",
                "variable": "y",
                "value": 10,
                "state": {"x": {"value": 5, "type": "int"}, "y": {"value": 10, "type": "int"}},
                "description": "Assign 10 to variable y",
            },
            {
                "id": "step-0003",
                "step_index": 3,
                "line_start": 3,
                "line_end": 3,
                "action": "assign",
                "variable": "z",
                "value": 15,
                "state": {"x": {"value": 5, "type": "int"}, "y": {"value": 10, "type": "int"}, "z": {"value": 15, "type": "int"}},
                "description": "Calculate x + y = 15 and assign to z",
            },
            {
                "id": "step-0004",
                "step_index": 4,
                "line_start": 4,
                "line_end": 4,
                "action": "evaluate_condition",
                "expression": "z > 10",
                "result": True,
                "state": {"x": {"value": 5, "type": "int"}, "y": {"value": 10, "type": "int"}, "z": {"value": 15, "type": "int"}},
                "description": "Condition 'z > 10' evaluated to True",
            },
            {
                "id": "step-0005",
                "step_index": 5,
                "line_start": 5,
                "line_end": 5,
                "action": "output",
                "value": "15",
                "state": {"x": {"value": 5, "type": "int"}, "y": {"value": 10, "type": "int"}, "z": {"value": 15, "type": "int"}},
                "description": "Output: 15",
            },
        ],
        "final_state": {"x": {"value": 5, "type": "int"}, "y": {"value": 10, "type": "int"}, "z": {"value": 15, "type": "int"}},
        "output": ["15"],
    }

def test_explain_assignment_levels(sample_trace):
    service = AIExplanationService()
    code = "x = 5\ny = 10\nz = x + y"

    # Beginner level
    req_beg = ExplanationRequest(
        language="python",
        code=code,
        execution_trace=sample_trace,
        current_step_index=1,
        explanation_level=ExplanationLevel.BEGINNER,
    )
    res_beg = service.generate_step_explanation(req_beg)
    assert res_beg.step_index == 1
    assert "x" in res_beg.what_happened.lower()
    assert res_beg.explanation_level == ExplanationLevel.BEGINNER

    # Intermediate level
    req_int = ExplanationRequest(
        language="python",
        code=code,
        execution_trace=sample_trace,
        current_step_index=1,
        explanation_level=ExplanationLevel.INTERMEDIATE,
    )
    res_int = service.generate_step_explanation(req_int)
    assert "variable" in res_int.what_happened.lower()

    # Detailed level
    req_det = ExplanationRequest(
        language="python",
        code=code,
        execution_trace=sample_trace,
        current_step_index=1,
        explanation_level=ExplanationLevel.DETAILED,
    )
    res_det = service.generate_step_explanation(req_det)
    assert "memory" in res_det.what_happened.lower() or "stack" in res_det.why.lower()

def test_explain_calculation_values(sample_trace):
    service = AIExplanationService()
    code = "x = 5\ny = 10\nz = x + y"

    req = ExplanationRequest(
        language="python",
        code=code,
        execution_trace=sample_trace,
        current_step_index=3,
        explanation_level=ExplanationLevel.INTERMEDIATE,
    )
    res = service.generate_step_explanation(req)

    assert res.step_index == 3
    assert "x" in res.why
    assert "y" in res.why
    assert "5" in res.why
    assert "10" in res.why
    assert "Arithmetic Operators" in res.concepts

def test_explain_condition_evaluation(sample_trace):
    service = AIExplanationService()
    code = "if z > 10:\n    pass"

    req = ExplanationRequest(
        language="python",
        code=code,
        execution_trace=sample_trace,
        current_step_index=4,
        explanation_level=ExplanationLevel.INTERMEDIATE,
    )
    res = service.generate_step_explanation(req)

    assert res.step_index == 4
    assert "z > 10" in res.title
    assert "true" in res.why.lower() or "boolean" in res.why.lower()

def test_program_summary(sample_trace):
    service = AIExplanationService()
    code = "x = 5\ny = 10\nz = x + y\nprint(z)"

    req = ProgramSummaryRequest(
        language="python",
        code=code,
        execution_trace=sample_trace,
    )
    res = service.generate_program_summary(req)

    assert res.purpose is not None
    assert len(res.how_it_works) > 0
    assert "x" in res.final_variables
    assert res.final_variables["z"] == 15
    assert "15" in res.output

def test_invalid_step_index(sample_trace):
    service = AIExplanationService()
    req = ExplanationRequest(
        language="python",
        code="x = 5",
        execution_trace=sample_trace,
        current_step_index=99,  # Out of bounds
        explanation_level=ExplanationLevel.BEGINNER,
    )
    with pytest.raises(ValueError, match="Invalid step index"):
        service.generate_step_explanation(req)

def test_empty_execution_trace():
    service = AIExplanationService()
    req = ExplanationRequest(
        language="python",
        code="x = 5",
        execution_trace={"steps": []},
        current_step_index=1,
        explanation_level=ExplanationLevel.BEGINNER,
    )
    with pytest.raises(ValueError, match="no steps"):
        service.generate_step_explanation(req)
