import { useEffect, useRef, useContext, useState } from "react";
import { DiagramContext } from "../context/DiagramContext";
import { AreasContext } from "../context/AreasContext";
import { NotesContext } from "../context/NotesContext";
import { EnumsContext } from "../context/EnumsContext";
import { TypesContext } from "../context/TypesContext";
import { Toast } from "@douyinfe/semi-ui";

/**
 * Hook that enables remote control of the diagram editor via WebSocket
 * Commands from backend/LLM are executed on the diagram state
 * Features automatic reconnection with exponential backoff
 */
export function useRemoteControl(enabled = false) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  const diagram = useContext(DiagramContext);
  const areas = useContext(AreasContext);
  const notes = useContext(NotesContext);
  const enums = useContext(EnumsContext);
  const types = useContext(TypesContext);

  // Use refs to always access latest context values
  const contextsRef = useRef({ diagram, areas, notes, enums, types });

  useEffect(() => {
    contextsRef.current = { diagram, areas, notes, enums, types };
  }, [diagram, areas, notes, enums, types]);

  useEffect(() => {
    if (!enabled) {
      // Clean up when disabled
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Auto-detect WebSocket URL based on current page location
    // This works for local dev, Docker, and production deployments
    const defaultWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/remote-control`;
    const wsUrl = import.meta.env.VITE_REMOTE_CONTROL_WS || defaultWsUrl;

    const maxReconnectAttempts = 10;
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    const connect = () => {
      // Prevent multiple simultaneous connections
      if (wsRef.current?.readyState === WebSocket.CONNECTING) {
        return;
      }

      console.log("[RemoteControl] Connecting to backend...");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[RemoteControl] Connected to backend");
        setIsConnected(true);

        // Show reconnection message if this was a reconnect attempt
        const wasReconnecting = reconnectAttemptsRef.current > 0;
        reconnectAttemptsRef.current = 0; // Reset retry counter on successful connection

        if (wasReconnecting) {
          Toast.success("AI Assistant reconnected");
        } else {
          Toast.success("AI Assistant connected");
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleCommand(message);
        } catch (error) {
          console.error("[RemoteControl] Failed to parse message:", error);
          sendResponse({ error: error.message });
        }
      };

      ws.onerror = (error) => {
        console.error("[RemoteControl] WebSocket error:", error);
      };

      ws.onclose = (event) => {
        console.log("[RemoteControl] Disconnected from backend", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Only attempt to reconnect if enabled and haven't exceeded max attempts
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;

          // Calculate exponential backoff delay with jitter
          const exponentialDelay = Math.min(
            baseDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
            maxDelay
          );
          const jitter = Math.random() * 1000; // Add random jitter up to 1 second
          const delay = exponentialDelay + jitter;

          console.log(
            `[RemoteControl] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          if (reconnectAttemptsRef.current === 1) {
            Toast.warning("AI Assistant disconnected, reconnecting...");
          }

          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("[RemoteControl] Max reconnection attempts reached");
          Toast.error("AI Assistant connection failed. Please refresh the page.");
        }
      };
    };

    // Initial connection
    connect();

    return () => {
      // Cleanup on unmount or when enabled changes
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled]);

  const sendResponse = (data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  const handleCommand = (message) => {
    const { id, command, params } = message;
    // Always use latest context values from ref
    const { diagram, areas, notes, enums, types } = contextsRef.current;

    try {
      let result;

      switch (command) {
        // Table operations
        case "addTable":
          diagram.addTable(params.data, params.addToHistory ?? true);
          result = { success: true, message: "Table added" };
          break;

        case "deleteTable":
          diagram.deleteTable(params.id, params.addToHistory ?? true);
          result = { success: true, message: "Table deleted" };
          break;

        case "updateTable":
          diagram.updateTable(params.id, params.updates);
          result = { success: true, message: "Table updated" };
          break;

        case "addField":
          {
            const table = diagram.tables.find((t) => t.id === params.tableId);
            if (!table) throw new Error(`Table ${params.tableId} not found`);
            diagram.updateTable(params.tableId, {
              fields: [...table.fields, params.field],
            });
            result = { success: true, message: "Field added" };
          }
          break;

        case "updateField":
          diagram.updateField(params.tableId, params.fieldId, params.updates);
          result = { success: true, message: "Field updated" };
          break;

        case "deleteField":
          {
            const table = diagram.tables.find((t) => t.id === params.tableId);
            const field = table?.fields.find((f) => f.id === params.fieldId);
            if (!field) throw new Error("Field not found");
            diagram.deleteField(field, params.tableId, params.addToHistory ?? true);
            result = { success: true, message: "Field deleted" };
          }
          break;

        // Relationship operations
        case "addRelationship":
          diagram.addRelationship(params.data, params.addToHistory ?? true);
          result = { success: true, message: "Relationship added" };
          break;

        case "deleteRelationship":
          diagram.deleteRelationship(params.id, params.addToHistory ?? true);
          result = { success: true, message: "Relationship deleted" };
          break;

        case "updateRelationship":
          diagram.updateRelationship(params.id, params.updates);
          result = { success: true, message: "Relationship updated" };
          break;

        // Area operations
        case "addArea":
          areas.addArea(params.data, params.addToHistory ?? true);
          result = { success: true, message: "Area added" };
          break;

        case "deleteArea":
          // Areas use numeric array indices, so find by name
          const areaToDelete = areas.areas.find((a) => a.name === params.id || a.id === params.id);
          if (areaToDelete) {
            areas.deleteArea(areaToDelete.id, params.addToHistory ?? true);
            result = { success: true, message: "Area deleted" };
          } else {
            throw new Error(`Area with id "${params.id}" not found`);
          }
          break;

        case "updateArea":
          // Areas use numeric array indices, so find by name
          const areaToUpdate = areas.areas.find((a) => a.name === params.id || a.id === params.id);
          if (areaToUpdate) {
            areas.updateArea(areaToUpdate.id, params.updates);
            result = { success: true, message: "Area updated" };
          } else {
            throw new Error(`Area with id "${params.id}" not found`);
          }
          break;

        // Note operations
        case "addNote":
          notes.addNote(params.data, params.addToHistory ?? true);
          result = { success: true, message: "Note added" };
          break;

        case "deleteNote":
          // Notes use numeric array indices, so find by title
          const noteToDelete = notes.notes.find((n) => n.title === params.id || n.id === params.id);
          if (noteToDelete) {
            notes.deleteNote(noteToDelete.id, params.addToHistory ?? true);
            result = { success: true, message: "Note deleted" };
          } else {
            throw new Error(`Note with id "${params.id}" not found`);
          }
          break;

        case "updateNote":
          // Notes use numeric array indices, so find by title
          const noteToUpdate = notes.notes.find((n) => n.title === params.id || n.id === params.id);
          if (noteToUpdate) {
            notes.updateNote(noteToUpdate.id, params.updates);
            result = { success: true, message: "Note updated" };
          } else {
            throw new Error(`Note with id "${params.id}" not found`);
          }

          break;

        // Enum operations
        case "addEnum":
          enums.addEnum(params.data, params.addToHistory ?? true);
          result = { success: true, message: "Enum added" };
          break;

        case "deleteEnum":
          enums.deleteEnum(params.id, params.addToHistory ?? true);
          result = { success: true, message: "Enum deleted" };
          break;

        case "updateEnum":
          enums.updateEnum(params.id, params.updates);
          result = { success: true, message: "Enum updated" };
          break;

        // Type operations
        case "addType":
          types.addType(params.data, params.addToHistory ?? true);
          result = { success: true, message: "Type added" };
          break;

        case "deleteType":
          types.deleteType(params.id, params.addToHistory ?? true);
          result = { success: true, message: "Type deleted" };
          break;

        case "updateType":
          types.updateType(params.id, params.updates);
          result = { success: true, message: "Type updated" };
          break;

        // Database operations
        case "setDatabase":
          diagram.setDatabase(params.database);
          result = { success: true, message: "Database type set" };
          break;

        // Query operations - read-only
        case "getTables":
          result = { success: true, data: diagram.tables };
          break;

        case "getTable":
          {
            let table = null;
            if (params.tableId) {
              table = diagram.tables.find((t) => t.id === params.tableId);
            } else if (params.tableName) {
              table = diagram.tables.find((t) => t.name === params.tableName);
            }

            if (!table) {
              throw new Error(`Table not found: ${params.tableId || params.tableName}`);
            }

            result = { success: true, data: table };
          }
          break;

        case "getRelationships":
          result = { success: true, data: diagram.relationships };
          break;

        case "getAreas":
          result = { success: true, data: areas.areas };
          break;

        case "getNotes":
          result = { success: true, data: notes.notes };
          break;

        case "getEnums":
          result = { success: true, data: enums.enums };
          break;

        case "getTypes":
          result = { success: true, data: types.types };
          break;

        case "getDiagram":
          result = {
            success: true,
            data: {
              database: diagram.database,
              tables: diagram.tables,
              relationships: diagram.relationships,
              areas: areas.areas,
              notes: notes.notes,
              enums: enums.enums,
              types: types.types,
            },
          };
          break;

        case "importDiagram":
          {
            const importedDiagram = params.diagram;

            // Clear current diagram if requested
            if (params.clearCurrent !== false) {
              diagram.setTables([]);
              diagram.setRelationships([]);
              areas.setAreas([]);
              notes.setNotes([]);
              enums.setEnums([]);
              types.setTypes([]);
            }

            // Load new diagram
            if (importedDiagram.database) {
              diagram.setDatabase(importedDiagram.database);
            }
            if (importedDiagram.tables) {
              diagram.setTables(importedDiagram.tables);
            }
            if (importedDiagram.relationships) {
              diagram.setRelationships(importedDiagram.relationships);
            }
            if (importedDiagram.areas) {
              areas.setAreas(importedDiagram.areas);
            }
            if (importedDiagram.notes) {
              notes.setNotes(importedDiagram.notes);
            }
            if (importedDiagram.enums) {
              enums.setEnums(importedDiagram.enums);
            }
            if (importedDiagram.types) {
              types.setTypes(importedDiagram.types);
            }

            result = { success: true, message: "Diagram imported" };
          }
          break;

        default:
          throw new Error(`Unknown command: ${command}`);
      }

      sendResponse({ id, ...result });
    } catch (error) {
      console.error(`[RemoteControl] Error executing ${command}:`, error);
      sendResponse({
        id,
        success: false,
        error: error.message,
      });
    }
  };

  return {
    isConnected,
    send: sendResponse,
  };
}
