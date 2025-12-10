/**
 * Core emulator package - public API exports
 */

// CPU exports
export { CPU } from './cpu/cpu.js';
export type { CPUFlags, CPUState, ExecutorOptions } from './cpu/cpu.types.js';

// Executor exports
export { Executor } from './executor/executor.js';
export { Opcode } from './executor/executor.types.js';
export type { Memory, Instruction } from './executor/executor.types.js';

// Utility exports
export { toUint16, getBit, setBit, clearBit } from './utils/bitops.js';
