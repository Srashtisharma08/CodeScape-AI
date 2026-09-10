import os
import re
from typing import List, Dict, Tuple
from project_analysis.models import DependencyEdge, APIEndpoint, ProjectFile

class DependencyAnalyzer:
    def analyze(self, files: List[ProjectFile]) -> Tuple[List[DependencyEdge], List[APIEndpoint]]:
        edges: List[DependencyEdge] = []
        endpoints: List[APIEndpoint] = []
        path_map = {f.path: f for f in files}
        file_paths = list(path_map.keys())

        # 1. Extract API Endpoints from backend files
        for f in files:
            if not f.content:
                continue
            ext = f.extension.lower()
            if ext == '.py':
                # FastAPI / Flask routes
                pattern = r'@(?:router|app)\.(get|post|put|delete|patch)\(\s*["\']([^"\']+)["\']'
                matches = re.finditer(pattern, f.content, re.IGNORECASE)
                for m in matches:
                    method = m.group(1).upper()
                    route_path = m.group(2)
                    endpoints.append(APIEndpoint(
                        path=route_path,
                        method=method,
                        defined_in=f.path,
                        handled_by=f.name,
                        purpose=f"Handles {method} requests for {route_path}"
                    ))

        # 2. Resolve Import Dependencies
        for f in files:
            if not f.content:
                continue
            dir_name = os.path.dirname(f.path)

            for imp in f.imports:
                target_path = None
                is_ext = False

                # Check Python imports
                if f.extension == '.py':
                    parts = imp.split('.')
                    potential_relative = os.path.normpath(os.path.join(dir_name, *parts) + '.py').replace('\\', '/')
                    potential_root = os.path.normpath(os.path.join(*parts) + '.py').replace('\\', '/')
                    potential_dir = os.path.normpath(os.path.join(*parts, '__init__.py')).replace('\\', '/')

                    if potential_relative in path_map:
                        target_path = potential_relative
                    elif potential_root in path_map:
                        target_path = potential_root
                    elif potential_dir in path_map:
                        target_path = potential_dir
                    else:
                        for p in file_paths:
                            if p.endswith('/' + parts[-1] + '.py') or p == parts[-1] + '.py':
                                target_path = p
                                break
                    if not target_path:
                        is_ext = True
                        target_path = f"external/{imp}"

                # Check JS/TS imports
                elif f.extension in ('.js', '.ts', '.jsx', '.tsx'):
                    if imp.startswith('.'):
                        rel = os.path.normpath(os.path.join(dir_name, imp)).replace('\\', '/')
                        for ext in ('', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'):
                            cand = rel + ext
                            if cand in path_map:
                                target_path = cand
                                break
                    if not target_path:
                        is_ext = True
                        target_path = f"external/{imp}"

                if target_path:
                    edges.append(DependencyEdge(
                        source_file=f.path,
                        target_file=target_path,
                        relationship_type="IMPORTS",
                        symbol=imp,
                        is_confirmed=not is_ext
                    ))

        # 3. Detect Frontend -> Backend HTTP requests
        for f in files:
            if not f.content or f.extension not in ('.js', '.ts', '.jsx', '.tsx'):
                continue

            fetch_pattern = r'(?:fetch|axios\.(?:get|post|put|delete))\(\s*[`"\']([^`"\']*(?:/api/[^`"\']*))[`"\']'
            matches = re.finditer(fetch_pattern, f.content)
            for m in matches:
                req_path = m.group(1)
                # Normalize template literals if any
                clean_req = re.sub(r'\$\{[^}]+\}', '', req_path)
                matched_endpoint = None
                for ep in endpoints:
                    if ep.path in req_path or clean_req.startswith(ep.path):
                        matched_endpoint = ep
                        break

                if matched_endpoint:
                    edges.append(DependencyEdge(
                        source_file=f.path,
                        target_file=matched_endpoint.defined_in,
                        relationship_type="REQUESTS",
                        symbol=f"{matched_endpoint.method} {matched_endpoint.path}",
                        is_confirmed=True
                    ))
                else:
                    edges.append(DependencyEdge(
                        source_file=f.path,
                        target_file="backend/api",
                        relationship_type="REQUESTS",
                        symbol=f"HTTP {clean_req}",
                        is_confirmed=False
                    ))

        return edges, endpoints
