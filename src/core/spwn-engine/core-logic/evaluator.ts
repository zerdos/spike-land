/**
 * SPWN Tree-Walking Evaluator
 *
 * Walks the AST produced by the parser and produces runtime Values.
 * Implements SPWN semantics: lexical scoping, impl system, match expressions,
 * list comprehensions, extract, range iteration, and the $ builtin namespace.
 */

import type { AssignTarget, BinaryOperator, Expression, MatchPattern, Statement } from "./ast.js";
import { Environment } from "./environment.js";
import { createBuiltins, type PrintCallback } from "./builtins.js";
import {
  arrayVal,
  boolVal,
  dictVal,
  displayValue,
  isTruthy,
  iterateValue,
  nullVal,
  numVal,
  strVal,
} from "./values.js";
import type { DictValue, MacroValue, TypeValue, Value } from "./values.js";

// ─── Control Flow Signals ─────────────────────────────────────────────────────

class ReturnSignal {
  constructor(public value: Value) {}
}

class BreakSignal {}

class ContinueSignal {}

class ThrowSignal {
  constructor(public value: Value) {}
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

// ─── Evaluator ────────────────────────────────────────────────────────────────

export class Evaluator {
  private globalEnv: Environment;
  /** Global type registry for impl blocks */
  private typeRegistry: Map<string, TypeValue> = new Map();
  private printFn: PrintCallback;

  constructor(printFn: PrintCallback = (text) => console.log(text)) {
    this.printFn = printFn;
    this.globalEnv = new Environment();
    this.setupGlobals();
  }

  /** Evaluate a full program (list of statements) and return the last value */
  evaluate(program: Statement[]): Value {
    let last: Value = nullVal;
    for (const stmt of program) {
      const result = this.execStatement(stmt, this.globalEnv);
      if (result instanceof ReturnSignal) {
        return result.value;
      }
      if (result instanceof ThrowSignal) {
        throw new RuntimeError(`Uncaught throw: ${displayValue(result.value)}`);
      }
      if (result !== null) {
        last = result as Value;
      }
    }
    return last;
  }

  // ─── Statement Execution ──────────────────────────────────────────────────

  private execStatement(
    stmt: Statement,
    env: Environment,
  ): Value | ReturnSignal | BreakSignal | ContinueSignal | ThrowSignal | null {
    switch (stmt.kind) {
      case "AssignStatement": {
        const val = this.evalExpr(stmt.value, env);
        this.assignTarget(stmt.target, val, env, stmt.mutable);
        return null;
      }

      case "CompoundAssignStatement": {
        const current = this.readTarget(stmt.target, env);
        const rhs = this.evalExpr(stmt.value, env);
        const result = this.applyCompound(stmt.operator, current, rhs);
        this.assignTarget(stmt.target, result, env, false);
        return null;
      }

      case "IncrementStatement": {
        const current = this.readTarget(stmt.target, env);
        if (current.kind !== "Number") {
          throw new RuntimeError(`Cannot ${stmt.operator} non-number`);
        }
        const result = numVal(stmt.operator === "++" ? current.value + 1 : current.value - 1);
        this.assignTarget(stmt.target, result, env, false);
        return null;
      }

      case "ExpressionStatement": {
        return this.evalExpr(stmt.expression, env);
      }

      case "ReturnStatement": {
        const val = stmt.value !== null ? this.evalExpr(stmt.value, env) : nullVal;
        return new ReturnSignal(val);
      }

      case "BreakStatement":
        return new BreakSignal();

      case "ContinueStatement":
        return new ContinueSignal();

      case "ThrowStatement": {
        const val = this.evalExpr(stmt.value, env);
        return new ThrowSignal(val);
      }

      case "IfStatement": {
        const cond = this.evalExpr(stmt.condition, env);
        const branch = isTruthy(cond) ? stmt.consequent : (stmt.alternate ?? []);
        return this.execBlock(branch, env.extend());
      }

      case "ForStatement": {
        const iterVal = this.evalExpr(stmt.iterable, env);
        const items = iterateValue(iterVal);
        for (const item of items) {
          const loopEnv = env.extend();
          loopEnv.define(stmt.variable, item, true);
          const signal = this.execBlock(stmt.body, loopEnv);
          if (signal instanceof BreakSignal) break;
          if (signal instanceof ReturnSignal) return signal;
          if (signal instanceof ThrowSignal) return signal;
        }
        return null;
      }

      case "WhileStatement": {
        while (isTruthy(this.evalExpr(stmt.condition, env))) {
          const signal = this.execBlock(stmt.body, env.extend());
          if (signal instanceof BreakSignal) break;
          if (signal instanceof ReturnSignal) return signal;
          if (signal instanceof ThrowSignal) return signal;
        }
        return null;
      }

      case "ExtractStatement": {
        const val = this.evalExpr(stmt.value, env);
        if (val.kind !== "Dict") {
          throw new RuntimeError(`extract requires a dict, got ${val.kind}`);
        }
        for (const [k, v] of val.entries) {
          env.define(k, v, true);
        }
        return null;
      }

      case "TypeDefinition": {
        const typeVal: TypeValue = {
          kind: "Type",
          name: stmt.name,
          methods: new Map(),
        };
        this.typeRegistry.set(stmt.name, typeVal);
        env.define(`@${stmt.name}`, typeVal, false);
        // Also define without @ for convenience in type indicators
        env.define(stmt.name, typeVal, false);
        return null;
      }

      case "ImplBlock": {
        let typeVal = this.typeRegistry.get(stmt.typeName);
        if (typeVal === undefined) {
          // Create type on-the-fly if not declared
          typeVal = { kind: "Type", name: stmt.typeName, methods: new Map() };
          this.typeRegistry.set(stmt.typeName, typeVal);
          env.define(`@${stmt.typeName}`, typeVal, false);
        }
        for (const method of stmt.methods) {
          const methodVal = this.evalExpr(method.value, env);
          typeVal.methods.set(method.key, methodVal);
        }
        return null;
      }

      case "MatchStatement": {
        const subject = this.evalExpr(stmt.subject, env);
        for (const arm of stmt.arms) {
          if (this.matchPattern(arm.pattern, subject, env)) {
            return this.execBlock(arm.body, env.extend());
          }
        }
        return null;
      }

      case "ArrowStatement": {
        // Fire-and-forget: execute but discard signals
        this.execStatement(stmt.body, env);
        return null;
      }
    }
  }

  private execBlock(
    stmts: Statement[],
    env: Environment,
  ): Value | ReturnSignal | BreakSignal | ContinueSignal | ThrowSignal | null {
    let last: Value | ReturnSignal | BreakSignal | ContinueSignal | ThrowSignal | null = null;
    for (const stmt of stmts) {
      const result = this.execStatement(stmt, env);
      if (
        result instanceof ReturnSignal ||
        result instanceof BreakSignal ||
        result instanceof ContinueSignal ||
        result instanceof ThrowSignal
      ) {
        return result;
      }
      if (result !== null) last = result;
    }
    return last;
  }

  // ─── Expression Evaluation ────────────────────────────────────────────────

  evalExpr(expr: Expression, env: Environment): Value {
    switch (expr.kind) {
      case "NumberLiteral":
        return numVal(expr.value);

      case "StringLiteral":
        return strVal(expr.value);

      case "BoolLiteral":
        return boolVal(expr.value);

      case "NullLiteral":
        return nullVal;

      case "GdIdLiteral": {
        switch (expr.idKind) {
          case "group":
            return { kind: "Group", id: expr.value };
          case "color":
            return { kind: "Color", id: expr.value };
          case "item":
            return { kind: "Item", id: expr.value };
          case "block":
            return { kind: "Block", id: expr.value };
        }
      }

      case "TypeIndicator": {
        const existing = this.typeRegistry.get(expr.name);
        if (existing !== undefined) return existing;
        // Return a placeholder type
        return { kind: "Type", name: expr.name, methods: new Map() };
      }

      case "Identifier":
        return env.lookup(expr.name);

      case "ArrayLiteral":
        return arrayVal(expr.elements.map((e) => this.evalExpr(e, env)));

      case "DictLiteral": {
        const entries = new Map<string, Value>();
        for (const e of expr.entries) {
          entries.set(e.key, this.evalExpr(e.value, env));
        }
        return dictVal(entries);
      }

      case "ObjectExpression": {
        const props = new Map<string, Value>();
        for (const e of expr.properties) {
          props.set(e.key, this.evalExpr(e.value, env));
        }
        return { kind: "Object", properties: props };
      }

      case "MacroExpression": {
        const macroVal: MacroValue = {
          kind: "Macro",
          params: expr.params,
          body: expr.body,
          closure: env,
          isTrigger: expr.isTrigger,
        };
        return macroVal;
      }

      case "ListComprehension": {
        const iter = this.evalExpr(expr.iterable, env);
        const items = iterateValue(iter);
        const results: Value[] = [];
        for (const item of items) {
          const loopEnv = env.extend();
          loopEnv.define(expr.variable, item, true);
          if (expr.condition !== null) {
            const cond = this.evalExpr(expr.condition, loopEnv);
            if (!isTruthy(cond)) continue;
          }
          results.push(this.evalExpr(expr.expression, loopEnv));
        }
        return arrayVal(results);
      }

      case "UnaryExpression": {
        const operand = this.evalExpr(expr.operand, env);
        return this.applyUnary(expr.operator, operand);
      }

      case "BinaryExpression": {
        // Short-circuit for &&/||
        if (expr.operator === "&&") {
          const left = this.evalExpr(expr.left, env);
          if (!isTruthy(left)) return left;
          return this.evalExpr(expr.right, env);
        }
        if (expr.operator === "||") {
          const left = this.evalExpr(expr.left, env);
          if (isTruthy(left)) return left;
          return this.evalExpr(expr.right, env);
        }
        // Range construction
        if (expr.operator === ".." || expr.operator === "..=") {
          return this.buildRange(expr.operator, expr.left, expr.right, env);
        }
        const left = this.evalExpr(expr.left, env);
        const right = this.evalExpr(expr.right, env);
        return this.applyBinary(expr.operator, left, right);
      }

      case "MemberAccess": {
        const obj = this.evalExpr(expr.object, env);
        return this.getMember(obj, expr.property);
      }

      case "IndexAccess": {
        const obj = this.evalExpr(expr.object, env);
        const idx = this.evalExpr(expr.index, env);
        return this.getIndex(obj, idx);
      }

      case "CallExpression": {
        const callee = this.evalExpr(expr.callee, env);
        const args = expr.args.map((a) => this.evalExpr(a.value, env));
        return this.callValue(
          callee,
          args,
          expr.args.map((a) => a.name),
        );
      }

      case "TriggerCall": {
        const callee = this.evalExpr(expr.callee, env);
        return this.callValue(callee, [], []);
      }

      case "ConstructorExpression": {
        const typeExpr = this.evalExpr(expr.typeName, env);
        if (typeExpr.kind !== "Type") {
          throw new RuntimeError(`Constructor requires a type indicator, got ${typeExpr.kind}`);
        }
        const fields = new Map<string, Value>();
        fields.set("__type__", typeExpr);
        for (const f of expr.fields) {
          fields.set(f.key, this.evalExpr(f.value, env));
        }
        const instance: DictValue = { kind: "Dict", entries: fields };
        return instance;
      }
    }
  }

  // ─── Operator Application ─────────────────────────────────────────────────

  private applyUnary(op: string, val: Value): Value {
    switch (op) {
      case "-":
        if (val.kind !== "Number")
          throw new RuntimeError(`Unary - requires number, got ${val.kind}`);
        return numVal(-val.value);
      case "!":
        return boolVal(!isTruthy(val));
      case "++":
        if (val.kind !== "Number") throw new RuntimeError(`++ requires number`);
        return numVal(val.value + 1);
      case "--":
        if (val.kind !== "Number") throw new RuntimeError(`-- requires number`);
        return numVal(val.value - 1);
      default:
        throw new RuntimeError(`Unknown unary operator: ${op}`);
    }
  }

  private applyBinary(op: BinaryOperator, left: Value, right: Value): Value {
    // String concatenation
    if (op === "+" && (left.kind === "String" || right.kind === "String")) {
      return strVal(displayValue(left) + displayValue(right));
    }

    // Array concatenation
    if (op === "+" && left.kind === "Array" && right.kind === "Array") {
      return arrayVal([...left.elements, ...right.elements]);
    }

    switch (op) {
      case "+":
        return numVal(requireNum(left, "+") + requireNum(right, "+"));
      case "-":
        return numVal(requireNum(left, "-") - requireNum(right, "-"));
      case "*":
        return numVal(requireNum(left, "*") * requireNum(right, "*"));
      case "/": {
        const divisor = requireNum(right, "/");
        if (divisor === 0) throw new RuntimeError("Division by zero");
        return numVal(requireNum(left, "/") / divisor);
      }
      case "%":
        return numVal(requireNum(left, "%") % requireNum(right, "%"));
      case "^":
        return numVal(Math.pow(requireNum(left, "^"), requireNum(right, "^")));
      case "**":
        return numVal(Math.pow(requireNum(left, "**"), requireNum(right, "**")));
      case "/%": {
        const d = requireNum(right, "/%");
        if (d === 0) throw new RuntimeError("Division by zero in /%");
        return numVal(Math.floor(requireNum(left, "/%") / d));
      }
      case "==":
        return boolVal(valuesEqual(left, right));
      case "!=":
        return boolVal(!valuesEqual(left, right));
      case ">":
        return boolVal(requireNum(left, ">") > requireNum(right, ">"));
      case "<":
        return boolVal(requireNum(left, "<") < requireNum(right, "<"));
      case ">=":
        return boolVal(requireNum(left, ">=") >= requireNum(right, ">="));
      case "<=":
        return boolVal(requireNum(left, "<=") <= requireNum(right, "<="));
      default:
        throw new RuntimeError(`Unknown binary operator: ${op}`);
    }
  }

  private applyCompound(op: string, current: Value, rhs: Value): Value {
    switch (op) {
      case "+=":
        return this.applyBinary("+", current, rhs);
      case "-=":
        return this.applyBinary("-", current, rhs);
      case "*=":
        return this.applyBinary("*", current, rhs);
      case "/=":
        return this.applyBinary("/", current, rhs);
      case "^=":
        return this.applyBinary("^", current, rhs);
      case "%=":
        return this.applyBinary("%", current, rhs);
      default:
        throw new RuntimeError(`Unknown compound operator: ${op}`);
    }
  }

  private buildRange(
    op: ".." | "..=",
    leftExpr: Expression,
    rightExpr: Expression,
    env: Environment,
  ): Value {
    // Check for 3-part range: start..step..end
    // This is encoded as (start..step)..=end or similar — we handle simple 2-part here
    const left = this.evalExpr(leftExpr, env);
    const right = this.evalExpr(rightExpr, env);
    const start = requireNum(left, "range start");
    const end = requireNum(right, "range end");
    return {
      kind: "Range",
      start,
      end,
      step: 1,
      inclusive: op === "..=",
    };
  }

  // ─── Member / Index Access ────────────────────────────────────────────────

  private getMember(obj: Value, prop: string): Value {
    switch (obj.kind) {
      case "Dict": {
        const val = obj.entries.get(prop);
        if (val !== undefined) return val;
        // Check __type__ for impl methods
        const typeVal = obj.entries.get("__type__");
        if (typeVal !== undefined && typeVal.kind === "Type") {
          const method = typeVal.methods.get(prop);
          if (method !== undefined) return this.bindSelf(method, obj);
        }
        throw new RuntimeError(`Dict has no property '${prop}'`);
      }
      case "Type": {
        const method = obj.methods.get(prop);
        if (method !== undefined) return method;
        throw new RuntimeError(`Type @${obj.name} has no method '${prop}'`);
      }
      case "Object": {
        const val = obj.properties.get(prop);
        if (val !== undefined) return val;
        throw new RuntimeError(`Object has no property '${prop}'`);
      }
      case "Array": {
        // Built-in array methods
        return this.getArrayMethod(obj, prop);
      }
      case "String": {
        return this.getStringMethod(obj, prop);
      }
      default:
        throw new RuntimeError(`Cannot access property '${prop}' on ${obj.kind}`);
    }
  }

  private bindSelf(method: Value, self: Value): Value {
    if (method.kind !== "Macro") return method;
    // Return a wrapper that prepends self as first arg
    const original = method;
    return {
      kind: "Builtin",
      name: "bound_method",
      fn: (args: Value[], _printFn: PrintCallback) => {
        return this.callMacro(original, [self, ...args], [null, ...args.map(() => null)]);
      },
    };
  }

  private getArrayMethod(arr: import("./values.js").ArrayValue, prop: string): Value {
    const self = arr;
    const make = (name: string, fn: (args: Value[]) => Value): Value => ({
      kind: "Builtin",
      name,
      fn: (args) => fn(args),
    });

    switch (prop) {
      case "length":
        return numVal(self.elements.length);
      case "push":
        return make("push", (args) => {
          const newEl = args[0];
          if (newEl === undefined) throw new RuntimeError("push requires 1 arg");
          self.elements.push(newEl);
          return nullVal;
        });
      case "pop":
        return make("pop", () => self.elements.pop() ?? nullVal);
      case "map":
        return make("map", (args) => {
          const fn = args[0];
          if (fn === undefined) throw new RuntimeError("map requires a function");
          return arrayVal(self.elements.map((el) => this.callValue(fn, [el], [null])));
        });
      case "filter":
        return make("filter", (args) => {
          const fn = args[0];
          if (fn === undefined) throw new RuntimeError("filter requires a function");
          return arrayVal(self.elements.filter((el) => isTruthy(this.callValue(fn, [el], [null]))));
        });
      case "reduce":
        return make("reduce", (args) => {
          const fn = args[0];
          const initial = args[1];
          if (fn === undefined) throw new RuntimeError("reduce requires a function");
          let acc = initial ?? self.elements[0] ?? nullVal;
          const start = initial !== undefined ? 0 : 1;
          for (let i = start; i < self.elements.length; i++) {
            acc = this.callValue(fn, [acc, self.elements[i] as Value], [null, null]);
          }
          return acc;
        });
      case "contains":
        return make("contains", (args) => {
          const target = args[0];
          if (target === undefined) throw new RuntimeError("contains requires 1 arg");
          return boolVal(self.elements.some((el) => valuesEqual(el, target)));
        });
      case "reverse":
        return make("reverse", () => arrayVal([...self.elements].reverse()));
      case "sort":
        return make("sort", () => {
          const sorted = [...self.elements].sort((a, b) => {
            if (a.kind === "Number" && b.kind === "Number") return a.value - b.value;
            return displayValue(a).localeCompare(displayValue(b));
          });
          return arrayVal(sorted);
        });
      case "join":
        return make("join", (args) => {
          const delim = args[0] !== undefined ? displayValue(args[0]) : "";
          return strVal(self.elements.map(displayValue).join(delim));
        });
      default:
        throw new RuntimeError(`Array has no method '${prop}'`);
    }
  }

  private getStringMethod(str: import("./values.js").StringValue, prop: string): Value {
    const make = (name: string, fn: (args: Value[]) => Value): Value => ({
      kind: "Builtin",
      name,
      fn: (args) => fn(args),
    });

    switch (prop) {
      case "length":
        return numVal(str.value.length);
      case "split":
        return make("split", (args) => {
          const delim = args[0] !== undefined ? displayValue(args[0]) : "";
          return arrayVal(str.value.split(delim).map(strVal));
        });
      case "starts_with":
        return make("starts_with", (args) => {
          const prefix = args[0] !== undefined ? displayValue(args[0]) : "";
          return boolVal(str.value.startsWith(prefix));
        });
      case "ends_with":
        return make("ends_with", (args) => {
          const suffix = args[0] !== undefined ? displayValue(args[0]) : "";
          return boolVal(str.value.endsWith(suffix));
        });
      case "contains":
        return make("contains", (args) => {
          const substr = args[0] !== undefined ? displayValue(args[0]) : "";
          return boolVal(str.value.includes(substr));
        });
      case "to_uppercase":
        return make("to_uppercase", () => strVal(str.value.toUpperCase()));
      case "to_lowercase":
        return make("to_lowercase", () => strVal(str.value.toLowerCase()));
      case "trim":
        return make("trim", () => strVal(str.value.trim()));
      case "replace":
        return make("replace", (args) => {
          const from = displayValue(args[0] ?? nullVal);
          const to = displayValue(args[1] ?? nullVal);
          return strVal(str.value.replaceAll(from, to));
        });
      default:
        throw new RuntimeError(`String has no method '${prop}'`);
    }
  }

  private getIndex(obj: Value, idx: Value): Value {
    if (obj.kind === "Array") {
      if (idx.kind !== "Number")
        throw new RuntimeError(`Array index must be number, got ${idx.kind}`);
      const i = Math.floor(idx.value);
      const norm = i < 0 ? obj.elements.length + i : i;
      const el = obj.elements[norm];
      if (el === undefined) throw new RuntimeError(`Array index ${i} out of bounds`);
      return el;
    }
    if (obj.kind === "Dict") {
      const key = displayValue(idx);
      const val = obj.entries.get(key);
      if (val === undefined) throw new RuntimeError(`Dict key '${key}' not found`);
      return val;
    }
    if (obj.kind === "String") {
      if (idx.kind !== "Number") throw new RuntimeError(`String index must be number`);
      const i = Math.floor(idx.value);
      const ch = obj.value[i];
      if (ch === undefined) throw new RuntimeError(`String index ${i} out of bounds`);
      return strVal(ch);
    }
    throw new RuntimeError(`Cannot index into ${obj.kind}`);
  }

  // ─── Callable Invocation ──────────────────────────────────────────────────

  callValue(callee: Value, args: Value[], argNames: Array<string | null>): Value {
    if (callee.kind === "Macro") {
      return this.callMacro(callee, args, argNames);
    }
    if (callee.kind === "Builtin") {
      return callee.fn(args, this.printFn);
    }
    if (callee.kind === "Dict") {
      // Check for __call__ method
      const call = callee.entries.get("__call__");
      if (call !== undefined) return this.callValue(call, args, argNames);
    }
    if (callee.kind === "Type") {
      // Calling a type like a constructor
      const newMethod = callee.methods.get("new");
      if (newMethod !== undefined) return this.callValue(newMethod, args, argNames);
    }
    throw new RuntimeError(`${callee.kind} is not callable`);
  }

  private callMacro(macro: MacroValue, args: Value[], argNames: Array<string | null>): Value {
    const callEnv = macro.closure.extend();

    // Bind parameters
    for (let i = 0; i < macro.params.length; i++) {
      const param = macro.params[i];
      if (param === undefined) continue;
      // Check for named arg
      const namedIdx = argNames.findIndex((n) => n === param.name);
      if (namedIdx >= 0) {
        callEnv.define(param.name, args[namedIdx] as Value, true);
      } else if (i < args.length) {
        callEnv.define(param.name, args[i] as Value, true);
      } else if (param.defaultValue !== null) {
        callEnv.define(param.name, this.evalExpr(param.defaultValue, macro.closure), true);
      } else {
        callEnv.define(param.name, nullVal, true);
      }
    }

    // Execute body
    if (Array.isArray(macro.body)) {
      const result = this.execBlock(macro.body as import("./ast.js").Statement[], callEnv);
      if (result instanceof ReturnSignal) return result.value;
      if (result instanceof ThrowSignal) throw new RuntimeError(displayValue(result.value));
      if (result instanceof BreakSignal || result instanceof ContinueSignal || result === null)
        return nullVal;
      return result;
    } else {
      // Arrow expression body
      return this.evalExpr(macro.body as Expression, callEnv);
    }
  }

  // ─── Pattern Matching ─────────────────────────────────────────────────────

  private matchPattern(pattern: MatchPattern, subject: Value, env: Environment): boolean {
    switch (pattern.kind) {
      case "WildcardPattern":
        return true;
      case "LiteralPattern": {
        const patVal = this.evalExpr(pattern.value, env);
        return valuesEqual(subject, patVal);
      }
      case "ComparePattern": {
        const patVal = this.evalExpr(pattern.value, env);
        switch (pattern.operator) {
          case "==":
            return valuesEqual(subject, patVal);
          case "!=":
            return !valuesEqual(subject, patVal);
          case ">":
            return requireNum(subject, ">") > requireNum(patVal, ">");
          case "<":
            return requireNum(subject, "<") < requireNum(patVal, "<");
          case ">=":
            return requireNum(subject, ">=") >= requireNum(patVal, ">=");
          case "<=":
            return requireNum(subject, "<=") <= requireNum(patVal, "<=");
          default:
            return false;
        }
      }
    }
  }

  // ─── Target Read / Write ──────────────────────────────────────────────────

  private readTarget(target: AssignTarget, env: Environment): Value {
    switch (target.kind) {
      case "IdentTarget":
        return env.lookup(target.name);
      case "MemberTarget": {
        const obj = this.evalExpr(target.object, env);
        return this.getMember(obj, target.property);
      }
      case "IndexTarget": {
        const obj = this.evalExpr(target.object, env);
        const idx = this.evalExpr(target.index, env);
        return this.getIndex(obj, idx);
      }
    }
  }

  private assignTarget(
    target: AssignTarget,
    value: Value,
    env: Environment,
    mutable: boolean,
  ): void {
    switch (target.kind) {
      case "IdentTarget":
        if (env.has(target.name)) {
          env.assign(target.name, value);
        } else {
          env.define(target.name, value, mutable);
        }
        break;
      case "MemberTarget": {
        const obj = this.evalExpr(target.object, env);
        if (obj.kind === "Dict") {
          obj.entries.set(target.property, value);
        } else if (obj.kind === "Object") {
          obj.properties.set(target.property, value);
        } else {
          throw new RuntimeError(`Cannot set property on ${obj.kind}`);
        }
        break;
      }
      case "IndexTarget": {
        const obj = this.evalExpr(target.object, env);
        const idx = this.evalExpr(target.index, env);
        if (obj.kind === "Array") {
          if (idx.kind !== "Number") throw new RuntimeError("Array index must be number");
          const i = Math.floor(idx.value);
          const norm = i < 0 ? obj.elements.length + i : i;
          obj.elements[norm] = value;
        } else if (obj.kind === "Dict") {
          obj.entries.set(displayValue(idx), value);
        } else {
          throw new RuntimeError(`Cannot index-assign into ${obj.kind}`);
        }
        break;
      }
    }
  }

  // ─── Global Setup ─────────────────────────────────────────────────────────

  private setupGlobals(): void {
    const builtinMethods = createBuiltins();
    const dollarDict: DictValue = { kind: "Dict", entries: builtinMethods };
    this.globalEnv.define("$", dollarDict, false);
    // Expose null / true / false as globals (parser handles keywords but evaluator needs them too)
    this.globalEnv.define("null", nullVal, false);
    this.globalEnv.define("true", boolVal(true), false);
    this.globalEnv.define("false", boolVal(false), false);
  }
}

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

function requireNum(val: Value, ctx: string): number {
  if (val.kind !== "Number") {
    throw new RuntimeError(`${ctx}: expected number, got ${val.kind}`);
  }
  return val.value;
}

function valuesEqual(a: Value, b: Value): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "Number":
      return a.value === (b as typeof a).value;
    case "String":
      return a.value === (b as typeof a).value;
    case "Bool":
      return a.value === (b as typeof a).value;
    case "Null":
      return true;
    case "Group":
      return a.id === (b as typeof a).id;
    case "Color":
      return a.id === (b as typeof a).id;
    case "Item":
      return a.id === (b as typeof a).id;
    case "Block":
      return a.id === (b as typeof a).id;
    case "Type":
      return a.name === (b as typeof a).name;
    case "Array": {
      const ba = b as typeof a;
      if (a.elements.length !== ba.elements.length) return false;
      return a.elements.every((el, i) => valuesEqual(el, ba.elements[i] as Value));
    }
    default:
      return false;
  }
}
