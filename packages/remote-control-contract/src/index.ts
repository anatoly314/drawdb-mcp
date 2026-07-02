// Shared ORPC contract for the DrawDB remote-control WebSocket protocol.
//
// DIRECTION: server -> client. These are procedures the BROWSER (GUI) hosts
// and the NestJS backend invokes — the ORPC "bidi" / client-hosted-router
// direction. The backend holds a typed caller and calls these exactly the
// way a browser would call a server router; the GUI implements them against
// the same contract. One source of truth for the wire shape.
//
// FLATNESS IS LOAD-BEARING: the @orpc-ws client-hosted router requires a
// FLAT contract — nested sub-routers throw at construction. Every wire
// command therefore lives at the top level of `clientContract`, and each
// procedure key IS the wire command name.
//
// CONTRACT COMPOSITION: the contract stays thin and feature-owned. Each
// feature owns its slice in a colocated fragment
// (`./client/<feature>.contract.ts`) — a plain object of `oc` procedures —
// and this root just SPREADS the fragments into one flat `oc.router`.
// Adding a command = a new entry in its feature fragment (or a new fragment
// + one more spread here); no nesting, ever.
//
// ERROR MODEL: the legacy `{ success, message, data }` envelope is NOT part
// of this contract. Under ORPC, success is promise resolution (the `data`
// payload becomes the output) and failures are thrown ORPC errors.
//
// Deliberately DROPPED legacy commands (GUI handled them, nothing sent
// them): getTables, getRelationships, getAreas, getNotes, getEnums,
// getTypes.

import { oc } from "@orpc/contract";

import { tablesClientContract } from "./client/tables.contract.js";
import { fieldsClientContract } from "./client/fields.contract.js";
import { relationshipsClientContract } from "./client/relationships.contract.js";
import { areasClientContract } from "./client/areas.contract.js";
import { notesClientContract } from "./client/notes.contract.js";
import { enumsClientContract } from "./client/enums.contract.js";
import { typesClientContract } from "./client/types.contract.js";
import { diagramClientContract } from "./client/diagram.contract.js";
import { exportImportClientContract } from "./client/export-import.contract.js";

export const clientContract = oc.router({
  ...tablesClientContract, // addTable, updateTable, deleteTable, getTable
  ...fieldsClientContract, // addField, updateField, deleteField
  ...relationshipsClientContract, // addRelationship, updateRelationship, deleteRelationship
  ...areasClientContract, // addArea, updateArea, deleteArea
  ...notesClientContract, // addNote, updateNote, deleteNote
  ...enumsClientContract, // addEnum, updateEnum, deleteEnum
  ...typesClientContract, // addType, updateType, deleteType
  ...diagramClientContract, // setDatabase, getDiagram, importDiagram
  ...exportImportClientContract, // exportSQL, exportDBML, importDBML
});
export type ClientContract = typeof clientContract;

// Entity schemas + inferred TS types (replace drawdb.types.ts in chunk 2).
export * from "./schemas.js";
