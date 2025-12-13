# Testing Guide for pkIntvMCP

## Overview

This guide provides essential information for writing and running tests in the pkIntvMCP project. Follow these patterns to maintain consistency and quality across the codebase.

## Test Framework

We use **Vitest** as our test framework. It provides:
- Fast test execution
- TypeScript support out of the box
- Built-in coverage reporting
- Compatibility with Jest expectations

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npx vitest run --coverage
```

### From Project Root

```bash
# Run tests in all packages
npm test

# Run tests in specific package
npm test --workspace=@pkintvmcp/core
```

## Writing Tests

### Test File Location and Naming

- Place test files next to the code they test
- Use `.test.ts` extension: `executor.ts` → `executor.test.ts`
- Group related tests: `executor.shifts.test.ts`, `executor.immediate.test.ts`

### Memory Mocking Pattern

**IMPORTANT:** Do not use the real `Memory` class from `../memory/memory.js`. Instead, use a mock implementation:

```typescript
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
```

**Why MockMemory?**
- Lightweight (no 64K array allocation)
- Fast test execution
- Isolates executor logic from memory implementation
- Only stores values that are actually used in tests

### Test Structure Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../cpu/cpu.js';
import { Executor } from './executor.js';
import { Opcode, type Instruction } from '../decoder/decoder.types.js';
import type { Memory } from './executor.types.js';

// Mock Memory implementation (see above)

describe('Executor - Feature Group', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);
  });

  describe('INSTRUCTION_NAME', () => {
    it('should perform basic operation', () => {
      // Arrange
      cpu.setRegister(1, 0x1234);

      const inst: Instruction = {
        address: 0,
        opcode: Opcode.INSTRUCTION_NAME,
        addressingMode: 'REGISTER' as any,
        operands: [{ type: 'register', value: 1 }],
        raw: 0,
        sdbd: false,
      };

      // Act
      executor.execute(inst);

      // Assert
      expect(cpu.getRegister(1)).toBe(expectedValue);
      expect(cpu.getFlags().C).toBe(expectedCarry);
      expect(cpu.getFlags().Z).toBe(expectedZero);
    });

    it('should handle edge case', () => {
      // Test boundary conditions
    });
  });
});
```

### Instruction Testing Checklist

For each instruction, test:

1. **Basic functionality** - Instruction works correctly
2. **Flag behavior**:
   - Carry (C) flag - set/cleared appropriately
   - Overflow (OV) flag - arithmetic overflow detection
   - Zero (Z) flag - result is zero
   - Sign (S) flag - result is negative
3. **Edge cases**:
   - Zero values
   - Maximum values (0xFFFF)
   - Minimum signed value (0x8000)
   - Overflow/underflow conditions
4. **SDBD mode** (for immediate instructions):
   - Normal 10-bit immediate
   - SDBD 16-bit immediate
   - Cycle timing (8 vs 10 cycles)

### Common Testing Patterns

#### Testing Shifts/Rotates

```typescript
it('should shift left and set carry', () => {
  cpu.setRegister(1, 0x8000);

  const inst: Instruction = {
    address: 0,
    opcode: Opcode.SLL,
    addressingMode: 'REGISTER' as any,
    operands: [{ type: 'register', value: 1 }],
    raw: 0,
    sdbd: false,
  };

  executor.execute(inst);

  expect(cpu.getRegister(1)).toBe(0x0000);
  expect(cpu.getFlags().C).toBe(true); // Bit 15 shifted out
  expect(cpu.getFlags().OV).toBe(false); // Always cleared for shifts
});
```

#### Testing Immediate/Memory Instructions

```typescript
it('should add immediate value', () => {
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
  expect(cpu.getState().cycles).toBe(8); // Immediate mode
});
```

#### Testing Memory Operations

```typescript
it('should read from memory', () => {
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
```

## Coverage Goals

- **Line Coverage:** >90% (current: 92.97%)
- **Branch Coverage:** Target 85% (current: 75%, acceptable due to incomplete decoder)
- **Function Coverage:** 100%

### Checking Coverage

```bash
npx vitest run --coverage
```

Coverage report shows:
- Statement coverage (% of code executed)
- Branch coverage (% of conditions tested)
- Function coverage (% of functions called)
- Line coverage (% of lines executed)

## Common Pitfalls

### 1. Using SimpleMemory Instead of MockMemory

**DON'T:**
```typescript
import { SimpleMemory } from '../memory/memory.js';
let memory: SimpleMemory;
```

**DO:**
```typescript
import type { Memory } from './executor.types.js';
class MockMemory implements Memory { /* ... */ }
let memory: MockMemory;
```

### 2. Incorrect Flag Expectations

Understand flag behavior for each instruction:
- **Shifts/Rotates:** Always clear OV
- **Logical ops (AND, XOR):** Don't affect C, OV
- **Arithmetic ops (ADD, SUB):** Set all flags
- **SWAP:** Always clears C

### 3. Carry Flag in Subtraction

For subtraction (including NEGR, CMP):
- C flag indicates **borrow**
- C = true when op1 < op2 (unsigned)
- Example: 0 - 0xFFFF → C = true (borrow occurred)

### 4. Missing Edge Cases

Always test:
- Zero input/output
- Maximum values (0xFFFF)
- Sign bit transitions (0x7FFF → 0x8000)
- Overflow conditions

## Best Practices

1. **One assertion per concept** - Multiple expects are fine, but each should test a distinct aspect
2. **Descriptive test names** - Use "should..." format
3. **Arrange-Act-Assert** - Structure tests clearly
4. **Reset state** - Use `beforeEach` to create fresh instances
5. **Test boundaries** - Edge cases reveal bugs
6. **Comment non-obvious tests** - Explain why a flag should be set/cleared

## Integration Tests

Integration tests verify multi-instruction sequences:

```typescript
describe('Integration - Bit Manipulation', () => {
  it('should extract bits using shifts', () => {
    // Setup: value with bits to extract
    cpu.setRegister(1, 0x1234);

    // Extract high byte using shifts
    // ... execute multiple instructions ...

    expect(cpu.getRegister(2)).toBe(0x0012);
  });
});
```

## Debugging Tests

### View Test Output

```bash
# Run tests with verbose output
npx vitest run --reporter=verbose

# Run specific test file
npx vitest run executor.shifts.test.ts

# Run tests matching pattern
npx vitest run --grep="SWAP"
```

### Common Issues

1. **"SimpleMemory is not a constructor"** - Use MockMemory pattern
2. **Flag assertion failures** - Review flag behavior for instruction type
3. **Coverage below threshold** - Normal if decoder has unimplemented opcodes

## Sprint 1.6 Testing Summary

- **Total Tests:** 332 passing
- **Line Coverage:** 92.97%
- **New Test Files:**
  - `executor.shifts.test.ts` - Shifts, rotates, bit manipulation (24 tests)
  - `executor.immediate.test.ts` - Immediate/memory operations (20 tests)
- **Test Categories:**
  - Shift instructions: SLL, SLLC, SLR, SAR, SARC
  - Rotate instructions: RLC, RRC
  - Bit manipulation: SWAP, NEGR
  - Immediate operations: ADD, SUB, AND, XOR, CMP (immediate & memory modes)

## References

- [Vitest Documentation](https://vitest.dev/)
- [PROJECT_SETUP.md](PROJECT_SETUP.md) - Build and test setup
- [ARCHITECTURE.md](ARCHITECTURE.md) - Module structure
- Existing test files in `packages/core/src/` - Follow established patterns
