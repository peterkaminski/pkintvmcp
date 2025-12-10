/**
 * Comprehensive tests for executor instructions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../../cpu/cpu';
import { Executor } from '../executor';
import { Opcode, AddressingMode, type Instruction } from '../../decoder/decoder.types';
import type { Memory } from '../executor.types';

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

  clear(): void {
    this.storage.clear();
  }
}

/**
 * Test helper to create Instruction objects
 */
function createTestInstruction(
  opcode: Opcode,
  operands: Array<{ type: 'register' | 'immediate' | 'address'; value: number }>,
  options?: {
    address?: number;
    addressingMode?: AddressingMode;
    raw?: number;
    sdbd?: boolean;
    length?: number;
  }
): Instruction {
  return {
    address: options?.address ?? 0x5000,
    opcode,
    addressingMode: options?.addressingMode ?? AddressingMode.REGISTER,
    operands: operands.map((op) => ({
      type: op.type,
      value: op.value,
    })),
    raw: options?.raw ?? 0x000,
    sdbd: options?.sdbd ?? false,
    length: options?.length ?? 1,
  };
}

describe('Executor - Arithmetic Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('ADDR - Add Register to Register', () => {
    it('should add two positive numbers', () => {
      cpu.setRegister(1, 10);
      cpu.setRegister(2, 20);

      const inst = createTestInstruction(Opcode.ADDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(30);
    });

    it('should set carry flag on unsigned overflow', () => {
      cpu.setRegister(1, 0x0001);
      cpu.setRegister(2, 0xffff);

      const inst = createTestInstruction(Opcode.ADDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.Z).toBe(true);
    });

    it('should set overflow flag on signed overflow (positive + positive = negative)', () => {
      cpu.setRegister(1, 0x0001);
      cpu.setRegister(2, 0x7fff); // Max positive

      const inst = createTestInstruction(Opcode.ADDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x8000);
      const flags = cpu.getFlags();
      expect(flags.OV).toBe(true);
      expect(flags.S).toBe(true); // Result is negative
    });

    it('should set zero flag when result is zero', () => {
      cpu.setRegister(1, 0x0000);
      cpu.setRegister(2, 0x0000);

      const inst = createTestInstruction(Opcode.ADDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should set sign flag when result is negative', () => {
      cpu.setRegister(1, 0x8000);
      cpu.setRegister(2, 0x0001);

      const inst = createTestInstruction(Opcode.ADDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.S).toBe(true);
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(1, 10);
      cpu.setRegister(2, 20);
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.ADDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });
  });

  describe('SUBR - Subtract Register from Register', () => {
    it('should subtract two numbers', () => {
      cpu.setRegister(1, 10);
      cpu.setRegister(2, 30);

      const inst = createTestInstruction(Opcode.SUBR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(20);
    });

    it('should set carry flag on unsigned borrow', () => {
      cpu.setRegister(1, 20);
      cpu.setRegister(2, 10);

      const inst = createTestInstruction(Opcode.SUBR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true); // Borrow occurred
    });

    it('should set overflow flag on signed overflow (negative - positive = positive)', () => {
      cpu.setRegister(1, 0x0001);
      cpu.setRegister(2, 0x8000); // Min negative

      const inst = createTestInstruction(Opcode.SUBR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x7fff);
      const flags = cpu.getFlags();
      expect(flags.OV).toBe(true);
    });

    it('should set zero flag when result is zero', () => {
      cpu.setRegister(1, 10);
      cpu.setRegister(2, 10);

      const inst = createTestInstruction(Opcode.SUBR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.Z).toBe(true);
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(1, 10);
      cpu.setRegister(2, 30);
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.SUBR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });
  });

  describe('INCR - Increment Register', () => {
    it('should increment register by 1', () => {
      cpu.setRegister(1, 10);

      const inst = createTestInstruction(Opcode.INCR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(11);
    });

    it('should wrap from 0xFFFF to 0x0000', () => {
      cpu.setRegister(1, 0xffff);

      const inst = createTestInstruction(Opcode.INCR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x0000);
      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.Z).toBe(true);
    });

    it('should set overflow flag when incrementing 0x7FFF', () => {
      cpu.setRegister(1, 0x7fff);

      const inst = createTestInstruction(Opcode.INCR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x8000);
      const flags = cpu.getFlags();
      expect(flags.OV).toBe(true);
      expect(flags.S).toBe(true);
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(1, 10);
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.INCR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });
  });

  describe('DECR - Decrement Register', () => {
    it('should decrement register by 1', () => {
      cpu.setRegister(1, 10);

      const inst = createTestInstruction(Opcode.DECR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(9);
    });

    it('should wrap from 0x0000 to 0xFFFF', () => {
      cpu.setRegister(1, 0x0000);

      const inst = createTestInstruction(Opcode.DECR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0xffff);
      const flags = cpu.getFlags();
      expect(flags.C).toBe(true); // Borrow
      expect(flags.S).toBe(true); // Negative
    });

    it('should set overflow flag when decrementing 0x8000', () => {
      cpu.setRegister(1, 0x8000);

      const inst = createTestInstruction(Opcode.DECR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x7fff);
      const flags = cpu.getFlags();
      expect(flags.OV).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(1, 10);
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.DECR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });
  });
});

describe('Executor - Logic Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('ANDR - Bitwise AND', () => {
    it('should perform bitwise AND', () => {
      cpu.setRegister(1, 0b1010);
      cpu.setRegister(2, 0b1100);

      const inst = createTestInstruction(Opcode.ANDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0b1000);
    });

    it('should set zero flag when result is zero', () => {
      cpu.setRegister(1, 0b1010);
      cpu.setRegister(2, 0b0101);

      const inst = createTestInstruction(Opcode.ANDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0);
      const flags = cpu.getFlags();
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should set sign flag when bit 15 is set', () => {
      cpu.setRegister(1, 0xffff);
      cpu.setRegister(2, 0x8000);

      const inst = createTestInstruction(Opcode.ANDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.S).toBe(true);
    });

    it('should not modify C or OV flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: false, S: false });
      cpu.setRegister(1, 0b1010);
      cpu.setRegister(2, 0b1100);

      const inst = createTestInstruction(Opcode.ANDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true); // Unchanged
      expect(flags.OV).toBe(true); // Unchanged
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(1, 0b1010);
      cpu.setRegister(2, 0b1100);
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.ANDR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });
  });

  describe('XORR - Bitwise XOR', () => {
    it('should perform bitwise XOR', () => {
      cpu.setRegister(1, 0b1010);
      cpu.setRegister(2, 0b1100);

      const inst = createTestInstruction(Opcode.XORR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0b0110);
    });

    it('should set zero flag when XORing identical values', () => {
      cpu.setRegister(1, 0x1234);
      cpu.setRegister(2, 0x1234);

      const inst = createTestInstruction(Opcode.XORR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0);
      const flags = cpu.getFlags();
      expect(flags.Z).toBe(true);
    });

    it('should set sign flag when bit 15 is set', () => {
      cpu.setRegister(1, 0x8000);
      cpu.setRegister(2, 0x0000);

      const inst = createTestInstruction(Opcode.XORR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.S).toBe(true);
    });

    it('should not modify C or OV flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: false, S: false });
      cpu.setRegister(1, 0b1010);
      cpu.setRegister(2, 0b1100);

      const inst = createTestInstruction(Opcode.XORR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true); // Unchanged
      expect(flags.OV).toBe(true); // Unchanged
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(1, 0b1010);
      cpu.setRegister(2, 0b1100);
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.XORR, [
        { type: 'register', value: 1 },
        { type: 'register', value: 2 },
      ]);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });
  });

  describe('CLRR - Clear Register', () => {
    it('should clear register to zero', () => {
      cpu.setRegister(1, 0xabcd);

      const inst = createTestInstruction(Opcode.CLRR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0);
    });

    it('should always set Z=1 and S=0', () => {
      cpu.setRegister(1, 0xffff);

      const inst = createTestInstruction(Opcode.CLRR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should not modify C or OV flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: false, S: true });
      cpu.setRegister(1, 0xabcd);

      const inst = createTestInstruction(Opcode.CLRR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true); // Unchanged
      expect(flags.OV).toBe(true); // Unchanged
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(1, 0xabcd);
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.CLRR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });
  });
});

describe('Executor - Status Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('TSTR - Test Register', () => {
    it('should set Z flag when register is zero', () => {
      cpu.setRegister(1, 0x0000);

      const inst = createTestInstruction(Opcode.TSTR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should set S flag when bit 15 is set', () => {
      cpu.setRegister(1, 0x8000);

      const inst = createTestInstruction(Opcode.TSTR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.S).toBe(true);
      expect(flags.Z).toBe(false);
    });

    it('should clear C and OV flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: false, S: false });
      cpu.setRegister(1, 0x1234);

      const inst = createTestInstruction(Opcode.TSTR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(false);
      expect(flags.OV).toBe(false);
    });

    it('should not modify the register', () => {
      cpu.setRegister(1, 0x1234);

      const inst = createTestInstruction(Opcode.TSTR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x1234);
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(1, 0x1234);
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.TSTR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });
  });

  describe('HLT - Halt Processor', () => {
    it('should set halted flag', () => {
      const inst = createTestInstruction(Opcode.HLT, []);

      executor.execute(inst);

      const state = cpu.getState();
      expect(state.halted).toBe(true);
    });

    it('should not modify flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: true, S: true });

      const inst = createTestInstruction(Opcode.HLT, []);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(true);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(true);
    });

    it('should add 4 cycles', () => {
      const cyclesBefore = cpu.getCycles();

      const inst = createTestInstruction(Opcode.HLT, []);

      executor.execute(inst);

      expect(cpu.getCycles()).toBe(cyclesBefore + 4);
    });
  });
});
