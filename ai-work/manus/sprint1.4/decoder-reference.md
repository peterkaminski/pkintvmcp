# Decoder Types Reference for Sprint 1.4

This document provides the exact type definitions from the decoder that you'll need for Sprint 1.4.

---

## Opcode Enum (Relevant Instructions)

From `packages/core/src/decoder/decoder.types.ts`:

```typescript
export enum Opcode {
  // Data Movement (already implemented in Sprint 1.3)
  MVI = 'MVI',       // Move immediate to register
  MVO = 'MVO',       // Move register to output (memory)
  MOVR = 'MOVR',     // Move register to register

  // Arithmetic (Sprint 1.4 - Task 2)
  ADDR = 'ADDR',     // Add register to register
  SUBR = 'SUBR',     // Subtract register from register
  INCR = 'INCR',     // Increment register ⚠️ Note: INCR not INC
  DECR = 'DECR',     // Decrement register ⚠️ Note: DECR not DEC

  // Logic (Sprint 1.4 - Task 3)
  ANDR = 'ANDR',     // AND register with register
  XORR = 'XORR',     // XOR register with register
  CLRR = 'CLRR',     // Clear register ⚠️ Note: CLRR not CLR

  // Status/Testing (Sprint 1.4 - Task 4)
  TSTR = 'TSTR',     // Test register ⚠️ Note: TSTR not TST
  HLT = 'HLT',       // Halt processor

  // Other opcodes exist but aren't needed for Sprint 1.4
}
```

**⚠️ IMPORTANT NAMING DIFFERENCES:**
- Use `INCR` (not `INC`)
- Use `DECR` (not `DEC`)
- Use `CLRR` (not `CLR`)
- Use `TSTR` (not `TST`)

The "R" suffix indicates these are **register** operations (vs memory operations).

---

## AddressingMode Enum

```typescript
export enum AddressingMode {
  IMPLIED = 'IMPLIED',        // No operands (e.g., HLT)
  REGISTER = 'REGISTER',      // Register operands (e.g., MOVR R1, R2)
  IMMEDIATE = 'IMMEDIATE',    // Immediate value (e.g., MVI R1, #42)
  DIRECT = 'DIRECT',          // Direct memory address
  INDIRECT = 'INDIRECT',      // Indirect through register
  INDEXED = 'INDEXED',        // Indexed addressing
  STACK = 'STACK',            // Stack operations
  DOUBLE_INDIRECT = 'DOUBLE_INDIRECT',  // @@R4, @@R5
  SDBD_MODIFIED = 'SDBD_MODIFIED',      // SDBD prefix applied
}
```

Most Sprint 1.4 instructions use `REGISTER` addressing mode.

---

## Operand Interface

```typescript
export interface Operand {
  type: 'register' | 'immediate' | 'address';
  value: number;
  autoIncrement?: boolean;  // Only for @@R4, @@R5
}
```

**Examples:**
```typescript
// Register operand
{ type: 'register', value: 1 }  // R1

// Immediate operand
{ type: 'immediate', value: 42 }  // #42

// Address operand
{ type: 'address', value: 0x200 }  // $0200
```

---

## Instruction Interface

```typescript
export interface Instruction {
  address: number;           // Memory address where instruction is located
  opcode: Opcode;            // Which instruction
  addressingMode: AddressingMode;  // How operands are addressed
  operands: Operand[];       // Array of operands (0-2 typically)
  raw: number;               // Raw 10-bit instruction word
  sdbd: boolean;             // SDBD prefix was applied
  length: number;            // Instruction length in words (1-3)
}
```

**Example ADDR R1, R2:**
```typescript
{
  address: 0x5000,
  opcode: Opcode.ADDR,
  addressingMode: AddressingMode.REGISTER,
  operands: [
    { type: 'register', value: 1 },  // src = R1
    { type: 'register', value: 2 },  // dst = R2
  ],
  raw: 0x0CA,
  sdbd: false,
  length: 1,
}
```

---

## How to Extract Operands in Executor

Since the decoder provides rich `Operand[]` objects, you must extract the `.value` property:

```typescript
// ✅ CORRECT
const src = inst.operands[0].value;
const dst = inst.operands[1].value;

// ❌ WRONG - gets whole object, not the number
const src = inst.operands[0];
const dst = inst.operands[1];
```

---

## Test Helper Factory (Recommended)

Create this helper in your test file to easily construct `Instruction` objects:

```typescript
import { Opcode, AddressingMode, type Instruction, type Operand } from '../decoder/decoder.types.js';

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
    })),
    raw: options?.raw ?? 0x000,
    sdbd: options?.sdbd ?? false,
    length: options?.length ?? 1,
  };
}

// Usage examples:
describe('ADDR instruction', () => {
  it('should add two registers', () => {
    const inst = createTestInstruction(
      Opcode.ADDR,
      [
        { type: 'register', value: 1 },  // R1 (source)
        { type: 'register', value: 2 },  // R2 (destination)
      ]
    );

    cpu.setRegister(1, 10);
    cpu.setRegister(2, 20);

    executor.execute(inst);

    expect(cpu.getRegister(2)).toBe(30);
  });
});
```

---

## Instruction Operand Patterns

### Two-Operand Register Instructions
MOVR, ADDR, SUBR, ANDR, XORR all follow this pattern:
```typescript
operands: [
  { type: 'register', value: src },  // Source register
  { type: 'register', value: dst },  // Destination register
]
```

### One-Operand Register Instructions
INCR, DECR, CLRR, TSTR follow this pattern:
```typescript
operands: [
  { type: 'register', value: reg },  // Target register
]
```

### Zero-Operand Instructions
HLT has no operands:
```typescript
operands: []
```

---

## Import Statements

Use these imports in your executor and test files:

```typescript
// In executor.ts:
import type { Instruction } from '../decoder/decoder.types.js';
import { Opcode } from '../decoder/decoder.types.js';

// In executor.test.ts:
import { Opcode, AddressingMode, type Instruction } from '../decoder/decoder.types.js';
```

---

## Summary Checklist

When implementing Sprint 1.4:
- [ ] Use correct opcode names (INCR, DECR, CLRR, TSTR)
- [ ] Extract operands with `.value` property
- [ ] Create test helper for Instruction construction
- [ ] Import from `decoder.types.ts` (not local types)
- [ ] Use `AddressingMode.REGISTER` for most instructions
- [ ] Handle empty operands array for HLT
