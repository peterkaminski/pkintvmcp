/**
 * Executor type definitions
 *
 * NOTE: Opcode and Instruction types are imported from decoder.types.ts
 * to avoid duplication and ensure consistency between decoder and executor.
 */

/**
 * Minimal Memory interface for executor
 *
 * The executor uses this interface to interact with memory.
 * Our existing Memory class (from Sprint 1.1) already implements this interface.
 */
export interface Memory {
  read(address: number): number;
  write(address: number, value: number): void;
}

// TODO(PK): Determine if we need ExecutorOptions here or if it should be in cpu.types.ts
// Currently ExecutorOptions is in cpu.types.ts (from Manus's work)
