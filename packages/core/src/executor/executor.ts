/**
 * @pkintvmcp/core - Executor Implementation
 *
 * Instruction execution engine for CP-1600 CPU
 * Sprint 1.3: Core Execution Engine
 *
 * Adapted from Manus Sprint 1.3 work to integrate with existing decoder types.
 */

import type { CPU } from '../cpu/cpu.js';
import type { ExecutorOptions } from '../cpu/cpu.types.js';
import type { Memory } from './executor.types.js';
import type { Instruction } from '../decoder/decoder.types.js';
import { Opcode } from '../decoder/decoder.types.js';
import { toUint16, getBit } from '../utils/bitops.js';

export class Executor {
  private cpu: CPU;
  private memory: Memory;
  private options: ExecutorOptions;

  constructor(cpu: CPU, memory: Memory, options?: ExecutorOptions) {
    this.cpu = cpu;
    this.memory = memory;
    this.options = options || {};
  }

  /**
   * Execute a single instruction
   */
  public execute(instruction: Instruction): void {
    if (this.options.trace) {
      console.log(`Executing: ${instruction.opcode}`, instruction.operands);
    }

    switch (instruction.opcode) {
      // Data movement
      case Opcode.MOVR:
        this.executeMovr(instruction);
        break;
      case Opcode.MVI:
        this.executeMvi(instruction);
        break;
      case Opcode.MVO:
        this.executeMvo(instruction);
        break;

      // Arithmetic
      case Opcode.ADDR:
        this.executeAddr(instruction);
        break;
      case Opcode.SUBR:
        this.executeSubr(instruction);
        break;
      case Opcode.INC:
        this.executeInc(instruction);
        break;
      case Opcode.DEC:
        this.executeDec(instruction);
        break;

      // Logical
      case Opcode.ANDR:
        this.executeAndr(instruction);
        break;
      case Opcode.XORR:
        this.executeXorr(instruction);
        break;
      case Opcode.CLR:
        this.executeClr(instruction);
        break;

      // Control
      case Opcode.TST:
        this.executeTst(instruction);
        break;
      case Opcode.HLT:
        this.executeHlt(instruction);
        break;

      default:
        throw new Error(`Unknown opcode: ${instruction.opcode}`);
    }
  }

  // ========== Data Movement Instructions ==========

  /**
   * MOVR - Move register to register
   * Format: MOVR Rsrc, Rdst
   * Operation: Rdst = Rsrc
   * Flags: S, Z updated; C, OV unchanged
   * Cycles: 6
   */
  private executeMovr(inst: Instruction): void {
    // Extract operand values from decoder's Operand[] structure
    const src = inst.operands[0].value;
    const dst = inst.operands[1].value;

    // Read source register
    const value = this.cpu.getRegister(src);

    // Write to destination register
    this.cpu.setRegister(dst, value);

    // Update flags: S and Z only
    const Z = value === 0;
    const S = getBit(value, 15) === 1;
    this.cpu.setFlags({ Z, S });

    // Add cycles
    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`MOVR R${src} -> R${dst}: value=${value.toString(16)}`);
    }
  }

  /**
   * MVI - Move immediate to register
   * Format: MVI #imm, Rdst
   * Operation: Rdst = #imm
   * Flags: S, Z updated; C, OV unchanged
   * Cycles: 8 (normal), 10 (SDBD mode)
   */
  private executeMvi(inst: Instruction): void {
    // TODO(PK): Verify operand order - is it [imm, dst] or [dst, imm]?
    // Based on CP-1600 convention and Manus's code, it's [imm, dst]
    const imm = inst.operands[0].value;
    const dst = inst.operands[1].value;

    // Normalize immediate to 16-bit
    const value = toUint16(imm);

    // Write to destination register
    this.cpu.setRegister(dst, value);

    // Update flags: S and Z only
    const Z = value === 0;
    const S = getBit(value, 15) === 1;
    this.cpu.setFlags({ Z, S });

    // Add cycles: 8 normal, 10 with SDBD
    const cycles = inst.sdbd ? 10 : 8;
    this.cpu.addCycles(cycles);

    if (this.options.trace) {
      console.log(`MVI #${imm.toString(16)} -> R${dst}: value=${value.toString(16)}, sdbd=${inst.sdbd || false}`);
    }
  }

  /**
   * MVO - Move register to memory
   * Format: MVO Rsrc, addr
   * Operation: memory[addr] = Rsrc
   * Flags: None updated
   * Cycles: 11
   */
  private executeMvo(inst: Instruction): void {
    const src = inst.operands[0].value;
    const addr = inst.operands[1].value;

    // Read source register
    const value = this.cpu.getRegister(src);

    // Write to memory
    this.memory.write(addr, value);

    // No flags updated for MVO

    // Add cycles
    this.cpu.addCycles(11);

    if (this.options.trace) {
      console.log(`MVO R${src} -> [${addr.toString(16)}]: value=${value.toString(16)}`);
    }
  }

  // ========== Arithmetic Instructions ==========

  private executeAddr(_inst: Instruction): void {
    // Stub: Add register to register
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('ADDR stub');
    }
  }

  private executeSubr(_inst: Instruction): void {
    // Stub: Subtract register from register
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('SUBR stub');
    }
  }

  private executeInc(_inst: Instruction): void {
    // Stub: Increment register
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('INC stub');
    }
  }

  private executeDec(_inst: Instruction): void {
    // Stub: Decrement register
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('DEC stub');
    }
  }

  // ========== Logical Instructions ==========

  private executeAndr(_inst: Instruction): void {
    // Stub: AND register with register
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('ANDR stub');
    }
  }

  private executeXorr(_inst: Instruction): void {
    // Stub: XOR register with register
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('XORR stub');
    }
  }

  private executeClr(_inst: Instruction): void {
    // Stub: Clear register
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('CLR stub');
    }
  }

  // ========== Control Instructions ==========

  private executeTst(_inst: Instruction): void {
    // Stub: Test register
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('TST stub');
    }
  }

  private executeHlt(_inst: Instruction): void {
    // Stub: Halt execution
    // TODO(PK): Implement in Sprint 1.4 or later
    if (this.options.trace) {
      console.log('HLT stub');
    }
  }

  // ========== Flag Helpers ==========

  // TODO(PK): Uncomment when implementing arithmetic instructions (ADDR, SUBR, etc.)
  /*
  /**
   * Set arithmetic flags based on operation result
   *
   * @param result - The 16-bit result of the operation
   * @param op1 - First operand (16-bit)
   * @param op2 - Second operand (16-bit)
   * @param isSubtraction - True for subtraction, false for addition
   *\/
  private setArithmeticFlags(
    result: number,
    op1: number,
    op2: number,
    isSubtraction: boolean
  ): void {
    // Normalize to 16-bit
    const result16 = toUint16(result);
    const op1_16 = toUint16(op1);
    const op2_16 = toUint16(op2);

    // Z flag: result is zero
    const Z = result16 === 0;

    // S flag: bit 15 of result (sign bit)
    const S = getBit(result16, 15) === 1;

    // C flag: unsigned carry/borrow
    let C: boolean;
    if (isSubtraction) {
      // For subtraction: C is set if there was a borrow (op1 < op2 unsigned)
      C = op1_16 < op2_16;
    } else {
      // For addition: C is set if there was a carry out of bit 15
      C = result > 0xFFFF;
    }

    // OV flag: signed overflow
    // Overflow occurs when:
    // - Addition: operands have same sign, result has different sign
    // - Subtraction: operands have different signs, result has different sign from op1
    let OV: boolean;
    const op1_sign = getBit(op1_16, 15);
    const op2_sign = getBit(op2_16, 15);
    const result_sign = getBit(result16, 15);

    if (isSubtraction) {
      // Subtraction overflow: (op1 ^ op2) & (op1 ^ result) & 0x8000
      OV = (op1_sign !== op2_sign) && (op1_sign !== result_sign);
    } else {
      // Addition overflow: ~(op1 ^ op2) & (op1 ^ result) & 0x8000
      OV = (op1_sign === op2_sign) && (op1_sign !== result_sign);
    }

    // Update CPU flags
    this.cpu.setFlags({ C, OV, Z, S });
  }
  */
}
