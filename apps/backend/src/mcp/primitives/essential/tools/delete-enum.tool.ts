import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class DeleteEnumTool {
  private readonly logger = new Logger(DeleteEnumTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'delete_enum',
    description:
      'Delete an ENUM type from the diagram. This will remove the enum definition but may affect tables that reference it.',
    parameters: z.object({
      enumId: z.string().describe('ID of the enum to delete'),
    }),
  })
  async deleteEnum(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      await this.drawdbClient.sendCommand('deleteEnum', {
        id: input.enumId,
        addToHistory: true,
      });

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Enum ${input.enumId} deleted successfully`);

      return {
        success: true,
        message: `Enum ${input.enumId} deleted successfully`,
        enumId: input.enumId,
      };
    } catch (error) {
      this.logger.error('Failed to delete enum', error);
      throw error;
    }
  }
}
