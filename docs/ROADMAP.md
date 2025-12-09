# pkIntvMCP - Roadmap

**Last Updated:** 2025-12-08
**Current Phase:** Phase 1 - CPU Core
**Current Sprint:** 1.2 - Instruction Decoder

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

**Status:** Sprint 1.1 ✅ COMPLETE | Sprint 1.2 ⏳ IN PROGRESS

### Sprint 1.1: Foundation & Documentation ✅ COMPLETE
**Done:** 2025-12-08

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

### Sprint 1.2: Instruction Decoder ⏳ IN PROGRESS
**Status:** Not started
**See:** [Sprint-1.2.md](Sprint-1.2.md) for detailed tasks

**Deliverables:**
- [ ] Monorepo structure initialized (Turborepo + TypeScript)
- [ ] Decoder class implementation
- [ ] Support all addressing modes
- [ ] Extract operands from 10-bit instruction words
- [ ] Unit tests for decoder (>90% coverage)

**Done When:** Can decode all Phase 1 instructions to structured format

---

### Sprint 1.3: Core Execution Engine
**Status:** Planned

**Deliverables:**
- [ ] CPU class (state, registers, flags, PC)
- [ ] Memory class (64K words, ROM/RAM distinction)
- [ ] Bit-accurate operations (toUint16, flag calculations)
- [ ] Core instructions: ADD, SUB, INC, DEC, AND, XOR, MOV, MVI, MVO, CLR, TST
- [ ] Proper flag setting (C, OV, Z, S)
- [ ] Unit tests per instruction

**Done When:** Can execute core instructions with correct flag behavior, unit tests pass

---

### Sprint 1.4: Control Flow & Stack
**Status:** Planned

**Deliverables:**
- [ ] All branch instructions (B, BEQ, BNE, BMI, BPL, etc.)
- [ ] Jump instructions (J, JR, JSR)
- [ ] Stack operations (PSHR, PULR, R6 management)
- [ ] Subroutine linkage
- [ ] Integration tests with branch/jump sequences

**Done When:** Can execute control flow correctly, integration tests pass

---

### Sprint 1.5: Basic MCP Server
**Status:** Planned

**Deliverables:**
- [ ] MCP protocol setup (@modelcontextprotocol/sdk)
- [ ] Session management (create, list, switch, destroy)
- [ ] ROM loading (binary format support)
- [ ] Execution control tools (step, run, reset)
- [ ] State inspection tools (get_state, get_registers, get_flags, disassemble, examine_memory)

**Done When:** Claude can load ROM, step through code, inspect state

---

### Sprint 1.6: Debugging Tools
**Status:** Planned

**Deliverables:**
- [ ] Address breakpoints (set, clear, list)
- [ ] Execution trace buffer (circular, configurable size)
- [ ] run_until with conditions
- [ ] Basic resources (state, trace)
- [ ] Error handling and user-friendly messages

**Done When:** Claude can set breakpoints, see execution history, run to specific conditions

---

### Phase 1 Milestone Gate

**Criteria for Phase 1 completion:**
- ✅ Loads Air Strike ROM (or test ROM)
- ✅ Executes Phase 1 instructions correctly
- ✅ Claude can debug via MCP (step, breakpoint, inspect)
- ✅ Unit test coverage >90% for implemented instructions

**Estimated Completion:** TBD (completion-based, not calendar-based)

---

## Phase 2: Validation & Completion

**Goal:** All instructions working, >99% jzIntv compatibility

**Status:** Not started

### Sprint 2.1: Complete Instruction Set
**Deliverables:**
- Remaining arithmetic (ADC, NEG, CMP)
- All shifts/rotates (SLL, SLR, SAR, RLC, RRC, SWAP)
- SDBD prefix handling
- All addressing modes (including @@R4, @@R5)
- Advanced operations (GSWD, RSWD)

**Done When:** All ~50 CP-1600 instructions implemented, unit tests pass

---

### Sprint 2.2: jzIntv Integration
**Deliverables:**
- Apply minimal patch to jzIntv for trace output
- Build jzIntv with trace support
- Implement trace comparison tool
- Create test ROM suite (basic ops, branches, addressing, edge cases)

**Done When:** Can run same ROMs on both, compare traces, identify divergences

---

### Sprint 2.3: Bug Hunting & Fixing
**Deliverables:**
- Run full validation suite
- Fix all discovered bugs
- Edge case handling
- Instruction interaction testing

**Done When:** Zero known bugs on test suite, >99% trace match with jzIntv

---

### Sprint 2.4: Cycle Timing (Optional)
**Deliverables:**
- Extract timing data from CP-1600 manual (page 53+)
- Data structure: `{instruction: {base_cycles, memory_accesses, notes}}`
- Implement exact cycle counting
- Memory wait state calculations
- Validation against jzIntv timing

**Done When:** Cycle counts accurate, profiling tools work

---

### Sprint 2.5: Polish & Documentation
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
