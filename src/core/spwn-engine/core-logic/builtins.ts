/**
 * SPWN Built-in Functions ($)
 *
 * Implements the standard $ builtins: $.print, $.add, $.assert,
 * $.type_of, $.length, $.range, $.string, $.number, $.bool, $.split, $.join.
 *
 * The print function emits via an injected callback to support Web Worker output.
 */

import { arrayVal, boolVal, displayValue, numVal, nullVal, strVal, typeNameOf } from "./values.js";
import type { BuiltinValue, Value } from "./values.js";

export type PrintCallback = (text: string) => void;

/** Build the $ dict value containing all built-in functions */
export function createBuiltins(_printFn?: PrintCallback): Map<string, Value> {
  const make = (name: string, fn: (args: Value[]) => Value): BuiltinValue => ({
    kind: "Builtin",
    name,
    fn: (args: Value[], _print: PrintCallback) => fn(args),
  });

  const makePrint = (
    name: string,
    fn: (args: Value[], print: PrintCallback) => Value,
  ): BuiltinValue => ({
    kind: "Builtin",
    name,
    fn,
  });

  const builtins: Map<string, Value> = new Map([
    // $.print(...values)
    [
      "print",
      makePrint("print", (args, print) => {
        print(args.map(displayValue).join(" "));
        return nullVal;
      }),
    ],

    // $.add(value, group?) — stub for GD add (no-op in pure evaluator)
    [
      "add",
      make("add", (args) => {
        if (args.length === 0) throw new Error("$.add requires at least 1 argument");
        return nullVal;
      }),
    ],

    // $.assert(condition, message?)
    [
      "assert",
      make("assert", (args) => {
        const cond = args[0];
        if (cond === undefined) throw new Error("$.assert requires at least 1 argument");
        if (cond.kind === "Bool" && !cond.value) {
          const msg = args[1] !== undefined ? displayValue(args[1]) : "Assertion failed";
          throw new Error(msg);
        }
        return nullVal;
      }),
    ],

    // $.type_of(value) -> @typename string
    [
      "type_of",
      make("type_of", (args) => {
        const val = args[0];
        if (val === undefined) throw new Error("$.type_of requires 1 argument");
        return strVal(typeNameOf(val));
      }),
    ],

    // $.length(value) -> number
    [
      "length",
      make("length", (args) => {
        const val = args[0];
        if (val === undefined) throw new Error("$.length requires 1 argument");
        if (val.kind === "Array") return numVal(val.elements.length);
        if (val.kind === "String") return numVal(val.value.length);
        if (val.kind === "Dict") return numVal(val.entries.size);
        throw new Error(`$.length: ${val.kind} has no length`);
      }),
    ],

    // $.range(start, end, step?) -> array
    [
      "range",
      make("range", (args) => {
        const start = requireNumber(args[0], "$.range start");
        const end = requireNumber(args[1], "$.range end");
        const step = args[2] !== undefined ? requireNumber(args[2], "$.range step") : 1;
        const elements: Value[] = [];
        for (let i = start; i < end; i += step) {
          elements.push(numVal(i));
        }
        return arrayVal(elements);
      }),
    ],

    // $.string(value) -> string
    [
      "string",
      make("string", (args) => {
        const val = args[0];
        if (val === undefined) throw new Error("$.string requires 1 argument");
        return strVal(displayValue(val));
      }),
    ],

    // $.number(value) -> number
    [
      "number",
      make("number", (args) => {
        const val = args[0];
        if (val === undefined) throw new Error("$.number requires 1 argument");
        if (val.kind === "Number") return val;
        if (val.kind === "String") {
          const n = parseFloat(val.value);
          if (isNaN(n)) throw new Error(`$.number: cannot convert '${val.value}' to number`);
          return numVal(n);
        }
        if (val.kind === "Bool") return numVal(val.value ? 1 : 0);
        throw new Error(`$.number: cannot convert ${val.kind} to number`);
      }),
    ],

    // $.bool(value) -> bool
    [
      "bool",
      make("bool", (args) => {
        const val = args[0];
        if (val === undefined) throw new Error("$.bool requires 1 argument");
        if (val.kind === "Bool") return val;
        if (val.kind === "Number") return boolVal(val.value !== 0);
        if (val.kind === "Null") return boolVal(false);
        return boolVal(true);
      }),
    ],

    // $.split(string, delimiter) -> array
    [
      "split",
      make("split", (args) => {
        const str = requireString(args[0], "$.split str");
        const delim = requireString(args[1], "$.split delimiter");
        return arrayVal(str.split(delim).map(strVal));
      }),
    ],

    // $.join(array, delimiter?) -> string
    [
      "join",
      make("join", (args) => {
        const arr = args[0];
        if (arr === undefined || arr.kind !== "Array") throw new Error("$.join requires an array");
        const delim = args[1] !== undefined ? requireString(args[1], "$.join delimiter") : "";
        return strVal(arr.elements.map(displayValue).join(delim));
      }),
    ],

    // $.floor(n), $.ceil(n), $.round(n), $.abs(n)
    ["floor", make("floor", (args) => numVal(Math.floor(requireNumber(args[0], "$.floor"))))],
    ["ceil", make("ceil", (args) => numVal(Math.ceil(requireNumber(args[0], "$.ceil"))))],
    ["round", make("round", (args) => numVal(Math.round(requireNumber(args[0], "$.round"))))],
    ["abs", make("abs", (args) => numVal(Math.abs(requireNumber(args[0], "$.abs"))))],
    ["sqrt", make("sqrt", (args) => numVal(Math.sqrt(requireNumber(args[0], "$.sqrt"))))],
    ["sin", make("sin", (args) => numVal(Math.sin(requireNumber(args[0], "$.sin"))))],
    ["cos", make("cos", (args) => numVal(Math.cos(requireNumber(args[0], "$.cos"))))],
    ["tan", make("tan", (args) => numVal(Math.tan(requireNumber(args[0], "$.tan"))))],
    ["log", make("log", (args) => numVal(Math.log(requireNumber(args[0], "$.log"))))],
    ["min", make("min", (args) => numVal(Math.min(...args.map((a) => requireNumber(a, "$.min")))))],
    ["max", make("max", (args) => numVal(Math.max(...args.map((a) => requireNumber(a, "$.max")))))],

    // $.keys(dict) -> array of strings
    [
      "keys",
      make("keys", (args) => {
        const val = args[0];
        if (val === undefined || val.kind !== "Dict") throw new Error("$.keys requires a dict");
        return arrayVal(Array.from(val.entries.keys()).map(strVal));
      }),
    ],

    // $.values(dict) -> array
    [
      "values",
      make("values", (args) => {
        const val = args[0];
        if (val === undefined || val.kind !== "Dict") throw new Error("$.values requires a dict");
        return arrayVal(Array.from(val.entries.values()));
      }),
    ],
  ]);

  // Wrap all builtins to inject the printFn
  const wrapped = new Map<string, Value>();
  for (const [key, val] of builtins) {
    if (val.kind === "Builtin") {
      const original = val.fn;
      wrapped.set(key, {
        kind: "Builtin",
        name: val.name,
        fn: (args: Value[], p: PrintCallback) => original(args, p),
      });
    } else {
      wrapped.set(key, val);
    }
  }

  return wrapped;

  function requireNumber(val: Value | undefined, ctx: string): number {
    if (val === undefined || val.kind !== "Number") {
      throw new Error(`${ctx}: expected number, got ${val?.kind ?? "undefined"}`);
    }
    return val.value;
  }

  function requireString(val: Value | undefined, ctx: string): string {
    if (val === undefined || val.kind !== "String") {
      throw new Error(`${ctx}: expected string, got ${val?.kind ?? "undefined"}`);
    }
    return val.value;
  }
}
