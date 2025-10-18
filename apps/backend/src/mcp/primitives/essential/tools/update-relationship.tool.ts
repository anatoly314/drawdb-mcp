import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class UpdateRelationshipTool {
  private readonly logger = new Logger(UpdateRelationshipTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'update_relationship',
    description:
      'Update properties of an existing relationship/foreign key. Can modify name, cardinality, or constraints.',
    parameters: z.object({
      relationshipId: z.string().describe('ID of the relationship to update'),
      name: z.string().optional().describe('New relationship name'),
      cardinality: z
        .enum(['one_to_one', 'one_to_many', 'many_to_one'])
        .optional()
        .describe('New relationship cardinality'),
      updateConstraint: z
        .enum(['No action', 'Restrict', 'Cascade', 'Set null', 'Set default'])
        .optional()
        .describe('New ON UPDATE constraint'),
      deleteConstraint: z
        .enum(['No action', 'Restrict', 'Cascade', 'Set null', 'Set default'])
        .optional()
        .describe('New ON DELETE constraint'),
      startTableId: z.string().optional().describe('New source table ID'),
      startFieldId: z.string().optional().describe('New source field ID'),
      endTableId: z.string().optional().describe('New target table ID'),
      endFieldId: z.string().optional().describe('New target field ID'),
    }),
  })
  async updateRelationship(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      const updates: Record<string, any> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.cardinality !== undefined) updates.cardinality = input.cardinality;
      if (input.updateConstraint !== undefined) updates.updateConstraint = input.updateConstraint;
      if (input.deleteConstraint !== undefined) updates.deleteConstraint = input.deleteConstraint;
      if (input.startTableId !== undefined) updates.startTableId = input.startTableId;
      if (input.startFieldId !== undefined) updates.startFieldId = input.startFieldId;
      if (input.endTableId !== undefined) updates.endTableId = input.endTableId;
      if (input.endFieldId !== undefined) updates.endFieldId = input.endFieldId;

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.updateRelationship(input.relationshipId, updates);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Relationship ${input.relationshipId} updated successfully`);

      return {
        success: true,
        message: `Relationship ${input.relationshipId} updated successfully`,
        relationshipId: input.relationshipId,
        updates,
      };
    } catch (error) {
      this.logger.error('Failed to update relationship', error);
      throw error;
    }
  }
}
