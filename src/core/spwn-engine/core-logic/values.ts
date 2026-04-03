/**
 * SPWN Runtime Value Types
 *
 * All values the evaluator can produce are represented as discriminated unions.
 * GD IDs (Group, Color, Item, Block) are opaque runtime values.
 */

import type { MacroParam, Statement } from "./ast.js";
import type { Expression } from "./ast.js";
import type { Environment } from "./environment.js";

// ─── Primitive Values ─────────────────────────────────────────────────────────

export interface NumberValue {
  kind: "Number";
  value: number;
}

export interface StringValue {
  kind: "String";
  value: string;
}

export interface BoolValue {
  kind: "Bool";
  value: boolean;
}

export interface NullValue {
  kind: "Null";
}

// ─── Collection Values ────────────────────────────────────────────────────────

export interface ArrayValue {
  kind: "Array";
  elements: Value[];
}

export interface DictValue {
  kind: "Dict";
  entries: Map<string, Value>;
}

// ─── Callable Values ──────────────────────────────────────────────────────────

export interface MacroValue {
  kind: "Macro";
  params: MacroParam[];
  body: Statement[] | Expression;
  closure: Environment;
  isTrigger: boolean;
}

export interface BuiltinValue {
  kind: "Builtin";
  name: string;
  fn: (args: Value[], printFn: (text: string) => void) => Value;
}

// ─── GD ID Values (opaque) ────────────────────────────────────────────────────

export interface GroupValue {
  kind: "Group";
  id: number | null; // null = auto
}

export interface ColorValue {
  kind: "Color";
  id: number | null;
}

export interface ItemValue {
  kind: "Item";
  id: number | null;
}

export interface BlockValue {
  kind: "Block";
  id: number | null;
}

// ─── Type & Range Values ──────────────────────────────────────────────────────

export interface TypeValue {
  kind: "Type";
  name: string;
  /** Methods registered via impl */
  methods: Map<string, Value>;
}

export interface RangeValue {
  kind: "Range";
  start: number;
  end: number;
  step: number;
  inclusive: boolean;
}

/** GD Object (obj { prop: value }) */
export interface ObjectValue {
  kind: "Object";
  properties: Map<string, Value>;
}

export type Value =
  | NumberValue
  | StringValue
  | BoolValue
  | NullValue
  | ArrayValue
  | DictValue
  | MacroValue
  | BuiltinValue
  | GroupValue
  | ColorValue
  | ItemValue
  | BlockValue
  | TypeValue
  | RangeValue
  | ObjectValue;

// ─── Value Constructors ───────────────────────────────────────────────────────

export function numVal(value: number): NumberValue {
  return { kind: "Number", value };
}

export function strVal(value: string): StringValue {
  return { kind: "String", value };
}

export function boolVal(value: boolean): BoolValue {
  return { kind: "Bool", value };
}

export const nullVal: NullValue = { kind: "Null" };

export function arrayVal(elements: Value[]): ArrayValue {
  return { kind: "Array", elements };
}

export function dictVal(entries: Map<string, Value>): DictValue {
  return { kind: "Dict", entries };
}

// ─── Value Display ────────────────────────────────────────────────────────────

export function displayValue(val: Value): string {
  switch (val.kind) {
    case "Number":
      // Avoid trailing .0 for integer-valued floats
      return Number.isInteger(val.value) ? String(val.value) : String(val.value);
    case "String":
      return val.value;
    case "Bool":
      return val.value ? "true" : "false";
    case "Null":
      return "null";
    case "Array":
      return `[${val.elements.map(displayValue).join(", ")}]`;
    case "Dict": {
      const pairs = Array.from(val.entries.entries())
        .map(([k, v]) => `${k}: ${displayValue(v)}`)
        .join(", ");
      return `{${pairs}}`;
    }
    case "Macro":
      return val.isTrigger ? "<trigger function>" : "<macro>";
    case "Builtin":
      return `<builtin:${val.name}>`;
    case "Group":
      return val.id === null ? "Group(?)" : `Group(${val.id})`;
    case "Color":
      return val.id === null ? "Color(?)" : `Color(${val.id})`;
    case "Item":
      return val.id === null ? "Item(?)" : `Item(${val.id})`;
    case "Block":
      return val.id === null ? "Block(?)" : `Block(${val.id})`;
    case "Type":
      return `@${val.name}`;
    case "Range":
      return val.inclusive
        ? `Range(${val.start}..=${val.end}, step=${val.step})`
        : `Range(${val.start}..${val.end}, step=${val.step})`;
    case "Object": {
      const pairs = Array.from(val.properties.entries())
        .map(([k, v]) => `${k}: ${displayValue(v)}`)
        .join(", ");
      return `obj{${pairs}}`;
    }
  }
}

/** Determine the type name string of a value, matching SPWN's $.type_of() */
export function typeNameOf(val: Value): string {
  switch (val.kind) {
    case "Number":
      return "@number";
    case "String":
      return "@string";
    case "Bool":
      return "@bool";
    case "Null":
      return "@null";
    case "Array":
      return "@array";
    case "Dict":
      return "@dict";
    case "Macro":
      return "@macro";
    case "Builtin":
      return "@builtin";
    case "Group":
      return "@group";
    case "Color":
      return "@color";
    case "Item":
      return "@item";
    case "Block":
      return "@block";
    case "Type":
      return "@type_indicator";
    case "Range":
      return "@range";
    case "Object":
      return "@object";
  }
}

/** Coerce a value to a boolean for conditionals */
export function isTruthy(val: Value): boolean {
  switch (val.kind) {
    case "Bool":
      return val.value;
    case "Null":
      return false;
    case "Number":
      return val.value !== 0;
    case "String":
      return val.value.length > 0;
    case "Array":
      return val.elements.length > 0;
    default:
      return true;
  }
}

/** Iterate a value as a sequence (for for-loops) */
export function iterateValue(val: Value): Value[] {
  switch (val.kind) {
    case "Array":
      return val.elements;
    case "Range": {
      const result: Value[] = [];
      const { start, end, step, inclusive } = val;
      if (step > 0) {
        for (let i = start; inclusive ? i <= end : i < end; i += step) {
          result.push(numVal(i));
        }
      } else if (step < 0) {
        for (let i = start; inclusive ? i >= end : i > end; i += step) {
          result.push(numVal(i));
        }
      }
      return result;
    }
    case "String":
      return val.value.split("").map(strVal);
    default:
      throw new TypeError(`Value of type ${val.kind} is not iterable`);
  }
}
