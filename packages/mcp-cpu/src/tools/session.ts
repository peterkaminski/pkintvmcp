/**
 * Session Management Tools
 */

import type { SessionManager } from '../session-manager.js';
import type { CreateSessionResult, ListSessionsResult, DestroySessionResult } from '../types.js';

/**
 * cp1600_create_session tool
 */
export function createSession(
  sessionManager: SessionManager,
  args: { sessionId?: string }
): CreateSessionResult {
  return sessionManager.createSession(args.sessionId);
}

/**
 * cp1600_list_sessions tool
 */
export function listSessions(
  sessionManager: SessionManager
): ListSessionsResult {
  return sessionManager.listSessions();
}

/**
 * cp1600_destroy_session tool
 */
export function destroySession(
  sessionManager: SessionManager,
  args: { sessionId: string }
): DestroySessionResult {
  return sessionManager.destroySession(args.sessionId);
}
