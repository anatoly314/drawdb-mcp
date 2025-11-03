import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class UpdateTableTool {
  private readonly logger = new Logger(UpdateTableTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'update_table',
    description:
      'Update properties of an existing table in the diagram. Can modify name, position, color, comment, or indices.',
    parameters: z.object({
      tableId: z.string().describe('ID of the table to update'),
      name: z.string().optional().describe('New table name'),
      x: z.number().optional().describe('New X coordinate on canvas'),
      y: z.number().optional().describe('New Y coordinate on canvas'),
      color: z.string().optional().describe('New table color (hex format)'),
      comment: z.string().optional().describe('New table comment'),
      indices: z
        .array(
          z.object({
            name: z.string(),
            fields: z.array(z.string()),
            unique: z.boolean().optional().default(false),
          }),
        )
        .optional()
        .describe('New indices configuration'),
    }),
  })
  async updateTable(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      const updates: Record<string, any> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.x !== undefined) updates.x = input.x;
      if (input.y !== undefined) updates.y = input.y;
      if (input.color !== undefined) updates.color = input.color;
      if (input.comment !== undefined) updates.comment = input.comment;
      if (input.indices !== undefined) updates.indices = input.indices;

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.updateTable(input.tableId, updates);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Table ${input.tableId} updated successfully`);

      return {
        success: true,
        message: `Table ${input.tableId} updated successfully`,
        tableId: input.tableId,
        updates,
      };
    } catch (error) {
      this.logger.error('Failed to update table', error);
      throw error;
    }
  }
}
