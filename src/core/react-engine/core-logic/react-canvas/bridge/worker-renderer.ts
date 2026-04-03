// Canvas Worker Renderer — runs in a Web Worker
//
// Owns the React reconciler, CanvasHostConfig, and an OffscreenCanvas.
// After each React commit, captures the frame as an ImageBitmap and
// transfers it to the main thread (zero-copy).

import type { ReactNode } from "../../react/ReactTypes.js";
import {
  createCanvasHostConfig,
  type CanvasContainer,
  type CanvasNode,
} from "../../host-config/CanvasHostConfig.js";
import { createContainer, updateContainer } from "../../reconciler/ReactFiberReconciler.js";
import type { MainToWorkerMessage, WorkerToMainMessage } from "./protocol.js";

/** Anything that can send/receive messages (MessagePort, Worker self, etc.) */
interface MessagePortLike {
  onmessage: ((ev: MessageEvent) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
}

export interface WorkerRendererOptions {
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
}

export class CanvasWorkerRenderer {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private container: CanvasContainer;
  private fiberRoot: ReturnType<typeof createContainer>;
  private frameId = 0;
  private port: MessagePortLike;

  constructor(port: MessagePortLike, options: WorkerRendererOptions) {
    this.port = port;

    const { width, height } = options;
    const fontSize = options.fontSize ?? 16;
    const fontFamily = options.fontFamily ?? "Inter";
    const lineHeight = options.lineHeight ?? 22;
    const defaultFont = `400 ${fontSize}px ${fontFamily}`;

    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext("2d")!;

    const root: CanvasNode = {
      type: "__root__",
      props: {},
      style: {},
      children: [],
      parent: null,
      computedX: 0,
      computedY: 0,
      computedWidth: width,
      computedHeight: height,
    };

    this.container = {
      canvas: this.canvas,
      ctx: this.ctx,
      root,
      width,
      height,
      defaultFont,
      defaultFontSize: fontSize,
      defaultFontFamily: fontFamily,
      defaultLineHeight: lineHeight,
      onCommit: () => this.sendFrame(),
    };

    const hostConfig = createCanvasHostConfig();
    this.fiberRoot = createContainer(this.container, hostConfig);

    // Listen for messages from main thread
    port.onmessage = (e: MessageEvent<MainToWorkerMessage>) => this.handleMessage(e.data);

    // Signal ready
    const ready: WorkerToMainMessage = { kind: "ready", width, height };
    port.postMessage(ready);
  }

  render(element: ReactNode): void {
    updateContainer(element, this.fiberRoot);
  }

  destroy(): void {
    updateContainer(null, this.fiberRoot);
    this.port.onmessage = null;
  }

  private sendFrame(): void {
    this.frameId++;
    const bitmap = this.canvas.transferToImageBitmap();
    const msg: WorkerToMainMessage = {
      kind: "frame",
      bitmap,
      width: this.container.width,
      height: this.container.height,
      frameId: this.frameId,
    };
    this.port.postMessage(msg, [bitmap]);
  }

  private handleMessage(msg: MainToWorkerMessage): void {
    switch (msg.kind) {
      case "resize":
        this.resize(msg.width, msg.height, msg.devicePixelRatio);
        break;
      case "render":
        // Re-trigger paint
        this.sendFrame();
        break;
      case "destroy":
        this.destroy();
        break;
    }
  }

  private resize(width: number, height: number, dpr: number): void {
    const scaledW = Math.round(width * dpr);
    const scaledH = Math.round(height * dpr);

    this.canvas.width = scaledW;
    this.canvas.height = scaledH;
    this.container.width = scaledW;
    this.container.height = scaledH;
    this.container.root.computedWidth = scaledW;
    this.container.root.computedHeight = scaledH;

    // Scale context for HiDPI
    this.ctx.scale(dpr, dpr);

    // Trigger repaint
    this.sendFrame();
  }
}
