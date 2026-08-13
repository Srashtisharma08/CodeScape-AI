from models.schemas import ParseRequest, ParseResponse
from parser.tree_sitter_parser import tree_sitter_parser
from parser.language_registry import registry

class ParseService:
    def parse_code(self, request: ParseRequest) -> ParseResponse:
        # Validates language is supported
        registry.get_language(request.language)
        
        if not request.code or not request.code.strip():
            raise ValueError("Code cannot be empty")
            
        ast_node, parse_info = tree_sitter_parser.parse(request.language, request.code)
        
        return ParseResponse(ast=ast_node, parse_info=parse_info)

parse_service = ParseService()
