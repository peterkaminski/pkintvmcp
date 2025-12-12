# Example 06: Nested Calls

Demonstrates proper stack management for nested subroutine calls.

## What This Does

Calls `outer()` which calls `inner()` twice, demonstrating:
- Stack initialization (R6 = $02F0)
- Saving return address with PSHR before nested calls
- Restoring return address with PULR before returning
- Correct stack pointer management (grows upward)

Result: Computes `5 * 3 = 15` by calling a subroutine that adds 5 three times.

## Instructions Used

- **JSR** (Jump to Subroutine): Save return address, call function
- **JR** (Jump to Register): Return from function
- **PSHR** (Push Register): Save register to stack
- **PULR** (Pull Register): Restore register from stack
- **MVI**, **MOVR**, **ADDR**, **HLT**: Supporting instructions

## Stack Layout

The CP-1600 stack grows **UPWARD** (unusual!):

```
Memory Address   Contents        Comment
--------------   --------        -------
$02F0            (empty)         ← R6 initially points here
$02F1            return addr     ← R6 after PSHR (saved R5)
$02F2            (available)
...
$0318            (top of stack)
```

## Execution Flow

```
main:
  ┌─────────────────┐
  │ MVI #$02F0, R6  │  Initialize stack pointer
  │ MVI #5, R0      │  Setup argument
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │ JSR R5, outer   │  Call outer
  │   R5 = $5004    │  (return address saved)
  └────────┬────────┘
           │
outer:     │
  ┌────────▼────────┐
  │   PSHR R5       │  Save return address to stack
  │   R6: $02F0→$02F1
  │   [$02F1] = $5004
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │ JSR R5, inner   │  First call to inner
  │   R5 = new return address
  └────────┬────────┘
           │
inner:     │
  ┌────────▼────────┐
  │ ADDR R0, R1     │  R1 = 5 + 5 = 10
  │   JR R5         │  Return to outer
  └────────┬────────┘
           │
outer:     │
  ┌────────▼────────┐
  │ JSR R5, inner   │  Second call to inner
  └────────┬────────┘
           │
inner:     │
  ┌────────▼────────┐
  │ ADDR R0, R1     │  R1 = 10 + 5 = 15
  │   JR R5         │  Return to outer
  └────────┬────────┘
           │
outer:     │
  ┌────────▼────────┐
  │   PULR R5       │  Restore return address from stack
  │   R5 = $5004
  │   R6: $02F1→$02F0
  │   JR R5         │  Return to main
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │     HLT         │  Stop
  └─────────────────┘
```

## Detailed Execution Trace

```
Address  Instruction         Cycles  R0   R1   R5      R6      Stack[$02F1]  Action
-------  ------------------  ------  ---  ---  ------  ------  ------------  ------
$5000    MVI #$02F0, R6         8    0    0   $0000   $02F0   (empty)       Init SP
$5001    MVI #5, R0             8    5    0   $0000   $02F0   (empty)       Init arg
$5002    JSR R5, outer         12    5    0   $5004   $02F0   (empty)       Call outer

[outer]
$5008    PSHR R5               11    5    0   $5004   $02F1   $5004         Save ret
$5009    MOVR R0, R2            6    5    0   $5004   $02F1   $5004         Save R0
$500A    MOVR R2, R0            6    5    0   $5004   $02F1   $5004         Prepare arg
$500B    MOVR R2, R1            6    5    5   $5004   $02F1   $5004         Init R1
$500C    JSR R5, inner         12    5    5   $500D   $02F1   $5004         Call inner

[inner - first call]
$5014    MOVR R1, R3            6    5    5   $500D   $02F1   $5004         R3=5
$5015    ADDR R0, R3            6    5    5   $500D   $02F1   $5004         R3=10
$5016    MOVR R3, R1            6    5   10   $500D   $02F1   $5004         R1=10
$5017    JR R5                  7    5   10   $500D   $02F1   $5004         Return

[outer continues]
$500D    MOVR R2, R0            6    5   10   $500D   $02F1   $5004         Prepare arg
$500E    JSR R5, inner         12    5   10   $500F   $02F1   $5004         Call inner

[inner - second call]
$5014    MOVR R1, R3            6    5   10   $500F   $02F1   $5004         R3=10
$5015    ADDR R0, R3            6    5   10   $500F   $02F1   $5004         R3=15
$5016    MOVR R3, R1            6    5   15   $500F   $02F1   $5004         R1=15
$5017    JR R5                  7    5   15   $500F   $02F1   $5004         Return

[outer cleanup]
$500F    PULR R5               11    5   15   $5004   $02F0   (empty)       Restore ret
$5010    JR R5                  7    5   15   $5004   $02F0   (empty)       Return

[main]
$5004    HLT                special   5   15   $5004   $02F0   (empty)       Stop
```

Total cycles: 8+8+12 + 11+6+6+6+12 + [6+6+6+7] + 6+12 + [6+6+6+7] + 11+7 = 165 cycles

## Expected Final State

```
Registers:
  R0 = 5 ($0005)      - Original input
  R1 = 15 ($000F)     - Result (5*3)
  R2 = 5 ($0005)      - Saved by outer
  R3 = 15 ($000F)     - Temporary from last inner call
  R5 = $5004          - Return address to main
  R6 = $02F0          - Stack pointer (back to initial)
  R7 (PC) = $5005     - After HLT

Memory:
  [$02F0] = unchanged
  [$02F1] = unchanged (was $5004 during execution)

Status:
  Halted = true
  Stack balanced (R6 back to $02F0)
```

## Key Concepts

### Why Save R5?

**Simple calls** (leaf functions):
```assembly
JSR R5, function    ; R5 = return address
; function executes using R5
JR R5               ; Return
```

**Nested calls** (non-leaf functions):
```assembly
outer:
        PSHR R5             ; Save original return address
        JSR R5, inner       ; R5 overwritten with new return
        ; inner executes and returns here
        PULR R5             ; Restore original return address
        JR R5               ; Return to original caller
```

Without PSHR/PULR, the second JSR would overwrite R5 and you'd lose the original return address!

### Stack Grows Upward

**PSHR** (Push Register):
```
Before: R6 = $02F0, R5 = $5004
1. R6 = R6 + 1 = $02F1        (pre-increment)
2. memory[R6] = R5            (write to $02F1)
After:  R6 = $02F1, memory[$02F1] = $5004
```

**PULR** (Pull Register):
```
Before: R6 = $02F1, memory[$02F1] = $5004
1. R5 = memory[R6]            (read from $02F1)
2. R6 = R6 - 1 = $02F0        (post-decrement)
After:  R6 = $02F0, R5 = $5004
```

Note: Push increments BEFORE write, Pull decrements AFTER read.

### Stack Initialization

```assembly
MVI #$02F0, R6      ; Initialize stack pointer
```

Standard Intellivision stack region:
- **Base**: $02F0 (bottom)
- **Top**: $0318 (40 words available)
- **Size**: 40 16-bit words (80 bytes)

The stack shares memory with system variables in the $02F0-$035F range, so deep recursion can corrupt data!

### Nested Call Pattern

```assembly
non_leaf_function:
        PSHR R5             ; Save return address

        ; Can now make JSR calls safely
        JSR R5, subroutine1
        JSR R5, subroutine2
        ; etc.

        PULR R5             ; Restore return address
        JR R5               ; Return to original caller
```

### Deep Nesting

For multiple levels:
```assembly
level1:
        PSHR R5
        JSR R5, level2      ; Call level 2
        PULR R5
        JR R5

level2:
        PSHR R5
        JSR R5, level3      ; Call level 3
        PULR R5
        JR R5

level3:
        ; Leaf function, no PSHR needed
        JR R5
```

Stack grows:
```
$02F0  ← Initial R6
$02F1  ← After level1 PSHR (level1's return)
$02F2  ← After level2 PSHR (level2's return)
```

### Stack Balanced?

**Critical**: Every PSHR must have a matching PULR!

```assembly
; BAD - unbalanced stack
function:
        PSHR R5
        PSHR R4
        ; ... code ...
        PULR R4
        ; FORGOT PULR R5!
        JR R5               ; Will jump to wrong address!

; GOOD - balanced
function:
        PSHR R5
        PSHR R4
        ; ... code ...
        PULR R4
        PULR R5             ; Stack balanced
        JR R5
```

### Alternative: Use R4

Some code uses **R4** for nested return addresses:
```assembly
outer:
        JSR R5, inner       ; R5 = return
        JR R5

inner:
        JSR R4, deep        ; R4 = return (preserve R5)
        JR R5               ; Return using R5

deep:
        ; ... work ...
        JR R4               ; Return using R4
```

This avoids stack but limits nesting depth (2 levels: R5, R4).

## Common Mistakes

### 1. Forgetting PSHR
```assembly
outer:
        JSR R5, inner       ; R5 = new return
        JSR R5, inner       ; R5 overwritten again!
        JR R5               ; Returns to wrong place!
```

### 2. Unbalanced Stack
```assembly
function:
        PSHR R5
        ; conditional early return
        BEQ early_exit
        PULR R5
        JR R5
early_exit:
        JR R5               ; WRONG! R5 still on stack, R6 wrong
```

Fix: PULR before every return:
```assembly
function:
        PSHR R5
        BEQ early_exit
        ; ... work ...
        PULR R5
        JR R5
early_exit:
        PULR R5             ; Balance stack
        JR R5
```

### 3. Stack Overflow
```assembly
; Recursive function without base case
recurse:
        PSHR R5
        JSR R5, recurse     ; Infinite recursion!
        PULR R5
        JR R5
```

This will overflow the stack ($02F0-$0318, only 40 words!).

## Assembling

```bash
as1600 -o nested.bin -l nested.lst nested.asm
```

## Running (Future)

```
You: "Load examples/06-nested-calls/nested.bin and run to completion"
Claude: [Executes program]
        Final state:
        R0 = 5, R1 = 15, R6 = $02F0 (stack balanced)

You: "Show me the stack usage during execution"
Claude: Stack usage:
        Initially: R6 = $02F0 (empty)

        After outer's PSHR R5:
          R6 = $02F1
          [$02F1] = $5004 (return to main)

        During inner calls:
          R6 = $02F1 (unchanged - inner doesn't push)

        After outer's PULR R5:
          R6 = $02F0 (back to initial)

        Stack is balanced (correct!).

You: "What would happen if outer forgot to PULR?"
Claude: If outer forgot PULR R5, the stack would be unbalanced:
        - R6 would remain at $02F1 (not $02F0)
        - JR R5 would use the wrong return address
        - The program would jump to an incorrect location
        - Likely crash or execute random code

        EVERY PSHR must have a matching PULR!

You: "Why does the stack grow upward?"
Claude: The CP-1600 stack grows upward (higher addresses) because:
        - PSHR pre-increments R6, then writes
        - PULR reads, then post-decrements R6

        Most CPUs (x86, ARM) have downward-growing stacks, but
        the CP-1600 is different. This was a design choice by
        General Instrument in 1975.
```

## Learning Notes

Key takeaways:
1. **Leaf functions** (no nested calls): Use JSR/JR with R5 directly
2. **Non-leaf functions** (nested calls): PSHR R5 → calls → PULR R5 → JR R5
3. **Stack grows upward**: PSHR increments R6, PULR decrements R6
4. **Stack must be balanced**: Every PSHR needs a matching PULR
5. **Limited stack depth**: Only 40 words ($02F0-$0318)
6. **R6 is sacred**: Don't use R6 for anything except stack pointer

Stack management is essential for:
- Recursive functions
- Complex call chains
- Interrupt handlers (Phase 3)
- Preserving register values across calls

This completes the example series! You now have:
- Basic operations (hello-world)
- Loops (counter-loop)
- Simple calls (subroutine-call)
- Bit manipulation (bitops)
- Signed math (signed)
- Complex calls (nested-calls)

Ready to write real CP-1600 programs!
