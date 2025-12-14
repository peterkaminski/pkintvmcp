/**
 * MCP Server Types
 */

import type { CPU } from '@pkintvmcp/core';
import type { Memory } from '@pkintvmcp/core';
import type { Decoder } from '@pkintvmcp/core';
import type { Executor } from '@pkintvmcp/core';
import type { CPUState } from '@pkintvmcp/core';

/**
 * Debugging session containing an isolated emulator instance
 */
export interface Session {
  /** Unique session identifier (UUID) */
  id: string;

  /** CPU instance */
  cpu: CPU;

  /** Memory instance */
  memory: Memory;

  /** Decoder instance */
  decoder: Decoder;

  /** Executor instance */
  executor: Executor;

  /** Session creation timestamp */
  createdAt: Date;

  /** Last activity timestamp */
  lastActivity: Date;

  /** Whether a ROM is loaded */
  romLoaded: boolean;

  /** ROM file name (if loaded) */
  romName?: string;

  /** ROM load address */
  loadAddress?: number;

  /** ROM entry point (initial PC) */
  entryPoint?: number;
}

/**
 * Session summary information (for list operations)
 */
export interface SessionInfo {
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  romLoaded: boolean;
  romName?: string;
  pc: number;
  instructionCount: number;
  halted: boolean;
  cycles: number;
}

/**
 * Result from creating a session
 */
export interface CreateSessionResult {
  sessionId: string;
  createdAt: string;
  state: CPUState;
}

/**
 * Result from listing sessions
 */
export interface ListSessionsResult {
  sessions: SessionInfo[];
}

/**
 * Result from destroying a session
 */
export interface DestroySessionResult {
  success: boolean;
  message: string;
}

/**
 * Result from loading a ROM
 */
export interface LoadROMResult {
  loaded: boolean;
  romSize: number;
  loadAddress: number;
  entryPoint: number;
  format: string;
}

/**
 * Result from stepping execution
 */
export interface StepResult {
  instructionsExecuted: number;
  stopped: boolean;
  reason?: 'halted' | 'breakpoint' | 'completed';
  stoppedAt?: number;
  state: CPUState;
}

/**
 * Result from running execution
 */
export interface RunResult {
  instructionsExecuted: number;
  stopped: boolean;
  reason: 'halted' | 'breakpoint' | 'max_instructions';
  stoppedAt?: number;
  state: CPUState;
}

/**
 * Result from resetting CPU
 */
export interface ResetResult {
  state: CPUState;
}

/**
 * Result from getting CPU state
 */
export interface GetStateResult {
  registers: {
    r0: number;
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    r5: number;
    r6: number;
    r7: number;
  };
  flags: {
    sign: boolean;
    zero: boolean;
    carry: boolean;
    overflow: boolean;
  };
  halted: boolean;
  cycles: number;
  sdbd: boolean;
}

/**
 * Result from examining memory
 */
export interface ExamineMemoryResult {
  address: number;
  length: number;
  data: number[];
  formatted: string;
}

/**
 * Result from disassembling instructions
 */
export interface DisassembleResult {
  instructions: DisassembledInstruction[];
}

/**
 * A single disassembled instruction
 */
export interface DisassembledInstruction {
  address: number;
  addressHex: string;
  opcode: number;
  mnemonic: string;
  bytes: number[];
  cycles: number;
}

/**
 * MCP Error
 */
export interface MCPError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
