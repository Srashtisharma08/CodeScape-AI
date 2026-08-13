# CodeScape AI

An AI-powered educational platform that helps students understand how code executes by converting source code into interactive visual explanations.

## Phase 1 — Project Foundation

This phase establishes the core project with:

- **Code Editor** — Monaco Editor with syntax highlighting
- **Language Support** — Python, Java, JavaScript
- **AST Parsing** — Tree-sitter powered code parsing
- **AST Visualization** — Interactive expandable tree view
- **Parse Info** — Statistics about parsed code

## Architecture

```
CodeScape-AI/
├── backend/               # FastAPI server
│   ├── main.py            # Entry point
│   ├── api/               # Route handlers
│   │   └── routes.py
│   ├── services/          # Business logic
│   │   └── parse_service.py
│   ├── parser/            # Tree-sitter integration
│   │   ├── language_registry.py
│   │   └── tree_sitter_parser.py
│   ├── models/            # Pydantic schemas
│   │   └── schemas.py
│   └── utils/             # Shared utilities
│       └── errors.py
│
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   ├── services/      # API client
│   │   └── types/         # TypeScript interfaces
│   └── ...
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## API Endpoints

| Method | Path             | Description                    |
|--------|------------------|--------------------------------|
| POST   | `/api/parse`     | Parse code and return AST      |
| GET    | `/api/languages` | List supported languages       |
| GET    | `/health`        | Health check                   |

## Supported Languages

- Python
- Java
- JavaScript

Adding a new language requires only a new entry in the language registry.

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React, TypeScript, Vite, TailwindCSS    |
| Editor   | Monaco Editor                           |
| Backend  | FastAPI, Python, Pydantic               |
| Parser   | Tree-sitter                             |
