import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../cpu/cpu.js';
import { Executor } from './executor.js';
import { Opcode, type Instruction } from '../decoder/decoder.types.js';
import type { Memory } from './executor.types.js';

/**
 * Mock Memory implementation for testing
 * Uses Map instead of full Memory class for lightweight, fast tests
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

describe('Executor - Auto-Increment Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
  });

  describe('MVI@ - Move from Memory with Auto-Increment', () => {
    it('should load value from memory and increment pointer', () => {
      cpu.setRegister(4, 0x0200); // R4 = pointer to memory
      memory.write(0x0200, 0x1234); // Memory contains value

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.MVI_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 4 }, // Pointer register
          { type: 'register', value: 1 }, // Destination register
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x1234); // Value loaded
      expect(cpu.getRegister(4)).toBe(0x0201); // Pointer incremented
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(false);
      expect(cpu.getState().cycles).toBe(8);
    });

    it('should set zero flag when loading zero', () => {
      cpu.setRegister(4, 0x0100);
      memory.write(0x0100, 0x0000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.MVI_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 4 },
          { type: 'register', value: 2 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x0000);
      expect(cpu.getRegister(4)).toBe(0x0101); // Pointer still increments
      expect(cpu.getFlags().Z).toBe(true);
      expect(cpu.getFlags().S).toBe(false);
    });

    it('should set sign flag when loading negative value', () => {
      cpu.setRegister(5, 0x0300);
      memory.write(0x0300, 0x8000);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.MVI_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 5 },
          { type: 'register', value: 3 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(3)).toBe(0x8000);
      expect(cpu.getRegister(5)).toBe(0x0301);
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(true);
    });

    it('should handle pointer wraparound', () => {
      cpu.setRegister(4, 0xFFFF);
      memory.write(0xFFFF, 0x5678);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.MVI_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 4 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(cpu.getRegister(1)).toBe(0x5678);
      expect(cpu.getRegister(4)).toBe(0x0000); // Wrapped to 0
    });

    it('should work with multiple consecutive loads', () => {
      cpu.setRegister(4, 0x0200);
      memory.write(0x0200, 0x0001);
      memory.write(0x0201, 0x0002);
      memory.write(0x0202, 0x0003);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.MVI_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 4 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      // First load
      executor.execute(inst);
      expect(cpu.getRegister(1)).toBe(0x0001);
      expect(cpu.getRegister(4)).toBe(0x0201);

      // Second load
      executor.execute(inst);
      expect(cpu.getRegister(1)).toBe(0x0002);
      expect(cpu.getRegister(4)).toBe(0x0202);

      // Third load
      executor.execute(inst);
      expect(cpu.getRegister(1)).toBe(0x0003);
      expect(cpu.getRegister(4)).toBe(0x0203);
    });
  });

  describe('MVO@ - Move to Memory with Auto-Increment', () => {
    it('should store value to memory and increment pointer', () => {
      cpu.setRegister(1, 0x1234); // Value to store
      cpu.setRegister(4, 0x0200); // Pointer register

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.MVO_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 1 }, // Source register
          { type: 'register', value: 4 }, // Pointer register
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(memory.read(0x0200)).toBe(0x1234); // Value stored
      expect(cpu.getRegister(4)).toBe(0x0201); // Pointer incremented
      expect(cpu.getState().cycles).toBe(9);
    });

    it('should not affect flags', () => {
      cpu.setRegister(2, 0x0000); // Zero value
      cpu.setRegister(4, 0x0100);

      // Set initial flags
      cpu.setFlags({ Z: false, S: false, C: true, OV: true });

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.MVO_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 2 },
          { type: 'register', value: 4 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(memory.read(0x0100)).toBe(0x0000);
      expect(cpu.getRegister(4)).toBe(0x0101);
      // Flags should be unchanged
      expect(cpu.getFlags().Z).toBe(false);
      expect(cpu.getFlags().S).toBe(false);
      expect(cpu.getFlags().C).toBe(true);
      expect(cpu.getFlags().OV).toBe(true);
    });

    it('should handle pointer wraparound', () => {
      cpu.setRegister(1, 0xABCD);
      cpu.setRegister(4, 0xFFFF);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.MVO_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 1 },
          { type: 'register', value: 4 },
        ],
        raw: 0,
        sdbd: false,
      };

      executor.execute(inst);

      expect(memory.read(0xFFFF)).toBe(0xABCD);
      expect(cpu.getRegister(4)).toBe(0x0000); // Wrapped to 0
    });

    it('should work with multiple consecutive stores', () => {
      cpu.setRegister(1, 0x0001);
      cpu.setRegister(2, 0x0002);
      cpu.setRegister(3, 0x0003);
      cpu.setRegister(4, 0x0200);

      const inst1: Instruction = {
        address: 0,
        opcode: Opcode.MVO_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 1 },
          { type: 'register', value: 4 },
        ],
        raw: 0,
        sdbd: false,
      };

      const inst2: Instruction = {
        address: 0,
        opcode: Opcode.MVO_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 2 },
          { type: 'register', value: 4 },
        ],
        raw: 0,
        sdbd: false,
      };

      const inst3: Instruction = {
        address: 0,
        opcode: Opcode.MVO_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 3 },
          { type: 'register', value: 4 },
        ],
        raw: 0,
        sdbd: false,
      };

      // Store three values
      executor.execute(inst1);
      expect(memory.read(0x0200)).toBe(0x0001);
      expect(cpu.getRegister(4)).toBe(0x0201);

      executor.execute(inst2);
      expect(memory.read(0x0201)).toBe(0x0002);
      expect(cpu.getRegister(4)).toBe(0x0202);

      executor.execute(inst3);
      expect(memory.read(0x0202)).toBe(0x0003);
      expect(cpu.getRegister(4)).toBe(0x0203);
    });
  });

  describe('MVI@/MVO@ Integration', () => {
    it('should correctly copy array from one location to another', () => {
      // Setup: Array at 0x0100-0x0103 with values
      memory.write(0x0100, 0x0001);
      memory.write(0x0101, 0x0002);
      memory.write(0x0102, 0x0003);
      memory.write(0x0103, 0x0004);

      cpu.setRegister(4, 0x0100); // Source pointer
      cpu.setRegister(5, 0x0200); // Destination pointer

      const mviInst: Instruction = {
        address: 0,
        opcode: Opcode.MVI_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 4 },
          { type: 'register', value: 1 },
        ],
        raw: 0,
        sdbd: false,
      };

      const mvoInst: Instruction = {
        address: 0,
        opcode: Opcode.MVO_AT,
        addressingMode: 'INDIRECT' as any,
        operands: [
          { type: 'register', value: 1 },
          { type: 'register', value: 5 },
        ],
        raw: 0,
        sdbd: false,
      };

      // Copy 4 values
      for (let i = 0; i < 4; i++) {
        executor.execute(mviInst); // Load from source
        executor.execute(mvoInst); // Store to destination
      }

      // Verify copy
      expect(memory.read(0x0200)).toBe(0x0001);
      expect(memory.read(0x0201)).toBe(0x0002);
      expect(memory.read(0x0202)).toBe(0x0003);
      expect(memory.read(0x0203)).toBe(0x0004);

      // Verify pointers advanced
      expect(cpu.getRegister(4)).toBe(0x0104);
      expect(cpu.getRegister(5)).toBe(0x0204);
    });
  });
});
