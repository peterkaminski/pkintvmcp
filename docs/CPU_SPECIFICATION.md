# pkIntvMCP - CP-1600 CPU Specification

**Version:** 1.0
**Date:** 2025-12-08
**Status:** Draft
**Phase:** Sprint 1.1 (Foundation & Documentation)

---

## Table of Contents

1. [Instruction Set Overview](#instruction-set-overview)
2. [Instruction Categories](#instruction-categories)
3. [Instruction Details](#instruction-details)
4. [Bit-Level Operations in TypeScript](#bit-level-operations-in-typescript)
5. [Flag Semantics](#flag-semantics)
6. [Memory System](#memory-system)
7. [Edge Cases](#edge-cases)
8. [Validation Strategy](#validation-strategy)
9. [Implementation Checklist](#implementation-checklist)

---

## Instruction Set Overview

### CP-1600 Architecture Summary

**Instruction Format:**
- **10-bit instruction words** (called "decles") stored in ROM
- **16-bit data operations** for all registers and memory
- Variable-length instructions (1-3 decles depending on addressing mode)

**Addressing Modes:**
- **Implied**: No operands (e.g., NOP, HLT)
- **Register**: Rn (R0-R7)
- **Immediate**: #value (10-bit or 16-bit with SDBD)
- **Direct**: $addr (absolute address)
- **Indirect**: @Rn (register contains address)
- **Indexed**: $addr(Rn) (address + register)
- **Double Indirect**: @@R4, @@R5 (special auto-increment modes)

**SDBD Prefix:**
- **SDBD** (Set Double Byte Data) is a prefix instruction
- Makes next instruction use 16-bit immediate value instead of 10-bit
- Reads two consecutive 10-bit words to form 16-bit value
- Critical for loading large constants and addresses

**Instruction Count:**
- Approximately **50 unique instructions** (including variants)
- Phase 1 targets ~20 core instructions
- Phase 2 completes all instructions

---

## Instruction Categories

### Phase 1: Core Instructions (MVP)

**Data Movement** (8 instructions)
- MVI, MVO, MVOI - Move immediate/to memory
- MOV, MOVR - Move between registers
- MVI@ - Move with auto-increment

**Arithmetic** (7 instructions)
- ADD, ADDR - Add
- SUB, SUBR - Subtract
- INC, INCR - Increment
- DEC, DECR - Decrement

**Logic** (5 instructions)
- AND, ANDR - Bitwise AND
- XOR, XORR - Bitwise XOR
- CLR, CLRR - Clear to zero

**Control Flow** (8 instructions)
- B - Unconditional branch
- BEQ, BNEQ - Branch on equal/not equal
- J, JR - Jump
- JSR - Jump to subroutine

**Stack** (2 instructions)
- PSHR - Push register to stack
- PULR - Pull register from stack

**Status** (2 instructions)
- TST, TSTR - Test (set flags without storing)
- NOP - No operation

### Phase 2: Advanced Instructions

**Compare** (4 instructions)
- CMP, CMPR, CMPI - Compare operations
- CMP@ - Compare with auto-increment

**Extended Branches** (8 instructions)
- BC, BNC - Branch on carry/no carry
- BMI, BPL - Branch on minus/plus
- BOV, BNOV - Branch on overflow/no overflow
- BEXT - Branch on external condition

**Shifts & Rotates** (6 instructions)
- SLL, SLR - Shift left/right logical
- SAR - Shift arithmetic right
- RLC, RRC - Rotate left/right through carry
- SWAP - Swap bytes

**Arithmetic Extended** (2 instructions)
- ADC, ADCR - Add with carry
- NEG, NEGR - Negate (two's complement)

**System** (6 instructions)
- SDBD - Set double byte data (prefix)
- EIS, DIS - Enable/disable interrupts
- SIN - Software interrupt
- TCI - Test interrupt enable
- HLT - Halt processor
- GSWD, RSWD - Get/restore status word

---

## Instruction Details

### Format

For each instruction, we document:
- **Mnemonic**: Instruction name and variants
- **Opcode**: 10-bit binary pattern
- **Operands**: Addressing modes and operand types
- **Operation**: Pseudocode description
- **Flags**: Effect on C, OV, Z, S flags
- **Cycles**: Base cycles + memory accesses (Phase 2)
- **Examples**: Assembly code examples
- **Edge Cases**: Special behaviors and gotchas
- **Tests**: Required unit test coverage

---

### Data Movement Instructions

#### MVI - Move Immediate

**Mnemonic:** `MVI Rn, #imm`

**Opcode:** `0010 00rr rrii iiii` (without SDBD) or 16-bit immediate (with SDBD)

**Operation:**
```
Rn ← immediate_value
PC ← PC + 1 (or +2 if SDBD active)
```

**Pseudocode:**
```typescript
function MVI(dest: Register, immediate: number): void {
  cpu.setRegister(dest, toUint16(immediate));
  cpu.incrementPC();
  cpu.flags.sign = (immediate & 0x8000) !== 0;
  cpu.flags.zero = immediate === 0;
}
```

**Flags:**
- **C**: Not affected
- **OV**: Not affected
- **Z**: Set if result is zero
- **S**: Set if bit 15 is set

**Cycles:** 8 cycles (base)

**Examples:**
```assembly
MVI R1, #$0042      ; Load 0x0042 into R1 (10-bit immediate)
SDBD
MVI R2, #$1234      ; Load 0x1234 into R2 (16-bit immediate with SDBD)
```

**Edge Cases:**
- Without SDBD: Only bits 0-9 of immediate are used (10-bit value)
- With SDBD: Full 16-bit immediate value
- SDBD flag is automatically cleared after instruction

**Tests:**
- Load various 10-bit values (0x000, 0x3FF, 0x200)
- Load 16-bit values with SDBD (0x0000, 0xFFFF, 0x8000)
- Verify flag settings (Z flag for zero, S flag for negative)
- Verify PC increment (1 without SDBD, 2 with SDBD)

---

#### MVO - Move to Output

**Mnemonic:** `MVO Rn, addr` or `MVO@ Rn, Rm`

**Opcode:** `0011 00rr rrmm dddd` (various addressing modes)

**Operation:**
```
memory[address] ← Rn
If auto-increment mode: Rm ← Rm + 1
PC ← PC + 1
```

**Pseudocode:**
```typescript
function MVO(src: Register, address: number): void {
  const value = cpu.getRegister(src);
  memory.write(address, value);
  cpu.incrementPC();
  // Flags not affected
}

function MVO_AutoIncrement(src: Register, addrReg: Register): void {
  const address = cpu.getRegister(addrReg);
  const value = cpu.getRegister(src);
  memory.write(address, value);
  cpu.setRegister(addrReg, toUint16(address + 1));  // Post-increment
  cpu.incrementPC();
}
```

**Flags:** Not affected

**Cycles:** 9-11 cycles depending on addressing mode

**Examples:**
```assembly
MVO R1, $2F0       ; Store R1 to address 0x02F0
MVO@ R2, R4        ; Store R2 to address in R4, then R4++
```

**Edge Cases:**
- Auto-increment modes (@@R4, @@R5): Address register incremented AFTER write
- Writing to ROM addresses: Implementation should warn/error
- Writing to MMIO regions (Phase 3): Triggers peripheral side effects

**Tests:**
- Write to various RAM addresses
- Auto-increment behavior (verify address increments)
- Write to ROM (should be prevented or warned)
- Verify flags are NOT modified

---

### Arithmetic Instructions

#### ADD - Add

**Mnemonic:** `ADDR Rn, Rm` or `ADD Rn, addr`

**Opcode:** Varies by addressing mode

**Operation:**
```
Rm ← Rm + Rn
Update flags based on result
PC ← PC + 1
```

**Pseudocode:**
```typescript
function ADDR(src: Register, dest: Register): void {
  const srcVal = cpu.getRegister(src);
  const destVal = cpu.getRegister(dest);
  const result = srcVal + destVal;
  const result16 = toUint16(result);

  cpu.setRegister(dest, result16);

  // Update flags
  cpu.flags.sign = (result16 & 0x8000) !== 0;
  cpu.flags.zero = result16 === 0;
  cpu.flags.carry = result > 0xFFFF;
  cpu.flags.overflow = detectSignedOverflow(srcVal, destVal, result16);

  cpu.incrementPC();
}

function detectSignedOverflow(a: number, b: number, result: number): boolean {
  // Overflow occurs when:
  // - Adding two positive numbers yields negative result
  // - Adding two negative numbers yields positive result
  const signA = (a & 0x8000) !== 0;
  const signB = (b & 0x8000) !== 0;
  const signR = (result & 0x8000) !== 0;
  return (signA === signB) && (signR !== signA);
}
```

**Flags:**
- **C**: Set if result > 0xFFFF (carry out)
- **OV**: Set if signed overflow occurred
- **Z**: Set if result is zero
- **S**: Set if bit 15 is set (negative in two's complement)

**Cycles:** 6 cycles (register-to-register)

**Examples:**
```assembly
ADDR R1, R2        ; R2 ← R2 + R1, update flags
ADD R3, $100       ; R3 ← R3 + memory[$100], update flags
```

**Edge Cases:**
- Overflow detection is subtle (see pseudocode)
- Carry vs Overflow: Carry is unsigned, Overflow is signed
- Adding negative numbers: 0xFFFF + 0x0001 = 0x0000 (Z=1, C=1, OV=0)

**Tests:**
- Positive + Positive = Positive (no overflow)
- Positive + Positive = Negative (overflow!)
- Negative + Negative = Negative (no overflow)
- Negative + Negative = Positive (overflow!)
- Result = 0 (Z flag)
- Result > 0xFFFF (C flag)
- All flag combinations

---

#### SUB - Subtract

**Mnemonic:** `SUBR Rn, Rm` or `SUB Rn, addr`

**Opcode:** Varies by addressing mode

**Operation:**
```
Rm ← Rm - Rn
Update flags based on result
PC ← PC + 1
```

**Pseudocode:**
```typescript
function SUBR(src: Register, dest: Register): void {
  const srcVal = cpu.getRegister(src);
  const destVal = cpu.getRegister(dest);
  const result = destVal - srcVal;
  const result16 = toUint16(result);

  cpu.setRegister(dest, result16);

  // Update flags
  cpu.flags.sign = (result16 & 0x8000) !== 0;
  cpu.flags.zero = result16 === 0;
  cpu.flags.carry = destVal >= srcVal;  // Carry = NO borrow
  cpu.flags.overflow = detectSignedOverflowSub(destVal, srcVal, result16);

  cpu.incrementPC();
}

function detectSignedOverflowSub(a: number, b: number, result: number): boolean {
  // Overflow occurs when:
  // - Subtracting negative from positive yields negative
  // - Subtracting positive from negative yields positive
  const signA = (a & 0x8000) !== 0;
  const signB = (b & 0x8000) !== 0;
  const signR = (result & 0x8000) !== 0;
  return (signA !== signB) && (signR !== signA);
}
```

**Flags:**
- **C**: Set if NO borrow (destVal >= srcVal)
- **OV**: Set if signed overflow occurred
- **Z**: Set if result is zero
- **S**: Set if bit 15 is set

**Cycles:** 6 cycles (register-to-register)

**Examples:**
```assembly
SUBR R1, R2        ; R2 ← R2 - R1
SUB R3, $100       ; R3 ← R3 - memory[$100]
```

**Edge Cases:**
- Carry flag semantics: C=1 means NO borrow (opposite of intuition!)
- Subtracting larger from smaller: 0x0001 - 0x0002 = 0xFFFF (C=0, underflow)
- Overflow detection differs from ADD

**Tests:**
- Positive - Positive = Positive
- Positive - Negative = Overflow case
- Negative - Positive = Overflow case
- Result = 0 (Z flag, C flag)
- Underflow cases (C=0)

---

### Logic Instructions

#### AND - Bitwise AND

**Mnemonic:** `ANDR Rn, Rm` or `AND Rn, addr`

**Opcode:** Varies by addressing mode

**Operation:**
```
Rm ← Rm AND Rn
Update flags based on result
PC ← PC + 1
```

**Pseudocode:**
```typescript
function ANDR(src: Register, dest: Register): void {
  const srcVal = cpu.getRegister(src);
  const destVal = cpu.getRegister(dest);
  const result = toUint16(destVal & srcVal);

  cpu.setRegister(dest, result);

  // Update flags
  cpu.flags.sign = (result & 0x8000) !== 0;
  cpu.flags.zero = result === 0;
  cpu.flags.carry = false;  // Cleared
  cpu.flags.overflow = false;  // Cleared

  cpu.incrementPC();
}
```

**Flags:**
- **C**: Cleared
- **OV**: Cleared
- **Z**: Set if result is zero
- **S**: Set if bit 15 is set

**Cycles:** 6 cycles (register-to-register)

**Examples:**
```assembly
ANDR R1, R2        ; R2 ← R2 AND R1
ANDI R3, #$FF      ; R3 ← R3 AND 0x00FF (mask lower byte)
```

**Edge Cases:**
- Commonly used for bit masking
- AND with 0: Always results in 0 (Z=1)
- AND with 0xFFFF: No change (identity)

**Tests:**
- Various bit patterns
- Masking operations (clear upper/lower byte)
- Zero result (Z flag)
- All ones, all zeros

---

#### XOR - Bitwise XOR

**Mnemonic:** `XORR Rn, Rm` or `XOR Rn, addr`

**Opcode:** Varies by addressing mode

**Operation:**
```
Rm ← Rm XOR Rn
Update flags based on result
PC ← PC + 1
```

**Pseudocode:**
```typescript
function XORR(src: Register, dest: Register): void {
  const srcVal = cpu.getRegister(src);
  const destVal = cpu.getRegister(dest);
  const result = toUint16(destVal ^ srcVal);

  cpu.setRegister(dest, result);

  // Update flags
  cpu.flags.sign = (result & 0x8000) !== 0;
  cpu.flags.zero = result === 0;
  cpu.flags.carry = false;  // Cleared
  cpu.flags.overflow = false;  // Cleared

  cpu.incrementPC();
}
```

**Flags:**
- **C**: Cleared
- **OV**: Cleared
- **Z**: Set if result is zero
- **S**: Set if bit 15 is set

**Cycles:** 6 cycles (register-to-register)

**Examples:**
```assembly
XORR R1, R2        ; R2 ← R2 XOR R1
XORR R3, R3        ; R3 ← 0 (XOR with self clears register, sets Z flag)
```

**Edge Cases:**
- XOR with self: Commonly used to clear register (faster than loading 0)
- XOR with 0xFFFF: Bitwise NOT
- XOR is associative and commutative

**Tests:**
- XOR with self (should be 0)
- XOR with 0xFFFF (bitwise NOT)
- Various bit patterns

---

### Control Flow Instructions

#### B - Branch Unconditional

**Mnemonic:** `B addr`

**Opcode:** `0000 00aa aaaa aaaa` (10-bit address)

**Operation:**
```
PC ← address
```

**Pseudocode:**
```typescript
function B(address: number): void {
  cpu.setRegister(7, toUint16(address));  // R7 is PC
  // PC not incremented (already set to branch target)
}
```

**Flags:** Not affected

**Cycles:** 7 cycles

**Examples:**
```assembly
B $5100            ; Jump to address 0x5100
```

**Edge Cases:**
- Direct PC modification (R7 = PC)
- Address limited to 16-bit range
- No return address saved (use JSR for subroutines)

**Tests:**
- Branch to various addresses
- Branch forward/backward
- Verify flags unchanged

---

#### BEQ/BNEQ - Branch on Equal/Not Equal

**Mnemonic:** `BEQ addr` or `BNEQ addr`

**Opcode:** Varies

**Operation:**
```
If (Z flag == condition):
    PC ← address
Else:
    PC ← PC + 1
```

**Pseudocode:**
```typescript
function BEQ(address: number): void {
  if (cpu.flags.zero) {
    cpu.setRegister(7, toUint16(address));
  } else {
    cpu.incrementPC();
  }
}

function BNEQ(address: number): void {
  if (!cpu.flags.zero) {
    cpu.setRegister(7, toUint16(address));
  } else {
    cpu.incrementPC();
  }
}
```

**Flags:** Not affected

**Cycles:** 7 cycles (taken) or 6 cycles (not taken)

**Examples:**
```assembly
CMPR R1, R2        ; Compare R1 with R2 (sets Z if equal)
BEQ equal_label    ; Branch if R1 == R2
```

**Edge Cases:**
- Typically used after CMP, SUB, or arithmetic instructions
- Z flag must be set by previous instruction
- Branch not taken: PC just increments normally

**Tests:**
- Branch taken (Z=1 for BEQ)
- Branch not taken (Z=0 for BEQ)
- Verify cycles differ (taken vs not taken)

---

#### JSR - Jump to Subroutine

**Mnemonic:** `JSR Rn, addr` or `JSR@ Rn`

**Opcode:** Varies by addressing mode

**Operation:**
```
Rn ← PC + 1            ; Save return address
PC ← address           ; Jump to subroutine
```

**Pseudocode:**
```typescript
function JSR(returnReg: Register, address: number): void {
  const returnAddress = toUint16(cpu.getRegister(7) + 1);  // PC + 1
  cpu.setRegister(returnReg, returnAddress);
  cpu.setRegister(7, toUint16(address));  // Jump
  // Typically use R4 or R5 for return address
}
```

**Flags:** Not affected

**Cycles:** 12 cycles

**Examples:**
```assembly
JSR R5, subroutine_label    ; Save return address in R5, jump to subroutine
; ... subroutine code ...
JR R5                       ; Return (jump to address in R5)
```

**Edge Cases:**
- Return address saved in specified register (usually R4 or R5)
- Does NOT use stack automatically (use PSHR/PULR for nested calls)
- JR instruction used to return (Jump Register)

**Tests:**
- Call subroutine, verify return address
- Nested calls (save R5 to stack first)
- Verify flags unchanged

---

### Stack Instructions

#### PSHR - Push Register

**Mnemonic:** `PSHR Rn`

**Opcode:** `0000 01rr r000 0101`

**Operation:**
```
R6 ← R6 + 1            ; Pre-increment stack pointer
memory[R6] ← Rn        ; Push value
PC ← PC + 1
```

**Pseudocode:**
```typescript
function PSHR(reg: Register): void {
  const value = cpu.getRegister(reg);
  const sp = toUint16(cpu.getRegister(6) + 1);  // R6 is stack pointer
  cpu.setRegister(6, sp);  // Pre-increment
  memory.write(sp, value);
  cpu.incrementPC();
}
```

**Flags:** Not affected

**Cycles:** 11 cycles

**Examples:**
```assembly
PSHR R5                ; Push R5 onto stack (save return address)
JSR R5, subroutine     ; Call nested subroutine
PULR R5                ; Restore R5 (original return address)
```

**Edge Cases:**
- Stack grows UPWARD (pre-increment push)
- R6 is stack pointer (typically initialized to $02F0)
- Stack overflow: No automatic detection, can overwrite other RAM

**Tests:**
- Push single value, verify memory write
- Push multiple values, verify stack order
- Verify R6 increments correctly

---

#### PULR - Pull Register

**Mnemonic:** `PULR Rn`

**Opcode:** `0000 01rr r000 0110`

**Operation:**
```
Rn ← memory[R6]        ; Pull value
R6 ← R6 - 1            ; Post-decrement stack pointer
PC ← PC + 1
```

**Pseudocode:**
```typescript
function PULR(reg: Register): void {
  const sp = cpu.getRegister(6);
  const value = memory.read(sp);
  cpu.setRegister(reg, value);
  cpu.setRegister(6, toUint16(sp - 1));  // Post-decrement
  cpu.incrementPC();
}
```

**Flags:** Not affected

**Cycles:** 11 cycles

**Examples:**
```assembly
PSHR R1                ; Save R1
; ... modify R1 ...
PULR R1                ; Restore R1
```

**Edge Cases:**
- Post-decrement (read first, then decrement R6)
- Stack underflow: No automatic detection
- Must match PSHR/PULR pairs

**Tests:**
- Pull after push (should match original value)
- Multiple push/pull sequence
- Verify R6 decrements correctly

---

### Shift & Rotate Instructions (Phase 2)

#### SLL - Shift Left Logical

**Mnemonic:** `SLL Rn` or `SLL Rn, count`

**Opcode:** Varies

**Operation:**
```
Rn ← Rn << 1
Carry ← bit 15 (shifted out)
PC ← PC + 1
```

**Pseudocode:**
```typescript
function SLL(reg: Register): void {
  const value = cpu.getRegister(reg);
  const carry = (value & 0x8000) !== 0;  // Bit 15
  const result = toUint16(value << 1);

  cpu.setRegister(reg, result);
  cpu.flags.carry = carry;
  cpu.flags.sign = (result & 0x8000) !== 0;
  cpu.flags.zero = result === 0;
  cpu.flags.overflow = false;  // Cleared

  cpu.incrementPC();
}
```

**Flags:**
- **C**: Receives bit 15 (shifted out)
- **OV**: Cleared
- **Z**: Set if result is zero
- **S**: Set if bit 15 is set

**Cycles:** 6 cycles

**Examples:**
```assembly
SLL R1                 ; R1 ← R1 << 1, C ← old bit 15
SLL R2, #2             ; R2 ← R2 << 2 (shift left twice)
```

**Edge Cases:**
- Equivalent to multiply by 2
- Carry flag captures bit shifted out
- Use >>> instead of >> in JavaScript for unsigned shift

**Tests:**
- Shift various values (0, 1, 0x8000, 0xFFFF)
- Verify carry flag
- Multi-bit shifts

---

## Bit-Level Operations in TypeScript

### JavaScript Numeric Pitfalls

JavaScript's bitwise operators treat operands as **32-bit signed integers**, which causes problems for 16-bit emulation:

**Problem Example:**
```typescript
let value = 0xFFFF;
value = value + 1;  // 0x10000 (32-bit result)
// Need to mask to 16 bits!
```

**Solution: Explicit Masking**

```typescript
// Utility functions (in packages/core/src/utils/bit-ops.ts)

/**
 * Mask value to unsigned 16-bit (0x0000 - 0xFFFF)
 */
export function toUint16(value: number): number {
  return (value & 0xFFFF) >>> 0;  // >>> 0 ensures unsigned
}

/**
 * Mask value to unsigned 10-bit (0x000 - 0x3FF)
 * Used for instruction decoding
 */
export function toUint10(value: number): number {
  return (value & 0x3FF) >>> 0;
}

/**
 * Sign-extend 10-bit value to 16-bit
 * Used for branch offsets
 */
export function signExtend10to16(value: number): number {
  if (value & 0x200) {  // Bit 9 set (negative)
    return (value | 0xFC00) & 0xFFFF;  // Extend sign bits
  }
  return value & 0x3FF;
}

/**
 * Extract bit field from value
 */
export function extractBits(value: number, start: number, length: number): number {
  const mask = (1 << length) - 1;
  return (value >>> start) & mask;
}
```

### Shift Operations

**Critical:** Use unsigned right shift (`>>>`) for logical shifts, not signed shift (`>>`):

```typescript
// WRONG - Signed shift
const logicalShift = value >> 1;  // Extends sign bit!

// RIGHT - Unsigned shift
const logicalShift = (value >>> 1) & 0xFFFF;
```

### Flag Calculation Helpers

```typescript
/**
 * Detect signed overflow for addition
 */
export function detectAddOverflow(a: number, b: number, result: number): boolean {
  // Overflow when: same sign inputs, different sign output
  const signA = (a & 0x8000) !== 0;
  const signB = (b & 0x8000) !== 0;
  const signR = (result & 0x8000) !== 0;
  return (signA === signB) && (signR !== signA);
}

/**
 * Detect signed overflow for subtraction
 */
export function detectSubOverflow(a: number, b: number, result: number): boolean {
  // Overflow when: different sign inputs, output != a sign
  const signA = (a & 0x8000) !== 0;
  const signB = (b & 0x8000) !== 0;
  const signR = (result & 0x8000) !== 0;
  return (signA !== signB) && (signR !== signA);
}

/**
 * Update flags after arithmetic/logic operation
 */
export function updateFlags(result: number, carry: boolean, overflow: boolean): Flags {
  return {
    sign: (result & 0x8000) !== 0,
    zero: (result & 0xFFFF) === 0,
    carry,
    overflow,
  };
}
```

---

## Flag Semantics

### Flag Definitions

**Sign Flag (S)**
- Set if bit 15 of result is 1 (negative in two's complement)
- Cleared if bit 15 is 0 (positive or zero)
- Some operations use bit 7 instead (8-bit operations)

**Zero Flag (Z)**
- Set if result equals 0x0000 after masking to 16 bits
- Cleared if result is non-zero
- Used for equality tests (BEQ/BNEQ)

**Carry Flag (C)**
- **Addition**: Set if result > 0xFFFF (carry out of bit 15)
- **Subtraction**: Set if NO borrow (result >= 0, dest >= src)
- **Shifts**: Receives bit shifted out
- **Logic ops**: Typically cleared

**Overflow Flag (OV)**
- Set if signed arithmetic produces incorrect result
- Addition: Both operands same sign, result different sign
- Subtraction: Operands different sign, result wrong sign
- Used for signed comparisons

### Flag Behavior by Instruction Type

**Arithmetic (ADD, SUB, INC, DEC):**
- All flags affected (S, Z, C, OV)

**Logic (AND, XOR, OR):**
- S and Z affected based on result
- C and OV cleared

**Shifts (SLL, SLR, SAR, RLC, RRC):**
- S and Z affected based on result
- C receives bit shifted out
- OV cleared

**Data Movement (MOV, MVI, MVO):**
- Some variants affect S and Z
- C and OV typically not affected

**Control Flow (B, BEQ, JSR):**
- No flags affected

**Stack (PSHR, PULR):**
- No flags affected

### Signed vs Unsigned Interpretation

**Unsigned:**
- 0x0000 = 0
- 0x8000 = 32768
- 0xFFFF = 65535
- Use Carry flag for overflow

**Signed (Two's Complement):**
- 0x0000 = 0
- 0x7FFF = +32767
- 0x8000 = -32768
- 0xFFFF = -1
- Use Overflow flag for overflow

---

## Memory System

### Address Space

**Total:** 64K words (16-bit each) = 128KB

**Memory Regions (Phase 1):**
```
$0000-$003F: STIC Registers (64 words) - Phase 3, treated as RAM in Phase 1
$0040-$00FF: Reserved (192 words)
$0100-$01EF: 8-bit RAM (240 bytes) - General purpose
$01F0-$01FF: Reserved (16 words)
$0200-$02EF: BACKTAB (240 words) - Screen card data, Phase 3
$02F0-$0318: Stack (40 words) - Typical stack location
$0319-$031C: Reserved (4 words)
$031D-$035C: MOB Data (64 words) - Sprite data, 8 MOBs × 8 words, Phase 3
$035D-$03FF: Reserved (163 words)
$1000-$1FFF: Exec ROM (4096 words) - System BIOS
$2000-$2FFF: ECS ROM (4096 words) - Entertainment Computer System, optional
$3000-$37FF: GROM (2048 words) - Graphics ROM, 256 characters
$3800-$39FF: GRAM (512 words) - Graphics RAM, 64 custom characters
$4000-$4FFF: Reserved (4096 words)
$5000-$6FFF: Cartridge ROM (8192 words) - Typical game ROM location
$7000-$7FFF: Extra ROM (4096 words) - Extended cartridge space
$8000-$FFFF: Unmapped (32768 words)
```

### ROM vs RAM

**ROM Regions:**
- $1000-$1FFF (Exec ROM)
- $3000-$37FF (GROM)
- $5000-$6FFF (Cartridge ROM)
- Writes should be prevented or logged as errors

**RAM Regions:**
- $0100-$01EF (General RAM)
- $0200-$035F (Video RAM - BACKTAB, Stack, MOB data)
- $3800-$39FF (GRAM)

**Implementation:**
```typescript
class Memory {
  private memory: Uint16Array;  // 64K words
  private romMask: Uint8Array;  // 1 bit per word: ROM=1, RAM=0

  write(address: number, value: number): void {
    address = toUint16(address);
    if (this.romMask[address]) {
      throw new Error(`Attempted write to ROM address $${address.toString(16).toUpperCase()}`);
    }
    this.memory[address] = toUint16(value);
  }
}
```

### Memory-Mapped I/O (Phase 3)

**STIC Registers ($0000-$003F):**
- Will trigger graphics chip side effects
- Phase 1: Treat as regular RAM

**Implementation Strategy:**
- Phase 1: No special handling
- Phase 3: Add peripheral device handlers

---

## Edge Cases

### SDBD Prefix Behavior

**SDBD** (Set Double Byte Data) affects the NEXT instruction only:

```assembly
SDBD
MVI R1, #$1234         ; 16-bit immediate (2 decles read)
MVI R2, #$42           ; 10-bit immediate (SDBD cleared)
```

**Implementation:**
```typescript
function executeSDBD(): void {
  cpu.sdbd = true;        // Set flag
  cpu.incrementPC();
  // Next instruction sees sdbd=true, uses 16-bit immediate
  // After that instruction, sdbd automatically cleared
}
```

**Edge Cases:**
- SDBD before another SDBD: Second SDBD treated as regular instruction with first SDBD active (meaningless)
- SDBD before instruction that doesn't use immediate: SDBD wasted, cleared anyway
- SDBD flag must be cleared after EVERY instruction execution

### Stack Pointer Management

**Stack Grows Upward:**
```
Push: R6 ← R6 + 1, then write
Pull: Read, then R6 ← R6 - 1
```

**Typical Stack:**
- Initialized to $02F0
- Grows toward $0318 (40 words available)
- Overflow: Wraps or corrupts MOB data

**Nested Subroutines:**
```assembly
JSR R5, outer          ; R5 ← return address
outer:
    PSHR R5            ; Save R5 on stack
    JSR R5, inner      ; R5 ← new return address
inner:
    ; ... code ...
    JR R5              ; Return to outer
    ; Back in outer
    PULR R5            ; Restore original R5
    JR R5              ; Return to caller
```

### Register Aliasing (R7 = PC)

**R7 is the Program Counter:**
```assembly
MOVR R7, R1            ; R1 ← PC (read PC value)
MOVR R1, R7            ; PC ← R1 (jump to address in R1!)
```

**Edge Cases:**
- Reading R7: Returns current PC
- Writing R7: Changes execution flow (like a jump)
- Incrementing R7: Skips instructions

**Use Cases:**
- Position-independent code
- Computed jumps (jump tables)
- Self-modifying code (generally avoided)

### Conditional Branch Timing

**Taken vs Not Taken:**
- Branch taken: 7 cycles (fetch new instruction)
- Branch not taken: 6 cycles (continue sequentially)

**Testing:**
```typescript
test('BEQ timing', () => {
  cpu.flags.zero = true;
  const startCycles = cpu.cycleCount;
  executeBEQ(0x5100);
  expect(cpu.cycleCount - startCycles).toBe(7);  // Branch taken

  cpu.flags.zero = false;
  const startCycles2 = cpu.cycleCount;
  executeBEQ(0x5100);
  expect(cpu.cycleCount - startCycles2).toBe(6);  // Branch not taken
});
```

---

## Validation Strategy

### Unit Tests (Per Instruction)

**Test Structure:**
```typescript
describe('MVI instruction', () => {
  let cpu: CPU;
  let memory: Memory;
  let decoder: Decoder;
  let executor: Executor;

  beforeEach(() => {
    memory = new Memory();
    cpu = new CPU(memory);
    decoder = new Decoder(memory);
    executor = new Executor(cpu, memory);
  });

  test('loads 10-bit immediate', () => {
    memory.write(0x5000, 0b0010_0001_0010_1010);  // MVI R1, #42
    cpu.setRegister(7, 0x5000);  // Set PC

    const inst = decoder.decode(0x5000, false);
    executor.execute(inst);

    expect(cpu.getRegister(1)).toBe(42);
    expect(cpu.flags.zero).toBe(false);
    expect(cpu.getRegister(7)).toBe(0x5001);  // PC incremented
  });

  test('loads 16-bit immediate with SDBD', () => {
    memory.write(0x5000, 0b0000_0000_0000_0001);  // SDBD
    memory.write(0x5001, 0b0010_0001_0000_0000);  // MVI R1, #$1234 (part 1)
    memory.write(0x5002, 0b0010_0101_0011_0100);  // (part 2)
    cpu.setRegister(7, 0x5000);

    executor.execute(decoder.decode(0x5000, false));  // SDBD
    executor.execute(decoder.decode(0x5001, cpu.sdbd));  // MVI with SDBD

    expect(cpu.getRegister(1)).toBe(0x1234);
    expect(cpu.sdbd).toBe(false);  // Cleared
    expect(cpu.getRegister(7)).toBe(0x5003);  // PC += 3
  });
});
```

### Integration Tests (Instruction Sequences)

**Test Real Code Patterns:**
```typescript
describe('Subroutine call/return', () => {
  test('JSR and JR', () => {
    // Setup: Load small program
    memory.write(0x5000, encodeJSR(5, 0x5100));  // JSR R5, $5100
    memory.write(0x5001, encodeNOP());           // (after return)
    memory.write(0x5100, encodeNOP());           // subroutine
    memory.write(0x5101, encodeJR(5));           // JR R5

    cpu.setRegister(7, 0x5000);

    // Execute JSR
    cpu.step();
    expect(cpu.getRegister(7)).toBe(0x5100);  // Jumped
    expect(cpu.getRegister(5)).toBe(0x5001);  // Return address saved

    // Execute subroutine (NOP)
    cpu.step();

    // Execute JR (return)
    cpu.step();
    expect(cpu.getRegister(7)).toBe(0x5001);  // Returned
  });
});
```

### jzIntv Validation (Phase 2)

**Approach:**
1. Apply minimal patch to jzIntv to output execution trace
2. Run same ROM on both emulators
3. Compare traces line-by-line
4. Report first divergence

**Trace Format:**
```
[PC] [Instruction] [R0-R7] [Flags] [MemWrites]
5000 MVI R1,#42   0000 002A 0000 0000 0000 0000 02F0 5001  Z=0 S=0 C=0 OV=0
5001 ADDR R1,R2   0000 002A 006C 0000 0000 0000 02F0 5002  Z=0 S=0 C=0 OV=0
...
```

**Validation Tool:**
```typescript
class TraceValidator {
  compareTrac es(pkTrace: Trace[], jzTrace: Trace[]): ValidationResult {
    for (let i = 0; i < Math.min(pkTrace.length, jzTrace.length); i++) {
      const pk = pkTrace[i];
      const jz = jzTrace[i];

      if (pk.pc !== jz.pc) {
        return {
          divergence: i,
          message: `PC mismatch at step ${i}: pk=${hex(pk.pc)} jz=${hex(jz.pc)}`,
        };
      }

      if (!registersMatch(pk.registers, jz.registers)) {
        return {
          divergence: i,
          message: `Register mismatch at step ${i}`,
          details: diffRegisters(pk.registers, jz.registers),
        };
      }

      // Check flags, memory, etc.
    }

    return { success: true };
  }
}
```

### Test ROM Collection

**Phase 1 Test ROMs:**
1. **basic-ops.rom**: ADD, SUB, MOV, MVI, MVO
2. **branches.rom**: All branch instructions
3. **stack.rom**: PSHR, PULR, nested calls
4. **addressing.rom**: All addressing modes
5. **sdbd.rom**: SDBD with various instructions

**Phase 2 Test ROMs:**
6. **shifts.rom**: SLL, SLR, SAR, RLC, RRC, SWAP
7. **edge-cases.rom**: Overflow, underflow, wrapping
8. **full-isa.rom**: All 50 instructions

**Commercial ROM:**
9. **Air Strike.bin**: Real Intellivision game for validation

### Coverage Requirements

**Phase 1:** >90% line coverage on core modules
**Phase 2:** >95% line coverage overall

**Critical Paths:** 100% coverage
- Instruction decoding
- Flag calculation
- Memory reads/writes
- PC management

---

## Implementation Checklist

### Per-Instruction Checklist

For each instruction:

- [ ] Add to `Opcode` enum
- [ ] Implement decoder logic (extract operands from opcode)
- [ ] Implement executor handler
- [ ] Calculate flags correctly (C, OV, Z, S)
- [ ] Write unit tests (3+ test cases per instruction)
- [ ] Test edge cases (zero, overflow, negative, max values)
- [ ] Test SDBD interaction (if immediate operand)
- [ ] Document cycle timing (Phase 2)
- [ ] Validate against jzIntv (Phase 2)

### Phase 1 Priority Order

1. **Data movement**: MVI, MVO, MOV (needed to manipulate data)
2. **Arithmetic**: ADD, SUB, INC, DEC (basic calculations)
3. **Logic**: AND, XOR, CLR (bit manipulation)
4. **Control flow**: B, BEQ, BNEQ, J (branching)
5. **Subroutines**: JSR, JR (function calls)
6. **Stack**: PSHR, PULR (call stack)
7. **Status**: NOP, TST (testing and no-ops)

**Target:** ~20 instructions for Phase 1 MVP

### Phase 2 Complete ISA

8. **Compare**: CMP, CMPR, CMPI
9. **Extended branches**: BC, BNC, BMI, BPL, BOV, BNOV
10. **Shifts**: SLL, SLR, SAR, RLC, RRC, SWAP
11. **Advanced arithmetic**: ADC, NEG
12. **System**: SDBD, EIS, DIS, HLT, GSWD, RSWD

**Target:** All ~50 instructions

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-08 | Peter/Claude | Initial CPU specification document |

---

**Next Steps:**
1. ✅ PRD.md complete
2. ✅ ARCHITECTURE.md complete
3. ✅ CPU_SPECIFICATION.md complete (this document)
4. ⏳ MCP_API.md (complete MCP interface reference)
5. ⏳ PROJECT_SETUP.md (repository structure and build setup)
6. ⏳ USER_GUIDE.md (provisional user documentation)
