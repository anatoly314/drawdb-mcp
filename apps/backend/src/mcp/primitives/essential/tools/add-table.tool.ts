import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AddTableTool {
  private readonly logger = new Logger(AddTableTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'add_table',
    description:
      'Add a new table to the database diagram. Creates a table with specified fields at given coordinates.',
    parameters: z.object({
      name: z.string().describe('Table name'),
      x: z.number().optional().describe('X coordinate on canvas (optional, defaults to 100)'),
      y: z.number().optional().describe('Y coordinate on canvas (optional, defaults to 100)'),
      fields: z
        .array(
          z.object({
            name: z.string(),
            type: z.string(),
            primary: z.boolean().optional().default(false),
            unique: z.boolean().optional().default(false),
            notNull: z.boolean().optional().default(false),
            increment: z.boolean().optional().default(false),
            default: z.string().optional().default(''),
            check: z.string().optional().default(''),
            comment: z.string().optional().default(''),
          }),
        )
        .optional()
        .describe('Array of fields (optional, will create default id field if not provided)'),
      color: z.string().optional().describe('Table color (optional, defaults to #175e7a)'),
      comment: z.string().optional().describe('Table comment (optional)'),
    }),
  })
  async addTable(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      // Generate IDs for table and fields
      const tableId = nanoid();
      const fields =
        input.fields && input.fields.length > 0
          ? input.fields.map((field: any) => ({
              ...field,
              id: nanoid(),
              default: field.default || '',
              check: field.check || '',
              comment: field.comment || '',
            }))
          : [
              {
                id: nanoid(),
                name: 'id',
                type: 'INTEGER',
                primary: true,
                unique: true,
                notNull: true,
                increment: true,
                default: '',
                check: '',
                comment: '',
              },
            ];

      const tableData = {
        id: tableId,
        name: input.name,
        x: input.x ?? 100,
        y: input.y ?? 100,
        locked: false,
        fields,
        comment: input.comment || '',
        indices: [],
        color: input.color || '#175e7a',
      };

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.addTable(tableData, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Table "${input.name}" added successfully`);

      return {
        success: true,
        message: `Table "${input.name}" added successfully`,
        tableId,
        fieldIds: fields.map((f: any) => ({ name: f.name, id: f.id })),
      };
    } catch (error) {
      this.logger.error('Failed to add table', error);
      throw error;
    }
  }
}
