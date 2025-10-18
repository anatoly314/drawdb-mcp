import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class DeleteTypeTool {
  private readonly logger = new Logger(DeleteTypeTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'delete_type',
    description:
      'Delete a custom composite TYPE from the diagram. This will remove the type definition but may affect tables that reference it.',
    parameters: z.object({
      typeId: z.string().describe('ID of the type to delete'),
    }),
  })
  async deleteType(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      await this.drawdbClient.sendCommand('deleteType', {
        id: input.typeId,
        addToHistory: true,
      });

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Type ${input.typeId} deleted successfully`);

      return {
        success: true,
        message: `Type ${input.typeId} deleted successfully`,
        typeId: input.typeId,
      };
    } catch (error) {
      this.logger.error('Failed to delete type', error);
      throw error;
    }
  }
}
