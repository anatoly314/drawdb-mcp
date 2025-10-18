import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';

@Injectable()
export class DeleteNoteTool {
  private readonly logger = new Logger(DeleteNoteTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'delete_note',
    description:
      'Delete a sticky note from the diagram. This will remove the note annotation from the canvas.',
    parameters: z.object({
      noteId: z.string().describe('ID of the note to delete'),
    }),
  })
  async deleteNote(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      await this.drawdbClient.deleteNote(input.noteId, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Note ${input.noteId} deleted successfully`);

      return {
        success: true,
        message: `Note ${input.noteId} deleted successfully`,
        noteId: input.noteId,
      };
    } catch (error) {
      this.logger.error('Failed to delete note', error);
      throw error;
    }
  }
}
