import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';
import { nanoid } from 'nanoid';

@Injectable()
export class AddRelationshipTool {
  private readonly logger = new Logger(AddRelationshipTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'add_relationship',
    description:
      'Add a foreign key relationship between two tables in the diagram. Connects fields from different tables.',
    parameters: z.object({
      name: z.string().describe('Relationship/foreign key name'),
      startTableId: z.string().describe('ID of the source table'),
      startFieldId: z.string().describe('ID of the source field'),
      endTableId: z.string().describe('ID of the target table'),
      endFieldId: z.string().describe('ID of the target field'),
      cardinality: z
        .enum(['one_to_one', 'one_to_many', 'many_to_one'])
        .optional()
        .default('many_to_one')
        .describe('Relationship cardinality'),
      updateConstraint: z
        .enum(['No action', 'Restrict', 'Cascade', 'Set null', 'Set default'])
        .optional()
        .default('No action')
        .describe('ON UPDATE constraint'),
      deleteConstraint: z
        .enum(['No action', 'Restrict', 'Cascade', 'Set null', 'Set default'])
        .optional()
        .default('No action')
        .describe('ON DELETE constraint'),
    }),
  })
  async addRelationship(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      const relationshipId = nanoid();
      const relationshipData = {
        id: relationshipId,
        name: input.name,
        startTableId: input.startTableId,
        startFieldId: input.startFieldId,
        endTableId: input.endTableId,
        endFieldId: input.endFieldId,
        cardinality: input.cardinality || 'many_to_one',
        updateConstraint: input.updateConstraint || 'No action',
        deleteConstraint: input.deleteConstraint || 'No action',
      };

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.addRelationship(relationshipData, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Relationship "${input.name}" added successfully`);

      return {
        success: true,
        message: `Relationship "${input.name}" added successfully`,
        relationshipId,
      };
    } catch (error) {
      this.logger.error('Failed to add relationship', error);
      throw error;
    }
  }
}
