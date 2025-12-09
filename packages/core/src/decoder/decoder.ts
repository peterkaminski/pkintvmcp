/**
 * @pkintvmcp/core - Decoder Implementation
 *
 * CP-1600 Instruction Decoder
 * Sprint 1.2: Basic structure + Phase 1 instructions
 */

import type { Memory } from '../memory/memory.js';
import type {
  Opcode,
  AddressingMode,
  Operand,
  Instruction,
  DecoderOptions,
} from './decoder.types.js';
import { Opcode as OpcodeEnum, AddressingMode as AddressingModeEnum } from './decoder.types.js';

/**
 * Decoder Class
 *
 * Decodes CP-1600 10-bit instruction words into structured Instruction objects.
 *
 * Usage:
 * ```typescript
 * const memory = new Memory();
 * memory.load(0x5000, romData);
 *
 * const decoder = new Decoder(memory);
 * const instruction = decoder.decode(0x5000, false);
 * console.log(instruction.opcode); // e.g., Opcode.MVI
 * ```
 */
export class Decoder {
  /** Memory instance to read instructions from */
  private memory: Memory;

  /** Decoder configuration options */
  private options: Required<DecoderOptions>;

  /**
   * Create a new Decoder instance
   *
   * @param memory - Memory instance to decode instructions from
   * @param options - Decoder configuration options
   */
  constructor(memory: Memory, options: DecoderOptions = {}) {
    this.memory = memory;
    this.options = {
      strict: options.strict ?? true,
      phase2: options.phase2 ?? false,
    };
  }

  /**
   * Decode an instruction at the specified address
   *
   * @param address - Memory address to decode from
   * @param sdbd - Is SDBD prefix active for this instruction?
   * @returns Decoded instruction object
   * @throws Error if instruction is invalid (in strict mode)
   */
  decode(address: number, sdbd: boolean = false): Instruction {
    // Read the 10-bit instruction word
    const word = this.memory.read(address) & 0x3FF;

    // Extract opcode from bit pattern
    const opcode = this.extractOpcode(word);

    // Determine addressing mode
    const mode = this.extractAddressingMode(word, opcode, sdbd);

    // Extract operands
    const operands = this.extractOperands(address, word, opcode, mode, sdbd);

    // Calculate instruction length (1-3 words)
    const length = this.calculateLength(opcode, mode, sdbd);

    return {
      address,
      opcode,
      addressingMode: mode,
      operands,
      raw: word,
      sdbd,
      length,
    };
  }

  /**
   * Extract opcode from instruction word
   *
   * Analyzes the bit pattern to determine which instruction this is.
   *
   * @param word - 10-bit instruction word
   * @returns Opcode enum value
   * @throws Error if opcode is unrecognized (in strict mode)
   */
  private extractOpcode(word: number): Opcode {
    // Bit 9: Instruction class (0 = internal, 1 = external)
    const bit9 = (word >> 9) & 1;

    // Bits 8-6: Subclass
    const bits8_6 = (word >> 6) & 0x7;

    // Bits 8-7: Alternative grouping
    const bits8_7 = (word >> 7) & 0x3;

    // === External Reference Instructions (bit 9 = 1) ===
    if (bit9 === 1) {
      // MVI: 0010 00... (bits 9-8 = 10, bits 7-6 = 00)
      if (bits8_7 === 0b10 && ((word >> 6) & 0x3) === 0b00) {
        return OpcodeEnum.MVI;
      }

      // Branches: 0010 01xx - 0010 11xx
      if (bits8_6 === 0b010) {
        // Branch instructions based on bits 5-4
        const branchType = (word >> 4) & 0xF;
        if (branchType === 0b0000) return OpcodeEnum.B;
        if (branchType === 0b0001) return OpcodeEnum.BC;
        if (branchType === 0b0010) return OpcodeEnum.BOV;
        if (branchType === 0b0011) return OpcodeEnum.BPL;
        if (branchType === 0b0100) return OpcodeEnum.BEQ;
        if (branchType === 0b0101) return OpcodeEnum.BLT;
        if (branchType === 0b0110) return OpcodeEnum.BLE;
        if (branchType === 0b0111) return OpcodeEnum.BUSC;
        if (branchType === 0b1000) return OpcodeEnum.NOPP;
        if (branchType === 0b1001) return OpcodeEnum.BNC;
        if (branchType === 0b1010) return OpcodeEnum.BNOV;
        if (branchType === 0b1011) return OpcodeEnum.BMI;
        if (branchType === 0b1100) return OpcodeEnum.BNEQ;
        if (branchType === 0b1101) return OpcodeEnum.BGE;
        if (branchType === 0b1110) return OpcodeEnum.BGT;
        if (branchType === 0b1111) return OpcodeEnum.BESC;
      }

      // MVO: 0011 00...
      if (bits8_6 === 0b011 && ((word >> 4) & 0x3) === 0b00) {
        return OpcodeEnum.MVO;
      }

      // ADD: 0010 1x...
      if (bits8_7 === 0b10 && ((word >> 5) & 0x1) === 1) {
        return OpcodeEnum.ADD;
      }

      // SUB: 0011 1x...
      if (bits8_7 === 0b11 && ((word >> 5) & 0x1) === 1) {
        return OpcodeEnum.SUB;
      }

      // CMP: 0011 1x...
      if (bits8_7 === 0b11 && ((word >> 5) & 0x1) === 1) {
        return OpcodeEnum.CMP;
      }

      // AND: 0010 1x...
      if (bits8_7 === 0b10 && ((word >> 4) & 0x1) === 1) {
        return OpcodeEnum.AND;
      }

      // XOR: 0011 1x...
      if (bits8_7 === 0b11 && ((word >> 4) & 0x1) === 1) {
        return OpcodeEnum.XOR;
      }
    }

    // === Internal Reference Instructions (bit 9 = 0) ===
    else {
      // Special instructions (bits 8-6 = 000)
      if (bits8_6 === 0b000) {
        // const bits5_0 = word & 0x3F; // Reserved for future use

        // HLT: 0000 0000 0000 0000
        if (word === 0b0000_0000_0000) return OpcodeEnum.HLT;

        // SDBD: 0000 0001 0000 0000
        if (word === 0b0000_0100_0000) return OpcodeEnum.SDBD;

        // EIS: 0000 0011 0000 0000
        if (word === 0b0000_1100_0000) return OpcodeEnum.EIS;

        // DIS: 0000 0100 0000 0000
        if (word === 0b0001_0000_0000) return OpcodeEnum.DIS;

        // TCI: 0000 0101 0000 0000
        if (word === 0b0001_0100_0000) return OpcodeEnum.TCI;

        // CLRC: 0000 0110 0000 0000
        if (word === 0b0001_1000_0000) return OpcodeEnum.CLRC;

        // SETC: 0000 0111 0000 0000
        if (word === 0b0001_1100_0000) return OpcodeEnum.SETC;

        // J: 0000 0010 0000 0100
        if ((word & 0x3FF) === 0b0000_1000_0100) return OpcodeEnum.J;

        // JSR: 0000 0010 0000 0001
        if ((word & 0x3FF) === 0b0000_1000_0001) return OpcodeEnum.JSR;

        // NOP: There are multiple NOP encodings
        // Common: any instruction that has no effect
      }

      // MOVR: 0000 001s ssdd d000
      if (bits8_6 === 0b001) {
        return OpcodeEnum.MOVR;
      }

      // ADDR: 0000 010s ssdd d000
      if (bits8_6 === 0b010) {
        return OpcodeEnum.ADDR;
      }

      // SUBR: 0000 011s ssdd d000
      if (bits8_6 === 0b011) {
        return OpcodeEnum.SUBR;
      }

      // CMPR: 0000 100s ssdd d000
      if (bits8_6 === 0b100) {
        return OpcodeEnum.CMPR;
      }

      // ANDR: 0000 101s ssdd d000
      if (bits8_6 === 0b101) {
        return OpcodeEnum.ANDR;
      }

      // XORR: 0000 111s ssdd d000
      if (bits8_6 === 0b111) {
        return OpcodeEnum.XORR;
      }

      // INCR: 0000 101r rr00 0000
      if (bits8_6 === 0b101 && (word & 0x7) === 0) {
        return OpcodeEnum.INCR;
      }

      // DECR: 0000 110r rr00 0000
      if (bits8_6 === 0b110 && (word & 0x7) === 0) {
        return OpcodeEnum.DECR;
      }

      // Shifts (bits 8-6 = 010, 101, 110, 111 with specific patterns)
      // TODO: Implement shift instruction detection (Phase 2)
    }

    // Unknown opcode
    if (this.options.strict) {
      throw new Error(
        `Unknown opcode: 0b${word.toString(2).padStart(10, '0')} (0x${word.toString(16).toUpperCase().padStart(3, '0')})`
      );
    }

    // Return NOP as fallback in non-strict mode
    return OpcodeEnum.NOP;
  }

  /**
   * Determine addressing mode for instruction
   *
   * @param word - 10-bit instruction word
   * @param opcode - Decoded opcode
   * @param sdbd - Is SDBD active?
   * @returns Addressing mode
   */
  private extractAddressingMode(_word: number, opcode: Opcode, sdbd: boolean): AddressingMode {
    // SDBD modifier
    if (sdbd && this.usesSDBD(opcode)) {
      return AddressingModeEnum.SDBD_MODIFIED;
    }

    // Implied addressing (no operands)
    if (this.isImpliedMode(opcode)) {
      return AddressingModeEnum.IMPLIED;
    }

    // Register addressing
    if (this.isRegisterMode(opcode)) {
      return AddressingModeEnum.REGISTER;
    }

    // Immediate addressing
    if (opcode === OpcodeEnum.MVI) {
      return AddressingModeEnum.IMMEDIATE;
    }

    // Stack addressing
    if (opcode === OpcodeEnum.PSHR || opcode === OpcodeEnum.PULR) {
      return AddressingModeEnum.STACK;
    }

    // Default to direct for now
    // TODO: Implement full addressing mode detection
    return AddressingModeEnum.DIRECT;
  }

  /**
   * Extract operands from instruction
   *
   * @param address - Instruction address
   * @param word - 10-bit instruction word
   * @param opcode - Decoded opcode
   * @param mode - Addressing mode
   * @param sdbd - Is SDBD active?
   * @returns Array of operands
   */
  private extractOperands(
    address: number,
    word: number,
    _opcode: Opcode,
    mode: AddressingMode,
    sdbd: boolean
  ): Operand[] {
    const operands: Operand[] = [];

    // Implied mode: no operands
    if (mode === AddressingModeEnum.IMPLIED) {
      return operands;
    }

    // Register mode (e.g., MOVR, ADDR, SUBR)
    if (mode === AddressingModeEnum.REGISTER) {
      // Extract source and destination registers
      // Pattern: 0000 xxxs ssdd d000
      const src = (word >> 3) & 0x7;
      const dst = word & 0x7;

      operands.push({ type: 'register', value: src });
      operands.push({ type: 'register', value: dst });

      return operands;
    }

    // Immediate mode (MVI)
    if (mode === AddressingModeEnum.IMMEDIATE || mode === AddressingModeEnum.SDBD_MODIFIED) {
      // Destination register (bits 5-3 for MVI)
      const dst = (word >> 3) & 0x7;
      operands.push({ type: 'register', value: dst });

      // Immediate value
      if (sdbd) {
        // Read 16-bit immediate from next two words
        const low = this.memory.read(address + 1) & 0xFF;
        const high = this.memory.read(address + 2) & 0xFF;
        const immediate = (high << 8) | low;
        operands.push({ type: 'immediate', value: immediate });
      } else {
        // Use embedded immediate (varies by instruction)
        // For MVI: embedded in instruction word
        const immediate = word & 0xFF; // Simplified
        operands.push({ type: 'immediate', value: immediate });
      }

      return operands;
    }

    // Stack mode
    if (mode === AddressingModeEnum.STACK) {
      // Extract register number
      const reg = (word >> 3) & 0x7;
      operands.push({ type: 'register', value: reg });

      return operands;
    }

    // Default: no operands extracted yet
    // TODO: Implement remaining addressing modes
    return operands;
  }

  /**
   * Calculate instruction length in words
   *
   * @param opcode - Instruction opcode
   * @param mode - Addressing mode
   * @param sdbd - Is SDBD active?
   * @returns Instruction length (1-3 words)
   */
  private calculateLength(opcode: Opcode, _mode: AddressingMode, sdbd: boolean): number {
    // SDBD-modified instructions read additional words
    if (sdbd && this.usesSDBD(opcode)) {
      return 3; // Instruction + 2 immediate words
    }

    // Jump and JSR have additional words
    if (opcode === OpcodeEnum.J || opcode === OpcodeEnum.JSR) {
      return 2; // Instruction + address
    }

    // Most instructions are single-word
    return 1;
  }

  /**
   * Check if opcode uses SDBD prefix
   */
  private usesSDBD(opcode: Opcode): boolean {
    return (
      opcode === OpcodeEnum.MVI ||
      opcode === OpcodeEnum.ADD ||
      opcode === OpcodeEnum.SUB ||
      opcode === OpcodeEnum.CMP ||
      opcode === OpcodeEnum.AND ||
      opcode === OpcodeEnum.XOR
    );
  }

  /**
   * Check if opcode uses implied addressing
   */
  private isImpliedMode(opcode: Opcode): boolean {
    return (
      opcode === OpcodeEnum.HLT ||
      opcode === OpcodeEnum.SDBD ||
      opcode === OpcodeEnum.EIS ||
      opcode === OpcodeEnum.DIS ||
      opcode === OpcodeEnum.TCI ||
      opcode === OpcodeEnum.CLRC ||
      opcode === OpcodeEnum.SETC ||
      opcode === OpcodeEnum.NOP
    );
  }

  /**
   * Check if opcode uses register addressing
   */
  private isRegisterMode(opcode: Opcode): boolean {
    return (
      opcode === OpcodeEnum.MOVR ||
      opcode === OpcodeEnum.ADDR ||
      opcode === OpcodeEnum.SUBR ||
      opcode === OpcodeEnum.CMPR ||
      opcode === OpcodeEnum.ANDR ||
      opcode === OpcodeEnum.XORR ||
      opcode === OpcodeEnum.INCR ||
      opcode === OpcodeEnum.DECR
    );
  }
}
