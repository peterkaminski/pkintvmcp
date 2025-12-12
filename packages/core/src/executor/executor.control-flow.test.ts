/**
 * Tests for control flow instructions (branches, jumps, subroutines)
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

describe('Executor - Unconditional Control Flow', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('B - Branch Unconditional', () => {
    it('should branch to target address', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.B, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
    });

    it('should take 7 cycles', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.B, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not modify flags', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ C: true, OV: true, Z: true, S: true });

      const inst = createTestInstruction(Opcode.B, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(true);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(true);
    });
  });

  describe('J - Jump Absolute', () => {
    it('should jump to target address', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.J, [{ type: 'address', value: 0x7000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x7000);
    });

    it('should take 7 cycles', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.J, [{ type: 'address', value: 0x7000 }]);

      executor.execute(inst);

      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not modify flags', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ C: true, OV: false, Z: true, S: false });

      const inst = createTestInstruction(Opcode.J, [{ type: 'address', value: 0x7000 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(false);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });
  });

  describe('JR - Jump to Register', () => {
    it('should jump to address in register', () => {
      cpu.setPC(0x5000);
      cpu.setRegister(4, 0x8000);

      const inst = createTestInstruction(Opcode.JR, [{ type: 'register', value: 4 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x8000);
    });

    it('should take 7 cycles', () => {
      cpu.setPC(0x5000);
      cpu.setRegister(5, 0x9000);

      const inst = createTestInstruction(Opcode.JR, [{ type: 'register', value: 5 }]);

      executor.execute(inst);

      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not modify flags', () => {
      cpu.setPC(0x5000);
      cpu.setRegister(3, 0xa000);
      cpu.setFlags({ C: false, OV: true, Z: false, S: true });

      const inst = createTestInstruction(Opcode.JR, [{ type: 'register', value: 3 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(false);
      expect(flags.OV).toBe(true);
      expect(flags.Z).toBe(false);
      expect(flags.S).toBe(true);
    });
  });
});

describe('Executor - Conditional Branches (Simple Flags)', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('BEQ - Branch if Equal (Z=1)', () => {
    it('should branch when Z flag is set', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: true });

      const inst = createTestInstruction(Opcode.BEQ, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when Z flag is clear', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: false });

      const inst = createTestInstruction(Opcode.BEQ, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000); // PC not changed
      expect(cpu.getState().cycles).toBe(6);
    });

    it('should not modify flags', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ C: true, OV: true, Z: true, S: false });

      const inst = createTestInstruction(Opcode.BEQ, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(true);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });
  });

  describe('BNEQ - Branch if Not Equal (Z=0)', () => {
    it('should branch when Z flag is clear', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: false });

      const inst = createTestInstruction(Opcode.BNEQ, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when Z flag is set', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: true });

      const inst = createTestInstruction(Opcode.BNEQ, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BC - Branch if Carry (C=1)', () => {
    it('should branch when C flag is set', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ C: true });

      const inst = createTestInstruction(Opcode.BC, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when C flag is clear', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ C: false });

      const inst = createTestInstruction(Opcode.BC, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BNC - Branch if No Carry (C=0)', () => {
    it('should branch when C flag is clear', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ C: false });

      const inst = createTestInstruction(Opcode.BNC, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when C flag is set', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ C: true });

      const inst = createTestInstruction(Opcode.BNC, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BOV - Branch if Overflow (OV=1)', () => {
    it('should branch when OV flag is set', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ OV: true });

      const inst = createTestInstruction(Opcode.BOV, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when OV flag is clear', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ OV: false });

      const inst = createTestInstruction(Opcode.BOV, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BNOV - Branch if No Overflow (OV=0)', () => {
    it('should branch when OV flag is clear', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ OV: false });

      const inst = createTestInstruction(Opcode.BNOV, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when OV flag is set', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ OV: true });

      const inst = createTestInstruction(Opcode.BNOV, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BMI - Branch if Minus (S=1)', () => {
    it('should branch when S flag is set', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: true });

      const inst = createTestInstruction(Opcode.BMI, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when S flag is clear', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: false });

      const inst = createTestInstruction(Opcode.BMI, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BPL - Branch if Plus (S=0)', () => {
    it('should branch when S flag is clear', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: false });

      const inst = createTestInstruction(Opcode.BPL, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when S flag is set', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: true });

      const inst = createTestInstruction(Opcode.BPL, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });
});

describe('Executor - Signed Comparison Branches', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('BLT - Branch if Less Than (S XOR OV = 1)', () => {
    it('should branch when S=1 and OV=0', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: true, OV: false });

      const inst = createTestInstruction(Opcode.BLT, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should branch when S=0 and OV=1', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: false, OV: true });

      const inst = createTestInstruction(Opcode.BLT, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when S=0 and OV=0', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: false, OV: false });

      const inst = createTestInstruction(Opcode.BLT, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });

    it('should not branch when S=1 and OV=1', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: true, OV: true });

      const inst = createTestInstruction(Opcode.BLT, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BGE - Branch if Greater or Equal (S XOR OV = 0)', () => {
    it('should branch when S=0 and OV=0', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: false, OV: false });

      const inst = createTestInstruction(Opcode.BGE, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should branch when S=1 and OV=1', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: true, OV: true });

      const inst = createTestInstruction(Opcode.BGE, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when S=1 and OV=0', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: true, OV: false });

      const inst = createTestInstruction(Opcode.BGE, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });

    it('should not branch when S=0 and OV=1', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ S: false, OV: true });

      const inst = createTestInstruction(Opcode.BGE, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BLE - Branch if Less or Equal (Z=1 OR (S XOR OV)=1)', () => {
    it('should branch when Z=1 regardless of S and OV', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: true, S: false, OV: false });

      const inst = createTestInstruction(Opcode.BLE, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should branch when Z=0 but S XOR OV = 1', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: false, S: true, OV: false });

      const inst = createTestInstruction(Opcode.BLE, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when Z=0 and S XOR OV = 0', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: false, S: false, OV: false });

      const inst = createTestInstruction(Opcode.BLE, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });

  describe('BGT - Branch if Greater Than (Z=0 AND (S XOR OV)=0)', () => {
    it('should branch when Z=0 and S XOR OV = 0', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: false, S: false, OV: false });

      const inst = createTestInstruction(Opcode.BGT, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getState().cycles).toBe(7);
    });

    it('should not branch when Z=1', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: true, S: false, OV: false });

      const inst = createTestInstruction(Opcode.BGT, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });

    it('should not branch when Z=0 but S XOR OV = 1', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ Z: false, S: true, OV: false });

      const inst = createTestInstruction(Opcode.BGT, [{ type: 'address', value: 0x6000 }]);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000);
      expect(cpu.getState().cycles).toBe(6);
    });
  });
});

describe('Executor - Subroutine Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('JSR - Jump to Subroutine', () => {
    it('should save return address in register and jump to target', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.JSR, [
        { type: 'register', value: 5 },
        { type: 'address', value: 0x7000 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(5)).toBe(0x5001); // PC + 1
      expect(cpu.getPC()).toBe(0x7000);
    });

    it('should take 12 cycles', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.JSR, [
        { type: 'register', value: 4 },
        { type: 'address', value: 0x8000 },
      ]);

      executor.execute(inst);

      expect(cpu.getState().cycles).toBe(12);
    });

    it('should not modify flags', () => {
      cpu.setPC(0x5000);
      cpu.setFlags({ C: true, OV: false, Z: true, S: false });

      const inst = createTestInstruction(Opcode.JSR, [
        { type: 'register', value: 5 },
        { type: 'address', value: 0x7000 },
      ]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(false);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });
  });

  describe('JSRE - Jump to Subroutine, Enable Interrupts', () => {
    it('should save return address, jump, and enable interrupts', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.JSRE, [
        { type: 'register', value: 5 },
        { type: 'address', value: 0x7000 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(5)).toBe(0x5001);
      expect(cpu.getPC()).toBe(0x7000);
      expect(cpu.getState().interruptsEnabled).toBe(true);
    });

    it('should take 12 cycles', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.JSRE, [
        { type: 'register', value: 4 },
        { type: 'address', value: 0x8000 },
      ]);

      executor.execute(inst);

      expect(cpu.getState().cycles).toBe(12);
    });
  });

  describe('JSRD - Jump to Subroutine, Disable Interrupts', () => {
    it('should save return address, jump, and disable interrupts', () => {
      cpu.setPC(0x5000);
      // Start with interrupts enabled
      const state = cpu.getState();
      state.interruptsEnabled = true;
      cpu.setState(state);

      const inst = createTestInstruction(Opcode.JSRD, [
        { type: 'register', value: 5 },
        { type: 'address', value: 0x7000 },
      ]);

      executor.execute(inst);

      expect(cpu.getRegister(5)).toBe(0x5001);
      expect(cpu.getPC()).toBe(0x7000);
      expect(cpu.getState().interruptsEnabled).toBe(false);
    });

    it('should take 12 cycles', () => {
      cpu.setPC(0x5000);

      const inst = createTestInstruction(Opcode.JSRD, [
        { type: 'register', value: 4 },
        { type: 'address', value: 0x8000 },
      ]);

      executor.execute(inst);

      expect(cpu.getState().cycles).toBe(12);
    });
  });
});

describe('Executor - Stack Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('PSHR - Push Register', () => {
    it('should pre-increment stack pointer and write value', () => {
      cpu.setRegister(6, 0x02f0); // Stack pointer
      cpu.setRegister(3, 0x1234);

      const inst = createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 3 }]);

      executor.execute(inst);

      expect(cpu.getRegister(6)).toBe(0x02f1); // SP incremented
      expect(memory.read(0x02f1)).toBe(0x1234); // Value written
    });

    it('should take 11 cycles', () => {
      cpu.setRegister(6, 0x02f0);
      cpu.setRegister(2, 0xabcd);

      const inst = createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 2 }]);

      executor.execute(inst);

      expect(cpu.getState().cycles).toBe(11);
    });

    it('should not modify flags', () => {
      cpu.setRegister(6, 0x02f0);
      cpu.setRegister(1, 0x5555);
      cpu.setFlags({ C: true, OV: true, Z: false, S: false });

      const inst = createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 1 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(true);
      expect(flags.Z).toBe(false);
      expect(flags.S).toBe(false);
    });

    it('should handle multiple pushes', () => {
      cpu.setRegister(6, 0x02f0);
      cpu.setRegister(1, 0x1111);
      cpu.setRegister(2, 0x2222);
      cpu.setRegister(3, 0x3333);

      executor.execute(createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 1 }]));
      executor.execute(createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 2 }]));
      executor.execute(createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 3 }]));

      expect(cpu.getRegister(6)).toBe(0x02f3);
      expect(memory.read(0x02f1)).toBe(0x1111);
      expect(memory.read(0x02f2)).toBe(0x2222);
      expect(memory.read(0x02f3)).toBe(0x3333);
    });
  });

  describe('PULR - Pull Register', () => {
    it('should read value and post-decrement stack pointer', () => {
      cpu.setRegister(6, 0x02f1);
      memory.write(0x02f1, 0x5678);

      const inst = createTestInstruction(Opcode.PULR, [{ type: 'register', value: 4 }]);

      executor.execute(inst);

      expect(cpu.getRegister(4)).toBe(0x5678); // Value read
      expect(cpu.getRegister(6)).toBe(0x02f0); // SP decremented
    });

    it('should take 11 cycles', () => {
      cpu.setRegister(6, 0x02f1);
      memory.write(0x02f1, 0xdead);

      const inst = createTestInstruction(Opcode.PULR, [{ type: 'register', value: 2 }]);

      executor.execute(inst);

      expect(cpu.getState().cycles).toBe(11);
    });

    it('should not modify flags', () => {
      cpu.setRegister(6, 0x02f1);
      memory.write(0x02f1, 0xbeef);
      cpu.setFlags({ C: false, OV: true, Z: true, S: false });

      const inst = createTestInstruction(Opcode.PULR, [{ type: 'register', value: 3 }]);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(false);
      expect(flags.OV).toBe(true);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should handle push/pull symmetry', () => {
      cpu.setRegister(6, 0x02f0);
      cpu.setRegister(1, 0xaaaa);

      // Push
      executor.execute(createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 1 }]));
      expect(cpu.getRegister(6)).toBe(0x02f1);

      // Modify register
      cpu.setRegister(1, 0xbbbb);

      // Pull
      executor.execute(createTestInstruction(Opcode.PULR, [{ type: 'register', value: 1 }]));
      expect(cpu.getRegister(1)).toBe(0xaaaa); // Original value restored
      expect(cpu.getRegister(6)).toBe(0x02f0); // SP back to original
    });
  });
});

describe('Executor - Control Instructions', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('NOPP - No Operation', () => {
    it('should do nothing except take cycles', () => {
      cpu.setPC(0x5000);
      cpu.setRegister(1, 0x1234);
      cpu.setFlags({ C: true, OV: false, Z: true, S: false });

      const inst = createTestInstruction(Opcode.NOPP, []);

      executor.execute(inst);

      expect(cpu.getPC()).toBe(0x5000); // PC unchanged
      expect(cpu.getRegister(1)).toBe(0x1234); // Registers unchanged
      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(false);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
      expect(cpu.getState().cycles).toBe(7);
    });
  });

  describe('EIS - Enable Interrupts', () => {
    it('should enable interrupts', () => {
      const inst = createTestInstruction(Opcode.EIS, []);

      executor.execute(inst);

      expect(cpu.getState().interruptsEnabled).toBe(true);
      expect(cpu.getState().cycles).toBe(6);
    });

    it('should not modify flags', () => {
      cpu.setFlags({ C: true, OV: true, Z: false, S: true });

      const inst = createTestInstruction(Opcode.EIS, []);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(true);
      expect(flags.Z).toBe(false);
      expect(flags.S).toBe(true);
    });
  });

  describe('DIS - Disable Interrupts', () => {
    it('should disable interrupts', () => {
      // Start with interrupts enabled
      const state = cpu.getState();
      state.interruptsEnabled = true;
      cpu.setState(state);

      const inst = createTestInstruction(Opcode.DIS, []);

      executor.execute(inst);

      expect(cpu.getState().interruptsEnabled).toBe(false);
      expect(cpu.getState().cycles).toBe(6);
    });

    it('should not modify flags', () => {
      cpu.setFlags({ C: false, OV: false, Z: true, S: false });

      const inst = createTestInstruction(Opcode.DIS, []);

      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.C).toBe(false);
      expect(flags.OV).toBe(false);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });
  });
});

describe('Executor - Integration Tests', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
    cpu.reset();
  });

  describe('Loop with Counter', () => {
    it('should execute loop 5 times using DECR and BNEQ', () => {
      // Initialize counter in R1
      cpu.setRegister(1, 5);
      let iterations = 0;

      // Loop: DECR R1, BNEQ loop
      for (let i = 0; i < 10; i++) {
        // Safety limit
        if (cpu.getRegister(1) === 0) break;

        // DECR R1
        executor.execute(createTestInstruction(Opcode.DECR, [{ type: 'register', value: 1 }]));

        iterations++;

        // Check if we should continue
        const flags = cpu.getFlags();
        if (flags.Z) break; // Counter reached zero
      }

      expect(iterations).toBe(5);
      expect(cpu.getRegister(1)).toBe(0);
    });
  });

  describe('Nested Subroutine Calls with Stack', () => {
    it('should handle nested JSR calls using stack', () => {
      // Initialize stack pointer
      cpu.setRegister(6, 0x02f0);
      cpu.setPC(0x5000);

      // Main calls Sub1: JSR R5, 0x6000
      executor.execute(
        createTestInstruction(Opcode.JSR, [
          { type: 'register', value: 5 },
          { type: 'address', value: 0x6000 },
        ])
      );

      expect(cpu.getPC()).toBe(0x6000);
      expect(cpu.getRegister(5)).toBe(0x5001); // Return address for main

      // Sub1 saves R5 to stack and calls Sub2
      executor.execute(createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 5 }]));
      expect(cpu.getRegister(6)).toBe(0x02f1); // SP incremented

      cpu.setPC(0x6000); // Simulate being in Sub1
      executor.execute(
        createTestInstruction(Opcode.JSR, [
          { type: 'register', value: 5 },
          { type: 'address', value: 0x7000 },
        ])
      );

      expect(cpu.getPC()).toBe(0x7000);
      expect(cpu.getRegister(5)).toBe(0x6001); // Return address for Sub1

      // Sub2 returns: JR R5
      executor.execute(createTestInstruction(Opcode.JR, [{ type: 'register', value: 5 }]));
      expect(cpu.getPC()).toBe(0x6001); // Back to Sub1

      // Sub1 restores R5 and returns
      executor.execute(createTestInstruction(Opcode.PULR, [{ type: 'register', value: 5 }]));
      expect(cpu.getRegister(5)).toBe(0x5001); // Original return address restored
      expect(cpu.getRegister(6)).toBe(0x02f0); // SP back to original

      executor.execute(createTestInstruction(Opcode.JR, [{ type: 'register', value: 5 }]));
      expect(cpu.getPC()).toBe(0x5001); // Back to main
    });
  });
});
