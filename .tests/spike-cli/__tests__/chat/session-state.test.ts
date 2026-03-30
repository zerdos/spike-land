/**
 * Tests for chat/session-state.ts — SessionState snapshot/restore (lines 88-109)
 *
 * The existing coverage is 71% because snapshot/restore paths are untested.
 */

import { describe, expect, it } from "vitest";
import { SessionState } from "../../../../src/cli/spike-cli/core-logic/chat/session-state.js";

describe("SessionState — getSnapshot / loadSnapshot", () => {
  it("getSnapshot returns empty snapshot when nothing was recorded", () => {
    const state = new SessionState();
    const snap = state.getSnapshot();
    expect(snap.created).toEqual({});
    expect(snap.idsByKey).toEqual({});
    expect(snap.configToolsCalled).toEqual([]);
  });

  it("getSnapshot captures all recorded state", () => {
    const state = new SessionState();
    state.recordCreate("chess", ["game-1", "game-2"]);
    state.recordIds(JSON.stringify({ game_id: "game-1", id: "gen-1" }));
    state.recordConfigCall("set_project_root");

    const snap = state.getSnapshot();
    expect(snap.created["chess"]).toEqual(["game-1", "game-2"]);
    expect(snap.idsByKey["game_id"]).toEqual(["game-1"]);
    expect(snap.idsByKey["id"]).toEqual(["gen-1"]);
    expect(snap.configToolsCalled).toContain("set_project_root");
  });

  it("loadSnapshot restores created, idsByKey, and configToolsCalled", () => {
    const state = new SessionState();
    state.loadSnapshot({
      created: { chess: ["game-1"] },
      idsByKey: { game_id: ["game-1"] },
      configToolsCalled: ["set_project_root"],
    });

    expect(state.hasCreated("chess")).toBe(true);
    expect(state.getCreatedIds("chess")).toEqual(["game-1"]);
    expect(state.hasId("game_id")).toBe(true);
    expect(state.getLatestId("game_id")).toBe("game-1");
    expect(state.hasConfigBeenCalled("set_project_root")).toBe(true);
  });

  it("loadSnapshot clears existing state before restoring", () => {
    const state = new SessionState();
    state.recordCreate("old-prefix", ["old-id"]);
    state.recordConfigCall("old_tool");

    state.loadSnapshot({
      created: { "new-prefix": ["new-id"] },
      idsByKey: {},
      configToolsCalled: [],
    });

    // Old state is gone
    expect(state.hasCreated("old-prefix")).toBe(false);
    expect(state.hasConfigBeenCalled("old_tool")).toBe(false);
    // New state is present
    expect(state.hasCreated("new-prefix")).toBe(true);
  });

  it("loadSnapshot with null clears all state", () => {
    const state = new SessionState();
    state.recordCreate("chess", ["game-1"]);
    state.recordConfigCall("set_project_root");

    state.loadSnapshot(null);

    expect(state.hasCreated("chess")).toBe(false);
    expect(state.hasConfigBeenCalled("set_project_root")).toBe(false);
    expect(state.getSnapshot()).toEqual({
      created: {},
      idsByKey: {},
      configToolsCalled: [],
    });
  });

  it("loadSnapshot with undefined clears all state", () => {
    const state = new SessionState();
    state.recordCreate("chess", ["game-1"]);
    state.loadSnapshot(undefined);
    expect(state.hasCreated("chess")).toBe(false);
  });

  it("round-trips snapshot identity: snapshot → load → snapshot", () => {
    const original = new SessionState();
    original.recordCreate("chess", ["game-1", "game-2"]);
    original.recordIds(JSON.stringify({ challenge_id: "ch-1" }));
    original.recordConfigCall("set_project_root");

    const snap1 = original.getSnapshot();

    const restored = new SessionState();
    restored.loadSnapshot(snap1);
    const snap2 = restored.getSnapshot();

    expect(snap2).toEqual(snap1);
  });

  it("loadSnapshot does not share mutable arrays with the snapshot object", () => {
    const snap = {
      created: { chess: ["game-1"] },
      idsByKey: { game_id: ["game-1"] },
      configToolsCalled: ["set_project_root"],
    };

    const state = new SessionState();
    state.loadSnapshot(snap);

    // Mutate the original snapshot — should not affect state
    snap.created["chess"]!.push("game-2");
    snap.configToolsCalled.push("another_tool");

    expect(state.getCreatedIds("chess")).toEqual(["game-1"]);
    expect(state.hasConfigBeenCalled("another_tool")).toBe(false);
  });
});

describe("SessionState — recordIds edge cases", () => {
  it("ignores non-JSON strings", () => {
    const state = new SessionState();
    state.recordIds("not-json");
    expect(state.getSnapshot().idsByKey).toEqual({});
  });

  it("ignores JSON that is not an object (e.g. array)", () => {
    const state = new SessionState();
    state.recordIds(JSON.stringify(["a", "b"]));
    expect(state.getSnapshot().idsByKey).toEqual({});
  });

  it("ignores _id fields whose values are not strings", () => {
    const state = new SessionState();
    state.recordIds(JSON.stringify({ game_id: 42 }));
    expect(state.hasId("game_id")).toBe(false);
  });

  it("accumulates multiple IDs under the same key across calls", () => {
    const state = new SessionState();
    state.recordIds(JSON.stringify({ game_id: "g1" }));
    state.recordIds(JSON.stringify({ game_id: "g2" }));
    expect(state.getLatestId("game_id")).toBe("g2");
  });
});
