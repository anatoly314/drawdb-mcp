import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class ImportDiagramTool {
  private readonly logger = new Logger(ImportDiagramTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'import_diagram',
    description:
      'Import a complete diagram from JSON. Replaces the current diagram with the provided one. Use this to load previously exported diagrams.',
    parameters: z.object({
      json: z
        .string()
        .describe('JSON string containing the complete diagram structure'),
      clearCurrent: z
        .boolean()
        .optional()
        .default(true)
        .describe('Clear current diagram before importing (default: true)'),
    }),
  })
  async importDiagram(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      // Parse and validate JSON
      let diagram;
      try {
        diagram = JSON.parse(input.json);
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Invalid JSON: ${errorMsg}`);
      }

      // Validate required structure
      if (!diagram || typeof diagram !== 'object') {
        throw new Error('Diagram must be a valid JSON object');
      }

      await context.reportProgress({ progress: 30, total: 100 });

      // Import the diagram
      await this.drawdbClient.importDiagram(diagram, input.clearCurrent ?? true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log('Diagram imported successfully');

      return {
        success: true,
        message: 'Diagram imported successfully',
        imported: {
          database: diagram.database,
          tableCount: diagram.tables?.length || 0,
          relationshipCount: diagram.relationships?.length || 0,
          noteCount: diagram.notes?.length || 0,
          areaCount: diagram.areas?.length || 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to import diagram', error);
      throw error;
    }
  }
}
