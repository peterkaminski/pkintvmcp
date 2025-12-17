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
    // Read the full 16-bit word from memory
    // Note: CP-1600 instructions use bits 11-0 for encoding, with bits 15-12 unused.
    // We need the full value to extract bits 11-9 for opcode identification.
    const fullWord = this.memory.read(address);

    // The 10-bit "decle" is bits 9-0, used for raw storage
    const word10bit = fullWord & 0x3FF;

    // Extract opcode from bit pattern (needs full word for bits 11-9)
    const opcode = this.extractOpcode(fullWord);

    // Determine addressing mode
    const mode = this.extractAddressingMode(fullWord, opcode, sdbd);

    // Extract operands
    const operands = this.extractOperands(address, fullWord, opcode, mode, sdbd);

    // Calculate instruction length (1-3 words)
    const length = this.calculateLength(opcode, mode, sdbd);

    return {
      address,
      opcode,
      addressingMode: mode,
      operands,
      raw: word10bit,
      sdbd,
      length,
    };
  }

  /**
   * Extract opcode from instruction word
   *
   * CP-1600 instruction encoding (10-bit decle format) from jzIntv dis1600.c:
   *
   * Decoding order (from jzIntv lines 1302-1314):
   * 1. Jump (0x004): Exactly `00 0000 0100`
   * 2. Implied group a: `00 0000 00oo` (HLT, SDBD, EIS, DIS)
   * 3. Implied group b: `00 0000 01oo` (TCI, CLRC, SETC)
   * 4. Register 1-op: `00 00oo oddd` (INCR, DECR, etc.)
   * 5. Rotate/Shift: `00 01oo omrr`
   * 6. Register 2-op: `0o ooss sddd` (bit 9=0, MOVR, ADDR, etc.)
   * 7. Cond branch: `10 00z0 cccc` (B, BC, BEQ, etc.)
   * 8. Immediate: `1o oo11 1ddd` (MVII, ADDI, etc.)
   * 9. Direct: `1o oo00 0ddd`
   * 10. Indirect: `1o oomm mddd`
   *
   * @param word - 10-bit instruction word (decle)
   * @returns Opcode enum value
   * @throws Error if opcode is unrecognized (in strict mode)
   */
  private extractOpcode(word: number): Opcode {
    // Work with 10-bit decle only
    const w = word & 0x3FF;

    // === 1. Jump instruction (exact pattern) ===
    // Pattern: 00 0000 0100 = 0x004
    if (w === 0x004) return OpcodeEnum.J;

    // === 2. Implied group a: HLT, SDBD, EIS, DIS ===
    // Pattern: 00 0000 00oo → mask 0x3FC, value 0x000
    // mnm_impl_1op_a[4] = { HLT, SDBD, EIS, DIS }
    if ((w & 0x3FC) === 0x000) {
      const op = w & 0x3;
      switch (op) {
        case 0: return OpcodeEnum.HLT;
        case 1: return OpcodeEnum.SDBD;
        case 2: return OpcodeEnum.EIS;
        case 3: return OpcodeEnum.DIS;
      }
    }

    // === 3. Implied group b: TCI, CLRC, SETC ===
    // Pattern: 00 0000 01oo → mask 0x3FC, value 0x004
    // mnm_impl_1op_b[4] = { err, TCI, CLRC, SETC }
    if ((w & 0x3FC) === 0x004) {
      const op = w & 0x3;
      switch (op) {
        case 0: break; // Invalid (this is J, handled above)
        case 1: return OpcodeEnum.TCI;
        case 2: return OpcodeEnum.CLRC;
        case 3: return OpcodeEnum.SETC;
      }
    }

    // === 4. Register 1-op: INCR, DECR, COMR, NEGR, ADCR, RSWD ===
    // Pattern: 00 00oo oddd → mask 0x3C0, value 0x000
    // mnm_reg_1op[8] = { err, INCR, DECR, COMR, NEGR, ADCR, err, RSWD }
    if ((w & 0x3C0) === 0x000) {
      const op = (w >> 3) & 0x7;
      switch (op) {
        case 1: return OpcodeEnum.INCR;
        case 2: return OpcodeEnum.DECR;
        case 3: return OpcodeEnum.COMR;
        case 4: return OpcodeEnum.NEGR;
        case 5: return OpcodeEnum.ADCR;
        case 7: return OpcodeEnum.RSWD;
        // case 0, 6: invalid
      }
    }

    // === 5. Rotate/Shift: SWAP, SLL, RLC, SLLC, SLR, SAR, RRC, SARC ===
    // Pattern: 00 01oo omrr → mask 0x3C0, value 0x040
    if ((w & 0x3C0) === 0x040) {
      const op = (w >> 3) & 0x7;
      switch (op) {
        case 0: return OpcodeEnum.SWAP;
        case 1: return OpcodeEnum.SLL;
        case 2: return OpcodeEnum.RLC;
        case 3: return OpcodeEnum.SLLC;
        case 4: return OpcodeEnum.SLR;
        case 5: return OpcodeEnum.SAR;
        case 6: return OpcodeEnum.RRC;
        case 7: return OpcodeEnum.SARC;
      }
    }

    // === 6. Register 2-op: MOVR, ADDR, SUBR, CMPR, ANDR, XORR ===
    // Pattern: 0o ooss sddd → mask 0x200, value 0x000 (bit 9 = 0)
    // mnm_reg_2op[8] = { err, err, MOVR, ADDR, SUBR, CMPR, ANDR, XORR }
    // Opcode is in bits 6-8
    if ((w & 0x200) === 0x000) {
      const op = (w >> 6) & 0x7;
      if (op >= 2) {  // Opcodes 0, 1 are invalid/used by other patterns
        switch (op) {
          case 2: return OpcodeEnum.MOVR;
          case 3: return OpcodeEnum.ADDR;
          case 4: return OpcodeEnum.SUBR;
          case 5: return OpcodeEnum.CMPR;
          case 6: return OpcodeEnum.ANDR;
          case 7: return OpcodeEnum.XORR;
        }
      }
    }

    // === 7. Conditional branch ===
    // Pattern: 10 00z0 cccc → mask 0x3D0, value 0x200
    // mnm_cond_br[16] = { B, BC, BOV, BPL, BEQ, BLT, BLE, BUSC, NOPP, BNC, BNOV, BMI, BNEQ, BGE, BGT, BESC }
    if ((w & 0x3D0) === 0x200) {
      const cc = w & 0xF;  // condition code in bits 0-3
      switch (cc) {
        case 0: return OpcodeEnum.B;
        case 1: return OpcodeEnum.BC;
        case 2: return OpcodeEnum.BOV;
        case 3: return OpcodeEnum.BPL;
        case 4: return OpcodeEnum.BEQ;
        case 5: return OpcodeEnum.BLT;
        case 6: return OpcodeEnum.BLE;
        case 7: return OpcodeEnum.BUSC;
        case 8: return OpcodeEnum.NOPP;
        case 9: return OpcodeEnum.BNC;
        case 10: return OpcodeEnum.BNOV;
        case 11: return OpcodeEnum.BMI;
        case 12: return OpcodeEnum.BNEQ;
        case 13: return OpcodeEnum.BGE;
        case 14: return OpcodeEnum.BGT;
        case 15: return OpcodeEnum.BESC;
      }
    }

    // === 8. Immediate mode: MVII, ADDI, SUBI, CMPI, ANDI, XORI ===
    // Pattern: 1o oo11 1ddd → mask 0x238, value 0x238
    // mnm_imm_2op[8] = { err, MVOI, MVII, ADDI, SUBI, CMPI, ANDI, XORI }
    if ((w & 0x238) === 0x238) {
      const op = (w >> 6) & 0x7;
      switch (op) {
        case 1: return OpcodeEnum.MVOI;  // MVOI - move out immediate
        case 2: return OpcodeEnum.MVII;  // MVII - move in immediate
        case 3: return OpcodeEnum.ADDI;  // ADDI - add immediate
        case 4: return OpcodeEnum.SUBI;  // SUBI - subtract immediate
        case 5: return OpcodeEnum.CMPI;  // CMPI - compare immediate
        case 6: return OpcodeEnum.ANDI;  // ANDI - AND immediate
        case 7: return OpcodeEnum.XORI;  // XORI - XOR immediate
      }
    }

    // === 9. Direct mode ===
    // Pattern: 1o oo00 0ddd → mask 0x238, value 0x200
    if ((w & 0x238) === 0x200) {
      const op = (w >> 6) & 0x7;
      switch (op) {
        case 1: return OpcodeEnum.MVO;  // Direct MVO
        case 2: return OpcodeEnum.MVI;  // Direct MVI
        case 3: return OpcodeEnum.ADD;  // Direct ADD
        case 4: return OpcodeEnum.SUB;  // Direct SUB
        case 5: return OpcodeEnum.CMP;  // Direct CMP
        case 6: return OpcodeEnum.AND;  // Direct AND
        case 7: return OpcodeEnum.XOR;  // Direct XOR
      }
    }

    // === 10. Indirect mode (default for bit 9 = 1 patterns) ===
    // Pattern: 1o oomm mddd (mmm indicates register for indirect)
    if ((w & 0x200) === 0x200) {
      const op = (w >> 6) & 0x7;
      switch (op) {
        case 1: return OpcodeEnum.MVO_AT;  // MVO@ - move out indirect
        case 2: return OpcodeEnum.MVI_AT;  // MVI@ - move in indirect
        case 3: return OpcodeEnum.ADD_AT;  // ADD@ - add indirect
        case 4: return OpcodeEnum.SUB_AT;  // SUB@ - subtract indirect
        case 5: return OpcodeEnum.CMP_AT;  // CMP@ - compare indirect
        case 6: return OpcodeEnum.AND_AT;  // AND@ - AND indirect
        case 7: return OpcodeEnum.XOR_AT;  // XOR@ - XOR indirect
      }
    }

    // Unknown opcode
    if (this.options.strict) {
      throw new Error(
        `Unknown opcode: 0b${w.toString(2).padStart(10, '0')} (0x${w.toString(16).toUpperCase().padStart(3, '0')})`
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
  private extractAddressingMode(word: number, opcode: Opcode, sdbd: boolean): AddressingMode {
    const w = word & 0x3FF;  // 10-bit instruction word

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

    // Stack addressing
    if (opcode === OpcodeEnum.PSHR || opcode === OpcodeEnum.PULR) {
      return AddressingModeEnum.STACK;
    }

    // Immediate addressing (specific immediate opcodes)
    if (this.isImmediateOpcode(opcode)) {
      return AddressingModeEnum.IMMEDIATE;
    }

    // Indirect addressing (specific indirect opcodes)
    if (this.isIndirectOpcode(opcode)) {
      return AddressingModeEnum.INDIRECT;
    }

    // Branch instructions (PC-relative addressing)
    // Check before usesAddressingBits because branches also have bit 9=1
    if (this.isBranch(opcode)) {
      return AddressingModeEnum.DIRECT;  // Branches use DIRECT mode for target address
    }

    // For MVI, ADD, SUB, CMP, AND, XOR - check bits to distinguish addressing modes
    // These instructions use bit 9=1 and vary by bits 3-5:
    //   111 (0x7) = Immediate mode
    //   000 (0x0) = Direct mode
    //   001-110   = Indirect mode (MMM register selector)
    if (this.usesAddressingBits(opcode)) {
      const mmmBits = (w >> 3) & 0x7;  // bits 3-5
      if (mmmBits === 0x7) {
        return AddressingModeEnum.IMMEDIATE;
      } else if (mmmBits === 0x0) {
        return AddressingModeEnum.DIRECT;
      } else {
        return AddressingModeEnum.INDIRECT;
      }
    }

    // Default (should not reach here for valid instructions)
    return AddressingModeEnum.DIRECT;
  }

  /**
   * Extract operands from instruction
   *
   * CP-1600 operand extraction based on jzIntv encoding:
   * - Register 2-op (0o ooss sddd): bits 3-5 = src, bits 0-2 = dst
   * - Immediate (1o oo11 1ddd): bits 0-2 = dst, next word = immediate
   * - Register 1-op (00 00oo oddd): bits 0-2 = dst
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
    const w = word & 0x3FF;  // Work with 10-bit decle

    // Implied mode: no operands
    if (mode === AddressingModeEnum.IMPLIED) {
      return operands;
    }

    // Register mode (e.g., MOVR, ADDR, SUBR)
    // Pattern: 0o ooss sddd (10-bit)
    // From jzIntv: bits 3-5 = source, bits 0-2 = dest
    if (mode === AddressingModeEnum.REGISTER) {
      const src = (w >> 3) & 0x7;  // bits 3-5
      const dst = w & 0x7;          // bits 0-2

      operands.push({ type: 'register', value: src });
      operands.push({ type: 'register', value: dst });

      return operands;
    }

    // Immediate mode (MVII, ADDI, etc.)
    // Pattern: 1o oo11 1ddd (10-bit)
    // From jzIntv: bits 0-2 = dest, next word = immediate value
    // NOTE: Push immediate first to match assembly syntax (source, destination)
    if (mode === AddressingModeEnum.IMMEDIATE || mode === AddressingModeEnum.SDBD_MODIFIED) {
      const dst = w & 0x7;  // bits 0-2

      // Immediate value from next word(s)
      // Push immediate FIRST (source operand)
      if (sdbd) {
        // Read 16-bit immediate from next two words
        const low = this.memory.read(address + 1) & 0xFF;
        const high = this.memory.read(address + 2) & 0xFF;
        const immediate = (high << 8) | low;
        operands.push({ type: 'immediate', value: immediate });
      } else {
        // Read 10-bit immediate from next word
        const immediate = this.memory.read(address + 1) & 0x3FF;
        operands.push({ type: 'immediate', value: immediate });
      }

      // Push destination SECOND to match assembly syntax: MVII #imm, Rdst
      operands.push({ type: 'register', value: dst });

      return operands;
    }

    // Stack mode
    if (mode === AddressingModeEnum.STACK) {
      // Extract register number from bits 0-2
      const reg = w & 0x7;
      operands.push({ type: 'register', value: reg });

      return operands;
    }

    // Branch instructions (2-word: instruction + displacement)
    // Pattern: 10 00z0 cccc P-P-P-P-P-P-P-P-P-P
    // z bit (bit 5) = direction: 0=forward, 1=backward
    // P-P = 10-bit displacement in next word
    // Forward: target = PC + 2 + displacement
    // Backward: target = PC + displacement - 0x3FFD (PC-relative with base offset)
    // CHECK BEFORE DIRECT MODE because branches also use DIRECT addressing mode
    if (this.isBranch(_opcode)) {
      const dirBit = (w >> 5) & 0x1;  // bit 5: 0=forward, 1=backward
      const displacement = this.memory.read(address + 1) & 0x3FF;

      // Calculate target address (PC-relative)
      let targetAddress: number;
      if (dirBit === 0) {
        // Forward branch: PC + 2 + displacement
        targetAddress = address + 2 + displacement;
      } else {
        // Backward branch: PC + displacement - 0x3FFD
        // This formula allows backward branches to reach addresses below the current PC
        targetAddress = address + displacement - 0x3FFD;
      }

      operands.push({ type: 'address', value: targetAddress & 0xFFFF });

      return operands;
    }

    // Direct addressing mode (memory address in next word)
    // Pattern: 1o oo00 0ddd (bits 3-5 = 000)
    // For MVI/ADD/SUB/CMP/AND/XOR with direct memory address
    if (mode === AddressingModeEnum.DIRECT) {
      const dst = w & 0x7;  // bits 0-2 = destination register

      // Read 10-bit memory address from next word
      const address_operand = this.memory.read(address + 1) & 0x3FF;

      // Push operands in source, destination order
      // For MVI/ADD/SUB/CMP/AND/XOR: memory[address], register
      operands.push({ type: 'address', value: address_operand });
      operands.push({ type: 'register', value: dst });

      return operands;
    }

    // Indirect addressing mode (pointer in register)
    // Pattern: 1o oomm mddd (bits 3-5 = MMM register selector)
    if (mode === AddressingModeEnum.INDIRECT) {
      const dst = w & 0x7;  // bits 0-2 = destination register
      const mmm = (w >> 3) & 0x7;  // bits 3-5 = pointer register

      // Push operands in source, destination order
      // For MVI@/ADD@/SUB@/CMP@/AND@/XOR@: @Rptr, register
      operands.push({ type: 'register', value: mmm });  // pointer register
      operands.push({ type: 'register', value: dst });  // destination register

      return operands;
    }

    // Jump instructions (3-word: instruction + address across 2 words)
    // J: Word 1: 0 000 000 100, Word 2: X XX1 1AA AAA, Word 3: X XXX AAA A00
    // JSR: Word 1: 0 001 BAA AAA, Word 2: X XX1 BAA AAA, Word 3: X XXX AAA A00
    // Address is distributed across words 1, 2, and 3 in the "A" bit positions
    if (_opcode === OpcodeEnum.J || _opcode === OpcodeEnum.JSR ||
        _opcode === OpcodeEnum.JSRE || _opcode === OpcodeEnum.JSRD) {

      const w1 = this.memory.read(address + 1) & 0x3FF;
      const w2 = this.memory.read(address + 2) & 0x3FF;

      // Extract address bits from the three words
      // This is a simplified extraction - exact bit positions need verification against jzIntv
      // For now, combine relevant bits from words 1, 2, and 3
      // TODO: Verify exact address reconstruction formula against jzIntv source

      // Simplified address extraction (combines lower bits from each word)
      const addrBits0 = w & 0x3F;          // 6 bits from word 0 (bits 0-5)
      const addrBits1 = w1 & 0x1F;         // 5 bits from word 1 (bits 0-4)
      const addrBits2 = (w2 >> 2) & 0x1F;  // 5 bits from word 2 (bits 2-6)

      const targetAddress = (addrBits2 << 11) | (addrBits1 << 6) | addrBits0;

      // For JSR/JSRE/JSRD, extract return register from word 1
      if (_opcode !== OpcodeEnum.J) {
        // Return register is encoded in bits of word 1
        // JSR format: "1BB" where BB = 00 (R4), 01 (R5), 10 (R6)
        const returnReg = ((w >> 3) & 0x3) + 4;  // Maps 0,1,2 to R4,R5,R6

        // JSR operands: [return_register, target_address]
        operands.push({ type: 'register', value: returnReg });
        operands.push({ type: 'address', value: targetAddress & 0xFFFF });
      } else {
        // J operands: [target_address]
        operands.push({ type: 'address', value: targetAddress & 0xFFFF });
      }

      return operands;
    }

    // Default: no operands extracted
    return operands;
  }

  /**
   * Calculate instruction length in words
   *
   * CP-1600 instruction lengths from jzIntv:
   * - Implied, register, shift: 1 word
   * - Immediate mode (normal): 2 words (instruction + immediate)
   * - Immediate mode (SDBD): 3 words (instruction + 2 immediate bytes)
   * - Branch: 2 words (instruction + displacement)
   * - Jump: 3 words (instruction + address high/low)
   * - Direct/Indirect: 2 words (instruction + address)
   *
   * @param opcode - Instruction opcode
   * @param mode - Addressing mode
   * @param sdbd - Is SDBD active?
   * @returns Instruction length (1-3 words)
   */
  private calculateLength(opcode: Opcode, mode: AddressingMode, sdbd: boolean): number {
    // SDBD-modified instructions read additional words
    if (sdbd && this.usesSDBD(opcode)) {
      return 3; // Instruction + 2 immediate bytes
    }

    // Jump instructions are 3 words
    if (opcode === OpcodeEnum.J || opcode === OpcodeEnum.JSR) {
      return 3; // Instruction + 2 address words
    }

    // Branch instructions are 2 words
    if (this.isBranch(opcode)) {
      return 2; // Instruction + displacement
    }

    // Immediate mode is 2 words (instruction + immediate value)
    if (mode === AddressingModeEnum.IMMEDIATE) {
      return 2;
    }

    // Direct mode is 2 words (instruction + address)
    if (mode === AddressingModeEnum.DIRECT) {
      return 2;
    }

    // Indirect mode varies but typically 1 word
    // (address comes from register, not memory)

    // Most instructions are single-word
    return 1;
  }

  /**
   * Check if opcode is a branch instruction
   */
  private isBranch(opcode: Opcode): boolean {
    return (
      opcode === OpcodeEnum.B ||
      opcode === OpcodeEnum.BC ||
      opcode === OpcodeEnum.BNC ||
      opcode === OpcodeEnum.BOV ||
      opcode === OpcodeEnum.BNOV ||
      opcode === OpcodeEnum.BPL ||
      opcode === OpcodeEnum.BMI ||
      opcode === OpcodeEnum.BEQ ||
      opcode === OpcodeEnum.BNEQ ||
      opcode === OpcodeEnum.BLT ||
      opcode === OpcodeEnum.BGE ||
      opcode === OpcodeEnum.BLE ||
      opcode === OpcodeEnum.BGT ||
      opcode === OpcodeEnum.BUSC ||
      opcode === OpcodeEnum.BESC ||
      opcode === OpcodeEnum.NOPP
    );
  }

  /**
   * Check if opcode uses SDBD prefix
   */
  private usesSDBD(opcode: Opcode): boolean {
    return (
      // Direct addressing versions
      opcode === OpcodeEnum.MVI ||
      opcode === OpcodeEnum.ADD ||
      opcode === OpcodeEnum.SUB ||
      opcode === OpcodeEnum.CMP ||
      opcode === OpcodeEnum.AND ||
      opcode === OpcodeEnum.XOR ||
      // Immediate mode versions (SDBD extends immediate value to 16 bits)
      opcode === OpcodeEnum.MVII ||
      opcode === OpcodeEnum.ADDI ||
      opcode === OpcodeEnum.SUBI ||
      opcode === OpcodeEnum.CMPI ||
      opcode === OpcodeEnum.ANDI ||
      opcode === OpcodeEnum.XORI
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

  /**
   * Check if opcode uses addressing mode bits (bits 3-5)
   * These instructions support immediate, direct, and indirect modes
   */
  private usesAddressingBits(opcode: Opcode): boolean {
    return (
      opcode === OpcodeEnum.MVI ||
      opcode === OpcodeEnum.MVO ||
      opcode === OpcodeEnum.ADD ||
      opcode === OpcodeEnum.SUB ||
      opcode === OpcodeEnum.CMP ||
      opcode === OpcodeEnum.AND ||
      opcode === OpcodeEnum.XOR
    );
  }

  /**
   * Check if opcode is an immediate mode instruction
   */
  private isImmediateOpcode(opcode: Opcode): boolean {
    return (
      opcode === OpcodeEnum.MVII ||
      opcode === OpcodeEnum.MVOI ||
      opcode === OpcodeEnum.ADDI ||
      opcode === OpcodeEnum.SUBI ||
      opcode === OpcodeEnum.CMPI ||
      opcode === OpcodeEnum.ANDI ||
      opcode === OpcodeEnum.XORI
    );
  }

  /**
   * Check if opcode is an indirect mode instruction
   */
  private isIndirectOpcode(opcode: Opcode): boolean {
    return (
      opcode === OpcodeEnum.MVI_AT ||
      opcode === OpcodeEnum.MVO_AT ||
      opcode === OpcodeEnum.ADD_AT ||
      opcode === OpcodeEnum.SUB_AT ||
      opcode === OpcodeEnum.CMP_AT ||
      opcode === OpcodeEnum.AND_AT ||
      opcode === OpcodeEnum.XOR_AT
    );
  }
}
