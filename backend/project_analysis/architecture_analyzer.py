from typing import List, Dict, Tuple
from project_analysis.models import (
    ProjectFile, DependencyEdge, APIEndpoint, ProjectGraph,
    ProjectNode, ProjectEdge, ArchitectureLayer, ArchitectureStep,
    FileCategory
)

class ArchitectureAnalyzer:
    def analyze(
        self,
        files: List[ProjectFile],
        dependencies: List[DependencyEdge],
        endpoints: List[APIEndpoint]
    ) -> Tuple[ProjectGraph, List[ArchitectureLayer], List[ArchitectureStep], str]:

        # 1. Identify Layers
        frontend_files = [f.path for f in files if f.category in (FileCategory.FRONTEND_ROOT, FileCategory.COMPONENT, FileCategory.API_CLIENT, FileCategory.STYLE)]
        api_files = [f.path for f in files if f.category == FileCategory.API_ROUTE]
        service_files = [f.path for f in files if f.category == FileCategory.SERVICE]
        model_files = [f.path for f in files if f.category == FileCategory.MODEL]
        config_files = [f.path for f in files if f.category in (FileCategory.CONFIG, FileCategory.TEST)]

        layers: List[ArchitectureLayer] = []
        if frontend_files:
            layers.append(ArchitectureLayer(
                name="Frontend Layer",
                description="Client-side React user interface, components, and API communication services.",
                files=frontend_files
            ))
        if api_files:
            layers.append(ArchitectureLayer(
                name="API Routing Layer",
                description="RESTful API route controllers exposing server endpoints.",
                files=api_files
            ))
        if service_files:
            layers.append(ArchitectureLayer(
                name="Business Logic & Services",
                description="Core domain execution, simulation, and analysis algorithms.",
                files=service_files
            ))
        if model_files:
            layers.append(ArchitectureLayer(
                name="Data & Models Layer",
                description="Structured schemas, DTOs, and domain models.",
                files=model_files
            ))
        if config_files:
            layers.append(ArchitectureLayer(
                name="Configuration & Infrastructure",
                description="Package manifests, environment configs, and tests.",
                files=config_files
            ))

        # 2. Build 2D Graph Nodes with layered layout
        nodes: List[ProjectNode] = []
        edges: List[ProjectEdge] = []

        # Layer Y positions: Frontend (100) -> API Client (240) -> Backend Routes (380) -> Services (520) -> Models/Config (660)
        layer_indices = {
            FileCategory.FRONTEND_ROOT: (100, 0),
            FileCategory.COMPONENT: (100, 1),
            FileCategory.STYLE: (100, 2),
            FileCategory.API_CLIENT: (240, 0),
            FileCategory.ENTRY_POINT: (380, 0),
            FileCategory.API_ROUTE: (380, 1),
            FileCategory.SERVICE: (520, 0),
            FileCategory.MODEL: (660, 0),
            FileCategory.CONFIG: (660, 1),
            FileCategory.TEST: (660, 2),
            FileCategory.UNKNOWN: (520, 1)
        }

        # Position nodes neatly per layer
        slots: Dict[int, int] = {}
        for f in files:
            base_y, prio = layer_indices.get(f.category, (500, 0))
            slot_count = slots.get(base_y, 0)
            slots[base_y] = slot_count + 1

        slot_tracker: Dict[int, int] = {}
        for f in files:
            base_y, _ = layer_indices.get(f.category, (500, 0))
            idx = slot_tracker.get(base_y, 0)
            total = slots[base_y]
            # Center horizontally across 1000px canvas
            spacing = 900 / max(total, 1)
            x = 80 + idx * spacing + (spacing / 2)
            y = base_y
            slot_tracker[base_y] = idx + 1

            nodes.append(ProjectNode(
                id=f.path,
                file_path=f.path,
                label=f.name,
                category=f.category,
                is_entry_point=f.is_entry_point,
                x=round(x, 1),
                y=round(y, 1)
            ))

        # Build Graph Edges (excluding purely external non-file edges for clarity)
        file_path_set = {f.path for f in files}
        for d in dependencies:
            if d.target_file in file_path_set:
                edges.append(ProjectEdge(
                    source=d.source_file,
                    target=d.target_file,
                    relationship_type=d.relationship_type,
                    label=d.symbol or d.relationship_type,
                    is_confirmed=d.is_confirmed
                ))

        # 3. Generate Architecture Walkthrough Flow
        walkthrough: List[ArchitectureStep] = []
        step_counter = 1

        # Step 1: Server startup
        backend_entries = [f for f in files if f.category == FileCategory.ENTRY_POINT]
        if backend_entries:
            b_entry = backend_entries[0]
            walkthrough.append(ArchitectureStep(
                step_index=step_counter,
                title="1. Backend Server Initialization",
                description=f"Application execution begins at {b_entry.name}. The framework configures middleware, registers route controllers, and opens network listeners.",
                highlighted_files=[b_entry.path],
                highlighted_edges=[]
            ))
            step_counter += 1

        # Step 2: Route registration
        if api_files and backend_entries:
            walkthrough.append(ArchitectureStep(
                step_index=step_counter,
                title="2. REST API Route Registration",
                description=f"{backend_entries[0].name} registers the API router defined in {api_files[0]}. Incoming HTTP requests are mapped to endpoint handler functions.",
                highlighted_files=[backend_entries[0].path, api_files[0]],
                highlighted_edges=[[backend_entries[0].path, api_files[0]]] if [backend_entries[0].path, api_files[0]] in [[e.source, e.target] for e in edges] else []
            ))
            step_counter += 1

        # Step 3: Frontend Mounting
        fe_roots = [f for f in files if f.category == FileCategory.FRONTEND_ROOT]
        if fe_roots:
            f_root = fe_roots[0]
            walkthrough.append(ArchitectureStep(
                step_index=step_counter,
                title="3. Frontend Application Mount",
                description=f"In the browser, {f_root.name} renders the root view, initializes application state, and mounts user interface child components.",
                highlighted_files=[f_root.path],
                highlighted_edges=[]
            ))
            step_counter += 1

        # Step 4: User Action & API Client Request
        api_clients = [f for f in files if f.category == FileCategory.API_CLIENT]
        if api_clients and api_files:
            client = api_clients[0]
            route = api_files[0]
            walkthrough.append(ArchitectureStep(
                step_index=step_counter,
                title="4. User Action & HTTP Request Dispatch",
                description=f"A user triggers an action in the UI. {client.name} formats the payload and issues an asynchronous HTTP request across the network.",
                highlighted_files=[client.path, route],
                highlighted_edges=[[client.path, route]]
            ))
            step_counter += 1

        # Step 5: Service Execution
        if service_files and api_files:
            srv = service_files[0]
            route = api_files[0]
            walkthrough.append(ArchitectureStep(
                step_index=step_counter,
                title="5. Business Logic & Service Execution",
                description=f"{route} delegates work to {srv}. The service executes the domain processing and generates the structured result.",
                highlighted_files=[route, srv],
                highlighted_edges=[[route, srv]]
            ))
            step_counter += 1

        # Step 6: Response & UI Update
        if frontend_files:
            first_fe_path = fe_roots[0].path if fe_roots else frontend_files[0]
            walkthrough.append(ArchitectureStep(
                step_index=step_counter,
                title="6. HTTP Response & State Synchronization",
                description="The server returns JSON data back to the client. The frontend updates local state and re-renders the visual components.",
                highlighted_files=[first_fe_path],
                highlighted_edges=[]
            ))

        # 4. Generate High-Level Summary
        has_fe = bool(frontend_files)
        has_be = bool(backend_entries or api_files or service_files)
        tech_list = []
        if any(f.name.endswith('.tsx') or f.name.endswith('.jsx') for f in files):
            tech_list.append("React")
        if any(f.name.endswith('.py') for f in files):
            tech_list.append("FastAPI/Python")

        tech_desc = " and ".join(tech_list) if tech_list else "multi-language"
        arch_type = "full-stack application" if (has_fe and has_be) else ("frontend application" if has_fe else "backend service")

        summary = (
            f"This project is a {arch_type} built using {tech_desc}. "
            f"It comprises {len(files)} source files partitioned across {len(layers)} architectural layers. "
            f"The architecture maintains clean separation of concerns with dedicated components for "
            f"{', '.join([l.name for l in layers])}."
        )

        return ProjectGraph(nodes=nodes, edges=edges), layers, walkthrough, summary
