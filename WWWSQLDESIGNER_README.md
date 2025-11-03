# WWW SQL Designer - Comprehensive Exploration Results

This directory contains a detailed architectural analysis of the [wwwsqldesigner](https://github.com/ondras/wwwsqldesigner) project, comparing it to DrawDB's architecture and evaluating the feasibility of adding WebSocket/MCP integration.

## Documents Included

### 1. WWWSQLDESIGNER_ANALYSIS.md (13 KB, 426 lines)
**Comprehensive deep-dive into the wwwsqldesigner codebase**

- Tech stack and architecture (vanilla JS, no build system)
- Complete data model (Tables, Rows, Relations, Keys)
- State management approach (singleton + pub/sub)
- API capabilities (XML serialization only)
- Detailed file structure and responsibilities
- Strengths and weaknesses
- Key findings about integration complexity

**Start here for** architectural overview and code structure understanding.

---

### 2. COMPARISON_SUMMARY.md (6.7 KB, 273 lines)
**Side-by-side comparison of wwwsqldesigner vs DrawDB**

- Architecture differences at a glance
- Why DrawDB's design wins for AI integration
- State management philosophy comparison
- Programmatic API comparison
- When to use each tool
- Concrete code examples

**Start here for** quick understanding of why DrawDB is better suited for WebSocket/MCP.

---

### 3. TECHNICAL_CHALLENGES.md (11 KB, 399 lines)
**In-depth technical analysis of integration challenges**

8 major architectural challenges explained:
1. Monolithic singleton pattern
2. State stored in DOM (not separate)
3. No clear command boundaries
4. Complex visual system (Bezier relations)
5. Multiple overlapping managers with shared state
6. No undo/redo system
7. XML-only serialization
8. No type definitions

Includes:
- Effort estimates for each challenge
- Why each problem is fundamentally hard
- DrawDB's solutions for comparison
- Total refactoring effort: 3-4 weeks

**Start here for** detailed understanding of why WebSocket/MCP integration is hard.

---

## Key Findings

### Quick Summary
| Aspect | WWW SQL Designer | DrawDB |
|--------|------------------|--------|
| **Age** | 15+ years (2007-2025) | Modern (React 18 + Vite) |
| **Framework** | Vanilla JavaScript | React + TypeScript |
| **Backend** | 12 separate PHP/Perl/ColdFusion scripts | Single unified NestJS server |
| **API** | XML export/import only | 40+ MCP tools |
| **Real-time** | None | WebSocket + heartbeat |
| **State Model** | Monolithic singleton | Modular contexts |
| **Build System** | None | Turborepo + Vite |
| **Type Safety** | None | Full TypeScript |
| **Undo/Redo** | None | Full system |
| **WebSocket Ready** | NO - requires complete rewrite | YES - already built in |

### Integration Effort Comparison

**Adding WebSocket/MCP to WWW SQL Designer:**
- Estimated effort: 3-4 weeks
- Risk level: Very High
- Result: Would essentially rewrite entire app
- Alternative approach: easier to rewrite as React like DrawDB

**Using DrawDB as-is:**
- Effort: 0 weeks (already done!)
- Risk: Minimal (battle-tested)
- Result: Professional-grade MCP integration immediately available

---

## Why WebSocket/MCP is Hard for WWW SQL Designer

The core issue: **Architecture mismatch**

WWW SQL Designer was designed (2007-2012) for:
- Single browser instance
- Manual save button
- Optional server backend for persistence
- XML data format

DrawDB was designed for:
- Multiple simultaneous users
- Real-time synchronization
- Integrated server with MCP
- Programmatic API

Adding real-time sync to WWW SQL Designer would require:
1. Extracting state from DOM
2. Breaking up monolithic singleton
3. Creating command/transaction model
4. Adding undo/redo system
5. Replacing 12 backend implementations with unified Node.js server
6. Adding WebSocket layer
7. Complete TypeScript migration
8. Extensive testing

Each step has cascading dependencies and high risk of breaking existing functionality.

---

## Codebase Statistics

**WWW SQL Designer:**
- Total JavaScript: 4,122 lines (18 files)
- No build tools, no package.json
- Largest file: io.js (605 lines)
- Last update: August 2025 (Ukrainian locale)
- Actively maintained (15+ years)

**Backend implementations:**
- PHP (6 variants)
- ColdFusion, Perl, ASP.NET, Web2Py
- 12+ different languages/platforms
- No unified interface

**Frontend data model:**
- Tables (with rows/fields and keys/indices)
- Relations (foreign keys)
- Visual state (positions, z-index, colors)
- Selection state (tables, rows, keys)

---

## Architectural Lessons

### What DrawDB Got Right
1. **Modular contexts** - enable efficient WebSocket sync
2. **Unified backend** - single source of truth
3. **TypeScript** - catches integration bugs
4. **MCP-first design** - was built for AI integration
5. **React state management** - predictable updates

### What WWW SQL Designer Teaches Us
1. **Vanilla JS has limits** - no framework makes extensibility hard
2. **Singleton pattern doesn't scale** - can't support multiple instances
3. **State in DOM is a trap** - makes real-time sync nearly impossible
4. **Multiple backends = maintenance burden** - unified backend is better
5. **XML serialization is dated** - JSON/structured commands are needed

---

## Recommendations

### If you want AI integration:
**Use DrawDB.** It's already built for this.

### If you want to understand wwwsqldesigner:
1. Start with `/js/oz.js` - the utility framework
2. Then `/js/visual.js` - the base class
3. Then `/js/table.js` and `/js/row.js` - the data model
4. Then `/js/io.js` - how save/load works
5. Finally `/js/wwwsqldesigner.js` - the main Designer class

### If you want to add WebSocket to wwwsqldesigner:
1. Fork it
2. Add TypeScript
3. Extract state from DOM
4. Create NestJS backend
5. Essentially rewrite as DrawDB
6. Ask yourself: why not just use DrawDB?

---

## Files Explored

### Frontend Code (`/js`)
- `oz.js` (466 lines) - Utility framework
- `visual.js` (43 lines) - Base class
- `table.js` (396 lines) - Table entity
- `row.js` (513 lines) - Field/column entity
- `relation.js` (234 lines) - Foreign key relations
- `key.js` (81 lines) - Index definitions
- `tablemanager.js` (257 lines) - Table selection/editing
- `rowmanager.js` (239 lines) - Field selection/editing
- `keymanager.js` (224 lines) - Index management
- `io.js` (605 lines) - Save/load/export
- `window.js` (110 lines) - Modal dialogs
- `options.js` (112 lines) - User preferences
- And 6 more files...

### Backend Code (`/backend`)
- php-mysql (MySQL database)
- php-postgresql (PostgreSQL)
- php-sqlite (SQLite)
- php-s3 (Amazon S3)
- php-dropbox (Dropbox)
- php-pdo (PDO abstraction)
- php-file (File-based storage)
- ColdFusion, Perl, ASP.NET variants
- Web2Py (Python)

### Data Definitions (`/db`)
- MySQL, PostgreSQL, SQLite, MSSQL, Oracle
- Web2Py, SQLAlchemy, CUBRID, VFP9
- Each with datatype definitions in XML

---

## Repository Details

- **GitHub**: https://github.com/ondras/wwwsqldesigner
- **Language**: JavaScript (no TypeScript)
- **License**: New BSD
- **Status**: Actively maintained (August 2025)
- **Age**: 15+ years
- **Latest commit**: Ukrainian locale addition
- **Docker image**: 8 MB (BusyBox httpd)
- **No dependencies**: Zero npm packages

---

## Related DrawDB Documentation

For comparison, see DrawDB's architecture docs:
- `/apps/backend/README.md` - Backend architecture
- `/CLAUDE.md` - Project overview (includes MCP design)
- `/apps/backend/src/mcp/primitives/` - MCP tools implementation

---

## Conclusion

**wwwsqldesigner is a mature, stable, zero-dependency diagram editor that prioritizes simplicity over extensibility.**

**DrawDB is a modern, modular, real-time-ready diagram editor designed for AI integration via MCP.**

If you need WebSocket/MCP integration for AI assistants, use DrawDB.

If you're interested in understanding web-based diagram editors, wwwsqldesigner is an excellent example of the "classic" approach (pre-framework, pre-real-time).

The architectural differences show why modern frameworks and backend integration patterns evolved.

---

**Analysis completed**: October 28, 2025
**Explorer**: Claude Code
**Repository**: https://github.com/ondras/wwwsqldesigner (cloned to /tmp)
