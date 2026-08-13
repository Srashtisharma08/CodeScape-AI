import time
from tree_sitter import Parser, Node
from parser.language_registry import registry
from models.schemas import ASTNode, ParseInfo

class TreeSitterParser:
    def parse(self, language: str, code: str) -> tuple[ASTNode, ParseInfo]:
        lang_obj = registry.get_language(language)
        parser = Parser(lang_obj)
        
        start_time = time.time()
        tree = parser.parse(code.encode('utf-8'))
        parse_time_ms = (time.time() - start_time) * 1000.0
        
        root_ast_node = self._convert_node(tree.root_node)
        node_count = self._count_nodes(root_ast_node)
        
        has_errors = tree.root_node.has_error
        
        parse_info = ParseInfo(
            language=language,
            node_count=node_count,
            parse_time_ms=parse_time_ms,
            has_errors=has_errors
        )
        
        return root_ast_node, parse_info

    def _convert_node(self, node: Node) -> ASTNode:
        children = []
        for child in node.children:
            if child.is_named:
                children.append(self._convert_node(child))
                
        name = None
        if node.type in ('function_definition', 'method_declaration', 'class_declaration', 'variable_declarator', 'function_declaration'):
            for child in node.children:
                if child.type in ('identifier', 'name'):
                    name = child.text.decode('utf-8')
                    break
                    
        return ASTNode(
            type=node.type,
            name=name,
            children=children,
            start_line=node.start_point[0] + 1,
            end_line=node.end_point[0] + 1
        )

    def _count_nodes(self, node: ASTNode) -> int:
        count = 1
        for child in node.children:
            count += self._count_nodes(child)
        return count

tree_sitter_parser = TreeSitterParser()
