# SLL Instruction Walkthrough

This document provides a detailed walkthrough of the **SLL (Shift Logical Left)** instruction implementation and tests in pkIntvMCP. Use this as a reference for understanding how bit manipulation instructions work in the CP-1600 emulator.

## Table of Contents

- [Overview](#overview)
- [Implementation Walkthrough](#implementation-walkthrough)
- [Test Walkthrough](#test-walkthrough)
- [Key Concepts](#key-concepts)
- [Common Pitfalls](#common-pitfalls)

---

## Overview

### What is SLL?

**SLL** (Shift Logical Left) shifts a register's value left by 1 bit position. It's a fundamental bit manipulation operation used for:
- Multiplying by 2 (unsigned)
- Extracting bits by shifting into specific positions
- Building multi-precision arithmetic (with SLLC)

### Instruction Specification

**Mnemonic:** `SLL Rdst`

**Operation:**
```
temp = Rdst[15]      // Save bit 15 (will become carry)
Rdst = Rdst << 1     // Shift left, bit 0 becomes 0
C = temp             // Bit 15 → Carry flag
OV = false           // Always cleared
Z = (Rdst == 0)      // Zero flag
S = Rdst[15]         // Sign flag (new bit 15)
```

**Visual Representation:**
```
Before:  [15 14 13 12 11 10 09 08 07 06 05 04 03 02 01 00]
          |                                            |
          v                                            v
After:   [14 13 12 11 10 09 08 07 06 05 04 03 02 01 00  0]
          |
          └──> C flag
```

**Flags:**
- **C (Carry)**: Set to the bit shifted out (bit 15 of original value)
- **OV (Overflow)**: Always cleared (shifts don't detect arithmetic overflow)
- **Z (Zero)**: Set if result is 0x0000
- **S (Sign)**: Set if bit 15 of result is 1

**Cycles:** 6

---

## Implementation Walkthrough

### Location
**File:** `packages/core/src/executor/executor.ts`
**Lines:** 1277-1303

### Step-by-Step Code Analysis

#### Step 1: Extract Destination Register

```typescript
const dst = inst.operands[0].value;
```

**Purpose:** Get the register number from the instruction operands.

**Example:** For `SLL R1`, this extracts `dst = 1`

---

#### Step 2: Read Current Value

```typescript
const value = this.cpu.getRegister(dst);
```

**Purpose:** Read the current value from the destination register.

**Example:** If R1 contains `0x0123`, then `value = 0x0123`

---

#### Step 3: Capture Bit 15 (Carry Output)

```typescript
const carryOut = getBit(value, 15) === 1;
```

**Purpose:** Save bit 15 before shifting, as it will become the carry flag.

**Why Important:** Once we shift, this bit is lost. We must capture it first.

**Example:**
- `0x0123` (binary: `0000 0001 0010 0011`) → bit 15 = 0 → `carryOut = false`
- `0x8000` (binary: `1000 0000 0000 0000`) → bit 15 = 1 → `carryOut = true`

**Helper Function:**
```typescript
// From src/utils/bitops.ts
function getBit(value: number, bit: number): number {
  return (value >> bit) & 1;
}
```

---

#### Step 4: Perform the Shift

```typescript
const result = toUint16(value << 1);
```

**Purpose:** Shift the value left by 1 bit position and ensure it's a 16-bit value.

**Why toUint16?** JavaScript's `<<` operator works with 32-bit signed integers. We must mask the result to 16 bits.

**Example:**
- Input: `0x0123` = `0000 0001 0010 0011`
- Left shift: `value << 1` = `0000 0010 0100 0110`
- Result: `0x0246`

**Bit-level visualization:**
```
0x0123:  0000 0001 0010 0011
           ↓   ↓   ↓   ↓   ↓   (each bit moves left)
0x0246:  0000 0010 0100 0110
                             ↑ (new bit 0 is always 0)
```

**Helper Function:**
```typescript
// From src/utils/bitops.ts
function toUint16(value: number): number {
  return value & 0xFFFF;
}
```

---

#### Step 5: Update the Register

```typescript
this.cpu.setRegister(dst, result);
```

**Purpose:** Write the shifted value back to the destination register.

**Example:** R1 now contains `0x0246`

---

#### Step 6: Update Flags

```typescript
this.cpu.setFlags({
  C: carryOut,           // Bit that was shifted out
  OV: false,             // Always cleared for shifts
  Z: result === 0,       // True if result is zero
  S: getBit(result, 15) === 1,  // True if result is negative
});
```

**Purpose:** Update CPU flags based on the operation result.

**Flag Calculations:**

1. **C (Carry)**: `carryOut` (bit 15 of original value)
   - `0x0123` → C = false (bit 15 was 0)
   - `0x8000` → C = true (bit 15 was 1)

2. **OV (Overflow)**: Always `false` for shift operations
   - Shifts don't detect arithmetic overflow
   - This is per CP-1600 specification

3. **Z (Zero)**: `result === 0`
   - `0x0000` → Z = true
   - `0x0246` → Z = false

4. **S (Sign)**: `getBit(result, 15) === 1`
   - `0x0246` (bit 15 = 0) → S = false
   - `0x8000` (bit 15 = 1) → S = true

---

#### Step 7: Add Cycles

```typescript
this.cpu.addCycles(6);
```

**Purpose:** Track execution time for accurate emulation.

**Why 6 cycles?** Per CP-1600 specification, shift instructions take 6 base cycles.

---

#### Step 8: Optional Trace Logging

```typescript
if (this.options.trace) {
  console.log(`SLL R${dst}: ${value.toString(16)} << 1 = ${result.toString(16)}, C=${carryOut}`);
}
```

**Purpose:** Debugging output when trace mode is enabled.

**Example Output:** `SLL R1: 123 << 1 = 246, C=false`

---

## Test Walkthrough

### Location
**File:** `packages/core/src/executor/executor.shifts.test.ts`
**Lines:** 38-98

### Test 1: Basic Shift Left

**Test Name:** "should shift left by 1 bit"
**Lines:** 39-58

#### Purpose
Verify that SLL correctly shifts a normal value left by 1 bit and sets flags appropriately.

#### Test Setup

```typescript
cpu.setRegister(1, 0x0123);
```

**Initial State:**
- R1 = `0x0123` = `0000 0001 0010 0011` (binary)

#### Instruction Construction

```typescript
const inst: Instruction = {
  address: 0,
  opcode: Opcode.SLL,
  addressingMode: 'REGISTER' as any,
  operands: [{ type: 'register', value: 1 }],
  raw: 0,
  sdbd: false,
};
```

**Breakdown:**
- `opcode: Opcode.SLL` - Identifies this as an SLL instruction
- `operands: [{ type: 'register', value: 1 }]` - Operates on R1
- `sdbd: false` - Not using SDBD prefix (not applicable to SLL)

#### Execution

```typescript
executor.execute(inst);
```

**What Happens:**
1. Executor reads instruction opcode (`Opcode.SLL`)
2. Dispatcher calls `executeSLL(inst)`
3. Implementation runs (see implementation walkthrough above)

#### Assertions

```typescript
expect(cpu.getRegister(1)).toBe(0x0246);
```

**Expected Result Calculation:**
```
0x0123 << 1 = 0x0246

Binary:
  0000 0001 0010 0011  (0x0123)
  ↓↓↓↓ ↓↓↓↓ ↓↓↓↓ ↓↓↓↓
  0000 0010 0100 0110  (0x0246)
```

**Why 0x0246?** Each bit moves one position left, bit 0 becomes 0.

---

```typescript
expect(cpu.getFlags().C).toBe(false);
```

**Carry Flag:** Bit 15 of `0x0123` is 0, so C = false.

---

```typescript
expect(cpu.getFlags().Z).toBe(false);
```

**Zero Flag:** Result `0x0246` is not zero, so Z = false.

---

```typescript
expect(cpu.getFlags().S).toBe(false);
```

**Sign Flag:** Bit 15 of `0x0246` is 0, so S = false (positive).

---

```typescript
expect(cpu.getFlags().OV).toBe(false);
```

**Overflow Flag:** Always cleared for shift operations.

---

### Test 2: Carry Flag from Bit 15

**Test Name:** "should set carry when bit 15 is shifted out"
**Lines:** 60-75

#### Purpose
Verify that the carry flag is set when shifting out a 1 from bit 15.

#### Test Setup

```typescript
cpu.setRegister(2, 0x8000);
```

**Initial State:**
- R2 = `0x8000` = `1000 0000 0000 0000` (binary)
- Bit 15 = 1 (this will become carry)

#### Execution and Results

```typescript
executor.execute(inst);

expect(cpu.getRegister(2)).toBe(0x0000);
```

**Calculation:**
```
0x8000 << 1 = 0x0000 (with carry = 1)

Binary:
  1000 0000 0000 0000  (0x8000)
  ↓↓↓↓ ↓↓↓↓ ↓↓↓↓ ↓↓↓↓
  0000 0000 0000 0000  (0x0000)
  ↑
  └─→ This 1 goes to C flag
```

**Result:** All bits shift left, bit 15 becomes 0, result is 0x0000.

---

```typescript
expect(cpu.getFlags().C).toBe(true);
```

**Carry Flag:** Bit 15 of original value (`0x8000`) is 1, so C = true.

---

```typescript
expect(cpu.getFlags().Z).toBe(true);
```

**Zero Flag:** Result is `0x0000`, so Z = true.

---

```typescript
expect(cpu.getFlags().S).toBe(false);
```

**Sign Flag:** Bit 15 of result is 0, so S = false.

---

### Test 3: Zero Result

**Test Name:** "should set zero flag when result is zero"
**Lines:** 77-92

#### Purpose
Verify zero flag behavior with an edge case input.

#### Test Setup

```typescript
cpu.setRegister(3, 0x0000);
```

**Initial State:**
- R3 = `0x0000` (already zero)

#### Results

```
0x0000 << 1 = 0x0000
```

- **Result:** `0x0000`
- **C:** false (bit 15 was 0)
- **Z:** true (result is zero)
- **S:** false (bit 15 is 0)
- **OV:** false (always cleared)

---

### Test 4: Sign Flag

**Test Name:** "should set sign flag for negative result"
**Lines:** 94-98 (implied, similar pattern)

#### Purpose
Verify that sign flag is set when bit 15 of result is 1.

#### Example

```typescript
cpu.setRegister(4, 0x4000);  // 0100 0000 0000 0000
executor.execute(inst);
```

**Calculation:**
```
0x4000 << 1 = 0x8000

Binary:
  0100 0000 0000 0000  (0x4000)
  ↓↓↓↓ ↓↓↓↓ ↓↓↓↓ ↓↓↓↓
  1000 0000 0000 0000  (0x8000)
```

**Results:**
- **Result:** `0x8000`
- **C:** false (original bit 15 was 0)
- **Z:** false (result is not zero)
- **S:** true (bit 15 of result is 1)
- **OV:** false (always cleared)

---

## Key Concepts

### 1. Bit Shifting vs. Rotation

**SLL (Shift Logical Left):**
- Bit 15 → Carry flag
- Bits 14-0 → Bits 15-1
- Bit 0 ← 0 (always zero)

**SLLC (Shift Logical Left through Carry):**
- Bit 15 → Carry flag
- Bits 14-0 → Bits 15-1
- Bit 0 ← Old Carry flag

**RLC (Rotate Left through Carry):**
- Same as SLLC, but called "rotate" because carry acts as a 17th bit in the rotation

### 2. Why toUint16 is Critical

JavaScript's bitwise operators work with 32-bit signed integers:

```javascript
// Without toUint16 (WRONG)
let value = 0x8000;
let result = value << 1;  // result = 0x00010000 (32-bit result!)

// With toUint16 (CORRECT)
let value = 0x8000;
let result = toUint16(value << 1);  // result = 0x0000 (16-bit masked)
```

**Always use `toUint16()` for results to ensure 16-bit masking.**

### 3. Flag Semantics

| Flag | Meaning | SLL Behavior |
|------|---------|--------------|
| C | Carry | Bit shifted out (bit 15 of input) |
| OV | Overflow | Always cleared (no arithmetic) |
| Z | Zero | Result is 0x0000 |
| S | Sign | Bit 15 of result (negative in 2's complement) |

### 4. Cycle Timing

All shift and rotate instructions take **6 cycles** in Phase 1:
- SLL, SLLC, SLR, SAR, SARC: 6 cycles
- RLC, RRC: 6 cycles
- SWAP: 6 cycles

(Phase 2+ will account for memory wait states: W=0,1,3)

---

## Common Pitfalls

### Pitfall 1: Forgetting to Capture Bit 15

**WRONG:**
```typescript
const result = toUint16(value << 1);
const carryOut = getBit(result, 15) === 1;  // Uses NEW bit 15!
```

**CORRECT:**
```typescript
const carryOut = getBit(value, 15) === 1;  // Capture BEFORE shift
const result = toUint16(value << 1);
```

**Why:** Once shifted, bit 15 is the old bit 14. We need the original bit 15.

---

### Pitfall 2: Not Using toUint16

**WRONG:**
```typescript
const result = value << 1;  // 32-bit result
```

**CORRECT:**
```typescript
const result = toUint16(value << 1);  // 16-bit masked
```

**Why:** JavaScript `<<` returns a 32-bit integer. Must mask to 16 bits.

---

### Pitfall 3: Setting OV Flag

**WRONG:**
```typescript
this.cpu.setFlags({
  C: carryOut,
  OV: carryOut,  // NO! OV is not the same as C
  Z: result === 0,
  S: getBit(result, 15) === 1,
});
```

**CORRECT:**
```typescript
this.cpu.setFlags({
  C: carryOut,
  OV: false,  // Always cleared for shifts
  Z: result === 0,
  S: getBit(result, 15) === 1,
});
```

**Why:** Per CP-1600 spec, shifts always clear the overflow flag.

---

### Pitfall 4: Confusing Sign Flag with Carry

- **Carry (C):** Bit 15 of the **input** value
- **Sign (S):** Bit 15 of the **output** value

**Example:**
```
Input:  0x4000 (bit 15 = 0)
Output: 0x8000 (bit 15 = 1)

C = false  (input bit 15)
S = true   (output bit 15)
```

---

### Pitfall 5: Testing with Only Simple Values

Always test edge cases:
- `0x0000` - Zero input
- `0xFFFF` - All bits set
- `0x8000` - Only bit 15 set (maximum negative)
- `0x0001` - Only bit 0 set
- `0x4000` - Bit 14 set (becomes bit 15 after shift)

---

## Testing Best Practices

### 1. Test Pattern: Arrange-Act-Assert

```typescript
it('should ...', () => {
  // ARRANGE: Set up initial state
  cpu.setRegister(1, 0x0123);

  // ACT: Execute the instruction
  executor.execute(inst);

  // ASSERT: Verify results
  expect(cpu.getRegister(1)).toBe(0x0246);
  expect(cpu.getFlags().C).toBe(false);
});
```

### 2. Test Each Flag Independently

Don't just test the happy path - verify each flag condition:
- Zero flag: Input that produces 0x0000
- Sign flag: Input that produces negative result
- Carry flag: Input with bit 15 set
- Overflow flag: Always false (but still verify)

### 3. Test Edge Cases

```typescript
// Zero input
cpu.setRegister(1, 0x0000);

// Maximum value
cpu.setRegister(1, 0xFFFF);

// Bit 15 set (becomes carry)
cpu.setRegister(1, 0x8000);

// Bit 14 set (becomes bit 15/sign)
cpu.setRegister(1, 0x4000);
```

### 4. Use MockMemory Pattern

```typescript
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

**Why:** Lightweight, fast, isolates executor logic from memory implementation.

---

## Related Instructions

After understanding SLL, you can apply the same concepts to:

- **SLLC** - Shift Left through Carry (uses carry as bit 0 input)
- **SLR** - Shift Logical Right (shifts right, fills with 0)
- **SAR** - Shift Arithmetic Right (shifts right, preserves sign bit)
- **SARC** - Shift Arithmetic Right through Carry
- **RLC** - Rotate Left through Carry (17-bit rotation)
- **RRC** - Rotate Right through Carry (17-bit rotation)

All follow the same implementation pattern:
1. Read value from register
2. Capture bits that will be lost (carry out)
3. Perform the operation
4. Update register
5. Set flags
6. Add cycles
7. Optional trace

---

## Conclusion

The SLL instruction demonstrates key principles for implementing CP-1600 instructions:

1. **Bit manipulation:** Use helper functions (`getBit`, `toUint16`)
2. **Flag behavior:** Each instruction has specific flag semantics
3. **Capture before modify:** Save bits that will be lost
4. **16-bit masking:** Always use `toUint16()` for results
5. **Cycle accuracy:** Track execution time
6. **Comprehensive testing:** Test all flags and edge cases

This pattern applies to all shift, rotate, and bit manipulation instructions in the CP-1600.

---

**See Also:**
- [testing-guide.md](testing-guide.md) - Comprehensive testing patterns
- [CPU_SPECIFICATION.md](CPU_SPECIFICATION.md) - Full CP-1600 instruction set
- [ARCHITECTURE.md](ARCHITECTURE.md) - Executor design
- [Sprint-1.6.md](Sprint-1.6.md) - Shift/rotate implementation sprint
