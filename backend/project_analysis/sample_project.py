from typing import List
from project_analysis.models import ProjectFileInput

def get_sample_project_files() -> List[ProjectFileInput]:
    return [
        ProjectFileInput(
            path="backend/main.py",
            content="""from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(title="CodeScape AI API", version="1.0.0")
app.include_router(router)

@app.get("/health")
async def health():
    return {"status": "healthy"}
"""
        ),
        ProjectFileInput(
            path="backend/api/routes.py",
            content="""from fastapi import APIRouter, HTTPException
from services.explanation_service import ExplanationService

router = APIRouter(prefix="/api")
explanation_service = ExplanationService()

@router.post("/explain")
async def explain_step(request: dict):
    return explanation_service.explain_step(request)

@router.post("/explain-program")
async def explain_program(request: dict):
    return explanation_service.explain_program(request)
"""
        ),
        ProjectFileInput(
            path="backend/services/explanation_service.py",
            content="""from ai.providers.mock_provider import MockAIProvider

class ExplanationService:
    def __init__(self):
        self.provider = MockAIProvider()

    def explain_step(self, request):
        return self.provider.explain_step(request)

    def explain_program(self, request):
        return self.provider.explain_program(request)
"""
        ),
        ProjectFileInput(
            path="backend/ai/providers/mock_provider.py",
            content="""class MockAIProvider:
    def explain_step(self, request):
        return {"title": "Step Explanation", "what_happened": "Assigned variable x."}

    def explain_program(self, request):
        return {"purpose": "Demonstrates calculation and visualization."}
"""
        ),
        ProjectFileInput(
            path="frontend/src/App.tsx",
            content="""import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
"""
        ),
        ProjectFileInput(
            path="frontend/src/pages/HomePage.tsx",
            content="""import { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import { explainStep } from '../services/api';

export default function HomePage() {
  const [code, setCode] = useState("x = 10");
  const handleExplain = async () => {
    await explainStep({ code });
  };
  return (
    <div className="home-page">
      <CodeEditor value={code} onChange={setCode} />
      <button onClick={handleExplain}>Explain</button>
    </div>
  );
}
"""
        ),
        ProjectFileInput(
            path="frontend/src/components/CodeEditor.tsx",
            content="""import React from 'react';

export default function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea className="code-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  );
}
"""
        ),
        ProjectFileInput(
            path="frontend/src/services/api.ts",
            content="""const API_BASE = '/api';

export async function explainStep(payload: any) {
  const res = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
"""
        ),
        ProjectFileInput(
            path="package.json",
            content="""{
  "name": "codescape-ai",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0"
  }
}
"""
        ),
        ProjectFileInput(
            path="backend/requirements.txt",
            content="""fastapi
uvicorn[standard]
pydantic
"""
        )
    ]
