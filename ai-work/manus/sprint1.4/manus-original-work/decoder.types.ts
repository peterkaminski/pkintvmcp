/**
 * Decoder type definitions for CP-1600 emulator
 */

/**
 * Opcode enumeration for CP-1600 instructions
 */
export enum Opcode {
  // Data Movement
  MVI = 'MVI', // Move immediate to register
  MVO = 'MVO', // Move register to output (memory)
  MOVR = 'MOVR', // Move register to register

  // Arithmetic
  ADDR = 'ADDR', // Add register to register
  SUBR = 'SUBR', // Subtract register from register
  INCR = 'INCR', // Increment register
  DECR = 'DECR', // Decrement register

  // Logic
  ANDR = 'ANDR', // AND register with register
  XORR = 'XORR', // XOR register with register
  CLRR = 'CLRR', // Clear register

  // Status/Testing
  TSTR = 'TSTR', // Test register
  HLT = 'HLT', // Halt processor
}

/**
 * Addressing modes for instructions
 */
export enum AddressingMode {
  IMPLIED = 'IMPLIED', // No operands (e.g., HLT)
  REGISTER = 'REGISTER', // Register operands (e.g., MOVR R1, R2)
  IMMEDIATE = 'IMMEDIATE', // Immediate value (e.g., MVI R1, #42)
  DIRECT = 'DIRECT', // Direct memory address
  INDIRECT = 'INDIRECT', // Indirect through register
  INDEXED = 'INDEXED', // Indexed addressing
  STACK = 'STACK', // Stack operations
  DOUBLE_INDIRECT = 'DOUBLE_INDIRECT', // @@R4, @@R5
  SDBD_MODIFIED = 'SDBD_MODIFIED', // SDBD prefix applied
}

/**
 * Operand representation
 */
export interface Operand {
  type: 'register' | 'immediate' | 'address';
  value: number;
  autoIncrement?: boolean; // Only for @@R4, @@R5
}

/**
 * Decoded instruction representation
 */
export interface Instruction {
  address: number; // Memory address where instruction is located
  opcode: Opcode; // Which instruction
  addressingMode: AddressingMode; // How operands are addressed
  operands: Operand[]; // Array of operands (0-2 typically)
  raw: number; // Raw 10-bit instruction word
  sdbd: boolean; // SDBD prefix was applied
  length: number; // Instruction length in words (1-3)
}
