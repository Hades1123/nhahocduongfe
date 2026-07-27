import { useEffect, useRef, useCallback, useState } from "react";
import { notificationApi } from "@/api/notificationApi";
import useAuthStore from "@/stores/authStore";

interface SSENotification {
  title: string;
  message: string;
  type?: string; // "REGISTRATION" | "SCHEDULE" — discriminates notification kinds
}

interface UseNotificationSSEOptions {
  onNotification?: (data: SSENotification) => void;
  enabled?: boolean;
}

export const SSE_NOTIFICATION_EVENT = "sse-new-notification";

export const SSE_EVENT_NAME = {
  CONNECTED: "connected",
  NOTIFICATION: "notification",
} as const;

export const SSE_NOTIFICATION_TYPE = {
  REGISTRATION: "REGISTRATION",
  SCHEDULE: "SCHEDULE",
} as const;

const MAX_CONSECUTIVE_FAILURES = 3;

export function useNotificationSSE({
  onNotification,
  enabled = true,
}: UseNotificationSSEOptions) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onNotificationRef = useRef(onNotification);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);
  const failureCountRef = useRef(0);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const connect = useCallback(async () => {
    if (!accessToken || !enabled || !mountedRef.current) return;

    // Don't create a new connection if one is already open
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    // Bail out after too many consecutive failures (e.g. expired token → 401 loop)
    if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) return;

    // Phải lấy được ticket mới kết nối — không fallback JWT token qua URL vì lý do bảo mật
    let ticket: string | undefined;
    try {
      ticket = await notificationApi.createSseTicket();
    } catch (err) {
      console.error("[SSE] Không thể tạo ticket kết nối:", err);
    }

    if (!ticket || !mountedRef.current) return;

    const eventSource = new EventSource(`/api/sse/notifications?ticket=${ticket}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      failureCountRef.current = 0; // reset on successful connection
      setConnected(true);
    };

    eventSource.addEventListener(SSE_EVENT_NAME.CONNECTED, () => {
      setConnected(true);
    });

    eventSource.addEventListener(
      SSE_EVENT_NAME.NOTIFICATION,
      (event: MessageEvent) => {
        try {
          const data: SSENotification = JSON.parse(event.data);
          onNotificationRef.current?.(data);
          window.dispatchEvent(
            new CustomEvent(SSE_NOTIFICATION_EVENT, { detail: data }),
          );
        } catch (e) {
          console.error("[SSE] Parse error:", e);
        }
      },
    );

    eventSource.onerror = () => {
      const state = eventSource.readyState;
      setConnected(false);

      // readyState 2 = CLOSED — clean up and maybe reconnect
      if (state === EventSource.CLOSED) {
        failureCountRef.current += 1;
        eventSource.close();
        eventSourceRef.current = null;

        if (
          mountedRef.current &&
          enabled &&
          failureCountRef.current < MAX_CONSECUTIVE_FAILURES
        ) {
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
    failureCountRef.current = 0;
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
