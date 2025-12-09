/**
 * @pkintvmcp/core - Memory Tests
 *
 * Unit tests for Memory class
 * Sprint 1.2: Basic functionality tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Memory } from './memory.js';

describe('Memory', () => {
  let memory: Memory;

  beforeEach(() => {
    memory = new Memory();
  });

  describe('constructor', () => {
    test('creates memory with default size (64K words)', () => {
      expect(memory.getSize()).toBe(65536);
    });

    test('creates memory with custom size', () => {
      const customMemory = new Memory({ size: 8192 });
      expect(customMemory.getSize()).toBe(8192);
    });
  });

  describe('read/write', () => {
    test('reads zero from uninitialized memory', () => {
      expect(memory.read(0x5000)).toBe(0);
    });

    test('writes and reads a value', () => {
      memory.write(0x5000, 0x1234);
      expect(memory.read(0x5000)).toBe(0x1234);
    });

    test('writes and reads maximum value (0xFFFF)', () => {
      memory.write(0x1000, 0xFFFF);
      expect(memory.read(0x1000)).toBe(0xFFFF);
    });

    test('writes and reads zero', () => {
      memory.write(0x2000, 0x1234);
      memory.write(0x2000, 0x0000);
      expect(memory.read(0x2000)).toBe(0x0000);
    });

    test('masks address to 16 bits', () => {
      memory.write(0x10000, 0x4242); // Wraps to 0x0000
      expect(memory.read(0x0000)).toBe(0x4242);
    });

    test('masks value to 16 bits', () => {
      memory.write(0x3000, 0x1FFFF); // Masks to 0xFFFF
      expect(memory.read(0x3000)).toBe(0xFFFF);
    });

    test('handles negative addresses (wraps)', () => {
      memory.write(-1, 0xABCD); // Wraps to 0xFFFF
      expect(memory.read(0xFFFF)).toBe(0xABCD);
    });
  });

  describe('load', () => {
    test('loads array of words into memory', () => {
      const data = [0x1111, 0x2222, 0x3333];
      memory.load(0x5000, data);

      expect(memory.read(0x5000)).toBe(0x1111);
      expect(memory.read(0x5001)).toBe(0x2222);
      expect(memory.read(0x5002)).toBe(0x3333);
    });

    test('loads empty array without error', () => {
      expect(() => memory.load(0x1000, [])).not.toThrow();
    });
  });

  describe('loadBuffer', () => {
    test('loads Uint16Array into memory', () => {
      const buffer = new Uint16Array([0xAAAA, 0xBBBB, 0xCCCC]);
      memory.loadBuffer(0x6000, buffer);

      expect(memory.read(0x6000)).toBe(0xAAAA);
      expect(memory.read(0x6001)).toBe(0xBBBB);
      expect(memory.read(0x6002)).toBe(0xCCCC);
    });
  });

  describe('clear', () => {
    test('clears all memory to zero', () => {
      memory.write(0x1000, 0xFFFF);
      memory.write(0x2000, 0xAAAA);
      memory.clear();

      expect(memory.read(0x1000)).toBe(0);
      expect(memory.read(0x2000)).toBe(0);
    });
  });

  describe('clearRange', () => {
    test('clears specified range to zero', () => {
      memory.write(0x1000, 0x1111);
      memory.write(0x1001, 0x2222);
      memory.write(0x1002, 0x3333);
      memory.write(0x1003, 0x4444);

      memory.clearRange(0x1001, 0x1002);

      expect(memory.read(0x1000)).toBe(0x1111); // Untouched
      expect(memory.read(0x1001)).toBe(0);      // Cleared
      expect(memory.read(0x1002)).toBe(0);      // Cleared
      expect(memory.read(0x1003)).toBe(0x4444); // Untouched
    });
  });

  describe('readRange', () => {
    test('reads multiple words', () => {
      memory.load(0x5000, [0x10, 0x20, 0x30, 0x40]);
      const range = memory.readRange(0x5000, 4);

      expect(range).toEqual([0x10, 0x20, 0x30, 0x40]);
    });

    test('reads empty range', () => {
      const range = memory.readRange(0x1000, 0);
      expect(range).toEqual([]);
    });
  });

  describe('dump', () => {
    test('returns formatted memory dump', () => {
      memory.load(0x5000, [0x1234, 0x5678, 0xABCD, 0xEF00]);
      const dump = memory.dump(0x5000, 4);

      expect(dump).toContain('$5000:');
      expect(dump).toContain('1234');
      expect(dump).toContain('5678');
      expect(dump).toContain('ABCD');
      expect(dump).toContain('EF00');
    });
  });

  describe('bounds checking', () => {
    test('throws error when reading beyond memory size', () => {
      const smallMemory = new Memory({ size: 1024, boundsCheck: true });
      expect(() => smallMemory.read(1024)).toThrow(/out of bounds/);
    });

    test('throws error when writing beyond memory size', () => {
      const smallMemory = new Memory({ size: 1024, boundsCheck: true });
      expect(() => smallMemory.write(1024, 0x1234)).toThrow(/out of bounds/);
    });

    test('allows disabling bounds checking', () => {
      const uncheckedMemory = new Memory({ size: 1024, boundsCheck: false });
      // This would throw if bounds checking was enabled
      // With boundsCheck: false, it just accesses the underlying TypedArray
      // which will return 0 or wrap depending on implementation
      expect(() => uncheckedMemory.read(1024)).not.toThrow();
    });
  });

  describe('CP-1600 specific scenarios', () => {
    test('simulates loading a ROM at $5000', () => {
      // Simple program: MVI R1, #42
      const rom = [
        0b0010_0001_0010_1010, // MVI R1, #42
      ];

      memory.load(0x5000, rom);
      expect(memory.read(0x5000)).toBe(0b0010_0001_0010_1010);
    });

    test('simulates EXEC ROM at $1000', () => {
      // Placeholder for EXEC ROM
      memory.write(0x1000, 0x0000); // Reset vector
      expect(memory.read(0x1000)).toBe(0x0000);
    });

    test('simulates system RAM at $0200', () => {
      // System RAM area
      memory.write(0x0200, 0xBEEF);
      expect(memory.read(0x0200)).toBe(0xBEEF);
    });

    test('simulates stack operations (R6 = $02F0)', () => {
      // Stack typically starts at $02F0
      const stackPointer = 0x02F0;

      // Push value
      memory.write(stackPointer, 0x1234);

      // Pull value
      expect(memory.read(stackPointer)).toBe(0x1234);
    });
  });
});
