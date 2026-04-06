// Canvas Main Display — runs on the main thread
//
// Receives ImageBitmaps from the worker and paints them onto a visible
// <canvas> element. Handles resize observation and event forwarding.

import type { WorkerToMainMessage, MainToWorkerMessage, ResizeMessage } from "./protocol.js";

export interface CanvasDisplayOptions {
  /** The visible canvas element to display frames on */
  canvas: HTMLCanvasElement;
  /** URL to the worker script */
  workerUrl: string | URL;
  /** Initial width (default: canvas.clientWidth) */
  width?: number;
  /** Initial height (default: canvas.clientHeight) */
  height?: number;
  /** Font size for the worker renderer */
  fontSize?: number;
  /** Font family for the worker renderer */
  fontFamily?: string;
  /** Callback when a frame is displayed */
  onFrame?: (frameId: number) => void;
}

export class CanvasMainDisplay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private worker: Worker;
  private observer: ResizeObserver | null = null;
  private onFrame: ((frameId: number) => void) | undefined;
  private destroyed = false;

  constructor(options: CanvasDisplayOptions) {
    this.canvas = options.canvas;
    this.onFrame = options.onFrame;

    const ctx = this.canvas.getContext("bitmaprenderer");
    if (!ctx) {
      // Fallback to 2d context if bitmaprenderer not supported
      const ctx2d = this.canvas.getContext("2d");
      if (!ctx2d) throw new Error("Failed to acquire 2d canvas context");
      this.ctx = ctx2d as CanvasRenderingContext2D;
    } else {
      this.ctx = ctx as unknown as CanvasRenderingContext2D;
    }

    const width = options.width ?? this.canvas.clientWidth;
    const height = options.height ?? this.canvas.clientHeight;
    const dpr = globalThis.devicePixelRatio || 1;

    // Size the canvas for HiDPI
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);

    // Create the worker
    this.worker = new Worker(options.workerUrl, { type: "module" });
    this.worker.onmessage = (e: MessageEvent<WorkerToMainMessage>) => {
      this.handleWorkerMessage(e.data);
    };

    // Send initial config as part of the worker's self-setup
    // The worker reads these from the global init message
    this.worker.postMessage({
      kind: "init",
      width: Math.round(width * dpr),
      height: Math.round(height * dpr),
      fontSize: options.fontSize ?? 16,
      fontFamily: options.fontFamily ?? "Inter",
    });

    // Observe resize
    this.observer = new ResizeObserver((entries) => {
      if (this.destroyed) return;
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        this.resize(w, h);
      }
    });
    this.observer.observe(this.canvas);
  }

  /** Send a message to the worker */
  send(msg: MainToWorkerMessage): void {
    this.worker.postMessage(msg);
  }

  /** Resize the rendering surface */
  resize(width: number, height: number): void {
    const dpr = globalThis.devicePixelRatio || 1;
    const scaledW = Math.round(width * dpr);
    const scaledH = Math.round(height * dpr);
    this.canvas.width = scaledW;
    this.canvas.height = scaledH;

    const msg: ResizeMessage = {
      kind: "resize",
      width: scaledW,
      height: scaledH,
      devicePixelRatio: dpr,
    };
    this.worker.postMessage(msg);
  }

  /** Clean up worker and observers */
  destroy(): void {
    this.destroyed = true;
    this.observer?.disconnect();
    this.observer = null;
    this.send({ kind: "destroy" });
    this.worker.terminate();
  }

  private handleWorkerMessage(msg: WorkerToMainMessage): void {
    if (this.destroyed) return;

    switch (msg.kind) {
      case "frame":
        this.displayBitmap(msg.bitmap, msg.frameId);
        break;
      case "ready":
        // Worker is initialized, could trigger initial render
        break;
    }
  }

  private displayBitmap(bitmap: ImageBitmap, frameId: number): void {
    // Use ImageBitmapRenderingContext for zero-copy display
    if ("transferFromImageBitmap" in this.ctx) {
      (this.ctx as ImageBitmapRenderingContext).transferFromImageBitmap(bitmap);
    } else {
      // Fallback: draw bitmap onto 2d context
      (this.ctx as CanvasRenderingContext2D).drawImage(bitmap, 0, 0);
      bitmap.close();
    }

    this.onFrame?.(frameId);
  }
}
