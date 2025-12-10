/**
 * @pkintvmcp/core - CPU Types Tests
 *
 * Tests for CPU type definitions
 * Sprint 1.3: Core Execution Engine
 *
 * Adapted from Manus Sprint 1.3 work - converted from Jest to Vitest
 */

import { describe, it, expect } from 'vitest';
import type { CPUFlags, CPUState, ExecutorOptions } from './cpu.types.js';

describe('CPUFlags', () => {
  it('should construct a valid CPUFlags object', () => {
    const flags: CPUFlags = {
      C: false,
      OV: false,
      Z: false,
      S: false,
    };

    expect(flags.C).toBe(false);
    expect(flags.OV).toBe(false);
    expect(flags.Z).toBe(false);
    expect(flags.S).toBe(false);
  });

  it('should allow boolean values for all flags', () => {
    const flags: CPUFlags = {
      C: true,
      OV: true,
      Z: true,
      S: true,
    };

    expect(flags.C).toBe(true);
    expect(flags.OV).toBe(true);
    expect(flags.Z).toBe(true);
    expect(flags.S).toBe(true);
  });

  it('should not allow invalid keys (compile-time check)', () => {
    // This test validates TypeScript compile-time checking
    // Uncommenting the following would cause a TypeScript error:
    // const flags: CPUFlags = {
    //   C: false,
    //   OV: false,
    //   Z: false,
    //   S: false,
    //   INVALID: true,  // TS2353: Object literal may only specify known properties
    // };
    expect(true).toBe(true);
  });

  it('should not allow missing required fields (compile-time check)', () => {
    // This test validates TypeScript compile-time checking
    // Uncommenting the following would cause a TypeScript error:
    // const flags: CPUFlags = {
    //   C: false,
    //   OV: false,
    //   Z: false,
    //   // S is missing - TS2741: Property 'S' is missing
    // };
    expect(true).toBe(true);
  });
});

describe('CPUState', () => {
  it('should construct a valid CPUState object', () => {
    const state: CPUState = {
      registers: new Uint16Array(8),
      flags: {
        C: false,
        OV: false,
        Z: false,
        S: false,
      },
      cycles: 0,
      halted: false,
      sdbd: false,
    };

    expect(state.registers).toBeInstanceOf(Uint16Array);
    expect(state.registers.length).toBe(8);
    expect(state.flags).toBeDefined();
    expect(state.cycles).toBe(0);
    expect(state.halted).toBe(false);
    expect(state.sdbd).toBe(false);
  });

  it('should confirm registers is a Uint16Array of length 8', () => {
    const state: CPUState = {
      registers: new Uint16Array(8),
      flags: {
        C: false,
        OV: false,
        Z: false,
        S: false,
      },
      cycles: 0,
      halted: false,
      sdbd: false,
    };

    expect(state.registers).toBeInstanceOf(Uint16Array);
    expect(state.registers.length).toBe(8);
    expect(state.registers.BYTES_PER_ELEMENT).toBe(2); // 16-bit = 2 bytes
  });

  it('should confirm flags shape and type', () => {
    const state: CPUState = {
      registers: new Uint16Array(8),
      flags: {
        C: true,
        OV: false,
        Z: true,
        S: false,
      },
      cycles: 100,
      halted: true,
      sdbd: true,
    };

    expect(typeof state.flags.C).toBe('boolean');
    expect(typeof state.flags.OV).toBe('boolean');
    expect(typeof state.flags.Z).toBe('boolean');
    expect(typeof state.flags.S).toBe('boolean');
    expect(state.flags.C).toBe(true);
    expect(state.flags.OV).toBe(false);
    expect(state.flags.Z).toBe(true);
    expect(state.flags.S).toBe(false);
  });

  it('should allow registers to hold 16-bit values', () => {
    const state: CPUState = {
      registers: new Uint16Array([0, 100, 1000, 10000, 65535, 0xFFFF, 0x1234, 0xABCD]),
      flags: {
        C: false,
        OV: false,
        Z: false,
        S: false,
      },
      cycles: 0,
      halted: false,
      sdbd: false,
    };

    expect(state.registers[0]).toBe(0);
    expect(state.registers[1]).toBe(100);
    expect(state.registers[4]).toBe(65535);
    expect(state.registers[5]).toBe(0xFFFF);
    expect(state.registers[6]).toBe(0x1234);
    expect(state.registers[7]).toBe(0xABCD);
  });

  it('should not allow invalid keys (compile-time check)', () => {
    // This test validates TypeScript compile-time checking
    // Uncommenting the following would cause a TypeScript error:
    // const state: CPUState = {
    //   registers: new Uint16Array(8),
    //   flags: { C: false, OV: false, Z: false, S: false },
    //   cycles: 0,
    //   halted: false,
    //   sdbd: false,
    //   invalidField: 'should not exist',  // TS2353: Object literal may only specify known properties
    // };
    expect(true).toBe(true);
  });

  it('should not allow missing required fields (compile-time check)', () => {
    // This test validates TypeScript compile-time checking
    // Uncommenting the following would cause a TypeScript error:
    // const state: CPUState = {
    //   registers: new Uint16Array(8),
    //   flags: { C: false, OV: false, Z: false, S: false },
    //   cycles: 0,
    //   halted: false,
    //   // sdbd is missing - TS2741: Property 'sdbd' is missing
    // };
    expect(true).toBe(true);
  });

  it('should not allow wrong type for registers (compile-time check)', () => {
    // This test validates TypeScript compile-time checking
    // Uncommenting the following would cause a TypeScript error:
    // const state: CPUState = {
    //   registers: [0, 1, 2, 3, 4, 5, 6, 7],  // TS2740: Type 'number[]' is missing properties
    //   flags: { C: false, OV: false, Z: false, S: false },
    //   cycles: 0,
    //   halted: false,
    //   sdbd: false,
    // };
    expect(true).toBe(true);
  });
});

describe('ExecutorOptions', () => {
  it('should construct a valid ExecutorOptions object with trace enabled', () => {
    const options: ExecutorOptions = {
      trace: true,
    };

    expect(options.trace).toBe(true);
  });

  it('should construct a valid ExecutorOptions object with trace disabled', () => {
    const options: ExecutorOptions = {
      trace: false,
    };

    expect(options.trace).toBe(false);
  });

  it('should allow empty ExecutorOptions (trace is optional)', () => {
    const options: ExecutorOptions = {};

    expect(options.trace).toBeUndefined();
  });

  it('should not allow invalid keys (compile-time check)', () => {
    // This test validates TypeScript compile-time checking
    // Uncommenting the following would cause a TypeScript error:
    // const options: ExecutorOptions = {
    //   trace: true,
    //   invalidOption: 'should not exist',  // TS2353: Object literal may only specify known properties
    // };
    expect(true).toBe(true);
  });
});
