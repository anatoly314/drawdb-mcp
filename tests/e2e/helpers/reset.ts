import { callTool } from './mcp';

interface ToolResult {
  success?: boolean;
  message?: string;
  [k: string]: unknown;
}

const EMPTY_DIAGRAM = {
  tables: [],
  relationships: [],
  areas: [],
  notes: [],
  enums: [],
  types: [],
};

export function resetDiagram(): void {
  const result = callTool('import_diagram', {
    json: JSON.stringify(EMPTY_DIAGRAM),
    clearCurrent: true,
  }) as ToolResult;

  if (result && result.success === false) {
    throw new Error(
      `resetDiagram failed: ${result.message ?? JSON.stringify(result)}`,
    );
  }
}
