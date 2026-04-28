export interface ErrorEntry {
  service_name: string;
  error_code?: string | undefined;
  message: string;
  stack_trace?: string | undefined;
  severity?: "low" | "medium" | "high" | "critical" | undefined;
  metadata?: string | undefined;
}
export interface ErrorShipperOptions {
  baseUrl?: string | undefined;
  batchSize?: number | undefined;
  flushIntervalMs?: number | undefined;
}
export interface ErrorShipper {
  shipError(entry: ErrorEntry): void;
  flush(): Promise<void>;
}
export declare function createErrorShipper(options?: ErrorShipperOptions): ErrorShipper;
//# sourceMappingURL=error-shipper.d.ts.map
