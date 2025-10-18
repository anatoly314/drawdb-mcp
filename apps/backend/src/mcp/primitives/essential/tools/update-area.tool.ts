import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class UpdateAreaTool {
  private readonly logger = new Logger(UpdateAreaTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'update_area',
    description:
      'Update properties of an existing area in the diagram. Can modify name, position, color, or indices.',
    parameters: z.object({
      areaId: z.string().describe('ID of the area to update'),
      name: z.string().optional().describe('New area name'),
      x: z.number().optional().describe('New X coordinate on canvas'),
      y: z.number().optional().describe('New Y coordinate on canvas'),
      width: z.number().optional().describe('New area width in pixels'),
      height: z.number().optional().describe('New area height in pixels'),
      color: z.string().optional().describe('New area color (hex format)'),
    }),
  })
  async updateArea(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.x !== undefined) updates.x = input.x;
      if (input.y !== undefined) updates.y = input.y;
      if (input.width !== undefined) updates.width = input.width;
      if (input.height !== undefined) updates.height = input.height;
      if (input.color !== undefined) updates.color = input.color;

      await this.drawdbClient.updateArea(input.areaId, updates);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Area ${input.areaId} updated successfully`);

      return {
        success: true,
        message: `Area ${input.areaId} updated successfully`,
        areaId: input.areaId,
        updates,
      };
    } catch (error) {
      this.logger.error('Failed to update area', error);
      throw error;
    }
  }
}
