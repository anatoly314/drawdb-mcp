import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';
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

      // Step 1: Create default table (frontend generates ID automatically)
      const createdTable = await this.drawdbClient.addTable(null, true);

      if (!createdTable || !createdTable.id) {
        throw new Error('Failed to create table: invalid response from frontend');
      }

      await context.reportProgress({ progress: 40, total: 100 });

      // Step 2: Prepare custom fields with generated IDs
      const fields =
        input.fields && input.fields.length > 0
          ? input.fields.map((field: any) => ({
              ...field,
              id: nanoid(),
              default: field.default || '',
              check: field.check || '',
              comment: field.comment || '',
            }))
          : createdTable.fields || []; // Keep default fields if none provided

      // Step 3: Update the table with custom properties
      const updates = {
        name: input.name,
        x: input.x ?? createdTable.x,
        y: input.y ?? createdTable.y,
        fields,
        comment: input.comment || '',
        color: input.color || createdTable.color,
      };

      await this.drawdbClient.updateTable(createdTable.id, updates);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Table "${input.name}" added successfully`);

      // Validate all fields have IDs before returning
      const fieldIds = fields
        .filter((f: any) => f && f.id)
        .map((f: any) => ({ name: f.name, id: f.id }));

      if (fieldIds.length !== fields.length) {
        this.logger.warn(
          `Warning: Some fields are missing IDs. Expected ${fields.length}, got ${fieldIds.length}`,
        );
      }

      return {
        success: true,
        message: `Table "${input.name}" added successfully`,
        tableId: createdTable.id,
        fieldIds,
      };
    } catch (error) {
      this.logger.error('Failed to add table', error);
      throw error;
    }
  }
}
