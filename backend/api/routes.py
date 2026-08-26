from fastapi import APIRouter, HTTPException
from models.schemas import ParseRequest, ParseResponse, ErrorResponse
from services.parse_service import parse_service
from services.execution_service import execution_service
from services.explanation_service import explanation_service_instance
from execution.models import ExecuteRequest, ExecuteResponse
from ai.models import (
    ExplanationRequest,
    ExplanationResponse,
    ProgramSummaryRequest,
    ProgramSummaryResponse,
)
from parser.language_registry import registry
from utils.errors import UnsupportedLanguageError

router = APIRouter(prefix="/api")

@router.post("/parse", response_model=ParseResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def parse_code(request: ParseRequest):
    try:
        return parse_service.parse_code(request)
    except UnsupportedLanguageError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute", response_model=ExecuteResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def execute_code(request: ExecuteRequest):
    try:
        return execution_service.execute_code(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain", response_model=ExplanationResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def explain_step(request: ExplanationRequest):
    try:
        return explanation_service_instance.explain_step(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain-program", response_model=ProgramSummaryResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def explain_program(request: ProgramSummaryRequest):
    try:
        return explanation_service_instance.explain_program(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/languages")
async def get_languages():
    return {"languages": registry.supported_languages()}
