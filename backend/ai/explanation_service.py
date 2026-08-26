from typing import Dict, Any, Optional
from ai.models import (
    ExplanationRequest,
    ExplanationResponse,
    ProgramSummaryRequest,
    ProgramSummaryResponse,
)
from ai.providers.base import BaseAIProvider
from ai.providers.mock_provider import MockAIProvider

class AIExplanationService:
    """Core AI Explanation Service managing providers and context extraction."""

    def __init__(self, provider: Optional[BaseAIProvider] = None):
        self.provider = provider or MockAIProvider()

    def generate_step_explanation(self, request: ExplanationRequest) -> ExplanationResponse:
        trace = request.execution_trace or {}
        steps = trace.get("steps", [])

        if not steps:
            raise ValueError("Execution trace contains no steps to explain")

        idx = request.current_step_index
        if idx < 1 or idx > len(steps):
            raise ValueError(f"Invalid step index {idx}. Execution trace has {len(steps)} steps.")

        target_step = steps[idx - 1]

        return self.provider.explain_step(
            language=request.language,
            code=request.code,
            step=target_step,
            step_index=idx,
            total_steps=len(steps),
            level=request.explanation_level,
        )

    def generate_program_summary(self, request: ProgramSummaryRequest) -> ProgramSummaryResponse:
        return self.provider.explain_program(
            language=request.language,
            code=request.code,
            execution_trace=request.execution_trace or {},
        )
