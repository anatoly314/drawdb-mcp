import { nanoid } from "nanoid";

/**
 * Back-fill nanoid ids on enums loaded from legacy diagrams or external
 * imports (DBML/SQL/JSON) that predate stable enum ids.
 * Safe to call with null/undefined - always returns an array.
 */
export function ensureEnumIds(enums) {
  return (enums ?? []).map((e) => (e.id ? e : { ...e, id: nanoid() }));
}

/**
 * Back-fill nanoid ids on types (and their fields) loaded from legacy
 * diagrams or external imports that predate stable type ids.
 * Safe to call with null/undefined - always returns an array.
 */
export function ensureTypeIds(types) {
  return (types ?? []).map((t) => {
    const fields = t.fields ?? [];
    if (t.id && fields.every((f) => f.id)) return t;
    return {
      ...t,
      id: t.id ?? nanoid(),
      fields: fields.map((f) => (f.id ? f : { ...f, id: nanoid() })),
    };
  });
}
