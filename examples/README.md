# CP-1600 Assembly Examples

This directory contains small, focused examples demonstrating CP-1600 assembly programming patterns. Each example is designed to be clear, well-documented, and illustrate specific concepts.

## Running These Examples

**Current Status**: These examples are ready to assemble but cannot yet be executed in pkIntvMCP (MCP server not implemented). They serve as:
- Documentation of CP-1600 programming patterns
- Test cases for Sprint 1.6+ development
- Reference material for understanding the instruction set

**Future**: After Sprint 1.7 (MCP server), you'll be able to load and debug these examples with Claude.

## Assembling

These examples use as1600 assembler syntax (from jzIntv):

```bash
as1600 -o example.bin -l example.lst example.asm
```

## Example Index

### [01-hello-world](01-hello-world/)
**Concepts**: Basic instruction execution, register operations
**Instructions**: MVI, MOVR, ADDR, HLT
**Lines**: ~15

The simplest possible program - loads values, adds them, halts.

### [02-counter-loop](02-counter-loop/)
**Concepts**: Loops, conditional branches, flags
**Instructions**: MVI, SUBI, BNEQ, HLT
**Lines**: ~20

A countdown loop demonstrating how to use conditional branches with flag testing.

### [03-subroutine-call](03-subroutine-call/)
**Concepts**: Subroutines, return addresses, JSR/JR pattern
**Instructions**: JSR, JR, ADDR
**Lines**: ~25

Shows the CP-1600 subroutine calling convention (return address in register, not stack).

### [04-bit-manipulation](04-bit-manipulation/)
**Concepts**: Shifts, rotates, byte swapping
**Instructions**: SLL, SLR, SAR, RLC, SWAP, ANDR
**Lines**: ~30

Demonstrates bit-level operations including shifts, rotates, and masking.

### [05-signed-math](05-signed-math/)
**Concepts**: Signed comparison, two's complement, overflow
**Instructions**: SUBI, CMPI, BLT, BGE, BLE, BGT
**Lines**: ~35

Shows signed arithmetic and comparison branches with both positive and negative numbers.

### [06-nested-calls](06-nested-calls/)
**Concepts**: Stack usage, nested subroutines, PSHR/PULR
**Instructions**: JSR, PSHR, PULR, JR
**Lines**: ~45

Complex example showing proper stack management for nested function calls.

## CP-1600 Quick Reference

### Registers
- R0-R5: General purpose (16-bit)
- R6: Stack pointer (SP)
- R7: Program counter (PC)

### Flags
- S: Sign (bit 15 of result)
- Z: Zero (result is 0)
- OV: Overflow (signed arithmetic)
- C: Carry (unsigned arithmetic)

### Stack
- Grows UPWARD (unusual!)
- PSHR: pre-increment R6, then write
- PULR: read, then post-decrement R6
- Typical init: R6 = $02F0

### Common Patterns

**Loop with counter:**
```assembly
        MVI #10, R0      ; Counter
loop:   ; ... body ...
        SUBI #1, R0      ; Decrement
        BNEQ loop        ; Branch if not zero
```

**Subroutine call:**
```assembly
        JSR R5, routine  ; R5 = return address
        ; ...
routine: ; ... body ...
        JR R5            ; Return
```

**Nested calls (save return address):**
```assembly
        JSR R5, outer
        ; ...
outer:  PSHR R5          ; Save return address
        JSR R5, inner    ; Call nested
        PULR R5          ; Restore
        JR R5            ; Return
```

## Learning Resources

- [CPU_SPECIFICATION.md](../docs/CPU_SPECIFICATION.md) - Complete instruction set reference
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Emulator design
- CP-1600 Microprocessor Users Manual (1975) - Hardware reference
- jzIntv documentation - Reference emulator and assembler

## Testing

These examples are used as test cases during pkIntvMCP development. Each example has expected register states documented in its README.md.

## Contributing

Want to add more examples? Contributions welcome! Good topics:
- Multi-precision arithmetic (32-bit operations)
- Memory copy routines
- Data structure traversal
- String operations
- Fixed-point math

Keep examples focused (one concept), well-commented, and 10-50 lines.

---

**Project**: pkIntvMCP - Intellivision Debugging with AI
**Status**: Phase 1 Development (Sprint 1.5 complete)
