import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class AddTypeTool {
  private readonly logger = new Logger(AddTypeTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'add_type',
    description:
      'Add a new custom composite TYPE to the diagram (PostgreSQL). Custom types define structured data types with multiple fields, similar to structs or objects.',
    parameters: z.object({
      name: z.string().describe('Type name (e.g., "address_type", "contact_info")'),
      fields: z
        .array(
          z.object({
            name: z.string().describe('Field name'),
            type: z.string().describe('Field data type'),
          }),
        )
        .optional()
        .describe('Array of fields for the composite type'),
      comment: z.string().optional().describe('Optional comment/description for the type'),
    }),
  })
  async addType(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      // Step 1: Create default type (frontend generates ID automatically)
      const createdType = await this.drawdbClient.sendCommand('addType', {
        data: null,
        addToHistory: true,
      });

      await context.reportProgress({ progress: 50, total: 100 });

      // Step 2: Update the type with custom properties
      const updates = {
        name: input.name,
        fields: input.fields || [],
        comment: input.comment || '',
      };

      await this.drawdbClient.sendCommand('updateType', {
        id: createdType.id.toString(),
        updates,
      });

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Type "${input.name}" added successfully with ID: ${createdType.id}`);

      return {
        success: true,
        message: `Type "${input.name}" added successfully with ${(input.fields || []).length} fields`,
        typeId: createdType.id,
        name: input.name,
        fields: input.fields || [],
      };
    } catch (error) {
      this.logger.error('Failed to add type', error);
      throw error;
    }
  }
}
