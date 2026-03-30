import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "../core-logic/logger.js";

describe("createLogger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs debug messages by default", () => {
    const logger = createLogger("test-service");
    logger.debug("debug msg");
    expect(console.debug).toHaveBeenCalledOnce();
  });

  it("output is valid JSON", () => {
    const logger = createLogger("test-service");
    logger.info("hello");
    const raw = vi.mocked(console.info).mock.calls[0]?.[0] as string;
    expect(() => JSON.parse(raw)).not.toThrow();
    const entry = JSON.parse(raw);
    expect(entry.message).toBe("hello");
    expect(entry.level).toBe("info");
    expect(entry.service).toBe("test-service");
  });

  it("log entry contains an ISO timestamp", () => {
    const logger = createLogger("ts-service");
    logger.warn("warn msg");
    const raw = vi.mocked(console.warn).mock.calls[0]?.[0] as string;
    const entry = JSON.parse(raw);
    expect(() => new Date(entry.timestamp)).not.toThrow();
  });

  it("attaches extra data to the log entry", () => {
    const logger = createLogger("data-service");
    logger.error("err", { code: 500 });
    const raw = vi.mocked(console.error).mock.calls[0]?.[0] as string;
    const entry = JSON.parse(raw);
    expect(entry.data).toEqual({ code: 500 });
  });

  it("suppresses messages below the configured minimum level", () => {
    const logger = createLogger("quiet-service", { level: "warn" });
    logger.debug("should be suppressed");
    logger.info("also suppressed");
    logger.warn("this goes through");
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it("withRequestId returns a logger that stamps requestId on entries", () => {
    const logger = createLogger("req-service");
    const requestLogger = logger.withRequestId("req-xyz");
    requestLogger.info("with request");
    const raw = vi.mocked(console.info).mock.calls[0]?.[0] as string;
    const entry = JSON.parse(raw);
    expect(entry.requestId).toBe("req-xyz");
  });

  it("base logger does not include requestId field when none is set", () => {
    const logger = createLogger("base-service");
    logger.info("no req");
    const raw = vi.mocked(console.info).mock.calls[0]?.[0] as string;
    const entry = JSON.parse(raw);
    expect("requestId" in entry).toBe(false);
  });

  it("withRequestId child logger inherits the parent service name", () => {
    const logger = createLogger("my-service");
    const child = logger.withRequestId("r1");
    child.warn("child warn");
    const raw = vi.mocked(console.warn).mock.calls[0]?.[0] as string;
    const entry = JSON.parse(raw);
    expect(entry.service).toBe("my-service");
  });
});
