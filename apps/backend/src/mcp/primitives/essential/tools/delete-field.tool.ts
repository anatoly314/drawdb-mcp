import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class DeleteFieldTool {
  private readonly logger = new Logger(DeleteFieldTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'delete_field',
    description:
      'Delete a field from a table. This will also remove any relationships connected to this field.',
    parameters: z.object({
      tableId: z.string().describe('ID of the table containing the field'),
      fieldId: z.string().describe('ID of the field to delete'),
    }),
  })
  async deleteField(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      await this.drawdbClient.deleteField(input.tableId, input.fieldId, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Field ${input.fieldId} deleted from table ${input.tableId}`);

      return {
        success: true,
        message: `Field ${input.fieldId} deleted successfully`,
        tableId: input.tableId,
        fieldId: input.fieldId,
      };
    } catch (error) {
      this.logger.error('Failed to delete field', error);
      throw error;
    }
  }
}
