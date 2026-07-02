import { Injectable, Logger } from "@nestjs/common";
import { OrpcWsService, SINGLE_AUTHLESS_KEY } from "@orpc-ws/server-nestjs";
import type { ClientContract } from "@drawdb-mcp/remote-control-contract";

/**
 * Facade over the ORPC WebSocket transport for talking to the DrawDB GUI.
 *
 * The GUI hosts the `clientContract` procedures (server -> client RPC); this
 * service holds the typed caller for the single authless connection and
 * preserves the public API the MCP tools were written against:
 *   - `isConnected()` — a live GUI connection exists.
 *   - `sendCommand(command, params)` — dynamic dispatch by wire-command name.
 *   - one typed wrapper per command (addTable, updateTable, ... importDBML).
 *
 * Error model: under ORPC the legacy `{ success, data, error }` envelope is
 * gone — resolution value IS the data, and a failed command rejects with the
 * ORPC error thrown by the GUI handler.
 */
@Injectable()
export class DrawDBClientService {
  private readonly logger = new Logger(DrawDBClientService.name);
  private readonly requestTimeout = 30000; // 30 seconds

  constructor(private readonly orpcWs: OrpcWsService) {}

  /**
   * The typed server->client caller for the single authless GUI connection,
   * or undefined when no GUI is connected.
   */
  private getClient() {
    return this.orpcWs.getConnection<ClientContract>(SINGLE_AUTHLESS_KEY)?.client;
  }

  /**
   * Check if a DrawDB GUI client is connected
   */
  isConnected(): boolean {
    return this.getClient() !== undefined;
  }

  /**
   * Send a command to DrawDB and wait for the result.
   *
   * Dynamic-dispatch escape hatch: `command` must be a procedure name of the
   * client contract (the wire-command catalog). Prefer the typed wrappers.
   * `params` is passed through as the procedure input — leave it undefined
   * for no-input commands (getDiagram, exportSQL, exportDBML).
   */
  async sendCommand<T = any>(command: string, params?: Record<string, any>): Promise<T> {
    const client = this.getClient();
    if (!client) {
      throw new Error(
        "DrawDB client is not connected. Make sure the DrawDB frontend is running with remote control enabled.",
      );
    }

    // The ORPC caller proxy is dynamic at runtime; the typed surface is
    // keyed by contract procedure names. This single cast is the seam that
    // lets the string-based `sendCommand` API keep working.
    const procedures = client as unknown as Record<
      string,
      (input: unknown, options: { signal: AbortSignal }) => Promise<unknown>
    >;

    // Per-call timeout. The abort signal is threaded through ORPC's client
    // link into the peer, which rejects the pending call with the abort
    // reason AND notifies the GUI to abort the in-flight handler.
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort(new Error(`Command ${command} timed out after ${this.requestTimeout}ms`));
    }, this.requestTimeout);

    try {
      this.logger.debug(`Sending command: ${command}`);
      const result = await procedures[command](params, { signal: controller.signal });
      this.logger.debug(`Command ${command} succeeded`);
      return result as T;
    } catch (error) {
      this.logger.error(`Command ${command} failed: ${String(error)}`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Get the current diagram state
   */
  async getDiagram() {
    return this.sendCommand("getDiagram");
  }

  /**
   * Add a table to the diagram
   */
  async addTable(data: any, addToHistory = true) {
    return this.sendCommand("addTable", { data, addToHistory });
  }

  /**
   * Update a table
   */
  async updateTable(id: string, updates: any) {
    return this.sendCommand("updateTable", { id, updates });
  }

  /**
   * Delete a table
   */
  async deleteTable(id: string, addToHistory = true) {
    return this.sendCommand("deleteTable", { id, addToHistory });
  }

  /**
   * Add a field to a table
   */
  async addField(tableId: string, field: any) {
    return this.sendCommand("addField", { tableId, field });
  }

  /**
   * Update a field
   */
  async updateField(tableId: string, fieldId: string, updates: any) {
    return this.sendCommand("updateField", { tableId, fieldId, updates });
  }

  /**
   * Delete a field
   */
  async deleteField(tableId: string, fieldId: string, addToHistory = true) {
    return this.sendCommand("deleteField", { tableId, fieldId, addToHistory });
  }

  /**
   * Add a relationship
   */
  async addRelationship(data: any, addToHistory = true) {
    return this.sendCommand("addRelationship", { data, addToHistory });
  }

  /**
   * Update a relationship
   */
  async updateRelationship(id: string, updates: any) {
    return this.sendCommand("updateRelationship", { id, updates });
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(id: string, addToHistory = true) {
    return this.sendCommand("deleteRelationship", { id, addToHistory });
  }

  /**
   * Add an area
   */
  async addArea(data: any, addToHistory = true) {
    return this.sendCommand("addArea", { data, addToHistory });
  }

  /**
   * Update an area
   */
  async updateArea(id: string, updates: any) {
    return this.sendCommand("updateArea", { id, updates });
  }

  /**
   * Delete an area
   */
  async deleteArea(id: string, addToHistory = true) {
    return this.sendCommand("deleteArea", { id, addToHistory });
  }

  /**
   * Add a note
   */
  async addNote(data: any, addToHistory = true) {
    return this.sendCommand("addNote", { data, addToHistory });
  }

  /**
   * Update a note
   */
  async updateNote(id: string, updates: any) {
    return this.sendCommand("updateNote", { id, updates });
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string, addToHistory = true) {
    return this.sendCommand("deleteNote", { id, addToHistory });
  }

  /**
   * Set database type
   */
  async setDatabase(database: string) {
    return this.sendCommand("setDatabase", { database });
  }

  /**
   * Get a specific table by ID or name
   */
  async getTable(tableId?: string, tableName?: string) {
    return this.sendCommand("getTable", { tableId, tableName });
  }

  /**
   * Import a complete diagram from JSON
   */
  async importDiagram(diagram: any, clearCurrent = true) {
    return this.sendCommand("importDiagram", { diagram, clearCurrent });
  }

  /**
   * Export diagram as SQL DDL statements
   */
  async exportSQL() {
    return this.sendCommand("exportSQL");
  }

  /**
   * Export diagram as DBML (Database Markup Language)
   */
  async exportDBML() {
    return this.sendCommand("exportDBML");
  }

  /**
   * Import diagram from DBML (Database Markup Language)
   */
  async importDBML(dbml: string, clearCurrent = true) {
    return this.sendCommand("importDBML", { dbml, clearCurrent });
  }
}
