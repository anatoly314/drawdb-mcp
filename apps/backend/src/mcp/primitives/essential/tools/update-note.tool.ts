import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { DrawDBClientService } from '@/drawdb';

@Injectable()
export class UpdateNoteTool {
  private readonly logger = new Logger(UpdateNoteTool.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  @Tool({
    name: 'update_note',
    description:
      'Update properties of an existing sticky note in the diagram. Can modify title, content, position, size, or color.',
    parameters: z.object({
      noteId: z.string().describe('ID of the note to update'),
      title: z.string().optional().describe('New note title'),
      content: z.string().optional().describe('New note content/text'),
      x: z.number().optional().describe('New X coordinate on canvas'),
      y: z.number().optional().describe('New Y coordinate on canvas'),
      width: z.number().optional().describe('New note width in pixels'),
      height: z.number().optional().describe('New note height in pixels'),
      color: z.string().optional().describe('New note color theme'),
    }),
  })
  async updateNote(input: any, context: Context) {
    try {
      if (!this.drawdbClient.isConnected()) {
        throw new Error(
          'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
        );
      }

      await context.reportProgress({ progress: 25, total: 100 });

      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.content !== undefined) updates.content = input.content;
      if (input.x !== undefined) updates.x = input.x;
      if (input.y !== undefined) updates.y = input.y;
      if (input.width !== undefined) updates.width = input.width;
      if (input.height !== undefined) updates.height = input.height;
      if (input.color !== undefined) updates.color = input.color;

      await this.drawdbClient.updateNote(input.noteId, updates);

      await context.reportProgress({ progress: 100, total: 100 });

      this.logger.log(`Note ${input.noteId} updated successfully`);

      return {
        success: true,
        message: `Note ${input.noteId} updated successfully`,
        noteId: input.noteId,
        updates,
      };
    } catch (error) {
      this.logger.error('Failed to update note', error);
      throw error;
    }
  }
}
