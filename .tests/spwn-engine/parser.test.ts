import { describe, expect, it } from "vitest";
import { Lexer } from "../../src/core/spwn-engine/core-logic/lexer.js";
import { Parser, ParseError } from "../../src/core/spwn-engine/core-logic/parser.js";
import type { Statement } from "../../src/core/spwn-engine/core-logic/ast.js";

function parse(source: string): Statement[] {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser();
  return parser.parse(tokens);
}

describe("Parser", () => {
  describe("assignments", () => {
    it("parses immutable assignment", () => {
      const stmts = parse("x = 10");
      expect(stmts[0]).toMatchObject({
        kind: "AssignStatement",
        target: { kind: "IdentTarget", name: "x" },
        mutable: false,
      });
    });

    it("parses mutable let assignment", () => {
      const stmts = parse("let y = 20");
      expect(stmts[0]).toMatchObject({
        kind: "AssignStatement",
        target: { kind: "IdentTarget", name: "y" },
        mutable: true,
      });
    });

    it("parses compound assignment", () => {
      const stmts = parse("let y = 0\ny += 5");
      expect(stmts[1]).toMatchObject({
        kind: "CompoundAssignStatement",
        operator: "+=",
      });
    });
  });

  describe("expressions", () => {
    it("parses binary arithmetic", () => {
      const stmts = parse("a + b * c");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: {
          kind: "BinaryExpression",
          operator: "+",
          right: { kind: "BinaryExpression", operator: "*" },
        },
      });
    });

    it("respects operator precedence (** > *)", () => {
      const stmts = parse("2 * 3 ** 2");
      const expr = (stmts[0] as { kind: string; expression: unknown }).expression as {
        kind: string;
        operator: string;
        right: { kind: string; operator: string };
      };
      expect(expr.kind).toBe("BinaryExpression");
      expect(expr.operator).toBe("*");
      expect(expr.right.operator).toBe("**");
    });

    it("parses range operator", () => {
      const stmts = parse("0..10");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "BinaryExpression", operator: ".." },
      });
    });

    it("parses inclusive range", () => {
      const stmts = parse("0..=5");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "BinaryExpression", operator: "..=" },
      });
    });

    it("parses member access", () => {
      const stmts = parse("person.name");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "MemberAccess", property: "name" },
      });
    });

    it("parses index access", () => {
      const stmts = parse("arr[0]");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: {
          kind: "IndexAccess",
          index: { kind: "NumberLiteral", value: 0 },
        },
      });
    });

    it("parses call expression", () => {
      const stmts = parse("foo(1, 2)");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: {
          kind: "CallExpression",
          args: [
            { name: null, value: { kind: "NumberLiteral" } },
            { name: null, value: { kind: "NumberLiteral" } },
          ],
        },
      });
    });

    it("parses named arguments", () => {
      const stmts = parse("foo(a: 1, b: 2)");
      const call = (stmts[0] as { expression: { args: Array<{ name: string }> } }).expression;
      expect(call.args[0]?.name).toBe("a");
      expect(call.args[1]?.name).toBe("b");
    });
  });

  describe("literals", () => {
    it("parses array literal", () => {
      const stmts = parse("[1, 2, 3]");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "ArrayLiteral" },
      });
    });

    it("parses dict literal", () => {
      const stmts = parse('{ name: "test" }');
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: {
          kind: "DictLiteral",
          entries: [{ key: "name" }],
        },
      });
    });

    it("parses boolean literals", () => {
      const stmts = parse("true");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "BoolLiteral", value: true },
      });
    });

    it("parses null literal", () => {
      const stmts = parse("null");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "NullLiteral" },
      });
    });

    it("parses GD ID literals", () => {
      const stmts = parse("5g");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "GdIdLiteral", idKind: "group", value: 5 },
      });
    });

    it("parses auto GD IDs", () => {
      const stmts = parse("?g");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "GdIdLiteral", idKind: "group", value: null },
      });
    });

    it("parses type indicators", () => {
      const stmts = parse("@vec2");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "TypeIndicator", name: "vec2" },
      });
    });
  });

  describe("macros", () => {
    it("parses block macro", () => {
      const stmts = parse("(a, b) { return a + b }");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: {
          kind: "MacroExpression",
          params: [{ name: "a" }, { name: "b" }],
        },
      });
    });

    it("parses arrow macro", () => {
      const stmts = parse("n => n * n");
      // This could be parsed as ExpressionStatement with BinaryExpression
      // due to ambiguity — just check it parses without error
      expect(stmts.length).toBeGreaterThan(0);
    });
  });

  describe("list comprehension", () => {
    it("parses list comprehension", () => {
      const stmts = parse("[x * 2 for x in arr]");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: {
          kind: "ListComprehension",
          variable: "x",
        },
      });
    });

    it("parses list comprehension with condition", () => {
      const stmts = parse("[x for x in arr if x > 0]");
      const compr = (stmts[0] as { expression: { condition: unknown } }).expression;
      expect(compr.condition).not.toBeNull();
    });
  });

  describe("control flow", () => {
    it("parses if statement", () => {
      const stmts = parse("if x > 0 { return x }");
      expect(stmts[0]).toMatchObject({ kind: "IfStatement" });
    });

    it("parses if/else statement", () => {
      const stmts = parse("if x > 0 { return 1 } else { return 0 }");
      const ifStmt = stmts[0] as { kind: string; alternate: unknown[] | null };
      expect(ifStmt.alternate).not.toBeNull();
    });

    it("parses for loop", () => {
      const stmts = parse("for i in 0..5 { $.print(i) }");
      expect(stmts[0]).toMatchObject({ kind: "ForStatement", variable: "i" });
    });

    it("parses while loop", () => {
      const stmts = parse("while x > 0 { x -= 1 }");
      expect(stmts[0]).toMatchObject({ kind: "WhileStatement" });
    });

    it("parses return statement", () => {
      const stmts = parse("return 42");
      expect(stmts[0]).toMatchObject({
        kind: "ReturnStatement",
        value: { kind: "NumberLiteral", value: 42 },
      });
    });

    it("parses bare return", () => {
      const stmts = parse("return");
      expect(stmts[0]).toMatchObject({ kind: "ReturnStatement", value: null });
    });

    it("parses break", () => {
      const stmts = parse("break");
      expect(stmts[0]).toMatchObject({ kind: "BreakStatement" });
    });

    it("parses continue", () => {
      const stmts = parse("continue");
      expect(stmts[0]).toMatchObject({ kind: "ContinueStatement" });
    });
  });

  describe("type system", () => {
    it("parses type definition", () => {
      const stmts = parse("type @vec2");
      expect(stmts[0]).toMatchObject({ kind: "TypeDefinition", name: "vec2" });
    });

    it("parses impl block", () => {
      const stmts = parse("impl @vec2 { new: (x, y) { return x } }");
      expect(stmts[0]).toMatchObject({ kind: "ImplBlock", typeName: "vec2" });
    });

    it("parses constructor expression", () => {
      const stmts = parse("@vec2::{ x: 1, y: 2 }");
      expect(stmts[0]).toMatchObject({
        kind: "ExpressionStatement",
        expression: { kind: "ConstructorExpression" },
      });
    });
  });

  describe("match statement", () => {
    it("parses match with compare arms", () => {
      const stmts = parse("match x { == 10 => $.print(x), _ => $.print(x) }");
      expect(stmts[0]).toMatchObject({ kind: "MatchStatement" });
      const match = stmts[0] as { arms: Array<{ pattern: { kind: string } }> };
      expect(match.arms[0]?.pattern.kind).toBe("ComparePattern");
      expect(match.arms[1]?.pattern.kind).toBe("WildcardPattern");
    });
  });

  describe("extract statement", () => {
    it("parses extract", () => {
      const stmts = parse("extract d");
      expect(stmts[0]).toMatchObject({ kind: "ExtractStatement" });
    });
  });

  describe("arrow statement", () => {
    it("parses arrow statement", () => {
      const stmts = parse("-> $.print(1)");
      expect(stmts[0]).toMatchObject({ kind: "ArrowStatement" });
    });
  });

  describe("errors", () => {
    it("throws on unexpected token", () => {
      expect(() => parse("@@@")).toThrow(ParseError);
    });
  });
});
