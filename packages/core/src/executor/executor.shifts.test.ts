/**
 * Tests for Shift, Rotate, and Bit Manipulation Instructions
 * Sprint 1.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../cpu/cpu.js';
import { Executor } from './executor.js';
import { Opcode, type Instruction } from '../decoder/decoder.types.js';
import type { Memory } from './executor.types.js';

/**
 * Mock Memory implementation for testing
 */
class MockMemory implements Memory {
  private storage: Map<number, number> = new Map();

  read(address: number): number {
    return this.storage.get(address) || 0;
  }

  write(address: number, value: number): void {
    this.storage.set(address, value);
  }
}

describe('Executor - Shift Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
  });

  describe('SLL - Shift Logical Left', () => {
    it('should shift left by 1 bit', () => {
      cpu.setRegister(1, 0x0123);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SLL,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0246);
      expect(cpu.getFlags().C).toBe(false); // bit 15 was 0
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(false);
      expect(cpu.getFlags().OV).toBe(false);
    });

    it('should set carry when bit 15 is shifted out', () => {
      cpu.setRegister(2, 0x8000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SLL,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      expect(cpu.getFlags().C).toBe(true); // bit 15 was 1
      expect(cpu.getFlags().Z).toBe(true);
      expect(cpu.getFlags().OV).toBe(false); // Always cleared
    });

    it('should set sign flag when result bit 15 is 1', () => {
      cpu.setRegister(3, 0x4000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SLL,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 3 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0x8000);
      expect(cpu.getFlags().S).toBe(true);
      expect(cpu.getFlags().C).toBe(false);
    });
  });

  describe('SLLC - Shift Logical Left through Carry', () => {
    it('should shift left and insert carry at bit 0', () => {
      cpu.setRegister(1, 0x0123);
      cpu.setFlags({ C: true, OV: false, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SLLC,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0247); // shifted with C=1 at bit 0
      expect(cpu.getFlags().C).toBe(false); // old bit 15 was 0
      expect(cpu.getFlags().OV).toBe(false);
    });

    it('should rotate through carry correctly', () => {
      cpu.setRegister(2, 0xFFFF);
      cpu.setFlags({ C: false, OV: false, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SLLC,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0xFFFE); // C=0 inserted at bit 0
      expect(cpu.getFlags().C).toBe(true); // old bit 15 was 1
    });
  });

  describe('SLR - Shift Logical Right', () => {
    it('should shift right by 1 bit', () => {
      cpu.setRegister(1, 0x1234);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SLR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x091A);
      expect(cpu.getFlags().C).toBe(false); // bit 0 was 0
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(false);
      expect(cpu.getFlags().OV).toBe(false);
    });

    it('should set carry when bit 0 is shifted out', () => {
      cpu.setRegister(2, 0x0001);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SLR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      expect(cpu.getFlags().C).toBe(true); // bit 0 was 1
      expect(cpu.getFlags().Z).toBe(true);
    });

    it('should clear bit 15 (logical shift)', () => {
      cpu.setRegister(3, 0x8000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SLR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 3 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0x4000);
      expect(cpu.getFlags().S).toBe(false); // bit 15 cleared
    });
  });

  describe('SAR - Shift Arithmetic Right', () => {
    it('should shift right and preserve sign (positive)', () => {
      cpu.setRegister(1, 0x1234);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SAR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x091A);
      expect(cpu.getFlags().C).toBe(false);
      expect(cpu.getFlags().S).toBe(false); // Still positive
    });

    it('should shift right and preserve sign (negative)', () => {
      cpu.setRegister(2, 0x8000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SAR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0xC000); // Sign bit preserved
      expect(cpu.getFlags().S).toBe(true); // Still negative
      expect(cpu.getFlags().C).toBe(false);
    });

    it('should set carry correctly', () => {
      cpu.setRegister(3, 0xFFFF);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SAR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 3 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0xFFFF); // Arithmetic shift of -1
      expect(cpu.getFlags().C).toBe(true); // bit 0 was 1
    });
  });

  describe('SARC - Shift Arithmetic Right through Carry', () => {
    it('should shift right and insert carry at bit 15', () => {
      cpu.setRegister(1, 0x1234);
      cpu.setFlags({ C: true, OV: false, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SARC,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x891A); // C=1 inserted at bit 15
      expect(cpu.getFlags().C).toBe(false); // old bit 0 was 0
      expect(cpu.getFlags().S).toBe(true); // bit 15 now set
    });

    it('should handle carry=0 correctly', () => {
      cpu.setRegister(2, 0x8001);
      cpu.setFlags({ C: false, OV: false, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SARC,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x4000); // C=0 inserted at bit 15
      expect(cpu.getFlags().C).toBe(true); // old bit 0 was 1
      expect(cpu.getFlags().S).toBe(false); // bit 15 now 0
    });
  });
});

describe('Executor - Rotate Instructions', () => {
  let cpu: CPU;
  let memory: SimpleMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
  });

  describe('RLC - Rotate Left through Carry', () => {
    it('should rotate left through carry (17-bit rotation)', () => {
      cpu.setRegister(1, 0x8000);
      cpu.setFlags({ C: true, OV: false, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.RLC,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0001); // old C inserted at bit 0
      expect(cpu.getFlags().C).toBe(true); // old bit 15
      expect(cpu.getFlags().OV).toBe(false); // Always cleared
    });

    it('should complete a 17-bit rotation sequence', () => {
      cpu.setRegister(2, 0x0001);
      cpu.setFlags({ C: false, OV: false, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.RLC,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      // First rotation: 0x0001, C=0 → 0x0002, C=0
      executor.execute(inst);
      expect(cpu.getRegister(2)).toBe(0x0002);
      expect(cpu.getFlags().C).toBe(false);

      // Second rotation: 0x0002, C=0 → 0x0004, C=0
      executor.execute(inst);
      expect(cpu.getRegister(2)).toBe(0x0004);
    });
  });

  describe('RRC - Rotate Right through Carry', () => {
    it('should rotate right through carry (17-bit rotation)', () => {
      cpu.setRegister(1, 0x0001);
      cpu.setFlags({ C: true, OV: false, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.RRC,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x8000); // old C inserted at bit 15
      expect(cpu.getFlags().C).toBe(true); // old bit 0
      expect(cpu.getFlags().S).toBe(true);
      expect(cpu.getFlags().OV).toBe(false);
    });

    it('should handle multiple rotations', () => {
      cpu.setRegister(2, 0x8000);
      cpu.setFlags({ C: false, OV: false, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.RRC,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      // First rotation: 0x8000, C=0 → 0x4000, C=0
      executor.execute(inst);
      expect(cpu.getRegister(2)).toBe(0x4000);
      expect(cpu.getFlags().C).toBe(false);

      // Second rotation: 0x4000, C=0 → 0x2000, C=0
      executor.execute(inst);
      expect(cpu.getRegister(2)).toBe(0x2000);
    });
  });
});

describe('Executor - Bit Manipulation Instructions', () => {
  let cpu: CPU;
  let memory: SimpleMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
  });

  describe('SWAP - Swap Bytes', () => {
    it('should swap high and low bytes', () => {
      cpu.setRegister(1, 0x1234);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SWAP,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x3412);
      expect(cpu.getFlags().C).toBe(false); // Always cleared
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(false);
    });

    it('should set zero flag when result is zero', () => {
      cpu.setRegister(2, 0x0000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SWAP,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      expect(cpu.getFlags().Z).toBe(true);
      expect(cpu.getFlags().C).toBe(false); // Always cleared
    });

    it('should set sign flag when bit 15 is set', () => {
      cpu.setRegister(3, 0x00FF);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SWAP,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 3 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0xFF00);
      expect(cpu.getFlags().S).toBe(true); // bit 15 now set
      expect(cpu.getFlags().C).toBe(false);
    });
  });

  describe('NEGR - Negate (Two\'s Complement)', () => {
    it('should negate a positive value', () => {
      cpu.setRegister(1, 0x0001);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.NEGR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0xFFFF); // -1 in 16-bit
      expect(cpu.getFlags().S).toBe(true); // Negative
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().C).toBe(true); // 0 < 1
    });

    it('should negate zero to zero', () => {
      cpu.setRegister(2, 0x0000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.NEGR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 2 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      expect(cpu.getFlags().Z).toBe(true);
      expect(cpu.getFlags().S).toBe(false);
      expect(cpu.getFlags().C).toBe(false); // 0 == 0
    });

    it('should handle -32768 (overflow case)', () => {
      cpu.setRegister(3, 0x8000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.NEGR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 3 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0x8000); // -32768 negated = -32768
      expect(cpu.getFlags().OV).toBe(true); // Overflow
      expect(cpu.getFlags().S).toBe(true);
    });

    it('should negate a negative value to positive', () => {
      cpu.setRegister(4, 0xFFFF); // -1

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.NEGR,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 4 }],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(4)).toBe(0x0001);
      expect(cpu.getFlags().S).toBe(false); // Positive
      expect(cpu.getFlags().C).toBe(true); // 0 < 0xFFFF (borrow occurred)
    });
  });
});
