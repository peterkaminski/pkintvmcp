# Sprint 1.5: Control Flow and Stack Instructions - Instructions for Manus

**Sprint Goal:** Implement control flow (branches, jumps) and stack management (PSHR, PULR) instructions for the CP-1600 executor.

**Date Created:** 2025-12-10
**Branch:** `pkma-sprint1.5-2025-12-10`
**Deliverable:** Control flow and stack instructions with comprehensive tests

---

## Context

You (Manus) have successfully completed Sprints 1.3 and 1.4, implementing:
- CPU core (8 registers, 4 flags, cycle tracking)
- Executor foundation with dispatch system
- 12 instructions: MVO, MVI, MVOI, ADDR, ADDI, SUBR, SUBI, CMPR, CMPI, ANDR, XORR, COMR

**Current Status:**
- ✅ CPU Core complete (packages/core/src/cpu/)
- ✅ Decoder complete (116 opcodes, packages/core/src/decoder/)
- ✅ Executor with 12 instructions (packages/core/src/executor/executor.ts - 472 lines)
- ✅ 226 tests passing, 94.19% coverage

**What's Next:** Sprint 1.5 adds control flow (branches, jumps) and stack instructions, enabling programs to have loops, conditionals, and subroutine calls.

---

## Deliverables

### Primary Deliverable: Extended executor.ts

Extend `packages/core/src/executor/executor.ts` with the following instruction implementations:

#### Control Flow Instructions (Priority 1 - Essential)

**Unconditional:**
1. **B** - Branch Unconditional
2. **J** - Jump Absolute
3. **JR** - Jump to Register

**Conditional Branches (based on flags):**
4. **BEQ** - Branch if Equal (Z = 1)
5. **BNEQ** - Branch if Not Equal (Z = 0)
6. **BC** - Branch if Carry (C = 1)
7. **BNC** - Branch if No Carry (C = 0)
8. **BOV** - Branch if Overflow (OV = 1)
9. **BNOV** - Branch if No Overflow (OV = 0)
10. **BMI** - Branch if Minus (S = 1)
11. **BPL** - Branch if Plus (S = 0)

**Signed Comparison Branches:**
12. **BLT** - Branch if Less Than (signed)
13. **BGE** - Branch if Greater or Equal (signed)
14. **BLE** - Branch if Less or Equal (signed)
15. **BGT** - Branch if Greater Than (signed)

**Subroutine Instructions:**
16. **JSR** - Jump to Subroutine (saves return address in register)
17. **JSRE** - JSR + Enable Interrupts
18. **JSRD** - JSR + Disable Interrupts

#### Stack Instructions (Priority 1 - Essential)

19. **PSHR** - Push Register to Stack
20. **PULR** - Pull from Stack to Register

#### Control Instructions (Priority 2 - If Time Permits)

21. **NOPP** - No Operation (2-word form)
22. **HLT** - Halt Processor
23. **EIS** - Enable Interrupt System
24. **DIS** - Disable Interrupt System

**Estimated Instructions for Sprint 1.5:** 20-24 instructions (prioritize 1-20)

---

## Critical Implementation Details

### PC (Program Counter) Management

The CP-1600 uses **R7 as the Program Counter (PC)**. This is CRITICAL:

```typescript
// Reading PC
const currentPC = this.cpu.getRegister(7);

// Setting PC (for branches/jumps)
this.cpu.setRegister(7, toUint16(targetAddress));

// Normal PC increment (for non-branch instructions)
this.cpu.incrementPC();  // This is cpu.setRegister(7, cpu.getRegister(7) + 1)
```

**Key Rules:**
1. Branches/jumps that are TAKEN: Set R7 directly, do NOT increment
2. Branches that are NOT TAKEN: Call `incrementPC()` normally
3. Non-control-flow instructions: Always call `incrementPC()` at the end

### Branch Behavior Pattern

```typescript
// Unconditional branch - ALWAYS taken
private executeB(inst: Instruction): void {
  const targetAddress = inst.operands[0].value;
  this.cpu.setRegister(7, toUint16(targetAddress));  // Set PC
  // NO incrementPC() call - we're at the target already
  this.cpu.addCycles(7);
}

// Conditional branch - Check flag condition
private executeBEQ(inst: Instruction): void {
  const targetAddress = inst.operands[0].value;
  if (this.cpu.flags.Z) {  // Condition is TRUE - branch taken
    this.cpu.setRegister(7, toUint16(targetAddress));
    this.cpu.addCycles(7);  // Branch taken: 7 cycles
  } else {  // Condition is FALSE - branch not taken
    this.cpu.incrementPC();  // Just move to next instruction
    this.cpu.addCycles(6);   // Branch not taken: 6 cycles
  }
}
```

### Jump Instructions

```typescript
// Jump to absolute address
private executeJ(inst: Instruction): void {
  const targetAddress = inst.operands[0].value;
  this.cpu.setRegister(7, toUint16(targetAddress));
  this.cpu.addCycles(7);
}

// Jump to register (address stored in register)
private executeJR(inst: Instruction): void {
  const reg = inst.operands[0].value;
  const targetAddress = this.cpu.getRegister(reg);
  this.cpu.setRegister(7, toUint16(targetAddress));
  this.cpu.addCycles(7);
}
```

### Subroutine Call Pattern

**JSR saves return address in a register (usually R4 or R5), NOT on the stack:**

```typescript
private executeJSR(inst: Instruction): void {
  // JSR has two operands: return register and target address
  const returnReg = inst.operands[0].value;  // Where to save return address
  const targetAddress = inst.operands[1].value;  // Where to jump

  // Save return address (current PC + 1)
  const returnAddress = toUint16(this.cpu.getRegister(7) + 1);
  this.cpu.setRegister(returnReg, returnAddress);

  // Jump to subroutine
  this.cpu.setRegister(7, toUint16(targetAddress));

  this.cpu.addCycles(12);
}

// JSRE and JSRD are similar but also set interrupt flag
// (For Sprint 1.5, you can implement interrupt flags as simple booleans)
```

**Returning from subroutine:** Use `JR` instruction to jump to the return address.

### Stack Instructions

**The CP-1600 stack grows UPWARD** (unusual but true):

```typescript
// PSHR: Pre-increment push
private executePSHR(inst: Instruction): void {
  const reg = inst.operands[0].value;
  const value = this.cpu.getRegister(reg);

  // Pre-increment stack pointer (R6)
  const newSP = toUint16(this.cpu.getRegister(6) + 1);
  this.cpu.setRegister(6, newSP);

  // Write value to stack
  this.memory.write(newSP, value);

  this.cpu.incrementPC();
  this.cpu.addCycles(11);
}

// PULR: Post-decrement pop
private executePULR(inst: Instruction): void {
  const reg = inst.operands[0].value;

  // Read from current stack pointer (R6)
  const sp = this.cpu.getRegister(6);
  const value = this.memory.read(sp);

  // Store value in register
  this.cpu.setRegister(reg, value);

  // Post-decrement stack pointer
  const newSP = toUint16(sp - 1);
  this.cpu.setRegister(6, newSP);

  this.cpu.incrementPC();
  this.cpu.addCycles(11);
}
```

**Memory Interface:** The executor will need to interact with memory for PSHR/PULR. Check the existing code in Sprint 1.4 to see how memory is accessed. If memory support is not yet available, create a minimal Memory interface:

```typescript
interface Memory {
  read(address: number): number;   // Read 16-bit word
  write(address: number, value: number): void;  // Write 16-bit word
}
```

### Signed Comparison Branches

These branches interpret flag combinations for signed arithmetic:

```typescript
// BLT: Branch if Less Than (signed)
// Condition: (S XOR OV) = 1
private executeBLT(inst: Instruction): void {
  const targetAddress = inst.operands[0].value;
  const condition = this.cpu.flags.S !== this.cpu.flags.OV;  // XOR condition

  if (condition) {
    this.cpu.setRegister(7, toUint16(targetAddress));
    this.cpu.addCycles(7);
  } else {
    this.cpu.incrementPC();
    this.cpu.addCycles(6);
  }
}

// BGE: Branch if Greater or Equal (signed)
// Condition: (S XOR OV) = 0
private executeBGE(inst: Instruction): void {
  const targetAddress = inst.operands[0].value;
  const condition = this.cpu.flags.S === this.cpu.flags.OV;  // XNOR condition

  if (condition) {
    this.cpu.setRegister(7, toUint16(targetAddress));
    this.cpu.addCycles(7);
  } else {
    this.cpu.incrementPC();
    this.cpu.addCycles(6);
  }
}

// BLE: Branch if Less or Equal (signed)
// Condition: Z=1 OR (S XOR OV)=1
private executeBLE(inst: Instruction): void {
  const targetAddress = inst.operands[0].value;
  const condition = this.cpu.flags.Z || (this.cpu.flags.S !== this.cpu.flags.OV);

  if (condition) {
    this.cpu.setRegister(7, toUint16(targetAddress));
    this.cpu.addCycles(7);
  } else {
    this.cpu.incrementPC();
    this.cpu.addCycles(6);
  }
}

// BGT: Branch if Greater Than (signed)
// Condition: Z=0 AND (S XOR OV)=0
private executeBGT(inst: Instruction): void {
  const targetAddress = inst.operands[0].value;
  const condition = !this.cpu.flags.Z && (this.cpu.flags.S === this.cpu.flags.OV);

  if (condition) {
    this.cpu.setRegister(7, toUint16(targetAddress));
    this.cpu.addCycles(7);
  } else {
    this.cpu.incrementPC();
    this.cpu.addCycles(6);
  }
}
```

### Flag Behavior

**Control flow instructions do NOT modify flags** (except JSRE/JSRD which affect interrupt enable flag):

```typescript
// Branches and jumps: No flag changes
// The flags used for conditional branches were set by previous instructions (CMPR, SUBI, etc.)

// Example test sequence:
CMPR R1, R2        // Sets flags based on (R1 - R2)
BLT less_label     // Uses S and OV flags, does NOT modify them
```

### Cycle Timing

From the CP-1600 manual:

| Instruction | Taken | Not Taken |
|-------------|-------|-----------|
| B, J, JR    | 7     | N/A       |
| BEQ, BNEQ, BC, BNC, BOV, BNOV, BMI, BPL | 7 | 6 |
| BLT, BGE, BLE, BGT | 7 | 6 |
| JSR, JSRE, JSRD | 12 | N/A |
| PSHR, PULR | 11 | N/A |
| NOPP       | 7     | N/A       |
| HLT        | Special (halts CPU) | N/A |
| EIS, DIS   | 6     | N/A       |

---

## Testing Requirements

### Test Organization

Create or extend test files:
- `executor.test.ts` - Core instruction tests
- `executor.control-flow.test.ts` - NEW: Branch/jump instruction tests
- `executor.stack.test.ts` - NEW: Stack instruction tests

### Test Helper (from Sprint 1.4)

Use this helper to create test instructions:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../cpu/cpu.js';
import { Executor } from './executor.js';
import { Opcode, AddressingMode } from '../decoder/decoder.types.js';
import type { Instruction } from '../decoder/decoder.types.js';

function createTestInstruction(
  opcode: Opcode,
  operands: Array<{ type: 'register' | 'immediate' | 'address', value: number }>,
  options?: {
    address?: number;
    addressingMode?: AddressingMode;
    raw?: number;
    sdbd?: boolean;
    length?: number;
  }
): Instruction {
  return {
    address: options?.address ?? 0x5000,
    opcode,
    addressingMode: options?.addressingMode ?? AddressingMode.REGISTER,
    operands: operands.map(op => ({ ...op })),
    raw: options?.raw ?? 0x000,
    sdbd: options?.sdbd ?? false,
    length: options?.length ?? 1,
  };
}
```

### Branch Instruction Tests

**Pattern for conditional branches:**

```typescript
describe('BEQ - Branch if Equal', () => {
  let cpu: CPU;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    executor = new Executor(cpu);
    cpu.setRegister(7, 0x5000);  // Set PC to known address
  });

  it('should branch when Z flag is set', () => {
    // Arrange
    cpu.setFlags({ Z: true, S: false, C: false, OV: false });
    const inst = createTestInstruction(
      Opcode.BEQ,
      [{ type: 'address', value: 0x5100 }]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.getRegister(7)).toBe(0x5100);  // PC changed to target
    expect(cpu.getCycles()).toBe(7);  // Branch taken: 7 cycles
  });

  it('should not branch when Z flag is clear', () => {
    // Arrange
    cpu.setFlags({ Z: false, S: false, C: false, OV: false });
    cpu.setRegister(7, 0x5000);
    const inst = createTestInstruction(
      Opcode.BEQ,
      [{ type: 'address', value: 0x5100 }]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.getRegister(7)).toBe(0x5001);  // PC incremented normally
    expect(cpu.getCycles()).toBe(6);  // Branch not taken: 6 cycles
  });

  it('should not modify flags', () => {
    // Arrange
    cpu.setFlags({ Z: true, S: true, C: true, OV: true });
    const originalFlags = { ...cpu.flags };
    const inst = createTestInstruction(
      Opcode.BEQ,
      [{ type: 'address', value: 0x5100 }]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.flags).toEqual(originalFlags);  // Flags unchanged
  });
});
```

### Jump and Subroutine Tests

```typescript
describe('JSR - Jump to Subroutine', () => {
  let cpu: CPU;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    executor = new Executor(cpu);
    cpu.setRegister(7, 0x5000);  // PC
  });

  it('should save return address in register and jump', () => {
    // Arrange
    const inst = createTestInstruction(
      Opcode.JSR,
      [
        { type: 'register', value: 5 },      // R5 = return register
        { type: 'address', value: 0x6000 }   // Target address
      ]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.getRegister(5)).toBe(0x5001);  // Return address = PC + 1
    expect(cpu.getRegister(7)).toBe(0x6000);  // PC = target address
    expect(cpu.getCycles()).toBe(12);
  });

  it('should work with JR to return from subroutine', () => {
    // Arrange: Simulate JSR call
    cpu.setRegister(5, 0x5001);  // Saved return address
    cpu.setRegister(7, 0x6000);  // Currently in subroutine

    const jrInst = createTestInstruction(
      Opcode.JR,
      [{ type: 'register', value: 5 }]
    );

    // Act
    executor.execute(jrInst);

    // Assert
    expect(cpu.getRegister(7)).toBe(0x5001);  // Returned to saved address
  });
});
```

### Stack Tests

**IMPORTANT:** Stack tests require Memory interface. If not implemented, create a simple mock:

```typescript
class MockMemory {
  private storage: Map<number, number> = new Map();

  read(address: number): number {
    return this.storage.get(address) ?? 0;
  }

  write(address: number, value: number): void {
    this.storage.set(address, value & 0xFFFF);
  }
}
```

```typescript
describe('PSHR/PULR - Stack Operations', () => {
  let cpu: CPU;
  let memory: MockMemory;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    memory = new MockMemory();
    executor = new Executor(cpu, memory);

    cpu.setRegister(6, 0x02F0);  // Initialize stack pointer
    cpu.setRegister(7, 0x5000);  // PC
  });

  it('should push register value to stack', () => {
    // Arrange
    cpu.setRegister(1, 0x1234);  // Value to push
    const inst = createTestInstruction(
      Opcode.PSHR,
      [{ type: 'register', value: 1 }]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.getRegister(6)).toBe(0x02F1);  // SP incremented
    expect(memory.read(0x02F1)).toBe(0x1234);  // Value written to stack
    expect(cpu.getRegister(7)).toBe(0x5001);  // PC incremented
    expect(cpu.getCycles()).toBe(11);
  });

  it('should pull value from stack to register', () => {
    // Arrange
    cpu.setRegister(6, 0x02F1);  // SP points to top of stack
    memory.write(0x02F1, 0x5678);  // Value on stack
    const inst = createTestInstruction(
      Opcode.PULR,
      [{ type: 'register', value: 2 }]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.getRegister(2)).toBe(0x5678);  // Value pulled into R2
    expect(cpu.getRegister(6)).toBe(0x02F0);  // SP decremented
    expect(cpu.getRegister(7)).toBe(0x5001);  // PC incremented
    expect(cpu.getCycles()).toBe(11);
  });

  it('should correctly handle push/pull sequence', () => {
    // Arrange
    cpu.setRegister(3, 0xABCD);
    const pushInst = createTestInstruction(
      Opcode.PSHR,
      [{ type: 'register', value: 3 }]
    );
    const pullInst = createTestInstruction(
      Opcode.PULR,
      [{ type: 'register', value: 4 }]
    );

    // Act
    executor.execute(pushInst);  // Push R3
    executor.execute(pullInst);  // Pull to R4

    // Assert
    expect(cpu.getRegister(4)).toBe(0xABCD);  // R4 = original R3 value
    expect(cpu.getRegister(6)).toBe(0x02F0);  // SP back to original
  });

  it('should handle multiple pushes correctly', () => {
    // Arrange
    cpu.setRegister(1, 0x1111);
    cpu.setRegister(2, 0x2222);
    cpu.setRegister(3, 0x3333);

    // Act
    executor.execute(createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 1 }]));
    executor.execute(createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 2 }]));
    executor.execute(createTestInstruction(Opcode.PSHR, [{ type: 'register', value: 3 }]));

    // Assert
    expect(cpu.getRegister(6)).toBe(0x02F3);  // SP advanced 3 times
    expect(memory.read(0x02F1)).toBe(0x1111);
    expect(memory.read(0x02F2)).toBe(0x2222);
    expect(memory.read(0x02F3)).toBe(0x3333);
  });
});
```

### Signed Comparison Branch Tests

```typescript
describe('BLT - Branch if Less Than (signed)', () => {
  let cpu: CPU;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    executor = new Executor(cpu);
    cpu.setRegister(7, 0x5000);
  });

  it('should branch when (S XOR OV) = 1 (negative result, no overflow)', () => {
    // Arrange: Negative result, no overflow -> S=1, OV=0 -> XOR=1
    cpu.setFlags({ S: true, OV: false, Z: false, C: false });
    const inst = createTestInstruction(
      Opcode.BLT,
      [{ type: 'address', value: 0x5100 }]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.getRegister(7)).toBe(0x5100);  // Branch taken
  });

  it('should branch when (S XOR OV) = 1 (positive result, overflow)', () => {
    // Arrange: Positive result with overflow -> S=0, OV=1 -> XOR=1
    cpu.setFlags({ S: false, OV: true, Z: false, C: false });
    const inst = createTestInstruction(
      Opcode.BLT,
      [{ type: 'address', value: 0x5100 }]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.getRegister(7)).toBe(0x5100);  // Branch taken
  });

  it('should not branch when (S XOR OV) = 0', () => {
    // Arrange: S=0, OV=0 -> XOR=0
    cpu.setFlags({ S: false, OV: false, Z: false, C: false });
    const inst = createTestInstruction(
      Opcode.BLT,
      [{ type: 'address', value: 0x5100 }]
    );

    // Act
    executor.execute(inst);

    // Assert
    expect(cpu.getRegister(7)).toBe(0x5001);  // Branch not taken
  });
});
```

### Integration Tests

Create integration tests that combine instructions:

```typescript
describe('Control Flow Integration', () => {
  let cpu: CPU;
  let executor: Executor;

  beforeEach(() => {
    cpu = new CPU();
    executor = new Executor(cpu);
  });

  it('should execute a loop with counter', () => {
    // Simulate:
    // MVI R1, 5        ; Counter
    // loop:
    //   SUBI R1, 1     ; Decrement
    //   BNEQ loop      ; Loop if not zero

    cpu.setRegister(1, 5);  // Initial counter
    cpu.setRegister(7, 0x5000);

    // Execute loop 5 times
    for (let i = 0; i < 5; i++) {
      // SUBI R1, 1
      const subiInst = createTestInstruction(
        Opcode.SUBI,
        [
          { type: 'register', value: 1 },
          { type: 'immediate', value: 1 }
        ]
      );
      executor.execute(subiInst);

      // BNEQ loop (should branch 4 times, not branch on 5th)
      const bneqInst = createTestInstruction(
        Opcode.BNEQ,
        [{ type: 'address', value: 0x5000 }]
      );
      executor.execute(bneqInst);
    }

    // Assert
    expect(cpu.getRegister(1)).toBe(0);  // Counter reached zero
    expect(cpu.flags.Z).toBe(true);  // Zero flag set
  });

  it('should handle nested subroutine calls with stack', () => {
    const memory = new MockMemory();
    executor = new Executor(cpu, memory);

    cpu.setRegister(6, 0x02F0);  // Initialize stack pointer
    cpu.setRegister(7, 0x5000);  // Start PC

    // Main calls Sub1: JSR R5, sub1
    executor.execute(createTestInstruction(
      Opcode.JSR,
      [{ type: 'register', value: 5 }, { type: 'address', value: 0x6000 }]
    ));
    expect(cpu.getRegister(5)).toBe(0x5001);  // Return address saved
    expect(cpu.getRegister(7)).toBe(0x6000);  // At sub1

    // Sub1 needs to call Sub2, so save R5 first: PSHR R5
    executor.execute(createTestInstruction(
      Opcode.PSHR,
      [{ type: 'register', value: 5 }]
    ));
    expect(memory.read(0x02F1)).toBe(0x5001);  // Return address on stack

    // Sub1 calls Sub2: JSR R5, sub2
    executor.execute(createTestInstruction(
      Opcode.JSR,
      [{ type: 'register', value: 5 }, { type: 'address', value: 0x7000 }]
    ));
    expect(cpu.getRegister(5)).toBe(0x6001);  // Sub1's return address
    expect(cpu.getRegister(7)).toBe(0x7000);  // At sub2

    // Sub2 returns: JR R5
    executor.execute(createTestInstruction(
      Opcode.JR,
      [{ type: 'register', value: 5 }]
    ));
    expect(cpu.getRegister(7)).toBe(0x6001);  // Back in sub1

    // Sub1 restores return address: PULR R5
    executor.execute(createTestInstruction(
      Opcode.PULR,
      [{ type: 'register', value: 5 }]
    ));
    expect(cpu.getRegister(5)).toBe(0x5001);  // Original return address restored

    // Sub1 returns: JR R5
    executor.execute(createTestInstruction(
      Opcode.JR,
      [{ type: 'register', value: 5 }]
    ));
    expect(cpu.getRegister(7)).toBe(0x5001);  // Back in main

    // Stack pointer should be back to original
    expect(cpu.getRegister(6)).toBe(0x02F0);
  });
});
```

### Coverage Requirements

- **Minimum**: 90% line coverage for executor.ts
- **Ideal**: 95%+ coverage
- Each instruction should have:
  - Basic functionality test
  - Edge case tests
  - Flag preservation tests
  - Cycle count verification

---

## Dispatch Method Updates

Add new opcodes to the `execute()` dispatch method in executor.ts:

```typescript
public execute(inst: Instruction): void {
  switch (inst.opcode) {
    // ... existing cases (MVO, MVI, ADDR, etc.) ...

    // Control flow - Unconditional
    case Opcode.B: this.executeB(inst); break;
    case Opcode.J: this.executeJ(inst); break;
    case Opcode.JR: this.executeJR(inst); break;

    // Control flow - Conditional branches
    case Opcode.BEQ: this.executeBEQ(inst); break;
    case Opcode.BNEQ: this.executeBNEQ(inst); break;
    case Opcode.BC: this.executeBC(inst); break;
    case Opcode.BNC: this.executeBNC(inst); break;
    case Opcode.BOV: this.executeBOV(inst); break;
    case Opcode.BNOV: this.executeBNOV(inst); break;
    case Opcode.BMI: this.executeBMI(inst); break;
    case Opcode.BPL: this.executeBPL(inst); break;

    // Signed comparison branches
    case Opcode.BLT: this.executeBLT(inst); break;
    case Opcode.BGE: this.executeBGE(inst); break;
    case Opcode.BLE: this.executeBLE(inst); break;
    case Opcode.BGT: this.executeBGT(inst); break;

    // Subroutine calls
    case Opcode.JSR: this.executeJSR(inst); break;
    case Opcode.JSRE: this.executeJSRE(inst); break;
    case Opcode.JSRD: this.executeJSRD(inst); break;

    // Stack operations
    case Opcode.PSHR: this.executePSHR(inst); break;
    case Opcode.PULR: this.executePULR(inst); break;

    // Control instructions (if time permits)
    case Opcode.NOPP: this.executeNOPP(inst); break;
    case Opcode.HLT: this.executeHLT(inst); break;
    case Opcode.EIS: this.executeEIS(inst); break;
    case Opcode.DIS: this.executeDIS(inst); break;

    default:
      throw new Error(`Unimplemented instruction: ${inst.opcode}`);
  }
}
```

---

## Reference Files

Copy these files for reference (they're in the `resources/` folder of this directory):

1. **CPU_SPECIFICATION.md** - Lines 509-750 contain control flow and stack instruction specs
2. **executor.ts** (current) - Your starting point with 12 instructions implemented
3. **cpu.ts** - CPU interface you'll be calling
4. **decoder.types.ts** - Opcode enum and Instruction interface

---

## Memory Interface

**If executor.ts doesn't have Memory support yet**, add it:

```typescript
export class Executor {
  private cpu: CPU;
  private memory: Memory;  // Add this

  constructor(cpu: CPU, memory?: Memory) {  // Memory optional for backward compat
    this.cpu = cpu;
    this.memory = memory ?? new NullMemory();  // Use null object pattern
  }

  // ... rest of class
}

// Null object pattern for tests that don't need memory
class NullMemory implements Memory {
  read(_address: number): number {
    throw new Error('Memory access not supported in this test');
  }
  write(_address: number, _value: number): void {
    throw new Error('Memory access not supported in this test');
  }
}
```

**For PSHR/PULR tests, provide a real Memory mock** (as shown in the test examples above).

---

## Work Strategy

### Recommended Order

1. **Phase 1: Simple Branches** (Start here)
   - B (unconditional branch)
   - BEQ, BNEQ (simplest conditional branches)
   - J, JR (jumps)

2. **Phase 2: All Conditional Branches**
   - BC, BNC, BOV, BNOV, BMI, BPL (flag-based)
   - BLT, BGE, BLE, BGT (signed comparison)

3. **Phase 3: Subroutines**
   - JSR (basic subroutine call)
   - JSRE, JSRD (with interrupt flags)

4. **Phase 4: Stack**
   - Add Memory interface if needed
   - PSHR, PULR

5. **Phase 5: Control Instructions** (if time)
   - NOPP, HLT, EIS, DIS

### Testing Strategy

- Write tests FIRST for each group (TDD approach)
- Run tests after implementing each instruction
- Aim for green tests before moving to next instruction

### When You're Stuck

- Review the pseudocode in CPU_SPECIFICATION.md (resources folder)
- Look at existing instruction implementations (ADDR, SUBI, CMPR)
- Remember: Branches that are taken DON'T call incrementPC()
- Stack grows UP (pre-increment push, post-decrement pop)

---

## Deliverable Format

### ZIP file structure:

```
sprint-1-5-deliverables.zip
├── README.md                           # What you implemented, test results
├── executor.ts                         # Extended executor with new instructions
├── executor.test.ts                    # Core tests (if extended)
├── executor.control-flow.test.ts       # NEW: Control flow tests
├── executor.stack.test.ts              # NEW: Stack tests
└── memory.ts                           # NEW: If you created Memory interface
```

### README.md should include:

```markdown
# Sprint 1.5 Deliverable

**Date:** YYYY-MM-DD
**Instructions Implemented:** 20 (or however many)

## Implemented Instructions

### Control Flow
- [x] B - Branch Unconditional
- [x] BEQ, BNEQ - Conditional branches
... (full list)

### Stack
- [x] PSHR - Push Register
- [x] PULR - Pull Register

## Test Results

```
npm test

Test Files  X passed (X)
Tests  NNN passed (NNN)
Coverage  XX.XX%
```

## Notes

- Memory interface created in memory.ts
- All 20 priority 1 instructions implemented
- Integration tests demonstrate nested subroutine calls
- (any other notes)
```

---

## Success Criteria

✅ All priority 1 instructions (1-20) implemented
✅ Comprehensive tests for each instruction
✅ Integration tests showing control flow works
✅ All tests passing
✅ Coverage >90%
✅ No TypeScript errors
✅ Code follows existing patterns from Sprint 1.4

---

## Questions?

If you encounter issues:
1. Check CPU_SPECIFICATION.md in resources/ folder
2. Review executor.ts from Sprint 1.4 for patterns
3. Remember: PC is R7, and branches set it directly
4. Stack grows upward (unusual but correct)

Good luck! This sprint will make the CPU capable of real programs with loops, conditionals, and function calls. 🚀
