# Sprint 1.6: Remaining Instructions - Shifts, Rotates, and Immediate Forms

**Status:** ✅ COMPLETE
**Started:** 2025-12-12
**Completed:** 2025-12-12
**Branch:** `pkcc-sprint1-6-2025-12-12`

---

## Sprint Goal

Complete the CP-1600 instruction set by implementing the remaining ~15 instructions: shift operations, rotate operations, negate/complement, and immediate arithmetic/logic variants. This will bring the executor to 100% instruction coverage for Phase 1.

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
- Data movement instructions: MOVR, MVI, MVO

**Sprint 1.4** ✅ (2025-12-09)
- Arithmetic instructions: ADDR, SUBR, INCR, DECR
- Logical instructions: ANDR, XORR, CLRR
- Status instructions: TSTR, HLT
- 226 tests passing, 94.19% coverage

**Sprint 1.5** ✅ (2025-12-11)
- Control flow: B, J, JR, BEQ, BNEQ, BC, BNC, BOV, BNOV, BMI, BPL
- Signed comparison: BLT, BGE, BLE, BGT
- Subroutines: JSR, JSRE, JSRD
- Stack: PSHR, PULR
- Control: NOPP, EIS, DIS
- 288 tests passing, 92.86% coverage

**Sprint 1.5.1 (Bonus)** ✅ (2025-12-11)
- 6 complete CP-1600 assembly examples (~2,500 lines documentation)
- Examples: hello-world, counter-loop, subroutine-call, bit-manipulation, signed-math, nested-calls
- Comprehensive READMEs with execution traces and expected states
- Ready as test cases for MCP server (Sprint 1.7)
- **Note:** bit-manipulation example uses Sprint 1.6 instructions (preview)

### Current Status (Start of Sprint 1.6)

- **CPU Core:** ✅ Complete
- **Decoder:** ✅ Complete (116 opcodes)
- **Executor:** 35/50 instructions (70%)
- **Test Coverage:** 92.86%
- **Total Tests:** 288 passing

---

## Sprint Objectives

### Primary Deliverables ✅ **COMPLETED**

1. **Shift Instructions** (5 instructions) ✅
   - SLL - Shift Logical Left
   - SLLC - Shift Logical Left through Carry
   - SLR - Shift Logical Right
   - SAR - Shift Arithmetic Right
   - SARC - Shift Arithmetic Right through Carry

2. **Rotate Instructions** (2 instructions) ✅
   - RLC - Rotate Left through Carry
   - RRC - Rotate Right through Carry

3. **Bit Manipulation** (2 instructions) ✅
   - SWAP - Swap bytes (high ↔ low)
   - COMR - Complement (one's complement, already implemented)
   - NEGR - Negate (two's complement)

4. **Immediate/Memory Arithmetic/Logic** (5 instructions) ✅
   - ADD - Add Immediate or Memory
   - SUB - Subtract Immediate or Memory
   - CMP - Compare with Immediate or Memory
   - AND - AND with Immediate or Memory
   - XOR - XOR with Immediate or Memory

**Result:** 14 new instructions implemented (total: 49/50 opcodes = 98%)

### Test Requirements

- Comprehensive unit tests for each instruction
- Edge case tests (zero, negative, overflow, carry)
- Integration tests demonstrating:
  - Bit manipulation sequences
  - Multi-bit shifts
  - Immediate value operations with SDBD
- Maintain >90% coverage (target: 95%+)

### Documentation

- Update this Sprint-1.6.md with progress
- Update project-log/ upon completion
- Update README.md and ROADMAP.md
- Update index.ts phase marker to "1.6-complete-instruction-set"

---

## Instruction Breakdown

### Priority 1: Shift Instructions (5)

1. **SLL** - Shift Logical Left (6 cycles)
   - Operation: R ← R << 1, bit 0 ← 0, C ← old bit 15
   - Sets: C (bit shifted out), Z, S; Clears: OV

2. **SLLC** - Shift Logical Left through Carry (6 cycles)
   - Operation: R ← R << 1, bit 0 ← C, C ← old bit 15
   - Sets: C (bit shifted out), Z, S; Clears: OV

3. **SLR** - Shift Logical Right (6 cycles)
   - Operation: R ← R >> 1, bit 15 ← 0, C ← old bit 0
   - Sets: C (bit shifted out), Z, S; Clears: OV

4. **SAR** - Shift Arithmetic Right (6 cycles)
   - Operation: R ← R >> 1, bit 15 ← old bit 15 (sign extend), C ← old bit 0
   - Sets: C (bit shifted out), Z, S; Clears: OV

5. **SARC** - Shift Arithmetic Right through Carry (6 cycles)
   - Operation: R ← R >> 1, bit 15 ← C, C ← old bit 0
   - Sets: C (bit shifted out), Z, S; Clears: OV

### Priority 2: Rotate Instructions (2)

6. **RLC** - Rotate Left through Carry (6 cycles)
   - Operation: temp ← C, C ← bit 15, R ← (R << 1) | temp
   - Sets: C (bit rotated out), Z, S; Clears: OV

7. **RRC** - Rotate Right through Carry (6 cycles)
   - Operation: temp ← C, C ← bit 0, R ← (R >> 1) | (temp << 15)
   - Sets: C (bit rotated out), Z, S; Clears: OV

### Priority 3: Bit Manipulation (2)

8. **SWAP** - Swap Bytes (6 cycles)
   - Operation: R ← ((R & 0xFF) << 8) | ((R & 0xFF00) >> 8)
   - Sets: Z, S; OV unchanged; C ← 0

9. **NEGR** - Negate (Two's Complement) (6 cycles)
   - Operation: R ← -R (0 - R)
   - Sets: C, OV, Z, S (all arithmetic flags)
   - Special case: -0x8000 = 0x8000 (overflow)

### Priority 4: Immediate Operations (4)

10. **ADDI** - Add Immediate (8/10 cycles)
    - Operation: R ← R + #imm
    - Sets: C, OV, Z, S (all arithmetic flags)
    - Cycles: 8 normal, 10 with SDBD

11. **SUBI** - Subtract Immediate (8/10 cycles)
    - Operation: R ← R - #imm
    - Sets: C, OV, Z, S (all arithmetic flags)
    - Cycles: 8 normal, 10 with SDBD

12. **ANDI** - AND with Immediate (8/10 cycles)
    - Operation: R ← R & #imm
    - Sets: Z, S; C, OV unchanged
    - Cycles: 8 normal, 10 with SDBD

13. **XORI** - XOR with Immediate (8/10 cycles)
    - Operation: R ← R ^ #imm
    - Sets: Z, S; C, OV unchanged
    - Cycles: 8 normal, 10 with SDBD

**Note:** COMR (Complement) is already implemented in Sprint 1.4. CMPI (Compare Immediate) is also already implemented.

---

## Critical Implementation Details

### Shift Operations

**Key Points:**
- Shifts affect C flag (bit shifted out)
- All shifts clear OV flag
- Logical shifts: fill with 0
- Arithmetic shifts: preserve sign bit (SAR only)
- Through-carry variants: use C as input bit

**Implementation Pattern:**
```typescript
// SLL example
const value = cpu.getRegister(dst);
const carryOut = getBit(value, 15) === 1;
const result = toUint16(value << 1);

cpu.setRegister(dst, result);
cpu.setFlags({
  C: carryOut,
  OV: false,  // Always cleared
  Z: result === 0,
  S: getBit(result, 15) === 1
});
```

### Rotate Operations

**Key Points:**
- Rotate through carry: 17-bit rotation (16 bits + C flag)
- Carry acts as an extra bit in the rotation
- OV flag is cleared (like shifts)

**Implementation Pattern:**
```typescript
// RLC example
const value = cpu.getRegister(dst);
const flags = cpu.getFlags();
const oldCarry = flags.C ? 1 : 0;
const newCarry = getBit(value, 15) === 1;
const result = toUint16((value << 1) | oldCarry);

cpu.setRegister(dst, result);
cpu.setFlags({
  C: newCarry,
  OV: false,
  Z: result === 0,
  S: getBit(result, 15) === 1
});
```

### SWAP (Byte Swap)

**Key Points:**
- Swaps high and low bytes
- Clears C flag (special behavior)
- OV unchanged

**Implementation:**
```typescript
const value = cpu.getRegister(dst);
const low = value & 0xFF;
const high = (value & 0xFF00) >> 8;
const result = (low << 8) | high;

cpu.setRegister(dst, result);
cpu.setFlags({
  C: false,  // Always cleared
  Z: result === 0,
  S: getBit(result, 15) === 1
  // OV unchanged
});
```

### NEGR (Two's Complement Negate)

**Key Points:**
- Equivalent to: 0 - value
- Uses same flag logic as SUBR
- Special case: -0x8000 = 0x8000 (overflow)

**Implementation:**
```typescript
const value = cpu.getRegister(dst);
const result = 0 - value;
cpu.setRegister(dst, result);

// Use existing setArithmeticFlags helper
setArithmeticFlags(result, 0, value, true);
```

### Immediate Instructions with SDBD

**Key Points:**
- Normal immediate: 10-bit value (0-1023 or sign-extended)
- SDBD mode: 16-bit value (two decles)
- Instruction detects SDBD via inst.sdbd flag
- Cycles: 8 normal, 10 with SDBD

**Already implemented for MVI - same pattern applies:**
```typescript
const cycles = inst.sdbd ? 10 : 8;
cpu.addCycles(cycles);
```

---

## Test Strategy

### Unit Tests Per Instruction

Each instruction needs:
1. **Basic functionality** - Instruction works correctly
2. **Carry flag tests** - C set/cleared appropriately
3. **Overflow tests** - OV behavior correct (shifts clear OV)
4. **Zero flag test** - Result is zero
5. **Sign flag test** - Result is negative
6. **Edge cases** - Boundary values (0, 0xFFFF, 0x8000)

### Shift/Rotate Specific Tests

1. **Multi-bit shifts** - Shift by multiple positions
2. **Carry propagation** - Verify carry in/out
3. **Sign preservation** - SAR maintains sign bit
4. **17-bit rotation** - RLC/RRC with carry

### Immediate Operation Tests

1. **Normal immediate** - 10-bit values
2. **SDBD mode** - 16-bit values
3. **Cycle timing** - 8 vs 10 cycles
4. **Flag behavior** - Matches register variants

### Integration Tests

1. **Bit manipulation sequence** - Use shifts to extract bits
2. **Multi-precision arithmetic** - Use SLLC/RLC for 32-bit ops
3. **Byte operations** - SWAP for endian conversion
4. **Immediate arithmetic** - ADDI/SUBI in loops

---

## Success Criteria

### Completion Checklist ✅

- [x] All ~15 remaining instructions implemented
- [x] Comprehensive unit tests (each instruction)
- [ ] Integration tests (bit manipulation, multi-precision) - Deferred
- [x] All tests passing (332 tests)
- [x] Test coverage >90% (achieved 92.97% line coverage)
- [x] No TypeScript errors
- [x] Cycle timing correct for all instructions
- [x] SDBD prefix handling validated
- [x] Testing documentation created (docs/testing-guide.md)
- [ ] Documentation updated (project-log/, README.md, ROADMAP.md) - In progress

### Quality Metrics ✅

- **Test Count:** 332 tests (was: 288, added 44 new tests)
- **Coverage:** 92.97% line coverage, 75% branch coverage
- **Instructions:** 49/50 opcodes implemented (98% Phase 1 coverage)
- **Code Quality:** No TypeScript errors, follows existing patterns
- **Test Files Added:**
  - `executor.shifts.test.ts` - 24 tests
  - `executor.immediate.test.ts` - 20 tests

---

## Implementation Notes

### Recommended Order

**Phase 1: Basic Shifts** (Start here)
1. SLL - Simplest shift (left, fill with 0)
2. SLR - Right shift, fill with 0
3. SAR - Right shift, preserve sign

**Phase 2: Advanced Shifts**
4. SLLC - Left with carry
5. SARC - Right with carry

**Phase 3: Rotates**
6. RLC - Rotate left through carry
7. RRC - Rotate right through carry

**Phase 4: Bit Manipulation**
8. SWAP - Byte swap
9. NEGR - Two's complement negate

**Phase 5: Immediate Forms**
10. ADDI - Add immediate
11. SUBI - Subtract immediate
12. ANDI - AND immediate
13. XORI - XOR immediate

### Common Pitfalls to Avoid

1. **Shift Direction:** Remember JavaScript << and >> operators
2. **Sign Extension:** SAR must preserve bit 15
3. **Carry Bit:** Don't confuse with overflow
4. **17-bit Rotation:** RLC/RRC include carry in rotation
5. **OV Cleared:** All shifts and rotates clear OV
6. **SWAP C Flag:** Always clears C (special case)
7. **16-bit Masking:** Always use toUint16() for results

---

## Progress Tracking ✅ **COMPLETE**

### Task List

#### Shifts ✅
- [x] SLL - Shift Logical Left
- [x] SLLC - Shift Logical Left through Carry
- [x] SLR - Shift Logical Right
- [x] SAR - Shift Arithmetic Right
- [x] SARC - Shift Arithmetic Right through Carry

#### Rotates ✅
- [x] RLC - Rotate Left through Carry
- [x] RRC - Rotate Right through Carry

#### Bit Manipulation ✅
- [x] SWAP - Swap Bytes
- [x] NEGR - Negate (Two's Complement)

#### Immediate/Memory Operations ✅
- [x] ADD - Add Immediate/Memory
- [x] SUB - Subtract Immediate/Memory
- [x] AND - AND Immediate/Memory
- [x] XOR - XOR Immediate/Memory
- [x] CMP - Compare Immediate/Memory

#### Testing ✅
- [x] Unit tests for all instructions (44 new tests)
- [x] SDBD immediate tests
- [x] Coverage >90% (achieved 92.97%)
- [x] All 332 tests passing
- [x] Testing documentation created

#### Documentation 🟡
- [x] testing-guide.md created
- [x] CLAUDE.md updated
- [x] This Sprint-1.6.md updated
- [ ] project-log/ updated
- [ ] README.md updated
- [ ] ROADMAP.md updated

---

## References

### Documentation
- [CPU_SPECIFICATION.md](CPU_SPECIFICATION.md) - Shift/rotate details
- [ARCHITECTURE.md](ARCHITECTURE.md) - Executor design
- [PRD_v1.2.md](PRD_v1.2.md) - Overall requirements

### Code References
- `packages/core/src/executor/executor.ts` - Current implementation
- `packages/core/src/cpu/cpu.ts` - CPU interface
- `packages/core/src/decoder/decoder.types.ts` - Opcode enum
- `packages/core/src/utils/bitops.ts` - Bit manipulation helpers

---

## Notes

### Design Decisions

**Shift/Rotate OV Flag:** All shift and rotate operations clear the OV flag. This is consistent with the CP-1600 hardware behavior.

**SWAP C Flag:** SWAP always clears the C flag (special case, different from other bit operations).

**NEGR Implementation:** Uses existing setArithmeticFlags helper since negate is equivalent to 0 - value.

**Immediate Cycle Timing:** Already implemented for MVI - same pattern (8 normal, 10 with SDBD).

### After This Sprint

With Sprint 1.6 complete, the executor will have:
- ✅ 50/50 instructions (100%)
- ✅ Full CP-1600 instruction set for Phase 1
- ✅ Ready for Phase 2 validation against jzIntv
- ✅ All Sprint 1.5.1 examples fully executable (including bit-manipulation)

**Assembly Examples Milestone:**
Once Sprint 1.6 is complete, all 6 examples from Sprint 1.5.1 will be fully executable:
- examples/04-bit-manipulation will work with implemented shifts/rotates
- Complete test suite ready for validation
- Can run all examples as integration tests

**Next:** Phase 2 will focus on:
- Sprint 2.1: jzIntv integration and trace comparison
- Sprint 2.2: Test ROM suite development (use Sprint 1.5.1 examples)
- Sprint 2.3: Bug hunting and edge case handling
- Sprint 2.4: Comprehensive validation (>99% compatibility)

---

## Sprint Timeline

**Expected Start:** 2025-12-11
**Target Completion:** TBD (completion-based, not calendar-based)
**Dependencies:** Sprint 1.5 complete (✅)

---

**Last Updated:** 2025-12-11 by Claude Code

**See Also:**
- [Sprint-1.5.md](Sprint-1.5.md) - Previous sprint
- [ROADMAP.md](ROADMAP.md) - Overall project plan
- [project-log/](project-log/) - Historical progress
