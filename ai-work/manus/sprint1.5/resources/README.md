# Sprint 1.5 Resources

This folder contains reference files for implementing Sprint 1.5.

## Files

### CPU_SPECIFICATION.md
Complete CP-1600 instruction set specification.

**Key sections for Sprint 1.5:**
- Lines 509-650: Control Flow Instructions (B, BEQ, BNEQ, JSR, etc.)
- Lines 651-750: Stack Instructions (PSHR, PULR)

Each instruction includes:
- Opcode bit pattern
- Pseudocode implementation
- Flag behavior
- Cycle timing
- Edge cases
- Test guidance

### executor.ts
Current executor implementation (Sprint 1.4 complete).

**What to study:**
- Instruction dispatch pattern (execute() method)
- Existing instruction implementations (executeAddr, executeSubr, etc.)
- Flag calculation helpers (setArithmeticFlags)
- Pattern for operand extraction (inst.operands[0].value)

**Starting point:** This file has 472 lines with 12 instructions. You'll extend it to ~700+ lines.

### cpu.ts
CPU class interface.

**Key methods you'll use:**
```typescript
getRegister(index: number): number
setRegister(index: number, value: number): void
getPC(): number              // Returns register 7 (PC)
incrementPC(): void          // PC = PC + 1
setFlags(flags): void
addCycles(cycles: number): void
```

**CRITICAL:** R7 is the Program Counter (PC)
- Branches/jumps: Set R7 directly, DON'T call incrementPC()
- Non-branch instructions: Always call incrementPC()

### decoder.types.ts
Type definitions for instructions.

**What you need:**
- `Opcode` enum - All instruction mnemonics (B, BEQ, JSR, PSHR, etc.)
- `Instruction` interface - Structure passed to executor
- `AddressingMode` enum - For test instruction creation

**Instruction structure:**
```typescript
interface Instruction {
  address: number;           // Where in memory
  opcode: Opcode;           // What instruction
  operands: Operand[];      // Parameters (use .value property)
  addressingMode: AddressingMode;
  raw: number;              // Original 10-bit encoding
  sdbd: boolean;            // SDBD prefix flag
  length: number;           // 1 or 2 words
}
```

### bitops.ts
Bit manipulation utilities.

**Functions you'll use:**
```typescript
toUint16(value: number): number    // Mask to 16-bit unsigned
toInt16(value: number): number     // Convert to 16-bit signed
toUint10(value: number): number    // Mask to 10-bit (for decoder)
getBit(value: number, bit: number) // Extract single bit
```

**Why needed:** JavaScript bitwise operations are 32-bit signed, but CP-1600 is 16-bit. Always use toUint16() for register/memory values.

## Implementation Notes

### PC (R7) Management Pattern

```typescript
// Unconditional branch - ALWAYS set PC directly
private executeB(inst: Instruction): void {
  const target = inst.operands[0].value;
  this.cpu.setRegister(7, toUint16(target));  // Set PC
  // NO incrementPC() - already at target
  this.cpu.addCycles(7);
}

// Conditional branch - Check condition
private executeBEQ(inst: Instruction): void {
  const target = inst.operands[0].value;
  if (this.cpu.flags.Z) {
    this.cpu.setRegister(7, toUint16(target));  // Branch taken
    this.cpu.addCycles(7);
  } else {
    this.cpu.incrementPC();                      // Branch not taken
    this.cpu.addCycles(6);
  }
}

// Non-branch instruction - ALWAYS increment PC
private executeMVOI(inst: Instruction): void {
  const src = inst.operands[0].value;
  const dst = inst.operands[1].value;
  this.memory.write(dst, this.cpu.getRegister(src));
  this.cpu.incrementPC();  // ALWAYS for non-branch
  this.cpu.addCycles(11);
}
```

### Stack Operations Pattern

**Stack grows UPWARD** (pre-increment push, post-decrement pop):

```typescript
// PSHR: Pre-increment, then write
private executePSHR(inst: Instruction): void {
  const reg = inst.operands[0].value;
  const value = this.cpu.getRegister(reg);

  // Pre-increment SP (R6)
  const newSP = toUint16(this.cpu.getRegister(6) + 1);
  this.cpu.setRegister(6, newSP);

  // Write to new SP location
  this.memory.write(newSP, value);

  this.cpu.incrementPC();
  this.cpu.addCycles(11);
}

// PULR: Read first, then post-decrement
private executePULR(inst: Instruction): void {
  const reg = inst.operands[0].value;

  // Read from current SP (R6)
  const sp = this.cpu.getRegister(6);
  const value = this.memory.read(sp);

  // Store in register
  this.cpu.setRegister(reg, value);

  // Post-decrement SP
  const newSP = toUint16(sp - 1);
  this.cpu.setRegister(6, newSP);

  this.cpu.incrementPC();
  this.cpu.addCycles(11);
}
```

### Signed Comparison Branches

Use XOR of Sign and Overflow flags:

```typescript
// BLT: Branch if Less Than (S XOR OV = 1)
private executeBLT(inst: Instruction): void {
  const target = inst.operands[0].value;
  const condition = this.cpu.flags.S !== this.cpu.flags.OV;  // XOR

  if (condition) {
    this.cpu.setRegister(7, toUint16(target));
    this.cpu.addCycles(7);
  } else {
    this.cpu.incrementPC();
    this.cpu.addCycles(6);
  }
}

// BGE: Branch if Greater or Equal (S XOR OV = 0)
private executeBGE(inst: Instruction): void {
  const target = inst.operands[0].value;
  const condition = this.cpu.flags.S === this.cpu.flags.OV;  // XNOR

  if (condition) {
    this.cpu.setRegister(7, toUint16(target));
    this.cpu.addCycles(7);
  } else {
    this.cpu.incrementPC();
    this.cpu.addCycles(6);
  }
}
```

## Common Pitfalls

1. **Forgetting to mask to 16-bit:** Always use `toUint16()` when setting registers
2. **Incrementing PC on branches:** Branches that are taken should NOT call incrementPC()
3. **Stack direction:** CP-1600 stack grows UP, not down (unusual)
4. **Wrong cycle counts:** Branch taken = 7 cycles, not taken = 6 cycles
5. **Modifying flags:** Control flow instructions do NOT modify flags (except JSRE/JSRD for interrupt flag)

## Testing Reference

See INSTRUCTIONS.md for complete test examples. Key pattern:

```typescript
describe('BEQ - Branch if Equal', () => {
  let cpu: CPU;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    executor = new Executor(cpu);
    cpu.setRegister(7, 0x5000);  // Set initial PC
  });

  it('should branch when Z flag is set', () => {
    cpu.setFlags({ Z: true, S: false, C: false, OV: false });
    const inst = createTestInstruction(
      Opcode.BEQ,
      [{ type: 'address', value: 0x5100 }]
    );

    executor.execute(inst);

    expect(cpu.getRegister(7)).toBe(0x5100);  // PC = target
    expect(cpu.getCycles()).toBe(7);           // Branch taken
  });

  it('should not branch when Z flag is clear', () => {
    cpu.setFlags({ Z: false, S: false, C: false, OV: false });
    const inst = createTestInstruction(
      Opcode.BEQ,
      [{ type: 'address', value: 0x5100 }]
    );

    executor.execute(inst);

    expect(cpu.getRegister(7)).toBe(0x5001);  // PC incremented
    expect(cpu.getCycles()).toBe(6);           // Branch not taken
  });
});
```

## Quick Reference: Cycle Timing

| Instruction Type | Cycles (Taken) | Cycles (Not Taken) |
|-----------------|----------------|-------------------|
| B, J, JR        | 7              | N/A               |
| Conditional Branches | 7         | 6                 |
| JSR, JSRE, JSRD | 12             | N/A               |
| PSHR, PULR      | 11             | N/A               |
| NOPP            | 7              | N/A               |
| EIS, DIS        | 6              | N/A               |
| HLT             | Halts CPU      | N/A               |

## Memory Interface

If Memory interface doesn't exist in executor.ts, you'll need to add it. See INSTRUCTIONS.md for the pattern. For tests, use a MockMemory class.

---

**Good luck with Sprint 1.5!** These instructions will enable real programs with loops, conditionals, and function calls. 🚀
