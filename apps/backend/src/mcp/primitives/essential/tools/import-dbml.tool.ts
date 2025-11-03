import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class ImportDBMLTool {
  private readonly logger = new Logger(ImportDBMLTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'import_dbml',
    description:
      'Import a database schema from DBML (Database Markup Language) format. DBML is a simple, readable DSL for defining database schemas. This will parse the DBML and create tables, relationships, and enums in the diagram. Replaces the current diagram by default.',
    parameters: z.object({
      dbml: z.string().describe('DBML string containing the database schema definition'),
      clearCurrent: z
        .boolean()
        .optional()
        .default(true)
        .describe('Clear current diagram before importing (default: true)'),
    }),
  })
  async importDBML(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      // Validate DBML is not empty
      if (!input.dbml || typeof input.dbml !== 'string' || !input.dbml.trim()) {
        throw new Error('DBML content is required and must be a non-empty string');
      }

      await context.reportProgress({ progress: 30, total: 100 });

      // Import the DBML
      const result = await this.drawdbClient.sendCommand('importDBML', {
        dbml: input.dbml,
        clearCurrent: input.clearCurrent ?? true,
      });

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log('DBML imported successfully');

      return {
        success: true,
        message: 'DBML imported successfully',
        imported: result.imported,
      };
    } catch (error) {
      this.logger.error('Failed to import DBML', error);
      throw error;
    }
  }
}