import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class GetDiagramTool {
  private readonly logger = new Logger(GetDiagramTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'get_diagram',
    description:
      'Get the current state of the database diagram including all tables, relationships, areas, notes, and types.',
    parameters: z.object({}),
  })
  async getDiagram(_input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const diagram = await this.drawdbClient.getDiagram();

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log('Retrieved diagram state');

      return {
        success: true,
        diagram,
        summary: {
          database: diagram.database,
          tableCount: diagram.tables?.length || 0,
          relationshipCount: diagram.relationships?.length || 0,
          areaCount: diagram.areas?.length || 0,
          noteCount: diagram.notes?.length || 0,
          tables: diagram.tables?.map((t: any) => ({
            id: t.id,
            name: t.name,
            fieldCount: t.fields?.length || 0,
          })),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get diagram', error);
      throw error;
    }
  }
}
