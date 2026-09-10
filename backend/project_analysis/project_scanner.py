from typing import List, Tuple
from project_analysis.models import ProjectFileInput

IGNORED_DIRS = {
    'node_modules', '.venv', 'venv', '__pycache__', '.git',
    'dist', 'build', '.next', 'coverage', '.pytest_cache'
}

SUPPORTED_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.md', '.txt'
}

class ProjectScanner:
    def __init__(self, max_files: int = 50, max_file_size_kb: int = 500):
        self.max_files = max_files
        self.max_file_size_kb = max_file_size_kb

    def is_binary(self, content: str) -> bool:
        return chr(0) in content

    def should_ignore_path(self, path: str) -> bool:
        normalized = path.replace('\\', '/').strip('/')
        parts = normalized.split('/')
        for part in parts:
            if part in IGNORED_DIRS:
                return True
        return False

    def has_supported_extension(self, path: str) -> bool:
        lower = path.lower()
        return any(lower.endswith(ext) for ext in SUPPORTED_EXTENSIONS)

    def scan(self, raw_files: List[ProjectFileInput]) -> Tuple[List[ProjectFileInput], List[str]]:
        errors: List[str] = []
        valid_files: List[ProjectFileInput] = []

        if not raw_files:
            errors.append('Project contains no files.')
            return valid_files, errors

        for f in raw_files:
            clean_path = f.path.replace('\\', '/').strip('/')
            if self.should_ignore_path(clean_path):
                continue

            if not self.has_supported_extension(clean_path):
                continue

            content_bytes = len(f.content.encode('utf-8'))
            if content_bytes > self.max_file_size_kb * 1024:
                errors.append(f'File {clean_path} exceeds maximum file size limit of {self.max_file_size_kb}KB.')
                continue

            if self.is_binary(f.content):
                continue

            valid_files.append(ProjectFileInput(path=clean_path, content=f.content))

        if len(valid_files) > self.max_files:
            errors.append(f'Project exceeds maximum supported file count of {self.max_files} (found {len(valid_files)}).')
            return [], errors

        if not valid_files and not errors:
            errors.append('No supported source files found after filtering.')

        return valid_files, errors
