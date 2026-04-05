// Canvas Worker Bridge Protocol
// Defines messages between worker (renderer) and main thread (display).
// Unlike WorkerDOM which sends serialized DOM mutations, the Canvas bridge
// sends ImageBitmaps — zero-copy GPU-backed pixel buffers.

/** Worker → Main: a rendered frame ready for display */
export interface FrameMessage {
  kind: "frame";
  bitmap: ImageBitmap;
  width: number;
  height: number;
  frameId: number;
}

/** Worker → Main: the worker renderer is ready */
export interface ReadyMessage {
  kind: "ready";
  width: number;
  height: number;
}

/** Main → Worker: resize the canvas */
export interface ResizeMessage {
  kind: "resize";
  width: number;
  height: number;
  devicePixelRatio: number;
}

/** Main → Worker: forward a user event */
export interface InputEventMessage {
  kind: "input";
  eventType: string;
  x: number;
  y: number;
  data?: string;
}

/** Main → Worker: request a render */
export interface RenderMessage {
  kind: "render";
}

/** Main → Worker: unmount and clean up */
export interface DestroyMessage {
  kind: "destroy";
}

export type WorkerToMainMessage = FrameMessage | ReadyMessage;
export type MainToWorkerMessage =
  | ResizeMessage
  | InputEventMessage
  | RenderMessage
  | DestroyMessage;
