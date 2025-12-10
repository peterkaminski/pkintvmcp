# Sprint 1.4: Instructions for Manus

This directory contains prompts and reference materials for Manus (Claude) to implement Sprint 1.4.

---

## Files in This Directory

### 📋 quick-start.md
**Start here!** Concise guide with:
- What needs to be done (4 main tasks)
- Code patterns to follow
- Critical test cases
- Deliverable checklist

**Read this first** to get oriented quickly.

### 📖 prompts-for-manus.md
**Comprehensive reference** with:
- Full context from Sprint 1.3
- Detailed task breakdowns
- Implementation tips
- Success criteria
- Questions to clarify

**Read this** for complete details and background.

### 🔧 decoder-reference.md
**Technical reference** for decoder integration:
- Exact Opcode enum values (INCR not INC, TSTR not TST, etc.)
- AddressingMode enum
- Instruction and Operand interfaces
- Test helper factory code
- Import patterns

**Refer to this** when writing code to ensure correct types.

---

## Quick Start for Manus

1. **Read** `quick-start.md` (5 minutes)
2. **Skim** `prompts-for-manus.md` (10 minutes)
3. **Reference** `decoder-reference.md` while coding
4. **Implement** the four tasks
5. **Test** thoroughly (>90% coverage)
6. **Package** as ZIP and deliver

---

## Sprint 1.4 Overview

**Goal:** Complete the executor by implementing remaining instructions.

**Tasks:**
1. Adapt remaining tests from Sprint 1.3 (56 tests)
2. Implement arithmetic instructions (ADDR, SUBR, INCR, DECR)
3. Implement logic instructions (ANDR, XORR, CLRR)
4. Implement status instructions (TSTR, HLT)

**Deliverable:** ZIP file with updated executor and comprehensive tests.

**Quality bar:** All tests passing, >90% coverage, no TypeScript errors.

---

## Important Notes

### Opcode Name Differences ⚠️

The decoder uses different names than Sprint 1.3 docs suggested:
- Use `INCR` (not `INC`)
- Use `DECR` (not `DEC`)
- Use `CLRR` (not `CLR`)
- Use `TSTR` (not `TST`)

See `decoder-reference.md` for exact enum values.

### Key Patterns from Sprint 1.3

Your Sprint 1.3 work was excellent! Continue these patterns:
- ✅ Extract operands with `.value`: `inst.operands[0].value`
- ✅ Uppercase flag names: `C, OV, Z, S`
- ✅ Use Vitest (not Jest)
- ✅ Import from `decoder.types.ts`
- ✅ TypeScript strict mode compliance

### Test Helper

Create a helper to construct Instruction objects:
```typescript
function createTestInstruction(
  opcode: Opcode,
  operands: Array<{ type, value }>
): Instruction { ... }
```

See `decoder-reference.md` for full implementation.

---

## Success Criteria

Sprint 1.4 is complete when:
- ✅ All arithmetic instructions working (4 instructions)
- ✅ All logic instructions working (3 instructions)
- ✅ All status instructions working (2 instructions)
- ✅ Both remaining test files adapted (56 tests)
- ✅ >90% test coverage
- ✅ All tests passing
- ✅ Build succeeds
- ✅ README documenting work

---

## Questions?

If anything is unclear:
1. Check `decoder-reference.md` for type details
2. Check `prompts-for-manus.md` for context
3. Document assumptions in your README

---

## After Sprint 1.4

Next sprint will likely add:
- Control flow (branches, jumps)
- Stack operations
- Execution loop integration

But that's future work. Focus on Sprint 1.4 first!

---

**Thank you for the excellent Sprint 1.3 work! Looking forward to Sprint 1.4! 🚀**
