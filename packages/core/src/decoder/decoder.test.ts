/**
 * @pkintvmcp/core - Decoder Tests
 *
 * Unit tests for Decoder class
 * Sprint 1.2: Basic instruction decoding
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Memory } from '../memory/memory.js';
import { Decoder } from './decoder.js';
import { Opcode as OpcodeEnum, AddressingMode as AddressingModeEnum } from './decoder.types.js';

describe('Decoder', () => {
  let memory: Memory;
  let decoder: Decoder;

  beforeEach(() => {
    memory = new Memory();
    decoder = new Decoder(memory);
  });

  describe('constructor', () => {
    test('creates decoder with memory instance', () => {
      expect(decoder).toBeDefined();
    });

    test('creates decoder with options', () => {
      const strictDecoder = new Decoder(memory, { strict: true });
      expect(strictDecoder).toBeDefined();
    });
  });

  describe('decode - Implied addressing', () => {
    test('decodes HLT instruction', () => {
      memory.write(0x5000, 0b0000_0000_0000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.HLT);
      expect(inst.addressingMode).toBe(AddressingModeEnum.IMPLIED);
      expect(inst.operands).toHaveLength(0);
      expect(inst.length).toBe(1);
      expect(inst.sdbd).toBe(false);
    });

    test('decodes SDBD instruction', () => {
      memory.write(0x5000, 0b0000_0100_0000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.SDBD);
      expect(inst.addressingMode).toBe(AddressingModeEnum.IMPLIED);
      expect(inst.operands).toHaveLength(0);
    });

    test('decodes EIS instruction', () => {
      memory.write(0x5000, 0b0000_1100_0000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.EIS);
      expect(inst.addressingMode).toBe(AddressingModeEnum.IMPLIED);
    });

    test('decodes DIS instruction', () => {
      memory.write(0x5000, 0b0001_0000_0000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.DIS);
      expect(inst.addressingMode).toBe(AddressingModeEnum.IMPLIED);
    });
  });

  describe('decode - Register addressing', () => {
    test('decodes MOVR R1, R3', () => {
      // MOVR: 0000 001s ssdd d000
      // Source: R1 (001), Dest: R3 (011)
      memory.write(0x5000, 0b0000_0010_0101_1000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.MOVR);
      expect(inst.addressingMode).toBe(AddressingModeEnum.REGISTER);
      expect(inst.operands).toHaveLength(2);
      expect(inst.operands[0]).toEqual({ type: 'register', value: 1 }); // R1
      expect(inst.operands[1]).toEqual({ type: 'register', value: 3 }); // R3
      expect(inst.length).toBe(1);
    });

    test('decodes ADDR R2, R4', () => {
      // ADDR: 0000 010s ssdd d000
      // Source: R2 (010), Dest: R4 (100)
      memory.write(0x5000, 0b0000_0100_1010_0000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.ADDR);
      expect(inst.addressingMode).toBe(AddressingModeEnum.REGISTER);
      expect(inst.operands).toHaveLength(2);
      expect(inst.operands[0]).toEqual({ type: 'register', value: 2 }); // R2
      expect(inst.operands[1]).toEqual({ type: 'register', value: 4 }); // R4
    });

    test('decodes SUBR R1, R5', () => {
      // SUBR: 0000 011s ssdd d000
      // Source: R1 (001), Dest: R5 (101)
      memory.write(0x5000, 0b0000_0110_0110_1000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.SUBR);
      expect(inst.addressingMode).toBe(AddressingModeEnum.REGISTER);
      expect(inst.operands[0]).toEqual({ type: 'register', value: 1 }); // R1
      expect(inst.operands[1]).toEqual({ type: 'register', value: 5 }); // R5
    });

    test('decodes ANDR R3, R7', () => {
      // ANDR: 0000 101s ssdd d000
      // Source: R3 (011), Dest: R7 (111)
      memory.write(0x5000, 0b0000_1010_1111_1000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.ANDR);
      expect(inst.addressingMode).toBe(AddressingModeEnum.REGISTER);
    });

    test('decodes XORR R0, R0 (CLRR)', () => {
      // XORR: 0000 111s ssdd d000
      // Source: R0 (000), Dest: R0 (000) - clears R0
      memory.write(0x5000, 0b0000_1110_0000_0000);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.XORR);
      expect(inst.addressingMode).toBe(AddressingModeEnum.REGISTER);
      expect(inst.operands[0]).toEqual({ type: 'register', value: 0 }); // R0
      expect(inst.operands[1]).toEqual({ type: 'register', value: 0 }); // R0
    });
  });

  describe('decode - Immediate addressing', () => {
    test('decodes MVI R1, #42 (without SDBD)', () => {
      // MVI: 0010 00rr riii iiii
      // Dest: R1 (001), Immediate: 42 (0x2A)
      memory.write(0x5000, 0b0010_0000_1010_1010);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.MVI);
      expect(inst.addressingMode).toBe(AddressingModeEnum.IMMEDIATE);
      expect(inst.operands).toHaveLength(2);
      expect(inst.operands[0].type).toBe('register');
      expect(inst.operands[0].value).toBe(1); // R1
      expect(inst.operands[1].type).toBe('immediate');
      expect(inst.sdbd).toBe(false);
      expect(inst.length).toBe(1);
    });

    test('decodes MVI R2, #0x1234 (with SDBD)', () => {
      // SDBD + MVI with 16-bit immediate
      memory.write(0x5000, 0b0010_0001_0000_0000); // MVI R2
      memory.write(0x5001, 0x34);                  // Low byte
      memory.write(0x5002, 0x12);                  // High byte

      const inst = decoder.decode(0x5000, true); // SDBD active

      expect(inst.opcode).toBe(OpcodeEnum.MVI);
      expect(inst.addressingMode).toBe(AddressingModeEnum.SDBD_MODIFIED);
      expect(inst.operands).toHaveLength(2);
      expect(inst.operands[0].type).toBe('register');
      expect(inst.operands[0].value).toBe(2); // R2
      expect(inst.operands[1].type).toBe('immediate');
      expect(inst.operands[1].value).toBe(0x1234);
      expect(inst.sdbd).toBe(true);
      expect(inst.length).toBe(3); // MVI + 2 immediate words
    });
  });

  describe('decode - Branches', () => {
    test('decodes B (unconditional branch)', () => {
      // B: 0010 0100 dddd dddd
      memory.write(0x5000, 0b0010_0100_0000_1010); // Branch +10

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.B);
    });

    test('decodes BEQ (branch if equal)', () => {
      // BEQ: 0010 0101 dddd dddd
      memory.write(0x5000, 0b0010_0101_0000_0101); // Branch +5 if Z=1

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.BEQ);
    });

    test('decodes BNEQ (branch if not equal)', () => {
      // BNEQ: 0010 0110 dddd dddd
      memory.write(0x5000, 0b0010_0110_1111_1100); // Branch -4 if Z=0

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.BNEQ);
    });

    test('decodes BC (branch if carry)', () => {
      // BC: 0010 0010 dddd dddd
      memory.write(0x5000, 0b0010_0010_0000_0011);

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.BC);
    });
  });

  describe('decode - Jumps', () => {
    test('decodes J (jump)', () => {
      memory.write(0x5000, 0b0000_1000_0100); // J instruction
      memory.write(0x5001, 0x1000);            // Jump address

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.J);
      expect(inst.length).toBe(2);
    });

    test('decodes JSR (jump to subroutine)', () => {
      memory.write(0x5000, 0b0000_1000_0001); // JSR instruction

      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(OpcodeEnum.JSR);
      expect(inst.length).toBe(2);
    });
  });

  describe('error handling', () => {
    test('throws error for unknown opcode in strict mode', () => {
      memory.write(0x5000, 0b1111_1111_1111); // Invalid pattern
      const strictDecoder = new Decoder(memory, { strict: true });

      expect(() => strictDecoder.decode(0x5000, false)).toThrow(/Unknown opcode/);
    });

    test('returns NOP for unknown opcode in non-strict mode', () => {
      memory.write(0x5000, 0b1111_1111_1111); // Invalid pattern
      const lenientDecoder = new Decoder(memory, { strict: false });

      const inst = lenientDecoder.decode(0x5000, false);
      expect(inst.opcode).toBe(OpcodeEnum.NOP);
    });
  });

  describe('instruction properties', () => {
    test('preserves raw instruction word', () => {
      memory.write(0x5000, 0b0000_0000_0000); // HLT

      const inst = decoder.decode(0x5000, false);

      expect(inst.raw).toBe(0b0000_0000_0000);
    });

    test('records instruction address', () => {
      memory.write(0x6543, 0b0000_0000_0000); // HLT

      const inst = decoder.decode(0x6543, false);

      expect(inst.address).toBe(0x6543);
    });

    test('records SDBD flag', () => {
      memory.write(0x5000, 0b0010_0000_1000_0000);

      const instWithoutSDBD = decoder.decode(0x5000, false);
      const instWithSDBD = decoder.decode(0x5000, true);

      expect(instWithoutSDBD.sdbd).toBe(false);
      expect(instWithSDBD.sdbd).toBe(true);
    });
  });
});
