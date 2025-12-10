# Sprint 1.4: Prompts for Manus

This document contains prompts and context to guide Manus (Claude) through implementing Sprint 1.4 of the pkIntvMCP project.

---

## Context Summary

### What You've Done (Sprint 1.3)

You successfully implemented the Core Execution Engine for the CP-1600 emulator. Your deliverable was **excellent** and integrated smoothly into the main repository:

**Your Accomplishments:**
- ✅ CPU class (155 lines) - register/flag management, state snapshots, cycle counting
- ✅ Executor class (318 lines) - instruction dispatcher, 3 fully implemented instructions
- ✅ Bit operations utilities (112 lines) - toUint16, toInt16, toUint10, bit helpers
- ✅ Comprehensive test suites - 76 tests, all passing
- ✅ Clean code structure with proper TypeScript strict mode compliance

**Integration Results:**
- Test count increased from 53 → 129 (143% increase)
- All builds passing
- Zero integration issues with decoder
- Well-documented with clear TODO comments

**What Was Integrated:**
1. `packages/core/src/cpu/cpu.ts` - Complete CPU implementation
2. `packages/core/src/cpu/cpu.types.ts` - Type definitions
3. `packages/core/src/executor/executor.ts` - Executor with MOVR, MVI, MVO working
4. `packages/core/src/executor/executor.types.ts` - Memory interface
5. `packages/core/src/utils/bitops.ts` - Bit manipulation utilities
6. Three test files (cpu.test.ts, cpu.types.test.ts, bitops.test.ts)

**What Wasn't Integrated Yet:**
- `executor.dispatch.test.ts` (26 tests) - needs adaptation for decoder's rich Instruction types
- `executor.data.test.ts` (30 tests) - needs adaptation for decoder's rich Instruction types

These tests need helper functions to construct decoder-compatible `Instruction` objects with the full structure:
```typescript
interface Instruction {
  address: number;
  opcode: Opcode;
  addressingMode: AddressingMode;
  operands: Operand[];  // Rich structure: { type, value, autoIncrement? }
  raw: number;
  sdbd: boolean;
  length: number;
}
```

### Key Technical Details from Sprint 1.3

**Flag Naming Convention:**
You correctly used **UPPERCASE** flag names matching the hardware spec:
- `C` (Carry)
- `OV` (Overflow)
- `Z` (Zero)
- `S` (Sign)

This is correct and should be maintained.

**Type Integration:**
Your executor was adapted to use the decoder's canonical types:
```typescript
import type { Instruction } from '../decoder/decoder.types.js';
import { Opcode } from '../decoder/decoder.types.js';
```

**Operand Extraction Pattern:**
The decoder provides rich operands, so you extract values like this:
```typescript
const src = inst.operands[0].value;  // Not inst.operands[0]
const dst = inst.operands[1].value;  // Not inst.operands[1]
```

**Test Framework:**
The project uses **Vitest** (not Jest), with explicit imports:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
```

---

## Sprint 1.4: Remaining Executor Instructions

### Sprint Goal

Complete the executor implementation by adding:
1. The remaining test files from Sprint 1.3 (adapted for decoder types)
2. Arithmetic instructions (ADDR, SUBR, INC, DEC)
3. Logic instructions (ANDR, XORR, CLR)
4. Status instructions (TST, HLT)

### What's Already Done

From your Sprint 1.3 work:
- ✅ CPU class fully functional
- ✅ Executor structure with dispatcher
- ✅ Three data movement instructions (MOVR, MVI, MVO)
- ✅ Flag calculation helper (`setArithmeticFlags`) - commented out but ready to use
- ✅ Bit operation utilities

### What Needs to Be Done

#### Task 1: Adapt Remaining Tests from Sprint 1.3

**Goal:** Get the two remaining test files working with decoder's rich Instruction types.

**Files:**
- `executor.dispatch.test.ts` (26 tests)
- `executor.data.test.ts` (30 tests)

**Challenge:** These tests need to construct `Instruction` objects compatible with the decoder.

**Suggested Approach:**
Create a test helper factory function:

```typescript
// In executor.test.ts or a shared test helper file
function createTestInstruction(
  opcode: Opcode,
  operands: Array<{ type: 'register' | 'immediate' | 'address', value: number }>,
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
    operands: operands.map(op => ({
      type: op.type,
      value: op.value,
      ...(op.type === 'register' && op.value >= 4 && op.value <= 5
        ? { autoIncrement: false }
        : {})
    })),
    raw: options?.raw ?? 0x000,
    sdbd: options?.sdbd ?? false,
    length: options?.length ?? 1,
  };
}

// Usage example:
const movrInst = createTestInstruction(
  Opcode.MOVR,
  [
    { type: 'register', value: 1 },  // src = R1
    { type: 'register', value: 2 },  // dst = R2
  ]
);
executor.execute(movrInst);
```

Then adapt your existing tests to use this helper.

#### Task 2: Implement Arithmetic Instructions

**Instructions to implement:**
- `executeAddr()` - Add register to register
- `executeSubr()` - Subtract register from register
- `executeInc()` - Increment register
- `executeDec()` - Decrement register

**Key Points:**
1. Uncomment the `setArithmeticFlags()` helper you already wrote
2. All four flags (C, OV, Z, S) must be set correctly
3. Overflow detection is critical - use the helper

**Reference Implementation Pattern:**
```typescript
private executeAddr(inst: Instruction): void {
  const src = inst.operands[0].value;  // Source register
  const dst = inst.operands[1].value;  // Destination register

  const srcValue = this.cpu.getRegister(src);
  const dstValue = this.cpu.getRegister(dst);

  // Perform addition
  const result = dstValue + srcValue;
  this.cpu.setRegister(dst, result);

  // Set all arithmetic flags using the helper
  this.setArithmeticFlags(result, dstValue, srcValue, false);

  // Cycle count: 6 cycles
  this.cpu.addCycles(6);

  if (this.options.trace) {
    console.log(`ADDR R${src} + R${dst} = ${toUint16(result)}`);
  }
}
```

**Critical Test Cases:**
- `0x7FFF + 0x0001 = 0x8000` → OV=1 (positive overflow to negative)
- `0x8000 - 0x0001 = 0x7FFF` → OV=1 (negative overflow to positive)
- `0xFFFF + 0x0001 = 0x0000` → C=1, Z=1

#### Task 3: Implement Logic Instructions

**Instructions to implement:**
- `executeAndr()` - Bitwise AND
- `executeXorr()` - Bitwise XOR
- `executeClr()` - Clear register (special case of XORR)

**Key Points:**
1. Logic operations only set S and Z flags
2. C and OV flags are **not modified** (use partial setFlags)
3. CLR always sets Z=1, S=0

**Reference Implementation:**
```typescript
private executeAndr(inst: Instruction): void {
  const src = inst.operands[0].value;
  const dst = inst.operands[1].value;

  const srcValue = this.cpu.getRegister(src);
  const dstValue = this.cpu.getRegister(dst);

  const result = dstValue & srcValue;
  this.cpu.setRegister(dst, result);

  // Only set S and Z flags (C, OV unchanged)
  const Z = result === 0;
  const S = getBit(result, 15) === 1;
  this.cpu.setFlags({ Z, S });

  this.cpu.addCycles(6);
}
```

#### Task 4: Implement Status Instructions

**Instructions to implement:**
- `executeTst()` - Test register (set flags without storing)
- `executeHlt()` - Halt processor

**Key Points:**
1. TST sets S and Z, **clears** C and OV
2. HLT sets the `halted` state flag

**Reference Implementation:**
```typescript
private executeTst(inst: Instruction): void {
  const reg = inst.operands[0].value;
  const value = this.cpu.getRegister(reg);

  // Set S and Z, clear C and OV
  const Z = value === 0;
  const S = getBit(value, 15) === 1;
  this.cpu.setFlags({ Z, S, C: false, OV: false });

  this.cpu.addCycles(6);
}

private executeHlt(_inst: Instruction): void {
  const state = this.cpu.getState();
  state.halted = true;
  this.cpu.setState(state);

  this.cpu.addCycles(4);
}
```

#### Task 5: Comprehensive Testing

**Test Coverage Goals:**
- Unit test for each instruction
- Edge cases for overflow/underflow
- Flag verification for all instructions
- >90% code coverage

**Test Organization:**
```typescript
describe('Executor - Arithmetic Instructions', () => {
  describe('ADDR', () => {
    it('should add two positive numbers', () => { ... });
    it('should set carry flag on unsigned overflow', () => { ... });
    it('should set overflow flag on signed overflow', () => { ... });
    it('should set zero flag when result is zero', () => { ... });
    it('should set sign flag when result is negative', () => { ... });
  });

  describe('SUBR', () => { ... });
  describe('INC', () => { ... });
  describe('DEC', () => { ... });
});

describe('Executor - Logic Instructions', () => {
  describe('ANDR', () => { ... });
  describe('XORR', () => { ... });
  describe('CLR', () => { ... });
});

describe('Executor - Status Instructions', () => {
  describe('TST', () => { ... });
  describe('HLT', () => { ... });
});
```

---

## Deliverable Expectations

### Package Structure

Please deliver as a ZIP file containing:

```
sprint1.4-work/
├── executor.ts              # Updated with all new instructions
├── executor.test.ts         # Comprehensive test suite
├── executor.dispatch.test.ts # Adapted from Sprint 1.3
├── executor.data.test.ts    # Adapted from Sprint 1.3
├── package.json             # Updated if needed
├── tsconfig.json           # TypeScript config
├── vitest.config.ts        # Vitest config
├── README.md               # Summary of work done
└── test-results.txt        # Output of npm test
```

### Quality Standards

**Code Quality:**
- TypeScript strict mode compliance
- No `any` types
- Proper error handling
- Clear variable names
- Comments for complex logic (especially overflow detection)

**Testing:**
- All tests passing
- >90% code coverage
- Edge cases tested
- Flag behavior verified

**Documentation:**
- JSDoc comments on public methods
- README with summary of changes
- List of implemented instructions
- Known issues or TODOs

### Test Checklist

Before submitting, verify:
- [ ] `npm run build` succeeds with no errors
- [ ] `npm test` shows all tests passing
- [ ] Test coverage >90% for executor module
- [ ] No TypeScript errors
- [ ] No linter warnings

---

## Implementation Tips

### 1. Start with Tests

Write tests first for each instruction, then implement to make them pass. This ensures you don't miss edge cases.

### 2. Use Existing Patterns

Your MOVR, MVI, MVO implementations are excellent patterns to follow. Copy that structure for consistency.

### 3. Flag Calculation

The `setArithmeticFlags()` helper you wrote is perfect. Just uncomment it and use it for ADDR/SUBR/INC/DEC.

### 4. Operand Extraction

Always extract from decoder's rich operands:
```typescript
const reg = inst.operands[0].value;  // ✅ Correct
const reg = inst.operands[0];        // ❌ Wrong (gets whole object)
```

### 5. Test Helper Factory

The `createTestInstruction()` helper will make your tests much cleaner and easier to maintain.

### 6. Cycle Counts

Reference the CP-1600 manual or use these standard counts:
- Register operations (MOVR, ADDR, SUBR, ANDR, XORR): 6 cycles
- TST: 6 cycles
- HLT: 4 cycles
- INC/DEC: 6 cycles

---

## Reference Materials

### Repository Structure

```
packages/core/src/
├── cpu/
│   ├── cpu.ts           # ✅ Your implementation
│   ├── cpu.types.ts     # ✅ Your types
│   └── cpu.test.ts      # ✅ Your tests
├── executor/
│   ├── executor.ts      # 🟡 Your partial implementation (MOVR, MVI, MVO done)
│   ├── executor.types.ts # ✅ Memory interface
│   └── executor.test.ts  # 🟡 Needs completion
├── decoder/
│   ├── decoder.ts       # ✅ Working from Sprint 1.2
│   └── decoder.types.ts # ✅ Canonical Instruction types
├── memory/
│   └── memory.ts        # ✅ Working from Sprint 1.1
├── utils/
│   └── bitops.ts        # ✅ Your utilities
└── index.ts             # ✅ Barrel exports
```

### Decoder Types Reference

```typescript
export enum Opcode {
  // Data Movement
  MOVR = 'MOVR',
  MVI = 'MVI',
  MVO = 'MVO',

  // Arithmetic
  ADDR = 'ADDR',
  SUBR = 'SUBR',
  INCR = 'INCR',  // Note: might be INCR not INC
  DECR = 'DECR',  // Note: might be DECR not DEC

  // Logic
  ANDR = 'ANDR',
  XORR = 'XORR',

  // Status
  TSTR = 'TSTR',  // Note: might be TSTR not TST
  HLT = 'HLT',

  // ... many more
}

export enum AddressingMode {
  IMPLIED = 'IMPLIED',
  REGISTER = 'REGISTER',
  IMMEDIATE = 'IMMEDIATE',
  DIRECT = 'DIRECT',
  INDIRECT = 'INDIRECT',
  // ... more
}

export interface Operand {
  type: 'register' | 'immediate' | 'address';
  value: number;
  autoIncrement?: boolean;
}

export interface Instruction {
  address: number;
  opcode: Opcode;
  addressingMode: AddressingMode;
  operands: Operand[];
  raw: number;
  sdbd: boolean;
  length: number;
}
```

### CPU API Reference

```typescript
class CPU {
  getRegister(index: number): number;
  setRegister(index: number, value: number): void;
  getPC(): number;
  setPC(value: number): void;
  incrementPC(): void;
  getFlags(): CPUFlags;
  setFlags(partial: Partial<CPUFlags>): void;
  reset(): void;
  getState(): CPUState;
  setState(state: CPUState): void;
  addCycles(n: number): void;
  getCycles(): number;
}

interface CPUFlags {
  C: boolean;   // Carry
  OV: boolean;  // Overflow
  Z: boolean;   // Zero
  S: boolean;   // Sign
}
```

---

## Questions to Clarify

If you encounter any ambiguities, please document them in your README with:
1. The question
2. What you assumed
3. Why you made that assumption

Common questions that might arise:
- Are INC/DEC separate opcodes or variants of INCR/DECR?
- Is TST actually TSTR in the decoder?
- Should CLR be a separate opcode or treated as XORR Rn, Rn?

Check the decoder's actual `Opcode` enum to see what's defined.

---

## Success Criteria

Your Sprint 1.4 work will be considered complete when:

1. ✅ All arithmetic instructions working (ADDR, SUBR, INC, DEC)
2. ✅ All logic instructions working (ANDR, XORR, CLR)
3. ✅ All status instructions working (TST, HLT)
4. ✅ Both remaining test files adapted and passing
5. ✅ Comprehensive test coverage (>90%)
6. ✅ All tests passing
7. ✅ Build succeeds with no errors
8. ✅ README documents what was done
9. ✅ Code follows established patterns from Sprint 1.3

---

## Next Steps After Sprint 1.4

Once you complete Sprint 1.4, the next sprint (1.5 or 2.1) will likely involve:
- Control flow instructions (branches, jumps)
- Stack operations (PSHR, PULR)
- Integration with decoder for execution loop
- More complex instruction sequences

But that's for later. Focus on completing Sprint 1.4 first!

---

## Final Notes

Your Sprint 1.3 work was excellent - clean code, thorough tests, and easy integration. We're confident Sprint 1.4 will be equally successful.

Key things to remember:
1. Use decoder's canonical types (import from `decoder.types.ts`)
2. Extract `.value` from operands
3. Maintain uppercase flag names (C, OV, Z, S)
4. Use Vitest (not Jest)
5. Follow your established patterns from Sprint 1.3

Good luck, and thank you for your excellent work! 🚀
