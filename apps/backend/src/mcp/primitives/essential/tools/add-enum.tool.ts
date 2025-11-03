import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class AddEnumTool {
  private readonly logger = new Logger(AddEnumTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'add_enum',
    description:
      'Add a new ENUM type to the diagram (PostgreSQL). ENUMs define a list of allowed values for a column, such as status types or categories.',
    parameters: z.object({
      name: z.string().describe('ENUM type name (e.g., "user_status", "priority_level")'),
      values: z
        .array(z.string())
        .describe('Array of allowed enum values (e.g., ["pending", "active", "suspended"])'),
    }),
  })
  async addEnum(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      // Step 1: Create default enum (frontend generates ID automatically)
      const createdEnum = await this.drawdbClient.sendCommand('addEnum', {
        data: null,
        addToHistory: true,
      });

      await context.reportProgress({ progress: 50, total: 100 });

      // Step 2: Update the enum with custom properties
      const updates = {
        name: input.name,
        values: input.values || [],
      };

      await this.drawdbClient.sendCommand('updateEnum', {
        id: createdEnum.id.toString(),
        updates,
      });

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Enum "${input.name}" added successfully with ID: ${createdEnum.id}`);

      return {
        success: true,
        message: `Enum "${input.name}" added successfully with ${input.values.length} values`,
        enumId: createdEnum.id,
        name: input.name,
        values: input.values,
      };
    } catch (error) {
      this.logger.error('Failed to add enum', error);
      throw error;
    }
  }
}
