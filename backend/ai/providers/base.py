from abc import ABC, abstractmethod
from typing import Dict, Any
from ai.models import ExplanationResponse, ProgramSummaryResponse, ExplanationLevel

class BaseAIProvider(ABC):
    """Abstract base class for all AI explanation providers (Mock, OpenAI, Ollama, Gemini, etc.)."""

    @abstractmethod
    def explain_step(
        self,
        language: str,
        code: str,
        step: Dict[str, Any],
        step_index: int,
        total_steps: int,
        level: ExplanationLevel,
    ) -> ExplanationResponse:
        """Generate a structured step-by-step explanation."""
        pass

    @abstractmethod
    def explain_program(
        self,
        language: str,
        code: str,
        execution_trace: Dict[str, Any],
    ) -> ProgramSummaryResponse:
        """Generate a high-level summary explanation for the entire program."""
        pass
