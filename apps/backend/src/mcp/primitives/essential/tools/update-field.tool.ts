import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class UpdateFieldTool {
  private readonly logger = new Logger(UpdateFieldTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'update_field',
    description:
      'Update properties of an existing field in a table. Can modify name, type, constraints, or other attributes.',
    parameters: z.object({
      tableId: z.string().describe('ID of the table containing the field'),
      fieldId: z.string().describe('ID of the field to update'),
      name: z.string().optional().describe('New field name'),
      type: z.string().optional().describe('New field data type'),
      primary: z.boolean().optional().describe('New primary key status'),
      unique: z.boolean().optional().describe('New unique constraint status'),
      notNull: z.boolean().optional().describe('New NOT NULL constraint status'),
      increment: z.boolean().optional().describe('New auto-increment status'),
      default: z.string().optional().describe('New default value'),
      check: z.string().optional().describe('New check constraint'),
      comment: z.string().optional().describe('New field comment'),
    }),
  })
  async updateField(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      const updates: Record<string, any> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.type !== undefined) updates.type = input.type;
      if (input.primary !== undefined) updates.primary = input.primary;
      if (input.unique !== undefined) updates.unique = input.unique;
      if (input.notNull !== undefined) updates.notNull = input.notNull;
      if (input.increment !== undefined) updates.increment = input.increment;
      if (input.default !== undefined) updates.default = input.default;
      if (input.check !== undefined) updates.check = input.check;
      if (input.comment !== undefined) updates.comment = input.comment;

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.updateField(input.tableId, input.fieldId, updates);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Field ${input.fieldId} in table ${input.tableId} updated successfully`);

      return {
        success: true,
        message: `Field ${input.fieldId} updated successfully`,
        tableId: input.tableId,
        fieldId: input.fieldId,
        updates,
      };
    } catch (error) {
      this.logger.error('Failed to update field', error);
      throw error;
    }
  }
}
