import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class DeleteTableTool {
  private readonly logger = new Logger(DeleteTableTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'delete_table',
    description:
      'Delete a table from the diagram. This will also remove any relationships connected to this table.',
    parameters: z.object({
      tableId: z.string().describe('ID of the table to delete'),
    }),
  })
  async deleteTable(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      await this.drawdbClient.deleteTable(input.tableId, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Table ${input.tableId} deleted successfully`);

      return {
        success: true,
        message: `Table ${input.tableId} deleted successfully`,
        tableId: input.tableId,
      };
    } catch (error) {
      this.logger.error('Failed to delete table', error);
      throw error;
    }
  }
}
