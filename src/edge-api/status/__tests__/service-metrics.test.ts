import { describe, expect, it, vi } from "vitest";

describe("ensureServiceMetricSchema", () => {
  it("creates the schema with prepared statements instead of multiline exec", async () => {
    vi.resetModules();

    const prepare = vi.fn((sql: string) => ({ sql }));
    const batch = vi.fn(async () => []);
    const exec = vi.fn(async () => {
      throw new Error("exec should not be used for service metric schema setup");
    });

    const db = {
      batch,
      exec,
      prepare,
    } as unknown as D1Database;

    const { ensureServiceMetricSchema } = await import("../../common/core-logic/service-metrics");

    await expect(ensureServiceMetricSchema(db)).resolves.toBeUndefined();

    expect(exec).not.toHaveBeenCalled();
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(prepare.mock.calls[0]?.[0]).toContain("CREATE TABLE IF NOT EXISTS");
    expect(prepare.mock.calls[1]?.[0]).toContain("CREATE INDEX IF NOT EXISTS");
    expect(prepare.mock.calls[0]?.[0]).not.toContain("\n");
    expect(prepare.mock.calls[1]?.[0]).not.toContain("\n");
    expect(batch).toHaveBeenCalledTimes(1);
    expect(batch).toHaveBeenCalledWith(prepare.mock.results.map((result) => result.value));
  });
});
