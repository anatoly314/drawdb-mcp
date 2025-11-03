import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class UpdateEnumTool {
  private readonly logger = new Logger(UpdateEnumTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'update_enum',
    description: 'Update properties of an existing ENUM type. Can modify name or values list.',
    parameters: z.object({
      enumId: z.string().describe('ID of the enum to update'),
      name: z.string().optional().describe('New enum type name'),
      values: z.array(z.string()).optional().describe('New array of allowed enum values'),
    }),
  })
  async updateEnum(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.values !== undefined) updates.values = input.values;

      await this.drawdbClient.sendCommand('updateEnum', {
        id: input.enumId,
        updates,
      });

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Enum ${input.enumId} updated successfully`);

      return {
        success: true,
        message: `Enum ${input.enumId} updated successfully`,
        enumId: input.enumId,
        updates,
      };
    } catch (error) {
      this.logger.error('Failed to update enum', error);
      throw error;
    }
  }
}
