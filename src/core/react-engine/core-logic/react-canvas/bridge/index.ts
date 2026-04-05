export { CanvasMainDisplay, type CanvasDisplayOptions } from "./main-display.js";
export { CanvasWorkerRenderer, type WorkerRendererOptions } from "./worker-renderer.js";
export type {
  FrameMessage,
  ReadyMessage,
  ResizeMessage,
  InputEventMessage,
  RenderMessage,
  DestroyMessage,
  WorkerToMainMessage,
  MainToWorkerMessage,
} from "./protocol.js";
