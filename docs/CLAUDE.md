# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DrawDB is a browser-based database entity relationship (DBER) editor built with React and Vite. It allows users to create database diagrams visually, export SQL scripts for multiple database systems, and import/export diagrams in various formats.

## Commands

### Development
```bash
npm run dev        # Start development server with Vite
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Code Quality
- Format code with Prettier before committing
- Ensure ESLint passes (no warnings allowed in build)
- All code, comments, and variable names must be in English

### Git Commits
- Use present tense imperative mood (e.g., "Add feature" not "Added feature")
- Keep commits atomic (one feature or fix per commit)
- Reference issues/PRs after the first line

## Architecture

### State Management Pattern
The app uses React Context API extensively for state management. Each major domain has its own context provider:

- **DiagramContext** (`src/context/DiagramContext.jsx`) - Core state for tables and relationships
- **AreasContext** - Manages canvas areas (grouping of tables)
- **NotesContext** - Manages sticky notes on canvas
- **EnumsContext** / **TypesContext** - Database-specific types
- **CanvasContext** - Canvas pan/zoom and viewport state
- **UndoRedoContext** - Undo/redo stack management
- **SelectContext** - Currently selected element tracking
- **SaveStateContext** - Auto-save and persistence state
- **SettingsContext** - User preferences and theme

**Important**: State updates use functional updates (e.g., `setState(prev => ...)`) to ensure consistency. Many operations support undo/redo via history tracking with `addToHistory` parameter.

### Data Persistence
- Uses **Dexie.js** (IndexedDB wrapper) for local storage (`src/data/db.js`)
- Two main stores: `diagrams` (user diagrams) and `templates` (pre-built templates)
- Optional backend integration for sharing via VITE_BACKEND_URL environment variable

### Multi-Database Support
The app supports multiple SQL dialects (`src/data/constants.js` - `DB` enum):
- MySQL, PostgreSQL, SQL Server, SQLite, MariaDB, Oracle SQL, Generic

Each database has its own:
- SQL export logic (`src/utils/exportSQL/[database].js`)
- SQL import parser (`src/utils/importSQL/[database].js`)
- Data types mapping (`src/data/datatypes.js`)

### Canvas Rendering
- Tables, relationships, areas, and notes are SVG-based components
- **EditorCanvas** (`src/components/EditorCanvas/`) contains the main canvas components:
  - `Table.jsx` - Renders individual tables with fields
  - `Relationship.jsx` - Renders foreign key relationships with cardinality
  - `Area.jsx` - Renders grouping areas
  - `Note.jsx` - Renders sticky notes
- Path calculation for relationships uses `src/utils/calcPath.js`
- Pan/zoom controlled via `TransformContext`

### Import/Export Architecture
**Export formats** (`src/utils/exportAs/`):
- PNG, PDF, JSON (diagram format), SQL (all dialects), DBML

**Import sources** (`src/utils/importFrom/`):
- JSON (native format), DBML

**SQL Import** (`src/utils/importSQL/`):
- Each database has a dedicated parser that converts SQL CREATE statements to diagram JSON

### Internationalization
- Uses `react-i18next` for i18n
- Locale files in `src/i18n/locales/`
- Language utilities in `src/i18n/utils/`
- All user-facing strings must use `t()` translation function

### Component Structure
- **EditorHeader** - Top navigation, modals, and main actions
- **EditorSidePanel** - Right sidebar with tabs for Tables/Relationships/Areas/Notes/Types/Enums
- **EditorCanvas** - Main SVG canvas area
- **LexicalEditor** - Rich text editor (used in notes)
- **CodeEditor** - Monaco editor integration for SQL/DBML
- **SortableList** - Drag-and-drop list component using @dnd-kit

## Key Implementation Details

### Undo/Redo System
Operations that modify state accept an `addToHistory` boolean parameter (default true):
- When true, pushes action to undo stack and clears redo stack
- Actions store: `action` type, `element` type, operation `data`, and user-facing `message`
- The UndoRedoContext handles replaying actions bidirectionally

### Relationship Cardinality
Relationships store:
- `startTableId` / `endTableId` - Connected tables
- `startFieldId` / `endFieldId` - Connected fields (foreign keys)
- `cardinality` - One of: ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE
- `updateConstraint` / `deleteConstraint` - FK constraints (CASCADE, SET NULL, etc.)

### Table Field Structure
Each field has: `id`, `name`, `type`, `primary`, `unique`, `notNull`, `increment`, `default`, `check`, `comment`

### Canvas Coordinates
- Tables/notes store absolute `x`, `y` coordinates
- Transform state manages pan (`transform.pan.x`, `transform.pan.y`) and zoom (`transform.zoom`)
- Grid snapping uses `gridSize` constant (24px by default)

## Validation
- Schema validation uses `jsonschema` library (`src/data/schemas.js`)
- Issue detection system (`src/utils/issues.js`) validates diagram integrity:
  - Detects duplicate table/field names
  - Validates relationship integrity
  - Checks for invalid data types per database

## Remote Control API

The app supports remote control via WebSocket for AI/LLM-assisted diagram generation:
- **Hook**: `useRemoteControl` (`src/hooks/useRemoteControl.js`)
- **Enable**: Set `VITE_REMOTE_CONTROL_ENABLED=true` in `.env`
- **Protocol**: WebSocket commands map to DiagramContext methods
- **Documentation**: See `docs/REMOTE_CONTROL.md` for complete API reference
- **Use case**: LLM/MCP servers can programmatically create/modify diagrams

Commands support all CRUD operations on: tables, fields, relationships, areas, notes, enums, types.

## Development Notes
- The app is purely client-side unless backend URL is configured for sharing
- Docker support available for deployment
- Uses Tailwind CSS (v4) for styling
- Semi Design (@douyinfe/semi-ui) as component library
- Monaco Editor for code editing experiences
