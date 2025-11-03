import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class ExportDBMLTool {
  private readonly logger = new Logger(ExportDBMLTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'export_dbml',
    description:
      'Export the diagram as DBML (Database Markup Language). DBML is a simple, readable format for defining database schemas that can be used for documentation and version control. The format is database-agnostic and human-readable.',
    parameters: z.object({}),
  })
  async exportDBML(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const result = await this.drawdbClient.sendCommand('exportDBML');

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log('Exported DBML successfully');

      return {
        success: true,
        message: 'DBML exported successfully',
        dbml: result.dbml,
      };
    } catch (error) {
      this.logger.error('Failed to export DBML', error);
      throw error;
    }
  }
}