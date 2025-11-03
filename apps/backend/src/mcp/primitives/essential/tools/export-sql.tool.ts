import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class ExportSQLTool {
  private readonly logger = new Logger(ExportSQLTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'export_sql',
    description:
      'Export the diagram as SQL DDL statements for the current database type. Returns CREATE TABLE, CREATE INDEX, ALTER TABLE, and other SQL statements. The SQL format is specific to the database type set in the diagram (MySQL, PostgreSQL, SQLite, MariaDB, MSSQL, OracleSQL).',
    parameters: z.object({}),
  })
  async exportSQL(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const result = await this.drawdbClient.sendCommand('exportSQL');

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Exported SQL for database: ${result.database}`);

      return {
        success: true,
        message: `SQL exported successfully for ${result.database}`,
        sql: result.sql,
        database: result.database,
      };
    } catch (error) {
      this.logger.error('Failed to export SQL', error);
      throw error;
    }
  }
}