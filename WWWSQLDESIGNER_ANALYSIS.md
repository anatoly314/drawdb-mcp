# WWW SQL Designer - Architecture & Analysis Report

## Executive Summary

**WWW SQL Designer** is a mature, **vanilla JavaScript-based** browser ER diagram editor built from scratch around 2007-2012. Unlike DrawDB (modern React/Vite stack), it's a **monolithic client-side application with optional PHP backend integration** for persistence and import/export.

**Key Finding**: This is fundamentally a different architecture than DrawDB. Adding WebSocket/MCP integration would require wrapping the entire application, as there's no existing server component or modular API.

---

## 1. Architecture & Tech Stack

### Frontend Stack
- **Language**: Pure JavaScript (no framework)
- **Build System**: **None** - runs directly from HTML files
- **Module System**: Custom OZ.js lightweight framework
- **Rendering**: DOM manipulation + optional SVG for relations
- **Styling**: Plain CSS (multiple themes available)
- **State**: Global `SQL.Designer` singleton with direct property mutation

### Backend Stack
- **Multiple implementations** in different languages (NOT unified):
  - PHP (MySQL, SQLite, PostgreSQL, file storage, S3, Dropbox)
  - ColdFusion (php-cf-mysql)
  - Perl (file storage)
  - ASP.NET (file storage)
  - Web2Py (Python-based)
- **No Node.js/NestJS server**
- **No WebSocket/real-time** capabilities
- **Deployment**: Static HTML + optional server-side script for persistence

### Build & Deployment
- **Docker**: Minimal - uses BusyBox httpd (8MB image)
- **Development**: Run `http-server` locally
- **No build tools**: No webpack, no bundler, no package.json
- **Last significant commit**: August 2025 (Ukrainian locale addition)

---

## 2. State Management Model

### Global State Architecture
```javascript
// Single global instance created in index.html
var d = new SQL.Designer();

SQL.Designer = function() {
    this.tables = [];           // Array of Table objects
    this.relations = [];        // Array of Relation objects
    this.xhrheaders = {};       // Optional auth headers
    // ... properties
}
```

### Data Model

**Tables** (`SQL.Table`)
```javascript
Table {
    rows: [Row, Row, ...]       // Columns/fields
    keys: [Key, Key, ...]       // Indices
    x, y, width, height         // Position & size
    zIndex                      // Layer ordering
    comment: string
}
```

**Rows/Fields** (`SQL.Row`) - represents a DB column
```javascript
Row {
    owner: Table                // Parent table reference
    relations: [Relation, ...]  // Foreign key relations
    keys: [Key, ...]            // Key membership
    data: {
        title: string
        type: number            // Type index
        size: string
        def: null               // Default value
        nll: boolean            // NOT NULL
        ai: boolean             // Auto-increment
        comment: string
    }
}
```

**Relations** (`SQL.Relation`) - Foreign keys
```javascript
Relation {
    row1: Row                   // Source field
    row2: Row                   // Target field
    color: string               // Relation line color
    dom: [SVG path | div × 3]   // Visual representation
}
```

**Keys** (`SQL.Key`) - Indices
```javascript
Key {
    name: string
    type: "PRIMARY" | "UNIQUE" | "INDEX" | "FULLTEXT"
    columns: [string, ...]      // Column names
}
```

### No Explicit State Management
- **No Redux, Context API, or state machine**
- **Direct mutation**: `table.moveTo(x, y)` mutates internal state
- **Observer pattern**: Pub/sub system via `SQL.publish(message, publisher, data)`
- **Event binding**: Direct DOM event handlers with closures

---

## 3. API & Programmatic Access

### What Exists: XML Serialization
The only "API" is XML import/export:

```javascript
// Export entire diagram to XML
var xml = designer.toXML();

// Import from XML (replaces current diagram)
designer.fromXML(xmlDoc);
```

### Data Format (XML)
```xml
<?xml version="1.0" encoding="utf-8" ?>
<sql>
  <datatypes db="mysql">
    <!-- Type definitions -->
  </datatypes>
  <table x="100" y="50" name="users">
    <row name="id" null="0" autoincrement="1">
      <datatype>INTEGER</datatype>
      <default></default>
      <relation table="posts" row="user_id" />
    </row>
    <row name="email" null="0" autoincrement="0">
      <datatype>VARCHAR</datatype>
      <default></default>
    </row>
    <key name="PRIMARY" type="PRIMARY">
      <part>id</part>
    </key>
    <comment>User accounts</comment>
  </table>
</sql>
```

### What's Missing
- **No programmatic API** to add/modify individual entities
- No `addTable()` method exposed publicly
- No `deleteField()` method
- No event/callback system for external listeners
- No REST or RPC endpoints
- No MCP integration possible without major refactoring

### Limited Server-Side Integration Points
```php
// Backend can only:
1. List saved designs (via database query)
2. Load/save designs (XML text)
3. Import from live database (read schema from information_schema)
4. Generate SQL from diagram
```

---

## 4. Build System Analysis

### No Modern Build Tools
```
No package.json
No webpack/vite config
No TypeScript
No transpilation
No minification (in repo)
```

### Script Loading (Index.html)
```html
<script src="js/oz.js"></script>
<script src="js/config.js"></script>
<script src="js/globals.js"></script>
<script src="js/visual.js"></script>
<script src="js/row.js"></script>
<script src="js/table.js"></script>
<!-- ... 18 files total, 4,122 lines -->
<script src="js/wwwsqldesigner.js"></script>
```

**Issues for modernization**:
- No dependency management
- Load order is critical
- Global namespace pollution
- No tree-shaking possible

---

## 5. Detailed Architecture Walkthrough

### Core Module: OZ.js (466 lines)
Lightweight utility library providing:
- `OZ.$()` - DOM selector
- `OZ.select()` - querySelectorAll
- `OZ.Event` - cross-browser event handling
- `OZ.DOM` - DOM manipulation helpers
- `OZ.Style` - inline CSS manipulation
- Browser detection (IE, Firefox, Safari, Opera)

**Note**: Built for IE6+ compatibility

### Visual Hierarchy
```
SQL.Visual (base class)
├── SQL.Designer (root application)
│   ├── Tables (SQL.Table[])
│   │   ├── Rows (SQL.Row[])
│   │   │   └── Relations (SQL.Relation[])
│   │   └── Keys (SQL.Key[])
│   ├── Relations (SQL.Relation[]) - global list
│   └── Managers (IO, TableManager, RowManager, etc.)
```

### Key Files by Responsibility

| File | Lines | Purpose |
|------|-------|---------|
| `oz.js` | 466 | Utility framework |
| `io.js` | 605 | Save/load/import/export |
| `row.js` | 513 | Column/field entity |
| `table.js` | 396 | Table entity |
| `wwwsqldesigner.js` | 444 | Main Designer class |
| `relation.js` | 234 | Foreign key relations |
| `rowmanager.js` | 239 | Column selection/editing |
| `tablemanager.js` | 257 | Table selection/editing |
| `keymanager.js` | 224 | Index management |
| `window.js` | 110 | Modal dialog UI |
| `options.js` | 112 | User preferences |

### Event System (Pub/Sub)
```javascript
// In globals.js
SQL = {
    _subscribers: {},
    publish(message, publisher, data) {
        // Notify all subscribers
    },
    subscribe(message, subscriber) {},
    unsubscribe(message, subscriber) {}
}

// Usage
SQL.publish("tableclick", this);
SQL.subscribe("tableclick", myHandler);
```

### UI Interaction Flow
1. **User clicks table** → DOM event fires
2. **Table.click()** → Calls `this.owner.tableManager.select(this)`
3. **TableManager.select()** → Updates selection state, publishes "tableclick"
4. **Managers/handlers** → Subscribe and respond to event
5. **Visual redraw** → Each component calls `redraw()` to update DOM

### Rendering System
- **Canvas Container**: DIV with absolute-positioned child elements
- **Tables**: HTML table elements within positioned divs
- **Relations**: Either SVG paths OR 3 div elements (bezier approximation)
- **Selection**: Added via CSS class "selected"
- **Mini-map**: Separate DOM elements tracking table positions at scale

---

## 6. Comparison to DrawDB

| Aspect | WWW SQL Designer | DrawDB |
|--------|------------------|--------|
| **Framework** | Vanilla JS | React 18 |
| **Build System** | None | Vite + Turborepo |
| **State Management** | Direct mutation + Pub/Sub | Context API + Hooks |
| **Backend** | Optional PHP scripts | NestJS MCP server |
| **Networking** | XHR for persistence only | WebSocket + HTTP |
| **API** | XML serialization only | MCP tools (40+ methods) |
| **Modularity** | Monolithic (single instance) | Modular contexts |
| **Real-time** | None | Built-in with MCP |
| **Language Support** | 20+ locales | Multi-language ready |
| **Mobile Support** | Touch events | Touch-optimized UI |
| **Last Update** | August 2025 | October 2025 |
| **Code Size** | 4.1 KB JS | Much larger (React) |
| **TypeScript** | No | Yes (backend) |

---

## 7. Integration Complexity Analysis

### Adding WebSocket/MCP to WWW SQL Designer

**Difficulty: HIGH** - Would require:

1. **Create Node.js wrapper server** (doesn't exist)
   - No existing backend framework
   - Would need to port all backend logic from PHP/ColdFusion/Perl
   - All 4,100 lines of JS assume browser environment

2. **Expose programmatic API**
   - Currently only `toXML()` and `fromXML()` exist
   - Need to add methods like:
     ```javascript
     designer.addTable(name, x, y)
     designer.deleteTable(id)
     designer.addField(tableId, name, type)
     designer.updateRelation(id, changes)
     ```
   - Would require modifying core entities to return structured responses

3. **Establish bidirectional communication**
   - No WebSocket library included
   - Would need to hook into all mutation points
   - Conflict between local UI actions and remote commands
   - No transaction/undo system for remote changes

4. **Database abstraction**
   - Currently uses multiple backend implementations
   - MCP would need unified interface
   - Import/export tied to specific database types

### Why It's Harder Than DrawDB

**DrawDB design choices that enable MCP:**
- Modular contexts with clear responsibility boundaries
- Structured state (not DOM-coupled)
- Hook-based mutation tracking
- Already has TypeScript types for all operations
- Backend is unified NestJS, not multiple languages
- Was built with extensibility in mind

**WWW SQL Designer constraints:**
- Monolithic singleton pattern
- State stored in DOM properties and closures
- Multiple overlapping managers with shared state
- No clear command boundaries
- Would need complete architectural refactor

---

## 8. Strengths & Weaknesses

### Strengths
✓ **Mature & stable** - 15+ year codebase, actively maintained  
✓ **Zero dependencies** - 4.1 KB JS, works in any browser  
✓ **Multi-language** - 20 languages supported  
✓ **Multiple backends** - Flexible persistence options  
✓ **Export options** - SQL, XML, schema import  
✓ **Minimal footprint** - 8 MB Docker image  
✓ **Touch support** - Works on mobile  

### Weaknesses
✗ **No programmatic API** - Can't manipulate diagrams programmatically  
✗ **No real-time** - Can't sync multiple users  
✗ **No TypeScript** - Hard to extend safely  
✗ **Monolithic** - Everything is one global instance  
✗ **No server component** - Each backend is independent  
✗ **Browser-only state** - Can't persist undo/redo or diagrams server-side  
✗ **Manual sync** - Users must explicitly save to server  

---

## 9. Key File Locations

**Frontend Code**: `/js/*.js` (4,122 lines total)
- Entry point: `index.html` (11,743 bytes)
- Core: `wwwsqldesigner.js` + `visual.js`
- Entities: `table.js`, `row.js`, `relation.js`, `key.js`
- UI: `window.js`, `options.js`, `tablemanager.js`, `rowmanager.js`
- I/O: `io.js` (605 lines)

**Backend Scripts**: `/backend/` (12 implementations)
- PHP implementations (most complete)
- ColdFusion, Perl, ASP.NET variations
- Web2Py (Python) example

**Data Definitions**: `/db/` (11 databases)
- `datatypes.xml` files per DB system
- Type definitions with SQL syntax

**Localization**: `/locale/` (20 languages)
- XML-based translations
- String key-value pairs

---

## 10. Recommendations

### For Adding AI Integration to WWW SQL Designer

**Option 1: Lightweight Wrapper (Easier)**
- Don't refactor the core
- Build a thin HTTP API layer around the Designer singleton
- Serialize/deserialize via XML format
- Limitations: Can only work with entire diagrams, not individual operations

**Option 2: Complete Rewrite (Better)**
- Port to React/TypeScript like DrawDB
- Copy DrawDB's architecture
- Reuse DrawDB's MCP backend
- This is essentially what would be needed for true WebSocket/MCP integration

### Lessons for DrawDB Comparison
1. **DrawDB's modular architecture is intentional** - enables WebSocket/MCP
2. **Monolithic design scales to a point** - WWW SQL Designer is at that limit
3. **No build system = hard to extend** - drawDB's Turborepo enables this
4. **Event-driven without state tracking = difficult for real-time sync** - DrawDB's Context API enables reconciliation

---

## Conclusion

**WWW SQL Designer** is a **solid, self-contained ER diagram tool** that prioritizes **simplicity and accessibility** over extensibility. It's fundamentally incompatible with modern integration patterns (WebSocket, MCP, API-driven) without major architectural changes.

**For AI integration**, it would be easier to:
1. **Use DrawDB** (already has MCP)
2. **Build a thin XML wrapper** (limited functionality)
3. **Complete rewrite to React** (most work, best result)

Rather than trying to bolt WebSocket/MCP onto the existing codebase.
