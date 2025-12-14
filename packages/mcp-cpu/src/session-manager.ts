/**
 * Session Manager
 *
 * Manages multiple simultaneous debugging sessions
 */

import { randomUUID } from 'crypto';
import { CPU, Memory, Decoder, Executor } from '@pkintvmcp/core';
import type { Session, SessionInfo, CreateSessionResult, ListSessionsResult, DestroySessionResult } from './types.js';

export class SessionManager {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create a new debugging session
   */
  createSession(sessionId?: string): CreateSessionResult {
    const id = sessionId || randomUUID();

    // Check if session already exists
    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`);
    }

    // Create emulator components
    const memory = new Memory();
    const cpu = new CPU();
    const decoder = new Decoder(memory);
    const executor = new Executor(cpu, memory);

    // Create session
    const session: Session = {
      id,
      cpu,
      memory,
      decoder,
      executor,
      createdAt: new Date(),
      lastActivity: new Date(),
      romLoaded: false,
    };

    this.sessions.set(id, session);

    return {
      sessionId: id,
      createdAt: session.createdAt.toISOString(),
      state: cpu.getState(),
    };
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found. Use cp1600_create_session to create a new session, or cp1600_list_sessions to see active sessions.`);
    }

    // Update last activity
    session.lastActivity = new Date();

    return session;
  }

  /**
   * List all active sessions
   */
  listSessions(): ListSessionsResult {
    const sessions: SessionInfo[] = Array.from(this.sessions.values()).map(session => {
      const state = session.cpu.getState();
      return {
        sessionId: session.id,
        createdAt: session.createdAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
        romLoaded: session.romLoaded,
        romName: session.romName,
        pc: session.cpu.getPC(),
        instructionCount: 0, // TODO: track instruction count
        halted: state.halted,
        cycles: state.cycles,
      };
    });

    return { sessions };
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): DestroySessionResult {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.sessions.delete(sessionId);

    return {
      success: true,
      message: `Session ${sessionId} destroyed`,
    };
  }

  /**
   * Check if a session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get number of active sessions
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Prune inactive sessions (older than specified timeout)
   */
  pruneInactiveSessions(timeoutMs: number = 3600000): number {
    const now = Date.now();
    let prunedCount = 0;

    for (const [id, session] of this.sessions.entries()) {
      const inactiveMs = now - session.lastActivity.getTime();
      if (inactiveMs > timeoutMs) {
        this.sessions.delete(id);
        prunedCount++;
      }
    }

    return prunedCount;
  }
}
