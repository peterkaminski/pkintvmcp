# CP-1600 Instruction Encoding Reference

**Purpose:** Quick reference for instruction bit patterns during decoder implementation.
**Version:** 1.0
**Date:** 2025-12-08

---

## Encoding Overview

### Instruction Format
```
15  14  13  12  11  10  9   8   7   6   5   4   3   2   1   0
[   UNUSED (6 bits)   ][ OPCODE AND OPERANDS (10 bits)      ]
```

- **Bits 15-10**: Unused in CP-1600 (reserved for future use)
- **Bits 9-0**: Actual instruction (10-bit "decle")
- **Bit 9**: Often indicates instruction class (internal vs external reference)

### Key Conventions
- `rr` or `rrr` = Register field (R0-R7)
- `mmm` = Addressing mode / source register
- `iiii` or `iiiiiiii` = Immediate value
- `dddd` or `dddddddd` = Displacement / address
- `0` or `1` = Fixed bit value
- `x` = Don't care

### Addressing Mode Encoding (Common Pattern)
```
00 = Direct
01 = Indirect
10 = Immediate
11 = Special (varies by instruction)
```

---

## Phase 1 Instructions (Core MVP)

### Data Movement

#### MVI - Move Immediate to Register
```
Opcode: 0010 00rr rr-- ----
        [ 2  ][ R ][mode ]

Without SDBD: Next word is ignored, use embedded immediate
With SDBD: Read next 2 words for 16-bit immediate

Examples:
  0010 0001 0010 1010  = MVI R1, #42 (0x028A)
  0010 0010 0000 0000  = MVI R2, #0  (with SDBD, read next words)
```

#### MVO - Move to Output (Memory)
```
Opcode: 0011 00rr rrmm dddd
        [ 3  ][ R ][M ][Disp]

Modes (mm):
  00 = Direct addressing
  01 = Indirect via register
  10 = Stack operations (R6)
  11 = Auto-increment (@@R4, @@R5)

Example:
  0011 0001 0100 0000  = MVO R1, $0040
```

#### MOVR - Move Register to Register
```
Opcode: 0000 001s ssdd d000
        [ 0  ][ Src][ Dst ]

Examples:
  0000 0010 0110 0000  = MOVR R1, R3 (copy R1 to R3)
  0000 0011 1111 0000  = MOVR R7, R7 (NOP-like, sets flags)
```

### Arithmetic

#### ADDR - Add Register to Register
```
Opcode: 0000 010s ssdd d000
        [ 0  ][ Src][ Dst ]

Operation: Dst ← Dst + Src
Flags: C, OV, Z, S all affected

Example:
  0000 0100 0110 0000  = ADDR R1, R3 (R3 += R1)
```

#### SUBR - Subtract Register from Register
```
Opcode: 0000 011s ssdd d000
        [ 0  ][ Src][ Dst ]

Operation: Dst ← Dst - Src
Flags: C, OV, Z, S all affected

Example:
  0000 0110 0110 0000  = SUBR R1, R3 (R3 -= R1)
```

#### INCR - Increment Register
```
Opcode: 0000 101r rr00 0000
        [ 0  ][ R  ]

Operation: R ← R + 1
Flags: Z, S affected; C, OV not affected

Example:
  0000 1010 1000 0000  = INCR R2
```

#### DECR - Decrement Register
```
Opcode: 0000 110r rr00 0000
        [ 0  ][ R  ]

Operation: R ← R - 1
Flags: Z, S affected; C, OV not affected

Example:
  0000 1101 1000 0000  = DECR R2
```

### Logic Operations

#### ANDR - AND Register with Register
```
Opcode: 0000 100s ssdd d000
        [ 0  ][ Src][ Dst ]

Operation: Dst ← Dst AND Src
Flags: Z, S affected; C, OV cleared

Example:
  0000 1000 0110 0000  = ANDR R1, R3 (R3 &= R1)
```

#### XORR - XOR Register with Register
```
Opcode: 0000 111s ssdd d000
        [ 0  ][ Src][ Dst ]

Operation: Dst ← Dst XOR Src
Flags: Z, S affected; C, OV cleared

Special case (CLRR):
  0000 1110 0100 0000  = XORR R1, R1 (clears R1 to zero)
```

### Control Flow

#### B - Unconditional Branch
```
Opcode: 0010 0100 dddd dddd
        [ 2  ][ 4  ][Disp  ]

Operation: PC ← PC + 2 + sign_extend(disp)
Displacement: -128 to +127 (signed 8-bit)

Example:
  0010 0100 0000 1010  = B $+10 (branch forward 10 words)
```

#### BEQ / BNEQ - Branch on Equal / Not Equal
```
BEQ:  0010 0101 dddd dddd  (Branch if Z = 1)
BNEQ: 0010 0110 dddd dddd  (Branch if Z = 0)

Operation: If condition, PC ← PC + 2 + sign_extend(disp)

Example:
  0010 0101 1111 1100  = BEQ $-4 (branch back 4 if zero)
```

#### BC / BNC - Branch on Carry / No Carry
```
BC:   0010 0010 dddd dddd  (Branch if C = 1)
BNC:  0010 0011 dddd dddd  (Branch if C = 0)

Example:
  0010 0010 0000 0101  = BC $+5 (branch if carry set)
```

#### J - Jump (Absolute)
```
Opcode: 0000 0010 0000 0100
        [Next word contains jump address]

Operation: PC ← address (from next word)
Length: 2 words

Example:
  0000 0010 0000 0100  ; J instruction
  0001 0000 0000 0000  ; Jump to $1000
```

#### JR - Jump to Register
```
Opcode: 0000 001s ss11 1000
        [ 0  ][ R ]

Operation: PC ← Rs
Special: Effectively MOVR Rs, R7

Example:
  0000 0010 0111 1000  = JR R1 (jump to address in R1)
```

#### JSR - Jump to Subroutine
```
Opcode: 0000 0010 0000 0001
        [Next 2 words: return reg, jump address]

Operation:
  R4/R5/R6 ← PC + 3 (return address)
  PC ← address

Example:
  0000 0010 0000 0001  ; JSR instruction
  0000 0010 0100 0000  ; Use R5 for return
  0001 0000 0000 0000  ; Jump to $1000
```

### Stack Operations

#### PSHR - Push Register to Stack
```
Opcode: 0010 0111 01rr r110
        [ 2  ][ 7  ][ R ]

Operation:
  @R6 ← Rn
  R6 ← R6 + 1

Example:
  0010 0111 0100 1110  = PSHR R1 (push R1 to stack)
```

#### PULR - Pull from Stack to Register
```
Opcode: 0010 1000 00rr r110
        [ 2  ][ 8  ][ R ]

Operation:
  R6 ← R6 - 1
  Rn ← @R6

Example:
  0010 1000 0000 1110  = PULR R1 (pop stack to R1)
```

### Status / Testing

#### TSTR - Test Register
```
Opcode: 0000 001s ss00 0000
        [ 0  ][ R  ]

Operation: Set flags based on register value (no store)
Effectively: MOVR R, R
Flags: Z, S affected

Example:
  0000 0010 0100 0000  = TSTR R1
```

#### NOP - No Operation
```
Opcode: 0000 1010 0000 0000
        [ 0  ][10 ][  0  ]

Operation: None (effectively INCR R0 then DECR R0)

Example:
  0000 1010 0000 0000  = NOP
```

### Special

#### SDBD - Set Double Byte Data
```
Opcode: 0000 0001 0000 0000
        [ 0  ][ 1  ][  0  ]

Operation: Set flag for next instruction to use 16-bit immediate
Length: Always followed by another instruction
Effect: Next instruction reads 2 words instead of embedded immediate

Example:
  0000 0001 0000 0000  ; SDBD
  0010 0001 0000 0000  ; MVI R1, (next 16-bit value)
  xxxx xxxx xxxx xxxx  ; Low bits of immediate
  yyyy yyyy yyyy yyyy  ; High bits of immediate
```

#### HLT - Halt
```
Opcode: 0000 0000 0000 0000
        [ 0  ][ 0  ][  0  ]

Operation: Stop processor execution

Example:
  0000 0000 0000 0000  = HLT
```

---

## Phase 2 Instructions (Extended Set)

### Compare Operations

#### CMPR - Compare Registers
```
Opcode: 0000 101s ssdd d000
        [ 0  ][ Src][ Dst ]

Operation: Dst - Src (result discarded, flags set)
Flags: C, OV, Z, S all affected

Example:
  0000 1010 0110 0000  = CMPR R1, R3
```

### Extended Branches

#### BMI / BPL - Branch on Minus / Plus
```
BMI: 0010 0111 dddd dddd  (Branch if S = 1)
BPL: 0010 1000 dddd dddd  (Branch if S = 0)
```

#### BOV / BNOV - Branch on Overflow / No Overflow
```
BOV:  0010 1001 dddd dddd  (Branch if OV = 1)
BNOV: 0010 1010 dddd dddd  (Branch if OV = 0)
```

### Shifts and Rotates

#### SLL - Shift Logical Left
```
Opcode: 0010 0100 10rr r00n
        [ 2  ][ 4  ][ R ][N]

n = 0: Shift 1 position
n = 1: Shift 2 positions

Example:
  0010 0100 1001 0000  = SLL R1, 1
```

#### RLC - Rotate Left through Carry
```
Opcode: 0010 0101 10rr r00n
        [ 2  ][ 5  ][ R ][N]

Operation: Rotate left, C becomes bit 0, bit 15 becomes C

Example:
  0010 0101 1001 0001  = RLC R1, 2
```

### System Instructions

#### EIS - Enable Interrupt System
```
Opcode: 0000 0011 0000 0000
        [ 0  ][ 3  ][  0  ]

Operation: Enable interrupts

Example:
  0000 0011 0000 0000  = EIS
```

#### DIS - Disable Interrupt System
```
Opcode: 0000 0100 0000 0000
        [ 0  ][ 4  ][  0  ]

Operation: Disable interrupts

Example:
  0000 0100 0000 0000  = DIS
```

---

## Decoding Algorithm (High-Level)

### Step 1: Extract Bit Fields
```typescript
const word = memory.read(address) & 0x3FF;  // 10-bit mask
const bit9 = (word >> 9) & 1;
const bits8_7 = (word >> 7) & 3;
const bits6_4 = (word >> 4) & 7;
const bits3_0 = word & 0xF;
```

### Step 2: Determine Instruction Class

**Bit 9 = 1: External Reference (Memory Operations)**
- MVI, MVO, ADD, SUB, AND, XOR, CMP
- Branches (B, BEQ, BNEQ, etc.)
- These typically access memory or use immediates

**Bit 9 = 0: Internal Reference (Register Operations)**
- MOVR, ADDR, SUBR, INCR, DECR
- ANDR, XORR
- Shifts, rotates
- Control (HLT, SDBD, EIS, DIS)

### Step 3: Match Opcode Pattern

**For External Reference (bit 9 = 1):**
```typescript
if (bits8_7 === 0b00) {
  // MVI or related
} else if (bits8_7 === 0b01) {
  // Branches
} else if (bits8_7 === 0b10) {
  // MVO or stack ops
}
```

**For Internal Reference (bit 9 = 0):**
```typescript
if (bits8_6 === 0b000) {
  // HLT, SDBD, EIS, DIS, J, JSR
} else if (bits8_6 === 0b001) {
  // MOVR
} else if (bits8_6 === 0b010) {
  // ADDR
}
```

### Step 4: Extract Operands

**Register Fields:**
```typescript
const srcReg = (word >> 6) & 0x7;  // 3-bit register
const dstReg = (word >> 3) & 0x7;  // 3-bit register
```

**Immediate Values:**
```typescript
// 8-bit immediate (common in branches)
const imm8 = word & 0xFF;

// 10-bit immediate (full word)
const imm10 = word & 0x3FF;

// 16-bit immediate (with SDBD)
if (sdbdActive) {
  const low = memory.read(address + 1) & 0xFF;
  const high = memory.read(address + 2) & 0xFF;
  immediate = (high << 8) | low;
}
```

---

## Important Notes for Implementation

### Register R7 is Program Counter
- Writing to R7 is a jump
- R7 auto-increments after each instruction fetch
- MOVR Rs, R7 is equivalent to JR Rs

### SDBD Handling
- SDBD is not a standalone instruction - it's a prefix
- After decoding SDBD, set a flag and continue to next instruction
- The flagged instruction uses 16-bit immediate mode
- Flag is automatically cleared after instruction execution

### Flag Calculation
```typescript
// Zero flag
flags.zero = (result & 0xFFFF) === 0;

// Sign flag (bit 15)
flags.sign = (result & 0x8000) !== 0;

// Carry flag (17th bit for add/subtract)
flags.carry = result > 0xFFFF;  // For addition
flags.carry = result < 0;        // For subtraction

// Overflow flag (signed overflow)
// True when sign of inputs matches but differs from result
const srcSign = (src & 0x8000) !== 0;
const dstSign = (dst & 0x8000) !== 0;
const resSign = (result & 0x8000) !== 0;
flags.overflow = (srcSign === dstSign) && (srcSign !== resSign);
```

### Cycle Timing (Phase 2)
- Register-to-register: 6 or 7 cycles (7 if R6/R7 is destination)
- Memory operations: Add memory access cycles
- Branches: 7 cycles (9 if taken for unconditional)
- Formula: Base + W*memory_accesses (W = wait states)

---

## Quick Reference Table

| Instruction | Opcode Pattern | Cycles | Flags |
|-------------|----------------|--------|-------|
| HLT | `0000 0000 0000 0000` | 4 | - |
| SDBD | `0000 0001 0000 0000` | 4 | - |
| EIS | `0000 0011 0000 0000` | 4 | - |
| DIS | `0000 0100 0000 0000` | 4 | - |
| J | `0000 0010 0000 0100` + addr | 12 | - |
| JSR | `0000 0010 0000 0001` + reg + addr | 12 | - |
| MOVR | `0000 001s ssdd d000` | 6/7 | Z, S |
| ADDR | `0000 010s ssdd d000` | 6/7 | C, OV, Z, S |
| SUBR | `0000 011s ssdd d000` | 6/7 | C, OV, Z, S |
| CMPR | `0000 101s ssdd d000` | 6/7 | C, OV, Z, S |
| ANDR | `0000 100s ssdd d000` | 6/7 | Z, S (C=0, OV=0) |
| XORR | `0000 111s ssdd d000` | 6/7 | Z, S (C=0, OV=0) |
| INCR | `0000 101r rr00 0000` | 6/7 | Z, S |
| DECR | `0000 110r rr00 0000` | 6/7 | Z, S |
| MVI | `0010 00rr rr-- ----` | 8 | Z, S |
| MVO | `0011 00rr rrmm dddd` | 9-11 | - |
| B | `0010 0100 dddd dddd` | 9 | - |
| BEQ | `0010 0101 dddd dddd` | 7/9 | - |
| BNEQ | `0010 0110 dddd dddd` | 7/9 | - |
| BC | `0010 0010 dddd dddd` | 7/9 | - |
| BNC | `0010 0011 dddd dddd` | 7/9 | - |
| PSHR | `0010 0111 01rr r110` | 9 | - |
| PULR | `0010 1000 00rr r110` | 11 | - |
| NOP | `0000 1010 0000 0000` | 6 | - |
| TSTR | `0000 001r rr00 0000` | 6/7 | Z, S |

---

## Resources for Detailed Information

- **docs/CPU_SPECIFICATION.md**: Full instruction details with pseudocode
- **docs/resources-guide.md**: Guide to reference materials
- **resources/jzintv-20200712-src/doc/programming/cp1600_summary.txt**: Concise instruction reference
- **resources/CP-1600_Microprocessor_Instruction_Set_Simplified_Presentation.md.txt**: Detailed instruction descriptions

---

**Last Updated:** 2025-12-08
**For:** Sprint 1.2 (Instruction Decoder Implementation)
