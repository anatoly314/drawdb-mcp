import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class ExportDiagramTool {
  private readonly logger = new Logger(ExportDiagramTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'export_diagram',
    description:
      'Export the complete diagram as JSON. Returns the full diagram structure that can be saved and later imported. Useful for persisting AI-created diagrams.',
    parameters: z.object({
      formatted: z
        .boolean()
        .optional()
        .default(false)
        .describe('Pretty-print JSON with indentation (default: false for compact)'),
    }),
  })
  async exportDiagram(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const diagram = await this.drawdbClient.getDiagram();

      await context.reportProgress({ progress: 75, total: 100 });

      // Format JSON based on user preference
      const json = input.formatted
        ? JSON.stringify(diagram, null, 2)
        : JSON.stringify(diagram);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log('Diagram exported successfully');

      return {
        success: true,
        message: 'Diagram exported successfully',
        json,
        summary: {
          database: diagram.database,
          tableCount: diagram.tables?.length || 0,
          relationshipCount: diagram.relationships?.length || 0,
          noteCount: diagram.notes?.length || 0,
          areaCount: diagram.areas?.length || 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to export diagram', error);
      throw error;
    }
  }
}
