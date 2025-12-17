# Instruction Set Verification Findings

**Date:** 2025-12-16
**Reviewer:** Claude Sonnet 4.5
**Purpose:** Verify discrepancies identified in instruction-set-review-2025-12-14.md

---

## Summary

**Verification Status:** ✅ COMPLETE

The instruction-set-review-2025-12-14.md findings have been verified against the canonical CP-1600 reference (`docs/cp1600-ref/cp1600_ref.json`). The review is **accurate** with the following clarifications:

---

## Confirmed Findings

### 1. Missing Canonical Instructions (10 instructions) ✅ CONFIRMED

These instructions are documented in `cp1600_ref.json` but not defined in `decoder.types.ts`:

#### Immediate Data - Register (Section 3.6.8)
- **MVII** - Move In Immediate data to register DDD from PC + 1
- **ADDI** - Add Immediate data to contents of register DDD
- **SUBI** - SUBtract Immediate data from contents of register DDD
- **ANDI** - logical AND Immediate data with contest of register DDD
- **XORI** - eXclusive OR Immediate data with the contents of register DDD

**Note:** CMPI is already present in decoder, MVOI is already present.

#### Indirect Addressed Data-Register (Section 3.6.9)
- **ADD@** - ADD data located at the address in register MMM to contents of register DDD
- **SUB@** - SUBtract data located at the address in register MMM from contents of register DDD
- **CMP@** - CoMPare data located at the address in register MMM with contents of register SSS
- **AND@** - logical AND contents of register DDD with data located at the address in register MMM
- **XOR@** - eXclusive OR contents of register DDD with data located at the address in register MMM

**Note:** MVI@, MVO@, PSHR, PULR are already present in decoder.

**Action Required:** Add these 10 instructions to decoder.types.ts Opcode enum and implement decoding logic.

---

### 2. Decoder Opcodes Not in Canonical Reference (4 instructions) ✅ CONFIRMED AS ARTIFACTS

These opcodes are defined in `decoder.types.ts` but do **NOT** appear in `cp1600_ref.json`:

- **CLR** - Not a CP-1600 instruction
- **INC** - Not a CP-1600 instruction
- **DEC** - Not a CP-1600 instruction
- **TST** - Not a CP-1600 instruction

**Analysis:**
- These are defined in the `Opcode` enum but **never referenced** anywhere in the codebase
- The CP-1600 has register-only variants: CLRR, INCR, DECR, TSTR
- There are **no memory-access variants** (CLR, INC, DEC, TST) in the canonical instruction set
- These appear to be artifacts from early planning or misunderstanding of the instruction set

**Canonical Instructions Present:**
- CLRR ✅ - Clear Register (opcode 0x111 DDD DDD, Register to Register section)
- INCR ✅ - Increment Register (opcode 0x000 001 DDD, Single Register section)
- DECR ✅ - Decrement Register (opcode 0x000 010 DDD, Single Register section)
- TSTR ✅ - Test Register (opcode 0x010 SSS SSS, Register to Register section)
- CLRC ✅ - Clear Carry flag (opcode 0x000 000 110, Control section)

**Action Required:** Remove CLR, INC, DEC, TST from decoder.types.ts Opcode enum.

---

### 3. In Decoder but Not Implemented in Executor (22 instructions) ✅ CONFIRMED

Cross-referenced with canonical reference and decoder.types.ts:

#### Verified Present in Canonical Reference:

**Branches (3):**
- BESC ✅ - Branch on Equal Sign and Carry (Section 3.6.6)
- BEXT ✅ - Branch if External condition is True (Section 3.6.6)
- BUSC ✅ - Branch if Unequal Sign and Carry (Section 3.6.6)

**Control (4):**
- CLRC ✅ - CLeaR Carry to zero (Section 3.6.4)
- SDBD ✅ - Set Double Byte Data (Section 3.6.4)
- SETC ✅ - SET Carry to one (Section 3.6.4)
- TCI ✅ - Terminate Current Interrupt (Section 3.6.4)

**Immediate Data - Register (1):**
- CMPI ✅ - CoMPare Immediate (Section 3.6.8)

**Jump (2):**
- JD ✅ - Jump to address, Disable interrupts (Section 3.6.5)
- JE ✅ - Jump to address, Enable interrupts (Section 3.6.5)

**Register to Register (1):**
- CMPR ✅ - CoMPare Register (Section 3.6.1)

**Single Register (6):**
- ADCR ✅ - ADd Carry bit (Section 3.6.2)
- COMR ✅ - one's COMplement (Section 3.6.2)
- GSWD ✅ - Get Status WorD (Section 3.6.2)
- NOP ✅ - No Operation (Section 3.6.2)
- RSWD ✅ - Restore Status WorD (Section 3.6.2)
- SIN ✅ - Software Interrupt (Section 3.6.2)

**Immediate Data - Register (1):**
- MVOI ✅ - MoVe Out Immediate (Section 3.6.8)

#### Artifacts (Should be Removed - 4):
- CLR ❌ - Not in canonical reference
- INC ❌ - Not in canonical reference
- DEC ❌ - Not in canonical reference
- TST ❌ - Not in canonical reference

**Actual count needing executor implementation:** 18 canonical instructions + 10 missing from decoder = 28 total

**Action Required:** Implement executor functions for the 18 confirmed canonical instructions.

---

## Canonical Reference Statistics

**Total Sections in cp1600_ref.json:** 11
1. REGISTER TO REGISTER (3.6.1) - 9 instructions
2. SINGLE REGISTER (3.6.2) - 8 instructions
3. REGISTER SHIFT (3.6.3) - 8 instructions
4. CONTROL (3.6.4) - 6 instructions
5. JUMP (3.6.5) - 5 instructions
6. BRANCHES (3.6.6) - 18 instructions
7. DIRECT ADDRESSED DATA — MEMORY (3.6.7) - 5 instructions
8. IMMEDIATE DATA - REGISTER (3.6.8) - 7 instructions
9. INDIRECT ADDRESSED DATA-REGISTER (3.6.9) - 9 instructions
10. IMMEDIATE DOUBLE BYTE DATA - REGISTER (3.6.10) - SDBD-prefixed variants
11. INDIRECT ADDRESSED DOUBLE BYTE DATA - REGISTER (3.6.11) - SDBD-prefixed variants

**Canonical Instruction Count (excluding SDBD variants):** ~79 instructions

---

## Recommendations

### Priority 1: Decoder Cleanup
1. **Remove artifacts:** Delete CLR, INC, DEC, TST from Opcode enum
2. **Add missing instructions:** Add MVII, ADDI, SUBI, ANDI, XORI, ADD@, SUB@, CMP@, AND@, XOR@

### Priority 2: Decoder Implementation
1. Add decoding logic for the 10 missing immediate/indirect instructions
2. Update decoder tests to cover new instructions
3. Verify opcode patterns match cp1600_ref.json

### Priority 3: Executor Implementation
1. Implement 18 confirmed canonical instructions in executor
2. Implement the 10 newly added decoder instructions
3. Update executor tests for all new instructions

### Priority 4: Documentation
1. Update instruction counts in README.md
2. Update decoder statistics in documentation
3. Create migration notes for removed opcodes (CLR, INC, DEC, TST)

---

## Validation Checklist

- [x] Verified missing instructions against cp1600_ref.json
- [x] Confirmed artifacts (CLR, INC, DEC, TST) not in canonical reference
- [x] Cross-referenced decoder enum with canonical sections
- [x] Verified executor implementation gaps
- [x] Documented findings and recommendations

---

## Next Steps

1. Create decoder fixes branch
2. Remove CLR, INC, DEC, TST from Opcode enum
3. Add 10 missing canonical instructions
4. Implement decoding logic
5. Update tests
6. Implement executor functions
7. Update documentation

---

**Verified By:** Claude Sonnet 4.5
**Date:** 2025-12-16
**References:**
- docs/cp1600-ref/cp1600_ref.json (canonical reference)
- packages/core/src/decoder/decoder.types.ts (decoder opcodes)
- docs/instruction-set-review-2025-12-14.md (original review)
