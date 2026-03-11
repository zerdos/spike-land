/**
 * WebSocket connection states
 */
export const WebSocketState = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  RECONNECTING: "reconnecting",
  ERROR: "error",
} as const;
export type WebSocketState = (typeof WebSocketState)[keyof typeof WebSocketState];

/**
 * WebSocket event types
 */
export const WebSocketEventType = {
  MESSAGE: "message",
  ERROR: "error",
  CLOSE: "close",
  OPEN: "open",
} as const;
export type WebSocketEventType = (typeof WebSocketEventType)[keyof typeof WebSocketEventType];
