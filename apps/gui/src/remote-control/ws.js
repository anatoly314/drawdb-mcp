import { ORPCError } from "@orpc/client";
import { createServerHandlerHook } from "@orpc-ws/react";

/**
 * The raw server->client handler hook for the remote-control connection,
 * bound ONCE at module scope. The procedure name set is frozen by the
 * `clientContract` passed to `<OrpcWs>` (plain JS build, so there is no
 * contract generic here - the wire shape is still enforced by the contract
 * value at construction).
 */
const useRawServerHandler = createServerHandlerHook();

/**
 * Server->client handler registration used by every handler hook under
 * `<RemoteControl>`. Wraps the raw hook so that plain `Error`s thrown by
 * handlers (not-found lookups, import parse failures, ...) travel to the
 * backend as `ORPCError` - ORPC deliberately masks unknown errors as a
 * message-less INTERNAL_SERVER_ERROR, which would strip all diagnostic
 * feedback from failed MCP tool calls.
 */
export function useServerHandler(name, handler) {
  useRawServerHandler(name, async (input) => {
    try {
      return await handler(input);
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      throw new ORPCError("BAD_REQUEST", {
        message: error.message,
        cause: error,
      });
    }
  });
}

/**
 * Resolve the remote-control WebSocket URL.
 *
 * Uses the `VITE_REMOTE_CONTROL_WS` override when set (direct dev sets it in
 * `.env`, since the Vite dev server on :5173 doesn't proxy the WebSocket),
 * otherwise derives the URL from the current page location - `ws://` (or
 * `wss://` over HTTPS), same host, path `/remote-control`. The auto-detect
 * path works wherever GUI and backend share a host, e.g. Docker behind nginx.
 */
export function resolveRemoteControlWsUrl() {
  const defaultWsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/remote-control`;
  return import.meta.env.VITE_REMOTE_CONTROL_WS || defaultWsUrl;
}

/**
 * Resolve the MCP HTTP endpoint URL (what AI assistants connect to, e.g. via
 * `claude mcp add --transport http drawdb-mcp <url>`), or null when it cannot
 * be known reliably.
 *
 * Resolution order:
 * 1. `VITE_MCP_URL` override.
 * 2. Derived from `VITE_REMOTE_CONTROL_WS` (same origin, http(s) scheme) -
 *    covers direct dev, where both live on the backend port.
 * 3. null - there is no trustworthy way to guess the externally published
 *    MCP port from the browser (e.g. Docker port mappings), and showing a
 *    wrong URL is worse than showing none.
 */
export function resolveMcpUrl() {
  if (import.meta.env.VITE_MCP_URL) return import.meta.env.VITE_MCP_URL;
  const wsOverride = import.meta.env.VITE_REMOTE_CONTROL_WS;
  if (wsOverride) {
    try {
      const wsUrl = new URL(wsOverride);
      return `${wsUrl.protocol === "wss:" ? "https:" : "http:"}//${wsUrl.host}`;
    } catch {
      // Malformed override - treat as unknown.
    }
  }
  return null;
}
