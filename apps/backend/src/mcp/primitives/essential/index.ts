import { DynamicModule, Module } from '@nestjs/common';
import { DrawDBModule } from '@/drawdb';
import { AddTableTool } from './tools/add-table.tool';
import { UpdateTableTool } from './tools/update-table.tool';
import { DeleteTableTool } from './tools/delete-table.tool';
import { GetDiagramTool } from './tools/get-diagram.tool';
import { AddRelationshipTool } from './tools/add-relationship.tool';
import { UpdateRelationshipTool } from './tools/update-relationship.tool';
import { DeleteRelationshipTool } from './tools/delete-relationship.tool';
import { AddFieldTool } from './tools/add-field.tool';
import { UpdateFieldTool } from './tools/update-field.tool';
import { DeleteFieldTool } from './tools/delete-field.tool';
import { AddNoteTool } from './tools/add-note.tool';
import { UpdateNoteTool } from './tools/update-note.tool';
import { DeleteNoteTool } from './tools/delete-note.tool';
import { AddAreaTool } from './tools/add-area.tool';
import { UpdateAreaTool } from './tools/update-area.tool';
import { DeleteAreaTool } from './tools/delete-area.tool';
import { AddEnumTool } from './tools/add-enum.tool';
import { UpdateEnumTool } from './tools/update-enum.tool';
import { DeleteEnumTool } from './tools/delete-enum.tool';
import { AddTypeTool } from './tools/add-type.tool';
import { UpdateTypeTool } from './tools/update-type.tool';
import { DeleteTypeTool } from './tools/delete-type.tool';
import { ExportDiagramTool } from './tools/export-diagram.tool';
import { ImportDiagramTool } from './tools/import-diagram.tool';
import { GetTableTool } from './tools/get-table.tool';

const MCP_PRIMITIVES = [
  AddTableTool,
  UpdateTableTool,
  DeleteTableTool,
  GetDiagramTool,
  GetTableTool,
  AddRelationshipTool,
  UpdateRelationshipTool,
  DeleteRelationshipTool,
  AddFieldTool,
  UpdateFieldTool,
  DeleteFieldTool,
  AddNoteTool,
  UpdateNoteTool,
  DeleteNoteTool,
  AddAreaTool,
  UpdateAreaTool,
  DeleteAreaTool,
  AddEnumTool,
  UpdateEnumTool,
  DeleteEnumTool,
  AddTypeTool,
  UpdateTypeTool,
  DeleteTypeTool,
  ExportDiagramTool,
  ImportDiagramTool,
];

/**
 * MCP Primitives for DrawDB
 */
@Module({})
export class McpPrimitivesDrawDBModule {
  static forRoot(): DynamicModule {
    return {
      module: McpPrimitivesDrawDBModule,
      imports: [DrawDBModule],
      providers: [...MCP_PRIMITIVES],
      exports: [DrawDBModule, ...MCP_PRIMITIVES],
    };
  }
}

// Export tools
export * from './tools/add-table.tool';
export * from './tools/update-table.tool';
export * from './tools/delete-table.tool';
export * from './tools/get-diagram.tool';
export * from './tools/add-relationship.tool';
export * from './tools/update-relationship.tool';
export * from './tools/delete-relationship.tool';
export * from './tools/add-field.tool';
export * from './tools/update-field.tool';
export * from './tools/delete-field.tool';
export * from './tools/add-note.tool';
export * from './tools/update-note.tool';
export * from './tools/delete-note.tool';
export * from './tools/add-area.tool';
export * from './tools/update-area.tool';
export * from './tools/delete-area.tool';
export * from './tools/add-enum.tool';
export * from './tools/update-enum.tool';
export * from './tools/delete-enum.tool';
export * from './tools/add-type.tool';
export * from './tools/update-type.tool';
export * from './tools/delete-type.tool';
export * from './tools/export-diagram.tool';
export * from './tools/import-diagram.tool';
export * from './tools/get-table.tool';
