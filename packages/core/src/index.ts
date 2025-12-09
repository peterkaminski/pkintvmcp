/**
 * @pkintvmcp/core - CP-1600 CPU Emulator Core
 *
 * This package provides the core emulation functionality for the CP-1600
 * microprocessor used in the Intellivision game console.
 *
 * Phase 1.2: Instruction Decoder (in progress)
 */

// Package metadata
export const version = '0.1.0';
export const phase = '1.2-decoder';

// Decoder (Sprint 1.2)
export { Decoder } from './decoder/decoder.js';
export type {
  Opcode,
  AddressingMode,
  OperandType,
  Operand,
  Instruction,
  DecoderOptions,
} from './decoder/decoder.types.js';
export { Opcode as OpcodeEnum, AddressingMode as AddressingModeEnum } from './decoder/decoder.types.js';

// Memory (Sprint 1.2)
export { Memory } from './memory/memory.js';
export type { MemoryOptions, MemoryRegion } from './memory/memory.types.js';
export { MemoryRegion as MemoryRegionEnum } from './memory/memory.types.js';

// Future exports:
// export { CPU } from './cpu/cpu.js';
// export { Executor } from './executor/executor.js';
// export { TraceBuffer } from './trace/trace-buffer.js';
