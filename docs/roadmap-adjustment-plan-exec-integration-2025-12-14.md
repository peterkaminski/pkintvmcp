# Roadmap Adjustment Plan: Exec ROM Integration

**Date:** 2025-12-14  
**Author:** Peter Kaminski + Manus AI  
**Purpose:** Adjust roadmap to include Intellivision Exec ROM and memory architecture before jzIntv comparison

---

## Executive Summary

The current roadmap proceeds directly from Phase 1 (CPU Core) to Phase 2 (Validation & Completion) with jzIntv comparison in Sprint 2.2. However, to run actual Intellivision cartridges (not just arbitrary CP-1600 code), we need the **Exec ROM** and proper **Intellivision memory architecture**.

This plan proposes inserting new sprints between Phase 1 and Phase 2 to implement these essential components, creating a more realistic emulation foundation before comparing with jzIntv.

---

## Problem Statement

### Current Situation

**What we have now:**
- ✅ Bare CP-1600 CPU emulator (51/51 Phase 1 instructions)
- ✅ Simple memory model (flat address space)
- ✅ Can run hand-written test programs (hello.bin)
- ✅ MCP server for debugging (~95% complete in Sprint 1.7)

**What we're missing:**
- ❌ Exec ROM (Intellivision operating system at $1000-$1FFF)
- ❌ Proper memory map (STIC, 8-bit RAM, 16-bit RAM, GROM, GRAM, etc.)
- ❌ RESET behavior (Exec takes control, reads UDB, initializes system)
- ❌ Universal Data Block (UDB) support
- ❌ BACKTAB (background table) in 16-bit RAM
- ❌ Graphics ROM (GROM) at $3000
- ❌ Graphics RAM (GRAM) at $3800

### Why This Matters

**Current roadmap Sprint 2.2** plans to compare with jzIntv using "test ROMs" and commercial games. However:

1. **Commercial Intellivision games require the Exec** - They're not standalone CP-1600 programs
2. **jzIntv emulates the full Intellivision system** - Including Exec, memory map, STIC, etc.
3. **Without Exec, we can't run real cartridges** - Only hand-written test code
4. **Memory architecture affects instruction behavior** - Different regions have different characteristics

**Conclusion:** We need Exec integration **before** jzIntv comparison, not after.

---

## Proposed Solution

### Insert New Phase 1.5: Intellivision System Foundation

Add a new phase between Phase 1 (CPU Core) and Phase 2 (Validation) to implement the Intellivision system architecture.

**New Phase Structure:**
- **Phase 1**: CPU Core (current, ✅ nearly complete)
- **Phase 1.5**: Intellivision System Foundation (NEW)
- **Phase 2**: Validation & Completion (adjusted)
- **Phase 3**: Peripherals (STIC, PSG, Controllers - existing)
- **Phase 4**: Production (existing)

---

## Phase 1.5: Intellivision System Foundation

### Sprint 1.9: Memory Architecture

**Goal:** Implement the complete Intellivision memory map

**Deliverables:**
1. **Memory Controller** - Replaces simple flat memory
   - Address decoding for all regions
   - Read/write handlers for each region
   - Memory-mapped I/O support

2. **Memory Regions:**
   - STIC registers ($0000-$003F)
   - 8-bit RAM ($0100-$01EF) - 240 bytes
   - Sound chip registers ($01F0-$01FD)
   - Controller ports ($01FE-$01FF)
   - 16-bit RAM ($0200-$035F) - 352 words
     - BACKTAB ($0200-$02EF) - 240 words
     - Stack ($02F1-$0318) - 40 words
     - Moving object data ($031D-$035C) - 64 words
   - Exec ROM placeholder ($1000-$1FFF) - 4K
   - GROM ($3000-$37FF) - 2K (256 pictures)
   - GRAM ($3800-$39FF) - 512 bytes (64 pictures)
   - Cartridge ROM ($5000-$6FFF) - 4K or 8K

3. **Tests:**
   - Memory region isolation
   - Address decoding correctness
   - Read/write to each region
   - Boundary conditions

**Done When:**
- All memory regions accessible at correct addresses
- Reads/writes go to correct regions
- Tests verify memory map matches Appendix A of Exec documentation
- Existing Phase 1 instructions still work with new memory controller

**Estimated Effort:** 2-3 days

---

### Sprint 1.10: Exec ROM Integration

**Goal:** Integrate the Intellivision Exec ROM and implement RESET behavior

**Deliverables:**
1. **Exec ROM Binary**
   - Obtain Exec ROM image (from jzIntv or other source)
   - Load into memory at $1000-$1FFF
   - Verify ROM checksum/integrity

2. **RESET Implementation:**
   - PC set to $1000 (Exec entry point) on RESET
   - Exec takes control
   - Exec reads cartridge UDB (Universal Data Block)
   - Exec initializes system per UDB

3. **Universal Data Block (UDB) Support:**
   - Parser for UDB structure in cartridge ROM
   - Extract: RESET routine address, background data, GRAM list, program name, etc.
   - Exec calls cartridge RESET routine when appropriate

4. **Exec Services (Minimal):**
   - Implement minimal Exec services needed for cartridge initialization
   - May stub out some services initially (e.g., moving objects, sound)
   - Focus on getting cartridge code to run

5. **Tests:**
   - RESET behavior correct
   - Exec ROM loaded and accessible
   - UDB parsing works
   - Simple cartridge can initialize

**Done When:**
- RESET jumps to Exec at $1000
- Exec can read and parse UDB from cartridge
- Exec calls cartridge RESET routine
- Simple test cartridge runs (e.g., displays background)
- Existing test programs still work (backward compatibility)

**Estimated Effort:** 3-5 days

**Dependencies:**
- Sprint 1.9 (Memory Architecture) must be complete
- Need Exec ROM binary (legal/licensing considerations)

---

### Sprint 1.11: GROM/GRAM Support

**Goal:** Implement Graphics ROM and Graphics RAM for background/sprite graphics

**Deliverables:**
1. **GROM (Graphics ROM):**
   - Load GROM binary at $3000-$37FF
   - 256 pictures (8x8 pixels each)
   - First 96 are ASCII characters
   - Accessible by CPU and (later) STIC

2. **GRAM (Graphics RAM):**
   - 512 bytes at $3800-$39FF
   - 64 pictures (8x8 pixels each)
   - Loaded at runtime from cartridge data
   - Exec loads GRAM using BLIST from UDB

3. **GRAM Loading (via Exec):**
   - Implement Exec's GRAM loading routine
   - Parse BLIST (entry 5 in UDB)
   - Transfer pictures from cartridge to GRAM
   - Verify GRAM contents after loading

4. **Tests:**
   - GROM accessible and contains correct data
   - GRAM writable and readable
   - GRAM loading from BLIST works
   - Picture data correct in GRAM

**Done When:**
- GROM loaded with standard character set
- GRAM can be loaded from cartridge via BLIST
- Exec GRAM loading routine works
- Tests verify picture data integrity

**Estimated Effort:** 2-3 days

**Dependencies:**
- Sprint 1.10 (Exec ROM Integration) must be complete
- Need GROM binary

---

### Sprint 1.12: BACKTAB and Background Support

**Goal:** Implement background table (BACKTAB) for screen display data

**Deliverables:**
1. **BACKTAB Structure:**
   - 240 words at $0200-$02EF
   - 20 columns × 12 rows
   - Dual-port RAM (CPU and STIC access)
   - Each entry specifies picture and attributes

2. **Background Picture Data Base:**
   - Parse background data from UDB (entry 4)
   - 8x8 picture definitions
   - Referenced by BACKTAB entries

3. **Exec Background Initialization:**
   - Exec sets up BACKTAB per UDB
   - Background mode (color stack vs. FG/BG)
   - Color stack initialization
   - Border color

4. **Tests:**
   - BACKTAB accessible at correct address
   - Background data parsed from UDB
   - Exec initializes BACKTAB correctly
   - Simple background pattern displays (verification via memory inspection)

**Done When:**
- BACKTAB structure in place
- Exec can initialize background from UDB
- Background data accessible
- Tests verify BACKTAB setup

**Estimated Effort:** 2-3 days

**Dependencies:**
- Sprint 1.11 (GROM/GRAM Support) must be complete

---

### Sprint 1.13: System Integration and Testing

**Goal:** Integrate all Phase 1.5 components and test with real cartridges

**Deliverables:**
1. **Integration:**
   - All memory regions working together
   - Exec ROM fully integrated
   - UDB parsing complete
   - GROM/GRAM accessible
   - BACKTAB initialized

2. **Test Cartridges:**
   - Create or obtain simple test cartridges
   - Verify they initialize correctly
   - Check background displays
   - Verify GRAM loading

3. **Regression Testing:**
   - Ensure Phase 1 instructions still work
   - Verify backward compatibility with hand-written test programs
   - Check MCP server still functions

4. **Documentation:**
   - Update ARCHITECTURE.md with memory map
   - Document Exec integration
   - Update USER_GUIDE.md with cartridge loading
   - Create EXEC_INTEGRATION.md guide

**Done When:**
- Real Intellivision cartridges can be loaded
- Exec initializes cartridges correctly
- Background displays work
- All Phase 1 tests still pass
- Documentation updated

**Estimated Effort:** 3-4 days

**Dependencies:**
- All previous Phase 1.5 sprints complete

---

### Phase 1.5 Milestone Gate

**Criteria for Phase 1.5 completion:**
- ✅ Complete Intellivision memory map implemented
- ✅ Exec ROM integrated and functional
- ✅ UDB parsing works
- ✅ GROM/GRAM accessible
- ✅ BACKTAB initialized from UDB
- ✅ Real Intellivision cartridges can be loaded
- ✅ Exec calls cartridge RESET routine
- ✅ Background displays (verifiable via memory inspection)
- ✅ All Phase 1 tests still pass
- ✅ Documentation updated

**Estimated Total Time:** 12-18 days (2.5-3.5 weeks)

---

## Impact on Existing Roadmap

### Phase 2: Validation & Completion (Adjusted)

**Sprint 2.1: Complete Instruction Set** - No change
- Still implement remaining instructions
- Now they'll work with proper memory map

**Sprint 2.2: jzIntv Integration** - MAJOR CHANGE
- **Before:** Compare with jzIntv using "test ROMs"
- **After:** Compare with jzIntv using real Intellivision cartridges
- **Why:** Now we can run the same cartridges on both emulators
- **Benefit:** More realistic validation, catches Exec-related bugs

**Sprint 2.3: Bug Hunting & Fixing** - Enhanced
- Now includes Exec-related bugs
- Memory map edge cases
- UDB parsing issues

**Sprint 2.4: Cycle Timing** - No change
- Still optional
- Now includes Exec ROM timing

**Sprint 2.5: Polish & Documentation** - Enhanced
- Document Exec integration
- Cartridge loading guide
- Memory map reference

### Phase 3: Peripherals (Adjusted)

**Sprint 3.1-3.3: STIC** - Simplified
- STIC register infrastructure already in place (from Sprint 1.9)
- BACKTAB already implemented (from Sprint 1.12)
- GROM/GRAM already working (from Sprint 1.11)
- Focus shifts to rendering and display output

**Sprint 3.4: PSG Sound** - Simplified
- Sound chip registers already in memory map (from Sprint 1.9)
- Focus on audio generation logic

**Sprint 3.5: Controller Input** - Simplified
- Controller ports already in memory map (from Sprint 1.9)
- Focus on input simulation

**Sprint 3.6: System Integration** - Simplified
- Most integration already done in Phase 1.5
- Focus on frame timing and synchronization
- Exec ROM already integrated

---

## Benefits of This Approach

### Technical Benefits
1. **Realistic emulation from the start** - Not just a bare CPU
2. **Earlier detection of memory-related bugs** - Before Phase 2
3. **Proper foundation for STIC** - Memory map already in place
4. **Exec services available** - For moving objects, sound, etc.
5. **Real cartridge testing** - Not just hand-written code

### Development Benefits
1. **Clearer progression** - System → Validation → Peripherals → Production
2. **Better jzIntv comparison** - Apples-to-apples with real cartridges
3. **Reduced Phase 3 complexity** - Memory map already done
4. **Earlier user value** - Can load real cartridges sooner

### Risk Mitigation
1. **Catches architecture issues early** - Before too much code is written
2. **Validates memory model** - Before implementing STIC/PSG
3. **Ensures Exec compatibility** - Critical for real cartridges

---

## Implementation Strategy

### Approach
1. **Complete Sprint 1.7 first** - Finish MCP server as planned
2. **Insert Phase 1.5 sprints** - Before moving to Phase 2
3. **Update all roadmap documents** - ROADMAP.md, sprint docs, etc.
4. **Communicate changes** - Update README, project log

### Sequencing
```
Current: Phase 1 → Phase 2 → Phase 3 → Phase 4
Proposed: Phase 1 → Phase 1.5 → Phase 2 → Phase 3 → Phase 4

Detailed:
Sprint 1.7 (current) → 1.8 (current) → 
  1.9 (NEW: Memory) → 1.10 (NEW: Exec) → 1.11 (NEW: GROM/GRAM) → 
  1.12 (NEW: BACKTAB) → 1.13 (NEW: Integration) →
Sprint 2.1 (adjusted) → 2.2 (adjusted) → ...
```

### Backward Compatibility
- Maintain support for hand-written test programs
- Keep existing test suite passing
- MCP server continues to work
- Add new MCP tools for cartridge loading

---

## Resource Requirements

### Technical Resources
1. **Exec ROM binary** - Need legal copy (from jzIntv or official source)
2. **GROM binary** - Graphics ROM data
3. **Test cartridges** - Simple games for validation
4. **Exec documentation** - "Your Friend The EXEC" (already have)

### Time Estimate
- **Phase 1.5 total:** 12-18 days (2.5-3.5 weeks)
- **Per sprint:** 2-5 days each
- **Assumes:** Full-time development, no major blockers

### Dependencies
- Legal access to Exec ROM and GROM
- Understanding of Exec behavior (from documentation)
- jzIntv source code (for reference)

---

## Risks and Mitigation

### Risk 1: Exec ROM Licensing
**Risk:** May not have legal right to distribute Exec ROM  
**Impact:** High - Can't complete Phase 1.5  
**Mitigation:**
- Research licensing (Intellivision Productions, etc.)
- Use jzIntv's approach (user provides ROM)
- Consider clean-room implementation (very complex)

### Risk 2: Exec Complexity
**Risk:** Exec may be more complex than anticipated  
**Impact:** Medium - Delays Phase 1.5  
**Mitigation:**
- Start with minimal Exec services
- Stub out non-critical functionality
- Incremental implementation

### Risk 3: Memory Map Bugs
**Risk:** Memory controller may have subtle bugs  
**Impact:** Medium - Affects all subsequent work  
**Mitigation:**
- Comprehensive testing in Sprint 1.9
- Validate against Exec documentation Appendix A
- Compare with jzIntv memory map

### Risk 4: Backward Compatibility
**Risk:** New memory model breaks existing tests  
**Impact:** Low-Medium - Regression  
**Mitigation:**
- Keep existing test suite running
- Add compatibility layer if needed
- Incremental migration

---

## Success Criteria

### Phase 1.5 Success
- ✅ Load real Intellivision cartridge ROM
- ✅ Exec initializes cartridge via UDB
- ✅ Background displays (verifiable)
- ✅ GRAM loaded from cartridge
- ✅ All Phase 1 tests still pass
- ✅ MCP server works with cartridges

### Long-term Success
- ✅ jzIntv comparison works with real cartridges (Phase 2)
- ✅ STIC implementation simplified (Phase 3)
- ✅ Can run 10+ commercial games (Phase 3)
- ✅ Community adoption (Phase 4)

---

## Next Steps

### Immediate Actions
1. **Review this plan** - Get feedback from Peter
2. **Research Exec ROM licensing** - Legal considerations
3. **Update ROADMAP.md** - Insert Phase 1.5
4. **Create Sprint 1.9 document** - Memory Architecture details
5. **Finish Sprint 1.7** - Complete MCP server first

### Documentation Updates
- [ ] ROADMAP.md - Add Phase 1.5, renumber phases
- [ ] Sprint-1.9.md through Sprint-1.13.md - Create new sprint docs
- [ ] ARCHITECTURE.md - Document memory map
- [ ] README.md - Update project status
- [ ] NEXT_STEPS.md - Update with Phase 1.5 plan

### Communication
- [ ] Update project log with roadmap change decision
- [ ] Communicate to any stakeholders
- [ ] Update GitHub project/issues if applicable

---

## Conclusion

Inserting Phase 1.5 (Intellivision System Foundation) before Phase 2 (Validation) is essential for creating a realistic Intellivision emulator. This approach:

1. **Enables real cartridge support** - Not just test programs
2. **Improves jzIntv comparison** - Apples-to-apples validation
3. **Simplifies Phase 3** - Memory map already in place
4. **Catches bugs earlier** - Before too much code is written
5. **Provides better user value** - Can load real games sooner

The estimated 2.5-3.5 week investment in Phase 1.5 will pay dividends in all subsequent phases and is critical for the project's long-term success.

---

**Recommendation:** Proceed with Phase 1.5 insertion after completing Sprint 1.7 (MCP server).
