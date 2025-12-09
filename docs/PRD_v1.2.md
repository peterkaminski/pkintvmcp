# pkIntvMCP - Product Requirements Document

**Project Name:** pkIntvMCP (Peter Kaminski Intellivision MCP)  
**Version:** 1.1  
**Date:** 2025-12-08  
**Status:** Draft  
**Author:** Peter Kaminski, Claude

---

## Executive Summary

We are building pkIntvMCP, an MCP (Model Context Protocol) server that enables AI assistants like Claude to debug and analyze CP-1600/Intellivision programs through a comprehensive debugging interface. The project will be developed in phases, starting with CPU-only debugging and growing to include full system emulation with peripherals (STIC graphics, PSG sound, controllers).

---

## Vision & Goals

### Vision Statement

Create the most accessible and powerful debugging environment for Intellivision/CP-1600 development by combining accurate emulation with AI-assisted analysis, enabling developers to understand, debug, and optimize retro game code faster than ever before.

### Primary Goals

1. **Enable AI-Assisted Debugging** - Allow Claude and other LLMs to step through, analyze, and explain CP-1600 code execution
2. **Support Homebrew Development** - Provide tools that make developing new Intellivision games easier
3. **Facilitate Learning** - Help people understand the CP-1600 architecture and Intellivision system
4. **Preserve History** - Aid in reverse engineering and documenting existing Intellivision software

### Success Metrics

**Phase 1 (CPU):**
- Successfully loads and executes standard Intellivision ROMs
- Passes validation against jzIntv reference implementation (>99% instruction compatibility)
- Claude can debug a simple ROM crash and identify the root cause
- At least 5 homebrew developers try it and provide feedback

**Phase 2 (Validation & Polish):**
- Zero known instruction implementation bugs
- Comprehensive test coverage (>95% code coverage)
- Documentation covers all features
- Community GitHub stars/forks indicate adoption

**Phase 3 (Peripherals):**
- Can display graphics output from ROMs
- Can play audio from ROMs
- Can simulate controller input
- Successfully runs 10+ commercial Intellivision games

**Phase 4 (Production):**
- Published as npm package
- Listed in MCP server directory
- Active user community (Discord/forum)
- Used in at least one published homebrew game development

---

## Target Users

### Primary Users

**Homebrew Developers**
- Profile: Experienced developers creating new Intellivision games
- Needs: Fast debugging, performance analysis, testing tools
- Pain Points: Limited debugging tools, difficult to understand timing issues
- Success: "I found my sprite collision bug in 5 minutes instead of 5 hours"

**Retro Computing Enthusiasts**
- Profile: Hobbyists learning about classic hardware
- Needs: Educational tools, clear explanations, interactive exploration
- Pain Points: Steep learning curve, abstract documentation
- Success: "I finally understand how the CP-1600 handles subroutines"

### Secondary Users

**Reverse Engineers**
- Profile: Analyzing existing Intellivision software
- Needs: State inspection, memory search, code flow analysis
- Pain Points: Manual disassembly, unclear code patterns
- Success: "I traced how the AI routine works"

**Educators**
- Profile: Teaching computer architecture concepts
- Needs: Simple examples, clear visualization, step-by-step execution
- Pain Points: Modern systems too complex, old systems lack tooling
- Success: "Students can see exactly how assembly instructions affect registers"

**Tool-Assisted Speedrunners**
- Profile: Creating perfect game playthroughs
- Needs: Deterministic replay, frame-perfect timing, save states
- Pain Points: Existing emulators lack debugging features
- Success: "I can analyze exactly what frame the trick needs to happen"

---

## Use Cases

### UC-1: Debugging a Crash

**Actor:** Homebrew Developer  
**Goal:** Find why ROM crashes at specific address

**Flow:**
1. Developer loads ROM in MCP server
2. Claude disassembles code around crash point
3. Claude runs until crash address
4. Claude examines register state
5. Claude traces backward to find uninitialized register
6. Claude explains the bug: "R4 is being used as a pointer but was never initialized"

**Success Criteria:** Bug identified in <5 minutes

### UC-2: Learning the Instruction Set

**Actor:** Retro Computing Enthusiast  
**Goal:** Understand how ADDR instruction works

**Flow:**
1. User asks Claude: "How does ADDR work?"
2. Claude creates a simple test program
3. Claude steps through execution, showing register changes
4. Claude explains flag behavior with examples
5. User modifies test and re-runs to explore edge cases

**Success Criteria:** User understands instruction after one conversation

### UC-3: Performance Optimization

**Actor:** Homebrew Developer  
**Goal:** Find why game lags during busy scenes

**Flow:**
1. Developer loads ROM and runs for one frame
2. Claude profiles cycle usage by routine
3. Claude identifies hot spots
4. Claude disassembles expensive routine
5. Claude suggests optimization (e.g., "Use lookup table instead of repeated addition")

**Success Criteria:** Optimization identified and validated

### UC-4: Reverse Engineering a Game Mechanic

**Actor:** Reverse Engineer  
**Goal:** Understand how scoring system works

**Flow:**
1. Engineer loads commercial ROM
2. Claude helps find score display routine (via STIC memory writes)
3. Claude sets breakpoint on score updates
4. Claude traces back to find score increment logic
5. Claude explains the algorithm

**Success Criteria:** Algorithm documented

### UC-5: Teaching Computer Architecture

**Actor:** Educator  
**Goal:** Show students how subroutines work

**Flow:**
1. Educator prepares simple JSR/JR example
2. Claude runs it step-by-step in class
3. Claude visualizes stack changes (R6 pointer)
4. Claude shows return address saved in R5
5. Students ask questions, Claude answers with examples

**Success Criteria:** Students can write their own subroutine

### UC-6: Validating Homebrew Game

**Actor:** Homebrew Developer  
**Goal:** Ensure game runs correctly before release

**Flow:**
1. Developer loads final ROM build
2. Claude runs automated test suite
3. Claude simulates various input sequences
4. Claude reports any crashes or unexpected states
5. Developer fixes issues

**Success Criteria:** Zero crashes in test suite

---

---

## Intellivision System Architecture Overview

Understanding the complete Intellivision system is essential for effective debugging support.

### Hardware Components

**CP-1600 CPU**
- 16-bit microprocessor with 10-bit instruction words
- 8 registers (R0-R7): R6=stack pointer, R7=program counter
- 4 status flags: Sign, Zero, Overflow, Carry
- 16-bit data bus, 16-bit address space (64K words)

**Memory Map**
- $0000-$003F: STIC registers (hardware)
- $0100-$01EF: 8-bit RAM (240 bytes, 93 for Exec, 147 for cartridge)
- $0200-$035F: 16-bit RAM (352 words)
  - $0200-$02EF: BACKTAB (240 words, 20x12 screen cards)
  - $02F0-$0318: Stack (40 words)
  - $031D-$035C: MOB data (8 objects × 8 words)
- $1000-$1FFF: Exec ROM (4K, system BIOS)
- $3000-$37FF: GROM (2K, 256 built-in 8x8 characters)
- $3800-$39FF: GRAM (512 bytes, 64 custom 8x8 characters)
- $5000-$6FFF: Cartridge ROM (4K-8K, 10-bit decles)

**STIC (Graphics Chip)**
- 20×12 background cards (8×8 pixels each = 160×96 display)
- 8 MOBs (Moving Objects/sprites)
- 2 display modes: Color Stack, Foreground/Background
- Collision detection between MOBs and background
- Border color control, scrolling support

**PSG (Sound Chip - AY-3-8914)**
- 3 independent sound channels
- Tone generation (12-bit frequency per channel)
- Noise generation (5-bit frequency, shared)
- Volume envelopes (16-bit period, 4-bit characteristics)
- 14 hardware registers

**Controllers**
- 2 hand-held controllers per system
- 16-direction disc, 12-button keypad (0-9, Clear, Enter), 3 action buttons
- Hardware supports disc + one button simultaneously

### Exec Operating System

The Exec is a 4K ROM-based mini-OS that all cartridges must interface with:

**Core Responsibilities**
- Interrupt handling (60Hz timing)
- MOB management (position, motion, sequencing, interaction)
- Process scheduling (up to 6 cartridge processes)
- I/O services (keypad, sound generation)
- GRAM loading at startup

**Cartridge Interface**
Cartridges provide a Universal Data Block (UDB) with:
- Pointers to: MOB graphics, processes, reset routine, background graphics, GRAM data, cartridge name
- Configuration: key click settings, border extension, background mode, color stack, border color
- MOB GRAM allocation

**MOB Management**
Each MOB has:
- RAM data base: status, ROM pointer, position (X,Y), velocity, sequence, timeout, extra word
- ROM data base: off-field dispatch, timeout dispatch, sequence definition, interaction dispatches
- Automatic: position updates, sequencing, collision detection, border checking

### Development Constraints

**10-bit ROM, 16-bit Data**
- Cartridge code stored in 10-bit ROM (decles)
- All data operations are 16-bit
- SDBD prefix enables 16-bit immediate values across two decles
- BIDECLE directive for 16-bit constants (stored as two bytes)

**Memory-Mapped I/O**
- All hardware registers directly accessible
- STIC updated at interrupt time only
- PSG can be updated anytime
- Careful timing required for graphics updates

## Feature Requirements

### Phase 1: CPU Core

**Must Have:**

**FR-1.1: ROM Loading**
- Load binary ROM files (.bin, .rom formats)
- Support standard Intellivision memory maps
- Handle multi-segment ROMs
- Validate ROM integrity

**FR-1.2: CPU Execution**
- Execute all CP-1600 instructions correctly
- Maintain CPU state (registers, flags, PC)
- Handle all addressing modes
- Support SDBD (Set Double Byte Data) prefix
- **Track exact cycle counts** from CP-1600 manual timing table (page 53+)
  - Base cycles per instruction
  - Memory wait state calculations (W=0,1,3 depending on memory speed)
  - Format: cycles = base + W*memory_accesses
  - Example: MVI@ instruction = 8 + 2W cycles

**Cycle Timing Data Extraction Strategy:**
- Manual is scanned PDF (images), requires OCR or manual transcription
- Timing table spans pages 53-60+ of CP-1600 Users Manual
- Priority instructions for manual entry: data movement, arithmetic, branches (Phase 1)
- Full instruction set timing in Phase 2
- Data format: instruction → {base_cycles, memory_accesses, notes}

**FR-1.3: Memory System**
- 64K word (16-bit) address space
- Read/write operations
- Memory-mapped I/O regions (documented, not active)

**FR-1.4: Execution Control (MCP Tools)**
- `cp1600_load_rom` - Load ROM file
- `cp1600_step` - Execute N instructions
- `cp1600_run` - Run until halt/breakpoint
- `cp1600_run_until` - Run until condition met
- `cp1600_reset` - Reset CPU state

**FR-1.5: State Inspection (MCP Tools)**
- `cp1600_get_state` - Full CPU state
- `cp1600_get_registers` - Register values
- `cp1600_get_flags` - Flag values
- `cp1600_disassemble` - Decode instructions
- `cp1600_examine_memory` - Read memory range

**FR-1.6: Breakpoints (MCP Tools)**
- `cp1600_set_breakpoint` - Address breakpoints
- `cp1600_list_breakpoints` - Show all breakpoints
- `cp1600_clear_breakpoint` - Remove breakpoint
- Conditional breakpoints (register/flag conditions)

**FR-1.7: Execution Trace (MCP Tools)**
- `cp1600_enable_trace` - Enable trace buffer
- `cp1600_get_trace` - Retrieve execution history
- Configurable buffer size
- Shows instruction + state changes

**FR-1.8: Session Management (MCP Tools)**
- Multiple simultaneous debugging sessions
- Session isolation (independent states)
- Session lifecycle management

**Should Have:**

**FR-1.9: Memory Inspection (MCP Resources)**
- `cp1600://sessions/{id}/state` - Current state as resource
- `cp1600://sessions/{id}/trace` - Trace as resource
- `cp1600://sessions/{id}/memory/{start}/{end}` - Memory range

**FR-1.10: Advanced Breakpoints**
- Memory watch breakpoints (read/write)
- Hit counts
- Breakpoint conditions (JavaScript expressions)

**Could Have:**

**FR-1.11: Performance Analysis**
- Cycle profiling by routine
- Instruction frequency analysis
- Hot spot identification

**FR-1.12: Code Analysis**
- Call graph generation
- Code coverage tracking
- Subroutine detection

**Won't Have (Phase 1):**
- Interrupt handling (documented but not required for basic ROMs)
- Graphics output (STIC emulation)
- Sound output (PSG emulation)
- Input simulation (controller emulation)
- Save states

### Phase 2: Validation & Completion

**Must Have:**

**FR-2.1: Validation Suite**
- Test ROM collection (basic ops, branches, addressing modes)
- Automated comparison against jzIntv
- Trace comparison tool
- Continuous validation in CI/CD

**FR-2.2: Comprehensive Testing**
- Unit tests for all instructions
- Integration tests with real ROMs
- Edge case coverage
- Flag behavior validation

**FR-2.3: Documentation**
- Complete API documentation
- Usage examples
- Troubleshooting guide
- Known limitations

**FR-2.4: Error Handling**
- Graceful error messages
- Recovery from invalid ROMs
- Clear debugging information

**Should Have:**

**FR-2.5: Exact Cycle Timing**
- Implement exact cycle counts from CP-1600 manual
- Memory wait state calculations
- Timing validation against jzIntv
- Cycle profiling tools (instruction counts, hot spots)

**FR-2.6: Development Tools**
- CLI debugger interface
- Simple ROM disassembler tool
- Memory dump utilities

### Phase 3: Peripherals (Future)

**Must Have:**

**FR-3.1: STIC Emulation (Graphics)**
- Background tile rendering
- 8 MOB (sprite) system
- Collision detection
- Frame buffer output
- `stic_get_display` - Capture frame
- `stic_get_sprite_list` - Sprite state

**FR-3.2: PSG Emulation (Sound)**
- 3 audio channels
- Envelope generation
- Tone and noise generation
- `psg_get_channel_state` - Channel info
- Audio output (WAV/stream)

**FR-3.3: Controller Emulation**
- 2 controller support
- 12-button keypad + disc
- `input_set_controller` - Simulate input
- `input_record` / `input_playback` - TAS support

**FR-3.4: System Integration**
- Memory-mapped I/O bus
- Peripheral timing synchronization
- `system_run_frame` - Execute one frame
- Frame-accurate emulation

**FR-3.5: Full System MCP Server**
- New `mcp-system` package
- Includes all CPU tools
- Adds peripheral tools
- Maintains backward compatibility

**Should Have:**

**FR-3.6: Visual Debugging**
- Display frame buffer as PNG
- Sprite visualization overlays
- Collision box display
- Memory map visualization

**FR-3.7: Save States**
- Save full system state
- Load state for replay
- State comparison/diffing

**Could Have:**

**FR-3.8: EXEC ROM Integration**
- Load system BIOS
- Trace BIOS calls
- Document known BIOS routines

**FR-3.9: Advanced Graphics Tools**
- STIC register inspector
- VBLANK/frame timing tools
- Graphics performance profiling

### Phase 4: Production (Future)

**Must Have:**

**FR-4.1: Distribution**
- Published npm package
- Installation instructions
- Version management
- Changelog

**FR-4.2: Configuration**
- User configuration file
- ROM search paths
- Server options
- Peripheral enable/disable

**FR-4.3: User Guide**
- Getting started tutorial
- Common workflows
- Example debugging sessions
- FAQ

**Should Have:**

**FR-4.4: Web Interface**
- Browser-based debugger UI
- Visual register/memory display
- Interactive disassembly
- Graphics/audio output

**FR-4.5: Community Features**
- Example ROM collection
- Tutorial projects
- Community Discord/forum
- Contribution guidelines

**Could Have:**

**FR-4.6: Advanced Features**
- Time-travel debugging (rewind)
- Differential debugging (compare runs)
- Automated test generation
- Performance regression detection

---

## Non-Functional Requirements

### Performance

**NFR-1: Execution Speed**
- Should execute at least 1M instructions/second (100x real-time)
- Step operation response time <100ms
- Trace retrieval <500ms for 1000 entries

**NFR-2: Memory Usage**
- Single session <100MB memory footprint
- Support at least 10 concurrent sessions
- Efficient trace buffer (configurable size)

### Reliability

**NFR-3: Correctness**
- >99% instruction compatibility with jzIntv
- Zero crashes on valid ROMs
- Deterministic execution (same input = same output)

**NFR-4: Stability**
- MCP server runs for hours without crashes
- Graceful error handling
- No memory leaks

### Usability

**NFR-5: Claude Integration**
- Natural language debugging workflows
- Clear, structured tool responses
- Helpful error messages
- Self-documenting tools

**NFR-6: Documentation**
- All features documented
- Code examples for common tasks
- Architecture decision records
- API reference

### Maintainability

**NFR-7: Code Quality**
- TypeScript with strict mode
- >90% test coverage
- Clear module boundaries
- Well-commented complex logic

**NFR-8: Extensibility**
- Easy to add new instructions
- Pluggable peripheral architecture
- Separable core from MCP wrapper

---

## Out of Scope (Non-Goals)

### Explicit Non-Goals

**NG-1: Perfect Hardware Accuracy**
- Not building a cycle-exact emulator (like higan/bsnes)
- Approximate timing sufficient for Phase 1-2
- Exact timing only where necessary for compatibility

**NG-2: Gameplay Focus**
- Not building a player-focused emulator
- No GUI for casual gaming
- No save/load states for gameplay (only debugging)
- No controller mapping for physical controllers

**NG-3: Other Platforms**
- Not supporting other retro systems
- Not generalizing to multi-system emulator
- CP-1600/Intellivision only

**NG-4: Assembler/Compiler**
- Not building development tools
- No assembler (use existing tools like as1600)
- No high-level language compiler
- Focus is debugging, not development

**NG-5: Peripheral Accuracy (Phase 1-2)**
- No STIC emulation in early phases
- No PSG emulation in early phases
- CPU-only debugging sufficient initially

**NG-6: Commercial Support**
- Not providing commercial licenses
- Open source project only
- Community-driven support

---

## Risks & Mitigations

### Technical Risks

**Risk-1: JavaScript Bit Operations**
- **Risk:** JavaScript's numeric types unsuitable for bit-accurate emulation
- **Mitigation:** Explicit masking, comprehensive testing, validation against jzIntv
- **Contingency:** Could use WebAssembly if performance critical

**Risk-2: Instruction Implementation Bugs**
- **Risk:** Subtle bugs in instruction implementations
- **Mitigation:** Validate against jzIntv, comprehensive test suite, unit tests per instruction
- **Contingency:** Community testing, bug bounty program

**Risk-3: Peripheral Complexity**
- **Risk:** STIC/PSG timing very complex
- **Mitigation:** Phase approach, start simple, iterate
- **Contingency:** Partner with jzIntv developers for guidance

**Risk-4: Documentation Accuracy**
- **Risk:** Original CP-1600 manual may have errors or ambiguities
- **Mitigation:** Cross-reference multiple sources, validate behaviors
- **Contingency:** Document divergences, follow jzIntv behavior

### Project Risks

**Risk-5: Scope Creep**
- **Risk:** Feature requests expand scope unmanageably
- **Mitigation:** Clear phase gates, strict prioritization
- **Contingency:** Defer features to future phases

**Risk-6: jzIntv Integration Maintenance**
- **Risk:** jzIntv changes break our validation
- **Mitigation:** Pin jzIntv version, minimal patch to jzIntv
- **Contingency:** Maintain fork if necessary

**Risk-7: User Adoption**
- **Risk:** No one uses it
- **Mitigation:** Early user testing, community engagement, clear value proposition
- **Contingency:** Pivot focus based on feedback

**Risk-8: MCP Protocol Changes**
- **Risk:** MCP protocol evolves, breaks compatibility
- **Mitigation:** Follow MCP best practices, version carefully
- **Contingency:** Support multiple MCP versions

---

## Dependencies

### External Dependencies

**Technical:**
- Node.js runtime (v18+)
- TypeScript compiler
- MCP SDK (@modelcontextprotocol/sdk)
- jzIntv (for validation) - https://github.com/jenergy/jzintv

**Documentation:**
- CP-1600 Microprocessor Users Manual (May 1975) - complete with cycle timing data
- Your Friend, The EXEC (transcribed 1981) - Exec API and system architecture
- De Re Intellivision chapters - hardware and development reference
- Intellivision technical documentation
- jzIntv source code (reference implementation)

**Test Resources:**
- **Initial Test ROM**: Air Strike (standard Intellivision cartridge for validation)
- Collection of test ROMs (basic ops, branches, addressing modes, edge cases)

**Community:**
- **Primary**: intvprog Discord server (project home, discussion, support)
- **Secondary**: intvprog email list (announcements, technical discussions)
- AtariAge Intellivision forums (broader community, ROM hosting)
- atariage.com (historical context, game documentation)

### Internal Dependencies

**Phase Dependencies:**
- Phase 2 depends on Phase 1 (can't validate without core)
- Phase 3 depends on Phase 2 (peripherals need solid CPU)
- Phase 4 depends on Phase 3 (can't release without features)

---

## Sprint & Milestone Structure

### Phase 1: CPU Core
**Phase Milestone**: Can execute and debug simple CP-1600 programs via Claude

**Sprint 1.1: Foundation & Documentation**
- Complete core documentation (PRD, ARCHITECTURE, CPU_SPEC, MCP_API, PROJECT_SETUP)
- Set up monorepo structure
- Initialize TypeScript + testing framework
- Skeleton code compiles
- **Done when**: All docs complete, project builds, tests run

**Sprint 1.2: Instruction Decoder**
- Implement 10-bit instruction format parsing
- Decode all addressing modes
- Extract operands and instruction metadata
- Unit tests for decoder
- **Done when**: Can decode all Phase 1 instructions to structured format

**Sprint 1.3: Core Execution Engine**
- CPU state (registers, flags, PC)
- Memory system (64K words)
- Bit-accurate operations in TypeScript
- Core instructions: ADD, SUB, INC, DEC, AND, XOR, MOV, MVI, MVO, CLR, TST
- Proper flag setting (C, OV, Z, S)
- **Done when**: Can execute these instructions with correct flag behavior, unit tests pass

**Sprint 1.4: Control Flow & Stack**
- All branch instructions (B, BEQ, BNE, BMI, BPL, etc.)
- Jump instructions (J, JR, JSR)
- Stack operations (PSHR, PULR, R6 management)
- Subroutine linkage
- **Done when**: Can execute control flow correctly, integration tests with branch/jump sequences pass

**Sprint 1.5: Basic MCP Server**
- MCP protocol setup
- Session management (create, list, switch, destroy)
- ROM loading
- Execution control tools (step, run, reset)
- State inspection tools (get_state, get_registers, get_flags, disassemble, examine_memory)
- **Done when**: Claude can load ROM, step through code, inspect state

**Sprint 1.6: Debugging Tools**
- Address breakpoints (set, clear, list)
- Execution trace buffer
- run_until with conditions
- Basic resources (state, trace)
- **Done when**: Claude can set breakpoints, see execution history, run to specific conditions

**Phase 1 Milestone Gate**: 
- ✅ Loads Air Strike ROM (or test ROM)
- ✅ Executes Phase 1 instructions correctly
- ✅ Claude can debug via MCP (step, breakpoint, inspect)
- ✅ Unit test coverage >90% for implemented instructions

---

### Phase 2: Validation & Completion
**Phase Milestone**: All instructions work, >99% compatible with jzIntv

**Sprint 2.1: Complete Instruction Set**
- Remaining arithmetic (ADC, NEG, CMP)
- All shifts/rotates (SLL, SLR, SAR, RLC, RRC, SWAP)
- SDBD prefix handling
- All addressing modes (including @@R4, @@R5)
- Advanced operations (GSWD, RSWD)
- **Done when**: All ~50 CP-1600 instructions implemented, unit tests pass

**Sprint 2.2: jzIntv Integration**
- Apply minimal patch to jzIntv for trace output
- Build jzIntv with trace support
- Implement trace comparison tool
- Create test ROM suite (basic ops, branches, addressing, edge cases)
- **Done when**: Can run same ROMs on both, compare traces, identify divergences

**Sprint 2.3: Bug Hunting & Fixing**
- Run full validation suite
- Fix all discovered bugs
- Edge case handling
- Instruction interaction testing
- **Done when**: Zero known bugs on test suite, >99% trace match with jzIntv

**Sprint 2.4: Cycle Timing (Optional)**
- Extract timing data from CP-1600 manual (page 53+)
- Data structure: `{instruction: {base_cycles, memory_accesses, notes}}`
- Implement exact cycle counting
- Memory wait state calculations
- Validation against jzIntv timing
- **Done when**: Cycle counts accurate, profiling tools work

**Sprint 2.5: Polish & Documentation**
- Complete API documentation
- Usage examples
- Error handling improvements
- Performance optimization
- **Done when**: Documentation complete, clean error messages, acceptable performance

**Phase 2 Milestone Gate**:
- ✅ All instructions implemented
- ✅ Passes full test ROM suite
- ✅ >99% compatible with jzIntv
- ✅ Zero known bugs
- ✅ Documentation complete
- ✅ Test coverage >95%

---

### Phase 3: Peripherals (Future)
**Phase Milestone**: Can run and debug commercial games with graphics and sound

**Sprint 3.1: STIC Foundation**
- STIC register emulation
- BACKTAB processing
- Background rendering (both modes)
- Frame buffer generation

**Sprint 3.2: STIC MOBs**
- 8 MOB system
- Sprite positioning
- Collision detection
- Priority handling

**Sprint 3.3: STIC Graphics Output**
- Frame capture (PNG export)
- Visual debugging overlays
- GRAM/GROM management
- MCP tools for graphics inspection

**Sprint 3.4: PSG Sound**
- 3-channel tone generation
- Noise generation
- Envelope control
- Audio output (WAV or stream)
- MCP tools for sound inspection

**Sprint 3.5: Controller Input**
- Input state simulation
- Recording/playback (TAS support)
- MCP tools for input control

**Sprint 3.6: System Integration**
- Memory-mapped I/O bus
- Exec ROM integration (optional)
- Frame timing synchronization
- Full system mcp-system server
- Test with Air Strike and other commercial ROMs

**Phase 3 Milestone Gate**:
- ✅ Graphics display works
- ✅ Sound generation works
- ✅ Can run commercial games
- ✅ MOB system fully functional
- ✅ Exec ROM (optional) integrated

---

### Phase 4: Production (Future)
**Phase Milestone**: Public release, community adoption

**Sprint 4.1: Distribution**
- npm package configuration
- Installation documentation
- Version 1.0 release

**Sprint 4.2: Community Launch**
- Announce on intvprog Discord
- Tutorial content
- Example debugging sessions
- Gather feedback

**Sprint 4.3: Web Interface (Optional)**
- Browser-based debugger
- Visual display of state
- Interactive debugging

**Phase 4 Milestone Gate**:
- ✅ Published and accessible
- ✅ Documentation complete
- ✅ Active users (5+)
- ✅ Community engagement

---

## Success Criteria Summary

### Minimum Viable Product (Phase 1)

✅ Sprint 1.1 Complete: Core documentation set created (PRD, ARCHITECTURE, CPU_SPECIFICATION, MCP_API, PROJECT_SETUP, USER_GUIDE)  
✅ Loads and executes Intellivision ROMs  
✅ Claude can step through code  
✅ Claude can set breakpoints  
✅ Claude can inspect state  
✅ Works with at least one commercial ROM (Air Strike)  

### Version 1.0 (Phase 2)

✅ All Phase 1 features  
✅ >99% jzIntv compatibility  
✅ Comprehensive documentation  
✅ Zero known critical bugs  
✅ 5+ active users  

### Version 2.0 (Phase 3)

✅ All Phase 2 features  
✅ Full system emulation (CPU + peripherals)  
✅ Graphics and sound output  
✅ Runs 10+ commercial games  
✅ Web UI available  

### Long-term Success (Phase 4+)

✅ 100+ GitHub stars  
✅ Active community (forum/Discord)  
✅ Used in published homebrew games  
✅ Referenced in Intellivision development resources  
✅ Educational use in computer architecture courses  

---

## Appendices

### A. Glossary

- **CP-1600**: General Instrument 16-bit microprocessor used in Intellivision
- **STIC**: Standard Television Interface Chip (graphics) - handles display, sprites (MOBs), collision detection
- **PSG**: Programmable Sound Generator (AY-3-8914 audio chip) - 3 channels, envelope control
- **MOB**: Moving Object (sprite in Intellivision terminology) - up to 8 on screen
- **SDBD**: Set Double Byte Data instruction prefix - enables 16-bit immediate values from 10-bit ROM
- **Exec (EXEC ROM)**: Intellivision operating system/BIOS in 4K ROM at $1000 - handles interrupts, timing, MOB management, I/O
- **GROM**: Graphics ROM - 256 built-in 8x8 characters/tiles at $3000 (first 96 are ASCII)
- **GRAM**: Graphics RAM - 64 user-definable 8x8 characters/tiles at $3800 (loaded at runtime)
- **BACKTAB**: Background table in 16-bit RAM - 240 entries (20x12 cards) defining screen display
- **decle**: 10-bit word (Intellivision ROMs are 10-bit, data is 16-bit)
- **bidecle**: Two consecutive 10-bit words forming 16-bit value
- **jzIntv**: Reference Intellivision emulator by Joe Zbiciak (C, GPL)
- **MCP**: Model Context Protocol (interface for LLM tools)
- **TAS**: Tool-Assisted Speedrun

### B. References

**Primary Documentation:**
- CP-1600 Microprocessor Users Manual (May 1975, General Instrument)
- CP-1600 Instruction Set Simplified Presentation (markdown conversion)
- Your Friend, The EXEC (1981, Mattel Electronics) - Exec API reference
- De Re Intellivision (compiled by William M. Moeller)
  - Chapter 6: ROM Dumper (hardware interface details)
  - Chapter 9: T-Card (cartridge connector pinout, bus timing)
- AY-3-8900/8914 STIC Device Specification

**Code References:**
- jzIntv source: https://github.com/jenergy/jzintv
- jzIntv documentation: http://spatula-city.org/~im14u2c/intv/

**Community Resources:**
- intvprog Discord server (primary community)
- intvprog mailing list
- AtariAge Intellivision forums: https://atariage.com/forums/forum/52-intellivision/
- Intellivision Revolution: https://www.intvfunhouse.com/

**Development Tools:**
- as1600 assembler (part of jzIntv toolkit)
- MCP Specification: https://modelcontextprotocol.io

### C. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-12-08 | Peter/Claude | Initial draft |
| 1.0 | 2025-12-08 | Peter/Claude | First complete version with week-based timeline |
| 1.1 | 2025-12-08 | Peter/Claude | Added: project name (pkIntvMCP), Intellivision system architecture, GRAM/GROM/Exec details, community info, test ROM (Air Strike), cycle timing extraction strategy, complete references |
| 1.2 | 2025-12-08 | Peter/Claude | Changed: Week-based timeline → Sprint/Milestone structure. Added: PROJECT_SETUP.md to core documentation set. Sprint completion criteria replace calendar estimates |

---

**Next Steps:**
1. Review and approve this PRD
2. Create Technical Architecture Document
3. Create CPU Implementation Specification
4. Create MCP API Specification
5. Create Provisional User Guide
6. Begin implementation
