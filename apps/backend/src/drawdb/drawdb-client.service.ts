import { Injectable, Logger } from '@nestjs/common';
import { DrawDBCommand, DrawDBResponse } from './drawdb.types';

/**
 * Service for managing WebSocket communication with DrawDB client
 */
@Injectable()
export class DrawDBClientService {
  private readonly logger = new Logger(DrawDBClientService.name);
  private ws: any = null;
  private isSettingConnection = false; // Lock to prevent race conditions
  private pendingRequests = new Map<
    string,
    { resolve: (value: any) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }
  >();
  private requestTimeout = 30000; // 30 seconds

  /**
   * Set the WebSocket connection
   * Closes any existing connection to ensure only one GUI is active at a time
   * Uses a lock to prevent race conditions from simultaneous connections
   */
  async setConnection(ws: any) {
    // Wait if another connection is being set up (prevents race condition)
    let waitCount = 0;
    while (this.isSettingConnection && waitCount < 20) {
      // Wait max 2 seconds (20 * 100ms)
      this.logger.warn(
        `Connection setup already in progress, waiting... (${waitCount + 1}/20)`,
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitCount++;
    }

    if (this.isSettingConnection) {
      this.logger.error('Connection setup timeout - forcing connection replacement');
      this.isSettingConnection = false; // Force unlock
    }

    // Set lock
    this.isSettingConnection = true;

    try {
      // Close existing connection if present
      if (this.ws) {
        const oldWs = this.ws;
        const isOpen = oldWs.readyState === 1; // WebSocket.OPEN = 1

        if (isOpen) {
          this.logger.log(
            'Closing previous DrawDB client connection - new client connecting',
          );

          // Remove event handlers from old connection to prevent interference
          oldWs.removeAllListeners();

          // Close the old connection
          oldWs.close(1000, 'Replaced by new connection');

          // Wait a tiny bit for close to propagate
          await new Promise((resolve) => setTimeout(resolve, 50));
        } else {
          this.logger.debug(
            `Previous connection already closed (state: ${oldWs.readyState})`,
          );
        }
      }

      this.ws = ws;
      this.logger.log('DrawDB client connected');

      // Setup message handler
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);

          // Handle ping/pong heartbeat
          if (message.type === 'ping') {
            this.logger.debug('Received ping, sending pong');
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }

          // Handle normal command responses
          const response: DrawDBResponse = message;
          this.handleResponse(response);
        } catch (error) {
          this.logger.error('Failed to parse message from DrawDB client:', error);
        }
      });

      // Setup close handler
      ws.on('close', () => {
        this.logger.log('DrawDB client disconnected');
        this.ws = null;
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject, timeout }) => {
          clearTimeout(timeout);
          reject(new Error('DrawDB client disconnected'));
        });
        this.pendingRequests.clear();
      });
    } finally {
      // Release lock
      this.isSettingConnection = false;
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === 1; // WebSocket.OPEN
  }

  /**
   * Send a command to DrawDB and wait for response
   */
  async sendCommand<T = any>(command: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.isConnected()) {
      throw new Error(
        'DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.',
      );
    }

    const id = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: DrawDBCommand = { id, command, params };

    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Command ${command} timed out after ${this.requestTimeout}ms`));
      }, this.requestTimeout);

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timeout });

      // Send command
      try {
        this.ws.send(JSON.stringify(message));
        this.logger.debug(`Sent command: ${command} (${id})`);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Handle response from DrawDB client
   */
  private handleResponse(response: DrawDBResponse) {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      this.logger.warn(`Received response for unknown request: ${response.id}`);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.success) {
      this.logger.debug(`Command ${response.id} succeeded`);
      pending.resolve(response.data);
    } else {
      this.logger.error(`Command ${response.id} failed: ${response.error}`);
      pending.reject(new Error(response.error || 'Unknown error'));
    }
  }

  /**
   * Get the current diagram state
   */
  async getDiagram() {
    return this.sendCommand('getDiagram');
  }

  /**
   * Add a table to the diagram
   */
  async addTable(data: any, addToHistory = true) {
    return this.sendCommand('addTable', { data, addToHistory });
  }

  /**
   * Update a table
   */
  async updateTable(id: string, updates: any) {
    return this.sendCommand('updateTable', { id, updates });
  }

  /**
   * Delete a table
   */
  async deleteTable(id: string, addToHistory = true) {
    return this.sendCommand('deleteTable', { id, addToHistory });
  }

  /**
   * Add a field to a table
   */
  async addField(tableId: string, field: any) {
    return this.sendCommand('addField', { tableId, field });
  }

  /**
   * Update a field
   */
  async updateField(tableId: string, fieldId: string, updates: any) {
    return this.sendCommand('updateField', { tableId, fieldId, updates });
  }

  /**
   * Delete a field
   */
  async deleteField(tableId: string, fieldId: string, addToHistory = true) {
    return this.sendCommand('deleteField', { tableId, fieldId, addToHistory });
  }

  /**
   * Add a relationship
   */
  async addRelationship(data: any, addToHistory = true) {
    return this.sendCommand('addRelationship', { data, addToHistory });
  }

  /**
   * Update a relationship
   */
  async updateRelationship(id: string, updates: any) {
    return this.sendCommand('updateRelationship', { id, updates });
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(id: string, addToHistory = true) {
    return this.sendCommand('deleteRelationship', { id, addToHistory });
  }

  /**
   * Add an area
   */
  async addArea(data: any, addToHistory = true) {
    return this.sendCommand('addArea', { data, addToHistory });
  }

  /**
   * Update an area
   */
  async updateArea(id: string, updates: any) {
    return this.sendCommand('updateArea', { id, updates });
  }

  /**
   * Delete an area
   */
  async deleteArea(id: string, addToHistory = true) {
    return this.sendCommand('deleteArea', { id, addToHistory });
  }

  /**
   * Add a note
   */
  async addNote(data: any, addToHistory = true) {
    return this.sendCommand('addNote', { data, addToHistory });
  }

  /**
   * Update a note
   */
  async updateNote(id: string, updates: any) {
    return this.sendCommand('updateNote', { id, updates });
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string, addToHistory = true) {
    return this.sendCommand('deleteNote', { id, addToHistory });
  }

  /**
   * Set database type
   */
  async setDatabase(database: string) {
    return this.sendCommand('setDatabase', { database });
  }

  /**
   * Get all tables
   */
  async getTables() {
    return this.sendCommand('getTables');
  }

  /**
   * Get a specific table by ID or name
   */
  async getTable(tableId?: string, tableName?: string) {
    return this.sendCommand('getTable', { tableId, tableName });
  }

  /**
   * Get all relationships
   */
  async getRelationships() {
    return this.sendCommand('getRelationships');
  }

  /**
   * Import a complete diagram from JSON
   */
  async importDiagram(diagram: any, clearCurrent = true) {
    return this.sendCommand('importDiagram', { diagram, clearCurrent });
  }
}
