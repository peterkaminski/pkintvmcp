# Example 04: Bit Manipulation

Demonstrates bit-level operations including shifts, rotates, and masking.

**Note**: This example uses Sprint 1.6 instructions (SLL, SLR, SAR, RLC, SWAP) that are planned but not yet implemented.

## What This Does

Shows five common bit manipulation techniques:
1. Extract high byte by shifting right 8 times
2. Extract low byte using AND mask
3. Swap bytes (high ↔ low)
4. Rotate left through carry
5. Arithmetic shift right (preserve sign bit)

## Instructions Used

- **SLL** (Shift Logical Left): Shift left, fill with 0
- **SLR** (Shift Logical Right): Shift right, fill with 0
- **SAR** (Shift Arithmetic Right): Shift right, preserve sign bit
- **RLC** (Rotate Left through Carry): 17-bit rotation (16 bits + C flag)
- **SWAP** (Swap Bytes): Exchange high and low bytes
- **ANDR** (AND Register): Bitwise AND for masking
- **ANDI** (AND Immediate): Immediate form of AND
- **MVI**, **MOVR**, **HLT**: Supporting instructions

## Execution Flow

```
Initialize: R0 = $1234

Example 1: Extract High Byte (Shift Method)
  R1 = $1234 → (shift right 8×) → R1 = $0012

Example 2: Extract Low Byte (Mask Method)
  R2 = $1234 → AND $00FF → R2 = $0034

Example 3: Swap Bytes
  R3 = $1234 → SWAP → R3 = $3412

Example 4: Rotate Through Carry
  R4 = $8001 → RLC → $0002 (C=1) → RLC → $0005 (C=0)

Example 5: Arithmetic Shift (Sign Preserving)
  R5 = $F000 → SAR → $F800 → SAR → $FC00
  (All values remain negative)
```

## Expected Final State

```
Registers:
  R0 = $1234  - Original value (0001 0010 0011 0100)
  R1 = $0012  - High byte extracted (0000 0000 0001 0010)
  R2 = $0034  - Low byte extracted (0000 0000 0011 0100)
  R3 = $3412  - Bytes swapped (0011 0100 0001 0010)
  R4 = $0005  - After rotates (0000 0000 0000 0101)
  R5 = $FC00  - After arithmetic shifts (1111 1100 0000 0000)

Flags: (from last SAR instruction)
  S = 1  (result is negative)
  Z = 0  (result is non-zero)
  OV = 0 (cleared by shift operations)
  C = 0  (last shifted bit was 0)

Status:
  Halted = true
```

## Key Concepts

### Shift Operations

**SLL** - Shift Logical Left:
```
Before: 0001 0010 0011 0100 ($1234)
After:  0010 0100 0110 1000 ($2468)
        ←←←←←←←←←←←←←←←← 0
        C ← bit 15, bit 0 ← 0
```

**SLR** - Shift Logical Right:
```
Before: 0001 0010 0011 0100 ($1234)
After:  0000 1001 0001 1010 ($091A)
        0 →→→→→→→→→→→→→→→→
        bit 15 ← 0, C ← bit 0
```

**SAR** - Shift Arithmetic Right (Sign-Preserving):
```
Before: 1111 0000 0000 0000 ($F000, negative)
After:  1111 1000 0000 0000 ($F800, still negative)
        S →→→→→→→→→→→→→→→→
        bit 15 ← old bit 15 (sign), C ← bit 0
```

### Rotate Operations

**RLC** - Rotate Left through Carry:
```
17-bit rotation: [C][15 14 13 ... 2 1 0]

Example with $8001 (C initially 0):
Before: C=0, R4=1000 0000 0000 0001
After:  C=1, R4=0000 0000 0000 0010
        Bit 15 → C, C → bit 0

Second RLC:
Before: C=1, R4=0000 0000 0000 0010
After:  C=0, R4=0000 0000 0000 0101
        Bit 15 → C, C → bit 0
```

### Masking with AND

Extract low byte:
```
Value:  0001 0010 0011 0100 ($1234)
Mask:   0000 0000 1111 1111 ($00FF)
AND:    0000 0000 0011 0100 ($0034)
```

Extract specific bits:
```
ANDI #$00F0, R0   ; Extract bits 4-7
ANDI #$0001, R0   ; Test if bit 0 is set
```

### SWAP Instruction

```
Before: [high byte][low byte] = $1234
After:  [low byte][high byte] = $3412

Equivalent to:
  (value & $FF) << 8 | (value & $FF00) >> 8
```

## Common Bit Manipulation Patterns

### Test if Bit N is Set
```assembly
MOVR R0, R1         ; Preserve original
ANDI #$0040, R1     ; Mask bit 6 (value $0040 = bit 6)
TSTR R1             ; Test result
BEQ bit_clear       ; Branch if zero (bit was clear)
```

### Set Bit N
```assembly
XORI #$0040, R0     ; Toggle bit 6 (if clear, sets it)
; Or use OR (not available as single instruction):
MVI #$0040, R1
ADDR R1, R0         ; If bit was clear, sets it (not safe if set!)
```

### Clear Bit N
```assembly
ANDI #$FFBF, R0     ; Clear bit 6 (AND with inverted mask)
```

### Extract Bit Field
```assembly
; Extract bits 4-7 from R0
SLR R0              ; Shift right 4 times
SLR R0
SLR R0
SLR R0
ANDI #$000F, R0     ; Mask to 4 bits
```

### Multiply by 2^N (Fast)
```assembly
SLL R0              ; Multiply by 2
SLL R0              ; Multiply by 4
SLL R0              ; Multiply by 8
```

### Divide by 2^N (Unsigned)
```assembly
SLR R0              ; Divide by 2 (unsigned)
SLR R0              ; Divide by 4 (unsigned)
```

### Divide by 2^N (Signed)
```assembly
SAR R0              ; Divide by 2 (signed, rounds toward negative)
SAR R0              ; Divide by 4 (signed)
```

### Multi-Bit Shift with SLLC/RLC
```assembly
; Shift R1:R0 left by 1 (32-bit value)
SLL R0              ; Shift low word, C ← bit 15
SLLC R1             ; Shift high word, bit 0 ← C
```

## Flag Behavior

All shift and rotate operations:
- **C flag**: Set to the bit shifted/rotated out
- **Z flag**: Set if result is zero
- **S flag**: Set if bit 15 of result is 1 (negative)
- **OV flag**: Always cleared

SWAP instruction:
- **C flag**: Always cleared (special case!)
- **Z flag**: Set if result is zero
- **S flag**: Set if bit 15 of result is 1
- **OV flag**: Unchanged

## Assembling

```bash
as1600 -o bitops.bin -l bitops.lst bitops.asm
```

**Note**: This will fail until Sprint 1.6 is complete (shift/rotate instructions not yet implemented).

## Running (Future)

```
You: "Load examples/04-bit-manipulation/bitops.bin and run to completion"
Claude: [Executes program]
        Final state:
        R0 = $1234 (original)
        R1 = $0012 (high byte)
        R2 = $0034 (low byte)
        R3 = $3412 (swapped)
        R4 = $0005 (rotated)
        R5 = $FC00 (sign-preserved shift)

You: "Explain the difference between SLR and SAR"
Claude: SLR (Shift Logical Right) fills with 0s from the left:
        $1234 → $091A (unsigned division by 2)

        SAR (Shift Arithmetic Right) preserves the sign bit:
        $F000 (negative) → $F800 (still negative)

        Use SLR for unsigned values, SAR for signed values.
        SAR correctly divides negative numbers by 2.

You: "Show me how SWAP works on $1234"
Claude: SWAP exchanges the high and low bytes:
        Before: $1234 = [0x12][0x34]
        After:  $3412 = [0x34][0x12]

        This is useful for:
        - Endian conversion (byte order swapping)
        - Extracting high byte to low position
        - Rotating by 8 bits
```

## Learning Notes

Key takeaways:
1. **SLL/SLR**: Logical shifts fill with 0 (unsigned operations)
2. **SAR**: Arithmetic shift preserves sign bit (signed division)
3. **RLC/RRC**: Rotate through carry (17-bit rotation)
4. **SWAP**: Fast byte swap (clears C flag)
5. **ANDI**: Masking to extract specific bits
6. **All shifts/rotates clear OV flag**

Bit manipulation is essential for:
- Graphics (sprite pixel manipulation)
- Data packing/unpacking
- Fast multiplication/division by powers of 2
- Protocol encoding/decoding

Next example: [05-signed-math](../05-signed-math/) - signed arithmetic and comparison branches.
