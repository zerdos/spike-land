import type { Message } from "../../ai/client";
import type { AssertionRuntimeSnapshot } from "../chat/assertion-runtime";
import type { DynamicToolRegistrySnapshot } from "../chat/tool-registry";
import type { SessionStateSnapshot } from "../chat/session-state";

export interface RepoMetadata {
  root: string;
  name: string;
}

export interface PendingToolCallSnapshot {
  id: string;
  name: string;
  serverName: string;
  input: Record<string, unknown>;
  status: "running" | "completed";
  result?: string | undefined;
  isError?: boolean | undefined;
}

export interface PendingTurnSnapshot {
  id: string;
  userInput: string;
  status: "requesting-model" | "streaming" | "awaiting-next-turn" | "completed" | "failed";
  assistantText: string;
  toolCalls: PendingToolCallSnapshot[];
  startedAt: string;
  lastUpdatedAt: string;
}

export interface TerminalSessionSnapshot {
  sessionId: string;
  conversationId: string;
  cwd: string;
  repo: RepoMetadata | null;
  model: string;
  baseUrl: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  sessionState: SessionStateSnapshot;
  registry?: DynamicToolRegistrySnapshot | null | undefined;
  runtime?: AssertionRuntimeSnapshot | null | undefined;
  pendingTurn?: PendingTurnSnapshot | null | undefined;
}

export interface WorkerLaunchOptions {
  sessionId: string;
  cwd: string;
  baseUrl: string;
  model?: string | undefined;
  configPath?: string | undefined;
  inlineServers?: Array<{ name: string; command: string }> | undefined;
  inlineUrls?: Array<{ name: string; url: string }> | undefined;
  maxTurns?: number | undefined;
}

export interface SupervisorInitMessage {
  type: "init";
  options: WorkerLaunchOptions;
  snapshot?: TerminalSessionSnapshot | null | undefined;
}

export interface SupervisorUserInputMessage {
  type: "user_input";
  input: string;
}

export interface SupervisorShutdownMessage {
  type: "shutdown";
}

export type SupervisorToWorkerMessage =
  | SupervisorInitMessage
  | SupervisorUserInputMessage
  | SupervisorShutdownMessage;

export interface WorkerReadyMessage {
  type: "child_ready";
  sessionId: string;
  conversationId: string;
  resumed: boolean;
}

export interface WorkerRestoredMessage {
  type: "child_restored";
  sessionId: string;
  pendingTurn?: PendingTurnSnapshot | null | undefined;
}

export interface WorkerCheckpointMessage {
  type: "checkpoint";
  snapshot: TerminalSessionSnapshot;
}

export interface WorkerStreamedDeltaMessage {
  type: "streamed_delta";
  sessionId: string;
  turnId: string;
  text: string;
}

export interface WorkerToolStartMessage {
  type: "tool_start";
  sessionId: string;
  turnId: string;
  toolCall: PendingToolCallSnapshot;
}

export interface WorkerToolEndMessage {
  type: "tool_end";
  sessionId: string;
  turnId: string;
  toolCall: PendingToolCallSnapshot;
}

export interface WorkerRestartRequestedMessage {
  type: "restart_requested";
  reason: "upgrade";
  versionSpec?: string | undefined;
}

export interface WorkerStatusMessage {
  type: "status";
  level: "info" | "error";
  message: string;
}

export interface WorkerInputReadyMessage {
  type: "input_ready";
  busy: boolean;
}

export interface WorkerSlashOutputMessage {
  type: "slash_output";
  text: string;
  exit?: boolean | undefined;
}

export interface WorkerFatalErrorMessage {
  type: "fatal_error";
  message: string;
}

export type WorkerToSupervisorMessage =
  | WorkerReadyMessage
  | WorkerRestoredMessage
  | WorkerCheckpointMessage
  | WorkerStreamedDeltaMessage
  | WorkerToolStartMessage
  | WorkerToolEndMessage
  | WorkerRestartRequestedMessage
  | WorkerStatusMessage
  | WorkerInputReadyMessage
  | WorkerSlashOutputMessage
  | WorkerFatalErrorMessage;

export interface TerminalJournalEvent {
  type: WorkerToSupervisorMessage["type"];
  timestamp: string;
  payload: WorkerToSupervisorMessage;
}
