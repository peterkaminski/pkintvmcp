# pkIntvMCP - Roadmap

**Last Updated:** 2025-12-16
**Current Phase:** Phase 1.5 - Exec Integration
**Current Sprint:** Phase 1 Complete! All 79 CP-1600 instructions implemented ✅
**Next Phase:** Phase 1.5 - Exec ROM Integration and System Debugging

---

## Overview

pkIntvMCP is being developed in four major phases, with each phase delivering increasing functionality. Development follows a sprint-based approach with clear completion criteria.

**Development Philosophy:**
- Completion-based (not calendar-based)
- Validate against jzIntv reference emulator
- Documentation-driven development
- Test coverage >90% (Phase 1), >95% (Phase 2)

---

## Phase 1: CPU Core

**Goal:** CPU-only debugging with comprehensive MCP interface

**Status:** ✅ COMPLETE - All sprints 1.1-1.7 finished, 79/79 instructions implemented

### Sprint 1.1: Foundation & Documentation ✅ COMPLETE
**Completed:** 2025-12-08

**Deliverables:**
- ✅ PRD.md (v1.2)
- ✅ ARCHITECTURE.md (v1.0)
- ✅ CPU_SPECIFICATION.md (v1.0)
- ✅ MCP_API.md (v1.0)
- ✅ PROJECT_SETUP.md (v1.0)
- ✅ USER_GUIDE.md (v1.0 provisional)
- ✅ ROADMAP.md, WISHLIST.md, Sprint structure

**Outcome:** Complete technical foundation documented

---

### Sprint 1.2: Instruction Decoder ✅ COMPLETE
**Completed:** 2025-12-09
**See:** [Sprint-1.2.md](Sprint-1.2.md) for detailed tasks

**Deliverables:**
- ✅ Monorepo structure initialized (Turborepo + TypeScript)
- ✅ Decoder class implementation
- ✅ Support all addressing modes
- ✅ Extract operands from 10-bit instruction words
- ✅ Unit tests for decoder (>90% coverage)
- ✅ Validated against jzIntv reference implementation

**Outcome:** Decoder correctly handles all Phase 1 instructions with authentic CP-1600 encoding

---

### Sprint 1.3: Core Execution Engine ✅ COMPLETE
**Completed:** 2025-12-09
**See:** [Sprint-1.3.md](Sprint-1.3.md) for details

**Outcome:** CPU class, Executor foundation, and data movement instructions working

---

### Sprint 1.4: Arithmetic and Logical Instructions ✅ COMPLETE
**Completed:** 2025-12-09
**See:** [Sprint-1.4.md](Sprint-1.4.md) for details

**Outcome:** 9 arithmetic/logical instructions implemented (ADDR, SUBR, INCR, DECR, ANDR, XORR, CLRR, TSTR, HLT), 226 tests passing, 94.19% coverage

---

### Sprint 1.5: Control Flow and Stack Instructions ✅ COMPLETE
**Completed:** 2025-12-11
**See:** [Sprint-1.5.md](Sprint-1.5.md) for details

**Outcome:** 23 control flow/stack instructions implemented (branches, jumps, subroutines, stack), 288 tests passing, 92.86% coverage, can execute loops and nested functions

---

### Sprint 1.5.1 (Bonus): CP-1600 Assembly Examples ✅ COMPLETE
**Completed:** 2025-12-11
**See:** [Sprint-1.5.1.md](Sprint-1.5.1.md) for details

**Deliverables:**
- ✅ 6 complete assembly examples (hello-world, counter-loop, subroutine-call, bit-manipulation, signed-math, nested-calls)
- ✅ Comprehensive documentation (~2,500 lines total)
- ✅ Execution traces and expected states
- ✅ Common patterns and pitfalls documented

**Outcome:** Educational examples demonstrating 70% of implemented instructions, ready as test cases for MCP server (Sprint 1.7)

---

### Sprint 1.6: Shifts, Rotates, and Remaining Instructions ✅ COMPLETE
**Completed:** 2025-12-11
**See:** [Sprint-1.6.md](Sprint-1.6.md) for details

**Deliverables:**
- ✅ Shift instructions (SLL, SLLC, SLR, SAR, SARC)
- ✅ Rotate instructions (RLC, RRC)
- ✅ Bit manipulation (SWAP, NEGR)
- ✅ Immediate arithmetic/logic forms (ADD, SUB, AND, XOR)
- ✅ All unit tests (350+ total)

**Outcome:** 14 instructions added, comprehensive shift/rotate support, all Phase 1 planned instructions complete

---

### Sprint 1.6.1: Auto-Increment Instructions ✅ COMPLETE
**Completed:** 2025-12-11
**See:** [Sprint-1.6.md](Sprint-1.6.md) (documented in Sprint 1.6)

**Deliverables:**
- ✅ MVI@ (Move from memory with auto-increment)
- ✅ MVO@ (Move to memory with auto-increment)
- ✅ Unit tests for auto-increment behavior
- ✅ Stack operations with R6

**Outcome:** Indirect addressing with auto-increment working, stack operations validated

---

### Sprint 1.7: Complete Instruction Set Implementation ✅ COMPLETE
**Completed:** 2025-12-16
**See:** [Sprint-1.7.md](Sprint-1.7.md) for details

**Deliverables:**
- ✅ 28 additional CP-1600 instructions implemented:
  - Immediate mode: MVII, MVOI, ADDI, SUBI, CMPI, ANDI, XORI
  - Indirect addressing: ADD@, SUB@, CMP@, AND@, XOR@
  - Basic operations: ADCR, CMPR, COMR, NOP
  - Control/Status: CLRC, SETC, GSWD, RSWD, TCI, SDBD, SIN
  - Jump/Branch variants: JD, JE, BESC, BUSC, BEXT
- ✅ All 79 CP-1600 instructions now implemented
- ✅ 348 tests passing, 93%+ coverage
- ✅ Fixed decoder to return specific opcodes per addressing mode
- ✅ Removed artifact opcodes (CLR, INC, DEC, TST)
- ✅ Complete validation against cp1600_ref.json

**Outcome:** Clean CPU emulation achieved - full CP-1600 instruction set complete and ready for Exec integration

---

### Phase 1 Milestone Gate ✅ COMPLETE

**Criteria for Phase 1 completion:**
- ✅ Complete CP-1600 instruction set (79/79 instructions)
- ✅ Executes all Phase 1 instructions correctly
- ✅ Unit test coverage >90% for all implemented instructions (348 tests, 93%+)
- ✅ Decoder supports all addressing modes and SDBD prefix
- ✅ All instruction classes tested and validated

**Completed:** 2025-12-16 (Sprint 1.7)

---

## Phase 1.5: Exec ROM Integration

**Goal:** System-level debugging with Exec ROM support

**Status:** 📋 PLANNED (Next Phase)

**Rationale:** Before implementing the MCP server, we need to support Intellivision system-level
debugging. The Exec ROM provides critical OS functionality (PRINT routines, multiplication, division,
graphics primitives) that real Intellivision programs rely on. Supporting Exec enables debugging
actual cartridge ROMs, not just standalone test programs.

### Sprint 1.9: Exec ROM Loading and Basic Integration
**Status:** Planned

**Deliverables:**
- [ ] Load exec.bin and grom.bin at correct memory locations
- [ ] Memory protection for ROM regions ($1000-$1FFF Exec, $3000-$37FF GROM)
- [ ] Test basic Exec entry points (PRINT, multiply, divide)
- [ ] Document Exec call conventions and common entry points
- [ ] Unit tests for Exec integration

**Done When:** Can load Exec ROM, basic Exec routines execute correctly

---

### Sprint 1.10: Exec ROM Debugging Support
**Status:** Planned (after 1.9)

**Deliverables:**
- [ ] Symbol table for common Exec entry points
- [ ] Special handling for Exec calls in trace output
- [ ] Documentation of Exec API and calling conventions
- [ ] Test ROMs that use Exec routines
- [ ] Integration tests with real cartridge code patterns

**Done When:** Can debug programs that call Exec routines, trace shows Exec context

---

### Sprint 1.11: Basic MCP Server
**Status:** Planned (after 1.10)

**Deliverables:**
- [ ] MCP protocol setup (@modelcontextprotocol/sdk)
- [ ] Session management (create, list, switch, destroy)
- [ ] ROM loading (binary format support)
- [ ] Execution control tools (step, run, reset)
- [ ] State inspection tools (get_state, get_registers, get_flags, disassemble, examine_memory)

**Done When:** Claude can load ROM with Exec, step through code, inspect state

---

### Sprint 1.12: MCP Debugging Tools
**Status:** Planned (after 1.11)

**Deliverables:**
- [ ] Address breakpoints (set, clear, list)
- [ ] Execution trace buffer (circular, configurable size)
- [ ] run_until with conditions
- [ ] Basic resources (state, trace, exec_context)
- [ ] Error handling and user-friendly messages

**Done When:** Claude can set breakpoints, see execution history, debug Exec calls

---

### Sprint 1.13: Cartridge ROM Support
**Status:** Planned (after 1.12)

**Deliverables:**
- [ ] .bin + .cfg file format support
- [ ] .rom file format support
- [ ] Load cartridges at correct memory locations
- [ ] Documentation of cartridge formats
- [ ] Test with real Intellivision ROMs (Air Strike, etc.)

**Done When:** Can load and debug real Intellivision cartridge ROMs

---

### Phase 1.5 Milestone Gate

**Criteria for Phase 1.5 completion:**
- [ ] Exec ROM integrated and working
- [ ] Can debug programs that use Exec routines
- [ ] MCP server functional (load, step, breakpoint, inspect)
- [ ] Can load and debug real cartridge ROMs
- [ ] Claude can effectively debug via MCP

**Estimated Completion:** Q1 2025 (completion-based)

---

## Phase 2: Validation & Completion

**Goal:** >99% jzIntv compatibility, comprehensive validation

**Status:** Not started

**Note:** Instruction set implementation (originally Sprint 2.1) was completed in Phase 1 (Sprint 1.7).
Phase 2 now focuses entirely on validation and testing against jzIntv.

### Sprint 2.1: jzIntv Integration
**Deliverables:**
- Apply minimal patch to jzIntv for trace output
- Build jzIntv with trace support
- Implement trace comparison tool
- Create test ROM suite (basic ops, branches, addressing, edge cases)

**Done When:** Can run same ROMs on both, compare traces, identify divergences

---

### Sprint 2.2: Bug Hunting & Fixing
**Deliverables:**
- Run full validation suite
- Fix all discovered bugs
- Edge case handling
- Instruction interaction testing

**Done When:** Zero known bugs on test suite, >99% trace match with jzIntv

---

### Sprint 2.3: Cycle Timing (Optional)
**Deliverables:**
- Extract timing data from CP-1600 manual (page 53+)
- Data structure: `{instruction: {base_cycles, memory_accesses, notes}}`
- Implement exact cycle counting
- Memory wait state calculations
- Validation against jzIntv timing

**Done When:** Cycle counts accurate, profiling tools work

---

### Sprint 2.4: Polish & Documentation
**Deliverables:**
- Complete API documentation
- Usage examples
- Error handling improvements
- Performance optimization
- Update USER_GUIDE.md with real examples

**Done When:** Documentation complete, clean error messages, acceptable performance

---

### Phase 2 Milestone Gate

**Criteria:**
- ✅ All instructions implemented
- ✅ Passes full test ROM suite
- ✅ >99% compatible with jzIntv
- ✅ Zero known bugs
- ✅ Documentation complete
- ✅ Test coverage >95%

---

## Phase 3: Peripherals

**Goal:** Full system emulation with graphics, sound, input

**Status:** Future

### Sprint 3.1: STIC Foundation
**Deliverables:**
- STIC register emulation
- BACKTAB processing
- Background rendering (both modes)
- Frame buffer generation

---

### Sprint 3.2: STIC MOBs
**Deliverables:**
- 8 MOB system
- Sprite positioning
- Collision detection
- Priority handling

---

### Sprint 3.3: STIC Graphics Output
**Deliverables:**
- Frame capture (PNG export)
- Visual debugging overlays
- GRAM/GROM management
- MCP tools for graphics inspection

---

### Sprint 3.4: PSG Sound
**Deliverables:**
- 3-channel tone generation
- Noise generation
- Envelope control
- Audio output (WAV or stream)
- MCP tools for sound inspection

---

### Sprint 3.5: Controller Input
**Deliverables:**
- Input state simulation
- Recording/playback (TAS support)
- MCP tools for input control

---

### Sprint 3.6: System Integration
**Deliverables:**
- Memory-mapped I/O bus
- Exec ROM integration (optional)
- Frame timing synchronization
- Full system mcp-system server
- Test with Air Strike and other commercial ROMs

---

### Phase 3 Milestone Gate

**Criteria:**
- ✅ Graphics display works
- ✅ Sound generation works
- ✅ Can run commercial games
- ✅ MOB system fully functional
- ✅ Exec ROM (optional) integrated

---

## Phase 4: Production

**Goal:** Public release, community adoption

**Status:** Future

### Sprint 4.1: Distribution
**Deliverables:**
- npm package configuration
- Installation documentation
- Version 1.0 release

---

### Sprint 4.2: Community Launch
**Deliverables:**
- Announce on intvprog Discord
- Tutorial content
- Example debugging sessions
- Gather feedback

---

### Sprint 4.3: Web Interface (Optional)
**Deliverables:**
- Browser-based debugger
- Visual display of state
- Interactive debugging

---

### Phase 4 Milestone Gate

**Criteria:**
- ✅ Published and accessible
- ✅ Documentation complete
- ✅ Active users (5+)
- ✅ Community engagement

---

## Success Metrics

### Minimum Viable Product (End of Phase 1)
- Loads and executes Intellivision ROMs
- Claude can step through code
- Claude can set breakpoints
- Claude can inspect state
- Works with at least one commercial ROM (Air Strike)

### Version 1.0 (End of Phase 2)
- All Phase 1 features
- >99% jzIntv compatibility
- Comprehensive documentation
- Zero known critical bugs
- 5+ active users

### Version 2.0 (End of Phase 3)
- All Phase 2 features
- Full system emulation (CPU + peripherals)
- Graphics and sound output
- Runs 10+ commercial games
- Web UI available

### Long-term Success (Phase 4+)
- 100+ GitHub stars
- Active community (forum/Discord)
- Used in published homebrew games
- Referenced in Intellivision development resources
- Educational use in computer architecture courses

---

## Key Decisions & Constraints

### Technical Decisions
- **Language:** TypeScript (strict mode) - for web UI potential and accessibility
- **Build:** Turborepo monorepo - for clean package separation
- **Testing:** Vitest - for modern, fast test execution
- **Validation:** jzIntv comparison - for >99% compatibility guarantee

### What We're NOT Building
- ❌ Perfect hardware accuracy (not cycle-exact like higan/bsnes)
- ❌ Gameplay-focused emulator (focus is debugging)
- ❌ Assembler/compiler (use existing tools like as1600)
- ❌ Multi-system emulator (CP-1600/Intellivision only)

### Critical Success Factors
1. **Bit-accurate emulation** - JavaScript requires careful masking
2. **jzIntv compatibility** - Validation is essential
3. **Clear error messages** - MCP tools must be self-documenting
4. **Deterministic behavior** - Critical for reproducible debugging

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-08 | Peter/Claude | Initial roadmap created |

---

**See Also:**
- [PRD.md](PRD_v1.2.md) - Complete product requirements
- [Sprint-1.1.md](Sprint-1.1.md) - Completed sprint (documentation)
- [Sprint-1.2.md](Sprint-1.2.md) - Current sprint (instruction decoder)
- [WISHLIST.md](WISHLIST.md) - Future ideas and nice-to-haves
