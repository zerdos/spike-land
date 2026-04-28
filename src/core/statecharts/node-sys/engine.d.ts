/**
 * Statechart Engine
 *
 * Core engine for hierarchical/nested state machines with support for
 * compound states, parallel regions, guards, actions, history states,
 * and final states. Uses in-memory Map storage following the orchestrator pattern.
 */
import type {
  Action,
  MachineDefinition,
  MachineExport,
  MachineInstance,
  MachineSummary,
  StateNode,
  Transition,
  TransitionLogEntry,
  ValidationIssue,
} from "../core-logic/types.js";
/** Exported for test cleanup */
export declare function clearMachines(): void;
/** Get a machine instance by ID. Throws if not found. */
export declare function getMachine(machineId: string): MachineInstance;
/** Create a new machine with the given definition. */
export declare function createMachine(
  def: Partial<MachineDefinition> & {
    name: string;
    userId: string;
  },
): MachineInstance;
/** Add a state to a machine. */
export declare function addState(
  machineId: string,
  state: Omit<StateNode, "children" | "entryActions" | "exitActions"> & {
    children?: string[];
    entryActions?: Action[];
    exitActions?: Action[];
  },
): StateNode;
/** Remove a state and all transitions referencing it. */
export declare function removeState(machineId: string, stateId: string): void;
/** Add a transition to a machine. */
export declare function addTransition(
  machineId: string,
  transition: Omit<Transition, "id"> & {
    id?: string;
  },
): Transition;
/** Remove a transition by ID. */
export declare function removeTransition(machineId: string, transitionId: string): void;
/** Merge context values into the machine's current context. */
export declare function setContext(machineId: string, context: Record<string, unknown>): void;
/** Send an event to the machine, triggering transitions. */
export declare function sendEvent(
  machineId: string,
  event: string,
  payload?: Record<string, unknown>,
): TransitionLogEntry;
/** Get current active states and context. */
export declare function getState(machineId: string): {
  activeStates: string[];
  context: Record<string, unknown>;
};
/** Get the transition log history. */
export declare function getHistory(machineId: string): TransitionLogEntry[];
/** Reset machine to initial state, context, and clear history/log. */
export declare function resetMachine(machineId: string): void;
/** Validate a machine definition and return issues. */
export declare function validateMachine(machineId: string): ValidationIssue[];
/** Export full machine state for serialization. */
export declare function exportMachine(machineId: string): MachineExport;
/** List all machines for a given user. */
export declare function listMachines(userId: string): MachineSummary[];
//# sourceMappingURL=engine.d.ts.map
