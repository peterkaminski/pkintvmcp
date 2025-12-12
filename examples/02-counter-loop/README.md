# Example 02: Counter Loop

Demonstrates loop construction with conditional branching and flag testing.

## What This Does

Counts down from 10 to 0, accumulating the sum (1+2+3+...+10 = 55). This is the classic programming example adapted for CP-1600 assembly.

## Instructions Used

- **MVI** (Move Immediate): Initialize registers
- **ADDR** (Add Registers): Add counter to accumulator
- **SUBI** (Subtract Immediate): Decrement counter
- **BNEQ** (Branch if Not Equal): Loop while counter != 0
- **HLT** (Halt): Stop execution

## Execution Flow

```
      ┌─────────────────┐
      │  MVI #10, R0    │  Initialize counter = 10
      │  MVI #0, R1     │  Initialize sum = 0
      └────────┬────────┘
               │
         ┌─────▼──────┐
    ┌───►│ ADDR R0,R1 │  Add counter to sum
    │    │ SUBI #1,R0 │  Decrement counter
    │    │ BNEQ loop  │  Branch if Z flag = 0
    │    └─────┬──────┘
    │          │ (counter != 0)
    └──────────┘
               │ (counter = 0)
         ┌─────▼──────┐
         │    HLT     │  Stop
         └────────────┘
```

## Execution Trace (First 3 Iterations)

```
Address  Instruction      Cycles  R0    R1    Z Flag   Action
-------  ---------------  ------  ----  ----  ------   ------
$5000    MVI #10, R0         8     10    0      -     Init counter
$5001    MVI #0, R1          8     10    0      -     Init sum
$5002    ADDR R0, R1         6     10   10      0     Sum = 10
$5003    SUBI #1, R0         8      9   10      0     Counter = 9
$5004    BNEQ $5002          7      9   10      0     Branch taken (Z=0)
$5002    ADDR R0, R1         6      9   19      0     Sum = 19
$5003    SUBI #1, R0         8      8   19      0     Counter = 8
$5004    BNEQ $5002          7      8   19      0     Branch taken (Z=0)
$5002    ADDR R0, R1         6      8   27      0     Sum = 27
$5003    SUBI #1, R0         8      7   27      0     Counter = 7
$5004    BNEQ $5002          7      7   27      0     Branch taken (Z=0)
...      (7 more iterations)
$5002    ADDR R0, R1         6      1   54      0     Sum = 54
$5003    SUBI #1, R0         8      0   55      1     Counter = 0, Z set!
$5004    BNEQ $5002          6      0   55      1     NOT taken (Z=1)
$5005    HLT              special   0   55      1     Stop
```

Loop iterations: 10 (counter goes 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0)

## Expected Final State

```
Registers:
  R0 = 0          - Counter reached zero
  R1 = 55 ($37)   - Sum of 1+2+3+4+5+6+7+8+9+10
  R7 (PC) = $5006 - After HLT

Flags:
  S = 0  (positive result)
  Z = 1  (zero result from final SUBI)
  OV = 0 (no overflow)
  C = 0  (no borrow)

Status:
  Halted = true
  Total cycles = 154
```

### Cycle Count Breakdown
```
Initialization:     8 + 8 = 16 cycles
Loop body (×10):    6 + 8 + 7 = 21 cycles each = 210 cycles
Final SUBI:         8 cycles
Final BNEQ:         6 cycles (not taken)
HLT:                counted separately
---
Total: 16 + 210 - 8 - 7 + 8 + 6 = 225 cycles

Wait, let me recalculate:
- MVI #10, R0: 8 cycles
- MVI #0, R1: 8 cycles
- Loop iteration (10 times):
  - ADDR R0, R1: 6 cycles
  - SUBI #1, R0: 8 cycles
  - BNEQ loop: 7 cycles (taken) or 6 cycles (not taken)
- Last iteration: BNEQ not taken = 6 cycles

= 8 + 8 + 9×(6+8+7) + (6+8+6) = 16 + 189 + 20 = 225 cycles

Actually: 8 + 8 + 10×(6+8) + 9×7 + 6 = 16 + 140 + 63 + 6 = 225 cycles
```

## Key Concepts

### Conditional Branches

```assembly
SUBI #1, R0    ; Sets flags based on result
BNEQ loop      ; Branch if Z flag = 0 (result was not zero)
```

The SUBI instruction sets the Z (Zero) flag if the result is zero. BNEQ tests this flag and branches only if Z=0 (not equal to zero).

### Branch Timing

Conditional branches have two cycle counts:
- **7 cycles** when branch is taken (PC changes)
- **6 cycles** when branch is not taken (PC increments normally)

This affects cycle counting in loops - the last iteration takes 1 cycle less.

### Loop Pattern

This is the standard CP-1600 loop pattern:

```assembly
        MVI #count, R0   ; Initialize counter
loop:   ; ... loop body ...
        SUBI #1, R0      ; Decrement and test
        BNEQ loop        ; Continue if not zero
```

Why this works:
1. SUBI decrements R0 and sets Z flag if result is 0
2. BNEQ branches while Z=0 (while result is non-zero)
3. When R0 reaches 0, Z=1, BNEQ doesn't branch, loop exits

### Alternative: Test Before Decrement

```assembly
        MVI #count, R0
loop:   TSTR R0          ; Test register (sets flags)
        BEQ done         ; Exit if zero
        ; ... loop body ...
        SUBI #1, R0      ; Decrement
        B loop           ; Unconditional branch
done:   ; ...
```

This pattern is more cycles but clearer - tests at the top of the loop.

## Common Mistake: Infinite Loop

```assembly
loop:   ADDR R0, R1
        SUBI #1, R0
        BEQ loop         ; WRONG! Branches when zero, loops forever
```

Using BEQ instead of BNEQ creates an infinite loop because it branches when the counter reaches zero instead of exiting.

## Assembling

```bash
as1600 -o loop.bin -l loop.lst loop.asm
```

## Running (Future)

```
You: "Load examples/02-counter-loop/loop.bin and run to completion"
Claude: [Executes program]
        Halted at $5006 after 225 cycles
        R0 = 0 (counter)
        R1 = 55 (sum)

You: "How many times did the loop execute?"
Claude: The loop executed 10 times, counting down from 10 to 1.
        The sum accumulated as: 10+9+8+7+6+5+4+3+2+1 = 55

You: "Show me the execution trace for the last iteration"
Claude: Last iteration (when R0=1):
        $5002: ADDR R0, R1  → R1 becomes 55 (54+1)
        $5003: SUBI #1, R0  → R0 becomes 0, Z flag set
        $5004: BNEQ $5002   → NOT taken (Z=1), falls through
        $5005: HLT          → Execution stops
```

## Learning Notes

Key takeaways:
1. Loops use decrement-and-test pattern (SUBI + BNEQ)
2. Conditional branches change PC only when condition is true
3. Branch timing differs: 7 cycles taken, 6 cycles not taken
4. Z flag is crucial for loop control
5. Loop counter decrements to zero (not from zero)

Next example: [03-subroutine-call](../03-subroutine-call/) - introduces subroutines and the JSR/JR pattern.
