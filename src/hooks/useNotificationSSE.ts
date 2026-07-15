import { useEffect, useRef, useCallback, useState } from "react";

interface SSENotification {
  title: string;
  message: string;
}

interface UseNotificationSSEOptions {
  onNotification?: (data: SSENotification) => void;
  enabled?: boolean;
}

export const SSE_NOTIFICATION_EVENT = "sse-new-notification";

export function useNotificationSSE({
  onNotification,
  enabled = true,
}: UseNotificationSSEOptions) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onNotificationRef = useRef(onNotification);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const connect = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !enabled || !mountedRef.current) return;

    // Don't create a new connection if one is already open
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    const url = `/api/sse/notifications?token=${token}`;
    console.log("[SSE] Connecting...");

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[SSE] Connected");
      setConnected(true);
    };

    eventSource.addEventListener("connected", () => {
      console.log("[SSE] Ready");
      setConnected(true);
    });

    eventSource.addEventListener("notification", (event: MessageEvent) => {
      console.log("[SSE] Notification:", event.data);
      try {
        const data: SSENotification = JSON.parse(event.data);
        onNotificationRef.current?.(data);
        window.dispatchEvent(
          new CustomEvent(SSE_NOTIFICATION_EVENT, { detail: data })
        );
      } catch (e) {
        console.error("[SSE] Parse error:", e);
      }
    });

    eventSource.onerror = () => {
      const state = eventSource.readyState;
      console.log("[SSE] Error, readyState:", state);
      setConnected(false);

      // readyState 2 = CLOSED — clean up and reconnect
      if (state === EventSource.CLOSED) {
        eventSource.close();
        eventSourceRef.current = null;

        if (mountedRef.current && enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      }
      // readyState 0 = CONNECTING — EventSource will auto-reconnect, do nothing
    };
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    // Small delay to avoid connecting during page load / React StrictMode double-mount
    const initTimeout = setTimeout(() => {
      connect();
    }, 500);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimeout);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [connect]);

  return { connected };
}
