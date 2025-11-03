import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class DeleteRelationshipTool {
  private readonly logger = new Logger(DeleteRelationshipTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'delete_relationship',
    description:
      'Delete a relationship/foreign key from the diagram. Removes the connection between two tables.',
    parameters: z.object({
      relationshipId: z.string().describe('ID of the relationship to delete'),
    }),
  })
  async deleteRelationship(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      await this.drawdbClient.deleteRelationship(input.relationshipId, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Relationship ${input.relationshipId} deleted successfully`);

      return {
        success: true,
        message: `Relationship ${input.relationshipId} deleted successfully`,
        relationshipId: input.relationshipId,
      };
    } catch (error) {
      this.logger.error('Failed to delete relationship', error);
      throw error;
    }
  }
}
