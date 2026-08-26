from ai.explanation_service import AIExplanationService
from ai.models import (
    ExplanationRequest,
    ExplanationResponse,
    ProgramSummaryRequest,
    ProgramSummaryResponse,
)

class ExplanationServiceWrapper:
    """Service wrapper layer exposing explanation operations to FastAPI routes."""

    def __init__(self):
        self.engine = AIExplanationService()

    def explain_step(self, request: ExplanationRequest) -> ExplanationResponse:
        return self.engine.generate_step_explanation(request)

    def explain_program(self, request: ProgramSummaryRequest) -> ProgramSummaryResponse:
        return self.engine.generate_program_summary(request)

explanation_service_instance = ExplanationServiceWrapper()
