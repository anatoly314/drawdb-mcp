import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class DeleteAreaTool {
  private readonly logger = new Logger(DeleteAreaTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'delete_area',
    description:
      'Delete a rectangular area from the diagram. Removes the area grouping but does not affect the tables within it.',
    parameters: z.object({
      areaId: z.string().describe('ID of the area to delete'),
    }),
  })
  async deleteArea(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      await this.drawdbClient.deleteArea(input.areaId, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Area ${input.areaId} deleted successfully`);

      return {
        success: true,
        message: `Area ${input.areaId} deleted successfully`,
        areaId: input.areaId,
      };
    } catch (error) {
      this.logger.error('Failed to delete area', error);
      throw error;
    }
  }
}
