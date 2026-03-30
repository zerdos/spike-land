import { describe, it, expect, beforeEach } from "vitest";
import {
  clearMachines,
  createMachine,
  getMachine,
  addState,
  addTransition,
  removeState,
  removeTransition,
  sendEvent,
  getState,
  getHistory,
  resetMachine,
  validateMachine,
  setContext,
  listMachines,
  exportMachine,
} from "../node-sys/engine.js";

// Helper: build a minimal 2-state machine (idle -> active)
function buildSimpleMachine(userId = "user-1") {
  const machine = createMachine({
    name: "test-machine",
    userId,
    initial: "idle",
  });
  const id = machine.definition.id;

  addState(id, { id: "idle", type: "atomic" });
  addState(id, { id: "active", type: "atomic" });
  addTransition(id, {
    id: "t-start",
    source: "idle",
    target: "active",
    event: "START",
    actions: [],
    internal: false,
  });
  addTransition(id, {
    id: "t-stop",
    source: "active",
    target: "idle",
    event: "STOP",
    actions: [],
    internal: false,
  });

  return id;
}

beforeEach(() => {
  clearMachines();
});

describe("createMachine", () => {
  it("creates a machine with a generated ID when none is provided", () => {
    const m = createMachine({ name: "m1", userId: "u1" });
    expect(m.definition.id).toBeTruthy();
  });

  it("uses the provided ID", () => {
    const m = createMachine({ id: "my-id", name: "m2", userId: "u1" });
    expect(m.definition.id).toBe("my-id");
  });

  it("throws when a duplicate ID is registered", () => {
    createMachine({ id: "dup-id", name: "m3", userId: "u1" });
    expect(() => createMachine({ id: "dup-id", name: "m4", userId: "u1" })).toThrow(
      /already exists/,
    );
  });

  it("initialises context from definition", () => {
    const m = createMachine({
      name: "ctx",
      userId: "u1",
      context: { count: 0 },
    });
    expect(m.context.count).toBe(0);
  });
});

describe("getMachine", () => {
  it("throws for an unknown machine ID", () => {
    expect(() => getMachine("no-such-machine")).toThrow(/not found/);
  });
});

describe("addState / removeState", () => {
  it("adds a state to the machine definition", () => {
    const m = createMachine({ name: "m", userId: "u1" });
    addState(m.definition.id, { id: "s1", type: "atomic" });
    expect(m.definition.states["s1"]).toBeDefined();
  });

  it("links child states to their parent", () => {
    const m = createMachine({ name: "m", userId: "u1" });
    addState(m.definition.id, { id: "parent", type: "compound", initial: "child" });
    addState(m.definition.id, { id: "child", type: "atomic", parent: "parent" });
    expect(m.definition.states["parent"]?.children).toContain("child");
  });

  it("removeState deletes the state and cleans up transitions", () => {
    const id = buildSimpleMachine();
    removeState(id, "active");
    const m = getMachine(id);
    expect(m.definition.states["active"]).toBeUndefined();
    expect(
      m.definition.transitions.some((t) => t.source === "active" || t.target === "active"),
    ).toBe(false);
  });

  it("removeState throws when state does not exist", () => {
    const m = createMachine({ name: "m", userId: "u1" });
    expect(() => removeState(m.definition.id, "ghost")).toThrow();
  });
});

describe("addTransition / removeTransition", () => {
  it("addTransition registers a transition", () => {
    const m = createMachine({ name: "m", userId: "u1" });
    addState(m.definition.id, { id: "a", type: "atomic" });
    addState(m.definition.id, { id: "b", type: "atomic" });
    const t = addTransition(m.definition.id, {
      source: "a",
      target: "b",
      event: "GO",
      actions: [],
      internal: false,
    });
    expect(t.id).toBeTruthy();
    expect(m.definition.transitions.some((x) => x.id === t.id)).toBe(true);
  });

  it("removeTransition removes the correct transition", () => {
    const id = buildSimpleMachine();
    const m = getMachine(id);
    const before = m.definition.transitions.length;
    removeTransition(id, "t-start");
    expect(m.definition.transitions.length).toBe(before - 1);
  });

  it("removeTransition throws when transition does not exist", () => {
    const m = createMachine({ name: "m", userId: "u1" });
    expect(() => removeTransition(m.definition.id, "ghost-transition")).toThrow();
  });
});

describe("sendEvent", () => {
  it("transitions to the target state on a matching event", () => {
    const id = buildSimpleMachine();
    sendEvent(id, "START");
    const { activeStates } = getState(id);
    expect(activeStates).toContain("active");
    expect(activeStates).not.toContain("idle");
  });

  it("throws when no transition matches the event", () => {
    const id = buildSimpleMachine();
    expect(() => sendEvent(id, "NO_SUCH_EVENT")).toThrow(/No matching transition/);
  });

  it("logs each transition in the history", () => {
    const id = buildSimpleMachine();
    sendEvent(id, "START");
    sendEvent(id, "STOP");
    const history = getHistory(id);
    expect(history).toHaveLength(2);
    expect(history[0]?.event).toBe("START");
    expect(history[1]?.event).toBe("STOP");
  });

  it("evaluates guard expressions on transitions", () => {
    const m = createMachine({
      name: "guarded",
      userId: "u1",
      initial: "idle",
      context: { score: 0 },
    });
    const id = m.definition.id;
    addState(id, { id: "idle", type: "atomic" });
    addState(id, { id: "promoted", type: "atomic" });
    addTransition(id, {
      source: "idle",
      target: "promoted",
      event: "CHECK",
      guard: { expression: "context.score >= 50" },
      actions: [],
      internal: false,
    });

    setContext(id, { score: 30 });
    expect(() => sendEvent(id, "CHECK")).toThrow(/No matching transition/);

    setContext(id, { score: 60 });
    sendEvent(id, "CHECK");
    expect(getState(id).activeStates).toContain("promoted");
  });

  it("executes assign actions to mutate context", () => {
    const m = createMachine({
      name: "assign-test",
      userId: "u1",
      initial: "s1",
      context: { count: 0 },
    });
    const id = m.definition.id;
    addState(id, { id: "s1", type: "atomic" });
    addState(id, { id: "s2", type: "atomic" });
    addTransition(id, {
      source: "s1",
      target: "s2",
      event: "INC",
      actions: [{ type: "assign", params: { count: 1 } }],
      internal: false,
    });

    sendEvent(id, "INC");
    expect(getState(id).context.count).toBe(1);
  });

  it("logs beforeContext and afterContext on transitions", () => {
    const m = createMachine({
      name: "ctx-log",
      userId: "u1",
      initial: "s1",
      context: { val: 10 },
    });
    const id = m.definition.id;
    addState(id, { id: "s1", type: "atomic" });
    addState(id, { id: "s2", type: "atomic" });
    addTransition(id, {
      source: "s1",
      target: "s2",
      event: "GO",
      actions: [{ type: "assign", params: { val: 20 } }],
      internal: false,
    });

    sendEvent(id, "GO");
    const log = getHistory(id)[0];
    expect(log?.beforeContext.val).toBe(10);
    expect(log?.afterContext.val).toBe(20);
  });
});

describe("getState", () => {
  it("returns a copy of activeStates and context", () => {
    const id = buildSimpleMachine();
    const s1 = getState(id);
    // Mutating the result should not affect internal state
    s1.activeStates.push("hacked");
    const s2 = getState(id);
    expect(s2.activeStates).not.toContain("hacked");
  });
});

describe("setContext", () => {
  it("merges new values into existing context", () => {
    const m = createMachine({
      name: "ctx",
      userId: "u1",
      context: { a: 1, b: 2 },
    });
    setContext(m.definition.id, { b: 99, c: 3 });
    const { context } = getState(m.definition.id);
    expect(context.a).toBe(1);
    expect(context.b).toBe(99);
    expect(context.c).toBe(3);
  });
});

describe("resetMachine", () => {
  it("restores initial state and clears history", () => {
    const id = buildSimpleMachine();
    sendEvent(id, "START");
    resetMachine(id);
    const { activeStates } = getState(id);
    expect(activeStates).toContain("idle");
    expect(getHistory(id)).toHaveLength(0);
  });

  it("restores initial context values", () => {
    const m = createMachine({
      name: "reset-ctx",
      userId: "u1",
      initial: "s1",
      context: { count: 0 },
    });
    const id = m.definition.id;
    addState(id, { id: "s1", type: "atomic" });
    addState(id, { id: "s2", type: "atomic" });
    addTransition(id, {
      source: "s1",
      target: "s2",
      event: "INC",
      actions: [{ type: "assign", params: { count: 5 } }],
      internal: false,
    });

    sendEvent(id, "INC");
    expect(getState(id).context.count).toBe(5);

    resetMachine(id);
    expect(getState(id).context.count).toBe(0);
  });
});

describe("validateMachine", () => {
  it("returns no issues for a well-formed machine", () => {
    const id = buildSimpleMachine();
    const issues = validateMachine(id);
    const errors = issues.filter((i) => i.level === "error");
    expect(errors).toHaveLength(0);
  });

  it("reports an error when machine initial state does not exist", () => {
    const m = createMachine({ name: "bad", userId: "u1", initial: "ghost" });
    const issues = validateMachine(m.definition.id);
    expect(issues.some((i) => i.level === "error" && i.message.includes("ghost"))).toBe(true);
  });

  it("reports an error for a transition targeting a non-existent state", () => {
    const m = createMachine({ name: "bad-trans", userId: "u1" });
    const id = m.definition.id;
    addState(id, { id: "s1", type: "atomic" });
    addTransition(id, {
      id: "bad-t",
      source: "s1",
      target: "no-state",
      event: "X",
      actions: [],
      internal: false,
    });
    const issues = validateMachine(id);
    expect(issues.some((i) => i.level === "error" && i.transitionId === "bad-t")).toBe(true);
  });

  it("warns about unreachable states", () => {
    const m = createMachine({ name: "unreachable", userId: "u1", initial: "s1" });
    const id = m.definition.id;
    addState(id, { id: "s1", type: "atomic" });
    addState(id, { id: "orphan", type: "atomic" }); // no transitions in or out
    const issues = validateMachine(id);
    expect(issues.some((i) => i.level === "warning" && i.stateId === "orphan")).toBe(true);
  });

  it("warns about dead-end states (no outgoing transitions, not final)", () => {
    const id = buildSimpleMachine();
    // active has STOP outgoing, idle has START — both have outgoing
    // Let's add a dead-end state
    const m = getMachine(id);
    addState(id, { id: "dead-end", type: "atomic" });
    addTransition(id, {
      source: "idle",
      target: "dead-end",
      event: "DEAD",
      actions: [],
      internal: false,
    });
    const issues = validateMachine(id);
    expect(issues.some((i) => i.level === "warning" && i.stateId === "dead-end")).toBe(true);
  });
});

describe("listMachines", () => {
  it("returns only machines owned by the given userId", () => {
    clearMachines();
    createMachine({ name: "m1", userId: "alice" });
    createMachine({ name: "m2", userId: "alice" });
    createMachine({ name: "m3", userId: "bob" });

    const aliceMachines = listMachines("alice");
    expect(aliceMachines).toHaveLength(2);
    expect(aliceMachines.every((m) => m.name.startsWith("m"))).toBe(true);

    const bobMachines = listMachines("bob");
    expect(bobMachines).toHaveLength(1);
  });

  it("returns empty array when user owns no machines", () => {
    expect(listMachines("nobody")).toEqual([]);
  });
});

describe("exportMachine", () => {
  it("returns a snapshot of definition, current states, context, and history", () => {
    const id = buildSimpleMachine();
    sendEvent(id, "START");
    const exported = exportMachine(id);
    expect(exported.currentStates).toContain("active");
    expect(exported.definition).toBeDefined();
    expect(exported.transitionLog).toHaveLength(1);
  });

  it("exported object is a copy — mutating it does not affect internal state", () => {
    const id = buildSimpleMachine();
    const exported = exportMachine(id);
    exported.currentStates.push("tampered");
    expect(getState(id).activeStates).not.toContain("tampered");
  });
});
