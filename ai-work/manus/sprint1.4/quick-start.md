# Sprint 1.4 Quick Start Guide

**Goal:** Complete the executor by implementing remaining instructions (arithmetic, logic, status).

---

## What You Need to Do

### 1. Adapt Remaining Tests (56 tests from Sprint 1.3)
- `executor.dispatch.test.ts` (26 tests)
- `executor.data.test.ts` (30 tests)

**Problem:** Tests need decoder's rich `Instruction` type.

**Solution:** Create a test helper:
```typescript
function createTestInstruction(
  opcode: Opcode,
  operands: Array<{ type: 'register' | 'immediate' | 'address', value: number }>
): Instruction {
  return {
    address: 0x5000,
    opcode,
    addressingMode: AddressingMode.REGISTER,
    operands: operands.map(op => ({ ...op })),
    raw: 0x000,
    sdbd: false,
    length: 1,
  };
}
```

### 2. Implement Arithmetic Instructions
- **ADDR** - Add src to dst, set all flags (C, OV, Z, S)
- **SUBR** - Subtract src from dst, set all flags
- **INC** - Increment register
- **DEC** - Decrement register

**Key:** Uncomment your `setArithmeticFlags()` helper and use it.

### 3. Implement Logic Instructions
- **ANDR** - Bitwise AND, set Z/S only (C/OV unchanged)
- **XORR** - Bitwise XOR, set Z/S only
- **CLR** - Clear to zero, always Z=1, S=0

### 4. Implement Status Instructions
- **TST** - Test register, set Z/S, clear C/OV
- **HLT** - Set halted flag

---

## Code Patterns

### Arithmetic (with full flag setting)
```typescript
private executeAddr(inst: Instruction): void {
  const src = inst.operands[0].value;
  const dst = inst.operands[1].value;

  const srcValue = this.cpu.getRegister(src);
  const dstValue = this.cpu.getRegister(dst);

  const result = dstValue + srcValue;
  this.cpu.setRegister(dst, result);

  this.setArithmeticFlags(result, dstValue, srcValue, false);
  this.cpu.addCycles(6);
}
```

### Logic (Z/S flags only)
```typescript
private executeAndr(inst: Instruction): void {
  const src = inst.operands[0].value;
  const dst = inst.operands[1].value;

  const result = this.cpu.getRegister(dst) & this.cpu.getRegister(src);
  this.cpu.setRegister(dst, result);

  const Z = result === 0;
  const S = getBit(result, 15) === 1;
  this.cpu.setFlags({ Z, S });

  this.cpu.addCycles(6);
}
```

---

## Critical Test Cases

### Overflow Detection
```typescript
// Signed overflow: positive + positive = negative
0x7FFF + 0x0001 = 0x8000 → OV=1

// Signed overflow: negative - positive = positive
0x8000 - 0x0001 = 0x7FFF → OV=1

// Unsigned overflow + zero
0xFFFF + 0x0001 = 0x0000 → C=1, Z=1
```

---

## Reminders

1. **Operand extraction:** `inst.operands[0].value` (not `inst.operands[0]`)
2. **Flag names:** Uppercase (C, OV, Z, S)
3. **Test framework:** Vitest with explicit imports
4. **Cycle counts:** Most ops are 6 cycles, HLT is 4

---

## Deliverable

ZIP file with:
- Updated `executor.ts` with all instructions
- Comprehensive `executor.test.ts`
- Adapted `executor.dispatch.test.ts`
- Adapted `executor.data.test.ts`
- `README.md` summarizing work
- `test-results.txt` showing all tests passing

**Quality bar:** >90% coverage, all tests passing, no TypeScript errors.

---

See `prompts-for-manus.md` for complete details.
