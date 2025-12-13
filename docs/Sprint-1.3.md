# Sprint 1.3: Core Execution Engine

**Status:** 🟢 In Progress
**Sprint Goal:** Implement CPU and Executor classes to execute core CP-1600 instructions
**Started:** 2025-12-09
**Completed:** TBD
**Target Completion:** TBD (completion-based, not calendar-based)

---

## Sprint Overview

### Objective
Build the CPU state management and instruction execution engine. This sprint brings the emulator to life - instructions will actually modify registers, set flags, and change memory.

### Success Criteria
- ✅ CPU class manages 8 registers (R0-R7) and 4 flags (C, OV, Z, S)
- ✅ Executor can execute ~14 core instructions
- ✅ Flag calculations are bit-accurate (especially overflow)
- ✅ Unit test coverage >90%
- ✅ Integration tests with instruction sequences pass
- ✅ Can run simple programs (load values, do math, store results)

### Dependencies
- Sprint 1.2 complete ✅ (Decoder working)
- Memory class available ✅ (from Sprint 1.1)
- Test infrastructure working ✅

---

## Tasks

### 1. Define Core Types
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 1 hour

**Location:** `packages/core/src/cpu/cpu.types.ts`

**Tasks:**
- [ ] Define `CPUState` interface (8 registers, 4 flags, cycle count)
- [ ] Define `CPUFlags` interface (C, OV, Z, S)
- [ ] Define `ExecutorOptions` interface
- [ ] Export from barrel (`packages/core/src/index.ts`)

**Code Structure:**
```typescript
export interface CPUFlags {
  carry: boolean;      // C: Carry flag
  overflow: boolean;   // OV: Signed overflow flag
  zero: boolean;       // Z: Zero flag
  sign: boolean;       // S: Sign flag (bit 15 of result)
}

export interface CPUState {
  // 8 registers (R0-R7), each 16-bit
  registers: Uint16Array;  // [R0, R1, R2, R3, R4, R5, R6 (SP), R7 (PC)]

  // CPU flags
  flags: CPUFlags;

  // Execution state
  cycles: number;      // Total cycle count
  halted: boolean;     // HLT instruction executed
  sdbd: boolean;       // SDBD prefix active for next instruction
}

export interface ExecutorOptions {
  strict?: boolean;    // Throw on undefined behavior vs. silent continue
}
```

**Verification:**
```bash
cd packages/core
npm run build  # Should compile types
```

---

### 2. Implement CPU Class
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 2-3 hours

**Location:** `packages/core/src/cpu/cpu.ts`

**Tasks:**
- [ ] Create `CPU` class with constructor
- [ ] Implement register accessors (`getRegister`, `setRegister`)
- [ ] Implement flag accessors (`getFlags`, `setFlags`, individual flag methods)
- [ ] Implement `reset()` method (clear all state)
- [ ] Implement `getState()` snapshot method
- [ ] Implement `setState()` restore method
- [ ] Add PC convenience methods (`incrementPC`, `getPC`, `setPC`)

**Code Structure:**
```typescript
export class CPU {
  private state: CPUState;

  constructor() {
    this.state = {
      registers: new Uint16Array(8),  // R0-R7, all initialized to 0
      flags: {
        carry: false,
        overflow: false,
        zero: false,
        sign: false,
      },
      cycles: 0,
      halted: false,
      sdbd: false,
    };
  }

  // Register access
  getRegister(reg: number): number {
    if (reg < 0 || reg > 7) throw new Error(`Invalid register: ${reg}`);
    return this.state.registers[reg];
  }

  setRegister(reg: number, value: number): void {
    if (reg < 0 || reg > 7) throw new Error(`Invalid register: ${reg}`);
    this.state.registers[reg] = toUint16(value);
  }

  // Convenience for PC (R7)
  getPC(): number {
    return this.state.registers[7];
  }

  setPC(value: number): void {
    this.state.registers[7] = toUint16(value);
  }

  incrementPC(amount: number = 1): void {
    this.state.registers[7] = toUint16(this.state.registers[7] + amount);
  }

  // Flag access
  getFlags(): CPUFlags {
    return { ...this.state.flags };  // Return copy
  }

  setFlags(flags: Partial<CPUFlags>): void {
    this.state.flags = { ...this.state.flags, ...flags };
  }

  // State management
  reset(): void {
    this.state.registers.fill(0);
    this.state.flags = { carry: false, overflow: false, zero: false, sign: false };
    this.state.cycles = 0;
    this.state.halted = false;
    this.state.sdbd = false;
  }

  getState(): CPUState {
    return {
      registers: new Uint16Array(this.state.registers),
      flags: { ...this.state.flags },
      cycles: this.state.cycles,
      halted: this.state.halted,
      sdbd: this.state.sdbd,
    };
  }

  // Cycle tracking
  addCycles(cycles: number): void {
    this.state.cycles += cycles;
  }

  getCycles(): number {
    return this.state.cycles;
  }
}
```

**Verification:**
```bash
cd packages/core
npm run build  # Should compile
npm test       # Basic CPU tests should pass
```

---

### 3. Implement Executor Class (Structure)
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 2 hours

**Location:** `packages/core/src/executor/executor.ts`

**Tasks:**
- [ ] Create `Executor` class with constructor
- [ ] Implement `execute(instruction: Instruction): void` dispatcher
- [ ] Create stub methods for each instruction type
- [ ] Add flag calculation helpers (`calculateFlags`, `setArithmeticFlags`)
- [ ] Add bit-accurate helper (`toUint16`, `toInt16`, `toUint10`)

**Code Structure:**
```typescript
export class Executor {
  constructor(
    private cpu: CPU,
    private memory: Memory,
    private options: ExecutorOptions = {}
  ) {}

  execute(instruction: Instruction): void {
    // Dispatch to appropriate instruction handler
    switch (instruction.opcode) {
      case OpcodeEnum.MOVR: return this.executeMovr(instruction);
      case OpcodeEnum.MVI:  return this.executeMvi(instruction);
      case OpcodeEnum.MVO:  return this.executeMvo(instruction);
      case OpcodeEnum.ADDR: return this.executeAddr(instruction);
      case OpcodeEnum.SUBR: return this.executeSubr(instruction);
      case OpcodeEnum.ANDR: return this.executeAndr(instruction);
      case OpcodeEnum.XORR: return this.executeXorr(instruction);
      case OpcodeEnum.HLT:  return this.executeHlt(instruction);
      // ... more instructions
      default:
        if (this.options.strict) {
          throw new Error(`Unimplemented instruction: ${instruction.opcode}`);
        }
        // In non-strict mode, treat as NOP
    }

    // Update PC (unless instruction already modified it)
    if (instruction.opcode !== OpcodeEnum.J &&
        instruction.opcode !== OpcodeEnum.JSR &&
        !instruction.opcode.startsWith('B')) {
      this.cpu.incrementPC(instruction.length);
    }

    // Clear SDBD flag after instruction execution
    if (this.cpu.getState().sdbd && instruction.opcode !== OpcodeEnum.SDBD) {
      this.cpu.setFlags({ sdbd: false });
    }
  }

  // Stub methods (to be implemented in subsequent tasks)
  private executeMovr(inst: Instruction): void {
    throw new Error('Not implemented');
  }

  // ... more stubs

  // Helper: Set arithmetic flags based on result
  private setArithmeticFlags(result: number, operand1: number, operand2: number, isSubtraction: boolean = false): void {
    // Sign flag: bit 15 of result
    const sign = (result & 0x8000) !== 0;

    // Zero flag: result is zero
    const zero = (result & 0xFFFF) === 0;

    // Carry flag: bit 16 of result (unsigned overflow)
    const carry = result > 0xFFFF || result < 0;

    // Overflow flag: signed overflow
    // For addition: (+) + (+) = (-) or (-) + (-) = (+)
    // For subtraction: (+) - (-) = (-) or (-) - (+) = (+)
    const sign1 = (operand1 & 0x8000) !== 0;
    const sign2 = (operand2 & 0x8000) !== 0;
    const overflow = isSubtraction
      ? (sign1 !== sign2 && sign1 !== sign)  // SUB overflow
      : (sign1 === sign2 && sign1 !== sign); // ADD overflow

    this.cpu.setFlags({ carry, overflow, zero, sign });
  }
}
```

**Verification:**
```bash
cd packages/core
npm run build  # Should compile
```

---

### 4. Implement Data Movement Instructions
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 3 hours

**Location:** `packages/core/src/executor/executor.ts`

**Instructions to Implement:**
- **MOVR** - Move register to register
- **MVI** - Move immediate to register
- **MVO** - Move register to memory

**Tasks:**
- [ ] Implement `executeMovr()` - copy src reg to dst reg
- [ ] Implement `executeMvi()` - load immediate into reg
- [ ] Implement `executeMvo()` - store reg to memory
- [ ] Handle SDBD prefix for MVI (16-bit immediate)
- [ ] Set flags appropriately (or don't modify for MOV)

**Implementation Details:**

```typescript
// MOVR: Move Register to Register
// Format: MOVR src, dst
// Operation: dst ← src
// Flags: S, Z set based on result; C, OV unchanged
private executeMovr(inst: Instruction): void {
  const src = inst.operands[0].value;  // Source register number
  const dst = inst.operands[1].value;  // Dest register number

  const value = this.cpu.getRegister(src);
  this.cpu.setRegister(dst, value);

  // Set S and Z flags
  const sign = (value & 0x8000) !== 0;
  const zero = value === 0;
  this.cpu.setFlags({ sign, zero });

  // Cycle count: 6 cycles
  this.cpu.addCycles(6);
}

// MVI: Move Immediate to Register
// Format: MVI dst, #imm
// Operation: dst ← immediate
// Flags: S, Z set based on result; C, OV unchanged
private executeMvi(inst: Instruction): void {
  const dst = inst.operands[0].value;     // Dest register
  const immediate = inst.operands[1].value;  // Immediate value

  this.cpu.setRegister(dst, immediate);

  // Set S and Z flags
  const sign = (immediate & 0x8000) !== 0;
  const zero = immediate === 0;
  this.cpu.setFlags({ sign, zero });

  // Cycle count: 8 cycles (or 10 with SDBD)
  const cycles = inst.sdbd ? 10 : 8;
  this.cpu.addCycles(cycles);
}

// MVO: Move register tO memory
// Format: MVO src, addr
// Operation: memory[addr] ← src
// Flags: Not affected
private executeMvo(inst: Instruction): void {
  const src = inst.operands[0].value;   // Source register
  const addr = inst.operands[1].value;  // Memory address

  const value = this.cpu.getRegister(src);
  this.memory.write(addr, value);

  // Cycle count: 11 cycles (or 11+ with SDBD)
  this.cpu.addCycles(11);
}
```

**Tests to Write:**
- MOVR between different registers
- MVI with 10-bit immediate
- MVI with 16-bit immediate (SDBD prefix)
- MVO to various memory addresses
- Flag setting for S and Z

---

### 5. Implement Arithmetic Instructions
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 4 hours

**Location:** `packages/core/src/executor/executor.ts`

**Instructions to Implement:**
- **ADDR** - Add register to register
- **SUBR** - Subtract register from register
- **INC** - Increment register (ADDR with immediate 1)
- **DEC** - Decrement register (SUBR with immediate 1)

**Tasks:**
- [ ] Implement `executeAddr()` - add src to dst
- [ ] Implement `executeSubr()` - subtract src from dst
- [ ] Implement `executeInc()` - increment register
- [ ] Implement `executeDec()` - decrement register
- [ ] Implement overflow detection (critical!)
- [ ] Set all flags (C, OV, Z, S)

**Implementation Details:**

```typescript
// ADDR: Add Register to Register
// Format: ADDR src, dst
// Operation: dst ← dst + src
// Flags: C, OV, S, Z all set
private executeAddr(inst: Instruction): void {
  const src = inst.operands[0].value;
  const dst = inst.operands[1].value;

  const srcValue = this.cpu.getRegister(src);
  const dstValue = this.cpu.getRegister(dst);

  const result = dstValue + srcValue;
  this.cpu.setRegister(dst, result);

  // Set all arithmetic flags
  this.setArithmeticFlags(result, dstValue, srcValue, false);

  // Cycle count: 6 cycles
  this.cpu.addCycles(6);
}

// SUBR: Subtract Register from Register
// Format: SUBR src, dst
// Operation: dst ← dst - src
// Flags: C, OV, S, Z all set
private executeSubr(inst: Instruction): void {
  const src = inst.operands[0].value;
  const dst = inst.operands[1].value;

  const srcValue = this.cpu.getRegister(src);
  const dstValue = this.cpu.getRegister(dst);

  const result = dstValue - srcValue;
  this.cpu.setRegister(dst, result);

  // Set all arithmetic flags
  this.setArithmeticFlags(result, dstValue, srcValue, true);

  // Cycle count: 6 cycles
  this.cpu.addCycles(6);
}
```

**Tests to Write:**
- Addition without overflow
- Addition with unsigned overflow (carry)
- Addition with signed overflow
- Subtraction without borrow
- Subtraction with borrow (carry)
- Subtraction with signed overflow
- Zero result (Z flag)
- Negative result (S flag)

**Critical Edge Cases:**
- `0x7FFF + 0x0001 = 0x8000` → OV=1 (positive overflow to negative)
- `0x8000 - 0x0001 = 0x7FFF` → OV=1 (negative overflow to positive)
- `0xFFFF + 0x0001 = 0x0000` → C=1, Z=1

---

### 6. Implement Logic Instructions
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 2 hours

**Location:** `packages/core/src/executor/executor.ts`

**Instructions to Implement:**
- **ANDR** - Bitwise AND register to register
- **XORR** - Bitwise XOR register to register
- **CLR** - Clear register (set to 0)

**Tasks:**
- [ ] Implement `executeAndr()` - bitwise AND
- [ ] Implement `executeXorr()` - bitwise XOR
- [ ] Implement `executeClr()` - clear to zero
- [ ] Set S, Z flags (logic ops don't affect C, OV)

**Implementation Details:**

```typescript
// ANDR: Bitwise AND Register to Register
// Format: ANDR src, dst
// Operation: dst ← dst & src
// Flags: S, Z set; C, OV unchanged
private executeAndr(inst: Instruction): void {
  const src = inst.operands[0].value;
  const dst = inst.operands[1].value;

  const srcValue = this.cpu.getRegister(src);
  const dstValue = this.cpu.getRegister(dst);

  const result = dstValue & srcValue;
  this.cpu.setRegister(dst, result);

  // Set S and Z flags
  const sign = (result & 0x8000) !== 0;
  const zero = result === 0;
  this.cpu.setFlags({ sign, zero });

  // Cycle count: 6 cycles
  this.cpu.addCycles(6);
}

// XORR: Bitwise XOR Register to Register
// Format: XORR src, dst
// Operation: dst ← dst ^ src
// Flags: S, Z set; C, OV unchanged
private executeXorr(inst: Instruction): void {
  const src = inst.operands[0].value;
  const dst = inst.operands[1].value;

  const srcValue = this.cpu.getRegister(src);
  const dstValue = this.cpu.getRegister(dst);

  const result = dstValue ^ srcValue;
  this.cpu.setRegister(dst, result);

  // Set S and Z flags
  const sign = (result & 0x8000) !== 0;
  const zero = result === 0;
  this.cpu.setFlags({ sign, zero });

  // Cycle count: 6 cycles
  this.cpu.addCycles(6);
}

// CLR: Clear Register (special case of XORR Rn, Rn)
// Format: CLR dst (encoded as XORR dst, dst)
// Operation: dst ← 0
// Flags: S=0, Z=1; C, OV unchanged
private executeClr(inst: Instruction): void {
  const dst = inst.operands[0].value;

  this.cpu.setRegister(dst, 0);

  // Always sets Z=1, S=0
  this.cpu.setFlags({ sign: false, zero: true });

  // Cycle count: 6 cycles (same as XORR)
  this.cpu.addCycles(6);
}
```

**Tests to Write:**
- AND with all bits set (0xFFFF)
- AND with zero (result = 0)
- XOR with self (result = 0, same as CLR)
- XOR with 0xFFFF (bitwise NOT)
- Various bit patterns

---

### 7. Implement Status Instructions
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 1 hour

**Location:** `packages/core/src/executor/executor.ts`

**Instructions to Implement:**
- **TST** - Test register (set flags without storing)
- **HLT** - Halt processor

**Tasks:**
- [ ] Implement `executeTst()` - set flags based on register value
- [ ] Implement `executeHlt()` - halt execution

**Implementation Details:**

```typescript
// TST: Test Register (set flags without modifying register)
// Format: TST reg
// Operation: Set flags based on reg value (no store)
// Flags: S, Z set; C, OV cleared
private executeTst(inst: Instruction): void {
  const reg = inst.operands[0].value;
  const value = this.cpu.getRegister(reg);

  // Set S and Z, clear C and OV
  const sign = (value & 0x8000) !== 0;
  const zero = value === 0;
  this.cpu.setFlags({ sign, zero, carry: false, overflow: false });

  // Cycle count: 6 cycles
  this.cpu.addCycles(6);
}

// HLT: Halt Processor
// Format: HLT
// Operation: Stop execution
// Flags: Not affected
private executeHlt(inst: Instruction): void {
  const state = this.cpu.getState();
  state.halted = true;
  this.cpu.setState(state);

  // Cycle count: 4 cycles
  this.cpu.addCycles(4);
}
```

---

### 8. Bit-Accurate Helper Functions
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 1 hour

**Location:** `packages/core/src/utils/bitops.ts`

**Tasks:**
- [ ] Implement `toUint16(value: number): number` - mask to 16 bits unsigned
- [ ] Implement `toInt16(value: number): number` - convert to 16-bit signed
- [ ] Implement `toUint10(value: number): number` - mask to 10 bits
- [ ] Add unit tests for edge cases

**Implementation:**

```typescript
/**
 * Convert a number to 16-bit unsigned (mask to 0xFFFF)
 */
export function toUint16(value: number): number {
  return value & 0xFFFF;
}

/**
 * Convert a 16-bit unsigned value to signed (-32768 to 32767)
 */
export function toInt16(value: number): number {
  const unsigned = value & 0xFFFF;
  return unsigned >= 0x8000 ? unsigned - 0x10000 : unsigned;
}

/**
 * Convert a number to 10-bit unsigned (mask to 0x3FF)
 */
export function toUint10(value: number): number {
  return value & 0x3FF;
}
```

**Tests:**
- Positive numbers within range
- Negative numbers (underflow)
- Large numbers (overflow)
- Edge cases (0x7FFF, 0x8000, 0xFFFF)

---

### 9. Unit Tests (Per Instruction)
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 5 hours

**Location:** `packages/core/src/executor/executor.test.ts`

**Tasks:**
- [ ] Test suite for each instruction
- [ ] Test all addressing mode variants
- [ ] Test flag setting for each instruction
- [ ] Test edge cases (boundary values, zero, overflow)
- [ ] Achieve >90% code coverage

**Test Structure:**

```typescript
describe('Executor', () => {
  let cpu: CPU;
  let memory: Memory;
  let decoder: Decoder;
  let executor: Executor;

  beforeEach(() => {
    memory = new Memory();
    cpu = new CPU();
    decoder = new Decoder(memory);
    executor = new Executor(cpu, memory);
  });

  describe('MOVR instruction', () => {
    test('moves value from source to destination register', () => {
      cpu.setRegister(1, 0x1234);

      // MOVR R1, R2 (move R1 to R2)
      memory.write(0x5000, 0x08A);  // MOVR pattern
      const inst = decoder.decode(0x5000, false);
      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x1234);
      expect(cpu.getRegister(1)).toBe(0x1234);  // Source unchanged
    });

    test('sets zero flag when moving zero', () => {
      cpu.setRegister(1, 0);

      memory.write(0x5000, 0x08A);  // MOVR R1, R2
      const inst = decoder.decode(0x5000, false);
      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.zero).toBe(true);
      expect(flags.sign).toBe(false);
    });

    test('sets sign flag when moving negative value', () => {
      cpu.setRegister(1, 0x8000);  // -32768 in signed

      memory.write(0x5000, 0x08A);  // MOVR R1, R2
      const inst = decoder.decode(0x5000, false);
      executor.execute(inst);

      const flags = cpu.getFlags();
      expect(flags.sign).toBe(true);
      expect(flags.zero).toBe(false);
    });
  });

  describe('ADDR instruction', () => {
    test('adds two positive numbers', () => {
      cpu.setRegister(1, 100);
      cpu.setRegister(2, 50);

      memory.write(0x5000, 0x0D4);  // ADDR R2, R4
      const inst = decoder.decode(0x5000, false);
      executor.execute(inst);

      expect(cpu.getRegister(4)).toBe(150);
    });

    test('sets carry flag on unsigned overflow', () => {
      cpu.setRegister(1, 0xFFFF);
      cpu.setRegister(2, 0x0001);

      memory.write(0x5000, 0x0CA);  // ADDR R1, R2
      const inst = decoder.decode(0x5000, false);
      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0);  // Wraps to 0
      const flags = cpu.getFlags();
      expect(flags.carry).toBe(true);
      expect(flags.zero).toBe(true);
    });

    test('sets overflow flag on signed overflow', () => {
      cpu.setRegister(1, 0x7FFF);  // Max positive (32767)
      cpu.setRegister(2, 0x0001);

      memory.write(0x5000, 0x0CA);  // ADDR R1, R2
      const inst = decoder.decode(0x5000, false);
      executor.execute(inst);

      expect(cpu.getRegister(2)).toBe(0x8000);  // -32768 in signed
      const flags = cpu.getFlags();
      expect(flags.overflow).toBe(true);
      expect(flags.sign).toBe(true);
    });
  });

  // ... tests for all other instructions
});
```

**Coverage Target:** >90% for executor module

---

### 10. Integration Tests
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 3 hours

**Location:** `packages/core/src/executor/executor.integration.test.ts`

**Tasks:**
- [ ] Test instruction sequences (load, compute, store)
- [ ] Test flag propagation across instructions
- [ ] Test register aliasing (R7 = PC)
- [ ] Test cycle counting accuracy
- [ ] Test realistic program fragments

**Example Tests:**

```typescript
describe('Executor Integration Tests', () => {
  test('executes simple program: load, add, store', () => {
    // Program:
    //   MVI R1, #10    ; Load 10 into R1
    //   MVI R2, #20    ; Load 20 into R2
    //   ADDR R1, R2    ; Add R1 to R2 (R2 = 30)
    //   MVO R2, $0200  ; Store result to memory

    const memory = new Memory();
    const cpu = new CPU();
    const decoder = new Decoder(memory);
    const executor = new Executor(cpu, memory);

    // MVI R1, #10
    memory.write(0x5000, 0x2B9);  // MVI R1
    memory.write(0x5001, 10);

    // MVI R2, #20
    memory.write(0x5002, 0x2BA);  // MVI R2
    memory.write(0x5003, 20);

    // ADDR R1, R2
    memory.write(0x5004, 0x0CA);  // ADDR R1, R2

    // MVO R2, $0200
    memory.write(0x5005, 0x2C2);  // MVO R2, direct mode
    memory.write(0x5006, 0x200);  // Address

    // Execute program
    cpu.setPC(0x5000);

    for (let i = 0; i < 4; i++) {
      const pc = cpu.getPC();
      const inst = decoder.decode(pc, cpu.getState().sdbd);
      executor.execute(inst);
    }

    // Verify results
    expect(cpu.getRegister(1)).toBe(10);
    expect(cpu.getRegister(2)).toBe(30);
    expect(memory.read(0x200)).toBe(30);
  });
});
```

---

### 11. Documentation & Examples
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 2 hours

**Tasks:**
- [ ] Add JSDoc comments to CPU and Executor public APIs
- [ ] Create usage examples in README
- [ ] Document flag calculation edge cases
- [ ] Update ARCHITECTURE.md with execution flow

**Example README Section:**

```typescript
// Example: Execute a simple program
const memory = new Memory();
const cpu = new CPU();
const decoder = new Decoder(memory);
const executor = new Executor(cpu, memory);

// Load program into memory
memory.write(0x5000, 0x2B9);  // MVI R1, #42
memory.write(0x5001, 42);

// Set PC and execute
cpu.setPC(0x5000);
const inst = decoder.decode(cpu.getPC(), false);
executor.execute(inst);

console.log(cpu.getRegister(1));  // 42
console.log(cpu.getFlags().zero);  // false
```

---

## Sprint Completion Checklist

### Code Complete
- [ ] CPU class fully implemented
- [ ] Executor class fully implemented
- [ ] All core instructions working (MOVR, MVI, MVO, ADDR, SUBR, INC, DEC, ANDR, XORR, CLR, TST, HLT)
- [ ] Flag calculations bit-accurate
- [ ] Code compiles with no errors
- [ ] Code passes linter (TypeScript strict mode)

### Testing Complete
- [ ] Unit tests written for all instructions
- [ ] Unit test coverage >90%
- [ ] Integration tests with instruction sequences
- [ ] Edge cases tested (overflow, underflow, zero)
- [ ] All tests passing

### Documentation Complete
- [ ] Public APIs have JSDoc comments
- [ ] Usage examples in README
- [ ] Flag calculation documented
- [ ] ARCHITECTURE.md updated
- [ ] project-log/ updated with progress

---

## Sprint Review

### Demo
Show:
1. Execute MOVR (register move)
2. Execute ADDR with overflow
3. Execute full program (load, compute, store)
4. Show test coverage report

### Retrospective Questions
1. What went well?
2. What could be improved?
3. Any blockers encountered?
4. Estimated vs actual effort?
5. Ready for Sprint 1.4?

---

## Next Sprint Preview: 1.4 - Control Flow & Stack

**Goals:**
- Implement branch instructions (B, BEQ, BNEQ, etc.)
- Implement jump instructions (J, JR, JSR)
- Implement stack operations (PSHR, PULR)
- Integration tests with control flow

**Depends on:**
- Sprint 1.3 executor working ✅

---

## Notes & Decisions

### Design Decisions
*(Add decisions made during sprint)*

### Blockers
*(Add any blockers encountered)*

### Questions
*(Add questions that arise during sprint)*

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-09 | Claude | Initial Sprint 1.3 plan created |

---

**See Also:**
- [ROADMAP.md](ROADMAP.md) - Overall project phases
- [Sprint-1.2.md](Sprint-1.2.md) - Previous sprint (instruction decoder)
- [CPU_SPECIFICATION.md](CPU_SPECIFICATION.md) - Instruction details
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
