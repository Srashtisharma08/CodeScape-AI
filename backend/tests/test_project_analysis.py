import pytest
from project_analysis.models import (
    ProjectFileInput, ProjectAnalysisRequest, FileCategory
)
from project_analysis.project_scanner import ProjectScanner
from project_analysis.file_classifier import FileClassifier
from project_analysis.dependency_analyzer import DependencyAnalyzer
from project_analysis.architecture_analyzer import ArchitectureAnalyzer
from project_analysis.project_service import project_service_instance
from project_analysis.sample_project import get_sample_project_files

def test_file_classification():
    classifier = FileClassifier()

    f_main = ProjectFileInput(path="backend/main.py", content="from fastapi import FastAPI\napp = FastAPI()")
    cf_main = classifier.classify(f_main)
    assert cf_main.category == FileCategory.ENTRY_POINT
    assert cf_main.is_entry_point is True

    f_routes = ProjectFileInput(path="backend/api/routes.py", content="from fastapi import APIRouter\nrouter = APIRouter()")
    cf_routes = classifier.classify(f_routes)
    assert cf_routes.category == FileCategory.API_ROUTE

    f_service = ProjectFileInput(path="backend/services/user_service.py", content="class UserService:\n    def get_user(self): pass")
    cf_service = classifier.classify(f_service)
    assert cf_service.category == FileCategory.SERVICE

    f_app = ProjectFileInput(path="frontend/src/App.tsx", content="import { BrowserRouter } from 'react-router-dom';\nexport default function App() { return <BrowserRouter></BrowserRouter>; }")
    cf_app = classifier.classify(f_app)
    assert cf_app.category == FileCategory.FRONTEND_ROOT
    assert cf_app.is_entry_point is True

    f_comp = ProjectFileInput(path="frontend/src/components/CodeEditor.tsx", content="export default function CodeEditor() { return <div>Editor</div>; }")
    cf_comp = classifier.classify(f_comp)
    assert cf_comp.category == FileCategory.COMPONENT

    f_api = ProjectFileInput(path="frontend/src/services/api.ts", content="export async function getData() { return fetch('/api/data'); }")
    cf_api = classifier.classify(f_api)
    assert cf_api.category == FileCategory.API_CLIENT

    f_pkg = ProjectFileInput(path="package.json", content='{"name": "test"}')
    cf_pkg = classifier.classify(f_pkg)
    assert cf_pkg.category == FileCategory.CONFIG

def test_dependency_analysis():
    classifier = FileClassifier()
    analyzer = DependencyAnalyzer()

    files = [
        classifier.classify(ProjectFileInput(
            path="backend/main.py",
            content="from api.routes import router\nfrom fastapi import FastAPI\napp = FastAPI()\napp.include_router(router)"
        )),
        classifier.classify(ProjectFileInput(
            path="backend/api/routes.py",
            content="from fastapi import APIRouter\nfrom services.user_service import UserService\nrouter = APIRouter()\n@router.post('/api/user')\ndef create(): pass"
        )),
        classifier.classify(ProjectFileInput(
            path="backend/services/user_service.py",
            content="class UserService: pass"
        )),
        classifier.classify(ProjectFileInput(
            path="frontend/src/services/api.ts",
            content="export async function createUser() { return fetch('/api/user', { method: 'POST' }); }"
        ))
    ]

    edges, endpoints = analyzer.analyze(files)

    assert len(endpoints) == 1
    assert endpoints[0].path == "/api/user"
    assert endpoints[0].method == "POST"

    # Verify frontend -> backend request detected
    request_edges = [e for e in edges if e.relationship_type == "REQUESTS"]
    assert len(request_edges) >= 1
    assert request_edges[0].source_file == "frontend/src/services/api.ts"
    assert request_edges[0].target_file == "backend/api/routes.py"
    assert request_edges[0].is_confirmed is True

def test_full_project_analysis():
    sample_files = get_sample_project_files()
    req = ProjectAnalysisRequest(project_name="CodeScape Demo", files=sample_files)
    res = project_service_instance.analyze_project(req)

    assert res.project_name == "CodeScape Demo"
    assert len(res.files) == len(sample_files)
    assert len(res.entry_points) >= 2
    assert len(res.architecture_layers) >= 3
    assert len(res.project_graph.nodes) == len(sample_files)
    assert len(res.project_graph.edges) > 0
    assert len(res.architecture_walkthrough) >= 3
    assert "full-stack" in res.project_summary.lower()

def test_error_handling():
    # Empty project
    with pytest.raises(ValueError) as exc:
        project_service_instance.analyze_project(ProjectAnalysisRequest(project_name="Empty", files=[]))
    assert "contains no files" in str(exc.value)

    # Exceeding file limits
    scanner = ProjectScanner(max_files=2)
    files = [
        ProjectFileInput(path="a.py", content="x=1"),
        ProjectFileInput(path="b.py", content="y=2"),
        ProjectFileInput(path="c.py", content="z=3"),
    ]
    valid, errors = scanner.scan(files)
    assert len(errors) > 0
    assert "exceeds maximum supported file count" in errors[0]

def test_circular_imports_not_crashing():
    classifier = FileClassifier()
    analyzer = DependencyAnalyzer()

    files = [
        classifier.classify(ProjectFileInput(path="a.py", content="import b")),
        classifier.classify(ProjectFileInput(path="b.py", content="import a"))
    ]
    edges, _ = analyzer.analyze(files)
    assert len(edges) == 2
