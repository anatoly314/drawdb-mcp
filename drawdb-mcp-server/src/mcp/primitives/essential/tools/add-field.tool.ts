import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AddFieldTool {
  private readonly logger = new Logger(AddFieldTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'add_field',
    description:
      'Add a new field to an existing table in the diagram. Use this to add columns after table creation.',
    parameters: z.object({
      tableId: z.string().describe('ID of the table to add the field to'),
      name: z.string().describe('Field name'),
      type: z.string().describe('Field data type (e.g., INTEGER, VARCHAR, TEXT)'),
      primary: z.boolean().optional().default(false).describe('Is primary key'),
      unique: z.boolean().optional().default(false).describe('Has unique constraint'),
      notNull: z.boolean().optional().default(false).describe('Has NOT NULL constraint'),
      increment: z.boolean().optional().default(false).describe('Auto-increment'),
      default: z.string().optional().default('').describe('Default value'),
      check: z.string().optional().default('').describe('Check constraint'),
      comment: z.string().optional().default('').describe('Field comment'),
    }),
  })
  async addField(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      const fieldId = nanoid();
      const fieldData = {
        id: fieldId,
        name: input.name,
        type: input.type,
        primary: input.primary || false,
        unique: input.unique || false,
        notNull: input.notNull || false,
        increment: input.increment || false,
        default: input.default || '',
        check: input.check || '',
        comment: input.comment || '',
      };

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.addField(input.tableId, fieldData);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Field "${input.name}" added to table ${input.tableId}`);

      return {
        success: true,
        message: `Field "${input.name}" added to table ${input.tableId}`,
        fieldId,
        tableId: input.tableId,
      };
    } catch (error) {
      this.logger.error('Failed to add field', error);
      throw error;
    }
  }
}
