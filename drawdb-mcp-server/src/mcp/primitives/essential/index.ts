import { DynamicModule, Module } from '@nestjs/common';
import { DrawDBModule } from '../../../drawdb';
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
import { AddAreaTool } from './tools/add-area.tool';

const MCP_PRIMITIVES = [
  AddTableTool,
  UpdateTableTool,
  DeleteTableTool,
  GetDiagramTool,
  AddRelationshipTool,
  UpdateRelationshipTool,
  DeleteRelationshipTool,
  AddFieldTool,
  UpdateFieldTool,
  DeleteFieldTool,
  AddNoteTool,
  AddAreaTool,
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
export * from './tools/add-area.tool';
