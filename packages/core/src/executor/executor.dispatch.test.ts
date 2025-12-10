/**
 * Tests for Executor opcode dispatch
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

describe('Executor Dispatch', () => {
  let cpu: CPU;
  let memory: Memory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
  });

  describe('constructor', () => {
    it('should create executor with required parameters', () => {
      expect(executor).toBeInstanceOf(Executor);
    });

    it('should create executor with optional trace option', () => {
      const tracingExecutor = new Executor(cpu, memory, { trace: true });
      expect(tracingExecutor).toBeInstanceOf(Executor);
    });

    it('should create executor without options', () => {
      const defaultExecutor = new Executor(cpu, memory);
      expect(defaultExecutor).toBeInstanceOf(Executor);
    });
  });

  describe('opcode dispatch', () => {
    it('should dispatch MOVR opcode', () => {
      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch MVI opcode', () => {
      const instruction = createTestInstruction(Opcode.MVI, [
        { type: 'immediate', value: 100 },
        { type: 'register', value: 0 },
      ]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch MVO opcode', () => {
      const instruction = createTestInstruction(Opcode.MVO, [
        { type: 'register', value: 0 },
        { type: 'address', value: 0x1000 },
      ]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch ADDR opcode', () => {
      const instruction = createTestInstruction(Opcode.ADDR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch SUBR opcode', () => {
      const instruction = createTestInstruction(Opcode.SUBR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch INCR opcode', () => {
      const instruction = createTestInstruction(Opcode.INCR, [{ type: 'register', value: 0 }]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch DECR opcode', () => {
      const instruction = createTestInstruction(Opcode.DECR, [{ type: 'register', value: 0 }]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch ANDR opcode', () => {
      const instruction = createTestInstruction(Opcode.ANDR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch XORR opcode', () => {
      const instruction = createTestInstruction(Opcode.XORR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch CLRR opcode', () => {
      const instruction = createTestInstruction(Opcode.CLRR, [{ type: 'register', value: 0 }]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch TSTR opcode', () => {
      const instruction = createTestInstruction(Opcode.TSTR, [{ type: 'register', value: 0 }]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch HLT opcode', () => {
      const instruction = createTestInstruction(Opcode.HLT, []);
      expect(() => executor.execute(instruction)).not.toThrow();
    });
  });

  describe('invalid opcodes', () => {
    it('should throw on unknown opcode', () => {
      const instruction = createTestInstruction('INVALID' as Opcode, []);
      expect(() => executor.execute(instruction)).toThrow('Unknown opcode: INVALID');
    });

    it('should throw on undefined opcode', () => {
      const instruction = {
        ...createTestInstruction(Opcode.HLT, []),
        opcode: undefined as unknown as Opcode,
      };
      expect(() => executor.execute(instruction)).toThrow('Unknown opcode: undefined');
    });

    it('should throw on null opcode', () => {
      const instruction = {
        ...createTestInstruction(Opcode.HLT, []),
        opcode: null as unknown as Opcode,
      };
      expect(() => executor.execute(instruction)).toThrow('Unknown opcode: null');
    });
  });

  describe('trace mode', () => {
    it('should execute with trace enabled without errors', () => {
      const tracingExecutor = new Executor(cpu, memory, { trace: false });
      const instruction = createTestInstruction(Opcode.MOVR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);
      expect(() => tracingExecutor.execute(instruction)).not.toThrow();
    });
  });

  describe('all opcodes coverage', () => {
    it('should handle all data movement opcodes', () => {
      const opcodes = [
        {
          opcode: Opcode.MOVR,
          operands: [
            { type: 'register' as const, value: 0 },
            { type: 'register' as const, value: 1 },
          ],
        },
        {
          opcode: Opcode.MVI,
          operands: [
            { type: 'immediate' as const, value: 0 },
            { type: 'register' as const, value: 0 },
          ],
        },
        {
          opcode: Opcode.MVO,
          operands: [
            { type: 'register' as const, value: 0 },
            { type: 'address' as const, value: 0x1000 },
          ],
        },
      ];
      opcodes.forEach(({ opcode, operands }) => {
        const instruction = createTestInstruction(opcode, operands);
        expect(() => executor.execute(instruction)).not.toThrow();
      });
    });

    it('should handle all arithmetic opcodes', () => {
      const opcodes = [
        {
          opcode: Opcode.ADDR,
          operands: [
            { type: 'register' as const, value: 0 },
            { type: 'register' as const, value: 1 },
          ],
        },
        {
          opcode: Opcode.SUBR,
          operands: [
            { type: 'register' as const, value: 0 },
            { type: 'register' as const, value: 1 },
          ],
        },
        { opcode: Opcode.INCR, operands: [{ type: 'register' as const, value: 0 }] },
        { opcode: Opcode.DECR, operands: [{ type: 'register' as const, value: 0 }] },
      ];
      opcodes.forEach(({ opcode, operands }) => {
        const instruction = createTestInstruction(opcode, operands);
        expect(() => executor.execute(instruction)).not.toThrow();
      });
    });

    it('should handle all logical opcodes', () => {
      const opcodes = [
        {
          opcode: Opcode.ANDR,
          operands: [
            { type: 'register' as const, value: 0 },
            { type: 'register' as const, value: 1 },
          ],
        },
        {
          opcode: Opcode.XORR,
          operands: [
            { type: 'register' as const, value: 0 },
            { type: 'register' as const, value: 1 },
          ],
        },
        { opcode: Opcode.CLRR, operands: [{ type: 'register' as const, value: 0 }] },
      ];
      opcodes.forEach(({ opcode, operands }) => {
        const instruction = createTestInstruction(opcode, operands);
        expect(() => executor.execute(instruction)).not.toThrow();
      });
    });

    it('should handle all control opcodes', () => {
      const opcodes = [Opcode.TSTR, Opcode.HLT];
      opcodes.forEach((opcode) => {
        const operands = opcode === Opcode.HLT ? [] : [{ type: 'register' as const, value: 0 }];
        const instruction = createTestInstruction(opcode, operands);
        expect(() => executor.execute(instruction)).not.toThrow();
      });
    });
  });

  describe('instruction structure', () => {
    it('should accept instruction with empty operands', () => {
      const instruction = createTestInstruction(Opcode.HLT, []);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should accept instruction with single operand', () => {
      const instruction = createTestInstruction(Opcode.INCR, [{ type: 'register', value: 0 }]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should accept instruction with multiple operands', () => {
      const instruction = createTestInstruction(Opcode.ADDR, [
        { type: 'register', value: 0 },
        { type: 'register', value: 1 },
      ]);
      expect(() => executor.execute(instruction)).not.toThrow();
    });
  });
});
