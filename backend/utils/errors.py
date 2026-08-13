class UnsupportedLanguageError(Exception):
    def __init__(self, language: str):
        self.language = language
        super().__init__(f"Unsupported language: {language}")

class ParseError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(f"Parse error: {message}")
