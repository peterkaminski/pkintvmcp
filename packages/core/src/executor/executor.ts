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
   * Automatically advances PC unless the instruction modifies it (control flow)
   */
  public execute(instruction: Instruction): void {
    if (this.options.trace) {
      console.log(`Executing: ${instruction.opcode}`, instruction.operands);
    }

    // Save PC before execution to detect if instruction modifies it
    const pcBefore = this.cpu.getPC();

    switch (instruction.opcode) {
      // Data movement
      case Opcode.MOVR:
        this.executeMovr(instruction);
        break;
      case Opcode.MVI:
        this.executeMvi(instruction);
        break;
      case Opcode.MVI_AT:
        this.executeMviAt(instruction);
        break;
      case Opcode.MVO:
        this.executeMvo(instruction);
        break;
      case Opcode.MVO_AT:
        this.executeMvoAt(instruction);
        break;

      // Arithmetic
      case Opcode.ADDR:
        this.executeAddr(instruction);
        break;
      case Opcode.ADD:
        this.executeAdd(instruction);
        break;
      case Opcode.SUBR:
        this.executeSubr(instruction);
        break;
      case Opcode.SUB:
        this.executeSub(instruction);
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
      case Opcode.AND:
        this.executeAnd(instruction);
        break;
      case Opcode.XORR:
        this.executeXorr(instruction);
        break;
      case Opcode.XOR:
        this.executeXor(instruction);
        break;
      case Opcode.CLRR:
        this.executeClrr(instruction);
        break;

      // Control
      case Opcode.TSTR:
        this.executeTstr(instruction);
        break;
      case Opcode.CMP:
        this.executeCmp(instruction);
        break;
      case Opcode.HLT:
        this.executeHlt(instruction);
        break;

      // Control Flow - Unconditional
      case Opcode.B:
        this.executeB(instruction);
        break;
      case Opcode.J:
        this.executeJ(instruction);
        break;
      case Opcode.JR:
        this.executeJr(instruction);
        break;

      // Control Flow - Conditional (Simple Flags)
      case Opcode.BEQ:
        this.executeBEQ(instruction);
        break;
      case Opcode.BNEQ:
        this.executeBNEQ(instruction);
        break;
      case Opcode.BC:
        this.executeBC(instruction);
        break;
      case Opcode.BNC:
        this.executeBNC(instruction);
        break;
      case Opcode.BOV:
        this.executeBOV(instruction);
        break;
      case Opcode.BNOV:
        this.executeBNOV(instruction);
        break;
      case Opcode.BMI:
        this.executeBMI(instruction);
        break;
      case Opcode.BPL:
        this.executeBPL(instruction);
        break;

      // Control Flow - Signed Comparison
      case Opcode.BLT:
        this.executeBLT(instruction);
        break;
      case Opcode.BGE:
        this.executeBGE(instruction);
        break;
      case Opcode.BLE:
        this.executeBLE(instruction);
        break;
      case Opcode.BGT:
        this.executeBGT(instruction);
        break;

      // Subroutines
      case Opcode.JSR:
        this.executeJSR(instruction);
        break;
      case Opcode.JSRE:
        this.executeJSRE(instruction);
        break;
      case Opcode.JSRD:
        this.executeJSRD(instruction);
        break;

      // Stack
      case Opcode.PSHR:
        this.executePSHR(instruction);
        break;
      case Opcode.PULR:
        this.executePULR(instruction);
        break;

      // Control Instructions
      case Opcode.NOPP:
        this.executeNOPP(instruction);
        break;
      case Opcode.EIS:
        this.executeEIS(instruction);
        break;
      case Opcode.DIS:
        this.executeDIS(instruction);
        break;

      // Shift Instructions
      case Opcode.SLL:
        this.executeSLL(instruction);
        break;
      case Opcode.SLLC:
        this.executeSLLC(instruction);
        break;
      case Opcode.SLR:
        this.executeSLR(instruction);
        break;
      case Opcode.SAR:
        this.executeSAR(instruction);
        break;
      case Opcode.SARC:
        this.executeSARC(instruction);
        break;

      // Rotate Instructions
      case Opcode.RLC:
        this.executeRLC(instruction);
        break;
      case Opcode.RRC:
        this.executeRRC(instruction);
        break;

      // Bit Manipulation
      case Opcode.SWAP:
        this.executeSWAP(instruction);
        break;
      case Opcode.NEGR:
        this.executeNEGR(instruction);
        break;

      default:
        throw new Error(`Unimplemented opcode: ${instruction.opcode}`);
    }

    // Advance PC by instruction length if it wasn't modified by the instruction
    // Control flow instructions (jumps, branches, calls) set PC directly
    const pcAfter = this.cpu.getPC();
    if (pcAfter === pcBefore) {
      // PC wasn't modified, advance it by instruction length
      this.cpu.setPC(pcBefore + instruction.length);
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

  /**
   * MVI@ - Move from memory with auto-increment
   * Format: MVI@ Rptr, Rdst
   * Operation: Rdst = memory[Rptr]; Rptr = Rptr + 1
   * Flags: Z, S updated
   * Cycles: 8 + 2W (using 8 for Phase 1)
   */
  private executeMviAt(inst: Instruction): void {
    const ptrReg = inst.operands[0].value;
    const dst = inst.operands[1].value;

    // Read address from pointer register
    const address = this.cpu.getRegister(ptrReg);

    // Read value from memory
    const value = this.memory.read(address);

    // Write to destination register
    this.cpu.setRegister(dst, value);

    // Auto-increment pointer register
    this.cpu.setRegister(ptrReg, toUint16(address + 1));

    // Update flags: S and Z only
    const Z = value === 0;
    const S = getBit(value, 15) === 1;
    this.cpu.setFlags({ Z, S });

    // Add cycles: 8 base (ignoring W for Phase 1)
    this.cpu.addCycles(8);

    if (this.options.trace) {
      console.log(
        `MVI@ R${ptrReg}[@${address.toString(16)}] -> R${dst}: value=${value.toString(16)}, R${ptrReg}++`
      );
    }
  }

  /**
   * MVO@ - Move to memory with auto-increment
   * Format: MVO@ Rsrc, Rptr
   * Operation: memory[Rptr] = Rsrc; Rptr = Rptr + 1
   * Flags: None updated
   * Cycles: 9 + 2W (using 9 for Phase 1)
   */
  private executeMvoAt(inst: Instruction): void {
    const src = inst.operands[0].value;
    const ptrReg = inst.operands[1].value;

    // Read address from pointer register
    const address = this.cpu.getRegister(ptrReg);

    // Read source register
    const value = this.cpu.getRegister(src);

    // Write to memory
    this.memory.write(address, value);

    // Auto-increment pointer register
    this.cpu.setRegister(ptrReg, toUint16(address + 1));

    // No flags updated for MVO@

    // Add cycles: 9 base (ignoring W for Phase 1)
    this.cpu.addCycles(9);

    if (this.options.trace) {
      console.log(
        `MVO@ R${src} -> [@${address.toString(16)}] (R${ptrReg}): value=${value.toString(16)}, R${ptrReg}++`
      );
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

  // ========== Control Flow Instructions - Unconditional ==========

  /**
   * B - Branch Unconditional
   * Format: B target
   * Operation: PC = target
   * Flags: None updated
   * Cycles: 7
   */
  private executeB(inst: Instruction): void {
    const target = inst.operands[0].value;

    // Set PC to target address
    this.cpu.setRegister(7, toUint16(target));

    // No flags updated

    // Add cycles
    this.cpu.addCycles(7);

    if (this.options.trace) {
      console.log(`B -> ${target.toString(16)}`);
    }
  }

  /**
   * J - Jump Absolute
   * Format: J target
   * Operation: PC = target
   * Flags: None updated
   * Cycles: 7
   */
  private executeJ(inst: Instruction): void {
    const target = inst.operands[0].value;

    // Set PC to target address
    this.cpu.setRegister(7, toUint16(target));

    // No flags updated

    // Add cycles
    this.cpu.addCycles(7);

    if (this.options.trace) {
      console.log(`J -> ${target.toString(16)}`);
    }
  }

  /**
   * JR - Jump to Register
   * Format: JR Rsrc
   * Operation: PC = Rsrc
   * Flags: None updated
   * Cycles: 7
   */
  private executeJr(inst: Instruction): void {
    const src = inst.operands[0].value;
    const target = this.cpu.getRegister(src);

    // Set PC to value in register
    this.cpu.setRegister(7, target);

    // No flags updated

    // Add cycles
    this.cpu.addCycles(7);

    if (this.options.trace) {
      console.log(`JR R${src} -> ${target.toString(16)}`);
    }
  }

  // ========== Control Flow Instructions - Conditional (Simple Flags) ==========

  /**
   * BEQ - Branch if Equal (Z = 1)
   * Format: BEQ target
   * Operation: if Z=1 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBEQ(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();

    if (flags.Z) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BEQ -> ${target.toString(16)} (taken, Z=1)`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BEQ (not taken, Z=0)`);
      }
    }
  }

  /**
   * BNEQ - Branch if Not Equal (Z = 0)
   * Format: BNEQ target
   * Operation: if Z=0 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBNEQ(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();

    if (!flags.Z) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BNEQ -> ${target.toString(16)} (taken, Z=0)`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BNEQ (not taken, Z=1)`);
      }
    }
  }

  /**
   * BC - Branch if Carry (C = 1)
   * Format: BC target
   * Operation: if C=1 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBC(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();

    if (flags.C) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BC -> ${target.toString(16)} (taken, C=1)`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BC (not taken, C=0)`);
      }
    }
  }

  /**
   * BNC - Branch if No Carry (C = 0)
   * Format: BNC target
   * Operation: if C=0 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBNC(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();

    if (!flags.C) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BNC -> ${target.toString(16)} (taken, C=0)`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BNC (not taken, C=1)`);
      }
    }
  }

  /**
   * BOV - Branch if Overflow (OV = 1)
   * Format: BOV target
   * Operation: if OV=1 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBOV(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();

    if (flags.OV) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BOV -> ${target.toString(16)} (taken, OV=1)`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BOV (not taken, OV=0)`);
      }
    }
  }

  /**
   * BNOV - Branch if No Overflow (OV = 0)
   * Format: BNOV target
   * Operation: if OV=0 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBNOV(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();

    if (!flags.OV) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BNOV -> ${target.toString(16)} (taken, OV=0)`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BNOV (not taken, OV=1)`);
      }
    }
  }

  /**
   * BMI - Branch if Minus (S = 1)
   * Format: BMI target
   * Operation: if S=1 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBMI(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();

    if (flags.S) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BMI -> ${target.toString(16)} (taken, S=1)`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BMI (not taken, S=0)`);
      }
    }
  }

  /**
   * BPL - Branch if Plus (S = 0)
   * Format: BPL target
   * Operation: if S=0 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBPL(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();

    if (!flags.S) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BPL -> ${target.toString(16)} (taken, S=0)`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BPL (not taken, S=1)`);
      }
    }
  }

  // ========== Control Flow Instructions - Signed Comparison ==========

  /**
   * BLT - Branch if Less Than (signed: S XOR OV = 1)
   * Format: BLT target
   * Operation: if (S XOR OV)=1 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBLT(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();
    const condition = flags.S !== flags.OV; // XOR

    if (condition) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BLT -> ${target.toString(16)} (taken, S=${flags.S}, OV=${flags.OV})`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BLT (not taken, S=${flags.S}, OV=${flags.OV})`);
      }
    }
  }

  /**
   * BGE - Branch if Greater or Equal (signed: S XOR OV = 0)
   * Format: BGE target
   * Operation: if (S XOR OV)=0 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBGE(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();
    const condition = flags.S === flags.OV; // XNOR

    if (condition) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BGE -> ${target.toString(16)} (taken, S=${flags.S}, OV=${flags.OV})`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BGE (not taken, S=${flags.S}, OV=${flags.OV})`);
      }
    }
  }

  /**
   * BLE - Branch if Less or Equal (signed: Z=1 OR (S XOR OV)=1)
   * Format: BLE target
   * Operation: if Z=1 OR (S XOR OV)=1 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBLE(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();
    const condition = flags.Z || flags.S !== flags.OV;

    if (condition) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BLE -> ${target.toString(16)} (taken, Z=${flags.Z}, S=${flags.S}, OV=${flags.OV})`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BLE (not taken, Z=${flags.Z}, S=${flags.S}, OV=${flags.OV})`);
      }
    }
  }

  /**
   * BGT - Branch if Greater Than (signed: Z=0 AND (S XOR OV)=0)
   * Format: BGT target
   * Operation: if Z=0 AND (S XOR OV)=0 then PC = target
   * Flags: None updated
   * Cycles: 7 (taken), 6 (not taken)
   */
  private executeBGT(inst: Instruction): void {
    const target = inst.operands[0].value;
    const flags = this.cpu.getFlags();
    const condition = !flags.Z && flags.S === flags.OV;

    if (condition) {
      // Branch taken
      this.cpu.setRegister(7, toUint16(target));
      this.cpu.addCycles(7);

      if (this.options.trace) {
        console.log(`BGT -> ${target.toString(16)} (taken, Z=${flags.Z}, S=${flags.S}, OV=${flags.OV})`);
      }
    } else {
      // Branch not taken
      this.cpu.addCycles(6);

      if (this.options.trace) {
        console.log(`BGT (not taken, Z=${flags.Z}, S=${flags.S}, OV=${flags.OV})`);
      }
    }
  }

  // ========== Subroutine Instructions ==========

  /**
   * JSR - Jump to Subroutine
   * Format: JSR Rdst, target
   * Operation: Rdst = PC + 1, PC = target
   * Flags: None updated
   * Cycles: 12
   */
  private executeJSR(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const target = inst.operands[1].value;
    const returnAddr = toUint16(this.cpu.getRegister(7) + 1);

    // Save return address in destination register
    this.cpu.setRegister(dst, returnAddr);

    // Jump to target
    this.cpu.setRegister(7, toUint16(target));

    // No flags updated

    // Add cycles
    this.cpu.addCycles(12);

    if (this.options.trace) {
      console.log(`JSR R${dst}, ${target.toString(16)} (return=${returnAddr.toString(16)})`);
    }
  }

  /**
   * JSRE - Jump to Subroutine, Enable Interrupts
   * Format: JSRE Rdst, target
   * Operation: Rdst = PC + 1, PC = target, enable interrupts
   * Flags: None updated (interrupt enable set)
   * Cycles: 12
   */
  private executeJSRE(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const target = inst.operands[1].value;
    const returnAddr = toUint16(this.cpu.getRegister(7) + 1);

    // Save return address in destination register
    this.cpu.setRegister(dst, returnAddr);

    // Jump to target
    this.cpu.setRegister(7, toUint16(target));

    // Enable interrupts (Phase 3 - for now just track the flag)
    const state = this.cpu.getState();
    state.interruptsEnabled = true;
    this.cpu.setState(state);

    // No flags updated

    // Add cycles
    this.cpu.addCycles(12);

    if (this.options.trace) {
      console.log(`JSRE R${dst}, ${target.toString(16)} (return=${returnAddr.toString(16)}, IE=1)`);
    }
  }

  /**
   * JSRD - Jump to Subroutine, Disable Interrupts
   * Format: JSRD Rdst, target
   * Operation: Rdst = PC + 1, PC = target, disable interrupts
   * Flags: None updated (interrupt enable cleared)
   * Cycles: 12
   */
  private executeJSRD(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const target = inst.operands[1].value;
    const returnAddr = toUint16(this.cpu.getRegister(7) + 1);

    // Save return address in destination register
    this.cpu.setRegister(dst, returnAddr);

    // Jump to target
    this.cpu.setRegister(7, toUint16(target));

    // Disable interrupts (Phase 3 - for now just track the flag)
    const state = this.cpu.getState();
    state.interruptsEnabled = false;
    this.cpu.setState(state);

    // No flags updated

    // Add cycles
    this.cpu.addCycles(12);

    if (this.options.trace) {
      console.log(`JSRD R${dst}, ${target.toString(16)} (return=${returnAddr.toString(16)}, IE=0)`);
    }
  }

  // ========== Stack Instructions ==========

  /**
   * PSHR - Push Register to Stack
   * Format: PSHR Rsrc
   * Operation: R6++, memory[R6] = Rsrc
   * Flags: None updated
   * Cycles: 11
   */
  private executePSHR(inst: Instruction): void {
    const src = inst.operands[0].value;
    const value = this.cpu.getRegister(src);

    // Pre-increment stack pointer (R6)
    const sp = toUint16(this.cpu.getRegister(6) + 1);
    this.cpu.setRegister(6, sp);

    // Write value to stack
    this.memory.write(sp, value);

    // No flags updated

    // Add cycles
    this.cpu.addCycles(11);

    if (this.options.trace) {
      console.log(`PSHR R${src} -> [${sp.toString(16)}]: value=${value.toString(16)}`);
    }
  }

  /**
   * PULR - Pull from Stack to Register
   * Format: PULR Rdst
   * Operation: Rdst = memory[R6], R6--
   * Flags: None updated
   * Cycles: 11
   */
  private executePULR(inst: Instruction): void {
    const dst = inst.operands[0].value;

    // Read from current stack pointer (R6)
    const sp = this.cpu.getRegister(6);
    const value = this.memory.read(sp);

    // Write to destination register
    this.cpu.setRegister(dst, value);

    // Post-decrement stack pointer
    this.cpu.setRegister(6, toUint16(sp - 1));

    // No flags updated

    // Add cycles
    this.cpu.addCycles(11);

    if (this.options.trace) {
      console.log(`PULR R${dst} <- [${sp.toString(16)}]: value=${value.toString(16)}`);
    }
  }

  // ========== Control Instructions ==========

  /**
   * NOPP - No Operation (2-word form)
   * Format: NOPP
   * Operation: No operation
   * Flags: None updated
   * Cycles: 7
   */
  private executeNOPP(_inst: Instruction): void {
    // No operation

    // Add cycles
    this.cpu.addCycles(7);

    if (this.options.trace) {
      console.log('NOPP');
    }
  }

  /**
   * EIS - Enable Interrupt System
   * Format: EIS
   * Operation: Enable interrupts
   * Flags: None updated
   * Cycles: 6
   */
  private executeEIS(_inst: Instruction): void {
    // Enable interrupts (Phase 3 - for now just track the flag)
    const state = this.cpu.getState();
    state.interruptsEnabled = true;
    this.cpu.setState(state);

    // Add cycles
    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log('EIS - Interrupts enabled');
    }
  }

  /**
   * DIS - Disable Interrupt System
   * Format: DIS
   * Operation: Disable interrupts
   * Flags: None updated
   * Cycles: 6
   */
  private executeDIS(_inst: Instruction): void {
    // Disable interrupts (Phase 3 - for now just track the flag)
    const state = this.cpu.getState();
    state.interruptsEnabled = false;
    this.cpu.setState(state);

    // Add cycles
    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log('DIS - Interrupts disabled');
    }
  }

  // ========== Shift Instructions ==========

  /**
   * SLL - Shift Logical Left
   * Format: SLL Rdst
   * Operation: R ← R << 1, bit 0 ← 0, C ← old bit 15
   * Flags: C (bit shifted out), Z, S; OV cleared
   * Cycles: 6
   */
  private executeSLL(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);

    // Capture bit 15 before shift (goes to carry)
    const carryOut = getBit(value, 15) === 1;

    // Shift left by 1 (bit 0 becomes 0)
    const result = toUint16(value << 1);

    // Update register
    this.cpu.setRegister(dst, result);

    // Update flags
    this.cpu.setFlags({
      C: carryOut,
      OV: false, // Always cleared
      Z: result === 0,
      S: getBit(result, 15) === 1,
    });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`SLL R${dst}: ${value.toString(16)} << 1 = ${result.toString(16)}, C=${carryOut}`);
    }
  }

  /**
   * SLLC - Shift Logical Left through Carry
   * Format: SLLC Rdst
   * Operation: R ← R << 1, bit 0 ← C, C ← old bit 15
   * Flags: C (bit shifted out), Z, S; OV cleared
   * Cycles: 6
   */
  private executeSLLC(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);
    const flags = this.cpu.getFlags();

    // Capture current carry and bit 15
    const oldCarry = flags.C ? 1 : 0;
    const carryOut = getBit(value, 15) === 1;

    // Shift left by 1, insert old carry at bit 0
    const result = toUint16((value << 1) | oldCarry);

    // Update register
    this.cpu.setRegister(dst, result);

    // Update flags
    this.cpu.setFlags({
      C: carryOut,
      OV: false, // Always cleared
      Z: result === 0,
      S: getBit(result, 15) === 1,
    });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(
        `SLLC R${dst}: ${value.toString(16)} << 1 | ${oldCarry} = ${result.toString(16)}, C=${carryOut}`
      );
    }
  }

  /**
   * SLR - Shift Logical Right
   * Format: SLR Rdst
   * Operation: R ← R >> 1, bit 15 ← 0, C ← old bit 0
   * Flags: C (bit shifted out), Z, S; OV cleared
   * Cycles: 6
   */
  private executeSLR(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);

    // Capture bit 0 before shift (goes to carry)
    const carryOut = getBit(value, 0) === 1;

    // Shift right by 1 (bit 15 becomes 0)
    const result = value >>> 1; // Unsigned right shift

    // Update register
    this.cpu.setRegister(dst, result);

    // Update flags
    this.cpu.setFlags({
      C: carryOut,
      OV: false, // Always cleared
      Z: result === 0,
      S: getBit(result, 15) === 1,
    });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`SLR R${dst}: ${value.toString(16)} >> 1 = ${result.toString(16)}, C=${carryOut}`);
    }
  }

  /**
   * SAR - Shift Arithmetic Right
   * Format: SAR Rdst
   * Operation: R ← R >> 1, bit 15 ← old bit 15 (sign extend), C ← old bit 0
   * Flags: C (bit shifted out), Z, S; OV cleared
   * Cycles: 6
   */
  private executeSAR(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);

    // Capture bit 0 before shift (goes to carry)
    const carryOut = getBit(value, 0) === 1;

    // Capture sign bit (bit 15)
    const signBit = getBit(value, 15);

    // Shift right by 1
    let result = value >>> 1;

    // Preserve sign bit (bit 15)
    if (signBit === 1) {
      result = result | 0x8000;
    }

    // Update register
    this.cpu.setRegister(dst, result);

    // Update flags
    this.cpu.setFlags({
      C: carryOut,
      OV: false, // Always cleared
      Z: result === 0,
      S: getBit(result, 15) === 1,
    });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`SAR R${dst}: ${value.toString(16)} >> 1 = ${result.toString(16)}, C=${carryOut}`);
    }
  }

  /**
   * SARC - Shift Arithmetic Right through Carry
   * Format: SARC Rdst
   * Operation: R ← R >> 1, bit 15 ← C, C ← old bit 0
   * Flags: C (bit shifted out), Z, S; OV cleared
   * Cycles: 6
   */
  private executeSARC(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);
    const flags = this.cpu.getFlags();

    // Capture current carry and bit 0
    const oldCarry = flags.C ? 1 : 0;
    const carryOut = getBit(value, 0) === 1;

    // Shift right by 1, insert old carry at bit 15
    const result = toUint16((value >>> 1) | (oldCarry << 15));

    // Update register
    this.cpu.setRegister(dst, result);

    // Update flags
    this.cpu.setFlags({
      C: carryOut,
      OV: false, // Always cleared
      Z: result === 0,
      S: getBit(result, 15) === 1,
    });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(
        `SARC R${dst}: ${value.toString(16)} >> 1 | ${oldCarry << 15} = ${result.toString(16)}, C=${carryOut}`
      );
    }
  }

  // ========== Rotate Instructions ==========

  /**
   * RLC - Rotate Left through Carry
   * Format: RLC Rdst
   * Operation: temp ← C, C ← bit 15, R ← (R << 1) | temp
   * Flags: C (bit rotated out), Z, S; OV cleared
   * Cycles: 6
   */
  private executeRLC(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);
    const flags = this.cpu.getFlags();

    // Capture current carry for insertion at bit 0
    const oldCarry = flags.C ? 1 : 0;

    // Capture bit 15 for new carry
    const newCarry = getBit(value, 15) === 1;

    // Rotate left: shift left and insert old carry at bit 0
    const result = toUint16((value << 1) | oldCarry);

    // Update register
    this.cpu.setRegister(dst, result);

    // Update flags
    this.cpu.setFlags({
      C: newCarry,
      OV: false, // Always cleared
      Z: result === 0,
      S: getBit(result, 15) === 1,
    });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(
        `RLC R${dst}: ${value.toString(16)} rotated left through C=${oldCarry} = ${result.toString(16)}, C=${newCarry}`
      );
    }
  }

  /**
   * RRC - Rotate Right through Carry
   * Format: RRC Rdst
   * Operation: temp ← C, C ← bit 0, R ← (R >> 1) | (temp << 15)
   * Flags: C (bit rotated out), Z, S; OV cleared
   * Cycles: 6
   */
  private executeRRC(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);
    const flags = this.cpu.getFlags();

    // Capture current carry for insertion at bit 15
    const oldCarry = flags.C ? 1 : 0;

    // Capture bit 0 for new carry
    const newCarry = getBit(value, 0) === 1;

    // Rotate right: shift right and insert old carry at bit 15
    const result = toUint16((value >>> 1) | (oldCarry << 15));

    // Update register
    this.cpu.setRegister(dst, result);

    // Update flags
    this.cpu.setFlags({
      C: newCarry,
      OV: false, // Always cleared
      Z: result === 0,
      S: getBit(result, 15) === 1,
    });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(
        `RRC R${dst}: ${value.toString(16)} rotated right through C=${oldCarry} = ${result.toString(16)}, C=${newCarry}`
      );
    }
  }

  // ========== Bit Manipulation Instructions ==========

  /**
   * SWAP - Swap Bytes
   * Format: SWAP Rdst
   * Operation: R ← ((R & 0xFF) << 8) | ((R & 0xFF00) >> 8)
   * Flags: Z, S; C cleared, OV unchanged
   * Cycles: 6
   */
  private executeSWAP(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);

    // Extract low and high bytes
    const low = value & 0xff;
    const high = (value & 0xff00) >> 8;

    // Swap them
    const result = (low << 8) | high;

    // Update register
    this.cpu.setRegister(dst, result);

    // Update flags (C cleared, OV unchanged)
    this.cpu.setFlags({
      C: false, // Always cleared (special case)
      Z: result === 0,
      S: getBit(result, 15) === 1,
      // OV unchanged
    });

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`SWAP R${dst}: ${value.toString(16)} swapped = ${result.toString(16)}`);
    }
  }

  /**
   * NEGR - Negate (Two's Complement)
   * Format: NEGR Rdst
   * Operation: R ← 0 - R
   * Flags: C, OV, Z, S (all arithmetic flags)
   * Cycles: 6
   */
  private executeNEGR(inst: Instruction): void {
    const dst = inst.operands[0].value;
    const value = this.cpu.getRegister(dst);

    // Negate: 0 - value
    const result = 0 - value;
    this.cpu.setRegister(dst, result);

    // Use existing arithmetic flags helper (subtraction)
    this.setArithmeticFlags(result, 0, value, true);

    this.cpu.addCycles(6);

    if (this.options.trace) {
      console.log(`NEGR R${dst}: -${value.toString(16)} = ${toUint16(result).toString(16)}`);
    }
  }

  // ========== Immediate/Memory Arithmetic Instructions ==========

  /**
   * ADD - Add immediate or memory to register
   * Format: ADD #imm, Rdst  OR  ADD addr, Rdst
   * Operation: Rdst = Rdst + value
   * Flags: C, OV, Z, S (all arithmetic flags)
   * Cycles: 8 (immediate), 10 (SDBD), 8 (direct memory)
   */
  private executeAdd(inst: Instruction): void {
    const dst = inst.operands[1].value;
    const dstValue = this.cpu.getRegister(dst);

    // Get source value (immediate or from memory)
    let srcValue: number;
    if (inst.operands[0].type === 'immediate') {
      srcValue = toUint16(inst.operands[0].value);
    } else {
      // Memory address
      srcValue = this.memory.read(inst.operands[0].value);
    }

    // Perform addition
    const result = dstValue + srcValue;
    this.cpu.setRegister(dst, result);

    // Set all arithmetic flags
    this.setArithmeticFlags(result, dstValue, srcValue, false);

    // Cycles: 8 normal immediate, 10 with SDBD, 8 for direct memory
    const cycles = inst.sdbd ? 10 : 8;
    this.cpu.addCycles(cycles);

    if (this.options.trace) {
      console.log(`ADD ${srcValue.toString(16)} + R${dst} = ${toUint16(result).toString(16)}`);
    }
  }

  /**
   * SUB - Subtract immediate or memory from register
   * Format: SUB #imm, Rdst  OR  SUB addr, Rdst
   * Operation: Rdst = Rdst - value
   * Flags: C, OV, Z, S (all arithmetic flags)
   * Cycles: 8 (immediate), 10 (SDBD), 8 (direct memory)
   */
  private executeSub(inst: Instruction): void {
    const dst = inst.operands[1].value;
    const dstValue = this.cpu.getRegister(dst);

    // Get source value (immediate or from memory)
    let srcValue: number;
    if (inst.operands[0].type === 'immediate') {
      srcValue = toUint16(inst.operands[0].value);
    } else {
      // Memory address
      srcValue = this.memory.read(inst.operands[0].value);
    }

    // Perform subtraction
    const result = dstValue - srcValue;
    this.cpu.setRegister(dst, result);

    // Set all arithmetic flags
    this.setArithmeticFlags(result, dstValue, srcValue, true);

    // Cycles: 8 normal immediate, 10 with SDBD, 8 for direct memory
    const cycles = inst.sdbd ? 10 : 8;
    this.cpu.addCycles(cycles);

    if (this.options.trace) {
      console.log(`SUB R${dst} - ${srcValue.toString(16)} = ${toUint16(result).toString(16)}`);
    }
  }

  /**
   * AND - Bitwise AND immediate or memory with register
   * Format: AND #imm, Rdst  OR  AND addr, Rdst
   * Operation: Rdst = Rdst & value
   * Flags: Z, S; C, OV unchanged
   * Cycles: 8 (immediate), 10 (SDBD), 8 (direct memory)
   */
  private executeAnd(inst: Instruction): void {
    const dst = inst.operands[1].value;
    const dstValue = this.cpu.getRegister(dst);

    // Get source value (immediate or from memory)
    let srcValue: number;
    if (inst.operands[0].type === 'immediate') {
      srcValue = toUint16(inst.operands[0].value);
    } else {
      // Memory address
      srcValue = this.memory.read(inst.operands[0].value);
    }

    // Perform AND
    const result = dstValue & srcValue;
    this.cpu.setRegister(dst, result);

    // Only set S and Z flags (C, OV unchanged)
    const Z = result === 0;
    const S = getBit(result, 15) === 1;
    this.cpu.setFlags({ Z, S });

    // Cycles: 8 normal immediate, 10 with SDBD, 8 for direct memory
    const cycles = inst.sdbd ? 10 : 8;
    this.cpu.addCycles(cycles);

    if (this.options.trace) {
      console.log(`AND ${srcValue.toString(16)} & R${dst} = ${result.toString(16)}`);
    }
  }

  /**
   * XOR - Bitwise XOR immediate or memory with register
   * Format: XOR #imm, Rdst  OR  XOR addr, Rdst
   * Operation: Rdst = Rdst ^ value
   * Flags: Z, S; C, OV unchanged
   * Cycles: 8 (immediate), 10 (SDBD), 8 (direct memory)
   */
  private executeXor(inst: Instruction): void {
    const dst = inst.operands[1].value;
    const dstValue = this.cpu.getRegister(dst);

    // Get source value (immediate or from memory)
    let srcValue: number;
    if (inst.operands[0].type === 'immediate') {
      srcValue = toUint16(inst.operands[0].value);
    } else {
      // Memory address
      srcValue = this.memory.read(inst.operands[0].value);
    }

    // Perform XOR
    const result = dstValue ^ srcValue;
    this.cpu.setRegister(dst, result);

    // Only set S and Z flags (C, OV unchanged)
    const Z = result === 0;
    const S = getBit(result, 15) === 1;
    this.cpu.setFlags({ Z, S });

    // Cycles: 8 normal immediate, 10 with SDBD, 8 for direct memory
    const cycles = inst.sdbd ? 10 : 8;
    this.cpu.addCycles(cycles);

    if (this.options.trace) {
      console.log(`XOR ${srcValue.toString(16)} ^ R${dst} = ${result.toString(16)}`);
    }
  }

  /**
   * CMP - Compare immediate or memory with register
   * Format: CMP #imm, Rdst  OR  CMP addr, Rdst
   * Operation: Compare (Rdst - value), set flags but don't store result
   * Flags: C, OV, Z, S (all arithmetic flags)
   * Cycles: 8 (immediate), 10 (SDBD), 8 (direct memory)
   */
  private executeCmp(inst: Instruction): void {
    const dst = inst.operands[1].value;
    const dstValue = this.cpu.getRegister(dst);

    // Get source value (immediate or from memory)
    let srcValue: number;
    if (inst.operands[0].type === 'immediate') {
      srcValue = toUint16(inst.operands[0].value);
    } else {
      // Memory address
      srcValue = this.memory.read(inst.operands[0].value);
    }

    // Perform comparison (subtraction without storing)
    const result = dstValue - srcValue;

    // Set all arithmetic flags (but don't update register)
    this.setArithmeticFlags(result, dstValue, srcValue, true);

    // Cycles: 8 normal immediate, 10 with SDBD, 8 for direct memory
    const cycles = inst.sdbd ? 10 : 8;
    this.cpu.addCycles(cycles);

    if (this.options.trace) {
      console.log(
        `CMP R${dst} vs ${srcValue.toString(16)}: result=${toUint16(result).toString(16)} (not stored)`
      );
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
