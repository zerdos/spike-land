import { describe, expect, it } from "vitest";
import { Lexer, LexerError } from "../../src/core/spwn-engine/core-logic/lexer.js";

function tokenKinds(source: string) {
  const lexer = new Lexer(source);
  return lexer.tokenize().map((t) => t.kind);
}

function _tokenValues(source: string) {
  const lexer = new Lexer(source);
  return lexer.tokenize().map((t) => ({ kind: t.kind, value: t.value }));
}

describe("Lexer", () => {
  describe("numeric literals", () => {
    it("tokenizes decimal integers", () => {
      const lexer = new Lexer("42");
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "Number", value: "42" });
    });

    it("tokenizes floating point", () => {
      const lexer = new Lexer("3.14");
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "Number", value: "3.14" });
    });

    it("tokenizes hex literals", () => {
      const lexer = new Lexer("0xFF");
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "Number", value: "255" });
    });

    it("tokenizes binary literals", () => {
      const lexer = new Lexer("0b1010");
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "Number", value: "10" });
    });

    it("tokenizes octal literals", () => {
      const lexer = new Lexer("0o77");
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "Number", value: "63" });
    });
  });

  describe("GD ID literals", () => {
    it("tokenizes numeric group IDs", () => {
      const lexer = new Lexer("10g");
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "GdId", value: "10g" });
    });

    it("tokenizes auto group IDs", () => {
      const lexer = new Lexer("?g");
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "GdId", value: "?g" });
    });

    it("tokenizes all GD ID kinds", () => {
      const kinds = ["5g", "3c", "7i", "2b", "?g", "?c", "?i", "?b"];
      for (const id of kinds) {
        const lexer = new Lexer(id);
        const tokens = lexer.tokenize();
        expect(tokens[0]?.kind).toBe("GdId");
      }
    });
  });

  describe("string literals", () => {
    it("tokenizes double-quoted strings", () => {
      const lexer = new Lexer('"hello"');
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "String", value: "hello" });
    });

    it("tokenizes single-quoted strings", () => {
      const lexer = new Lexer("'world'");
      const tokens = lexer.tokenize();
      expect(tokens[0]).toMatchObject({ kind: "String", value: "world" });
    });

    it("handles escape sequences", () => {
      const lexer = new Lexer('"hello\\nworld"');
      const tokens = lexer.tokenize();
      expect(tokens[0]?.value).toBe("hello\nworld");
    });

    it("handles tab escape", () => {
      const lexer = new Lexer('"a\\tb"');
      const tokens = lexer.tokenize();
      expect(tokens[0]?.value).toBe("a\tb");
    });

    it("throws on unterminated string", () => {
      const lexer = new Lexer('"unterminated');
      expect(() => lexer.tokenize()).toThrow(LexerError);
    });
  });

  describe("keywords", () => {
    it("recognizes all keywords", () => {
      const keywords = [
        "let",
        "return",
        "if",
        "else",
        "for",
        "in",
        "while",
        "break",
        "continue",
        "import",
        "extract",
        "type",
        "impl",
        "match",
        "null",
        "true",
        "false",
        "self",
        "obj",
        "trigger",
        "throw",
        "sync",
        "as",
        "is",
        "has",
      ];
      for (const kw of keywords) {
        const lexer = new Lexer(kw);
        const tokens = lexer.tokenize();
        expect(tokens[0]?.kind).not.toBe("Identifier");
      }
    });
  });

  describe("operators", () => {
    it("tokenizes multi-char operators", () => {
      const cases: Array<[string, string]> = [
        ["**", "StarStar"],
        ["->", "Arrow"],
        ["=>", "FatArrow"],
        ["<=>", "Spaceship"],
        ["..", "DotDot"],
        ["..=", "DotDotEq"],
        ["::", "ColonColon"],
        ["+=", "PlusEq"],
        ["-=", "MinusEq"],
        ["*=", "StarEq"],
        ["/=", "SlashEq"],
        ["^=", "CaretEq"],
        ["%=", "PercentEq"],
        ["++", "PlusPlus"],
        ["--", "MinusMinus"],
        ["==", "EqEq"],
        ["!=", "BangEq"],
        [">=", "GtEq"],
        ["<=", "LtEq"],
        ["&&", "AmpAmp"],
        ["||", "PipePipe"],
      ];
      for (const [src, kind] of cases) {
        const lexer = new Lexer(src);
        const tokens = lexer.tokenize();
        expect(tokens[0]?.kind, `expected ${src} to be ${kind}`).toBe(kind);
      }
    });
  });

  describe("comments", () => {
    it("skips line comments", () => {
      const kinds = tokenKinds("// comment\nx");
      expect(kinds).toContain("Identifier");
      expect(kinds).not.toContain("Slash");
    });

    it("skips block comments", () => {
      const kinds = tokenKinds("/* block */ x");
      expect(kinds).not.toContain("Star");
      expect(kinds).toContain("Identifier");
    });

    it("throws on unterminated block comment", () => {
      expect(() => tokenKinds("/* unterminated")).toThrow(LexerError);
    });
  });

  describe("newlines", () => {
    it("emits Newline tokens", () => {
      const kinds = tokenKinds("a\nb");
      expect(kinds).toContain("Newline");
    });

    it("does not emit newlines for bare spaces", () => {
      const kinds = tokenKinds("a b");
      expect(kinds).not.toContain("Newline");
    });
  });

  describe("line/column tracking", () => {
    it("tracks line numbers", () => {
      const lexer = new Lexer("a\nb\nc");
      const tokens = lexer.tokenize();
      const identifiers = tokens.filter((t) => t.kind === "Identifier");
      expect(identifiers[0]?.line).toBe(1);
      expect(identifiers[1]?.line).toBe(2);
      expect(identifiers[2]?.line).toBe(3);
    });
  });
});
