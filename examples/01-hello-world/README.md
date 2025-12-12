# Example 01: Hello World

The simplest possible CP-1600 program demonstrating basic instruction execution.

## What This Does

1. Loads two constant values into registers (42 and 100)
2. Adds them together (142)
3. Copies the result to another register
4. Halts execution

## Instructions Used

- **MVI** (Move Immediate): Load a constant value into a register
- **MOVR** (Move Register): Copy value from one register to another
- **ADDR** (Add Registers): Add two registers, store in destination
- **HLT** (Halt): Stop processor execution

## Execution Trace

```
Address  Instruction      Cycles  R0    R1    R2    Flags
-------  ---------------  ------  ----  ----  ----  -----
$5000    MVI #42, R0         8      42    0     0    ----
$5001    MVI #100, R1        8      42   100    0    ----
$5002    ADDR R1, R0         6     142   100    0    ----
$5003    MOVR R0, R2         6     142   100   142   ----
$5004    HLT              special  142   100   142   ----
```

Total cycles: 28 + HLT

## Expected Final State

```
Registers:
  R0 = 142 ($008E)    - Result of addition
  R1 = 100 ($0064)    - Second operand
  R2 = 142 ($008E)    - Copy of result
  R3-R5 = 0           - Unused
  R6 (SP) = 0         - Stack pointer (not used)
  R7 (PC) = $5005     - After HLT instruction

Flags:
  S = 0  (positive result)
  Z = 0  (non-zero result)
  OV = 0 (no overflow)
  C = 0  (no carry)

Status:
  Halted = true
  Cycles = 28 (excluding HLT)
```

## Key Concepts

### Immediate Values
```assembly
MVI #42, R0    ; The '#' indicates immediate value (constant)
```

The MVI instruction loads a constant into a register. The value is encoded in the instruction itself.

### Register Operations
```assembly
ADDR R1, R0    ; R0 = R0 + R1 (destination is first operand)
```

Arithmetic operations read from both registers and store result in the first register (destination). The source register is not modified.

### Flags
The ADDR instruction sets arithmetic flags:
- **S (Sign)**: Set if result is negative (bit 15 = 1)
- **Z (Zero)**: Set if result is zero
- **OV (Overflow)**: Set if signed overflow occurred
- **C (Carry)**: Set if unsigned overflow occurred

In this example, 42 + 100 = 142 fits in 16 bits with no overflow, so all flags are cleared.

### Halt Instruction
```assembly
HLT            ; Stop execution
```

The HLT instruction stops the CPU. The processor will not execute further instructions until reset. The PC (R7) points to the instruction after HLT.

## Assembling

```bash
as1600 -o hello.bin -l hello.lst hello.asm
```

This produces:
- `hello.bin` - Binary ROM image (loadable in emulator)
- `hello.lst` - Assembly listing with addresses and opcodes

## Running (Future)

After Sprint 1.7 (MCP server implementation), you'll be able to load and run this with Claude:

```
You: "Load examples/01-hello-world/hello.bin and run to completion"
Claude: [Executes program]
        Final state:
        R0 = 142 ($008E)
        R1 = 100 ($0064)
        R2 = 142 ($008E)
        Halted at $5005

You: "What did this program do?"
Claude: This program demonstrated basic arithmetic by adding 42 + 100
        to get 142, then copying the result to R2. It's the simplest
        possible example showing register operations and execution flow.
```

## Learning Notes

This example is intentionally minimal to show:
1. How programs start at a specific address (ORG $5000)
2. The syntax for immediate values (#42) vs registers (R0)
3. The destination-first operand order (ADDR R1, R0 means R0 = R0 + R1)
4. How to halt execution (HLT)

Next example: [02-counter-loop](../02-counter-loop/) - introduces loops and conditional branches.
