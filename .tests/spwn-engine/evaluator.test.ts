import { describe, expect, it, vi } from "vitest";
import { run } from "../../src/core/spwn-engine/core-logic/index.js";
import type { Value } from "../../src/core/spwn-engine/core-logic/values.js";
import { displayValue } from "../../src/core/spwn-engine/core-logic/values.js";

function eval_(code: string, outputs: string[] = []): Value {
  return run(code, (text) => outputs.push(text));
}

function evalOutput(code: string): string[] {
  const outputs: string[] = [];
  run(code, (text) => outputs.push(text));
  return outputs;
}

describe("Evaluator", () => {
  describe("basic values", () => {
    it("evaluates numbers", () => {
      expect(eval_("42")).toMatchObject({ kind: "Number", value: 42 });
    });

    it("evaluates strings", () => {
      expect(eval_('"hello"')).toMatchObject({ kind: "String", value: "hello" });
    });

    it("evaluates true", () => {
      expect(eval_("true")).toMatchObject({ kind: "Bool", value: true });
    });

    it("evaluates false", () => {
      expect(eval_("false")).toMatchObject({ kind: "Bool", value: false });
    });

    it("evaluates null", () => {
      expect(eval_("null")).toMatchObject({ kind: "Null" });
    });
  });

  describe("arithmetic", () => {
    it("adds numbers", () => {
      expect(eval_("2 + 3")).toMatchObject({ kind: "Number", value: 5 });
    });

    it("subtracts numbers", () => {
      expect(eval_("10 - 4")).toMatchObject({ kind: "Number", value: 6 });
    });

    it("multiplies", () => {
      expect(eval_("3 * 4")).toMatchObject({ kind: "Number", value: 12 });
    });

    it("divides", () => {
      expect(eval_("10 / 4")).toMatchObject({ kind: "Number", value: 2.5 });
    });

    it("modulo", () => {
      expect(eval_("10 % 3")).toMatchObject({ kind: "Number", value: 1 });
    });

    it("exponentiation with ^", () => {
      expect(eval_("2 ^ 10")).toMatchObject({ kind: "Number", value: 1024 });
    });

    it("exponentiation with **", () => {
      expect(eval_("2 ** 8")).toMatchObject({ kind: "Number", value: 256 });
    });

    it("floor division /%", () => {
      expect(eval_("10 /% 3")).toMatchObject({ kind: "Number", value: 3 });
    });

    it("throws on division by zero", () => {
      expect(() => eval_("1 / 0")).toThrow();
    });
  });

  describe("string operations", () => {
    it("concatenates strings with +", () => {
      expect(eval_('"foo" + "bar"')).toMatchObject({ kind: "String", value: "foobar" });
    });

    it("coerces number to string in +", () => {
      const result = eval_('"n=" + 42');
      expect(result).toMatchObject({ kind: "String", value: "n=42" });
    });
  });

  describe("comparison operators", () => {
    it("== returns true for equal values", () => {
      expect(eval_("5 == 5")).toMatchObject({ kind: "Bool", value: true });
    });

    it("== returns false for unequal values", () => {
      expect(eval_("5 == 6")).toMatchObject({ kind: "Bool", value: false });
    });

    it("!= works", () => {
      expect(eval_("5 != 6")).toMatchObject({ kind: "Bool", value: true });
    });

    it("> works", () => {
      expect(eval_("5 > 3")).toMatchObject({ kind: "Bool", value: true });
    });

    it("<= works", () => {
      expect(eval_("3 <= 3")).toMatchObject({ kind: "Bool", value: true });
    });
  });

  describe("logical operators", () => {
    it("&& short-circuits on false", () => {
      const outputs: string[] = [];
      eval_("false && $.print('x')", outputs);
      expect(outputs).toHaveLength(0);
    });

    it("|| short-circuits on true", () => {
      const outputs: string[] = [];
      eval_("true || $.print('x')", outputs);
      expect(outputs).toHaveLength(0);
    });
  });

  describe("variables", () => {
    it("assigns and looks up", () => {
      expect(eval_("x = 42\nx")).toMatchObject({ kind: "Number", value: 42 });
    });

    it("let creates mutable variable", () => {
      expect(eval_("let y = 10\ny += 5\ny")).toMatchObject({ kind: "Number", value: 15 });
    });

    it("throws on undefined variable", () => {
      expect(() => eval_("undefinedVar")).toThrow();
    });
  });

  describe("macros (functions)", () => {
    it("calls a macro", () => {
      const result = eval_("add = (a, b) { return a + b }\nadd(10, 25)");
      expect(result).toMatchObject({ kind: "Number", value: 35 });
    });

    it("arrow macro", () => {
      // Parse as assignment: square = n => n * n
      const result = eval_("square = (n) { return n * n }\nsquare(5)");
      expect(result).toMatchObject({ kind: "Number", value: 25 });
    });

    it("captures closure", () => {
      const result = eval_("x = 10\nf = () { return x }\nf()");
      expect(result).toMatchObject({ kind: "Number", value: 10 });
    });

    it("handles default parameters", () => {
      const result = eval_("f = (x, y = 5) { return x + y }\nf(3)");
      expect(result).toMatchObject({ kind: "Number", value: 8 });
    });
  });

  describe("$.print", () => {
    it("prints values", () => {
      const outputs = evalOutput("$.print(42)");
      expect(outputs).toEqual(["42"]);
    });

    it("prints multiple args", () => {
      const outputs = evalOutput('$.print(1, "two", 3)');
      expect(outputs).toEqual(["1 two 3"]);
    });
  });

  describe("$.assert", () => {
    it("passes on true", () => {
      expect(() => eval_("$.assert(true)")).not.toThrow();
    });

    it("throws on false", () => {
      expect(() => eval_("$.assert(false)")).toThrow();
    });

    it("throws with message", () => {
      expect(() => eval_('$.assert(false, "boom")')).toThrow("boom");
    });
  });

  describe("$.type_of", () => {
    it("returns type name", () => {
      expect(eval_("$.type_of(42)")).toMatchObject({ kind: "String", value: "@number" });
      expect(eval_('"x" \n $.type_of("x")')).toMatchObject({ kind: "String", value: "@string" });
    });
  });

  describe("$.length", () => {
    it("returns array length", () => {
      expect(eval_("$.length([1,2,3])")).toMatchObject({ kind: "Number", value: 3 });
    });

    it("returns string length", () => {
      expect(eval_('$.length("hello")')).toMatchObject({ kind: "Number", value: 5 });
    });
  });

  describe("arrays", () => {
    it("creates arrays", () => {
      const val = eval_("[1, 2, 3]");
      expect(val.kind).toBe("Array");
    });

    it("indexes arrays", () => {
      expect(eval_("[10, 20, 30][1]")).toMatchObject({ kind: "Number", value: 20 });
    });

    it("negative indexing", () => {
      expect(eval_("[10, 20, 30][-1]")).toMatchObject({ kind: "Number", value: 30 });
    });

    it("array.length", () => {
      expect(eval_("[1,2,3].length")).toMatchObject({ kind: "Number", value: 3 });
    });

    it("array.map", () => {
      const outputs = evalOutput("$.print([1,2,3].map((x) { return x * 2 }))");
      expect(outputs[0]).toBe("[2, 4, 6]");
    });

    it("array.filter", () => {
      const outputs = evalOutput("$.print([1,2,3,4].filter((x) { return x > 2 }))");
      expect(outputs[0]).toBe("[3, 4]");
    });

    it("array concatenation with +", () => {
      const result = eval_("[1,2] + [3,4]");
      expect(displayValue(result)).toBe("[1, 2, 3, 4]");
    });
  });

  describe("list comprehension", () => {
    it("produces doubled array", () => {
      const outputs = evalOutput("arr = [1,2,3,4,5]\n$.print([x * 2 for x in arr])");
      expect(outputs[0]).toBe("[2, 4, 6, 8, 10]");
    });

    it("filters with if condition", () => {
      const outputs = evalOutput("$.print([x for x in [1,2,3,4] if x > 2])");
      expect(outputs[0]).toBe("[3, 4]");
    });
  });

  describe("dicts", () => {
    it("creates dicts", () => {
      const val = eval_('{ name: "Spu7Nix", age: 20 }');
      expect(val.kind).toBe("Dict");
    });

    it("accesses dict fields", () => {
      const outputs = evalOutput('person = { name: "Spu7Nix", age: 20 }\n$.print(person.name)');
      expect(outputs[0]).toBe("Spu7Nix");
    });

    it("indexes dicts", () => {
      const outputs = evalOutput('d = { x: 42 }\n$.print(d["x"])');
      expect(outputs[0]).toBe("42");
    });
  });

  describe("for loops", () => {
    it("iterates over range", () => {
      const outputs = evalOutput("for i in 0..5 { $.print(i) }");
      expect(outputs).toEqual(["0", "1", "2", "3", "4"]);
    });

    it("iterates over array", () => {
      const outputs = evalOutput("for x in [10, 20, 30] { $.print(x) }");
      expect(outputs).toEqual(["10", "20", "30"]);
    });

    it("supports break", () => {
      const outputs = evalOutput("for i in 0..10 { if i == 3 { break } $.print(i) }");
      expect(outputs).toEqual(["0", "1", "2"]);
    });
  });

  describe("while loops", () => {
    it("loops while condition true", () => {
      const outputs = evalOutput("let i = 0\nwhile i < 3 { $.print(i)\ni += 1 }");
      expect(outputs).toEqual(["0", "1", "2"]);
    });
  });

  describe("if/else", () => {
    it("takes consequent branch", () => {
      const outputs = evalOutput("if true { $.print(1) } else { $.print(2) }");
      expect(outputs).toEqual(["1"]);
    });

    it("takes alternate branch", () => {
      const outputs = evalOutput("if false { $.print(1) } else { $.print(2) }");
      expect(outputs).toEqual(["2"]);
    });

    it("if without else on false does nothing", () => {
      const outputs = evalOutput("if false { $.print(1) }");
      expect(outputs).toHaveLength(0);
    });
  });

  describe("GD IDs", () => {
    it("creates Group values", () => {
      const val = eval_("5g");
      expect(val).toMatchObject({ kind: "Group", id: 5 });
    });

    it("creates auto Group values", () => {
      const val = eval_("?g");
      expect(val).toMatchObject({ kind: "Group", id: null });
    });

    it("displays group values", () => {
      const outputs = evalOutput("$.print(5g)");
      expect(outputs[0]).toBe("Group(5)");
    });

    it("displays auto group values", () => {
      const outputs = evalOutput("$.print(?g)");
      expect(outputs[0]).toBe("Group(?)");
    });

    it("creates all GD ID types", () => {
      expect(eval_("3c")).toMatchObject({ kind: "Color", id: 3 });
      expect(eval_("7i")).toMatchObject({ kind: "Item", id: 7 });
      expect(eval_("2b")).toMatchObject({ kind: "Block", id: 2 });
    });
  });

  describe("type and impl", () => {
    it("creates a type and instantiates it", () => {
      const code = `
type @vec2
impl @vec2 {
  new: (x, y) {
    return @vec2::{ x: x, y: y }
  },
  length: (self) {
    return (self.x ^ 2 + self.y ^ 2) ^ 0.5
  }
}
v = @vec2::new(3, 4)
$.print(v.length())
`;
      const outputs = evalOutput(code);
      expect(outputs[0]).toBe("5");
    });
  });

  describe("match statement", () => {
    it("matches == pattern", () => {
      const outputs = evalOutput(`
x = 10
match x {
  == 10 => $.print("ten"),
  > 5 => $.print("big"),
  _ => $.print("other"),
}
`);
      expect(outputs[0]).toBe("ten");
    });

    it("matches > pattern", () => {
      const outputs = evalOutput(`
x = 7
match x {
  == 10 => $.print("ten"),
  > 5 => $.print("big"),
  _ => $.print("other"),
}
`);
      expect(outputs[0]).toBe("big");
    });

    it("matches wildcard", () => {
      const outputs = evalOutput(`
x = 1
match x {
  == 10 => $.print("ten"),
  _ => $.print("other"),
}
`);
      expect(outputs[0]).toBe("other");
    });
  });

  describe("extract", () => {
    it("extracts dict keys into scope", () => {
      const outputs = evalOutput("d = { x: 100, y: 200 }\nextract d\n$.print(x)");
      expect(outputs[0]).toBe("100");
    });
  });

  describe("full example", () => {
    it("runs the showcase example", () => {
      const outputs = evalOutput(`
x = 10
let y = 20
y += 5
add = (a, b) { return a + b }
result = add(x, y)
$.print(result)
`);
      expect(outputs[0]).toBe("35");
    });
  });
});
