/**
 * SPWN Environment (Variable Scope)
 *
 * Implements lexical scoping with mutable/immutable variable tracking.
 * Each Environment has an optional parent for scope chain lookup.
 */

import type { Value } from "./values.js";

export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentError";
  }
}

interface Binding {
  value: Value;
  mutable: boolean;
}

export class Environment {
  private bindings: Map<string, Binding> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  /** Define a new variable in the current scope */
  define(name: string, value: Value, mutable: boolean): void {
    this.bindings.set(name, { value, mutable });
  }

  /** Look up a variable by walking the scope chain */
  lookup(name: string): Value {
    const binding = this.bindings.get(name);
    if (binding !== undefined) return binding.value;
    if (this.parent !== null) return this.parent.lookup(name);
    throw new EnvironmentError(`Undefined variable: '${name}'`);
  }

  /** Assign to an existing variable (must already be defined) */
  assign(name: string, value: Value): void {
    const binding = this.bindings.get(name);
    if (binding !== undefined) {
      if (!binding.mutable) {
        throw new EnvironmentError(`Cannot assign to immutable variable: '${name}'`);
      }
      this.bindings.set(name, { value, mutable: true });
      return;
    }
    if (this.parent !== null) {
      this.parent.assign(name, value);
      return;
    }
    // SPWN semantics: top-level assignment defines a new immutable binding
    this.bindings.set(name, { value, mutable: false });
  }

  /** Create a child scope */
  extend(): Environment {
    return new Environment(this);
  }

  /** Check if a name is defined anywhere in scope chain */
  has(name: string): boolean {
    if (this.bindings.has(name)) return true;
    return this.parent?.has(name) ?? false;
  }

  /** Get all names defined in current (non-parent) scope */
  localNames(): string[] {
    return Array.from(this.bindings.keys());
  }

  /** Get all bindings in current scope (for extract) */
  localEntries(): Array<[string, Value]> {
    return Array.from(this.bindings.entries()).map(([k, v]) => [k, v.value]);
  }

  /** Force-define (overwrite without mutability check), used by impl */
  forceDefine(name: string, value: Value): void {
    this.bindings.set(name, { value, mutable: true });
  }
}
