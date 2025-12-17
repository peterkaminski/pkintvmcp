/**
 * @pkintvmcp/core - Decoder Type Definitions
 *
 * Types for CP-1600 instruction decoding
 * Sprint 1.2: Instruction Decoder
 */

/**
 * CP-1600 Instruction Opcodes
 *
 * Organized by functional category for clarity.
 * Phase 1 includes core instructions needed for basic debugging.
 * Phase 2 adds complete instruction set.
 */
export enum Opcode {
  // === Phase 1: Core Instructions ===

  // Data Movement
  MVI = 'MVI',       // Move immediate to register
  MVII = 'MVII',     // Move in immediate data to register
  MVO = 'MVO',       // Move register to output (memory)
  MVOI = 'MVOI',     // Move to output with immediate address
  MVI_AT = 'MVI@',   // Move immediate with auto-increment
  MVO_AT = 'MVO@',   // Move to output with auto-increment
  MOVR = 'MOVR',     // Move register to register

  // Arithmetic
  ADD = 'ADD',       // Add memory to register
  ADDR = 'ADDR',     // Add register to register
  ADDI = 'ADDI',     // Add immediate to register
  ADD_AT = 'ADD@',   // Add indirect to register
  SUB = 'SUB',       // Subtract memory from register
  SUBR = 'SUBR',     // Subtract register from register
  SUBI = 'SUBI',     // Subtract immediate from register
  SUB_AT = 'SUB@',   // Subtract indirect from register
  INCR = 'INCR',     // Increment register
  DECR = 'DECR',     // Decrement register

  // Logic
  AND = 'AND',       // AND memory with register
  ANDR = 'ANDR',     // AND register with register
  ANDI = 'ANDI',     // AND immediate with register
  AND_AT = 'AND@',   // AND indirect with register
  XOR = 'XOR',       // XOR memory with register
  XORR = 'XORR',     // XOR register with register
  XORI = 'XORI',     // XOR immediate with register
  XOR_AT = 'XOR@',   // XOR indirect with register
  CLRR = 'CLRR',     // Clear register

  // Control Flow - Unconditional
  B = 'B',           // Unconditional branch
  J = 'J',           // Jump absolute
  JR = 'JR',         // Jump to register
  JSR = 'JSR',       // Jump to subroutine
  JSRE = 'JSRE',     // Jump to subroutine, enable interrupts
  JSRD = 'JSRD',     // Jump to subroutine, disable interrupts

  // Control Flow - Conditional Branches
  BEQ = 'BEQ',       // Branch if equal (Z = 1)
  BNEQ = 'BNEQ',     // Branch if not equal (Z = 0)
  BC = 'BC',         // Branch if carry (C = 1)
  BNC = 'BNC',       // Branch if no carry (C = 0)
  BOV = 'BOV',       // Branch if overflow (OV = 1)
  BNOV = 'BNOV',     // Branch if no overflow (OV = 0)
  BMI = 'BMI',       // Branch if minus (S = 1)
  BPL = 'BPL',       // Branch if plus (S = 0)
  BLT = 'BLT',       // Branch if less than (signed)
  BGE = 'BGE',       // Branch if greater or equal (signed)
  BLE = 'BLE',       // Branch if less or equal (signed)
  BGT = 'BGT',       // Branch if greater than (signed)
  BUSC = 'BUSC',     // Branch if unequal sign and carry
  BESC = 'BESC',     // Branch if equal sign and carry
  BEXT = 'BEXT',     // Branch on external condition

  // Stack Operations
  PSHR = 'PSHR',     // Push register to stack
  PULR = 'PULR',     // Pull from stack to register

  // Status / Testing
  TSTR = 'TSTR',     // Test register
  CMP = 'CMP',       // Compare memory with register
  CMPR = 'CMPR',     // Compare register with register
  CMPI = 'CMPI',     // Compare with immediate
  CMP_AT = 'CMP@',   // Compare indirect with register

  // Miscellaneous
  NOP = 'NOP',       // No operation
  NOPP = 'NOPP',     // No operation (2-word form)
  HLT = 'HLT',       // Halt processor
  SDBD = 'SDBD',     // Set double byte data (prefix instruction)

  // === Phase 2: Advanced Instructions ===

  // Shifts and Rotates
  SLL = 'SLL',       // Shift logical left
  SLLC = 'SLLC',     // Shift logical left through carry
  SLR = 'SLR',       // Shift logical right
  SAR = 'SAR',       // Shift arithmetic right
  SARC = 'SARC',     // Shift arithmetic right through carry
  RLC = 'RLC',       // Rotate left through carry
  RRC = 'RRC',       // Rotate right through carry
  SWAP = 'SWAP',     // Swap bytes

  // Arithmetic Extended
  ADCR = 'ADCR',     // Add with carry to register
  NEGR = 'NEGR',     // Negate register (two's complement)
  COMR = 'COMR',     // Complement register (one's complement)

  // System / Interrupt Control
  EIS = 'EIS',       // Enable interrupt system
  DIS = 'DIS',       // Disable interrupt system
  TCI = 'TCI',       // Terminate current interrupt
  SIN = 'SIN',       // Software interrupt
  GSWD = 'GSWD',     // Get status word
  RSWD = 'RSWD',     // Restore status word
  CLRC = 'CLRC',     // Clear carry flag
  SETC = 'SETC',     // Set carry flag

  // Jump variants
  JE = 'JE',         // Jump and enable interrupts
  JD = 'JD',         // Jump and disable interrupts
}

/**
 * Addressing Modes for CP-1600 Instructions
 */
export enum AddressingMode {
  /** No operands (e.g., NOP, HLT) */
  IMPLIED = 'IMPLIED',

  /** Register operand (e.g., INCR R1) */
  REGISTER = 'REGISTER',

  /** Immediate value (e.g., MVI R1, #42) */
  IMMEDIATE = 'IMMEDIATE',

  /** Direct memory address (e.g., MVO R1, $0200) */
  DIRECT = 'DIRECT',

  /** Indirect via register (e.g., MVI@ R1, R4) */
  INDIRECT = 'INDIRECT',

  /** Indexed: base address + register (e.g., ADD $0100(R1)) */
  INDEXED = 'INDEXED',

  /** Stack operations using R6 (e.g., PSHR R1) */
  STACK = 'STACK',

  /** Double indirect with auto-increment (@@R4, @@R5) */
  DOUBLE_INDIRECT = 'DOUBLE_INDIRECT',

  /** Modified by SDBD prefix for 16-bit immediate */
  SDBD_MODIFIED = 'SDBD_MODIFIED',
}

/**
 * Operand Type
 */
export type OperandType = 'register' | 'immediate' | 'address';

/**
 * Instruction Operand
 *
 * Represents a single operand (source or destination) in an instruction.
 */
export interface Operand {
  /** Type of operand */
  type: OperandType;

  /** Numeric value (register number, immediate value, or address) */
  value: number;

  /**
   * Optional: Auto-increment flag for @@R4, @@R5 modes
   * If true, register is incremented after use
   */
  autoIncrement?: boolean;
}

/**
 * Decoded Instruction
 *
 * Complete representation of a decoded CP-1600 instruction.
 */
export interface Instruction {
  /** Memory address where instruction was decoded */
  address: number;

  /** Instruction opcode */
  opcode: Opcode;

  /** Addressing mode used by this instruction */
  addressingMode: AddressingMode;

  /** Array of operands (0-2 operands typically) */
  operands: Operand[];

  /**
   * Raw instruction word (10-bit value from memory)
   * Bits 9-0 of the 16-bit memory word
   */
  raw: number;

  /**
   * Was SDBD prefix active for this instruction?
   * If true, immediate values are 16-bit instead of 10-bit
   */
  sdbd: boolean;

  /**
   * Length of instruction in memory words
   * - 1 for most instructions
   * - 2 for instructions with immediate address (J, some branches)
   * - 3 for SDBD-prefixed instructions with 16-bit immediate
   */
  length: number;
}

/**
 * Decoder Configuration Options
 */
export interface DecoderOptions {
  /**
   * Enable strict mode (throw errors on invalid opcodes)
   * Default: true
   */
  strict?: boolean;

  /**
   * Enable Phase 2 instructions
   * Default: false (Phase 1 only)
   */
  phase2?: boolean;
}
