/**
 * Tests for CPU class
 */

import { CPU } from '../cpu';
import type { CPUState } from '../cpu.types';

describe('CPU', () => {
  let cpu: CPU;

  beforeEach(() => {
    cpu = new CPU();
  });

  describe('constructor', () => {
    it('should initialize with 8 registers set to 0', () => {
      for (let i = 0; i < 8; i++) {
        expect(cpu.getRegister(i)).toBe(0);
      }
    });

    it('should initialize flags to false', () => {
      const flags = cpu.getFlags();
      expect(flags.C).toBe(false);
      expect(flags.OV).toBe(false);
      expect(flags.Z).toBe(false);
      expect(flags.S).toBe(false);
    });

    it('should initialize cycles to 0', () => {
      expect(cpu.getCycles()).toBe(0);
    });

    it('should initialize PC (R7) to 0', () => {
      expect(cpu.getPC()).toBe(0);
    });
  });

  describe('getRegister / setRegister', () => {
    it('should get and set register values', () => {
      cpu.setRegister(0, 100);
      expect(cpu.getRegister(0)).toBe(100);

      cpu.setRegister(5, 0xABCD);
      expect(cpu.getRegister(5)).toBe(0xABCD);
    });

    it('should throw on invalid register index < 0', () => {
      expect(() => cpu.getRegister(-1)).toThrow('Invalid register index: -1');
      expect(() => cpu.setRegister(-1, 100)).toThrow('Invalid register index: -1');
    });

    it('should throw on invalid register index > 7', () => {
      expect(() => cpu.getRegister(8)).toThrow('Invalid register index: 8');
      expect(() => cpu.setRegister(8, 100)).toThrow('Invalid register index: 8');
    });

    it('should wrap values to 16-bit via toUint16', () => {
      cpu.setRegister(0, 0x10000);
      expect(cpu.getRegister(0)).toBe(0x0000);

      cpu.setRegister(1, 0x10001);
      expect(cpu.getRegister(1)).toBe(0x0001);

      cpu.setRegister(2, 0xFFFF + 1);
      expect(cpu.getRegister(2)).toBe(0x0000);

      cpu.setRegister(3, 0x1ABCD);
      expect(cpu.getRegister(3)).toBe(0xABCD);
    });
  });

  describe('PC operations', () => {
    it('should get and set PC (R7)', () => {
      cpu.setPC(0x1234);
      expect(cpu.getPC()).toBe(0x1234);
      expect(cpu.getRegister(7)).toBe(0x1234);
    });

    it('should wrap PC to 16-bit', () => {
      cpu.setPC(0x10000);
      expect(cpu.getPC()).toBe(0x0000);
    });

    it('should increment PC correctly', () => {
      cpu.setPC(0x0000);
      cpu.incrementPC();
      expect(cpu.getPC()).toBe(0x0001);

      cpu.setPC(0x1234);
      cpu.incrementPC();
      expect(cpu.getPC()).toBe(0x1235);
    });

    it('should wrap PC from 0xFFFF to 0x0000 on increment', () => {
      cpu.setPC(0xFFFF);
      cpu.incrementPC();
      expect(cpu.getPC()).toBe(0x0000);
    });
  });

  describe('flags operations', () => {
    it('should get a copy of flags', () => {
      const flags = cpu.getFlags();
      expect(flags).toEqual({
        C: false,
        OV: false,
        Z: false,
        S: false,
      });
    });

    it('should set flags using partial update', () => {
      cpu.setFlags({ C: true, Z: true });
      const flags = cpu.getFlags();
      expect(flags.C).toBe(true);
      expect(flags.OV).toBe(false);
      expect(flags.Z).toBe(true);
      expect(flags.S).toBe(false);
    });

    it('should update individual flags independently', () => {
      cpu.setFlags({ C: true });
      expect(cpu.getFlags().C).toBe(true);
      expect(cpu.getFlags().OV).toBe(false);

      cpu.setFlags({ OV: true });
      expect(cpu.getFlags().C).toBe(true);
      expect(cpu.getFlags().OV).toBe(true);
    });

    it('should return a copy of flags (not a reference)', () => {
      const flags1 = cpu.getFlags();
      flags1.C = true;
      const flags2 = cpu.getFlags();
      expect(flags2.C).toBe(false); // Original unchanged
    });
  });

  describe('reset', () => {
    it('should reset all registers to 0', () => {
      cpu.setRegister(0, 100);
      cpu.setRegister(5, 200);
      cpu.setPC(0x1234);

      cpu.reset();

      for (let i = 0; i < 8; i++) {
        expect(cpu.getRegister(i)).toBe(0);
      }
    });

    it('should reset all flags to false', () => {
      cpu.setFlags({ C: true, OV: true, Z: true, S: true });

      cpu.reset();

      const flags = cpu.getFlags();
      expect(flags.C).toBe(false);
      expect(flags.OV).toBe(false);
      expect(flags.Z).toBe(false);
      expect(flags.S).toBe(false);
    });

    it('should reset cycles to 0', () => {
      cpu.addCycles(100);
      expect(cpu.getCycles()).toBe(100);

      cpu.reset();

      expect(cpu.getCycles()).toBe(0);
    });

    it('should reset halted and sdbd to false', () => {
      const state = cpu.getState();
      state.halted = true;
      state.sdbd = true;
      cpu.setState(state);

      cpu.reset();

      const newState = cpu.getState();
      expect(newState.halted).toBe(false);
      expect(newState.sdbd).toBe(false);
    });
  });

  describe('cycles operations', () => {
    it('should add cycles correctly', () => {
      expect(cpu.getCycles()).toBe(0);

      cpu.addCycles(10);
      expect(cpu.getCycles()).toBe(10);

      cpu.addCycles(5);
      expect(cpu.getCycles()).toBe(15);
    });

    it('should handle negative cycle additions', () => {
      cpu.addCycles(100);
      cpu.addCycles(-50);
      expect(cpu.getCycles()).toBe(50);
    });
  });

  describe('state operations', () => {
    it('should get a complete state snapshot', () => {
      cpu.setRegister(0, 100);
      cpu.setRegister(7, 0x1234);
      cpu.setFlags({ C: true, Z: true });
      cpu.addCycles(50);

      const state = cpu.getState();

      expect(state.registers[0]).toBe(100);
      expect(state.registers[7]).toBe(0x1234);
      expect(state.flags.C).toBe(true);
      expect(state.flags.Z).toBe(true);
      expect(state.cycles).toBe(50);
      expect(state.halted).toBe(false);
      expect(state.sdbd).toBe(false);
    });

    it('should return a deep copy of state (mutating snapshot does not affect CPU)', () => {
      cpu.setRegister(0, 100);
      cpu.setFlags({ C: true });

      const state = cpu.getState();

      // Mutate the snapshot
      state.registers[0] = 999;
      state.flags.C = false;
      state.cycles = 1000;

      // Verify CPU is unchanged
      expect(cpu.getRegister(0)).toBe(100);
      expect(cpu.getFlags().C).toBe(true);
      expect(cpu.getCycles()).toBe(0);
    });

    it('should load state from a snapshot', () => {
      const state: CPUState = {
        registers: new Uint16Array([1, 2, 3, 4, 5, 6, 7, 0x8888]),
        flags: {
          C: true,
          OV: false,
          Z: true,
          S: false,
        },
        cycles: 42,
        halted: true,
        sdbd: true,
      };

      cpu.setState(state);

      expect(cpu.getRegister(0)).toBe(1);
      expect(cpu.getRegister(7)).toBe(0x8888);
      expect(cpu.getFlags().C).toBe(true);
      expect(cpu.getFlags().Z).toBe(true);
      expect(cpu.getCycles()).toBe(42);

      const loadedState = cpu.getState();
      expect(loadedState.halted).toBe(true);
      expect(loadedState.sdbd).toBe(true);
    });

    it('should perform deep copy on setState (mutating source does not affect CPU)', () => {
      const state: CPUState = {
        registers: new Uint16Array([100, 0, 0, 0, 0, 0, 0, 0]),
        flags: {
          C: true,
          OV: false,
          Z: false,
          S: false,
        },
        cycles: 10,
        halted: false,
        sdbd: false,
      };

      cpu.setState(state);

      // Mutate the source state
      state.registers[0] = 999;
      state.flags.C = false;

      // Verify CPU is unchanged
      expect(cpu.getRegister(0)).toBe(100);
      expect(cpu.getFlags().C).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should handle a complete execution cycle', () => {
      cpu.setPC(0x1000);
      cpu.setRegister(0, 0x1234);
      cpu.setRegister(1, 0x5678);
      cpu.setFlags({ Z: true });
      cpu.addCycles(4);

      const state = cpu.getState();
      expect(state.registers[7]).toBe(0x1000);
      expect(state.registers[0]).toBe(0x1234);
      expect(state.flags.Z).toBe(true);
      expect(state.cycles).toBe(4);

      cpu.incrementPC();
      cpu.addCycles(2);

      expect(cpu.getPC()).toBe(0x1001);
      expect(cpu.getCycles()).toBe(6);
    });

    it('should maintain state independence across reset', () => {
      cpu.setRegister(3, 0xABCD);
      const stateBefore = cpu.getState();

      cpu.reset();

      const stateAfter = cpu.getState();
      expect(stateAfter.registers[3]).toBe(0);
      expect(stateBefore.registers[3]).toBe(0xABCD); // Snapshot unchanged
    });
  });
});
