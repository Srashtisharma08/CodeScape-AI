import os
import re
from typing import List, Tuple
from project_analysis.models import FileCategory, ProjectFile, ProjectFileInput

class FileClassifier:
    def extract_imports_exports(self, path: str, content: str) -> Tuple[List[str], List[str]]:
        imports: List[str] = []
        exports: List[str] = []
        ext = os.path.splitext(path)[1].lower()

        if ext == '.py':
            for line in content.splitlines():
                line_str = line.strip()
                if line_str.startswith('import '):
                    match = re.match(r'import\s+([a-zA-Z0-9_\.,\s]+)', line_str)
                    if match:
                        for mod in match.group(1).split(','):
                            mod_name = mod.strip().split()[0]
                            if mod_name:
                                imports.append(mod_name)
                elif line_str.startswith('from '):
                    match = re.match(r'from\s+([a-zA-Z0-9_\.]+)\s+import', line_str)
                    if match:
                        imports.append(match.group(1).strip())
                elif line_str.startswith('def ') or line_str.startswith('async def '):
                    match = re.match(r'(?:async\s+)?def\s+([a-zA-Z0-9_]+)', line_str)
                    if match and not match.group(1).startswith('_'):
                        exports.append(match.group(1))
                elif line_str.startswith('class '):
                    match = re.match(r'class\s+([a-zA-Z0-9_]+)', line_str)
                    if match:
                        exports.append(match.group(1))

        elif ext in ('.js', '.ts', '.jsx', '.tsx'):
            for line in content.splitlines():
                line_str = line.strip()
                match = re.search(r"""import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)?\s*(?:from\s+)?[\'\"]([^\'\"]+)[\'\"]""", line_str)
                if match:
                    imports.append(match.group(1))
                elif line_str.startswith('export default '):
                    exp = line_str.replace('export default ', '').strip(';').split()[0]
                    if exp in ('function', 'class'):
                        parts = line_str.split()
                        if len(parts) >= 3:
                            exports.append(parts[2].split('(')[0])
                    else:
                        exports.append(exp)
                elif line_str.startswith('export '):
                    match_exp = re.search(r'export\s+(?:const|let|var|function|class|interface|type)\s+([a-zA-Z0-9_]+)', line_str)
                    if match_exp:
                        exports.append(match_exp.group(1))

        return list(dict.fromkeys(imports)), list(dict.fromkeys(exports))

    def classify(self, file_input: ProjectFileInput) -> ProjectFile:
        path = file_input.path
        content = file_input.content
        filename = os.path.basename(path)
        name, ext = os.path.splitext(filename)
        ext = ext.lower()
        imports, exports = self.extract_imports_exports(path, content)
        lines = content.splitlines()

        category = FileCategory.UNKNOWN
        is_entry = False
        summary = ''

        lower_path = path.lower()
        lower_name = filename.lower()

        # Configuration files
        if lower_name in ('package.json', 'requirements.txt', 'tsconfig.json', 'vite.config.ts', 'pyproject.toml', 'dockerfile', 'docker-compose.yml'):
            category = FileCategory.CONFIG
            summary = f'Project configuration and dependency specifications ({filename}).'

        # Tests
        elif 'test' in lower_path or lower_name.startswith('test_') or lower_name.endswith(('.test.ts', '.test.tsx', '.test.js', '.spec.ts', '.spec.js')):
            category = FileCategory.TEST
            summary = 'Automated unit or integration test suite.'

        # Styles
        elif ext in ('.css', '.scss', '.sass', '.less'):
            category = FileCategory.STYLE
            summary = 'Application visual stylesheets and aesthetic theme styles.'

        # Backend Entry Points
        elif (lower_name in ('main.py', 'app.py', 'server.py', 'wsgi.py', 'asgi.py') or 'fastapi(' in content.lower() or 'flask(' in content.lower()) and ext == '.py':
            category = FileCategory.ENTRY_POINT
            is_entry = True
            summary = 'Backend entry point initializing the web application server and top-level router.'

        # API Routes
        elif ('router = apirouter' in content.lower() or '@router.' in content or '@app.get' in content or '@app.post' in content or 'api/' in lower_path or 'routes' in lower_path) and ext == '.py':
            category = FileCategory.API_ROUTE
            summary = 'Exposes REST HTTP API endpoints, validating request payloads and dispatching to services.'

        # Services / Business Logic
        elif ('service' in lower_name or 'services/' in lower_path or ('class ' in content and 'service' in content.lower())) and ext == '.py':
            category = FileCategory.SERVICE
            summary = 'Core business logic and algorithmic processing decoupled from HTTP protocols.'

        # Models / Schemas
        elif ('models/' in lower_path or 'schemas/' in lower_path or 'models.py' in lower_name or 'schemas.py' in lower_name or 'basemodel' in content.lower()):
            category = FileCategory.MODEL
            summary = 'Data transfer objects (DTOs), database entities, and validation schemas.'

        # Frontend Root
        elif lower_name in ('app.tsx', 'app.jsx', 'main.tsx', 'main.jsx', 'index.tsx', 'index.jsx') and any(tag in content for tag in ('<BrowserRouter', '<Routes', 'createRoot', 'ReactDOM', '<App', 'export default function App')):
            category = FileCategory.FRONTENDROOT if hasattr(FileCategory, 'FRONTENDROOT') else FileCategory.FRONTEND_ROOT
            is_entry = True
            summary = 'Frontend root application component mounting navigation, global state, and base views.'

        # API Client / Communication Layer
        elif (lower_name in ('api.ts', 'api.js', 'apiclient.ts') or 'services/api' in lower_path or 'fetch(' in content or 'axios.' in content) and ext in ('.ts', '.js'):
            category = FileCategory.API_CLIENT
            summary = 'Frontend network client encapsulating HTTP fetch requests to the backend.'

        # Reusable UI Component
        elif ext in ('.tsx', '.jsx') or ('components/' in lower_path and ext in ('.ts', '.js', '.tsx', '.jsx')):
            category = FileCategory.COMPONENT
            summary = 'Modular user interface component managing visual state and user interaction.'

        else:
            if ext == '.py':
                category = FileCategory.SERVICE
                summary = 'Python application module providing helper operations.'
            elif ext in ('.ts', '.js'):
                category = FileCategory.COMPONENT
                summary = 'TypeScript/JavaScript utility logic.'
            else:
                category = FileCategory.UNKNOWN
                summary = f'{ext.upper()} resource file.'

        return ProjectFile(
            id=path.replace('/', '_').replace('.', '_'),
            path=path,
            name=filename,
            extension=ext,
            category=category,
            summary=summary,
            imports=imports,
            exports=exports,
            is_entry_point=is_entry,
            line_count=len(lines),
            content=content
        )
