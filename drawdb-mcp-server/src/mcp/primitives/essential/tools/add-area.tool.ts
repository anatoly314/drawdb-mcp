import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AddAreaTool {
  private readonly logger = new Logger(AddAreaTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'add_area',
    description:
      'Add a rectangular area to the diagram for grouping related tables. Use this to visually organize tables by domain or module.',
    parameters: z.object({
      name: z.string().describe('Area name/label'),
      x: z.number().optional().describe('X coordinate on canvas (optional, defaults to 50)'),
      y: z.number().optional().describe('Y coordinate on canvas (optional, defaults to 50)'),
      width: z.number().optional().describe('Area width in pixels (optional, defaults to 400)'),
      height: z.number().optional().describe('Area height in pixels (optional, defaults to 300)'),
      color: z.string().optional().describe('Area color (optional, defaults to #eb9f34)'),
    }),
  })
  async addArea(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      const areaId = nanoid();
      const areaData = {
        id: areaId,
        name: input.name,
        x: input.x ?? 50,
        y: input.y ?? 50,
        width: input.width ?? 400,
        height: input.height ?? 300,
        color: input.color || '#eb9f34',
      };

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.addArea(areaData, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Area "${input.name}" added successfully`);

      return {
        success: true,
        message: `Area "${input.name}" added successfully`,
        areaId,
      };
    } catch (error) {
      this.logger.error('Failed to add area', error);
      throw error;
    }
  }
}
