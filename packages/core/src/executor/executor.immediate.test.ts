/**
 * Tests for Immediate/Memory Arithmetic and Logic Instructions
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

describe('Executor - Immediate Arithmetic Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
  });

  describe('ADD - Add Immediate', () => {
    it('should add immediate value to register', () => {
      cpu.setRegister(1, 0x0100);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.ADD,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0050 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0150);
      expect(cpu.getFlags().C).toBe(false);
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(false);
    });

    it('should set carry flag on overflow', () => {
      cpu.setRegister(2, 0xFFFF);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.ADD,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0001 },
          { type: 'register', value: 2 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      expect(cpu.getFlags().C).toBe(true);
      expect(cpu.getFlags().Z).toBe(true);
    });

    it('should handle SDBD mode (16-bit immediate)', () => {
      cpu.setRegister(3, 0x1000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.ADD,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x8000 },
          { type: 'register', value: 3 },
        ],
        raw: 0,
        sdbd: true, // SDBD prefix active
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0x9000);
      expect(cpu.getState().cycles).toBe(10); // 10 cycles with SDBD
    });
  });

  describe('SUB - Subtract Immediate', () => {
    it('should subtract immediate value from register', () => {
      cpu.setRegister(1, 0x0150);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SUB,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0050 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0100);
      expect(cpu.getFlags().C).toBe(false); // No borrow
      expect(cpu.getFlags().Z).toBe(false);
    });

    it('should set carry flag on borrow', () => {
      cpu.setRegister(2, 0x0001);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SUB,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0002 },
          { type: 'register', value: 2 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0xFFFF);
      expect(cpu.getFlags().C).toBe(true); // Borrow
      expect(cpu.getFlags().S).toBe(true); // Negative
    });

    it('should set zero flag when result is zero', () => {
      cpu.setRegister(3, 0x0042);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SUB,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0042 },
          { type: 'register', value: 3 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0x0000);
      expect(cpu.getFlags().Z).toBe(true);
      expect(cpu.getFlags().C).toBe(false);
    });
  });

  describe('AND - AND Immediate', () => {
    it('should AND immediate value with register', () => {
      cpu.setRegister(1, 0x00FF);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.AND,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0F0F },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x000F);
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(false);
    });

    it('should set zero flag when result is zero', () => {
      cpu.setRegister(2, 0x00FF);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.AND,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0xFF00 },
          { type: 'register', value: 2 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      expect(cpu.getFlags().Z).toBe(true);
    });

    it('should not affect carry or overflow flags', () => {
      cpu.setRegister(3, 0xFFFF);
      cpu.setFlags({ C: true, OV: true, Z: false, S: false });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.AND,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0xFFFF },
          { type: 'register', value: 3 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0xFFFF);
      expect(cpu.getFlags().C).toBe(true); // Unchanged
      expect(cpu.getFlags().OV).toBe(true); // Unchanged
    });
  });

  describe('XOR - XOR Immediate', () => {
    it('should XOR immediate value with register', () => {
      cpu.setRegister(1, 0xAAAA);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.XOR,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0xFFFF },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x5555);
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(false);
    });

    it('should set zero flag when XOR produces zero', () => {
      cpu.setRegister(2, 0x1234);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.XOR,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x1234 },
          { type: 'register', value: 2 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      expect(cpu.getFlags().Z).toBe(true);
    });

    it('should set sign flag when bit 15 is set', () => {
      cpu.setRegister(3, 0x0FFF);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.XOR,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x8000 },
          { type: 'register', value: 3 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0x8FFF);
      expect(cpu.getFlags().S).toBe(true);
    });
  });

  describe('CMP - Compare Immediate', () => {
    it('should compare without modifying register', () => {
      cpu.setRegister(1, 0x0100);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.CMP,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0100 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0100); // Unchanged
      expect(cpu.getFlags().Z).toBe(true); // Equal
      expect(cpu.getFlags().C).toBe(false);
    });

    it('should set flags for less than comparison', () => {
      cpu.setRegister(2, 0x0050);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.CMP,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0100 },
          { type: 'register', value: 2 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0050); // Unchanged
      expect(cpu.getFlags().C).toBe(true); // Borrow (0x50 < 0x100)
      expect(cpu.getFlags().S).toBe(true); // Negative result
    });

    it('should set flags for greater than comparison', () => {
      cpu.setRegister(3, 0x0200);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.CMP,
        addressingMode: 'IMMEDIATE' as any,
        operands: [
          { type: 'immediate', value: 0x0100 },
          { type: 'register', value: 3 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0x0200); // Unchanged
      expect(cpu.getFlags().C).toBe(false); // No borrow (0x200 > 0x100)
      expect(cpu.getFlags().Z).toBe(false); // Not equal
    });
  });
});

describe('Executor - Memory-based Instructions', () => {
  let cpu: CPU;
  let memory: SimpleMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
  });

  describe('ADD - Add from Memory', () => {
    it('should add value from memory to register', () => {
      cpu.setRegister(1, 0x0100);
      memory.write(0x0200, 0x0050);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.ADD,
        addressingMode: 'DIRECT' as any,
        operands: [
          { type: 'address', value: 0x0200 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0150);
    });
  });

  describe('SUB - Subtract from Memory', () => {
    it('should subtract value from memory from register', () => {
      cpu.setRegister(1, 0x0150);
      memory.write(0x0200, 0x0050);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.SUB,
        addressingMode: 'DIRECT' as any,
        operands: [
          { type: 'address', value: 0x0200 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0100);
    });
  });

  describe('AND - AND from Memory', () => {
    it('should AND value from memory with register', () => {
      cpu.setRegister(1, 0x00FF);
      memory.write(0x0200, 0x0F0F);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.AND,
        addressingMode: 'DIRECT' as any,
        operands: [
          { type: 'address', value: 0x0200 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x000F);
    });
  });

  describe('XOR - XOR from Memory', () => {
    it('should XOR value from memory with register', () => {
      cpu.setRegister(1, 0xAAAA);
      memory.write(0x0200, 0xFFFF);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.XOR,
        addressingMode: 'DIRECT' as any,
        operands: [
          { type: 'address', value: 0x0200 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x5555);
    });
  });

  describe('CMP - Compare with Memory', () => {
    it('should compare register with memory value', () => {
      cpu.setRegister(1, 0x0100);
      memory.write(0x0200, 0x0100);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.CMP,
        addressingMode: 'DIRECT' as any,
        operands: [
          { type: 'address', value: 0x0200 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0100); // Unchanged
      expect(cpu.getFlags().Z).toBe(true); // Equal
    });
  });
});
