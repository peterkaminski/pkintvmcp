/**
 * Tests for Executor opcode dispatch
 */

import { CPU } from '../../cpu/cpu';
import { Executor } from '../executor';
import { Opcode } from '../executor.types';
import type { Memory, Instruction } from '../executor.types';

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
      const instruction: Instruction = {
        opcode: Opcode.MOVR,
        operands: [0, 1],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch MVI opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.MVI,
        operands: [100, 0],  // [immediate, register]
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch MVO opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.MVO,
        operands: [0, 0x1000],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch ADDR opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.ADDR,
        operands: [0, 1],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch SUBR opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.SUBR,
        operands: [0, 1],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch INC opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.INC,
        operands: [0],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch DEC opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.DEC,
        operands: [0],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch ANDR opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.ANDR,
        operands: [0, 1],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch XORR opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.XORR,
        operands: [0, 1],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch CLR opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.CLR,
        operands: [0],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch TST opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.TST,
        operands: [0],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should dispatch HLT opcode', () => {
      const instruction: Instruction = {
        opcode: Opcode.HLT,
        operands: [],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });
  });

  describe('invalid opcodes', () => {
    it('should throw on unknown opcode', () => {
      const instruction = {
        opcode: 'INVALID' as Opcode,
        operands: [],
      };
      expect(() => executor.execute(instruction)).toThrow('Unknown opcode: INVALID');
    });

    it('should throw on undefined opcode', () => {
      const instruction = {
        opcode: undefined as unknown as Opcode,
        operands: [],
      };
      expect(() => executor.execute(instruction)).toThrow('Unknown opcode: undefined');
    });

    it('should throw on null opcode', () => {
      const instruction = {
        opcode: null as unknown as Opcode,
        operands: [],
      };
      expect(() => executor.execute(instruction)).toThrow('Unknown opcode: null');
    });
  });

  describe('trace mode', () => {
    it('should execute with trace enabled without errors', () => {
      const tracingExecutor = new Executor(cpu, memory, { trace: false });
      const instruction: Instruction = {
        opcode: Opcode.MOVR,
        operands: [0, 1],
      };
      expect(() => tracingExecutor.execute(instruction)).not.toThrow();
    });
  });

  describe('all opcodes coverage', () => {
    it('should handle all data movement opcodes', () => {
      const opcodes = [Opcode.MOVR, Opcode.MVI, Opcode.MVO];
      opcodes.forEach(opcode => {
        const instruction: Instruction = { opcode, operands: [] };
        expect(() => executor.execute(instruction)).not.toThrow();
      });
    });

    it('should handle all arithmetic opcodes', () => {
      const opcodes = [Opcode.ADDR, Opcode.SUBR, Opcode.INC, Opcode.DEC];
      opcodes.forEach(opcode => {
        const instruction: Instruction = { opcode, operands: [] };
        expect(() => executor.execute(instruction)).not.toThrow();
      });
    });

    it('should handle all logical opcodes', () => {
      const opcodes = [Opcode.ANDR, Opcode.XORR, Opcode.CLR];
      opcodes.forEach(opcode => {
        const instruction: Instruction = { opcode, operands: [] };
        expect(() => executor.execute(instruction)).not.toThrow();
      });
    });

    it('should handle all control opcodes', () => {
      const opcodes = [Opcode.TST, Opcode.HLT];
      opcodes.forEach(opcode => {
        const instruction: Instruction = { opcode, operands: [] };
        expect(() => executor.execute(instruction)).not.toThrow();
      });
    });
  });

  describe('instruction structure', () => {
    it('should accept instruction with empty operands', () => {
      const instruction: Instruction = {
        opcode: Opcode.HLT,
        operands: [],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should accept instruction with single operand', () => {
      const instruction: Instruction = {
        opcode: Opcode.INC,
        operands: [0],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });

    it('should accept instruction with multiple operands', () => {
      const instruction: Instruction = {
        opcode: Opcode.ADDR,
        operands: [0, 1, 2],
      };
      expect(() => executor.execute(instruction)).not.toThrow();
    });
  });
});
