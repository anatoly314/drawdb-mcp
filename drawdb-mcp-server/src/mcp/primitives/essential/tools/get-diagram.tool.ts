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
      'Get a high-level summary of the database diagram. Returns table names/IDs and counts only - use get_table for detailed table information.',
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

      this.logger.log('Retrieved diagram summary');

      // Return only summary data to avoid token limit issues
      return {
        success: true,
        summary: {
          database: diagram.database,
          tableCount: diagram.tables?.length || 0,
          relationshipCount: diagram.relationships?.length || 0,
          areaCount: diagram.areas?.length || 0,
          noteCount: diagram.notes?.length || 0,
          enumCount: diagram.enums?.length || 0,
          typeCount: diagram.types?.length || 0,
          tables: diagram.tables?.map((t: any) => ({
            id: t.id,
            name: t.name,
            fieldCount: t.fields?.length || 0,
            color: t.color,
          })),
          relationships: diagram.relationships?.map((r: any) => ({
            id: r.id,
            name: r.name,
            cardinality: r.cardinality,
            startTableId: r.startTableId,
            endTableId: r.endTableId,
          })),
          notes: diagram.notes?.map((n: any) => ({
            id: n.id,
            content: n.content?.substring(0, 100), // First 100 chars
          })),
          areas: diagram.areas?.map((a: any) => ({
            id: a.id,
            name: a.name,
          })),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get diagram', error);
      throw error;
    }
  }
}
