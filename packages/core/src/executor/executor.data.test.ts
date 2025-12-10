/**
 * Tests for data movement instructions (MOVR, MVI, MVO)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../cpu/cpu.js';
import { Executor } from './executor.js';
import { Opcode, AddressingMode, type Instruction } from '../decoder/decoder.types.js';
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

  // Helper for testing
  getStorage(): Map<number, number> {
    return this.storage;
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

describe('Data Movement Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('MOVR - Move Register to Register', () => {
    it('should copy value from source to destination register', () => {
      cpu.setRegister(0, 0x1234);
      cpu.setRegister(1, 0x0000);

      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(1)).toBe(0x1234);
      expect(cpu.getRegister(0)).toBe(0x1234); // Source unchanged
    });

    it('should update Z flag when result is zero', () => {
      cpu.setRegister(0, 0x0000);

      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);

      executor.execute(instruction);

      const flags = cpu.getFlags();
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should update S flag when bit 15 is set', () => {
      cpu.setRegister(0, 0x8000); // Bit 15 set

      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);

      executor.execute(instruction);

      const flags = cpu.getFlags();
      expect(flags.S).toBe(true);
      expect(flags.Z).toBe(false);
    });

    it('should not update C or OV flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: false, S: false });
      cpu.setRegister(0, 0x1234);

      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);

      executor.execute(instruction);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true); // Unchanged
      expect(flags.OV).toBe(true); // Unchanged
    });

    it('should add 6 cycles', () => {
      cpu.setRegister(0, 0x1234);
      const cyclesBefore = cpu.getCycles();

      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);

      executor.execute(instruction);

      expect(cpu.getCycles()).toBe(cyclesBefore + 6);
    });

    it('should handle moving to same register', () => {
      cpu.setRegister(0, 0xabcd);

      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(0)).toBe(0xabcd);
    });

    it('should handle negative values (bit 15 set)', () => {
      cpu.setRegister(0, 0xffff); // -1 in two's complement

      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(1)).toBe(0xffff);
      const flags = cpu.getFlags();
      expect(flags.S).toBe(true);
      expect(flags.Z).toBe(false);
    });

    it('should handle maximum positive value', () => {
      cpu.setRegister(0, 0x7fff); // Maximum positive in two's complement

      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(1)).toBe(0x7fff);
      const flags = cpu.getFlags();
      expect(flags.S).toBe(false);
      expect(flags.Z).toBe(false);
    });
  });

  describe('MVI - Move Immediate to Register', () => {
    it('should load immediate value into register', () => {
      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x1234 },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(0)).toBe(0x1234);
    });

    it('should update Z flag when immediate is zero', () => {
      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x0000 },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      const flags = cpu.getFlags();
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should update S flag when bit 15 of immediate is set', () => {
      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x8000 },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      const flags = cpu.getFlags();
      expect(flags.S).toBe(true);
      expect(flags.Z).toBe(false);
    });

    it('should not update C or OV flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: false, S: false });

      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x1234 },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true); // Unchanged
      expect(flags.OV).toBe(true); // Unchanged
    });

    it('should add 8 cycles in normal mode', () => {
      const cyclesBefore = cpu.getCycles();

      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x1234 },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      expect(cpu.getCycles()).toBe(cyclesBefore + 8);
    });

    it('should add 10 cycles in SDBD mode', () => {
      const cyclesBefore = cpu.getCycles();

      const instruction = createTestInstruction(
        Opcode.MVI,
        [
          { type: 'immediate', value: 0x1234 },
          { type: 'register', value: 0 },
        ],
        { sdbd: true }
      );

      executor.execute(instruction);

      expect(cpu.getCycles()).toBe(cyclesBefore + 10);
    });

    it('should add 8 cycles when sdbd is undefined', () => {
      const cyclesBefore = cpu.getCycles();

      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x1234 },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      expect(cpu.getCycles()).toBe(cyclesBefore + 8);
    });

    it('should wrap immediate values to 16-bit', () => {
      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x10000 },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(0)).toBe(0x0000);
    });

    it('should handle negative immediate values', () => {
      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0xffff },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(0)).toBe(0xffff);
      const flags = cpu.getFlags();
      expect(flags.S).toBe(true);
    });

    it('should handle maximum positive immediate', () => {
      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x7fff },
        { type: 'register', value: 0 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(0)).toBe(0x7fff);
      const flags = cpu.getFlags();
      expect(flags.S).toBe(false);
    });

    it('should load into different registers', () => {
      const instruction1 = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x1111 },
        { type: 'register', value: 0 },
      ]);

      const instruction2 = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 0x2222 },
        { type: 'register', value: 1 },
      ]);

      executor.execute(instruction1);
      executor.execute(instruction2);

      expect(cpu.getRegister(0)).toBe(0x1111);
      expect(cpu.getRegister(1)).toBe(0x2222);
    });
  });

  describe('MVO - Move Register to Memory', () => {
    it('should write register value to memory', () => {
      cpu.setRegister(0, 0x1234);

      const instruction = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);

      executor.execute(instruction);

      expect(memory.read(0x1000)).toBe(0x1234);
    });

    it('should not update any flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: true, S: true });
      cpu.setRegister(0, 0x1234);

      const instruction = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);

      executor.execute(instruction);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(true);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(true);
    });

    it('should add 11 cycles', () => {
      cpu.setRegister(0, 0x1234);
      const cyclesBefore = cpu.getCycles();

      const instruction = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);

      executor.execute(instruction);

      expect(cpu.getCycles()).toBe(cyclesBefore + 11);
    });

    it('should write zero to memory', () => {
      cpu.setRegister(0, 0x0000);

      const instruction = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);

      executor.execute(instruction);

      expect(memory.read(0x1000)).toBe(0x0000);
    });

    it('should write negative value to memory', () => {
      cpu.setRegister(0, 0xffff);

      const instruction = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);

      executor.execute(instruction);

      expect(memory.read(0x1000)).toBe(0xffff);
    });

    it('should write to different memory addresses', () => {
      cpu.setRegister(0, 0x1111);
      cpu.setRegister(1, 0x2222);

      const instruction1 = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);

      const instruction2 = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 1 },
        { type: 'address', value: 0x2000 },
      ]);

      executor.execute(instruction1);
      executor.execute(instruction2);

      expect(memory.read(0x1000)).toBe(0x1111);
      expect(memory.read(0x2000)).toBe(0x2222);
    });

    it('should overwrite existing memory value', () => {
      memory.write(0x1000, 0xaaaa);
      cpu.setRegister(0, 0xbbbb);

      const instruction = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);

      executor.execute(instruction);

      expect(memory.read(0x1000)).toBe(0xbbbb);
    });

    it('should not modify source register', () => {
      cpu.setRegister(0, 0x1234);

      const instruction = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);

      executor.execute(instruction);

      expect(cpu.getRegister(0)).toBe(0x1234);
    });
  });

  describe('Integration tests', () => {
    it('should chain MOVR and MVO operations', () => {
      cpu.setRegister(0, 0xabcd);

      executor.execute(
        createTestInstruction(Opcode.MOVR, [
          { type: 'register', value: 0 },
          { type: 'register', value: 1 },
        ])
      );

      executor.execute(
        createTestInstruction(Opcode.MVO, [
          { type: 'register', value: 1 },
          { type: 'address', value: 0x1000 },
        ])
      );

      expect(cpu.getRegister(1)).toBe(0xabcd);
      expect(memory.read(0x1000)).toBe(0xabcd);
    });

    it('should chain MVI and MVO operations', () => {
      executor.execute(
        createTestInstruction(Opcode.MVI, [
          { type: 'immediate', value: 0x5555 },
          { type: 'register', value: 0 },
        ])
      );

      executor.execute(
        createTestInstruction(Opcode.MVO, [
          { type: 'register', value: 0 },
          { type: 'address', value: 0x2000 },
        ])
      );

      expect(cpu.getRegister(0)).toBe(0x5555);
      expect(memory.read(0x2000)).toBe(0x5555);
    });

    it('should accumulate cycles correctly', () => {
      cpu.reset();
      expect(cpu.getCycles()).toBe(0);

      // MOVR: 6 cycles
      executor.execute(
        createTestInstruction(Opcode.MOVR, [
          { type: 'register', value: 0 },
          { type: 'register', value: 1 },
        ])
      );
      expect(cpu.getCycles()).toBe(6);

      // MVI: 8 cycles
      executor.execute(
        createTestInstruction(Opcode.MVI, [
          { type: 'immediate', value: 0x1234 },
          { type: 'register', value: 2 },
        ])
      );
      expect(cpu.getCycles()).toBe(14);

      // MVO: 11 cycles
      executor.execute(
        createTestInstruction(Opcode.MVO, [
          { type: 'register', value: 2 },
          { type: 'address', value: 0x1000 },
        ])
      );
      expect(cpu.getCycles()).toBe(25);
    });
  });
});
