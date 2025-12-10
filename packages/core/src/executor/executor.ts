/**
 * Executor implementation
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
      case Opcode.INCR:
        this.executeIncr(instruction);
        break;
      case Opcode.DECR:
        this.executeDecr(instruction);
        break;

      // Logical
      case Opcode.ANDR:
        this.executeAndr(instruction);
        break;
      case Opcode.XORR:
        this.executeXorr(instruction);
        break;
      case Opcode.CLRR:
        this.executeClrr(instruction);
        break;

      // Control
      case Opcode.TSTR:
        this.executeTstr(instruction);
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
      console.log(
        `MVI #${imm.toString(16)} -> R${dst}: value=${value.toString(16)}, sdbd=${inst.sdbd}`
      );
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

  /**
   * ADDR - Add register to register
   * Format: ADDR Rsrc, Rdst
   * Operation: Rdst = Rdst + Rsrc
   * Flags: C, OV, Z, S all updated
   * Cycles: 6
   */
  private executeAddr(inst: Instruction): void {
    const src = inst.operands[0].value;
    const dst = inst.operands[1].value;

    const srcValue = this.cpu.getRegister(src);
    const dstValue = this.cpu.getRegister(dst);

    // Perform addition
    const result = dstValue + srcValue;
    this.cpu.setRegister(dst, result);

    // Set all arithmetic flags
    this.setArithmeticFlags(result, dstValue, srcValue, false);

    // Add cycles
    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`ADDR R${src} + R${dst} = ${toUint16(result).toString(16)}`);
    }
  }

  /**
   * SUBR - Subtract register from register
   * Format: SUBR Rsrc, Rdst
   * Operation: Rdst = Rdst - Rsrc
   * Flags: C, OV, Z, S all updated
   * Cycles: 6
   */
  private executeSubr(inst: Instruction): void {
    const src = inst.operands[0].value;
    const dst = inst.operands[1].value;

    const srcValue = this.cpu.getRegister(src);
    const dstValue = this.cpu.getRegister(dst);

    // Perform subtraction
    const result = dstValue - srcValue;
    this.cpu.setRegister(dst, result);

    // Set all arithmetic flags
    this.setArithmeticFlags(result, dstValue, srcValue, true);

    // Add cycles
    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`SUBR R${dst} - R${src} = ${toUint16(result).toString(16)}`);
    }
  }

  /**
   * INCR - Increment register
   * Format: INCR Rdst
   * Operation: Rdst = Rdst + 1
   * Flags: C, OV, Z, S all updated
   * Cycles: 6
   */
  private executeIncr(inst: Instruction): void {
    const dst = inst.operands[0].value;

    const dstValue = this.cpu.getRegister(dst);

    // Perform increment
    const result = dstValue + 1;
    this.cpu.setRegister(dst, result);

    // Set all arithmetic flags
    this.setArithmeticFlags(result, dstValue, 1, false);

    // Add cycles
    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`INCR R${dst} = ${toUint16(result).toString(16)}`);
    }
  }

  /**
   * DECR - Decrement register
   * Format: DECR Rdst
   * Operation: Rdst = Rdst - 1
   * Flags: C, OV, Z, S all updated
   * Cycles: 6
   */
  private executeDecr(inst: Instruction): void {
    const dst = inst.operands[0].value;

    const dstValue = this.cpu.getRegister(dst);

    // Perform decrement
    const result = dstValue - 1;
    this.cpu.setRegister(dst, result);

    // Set all arithmetic flags
    this.setArithmeticFlags(result, dstValue, 1, true);

    // Add cycles
    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`DECR R${dst} = ${toUint16(result).toString(16)}`);
    }
  }

  // ========== Logical Instructions ==========

  /**
   * ANDR - Bitwise AND register with register
   * Format: ANDR Rsrc, Rdst
   * Operation: Rdst = Rdst & Rsrc
   * Flags: Z, S updated; C, OV unchanged
   * Cycles: 6
   */
  private executeAndr(inst: Instruction): void {
    const src = inst.operands[0].value;
    const dst = inst.operands[1].value;

    const srcValue = this.cpu.getRegister(src);
    const dstValue = this.cpu.getRegister(dst);

    const result = dstValue & srcValue;
    this.cpu.setRegister(dst, result);

    // Only set S and Z flags (C, OV unchanged)
    const Z = result === 0;
    const S = getBit(result, 15) === 1;
    this.cpu.setFlags({ Z, S });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`ANDR R${src} & R${dst} = ${result.toString(16)}`);
    }
  }

  /**
   * XORR - Bitwise XOR register with register
   * Format: XORR Rsrc, Rdst
   * Operation: Rdst = Rdst ^ Rsrc
   * Flags: Z, S updated; C, OV unchanged
   * Cycles: 6
   */
  private executeXorr(inst: Instruction): void {
    const src = inst.operands[0].value;
    const dst = inst.operands[1].value;

    const srcValue = this.cpu.getRegister(src);
    const dstValue = this.cpu.getRegister(dst);

    const result = dstValue ^ srcValue;
    this.cpu.setRegister(dst, result);

    // Only set S and Z flags (C, OV unchanged)
    const Z = result === 0;
    const S = getBit(result, 15) === 1;
    this.cpu.setFlags({ Z, S });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`XORR R${src} ^ R${dst} = ${result.toString(16)}`);
    }
  }

  /**
   * CLRR - Clear register
   * Format: CLRR Rdst
   * Operation: Rdst = 0
   * Flags: Z=1, S=0; C, OV unchanged
   * Cycles: 6
   */
  private executeClrr(inst: Instruction): void {
    const dst = inst.operands[0].value;

    // Clear register to zero
    this.cpu.setRegister(dst, 0);

    // Always set Z=1, S=0 (C, OV unchanged)
    this.cpu.setFlags({ Z: true, S: false });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`CLRR R${dst} = 0`);
    }
  }

  // ========== Control Instructions ==========

  /**
   * TSTR - Test register
   * Format: TSTR Rsrc
   * Operation: Test register value (no storage)
   * Flags: Z, S updated; C=0, OV=0
   * Cycles: 6
   */
  private executeTstr(inst: Instruction): void {
    const reg = inst.operands[0].value;
    const value = this.cpu.getRegister(reg);

    // Set S and Z, clear C and OV
    const Z = value === 0;
    const S = getBit(value, 15) === 1;
    this.cpu.setFlags({ Z, S, C: false, OV: false });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`TSTR R${reg} = ${value.toString(16)}`);
    }
  }

  /**
   * HLT - Halt processor
   * Format: HLT
   * Operation: Set halted flag
   * Flags: None updated
   * Cycles: 4
   */
  private executeHlt(_inst: Instruction): void {
    const state = this.cpu.getState();
    state.halted = true;
    this.cpu.setState(state);

    this.cpu.addCycles(4);

    if (this.options.trace) {
      console.log('HLT - Processor halted');
    }
  }

  // ========== Flag Helpers ==========

  /**
   * Set arithmetic flags based on operation result
   *
   * @param result - The result of the operation (may be > 16-bit)
   * @param op1 - First operand (16-bit)
   * @param op2 - Second operand (16-bit)
   * @param isSubtraction - True for subtraction, false for addition
   */
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
      C = result > 0xffff;
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
      OV = op1_sign !== op2_sign && op1_sign !== result_sign;
    } else {
      // Addition overflow: ~(op1 ^ op2) & (op1 ^ result) & 0x8000
      OV = op1_sign === op2_sign && op1_sign !== result_sign;
    }

    // Update CPU flags
    this.cpu.setFlags({ C, OV, Z, S });
  }
}
