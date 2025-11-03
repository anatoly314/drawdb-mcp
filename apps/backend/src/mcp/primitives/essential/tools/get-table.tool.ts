import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class GetTableTool {
  private readonly logger = new Logger(GetTableTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'get_table',
    description:
      'Get detailed information about a specific table by ID or name. Returns table structure, fields, indices, and metadata.',
    parameters: z.object({
      tableId: z.string().optional().describe('Table ID to look up'),
      tableName: z.string().optional().describe('Table name to look up'),
    }),
  })
  async getTable(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      if (!input.tableId && !input.tableName) {
        throw new Error('Either tableId or tableName must be provided');
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const table = await this.drawdbClient.getTable(input.tableId, input.tableName);

      await context.reportProgress({ progress: 100, total: 100 });

      if (!table) {
        throw new Error(`Table not found: ${input.tableId || input.tableName}`);
      }

      this.logger.log(`Retrieved table: ${table.name}`);

      return {
        success: true,
        table,
        summary: {
          name: table.name,
          fieldCount: table.fields?.length || 0,
          indexCount: table.indices?.length || 0,
          color: table.color,
          position: { x: table.x, y: table.y },
        },
      };
    } catch (error) {
      this.logger.error('Failed to get table', error);
      throw error;
    }
  }
}
