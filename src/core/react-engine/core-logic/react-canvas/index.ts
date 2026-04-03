export { createCanvasRoot } from "./client.js";
export type { CanvasRoot, CreateCanvasRootOptions } from "./client.js";
export {
  createCanvasHostConfig,
  layoutTree,
  paintTree,
  type CanvasNode,
  type CanvasTextNode,
  type CanvasContainer,
  type CanvasHostContext,
  type CanvasStyle,
} from "../host-config/CanvasHostConfig.js";

// Worker ↔ Main bridge
export {
  CanvasMainDisplay,
  CanvasWorkerRenderer,
  type CanvasDisplayOptions,
  type WorkerRendererOptions,
  type FrameMessage,
  type ReadyMessage,
  type ResizeMessage,
  type InputEventMessage,
  type RenderMessage,
  type DestroyMessage,
  type WorkerToMainMessage,
  type MainToWorkerMessage,
} from "./bridge/index.js";
