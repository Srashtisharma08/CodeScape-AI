import pytest
from execution.python_executor import PythonExecutionEngine
from services.execution_service import execution_service
from execution.models import ExecuteRequest

@pytest.fixture
def engine():
    return PythonExecutionEngine()

def test_variables(engine):
    code = """x = 5
y = 10
z = x + y
"""
    trace = engine.execute(code)
    assert trace.status == "completed"
    assert len(trace.steps) >= 3
    assert trace.final_state["x"].value == 5
    assert trace.final_state["y"].value == 10
    assert trace.final_state["z"].value == 15

def test_if_else(engine):
    code = """x = 10
if x > 5:
    y = 1
else:
    y = 2
"""
    trace = engine.execute(code)
    assert trace.status == "completed"
    assert trace.final_state["y"].value == 1
    actions = [s.action for s in trace.steps]
    assert "evaluate_condition" in actions
    assert "branch" in actions

def test_for_loop(engine):
    code = """total = 0
for i in range(5):
    total += i
"""
    trace = engine.execute(code)
    assert trace.status == "completed"
    assert trace.final_state["total"].value == 10
    loop_steps = [s for s in trace.steps if s.action == "loop_iteration"]
    assert len(loop_steps) == 5

def test_while_loop(engine):
    code = """x = 0
while x < 3:
    x += 1
"""
    trace = engine.execute(code)
    assert trace.status == "completed"
    assert trace.final_state["x"].value == 3

def test_function(engine):
    code = """def add(a, b):
    return a + b

result = add(2, 3)
"""
    trace = engine.execute(code)
    assert trace.status == "completed"
    assert trace.final_state["result"].value == 5
    actions = [s.action for s in trace.steps]
    assert "call_function" in actions
    assert "return_function" in actions

def test_output(engine):
    code = 'print("Hello")'
    trace = engine.execute(code)
    assert trace.status == "completed"
    assert "Hello" in trace.output

def test_runtime_error(engine):
    code = "x = 1 / 0"
    trace = engine.execute(code)
    assert trace.status == "error"
    assert "ZeroDivisionError" in trace.error_message

def test_factorial_example(engine):
    code = """def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

answer = factorial(5)
print(answer)
"""
    trace = engine.execute(code)
    assert trace.status == "completed"
    assert trace.final_state["answer"].value == 120
    assert "120" in trace.output

def test_execution_service_endpoint():
    req = ExecuteRequest(language="python", code="a = 10\nb = 20\nc = a + b")
    res = execution_service.execute_code(req)
    assert res.trace.status == "completed"
    assert res.trace.final_state["c"].value == 30
