# Sprint 1.5: Control Flow and Stack Instructions

**Status:** ✅ COMPLETE
**Started:** 2025-12-10
**Completed:** 2025-12-11
**Branch:** `pkma-sprint1.5-2025-12-10`

---

## Sprint Goal

Implement control flow (branches, jumps, subroutines) and stack management (PSHR, PULR) instructions, enabling the CP-1600 emulator to execute programs with loops, conditionals, and function calls.

---

## Context

### Completed Sprints

**Sprint 1.1** ✅ (2025-12-08)
- Complete documentation suite
- Monorepo infrastructure with Turborepo + TypeScript

**Sprint 1.2** ✅ (2025-12-09)
- Instruction decoder (116 opcodes, all addressing modes)
- Comprehensive decoder tests

**Sprint 1.3** ✅ (2025-12-09)
- CPU core (8 registers, 4 flags, cycle tracking)
- Executor foundation with dispatch system
- Data movement instructions: MVO, MVI, MVOI

**Sprint 1.4** ✅ (2025-12-09)
- Arithmetic instructions: ADDR, ADDI, SUBR, SUBI, CMPR, CMPI
- Logical instructions: ANDR, XORR, COMR
- 226 tests passing, 94.19% coverage

### Current Status (Start of Sprint 1.5)

- **CPU Core:** ✅ Complete
- **Decoder:** ✅ Complete (116 opcodes)
- **Executor:** 🟡 12/50 instructions (24%)
- **Test Coverage:** 94.19%
- **Total Tests:** 226 passing

---

## Sprint Objectives

### Primary Deliverables

1. **Control Flow Instructions** (17 instructions)
   - Unconditional: B, J, JR
   - Conditional branches: BEQ, BNEQ, BC, BNC, BOV, BNOV, BMI, BPL
   - Signed comparison: BLT, BGE, BLE, BGT
   - Subroutines: JSR, JSRE, JSRD

2. **Stack Instructions** (2 instructions)
   - PSHR - Push Register to Stack
   - PULR - Pull from Stack to Register

3. **Control Instructions** (4 instructions - optional)
   - NOPP - No Operation
   - HLT - Halt Processor
   - EIS - Enable Interrupt System
   - DIS - Disable Interrupt System

**Target:** 19-23 new instructions (total: 31-35 instructions)

### Test Requirements

- Comprehensive unit tests for each instruction
- Integration tests demonstrating:
  - Loops with counters
  - Conditional execution
  - Nested subroutine calls with stack
- Maintain >90% coverage (target: 95%+)

### Documentation

- Update this Sprint-1.5.md with progress
- Update project-log.md upon completion
- Update index.ts phase marker

---

## Instruction Breakdown

### Priority 1: Essential Instructions (20)

#### Unconditional Control Flow (3)
1. **B** - Branch Unconditional (7 cycles)
2. **J** - Jump Absolute (7 cycles)
3. **JR** - Jump to Register (7 cycles)

#### Conditional Branches - Simple Flags (8)
4. **BEQ** - Branch if Equal (Z=1) (7/6 cycles)
5. **BNEQ** - Branch if Not Equal (Z=0) (7/6 cycles)
6. **BC** - Branch if Carry (C=1) (7/6 cycles)
7. **BNC** - Branch if No Carry (C=0) (7/6 cycles)
8. **BOV** - Branch if Overflow (OV=1) (7/6 cycles)
9. **BNOV** - Branch if No Overflow (OV=0) (7/6 cycles)
10. **BMI** - Branch if Minus (S=1) (7/6 cycles)
11. **BPL** - Branch if Plus (S=0) (7/6 cycles)

#### Conditional Branches - Signed Comparison (4)
12. **BLT** - Branch if Less Than (S XOR OV = 1) (7/6 cycles)
13. **BGE** - Branch if Greater or Equal (S XOR OV = 0) (7/6 cycles)
14. **BLE** - Branch if Less or Equal (Z=1 OR (S XOR OV)=1) (7/6 cycles)
15. **BGT** - Branch if Greater Than (Z=0 AND (S XOR OV)=0) (7/6 cycles)

#### Subroutine Instructions (3)
16. **JSR** - Jump to Subroutine (saves return in register) (12 cycles)
17. **JSRE** - JSR + Enable Interrupts (12 cycles)
18. **JSRD** - JSR + Disable Interrupts (12 cycles)

#### Stack Instructions (2)
19. **PSHR** - Push Register to Stack (11 cycles)
20. **PULR** - Pull from Stack to Register (11 cycles)

### Priority 2: Control Instructions (4)
21. **NOPP** - No Operation (7 cycles)
22. **HLT** - Halt Processor (special)
23. **EIS** - Enable Interrupt System (6 cycles)
24. **DIS** - Disable Interrupt System (6 cycles)

---

## Critical Implementation Details

### PC (Program Counter) Management

**CRITICAL:** R7 is the Program Counter (PC). Control flow instructions must handle it correctly:

**Branch/Jump Taken:**
```typescript
this.cpu.setRegister(7, toUint16(targetAddress));  // Set PC directly
// DO NOT call incrementPC() - already at target
```

**Branch Not Taken:**
```typescript
this.cpu.incrementPC();  // Normal PC increment
```

**Non-Control-Flow:**
```typescript
// ... instruction logic ...
this.cpu.incrementPC();  // ALWAYS increment for non-branch instructions
```

### Stack Behavior

**The CP-1600 stack grows UPWARD** (unusual):

**PSHR (Push):**
1. Pre-increment R6 (stack pointer)
2. Write value to memory[R6]

**PULR (Pop):**
1. Read value from memory[R6]
2. Post-decrement R6

**Stack Pointer Initialization:** Typically 0x02F0
**Stack Region:** 0x02F0-0x0318 (40 words)

### Subroutine Calling Convention

**JSR does NOT use stack automatically:**
- Return address saved in specified register (typically R4 or R5)
- For nested calls, save return address to stack first (PSHR R5)
- Return with JR instruction

**Example:**
```assembly
JSR R5, subroutine    ; R5 = PC + 1, PC = subroutine
; ... (at subroutine)
JR R5                 ; PC = R5 (return)
```

### Flag Behavior

**Control flow instructions do NOT modify flags** (except JSRE/JSRD for interrupt enable):
- Conditional branches TEST flags (set by previous instructions)
- Branches do NOT change flags
- Use CMPR, SUBI, etc. to set flags before branching

### Signed Comparison Logic

**BLT/BGE/BLE/BGT** use XOR of Sign and Overflow flags:

| Condition | Formula |
|-----------|---------|
| BLT (Less Than) | S XOR OV = 1 |
| BGE (Greater or Equal) | S XOR OV = 0 |
| BLE (Less or Equal) | Z=1 OR (S XOR OV)=1 |
| BGT (Greater Than) | Z=0 AND (S XOR OV)=0 |

**Why XOR?** Signed overflow changes the sign bit's meaning. XOR corrects for this.

---

## Test Strategy

### Unit Tests Per Instruction

Each instruction needs:
1. **Basic functionality test** - Instruction works correctly
2. **Branch taken test** (for conditionals) - Verify PC change and cycle count
3. **Branch not taken test** (for conditionals) - Verify PC increment and cycle count
4. **Flag preservation test** - Flags not modified by control flow
5. **Edge case tests** - Boundary conditions

### Integration Tests

1. **Loop Test** - Counter loop with SUBI + BNEQ
2. **Conditional Test** - If/else with BEQ
3. **Nested Subroutine Test** - JSR with stack (PSHR/PULR)
4. **Signed Comparison Test** - BLT/BGE with positive/negative numbers

### Test File Organization

- `executor.test.ts` - Core instruction tests
- `executor.control-flow.test.ts` - NEW: Branch/jump tests
- `executor.stack.test.ts` - NEW: Stack operation tests

---

## Memory Interface

### Current Status

Sprint 1.4 executor does NOT have Memory interface. Sprint 1.5 needs it for PSHR/PULR.

### Required Addition

```typescript
interface Memory {
  read(address: number): number;   // Read 16-bit word
  write(address: number, value: number): void;  // Write 16-bit word
}

export class Executor {
  private cpu: CPU;
  private memory: Memory;

  constructor(cpu: CPU, memory?: Memory) {
    this.cpu = cpu;
    this.memory = memory ?? new NullMemory();  // Null object pattern
  }
}
```

### For Tests

```typescript
class MockMemory implements Memory {
  private storage: Map<number, number> = new Map();

  read(address: number): number {
    return this.storage.get(address) ?? 0;
  }

  write(address: number, value: number): void {
    this.storage.set(address, value & 0xFFFF);
  }
}
```

---

## Success Criteria

### Completion Checklist

- [ ] All 20 priority 1 instructions implemented
- [ ] Priority 2 instructions implemented (if time permits)
- [ ] Memory interface added to executor
- [ ] Comprehensive unit tests (each instruction)
- [ ] Integration tests (loops, nested calls)
- [ ] All tests passing
- [ ] Test coverage >90% (target 95%+)
- [ ] No TypeScript errors
- [ ] Cycle timing correct for all instructions
- [ ] Documentation updated (project-log.md, index.ts)

### Quality Metrics

- **Test Count:** 300+ tests (current: 226, add ~80+)
- **Coverage:** >90% (current: 94.19%, maintain or improve)
- **Instructions:** 31-35 total (current: 12, add 19-23)
- **Code Quality:** No TypeScript errors, follows existing patterns

---

## Implementation Notes

### Recommended Order

**Phase 1: Simple Control Flow** (Start here)
1. B - Unconditional branch (simplest)
2. J, JR - Jumps
3. BEQ, BNEQ - Simplest conditional branches

**Phase 2: Flag-Based Branches**
4. BC, BNC, BOV, BNOV - Carry/overflow branches
5. BMI, BPL - Sign branches

**Phase 3: Signed Comparisons**
6. BLT, BGE - Basic signed comparison
7. BLE, BGT - Complex conditions (Z + signed)

**Phase 4: Subroutines**
8. JSR - Basic subroutine call
9. JSRE, JSRD - With interrupt flags

**Phase 5: Stack**
10. Add Memory interface
11. PSHR, PULR - Stack operations

**Phase 6: Control Instructions** (Optional)
12. NOPP, HLT, EIS, DIS

### Common Pitfalls to Avoid

1. **PC Management:** Don't increment PC on taken branches
2. **Stack Direction:** Remember stack grows UP (pre-increment push)
3. **Flag Modification:** Control flow doesn't change flags
4. **16-bit Masking:** Always use toUint16() for register values
5. **Cycle Counts:** Branch taken = 7, not taken = 6

---

## Progress Tracking

### Task List

#### Control Flow - Unconditional
- [x] B - Branch Unconditional
- [x] J - Jump Absolute
- [x] JR - Jump to Register

#### Control Flow - Conditional (Simple)
- [x] BEQ - Branch if Equal
- [x] BNEQ - Branch if Not Equal
- [x] BC - Branch if Carry
- [x] BNC - Branch if No Carry
- [x] BOV - Branch if Overflow
- [x] BNOV - Branch if No Overflow
- [x] BMI - Branch if Minus
- [x] BPL - Branch if Plus

#### Control Flow - Signed Comparison
- [x] BLT - Branch if Less Than
- [x] BGE - Branch if Greater or Equal
- [x] BLE - Branch if Less or Equal
- [x] BGT - Branch if Greater Than

#### Subroutines
- [x] JSR - Jump to Subroutine
- [x] JSRE - JSR + Enable Interrupts
- [x] JSRD - JSR + Disable Interrupts

#### Stack
- [x] Memory interface added (already present from Sprint 1.4)
- [x] PSHR - Push Register
- [x] PULR - Pull Register

#### Control Instructions
- [x] NOPP - No Operation
- [x] HLT - Halt Processor (already present)
- [x] EIS - Enable Interrupts
- [x] DIS - Disable Interrupts

#### Testing
- [x] Unit tests for all instructions (62 new tests)
- [x] Loop integration test
- [x] Nested subroutine integration test
- [x] Coverage >90% (achieved 92.86%)

#### Documentation
- [x] project-log.md updated
- [ ] index.ts phase marker updated
- [x] This Sprint-1.5.md updated

---

## References

### Documentation
- [CPU_SPECIFICATION.md](CPU_SPECIFICATION.md) - Lines 509-750 (control flow and stack)
- [ARCHITECTURE.md](ARCHITECTURE.md) - Executor design
- [PRD_v1.2.md](PRD_v1.2.md) - Overall requirements

### Code References
- `packages/core/src/executor/executor.ts` - Current implementation (472 lines)
- `packages/core/src/cpu/cpu.ts` - CPU interface
- `packages/core/src/decoder/decoder.types.ts` - Opcode enum
- `packages/core/src/utils/bitops.ts` - Bit manipulation helpers

### Manus Materials
- `ai-work/manus/sprint1.5/INSTRUCTIONS.md` - Detailed implementation guide
- `ai-work/manus/sprint1.5/resources/` - Reference files

---

## Notes

### Design Decisions

**Memory Interface:** Using optional constructor parameter for backward compatibility with existing tests. Null object pattern for tests that don't need memory.

**Interrupt Flags:** JSRE/JSRD/EIS/DIS will set a simple boolean flag in CPU state. Full interrupt handling deferred to Phase 3 (peripherals).

**HLT Instruction:** Sets cpu.halted flag. Executor.execute() should check this flag and stop execution.

### Future Work (Not This Sprint)

- Memory-mapped I/O (Phase 3)
- Full interrupt system (Phase 3)
- SDBD prefix handling (Sprint 1.6+)
- Remaining instructions: shifts, rotates, etc. (Sprint 1.6+)

---

## Sprint Timeline

**Started:** 2025-12-10
**Target Completion:** TBD (completion-based, not calendar-based)
**Dependencies:** None (all prerequisites complete)

---

## Sprint Completion Summary

**Completed:** 2025-12-11

### Deliverables Achieved

✅ **23 Instructions Implemented:**
- 3 unconditional control flow: B, J, JR
- 8 conditional branches (simple flags): BEQ, BNEQ, BC, BNC, BOV, BNOV, BMI, BPL
- 4 signed comparison branches: BLT, BGE, BLE, BGT
- 3 subroutine instructions: JSR, JSRE, JSRD
- 2 stack instructions: PSHR, PULR
- 3 control instructions: NOPP, EIS, DIS

✅ **Test Coverage:**
- 62 new unit tests added
- 288 total tests passing
- 92.86% statement coverage (target: >90%)
- 100% function coverage
- Comprehensive integration tests for loops and nested subroutines

✅ **Key Features:**
- Full control flow support (branches, jumps, subroutines)
- Stack operations with upward-growing stack (R6)
- Interrupt enable/disable tracking (ready for Phase 3)
- Proper PC management (no increment on taken branches)
- Correct cycle timing for all instructions

### Executor Progress

**Total Instructions:** 35/50 (70%)
- Sprint 1.3: 3 data movement instructions
- Sprint 1.4: 9 arithmetic/logical instructions
- Sprint 1.5: 23 control flow/stack instructions
- Remaining: ~15 instructions (shifts, rotates, SDBD-prefixed variants)

### Next Steps

Sprint 1.6 will implement remaining instructions:
- Shift instructions: SLL, SLR, SAR, RLC, RRC
- Immediate forms: ADDI, SUBI, CMPI, ANDI, XORI
- Additional addressing modes
- SDBD prefix handling for 16-bit immediates

---

**Last Updated:** 2025-12-11 by Claude Code

**See Also:**
- [Sprint-1.4.md](Sprint-1.4.md) - Previous sprint
- [ROADMAP.md](ROADMAP.md) - Overall project plan
- [project-log.md](project-log.md) - Historical progress
