from tree_sitter import Language
from utils.errors import UnsupportedLanguageError

class LanguageRegistry:
    def __init__(self):
        self._languages = {}
        self._register_default_languages()

    def _register_default_languages(self):
        try:
            import tree_sitter_python as tspython
            self._languages["python"] = Language(tspython.language())
        except ImportError:
            pass

        try:
            import tree_sitter_java as tsjava
            self._languages["java"] = Language(tsjava.language())
        except ImportError:
            pass

        try:
            import tree_sitter_javascript as tsjs
            self._languages["javascript"] = Language(tsjs.language())
        except ImportError:
            pass

    def get_language(self, name: str) -> Language:
        lang = self._languages.get(name.lower())
        if not lang:
            raise UnsupportedLanguageError(name)
        return lang

    def supported_languages(self) -> list[str]:
        return list(self._languages.keys())

registry = LanguageRegistry()
