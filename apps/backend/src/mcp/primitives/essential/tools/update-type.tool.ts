import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class UpdateTypeTool {
  private readonly logger = new Logger(UpdateTypeTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'update_type',
    description:
      'Update properties of an existing custom composite TYPE. Can modify name, fields, or comment.',
    parameters: z.object({
      typeId: z.string().describe('ID of the type to update'),
      name: z.string().optional().describe('New type name'),
      fields: z
        .array(
          z.object({
            name: z.string().describe('Field name'),
            type: z.string().describe('Field data type'),
          }),
        )
        .optional()
        .describe('New array of fields for the composite type'),
      comment: z.string().optional().describe('New comment/description for the type'),
    }),
  })
  async updateType(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.fields !== undefined) updates.fields = input.fields;
      if (input.comment !== undefined) updates.comment = input.comment;

      await this.drawdbClient.sendCommand('updateType', {
        id: input.typeId,
        updates,
      });

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Type ${input.typeId} updated successfully`);

      return {
        success: true,
        message: `Type ${input.typeId} updated successfully`,
        typeId: input.typeId,
        updates,
      };
    } catch (error) {
      this.logger.error('Failed to update type', error);
      throw error;
    }
  }
}
