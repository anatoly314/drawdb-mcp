import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '../../../../drawdb/drawdb-client.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AddNoteTool {
  private readonly logger = new Logger(AddNoteTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'add_note',
    description:
      'Add a sticky note to the diagram for annotations, comments, or documentation. Useful for explaining design decisions.',
    parameters: z.object({
      title: z.string().describe('Note title (used as identifier for updates/deletes)'),
      content: z.string().describe('Note content/text'),
      x: z.number().optional().describe('X coordinate on canvas (optional, defaults to 100)'),
      y: z.number().optional().describe('Y coordinate on canvas (optional, defaults to 100)'),
      color: z.string().optional().describe('Note color (optional, defaults to #ffd93d)'),
      width: z.number().optional().describe('Note width in pixels (optional, defaults to 240)'),
      height: z.number().optional().describe('Note height in pixels (optional, defaults to 120)'),
    }),
  })
  async addNote(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 10, total: 100 });

      const noteId = nanoid();
      const noteData = {
        id: noteId,
        title: input.title,
        content: input.content,
        x: input.x ?? 100,
        y: input.y ?? 100,
        color: input.color || '#ffd93d',
        width: input.width ?? 240,
        height: input.height ?? 120,
      };

      await context.reportProgress({ progress: 50, total: 100 });

      await this.drawdbClient.addNote(noteData, true);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Note added successfully`);

      return {
        success: true,
        message: 'Note added successfully',
        noteId,
      };
    } catch (error) {
      this.logger.error('Failed to add note', error);
      throw error;
    }
  }
}
