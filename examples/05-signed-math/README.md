# Example 05: Signed Math

Demonstrates signed arithmetic and comparison branches, including the critical role of overflow detection.

## What This Does

Shows four signed comparison scenarios:
1. Compare positive numbers (10 < 20)
2. Compare negative numbers (-10 < -5)
3. Test greater-or-equal (15 >= 10)
4. Overflow case (-32768 < 1, despite positive result)

## Instructions Used

- **CMPI** (Compare Immediate): Subtract immediate from register, set flags (no store)
- **BLT** (Branch if Less Than): S XOR OV = 1
- **BGE** (Branch if Greater or Equal): S XOR OV = 0
- **BLE** (Branch if Less or Equal): Z=1 OR (S XOR OV)=1
- **BGT** (Branch if Greater Than): Z=0 AND (S XOR OV)=0
- **MVI**, **J**, **HLT**: Supporting instructions

## Two's Complement Review

16-bit signed integers:
- **Positive**: 0x0000 to 0x7FFF (0 to 32767)
- **Negative**: 0x8000 to 0xFFFF (-32768 to -1)

Examples:
```
Hex      Decimal (Signed)  Binary
------   ----------------  ----------------
$0000    0                 0000000000000000
$0001    1                 0000000000000001
$7FFF    32767             0111111111111111
$8000    -32768            1000000000000000
$FFFF    -1                1111111111111111
$FFFB    -5                1111111111111011
$FFF6    -10               1111111111110110
```

Negation (two's complement): `-N = ~N + 1`

## Execution Flow

```
Example 1: 10 < 20 (positive numbers)
  CMPI #20, R0  → S=1, OV=0, Z=0
  BLT is_less   → 1 XOR 0 = 1, BRANCH TAKEN

Example 2: -10 < -5 (negative numbers)
  CMPI #$FFFB, R2  → S=1, OV=0, Z=0
  BLT neg_less     → 1 XOR 0 = 1, BRANCH TAKEN

Example 3: 15 >= 10 (greater or equal)
  CMPI #10, R4  → S=0, OV=0, Z=0
  BGE is_gte    → 0 XOR 0 = 0, BRANCH TAKEN

Example 4: -32768 < 1 (overflow case!)
  CMPI #1, R0      → S=0, OV=1, Z=0 (tricky!)
  BLT overflow_case → 0 XOR 1 = 1, BRANCH TAKEN
```

## Expected Final State

```
Registers:
  R0 = $8000 (-32768)  - Overflow test value
  R1 = 2               - Overflow case succeeded
  R2 = $FFF6 (-10)     - Negative comparison test
  R3 = 1               - -10 < -5 is true
  R4 = 15              - Positive comparison test
  R5 = 1               - 15 >= 10 is true

All branches taken correctly!
```

## Key Concepts

### Signed Comparison Logic

Signed comparison branches use **S XOR OV** (not just S flag):

| Branch | Condition | Formula |
|--------|-----------|---------|
| **BLT** | Less Than | S XOR OV = 1 |
| **BGE** | Greater or Equal | S XOR OV = 0 |
| **BLE** | Less or Equal | Z=1 OR (S XOR OV)=1 |
| **BGT** | Greater Than | Z=0 AND (S XOR OV)=0 |

**Why XOR?** Because overflow changes the meaning of the sign bit.

### Why Overflow Matters

Consider: `-32768 - 1 = ?`

In 16-bit two's complement:
```
  $8000 (-32768)
- $0001 (1)
---------
  $7FFF (32767)   ← WRONG! Should be -32769 (doesn't fit)
```

The result **looks positive** (S=0) but **overflow occurred** (OV=1).

Correct interpretation:
- Without overflow: S=0 means result is positive (>= 0)
- With overflow: S XOR OV = 0 XOR 1 = 1 means result is negative (< 0)

### CMPI Instruction

```assembly
CMPI #value, Rn    ; Compute Rn - value, set flags, DON'T store
```

CMPI is like SUBI but doesn't modify the register:
- Sets S, Z, OV, C flags based on (Rn - value)
- Rn is NOT changed
- Use before conditional branch

Example:
```assembly
MVI #10, R0
CMPI #20, R0       ; Compare R0 with 20
BLT less_than      ; Branch if R0 < 20
; R0 is still 10 here!
```

### Common Comparison Patterns

**Test if equal:**
```assembly
CMPI #value, R0
BEQ equal          ; Z=1
```

**Test if not equal:**
```assembly
CMPI #value, R0
BNEQ not_equal     ; Z=0
```

**Test if less than (signed):**
```assembly
CMPI #value, R0
BLT less_than      ; S XOR OV = 1
```

**Test if greater than (signed):**
```assembly
CMPI #value, R0
BGT greater_than   ; Z=0 AND (S XOR OV)=0
```

**Test if less or equal (signed):**
```assembly
CMPI #value, R0
BLE less_equal     ; Z=1 OR (S XOR OV)=1
```

### Unsigned vs Signed Branches

**Unsigned** (use C flag):
- **BC**: Carry set (unsigned less than after subtract)
- **BNC**: No carry (unsigned greater or equal)

**Signed** (use S XOR OV):
- **BLT**: Less than (signed)
- **BGE**: Greater or equal (signed)
- **BLE**: Less or equal (signed)
- **BGT**: Greater than (signed)

Example comparing unsigned vs signed:
```
Value: $8000
Unsigned: 32768 (large positive)
Signed:   -32768 (large negative)

CMPI #1, R0 (where R0 = $8000)
  Unsigned: 32768 > 1, use BNC (no carry)
  Signed:   -32768 < 1, use BLT (S XOR OV)
```

## Overflow Cases

Overflow occurs when signed arithmetic result doesn't fit:

### Addition Overflow
```
  $7FFF (32767)     Positive
+ $0001 (1)         Positive
---------
  $8000 (-32768)    Negative! (OV=1)
```

Both operands positive, result negative → overflow

### Subtraction Overflow
```
  $8000 (-32768)    Negative
- $0001 (1)         Positive
---------
  $7FFF (32767)     Positive! (OV=1)
```

Negative minus positive = positive → overflow

### No Overflow
```
  $FFFF (-1)        Negative
+ $FFFF (-1)        Negative
---------
  $FFFE (-2)        Negative (OV=0, C=1)
```

Both negative, result negative → no overflow (but carry!)

## Complete Signed Comparison Table

After `CMPI #B, A` (computing A - B):

| Relationship | S | OV | Z | S XOR OV | Branch |
|--------------|---|----|----|----------|--------|
| A < B        | ? | ?  | 0  | 1        | BLT    |
| A >= B       | ? | ?  | 0  | 0        | BGE    |
| A = B        | 0 | 0  | 1  | 0        | BEQ    |
| A != B       | ? | ?  | 0  | ?        | BNEQ   |
| A <= B       | ? | ?  | 1 or (S XOR OV)=1 | BLE |
| A > B        | ? | ?  | 0 and (S XOR OV)=0 | BGT |

The `?` marks depend on specific values and overflow.

## Assembling

```bash
as1600 -o signed.bin -l signed.lst signed.asm
```

## Running (Future)

```
You: "Load examples/05-signed-math/signed.bin and run to completion"
Claude: [Executes program]
        All comparisons handled correctly:
        R1 = 2 (overflow case worked)
        R3 = 1 (-10 < -5 confirmed)
        R5 = 1 (15 >= 10 confirmed)

You: "Explain the overflow case in Example 4"
Claude: Example 4 tests a tricky edge case:
        R0 = $8000 = -32768 (most negative 16-bit value)
        CMPI #1, R0 computes: -32768 - 1 = ?

        The actual subtraction:
        $8000 - $0001 = $7FFF (appears positive!)

        But this is WRONG due to overflow:
        - Can't represent -32769 in 16 bits
        - Result wraps to $7FFF (32767)
        - OV flag is set to indicate overflow

        BLT uses S XOR OV = 0 XOR 1 = 1 (less than)
        So the branch is correctly taken, even though
        the result looks positive!

You: "When should I use BLT vs BC?"
Claude: Use BLT for SIGNED comparisons:
        - Numbers range -32768 to 32767
        - Sign bit matters
        - Uses S XOR OV logic

        Use BC for UNSIGNED comparisons:
        - Numbers range 0 to 65535
        - All bits are magnitude
        - Uses C (carry/borrow) flag

        Example: $8000
        - Signed: -32768 (negative, use BLT)
        - Unsigned: 32768 (large positive, use BC/BNC)
```

## Learning Notes

Key takeaways:
1. **Two's complement**: Negative numbers = $8000-$FFFF
2. **CMPI**: Compare without modifying register (sets flags only)
3. **S XOR OV**: Essential for signed comparisons (handles overflow)
4. **BLT/BGE/BLE/BGT**: Use these for signed comparisons
5. **BC/BNC**: Use these for unsigned comparisons
6. **Overflow**: Occurs when result doesn't fit signed range

Signed arithmetic is critical for:
- Position calculations (can be negative)
- Velocity/acceleration (can be negative)
- Comparing addresses (signed offsets)
- Game logic with bidirectional values

Next example: [06-nested-calls](../06-nested-calls/) - complex subroutine nesting with stack management.
