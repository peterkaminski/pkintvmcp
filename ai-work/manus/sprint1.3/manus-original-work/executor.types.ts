/**
 * Executor type definitions
 */

/**
 * Minimal Memory interface for executor
 */
export interface Memory {
  read(address: number): number;
  write(address: number, value: number): void;
}

/**
 * Opcode enumeration
 */
export enum Opcode {
  // Data movement
  MOVR = 'MOVR',
  MVI = 'MVI',
  MVO = 'MVO',
  
  // Arithmetic
  ADDR = 'ADDR',
  SUBR = 'SUBR',
  INC = 'INC',
  DEC = 'DEC',
  
  // Logical
  ANDR = 'ANDR',
  XORR = 'XORR',
  CLR = 'CLR',
  
  // Control
  TST = 'TST',
  HLT = 'HLT',
}

/**
 * Instruction representation
 */
export interface Instruction {
  opcode: Opcode;
  operands: number[];
  sdbd?: boolean;  // SDBD (Shift Double Byte Data) flag for extended immediate mode
}
