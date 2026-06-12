import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class SetDatabaseTool {
  private readonly logger = new Logger(SetDatabaseTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'set_database',
    description:
      'Set the database dialect for the diagram. This controls SQL export output and which features are available (e.g. enums and composite types are PostgreSQL-only). Choose "postgresql" for the richest feature set (enums, composite types, advanced constraints), "mysql" or "mariadb" for typical web stacks, "sqlite" for embedded/local databases, "transactsql" for Microsoft SQL Server, "oraclesql" for Oracle, or "generic" for a database-agnostic diagram (note: "generic" produces an empty SQL export).',
    parameters: z.object({
      database: z
        .enum(['mysql', 'postgresql', 'transactsql', 'sqlite', 'mariadb', 'oraclesql', 'generic'])
        .describe('Database dialect to use for the diagram'),
    }),
  })
  async setDatabase(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      await this.drawdbClient.setDatabase(input.database);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Database set to "${input.database}"`);

      return {
        success: true,
        message: `Database set to "${input.database}"`,
        database: input.database,
      };
    } catch (error) {
      this.logger.error('Failed to set database', error);
      throw error;
    }
  }
}
