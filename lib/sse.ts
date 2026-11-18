import { SSE_BASE } from "./env";
import type { RunStatus } from "./types";

export type SseConnectionState = "connecting" | "open" | "closed" | "error";

export interface RunEventSourceCallbacks {
  onStatus?: (status: RunStatus) => void;
  onOutput?: (chunk: string) => void;
  onResult?: (finalOutput: string) => void;
  onErrorEvent?: (errorMessage: string) => void;
  onPing?: () => void;
  onConnectionChange?: (state: SseConnectionState) => void;
  onError?: (event: Event) => void;
}

export interface RunEventSourceController {
  close: () => void;
  isClosed: () => boolean;
}

/**
 * Creates and connects an EventSource for streaming lab run execution events.
 * Listens for: status, output, result, error, ping.
 * Automatically closes on terminal events ('result' or 'error').
 */
export function connectRunEventSource(
  labId: number,
  runId: number,
  callbacks: RunEventSourceCallbacks
): RunEventSourceController {
  const url = `${SSE_BASE}/v1/labs/${labId}/runs/${runId}/events`;
  let closed = false;

  callbacks.onConnectionChange?.("connecting");

  const es = new EventSource(url, { withCredentials: true });

  const safeClose = () => {
    if (!closed) {
      closed = true;
      es.close();
      callbacks.onConnectionChange?.("closed");
    }
  };

  es.onopen = () => {
    if (!closed) {
      callbacks.onConnectionChange?.("open");
    }
  };

  es.onerror = (event) => {
    if (!closed) {
      callbacks.onConnectionChange?.("error");
      callbacks.onError?.(event);
    }
  };

  // Status event: updates status badge and timeline (e.g. "running", "passed", "failed")
  es.addEventListener("status", (event: MessageEvent) => {
    if (closed) return;
    const status = event.data?.trim() as RunStatus;
    if (status) {
      callbacks.onStatus?.(status);
    }
  });

  // Output event: append chunk to terminal view
  es.addEventListener("output", (event: MessageEvent) => {
    if (closed) return;
    callbacks.onOutput?.(event.data);
  });

  // Result event: final output replaces streamed output, mark passed, close stream
  es.addEventListener("result", (event: MessageEvent) => {
    if (closed) return;
    const finalData = event.data || "";
    callbacks.onResult?.(finalData);
    callbacks.onStatus?.("passed");
    safeClose();
  });

  // Error event: final output replaces streamed output, mark failed, close stream
  es.addEventListener("error", (event: MessageEvent) => {
    // Note: check if this is a custom SSE event named "error" vs general EventSource error
    // Native EventSource error events might not have data
    if (event.data !== undefined) {
      if (closed) return;
      callbacks.onErrorEvent?.(event.data);
      callbacks.onStatus?.("failed");
      safeClose();
    }
  });

  // Ping event: keepalive
  es.addEventListener("ping", () => {
    if (closed) return;
    callbacks.onPing?.();
  });

  return {
    close: safeClose,
    isClosed: () => closed,
  };
}
