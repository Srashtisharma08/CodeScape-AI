from execution.models import ExecuteRequest, ExecuteResponse, ExecutionTrace
from execution.python_executor import PythonExecutionEngine

class ExecutionService:
    def __init__(self):
        pass

    def execute_code(self, request: ExecuteRequest) -> ExecuteResponse:
        lang = request.language.lower()
        if lang != "python":
            raise ValueError(f"Execution is currently only supported for Python. Got: {request.language}")

        engine = PythonExecutionEngine()
        trace = engine.execute(request.code)
        return ExecuteResponse(trace=trace)

execution_service = ExecutionService()
