import { useEffect, useRef } from "react";
import { Toast } from "@douyinfe/semi-ui";
import { OrpcWs, useOrpcWs, useConnectionState } from "@orpc-ws/react";
import { clientContract } from "@drawdb-mcp/remote-control-contract";
import RemoteControlHandlers from "./RemoteControlHandlers";
import { resolveRemoteControlWsUrl } from "./ws";

/**
 * Owns the connection-state UX: toasts on connect/reconnect/kick and the
 * `aiAssistantConnected` bridge up to the Workspace. Must render below
 * `<OrpcWs>` so it can read the client from context.
 *
 * Connection state is the library's tagged record (`@orpc-ws/client`):
 * `connecting` / `connected` / `disconnected` (with `willRetry`) / `kicked`
 * (terminal, `reason: "session_replaced"`, from close code 4005 when another
 * GUI takes over - the library stops reconnecting on its own).
 */
function ConnectionBridge({ onConnectedChange }) {
  const client = useOrpcWs();
  const { status } = useConnectionState(client);
  const everConnectedRef = useRef(false);
  const prevStatusRef = useRef(null);

  // Report "connected" up to the Workspace so ControlPanel's
  // aiAssistantConnected indicator keeps working unchanged.
  useEffect(() => {
    onConnectedChange?.(status === "connected");
  }, [status, onConnectedChange]);

  // Toasts on state TRANSITIONS only (the library re-notifies on structural
  // changes, never repeats the same status).
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (status === prev) return;
    prevStatusRef.current = status;

    if (status === "connected") {
      if (everConnectedRef.current) {
        Toast.success("AI Assistant reconnected");
      } else {
        Toast.success("AI Assistant connected");
      }
      everConnectedRef.current = true;
    } else if (status === "kicked") {
      // Connection taken over by another tab/window - terminal, no retries.
      Toast.warning("AI Assistant disconnected - connection taken over by another tab/window");
    } else if (status === "disconnected" && prev === "connected") {
      // The library retries forever (backoff 1s -> 30s), so there is no
      // "max attempts, refresh" state anymore - just signal the drop once.
      Toast.warning("AI Assistant disconnected, reconnecting...");
    }
  }, [status]);

  return null;
}

/**
 * Remote-control mount point: constructs and owns the ORPC-WS client via
 * `<OrpcWs>` (connect on mount, dispose on unmount), registers all
 * server->client command handlers, and surfaces connection UX.
 *
 * No `fallback` prop on purpose: the editor must always render, and the
 * ungated children mean the handlers register BEFORE the socket opens (no
 * NOT_FOUND window for early backend calls).
 */
export default function RemoteControl({ onConnectedChange }) {
  return (
    <OrpcWs
      // <OrpcWs> reads its construction props ONCE - resolve the URL eagerly
      // instead of treating it as reactive.
      url={resolveRemoteControlWsUrl()}
      clientContract={clientContract}
      onEvent={(e) => console.log("[RemoteControl] client event:", e.type, e)}
    >
      <RemoteControlHandlers />
      <ConnectionBridge onConnectedChange={onConnectedChange} />
    </OrpcWs>
  );
}
