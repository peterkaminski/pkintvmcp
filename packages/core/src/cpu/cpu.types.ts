/**
 * CPU type definitions
 */

/**
 * CPU status flags
 */
export interface CPUFlags {
  C: boolean;   // Carry
  OV: boolean;  // Overflow
  Z: boolean;   // Zero
  S: boolean;   // Sign
}

/**
 * Complete CPU state
 */
export interface CPUState {
  registers: Uint16Array;  // length 8 (R0–R7), 16-bit unsigned
  flags: CPUFlags;
  cycles: number;
  halted: boolean;
  sdbd: boolean;
  interruptsEnabled: boolean;
}

/**
 * Executor configuration options
 */
export interface ExecutorOptions {
  trace?: boolean;
}
