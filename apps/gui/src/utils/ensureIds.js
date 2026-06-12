import { nanoid } from "nanoid";

/**
 * Back-fill nanoid ids on enums loaded from legacy diagrams or external
 * imports (DBML/SQL/JSON) that predate stable enum ids.
 * Safe to call with null/undefined - always returns an array.
 */
export function ensureEnumIds(enums) {
  // Legacy diagrams store numeric ids (0, 1, 2…); only a string id is stable
  // and addressable over MCP (params arrive as JSON strings), so regenerate
  // anything that isn't already a string.
  return (enums ?? []).map((e) =>
    typeof e.id === "string" ? e : { ...e, id: nanoid() },
  );
}

/**
 * Back-fill nanoid ids on types (and their fields) loaded from legacy
 * diagrams or external imports that predate stable type ids.
 * Safe to call with null/undefined - always returns an array.
 */
export function ensureTypeIds(types) {
  return (types ?? []).map((t) => {
    const fields = t.fields ?? [];
    if (typeof t.id === "string" && fields.every((f) => typeof f.id === "string"))
      return t;
    return {
      ...t,
      id: typeof t.id === "string" ? t.id : nanoid(),
      fields: fields.map((f) =>
        typeof f.id === "string" ? f : { ...f, id: nanoid() },
      ),
    };
  });
}
