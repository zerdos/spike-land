import { describe, it, expect } from "vitest";
import { parseToolResult } from "../client";
import type { ToolResult } from "../client";

describe("parseToolResult", () => {
  it("parses valid JSON result correctly", () => {
    const validJsonResult: ToolResult = {
      content: [{ type: "text", text: '{"key": "value", "num": 42}' }],
      isError: false,
    };

    const parsed = parseToolResult<{key: string, num: number}>(validJsonResult);
    expect(parsed).toEqual({ key: "value", num: 42 });
  });

  it("throws an error if isError is true", () => {
    const errorResult: ToolResult = {
      content: [{ type: "text", text: "Something went wrong" }],
      isError: true,
    };

    expect(() => parseToolResult(errorResult)).toThrowError("Something went wrong");
  });

  it("throws a default error if isError is true but no text is provided", () => {
    const errorResult: ToolResult = {
      content: [],
      isError: true,
    };

    expect(() => parseToolResult(errorResult)).toThrowError("Unknown error");
  });

  it("throws an error if content is empty (and isError is false)", () => {
    const emptyResult: ToolResult = {
      content: [],
      isError: false,
    };

    expect(() => parseToolResult(emptyResult)).toThrowError("Empty result");
  });

  it("throws an error if text is not valid JSON", () => {
    const invalidJsonResult: ToolResult = {
      content: [{ type: "text", text: "not json" }],
      isError: false,
    };

    expect(() => parseToolResult(invalidJsonResult)).toThrowError(SyntaxError);
  });
});
