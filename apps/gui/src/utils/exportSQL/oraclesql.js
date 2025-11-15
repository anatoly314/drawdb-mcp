import { dbToTypes } from "../../data/datatypes";
import { parseDefault } from "./shared";

export function toOracleSQL(diagram) {
  return `${diagram.tables
    .map(
      (table) =>
        `${
          table.comment === "" ? "" : `/* ${table.comment} */\n`
        }CREATE TABLE "${table.name}" (\n${table.fields
          .map(
            (field) =>
              `${field.comment === "" ? "" : `\t-- ${field.comment}\n`}\t"${
                field.name
              }" ${field.type}${
                field.size !== undefined && field.size !== ""
                  ? "(" + field.size + ")"
                  : ""
              }${field.notNull ? " NOT NULL" : ""}${
                field.increment ? " GENERATED ALWAYS AS IDENTITY" : ""
              }${field.unique ? " UNIQUE" : ""}${
                field.default !== ""
                  ? ` DEFAULT ${parseDefault(field, diagram.database)}`
                  : ""
              }${
                field.check === "" ||
                !dbToTypes[diagram.database][field.type].hasCheck
                  ? ""
                  : ` CHECK(${field.check})`
              }${field.comment ? ` -- ${field.comment}` : ""}`,
          )
          .join(",\n")}${
          table.fields.filter((f) => f.primary).length > 0
            ? `,\n\tPRIMARY KEY(${table.fields
                .filter((f) => f.primary)
                .map((f) => `"${f.name}"`)
                .join(", ")})`
            : ""
        }\n)${table.comment ? ` -- ${table.comment}` : ""};\n${`\n${table.indices
          .map(
            (i) =>
              `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX "${i.name}"\nON "${table.name}" (${i.fields
                .map((f) => `"${f}"`)
                .join(", ")});`,
          )
          .join("")}`}`,
    )
    .join("\n")}\n${diagram.references
    .map((r) => {
      const startTable = diagram.tables.find((t) => t.id === r.startTableId);
      const endTable = diagram.tables.find((t) => t.id === r.endTableId);

      if (!startTable || !endTable) return null;

      const startField = startTable.fields.find((f) => f.id === r.startFieldId);
      const endField = endTable.fields.find((f) => f.id === r.endFieldId);

      if (!startField || !endField) return null;

      return `ALTER TABLE "${startTable.name}"\nADD CONSTRAINT "${r.name}" FOREIGN KEY ("${startField.name}") REFERENCES "${endTable.name}" ("${endField.name}")\nON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};`;
    })
    .filter((sql) => sql !== null)
    .join("\n")}`;
}
