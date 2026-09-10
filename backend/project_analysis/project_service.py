from typing import List
from project_analysis.models import (
    ProjectAnalysisRequest, ProjectAnalysisResponse
)
from project_analysis.project_scanner import ProjectScanner
from project_analysis.file_classifier import FileClassifier
from project_analysis.dependency_analyzer import DependencyAnalyzer
from project_analysis.architecture_analyzer import ArchitectureAnalyzer

class ProjectService:
    def __init__(self):
        self.scanner = ProjectScanner()
        self.classifier = FileClassifier()
        self.dependency_analyzer = DependencyAnalyzer()
        self.architecture_analyzer = ArchitectureAnalyzer()

    def analyze_project(self, request: ProjectAnalysisRequest) -> ProjectAnalysisResponse:
        # 1. Scan and validate
        scanner = ProjectScanner(max_files=request.max_files, max_file_size_kb=request.max_file_size_kb)
        valid_files, errors = scanner.scan(request.files)
        if errors:
            raise ValueError("; ".join(errors))

        # 2. Classify each file
        classified_files = [self.classifier.classify(f) for f in valid_files]

        # 3. Analyze dependencies and API routes
        dependencies, endpoints = self.dependency_analyzer.analyze(classified_files)

        # 4. Analyze architecture, layers, graph, and walkthrough
        graph, layers, walkthrough, summary = self.architecture_analyzer.analyze(
            classified_files, dependencies, endpoints
        )

        entry_points = [f.path for f in classified_files if f.is_entry_point]

        return ProjectAnalysisResponse(
            project_name=request.project_name,
            project_summary=summary,
            files=classified_files,
            dependencies=dependencies,
            entry_points=entry_points,
            api_endpoints=endpoints,
            project_graph=graph,
            architecture_layers=layers,
            architecture_walkthrough=walkthrough
        )

project_service_instance = ProjectService()
