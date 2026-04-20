import { describe, expect, it } from "vitest";

import { parseHeaders, streamToString } from "../core-logic/inbound-parser";

describe("parseHeaders", () => {
  it("extracts standard RFC822 headers", () => {
    const raw =
      "Message-ID: <abc@example.com>\r\n" +
      "Subject: Hello\r\n" +
      "From: Alice <alice@example.com>\r\n" +
      "To: bob@spike.land\r\n" +
      "Date: Mon, 20 Apr 2026 07:00:00 +0000\r\n" +
      "\r\n" +
      "body body body";
    expect(parseHeaders(raw)).toEqual({
      messageId: "<abc@example.com>",
      subject: "Hello",
      from: "Alice <alice@example.com>",
      to: "bob@spike.land",
      date: "Mon, 20 Apr 2026 07:00:00 +0000",
      inReplyTo: null,
    });
  });

  it("unfolds continued headers", () => {
    const raw = "Subject: this is\r\n  a folded subject\r\n\r\nbody";
    expect(parseHeaders(raw).subject).toBe("this is a folded subject");
  });

  it("returns nulls for missing headers on empty input", () => {
    expect(parseHeaders("")).toEqual({
      messageId: null,
      subject: null,
      from: null,
      to: null,
      date: null,
      inReplyTo: null,
    });
  });

  it("captures In-Reply-To", () => {
    const raw = "Subject: re: hi\r\nIn-Reply-To: <parent@example.com>\r\n\r\nbody";
    expect(parseHeaders(raw).inReplyTo).toBe("<parent@example.com>");
  });
});

describe("streamToString", () => {
  it("concatenates chunks", async () => {
    const parts = ["hello ", "world"].map((s) => new TextEncoder().encode(s));
    let i = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (i < parts.length) {
          controller.enqueue(parts[i++]!);
        } else {
          controller.close();
        }
      },
    });
    expect(await streamToString(stream)).toBe("hello world");
  });

  it("rejects messages larger than 5MB", async () => {
    const big = new Uint8Array(6 * 1024 * 1024);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(big);
        controller.close();
      },
    });
    await expect(streamToString(stream)).rejects.toThrow(/5MB/);
  });
});
