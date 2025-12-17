# Next Steps - Post Sprint 1.7

**Date:** 2025-12-16
**Status:** Sprint 1.7 ~95% complete, transitioning to instruction validation and Phase 1.5 planning

---

## Priority 1: Instruction Set Validation & Fixes

### 1.1 Verify Instruction Set Discrepancies

Review findings in `docs/instruction-set-review-2025-12-14.md`:

**Missing from Decoder (10 instructions):**
- ADD@, ADDI, AND@, ANDI, CMP@, MVII, SUB@, SUBI, XOR@, XORI

**In Decoder but Not Canonical (4 instructions):**
- CLR, DEC, INC, TST (memory-access variants)

**In Decoder but Not Implemented (22 instructions):**
- Includes: ADCR, BESC, BEXT, BUSC, CLRC, CMPI, CMPR, COMR, GSWD, JD, JE, MVOI, NOP, RSWD, SDBD, SETC, SIN, TCI, etc.

**Action:**
- [ ] Cross-reference canonical instruction set with decoder implementation
- [ ] Verify each discrepancy against CP-1600 reference manual
- [ ] Document true vs. false positives (some may be legitimate variants)

### 1.2 Fix Decoder Issues

**Action:**
- [ ] Add missing canonical instructions to decoder
- [ ] Verify memory-access variants (CLR, INC, DEC, TST) against reference
- [ ] Update decoder tests for new instructions
- [ ] Ensure opcode patterns match cp1600_ref.json

### 1.3 Complete Executor Implementation

**22 instructions need executor implementation:**

**High Priority (Basic Operations):**
- [ ] CMPR - Compare registers
- [ ] CMPI - Compare immediate
- [ ] ADCR - Add carry
- [ ] COMR - One's complement
- [ ] NOP - No operation

**Control Instructions:**
- [ ] CLRC - Clear carry
- [ ] SETC - Set carry
- [ ] TCI - Terminate current interrupt
- [ ] SDBD - Set double byte data

**Jump Variants:**
- [ ] JD - Jump and disable interrupts
- [ ] JE - Jump and enable interrupts

**Branch Variants:**
- [ ] BESC - Branch on equal sign and carry
- [ ] BUSC - Branch on unequal sign and carry
- [ ] BEXT - Branch on external condition

**Status Word:**
- [ ] GSWD - Get status word
- [ ] RSWD - Restore status word

**Other:**
- [ ] MVOI - Move out immediate
- [ ] SIN - Software interrupt
- [ ] Memory variants (if legitimate): CLR, INC, DEC, TST

**Done When:**
- All canonical instructions have both decoder + executor
- All tests pass
- Coverage remains >90%

---

## Priority 2: Complete Sprint 1.7

### 2.1 Documentation Updates

**README.md:**
- [ ] Update current status to "Sprint 1.7 Complete"
- [ ] Update implementation status (instruction counts)
- [ ] Update test coverage percentage
- [ ] Add note about instruction validation in progress

**docs/ROADMAP.md:**
- [ ] Mark Sprint 1.7 as ✅ COMPLETE
- [ ] Update "Current Sprint" section
- [ ] Adjust upcoming sprint numbers if needed
- [ ] Add Phase 1.5 (see Priority 3)

**docs/Sprint-1.7.md:**
- [ ] Mark sprint as complete
- [ ] Add final status summary
- [ ] Document completion metrics (tools, tests, coverage)
- [ ] List known issues (instruction set discrepancies)

### 2.2 Optional: End-to-End MCP Testing

- [ ] Test with Claude Desktop if possible
- [ ] Verify all 11 tools work correctly
- [ ] Document any issues found
- [ ] Create test transcript

### 2.3 Project Log Entry

- [ ] Create `docs/project-log/project-log-entry-2025-12-16-003.md`
- [ ] Document Sprint 1.7 completion
- [ ] Note instruction validation work started
- [ ] Include test metrics and coverage

---

## Priority 3: Phase 1.5 Planning (Exec Integration)

### 3.1 Review Roadmap Adjustment Proposal

**Document:** `docs/roadmap-adjustment-plan-exec-integration-2025-12-14.md`

**Key Decision:** Insert Phase 1.5 (Intellivision System Foundation) before Phase 2

**Proposed Phase 1.5 Sprints:**
- Sprint 1.9: Memory Architecture
- Sprint 1.10: Exec ROM Integration
- Sprint 1.11: GROM/GRAM Support
- Sprint 1.12: BACKTAB and Background Support
- Sprint 1.13: System Integration and Testing

**Why This Matters:**
- Need Exec ROM to run real Intellivision cartridges
- Current roadmap jumps to jzIntv comparison without system foundation
- Phase 1.5 enables realistic testing with commercial ROMs
- Simplifies Phase 3 (STIC/PSG) by having memory map in place

**Action:**
- [x] Review proposal (Peter approves)
- [ ] Update ROADMAP.md to insert Phase 1.5
- [ ] Create sprint documents: Sprint-1.9.md through Sprint-1.13.md
- [ ] Update all references to Phase 2/3/4 numbering
- [ ] Communicate roadmap change in project log

### 3.2 Update Resources Guide

**New Resources Added:**
- `resources/exec.bin` - Intellivision Exec ROM
- `resources/grom.bin` - Graphics ROM

**Action:**
- [ ] Add exec.bin to docs/resources-guide.md
- [ ] Add grom.bin to docs/resources-guide.md
- [ ] Document licensing/source for these binaries
- [ ] Explain when to use them (Phase 1.5 implementation)
- [ ] Update quick reference index

### 3.3 Update Architecture Documents

**Files to update:**
- [ ] docs/ARCHITECTURE.md - Add Phase 1.5 architecture overview
- [ ] docs/intellivision_memory_map.md - Reference from architecture
- [ ] CLAUDE.md - Update phase information and current status
- [ ] README.md - Update roadmap section

---

## Estimated Timeline

**Priority 1 (Instruction Validation):** 3-5 days
- Verification: 1 day
- Decoder fixes: 1-2 days
- Executor implementation: 1-2 days

**Priority 2 (Sprint 1.7 Wrap):** 0.5-1 day
- Documentation updates only

**Priority 3 (Phase 1.5 Planning):** 1-2 days
- Roadmap updates and sprint planning

**Total:** 4.5-8 days to complete all priorities

---

## Success Criteria

### Priority 1 Complete
- ✅ All canonical instructions in decoder
- ✅ All decoder instructions implemented in executor
- ✅ Instruction set review document addressed
- ✅ Zero known instruction gaps
- ✅ Test coverage >90%

### Priority 2 Complete
- ✅ Sprint 1.7 marked complete in all docs
- ✅ README reflects current status
- ✅ ROADMAP updated
- ✅ Project log entry created

### Priority 3 Complete
- ✅ Phase 1.5 inserted in roadmap
- ✅ All sprint documents created (1.9-1.13)
- ✅ Resources guide updated with exec.bin/grom.bin
- ✅ Architecture docs reflect new plan
- ✅ Community/stakeholders notified of roadmap change

---

## Quick Commands Reference

### Testing
```bash
npm test                          # Run all tests
npm run test:core                 # Core package only
npm run test:coverage             # With coverage report
```

### Toolchain
```bash
npm run toolchain:bootstrap       # Bootstrap SDK-1600 tools
npm run as1600 -- file.asm -o file.bin
```

### CLI Testing
```bash
npm run cli:hello                 # Quick test
npm run cli:run -- path/to/rom.bin --trace
```

### MCP Server
```bash
npm run mcp:start                 # Start MCP server
# Then test with Claude Desktop per docs/MCP_SETUP.md
```

---

**Last Updated:** 2025-12-16
**Next Review:** After Priority 1 completion
