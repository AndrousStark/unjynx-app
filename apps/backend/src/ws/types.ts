/// WebSocket message types for real-time communication.

export interface WsMessage<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly timestamp: string;
}

// Server -> Client events
export type ServerEvent =
  | { type: "task.created"; payload: { taskId: string; title: string } }
  | { type: "task.updated"; payload: { taskId: string; changes: Record<string, unknown> } }
  | { type: "task.deleted"; payload: { taskId: string } }
  | { type: "task.completed"; payload: { taskId: string; title: string } }
  | { type: "project.created"; payload: { projectId: string; name: string } }
  | { type: "project.updated"; payload: { projectId: string; changes: Record<string, unknown> } }
  | { type: "project.archived"; payload: { projectId: string } }
  | { type: "sync.required"; payload: { reason: string } }
  | { type: "pong"; payload: Record<string, never> };

// Client -> Server events
export type ClientEvent =
  | { type: "ping"; payload: Record<string, never> }
  | { type: "subscribe"; payload: { channels: string[] } };
