# Example 03: Subroutine Call

Demonstrates the CP-1600 subroutine calling convention using JSR and JR instructions.

## What This Does

Calls a subroutine to add two numbers. Shows how the CP-1600 handles function calls using a register to store the return address (not the stack).

## Instructions Used

- **JSR** (Jump to Subroutine): Save return address in register, jump to subroutine
- **JR** (Jump to Register): Return from subroutine by jumping to saved address
- **MVI** (Move Immediate): Initialize values
- **MOVR** (Move Register): Copy values
- **ADDR** (Add Registers): Perform addition
- **HLT** (Halt): Stop execution

## Execution Flow

```
main:
  ┌─────────────────┐
  │  MVI #10, R0    │  Setup arguments
  │  MVI #20, R1    │
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │ JSR R5, add     │  Call subroutine
  │   R5 = $5003    │  (save return address)
  │   PC = add      │  (jump to subroutine)
  └────────┬────────┘
           │ (call)
           │
add_numbers:
  ┌────────▼────────┐
  │ MOVR R0, R3     │  R3 = R0 (10)
  │ ADDR R1, R3     │  R3 = R3 + R1 (30)
  │ MOVR R3, R2     │  R2 = R3 (30)
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │   JR R5         │  Return
  │   PC = R5       │  (jump to $5003)
  └────────┬────────┘
           │ (return)
           │
  ┌────────▼────────┐
  │     HLT         │  Stop
  └─────────────────┘
```

## Execution Trace

```
Address  Instruction         Cycles  R0   R1   R2   R3   R5      PC     Action
-------  ------------------  ------  ---  ---  ---  ---  ------  -----  ------
$5000    MVI #10, R0            8    10   0    0    0    $0000  $5001  Init
$5001    MVI #20, R1            8    10   20   0    0    $0000  $5002  Init
$5002    JSR R5, add_numbers   12    10   20   0    0    $5003  $5005  Call
$5005    MOVR R0, R3            6    10   20   0    10   $5003  $5006  Copy
$5006    ADDR R1, R3            6    10   20   0    30   $5003  $5007  Add
$5007    MOVR R3, R2            6    10   20   30   30   $5003  $5008  Copy
$5008    JR R5                  7    10   20   30   30   $5003  $5003  Return
$5003    HLT                 special 10   20   30   30   $5003  $5004  Stop
```

Total cycles: 8 + 8 + 12 + 6 + 6 + 6 + 7 = 53 cycles

## Expected Final State

```
Registers:
  R0 = 10 ($000A)    - First input (preserved)
  R1 = 20 ($0014)    - Second input (preserved)
  R2 = 30 ($001E)    - Result (output)
  R3 = 30 ($001E)    - Temporary (clobbered by subroutine)
  R5 = $5003         - Return address (still saved)
  R7 (PC) = $5004    - After HLT

Flags:
  S = 0  (positive result from ADDR)
  Z = 0  (non-zero result)
  OV = 0 (no overflow)
  C = 0  (no carry)

Status:
  Halted = true
  Total cycles = 53
```

## Key Concepts

### CP-1600 Calling Convention

**The CP-1600 does NOT automatically use the stack for subroutine calls.**

Instead, JSR saves the return address in a register:

```assembly
JSR R5, subroutine    ; R5 = PC+1 (return address)
                      ; PC = subroutine (jump to target)
```

The subroutine returns using JR:

```assembly
JR R5                 ; PC = R5 (return to caller)
```

### Register R5 Convention

By convention, **R5** is commonly used for return addresses in Intellivision code:
- Main routine uses R5 for its calls
- If the subroutine needs to call another subroutine, it must save R5 first
- See [06-nested-calls](../06-nested-calls/) for nested call handling

### Why R5?

R5 is chosen because:
- R0-R4: General purpose (frequently used)
- R5: Often used for return addresses (convention)
- R6: Stack pointer (reserved)
- R7: Program counter (reserved)

You can use any register (R0-R5) for return addresses, but R5 is conventional.

### JSR Instruction Details

```assembly
JSR R5, $5010    ; R5 ← PC+1, PC ← $5010
```

What happens:
1. Save return address: R5 = current PC + 1
2. Jump to target: PC = $5010
3. Cycles: 12 (always)

The return address points to the instruction **after** the JSR.

### JR Instruction Details

```assembly
JR R5            ; PC ← R5
```

What happens:
1. Jump to address in register: PC = R5
2. Cycles: 7 (always)

JR is an unconditional jump to whatever address is in the register.

### Input/Output Convention

This example follows a simple calling convention:

**Inputs**: R0, R1 (arguments passed in registers)
**Output**: R2 (result returned in register)
**Preserved**: R0, R1 (caller's values not modified)
**Clobbered**: R3 (temporary work register, caller must save if needed)

Real programs document which registers are preserved vs clobbered.

## Subroutine Structure

Standard pattern:

```assembly
; Subroutine: function_name
; Input:  R0 = ...
;         R1 = ...
; Output: R2 = ...
; Uses:   R3 (clobbered)
; Preserves: R0, R1
function_name:
        ; ... function body ...
        JR R5               ; Return to caller
```

## Common Patterns

### Leaf Function (No Further Calls)
```assembly
leaf_function:
        ; Do work using R0-R4
        ; R5 contains return address
        JR R5               ; Return
```

### Non-Leaf Function (Calls Other Functions)
```assembly
outer_function:
        PSHR R5             ; Save return address to stack
        JSR R5, inner       ; Call nested function
        PULR R5             ; Restore return address
        JR R5               ; Return to original caller
```

See [06-nested-calls](../06-nested-calls/) for complete nested call example.

### Tail Call Optimization
```assembly
function_a:
        ; Do work...
        ; Instead of calling function_b and returning:
        ; JSR R5, function_b
        ; JR R5
        ; We can jump directly (tail call):
        J function_b        ; Let function_b return to our caller
```

This saves cycles by eliminating the return from function_a.

## Assembling

```bash
as1600 -o subroutine.bin -l subroutine.lst subroutine.asm
```

## Running (Future)

```
You: "Load examples/03-subroutine-call/subroutine.bin and run to completion"
Claude: [Executes program]
        Halted at $5004
        R0 = 10, R1 = 20, R2 = 30

You: "Show me the subroutine call sequence"
Claude: Call sequence:
        1. JSR R5, add_numbers at $5002
           - Saves return address $5003 to R5
           - Jumps to $5005 (subroutine)

        2. Subroutine executes:
           - MOVR R0, R3  → R3 = 10
           - ADDR R1, R3  → R3 = 30
           - MOVR R3, R2  → R2 = 30

        3. JR R5 at $5008
           - Returns to $5003 (saved in R5)

        4. HLT at $5003
           - Execution stops

You: "Why not use the stack?"
Claude: The CP-1600 JSR instruction saves the return address in a
        register (R5 in this example), not on the stack. This is
        faster for simple calls but requires stack management for
        nested calls. See example 06-nested-calls for stack usage.
```

## Learning Notes

Key takeaways:
1. JSR saves return address in a register (commonly R5)
2. JR jumps to the address in a register (returns from subroutine)
3. Simple calls don't need the stack (fast!)
4. Nested calls require saving return address to stack (see example 06)
5. Document input/output/preserved/clobbered registers

Next example: [04-bit-manipulation](../04-bit-manipulation/) - introduces shifts, rotates, and bit operations.
