# pkIntvMCP Repository Analysis

**Repository:** https://github.com/peterkaminski/pkintvmcp/  
**Analysis Date:** December 14, 2025  
**Current Status:** Sprint 1.7 (~90% complete)

---

## Executive Summary

**pkIntvMCP** is an emulator and debugging tool for the Intellivision's CP-1600 microprocessor that enables conversational debugging through AI assistants using the Model Context Protocol (MCP). The project transforms traditional assembly debugging into a natural language interaction where developers can ask questions like "Why does my ROM crash at address $5020?" instead of using cryptic debugger commands.

The repository is currently in **Sprint 1.7**, with the core CPU emulation complete (51/51 instructions, 102% of Phase 1 target) and the MCP server implementation approximately 90% complete. The project is structured as a TypeScript monorepo using Turborepo, with comprehensive documentation and testing infrastructure.

---

## Project Purpose

### What It Does

pkIntvMCP provides AI-assisted debugging for Intellivision homebrew games and ROM reverse-engineering by:

- **Emulating the CP-1600 CPU** with cycle-accurate timing
- **Exposing debugging capabilities** through MCP protocol that AI assistants understand
- **Enabling natural language debugging** instead of traditional command-line debuggers
- **Understanding Intellivision specifics** like BACKTAB coordinates, EXEC calls, and MOB registers

### Target Audience

- Intellivision homebrew game developers
- Retro computing enthusiasts reverse-engineering classic cartridges
- Developers learning CP-1600 assembly programming
- AI/MCP developers interested in emulator integration

### Key Differentiator

Unlike traditional debuggers (like jzIntv), pkIntvMCP is specifically designed for debugging and analysis with AI assistance, not for gameplay or 100% hardware accuracy. It validates against jzIntv for correctness but serves a different purpose.

---

## Repository Structure

### High-Level Organization

```
pkintvmcp/
├── packages/          # Monorepo packages
│   ├── core/         # CP-1600 emulator core (CPU, Memory, Decoder, Executor)
│   ├── mcp-cpu/      # MCP server implementation
│   └── cli/          # Command-line test runner
├── docs/             # Comprehensive documentation
├── examples/         # 6 complete CP-1600 assembly programs with documentation
├── tools/            # SDK-1600 toolchain wrappers (as1600, bin2rom)
├── ai-work/          # Sprint materials and AI collaboration artifacts
└── test-roms/        # Test ROM collection (planned)
```

### Key Packages

#### 1. **packages/core** - Emulator Core (✅ Complete)

The heart of the emulator, implementing:

- **CPU class**: 8 registers (R0-R7), 4 flags (C, OV, Z, S), cycle tracking
- **Memory class**: 64K words (16-bit), ROM/RAM distinction
- **Decoder class**: Converts 10-bit instruction words to structured Instruction objects (116 opcodes)
- **Executor class**: Executes instructions and updates CPU state (51/51 instructions implemented)

**Status:** 342 tests passing, 92.88% line coverage

#### 2. **packages/mcp-cpu** - MCP Server (~90% Complete)

Implements the Model Context Protocol server with 11 tools:

**Session Management:**
- `cp1600_create_session` - Create new emulator instance
- `cp1600_list_sessions` - List active sessions
- `cp1600_destroy_session` - Clean up session

**ROM Loading:**
- `cp1600_load_rom` - Load binary ROM files

**Execution Control:**
- `cp1600_step` - Execute N instructions
- `cp1600_run` - Run until halt or max cycles
- `cp1600_reset` - Reset CPU state

**State Inspection:**
- `cp1600_get_state` - Complete CPU state snapshot
- `cp1600_get_registers` - Register values
- `cp1600_get_flags` - Flag states
- `cp1600_disassemble` - Disassemble memory ranges

#### 3. **packages/cli** - Command-Line Runner

Simple test runner for executing ROM files and displaying CPU state. Used for testing and validation.

---

## Documentation Structure

The `docs/` folder contains extensive documentation:

### Getting Started
- **USER_GUIDE.md** - How to use pkIntvMCP with Claude
- **GETTING_STARTED.md** - Comprehensive quick-start guide
- **MCP_SETUP.md** - Complete Claude Desktop setup guide

### Technical Documentation
- **ARCHITECTURE.md** - Technical architecture and design decisions
- **CPU_SPECIFICATION.md** - CP-1600 instruction set reference (~50 instructions)
- **MCP_API.md** - Complete MCP interface specification (30+ tools planned)
- **PROJECT_SETUP.md** - Repository structure, build system, testing strategy

### Development Planning
- **ROADMAP.md** - Development phases and timeline (4 phases planned)
- **Sprint-N.md** - Individual sprint documentation (Sprint 1.1 through 1.7)
- **WISHLIST.md** - Backlog and future features
- **project-log/** - Chronological project log (one entry per file)

### Reference Materials
- **instruction-encoding.md** - Opcode bit patterns
- **resources-guide.md** - Reference materials guide
- **testing-guide.md** - Testing patterns and best practices
- **cp1600-ref/cp1600_ref.json** - Machine-readable instruction set reference

---

## Current Status

### Sprint Progress

**Completed Sprints:**

✅ **Sprint 1.1** (2025-12-08): Documentation and infrastructure  
✅ **Sprint 1.2** (2025-12-09): Instruction decoder (116 opcodes)  
✅ **Sprint 1.3** (2025-12-09): CPU core and executor foundation  
✅ **Sprint 1.4** (2025-12-09): Arithmetic and logical instructions  
✅ **Sprint 1.5** (2025-12-11): Control flow and stack instructions  
✅ **Sprint 1.5.1** (2025-12-11): 6 CP-1600 assembly examples (~2,500 lines documentation)  
✅ **Sprint 1.6** (2025-12-12): Shifts, rotates, and immediate forms  
✅ **Sprint 1.6.1** (2025-12-12): Auto-increment instructions (MVI@, MVO@)  

**Current Sprint:**

📋 **Sprint 1.7** (~90% complete): Basic MCP Server

**What's Done:**
- ✅ Toolchain integration (bootstrap script, wrappers, npm scripts)
- ✅ CLI runner tested and working
- ✅ MCP_SETUP.md - Complete Claude Desktop setup guide
- ✅ GETTING_STARTED.md - Comprehensive quick-start guide
- ✅ claude_desktop_config.json.example - Config template
- ✅ CLAUDE.md updated with toolchain usage

**Remaining Tasks (per NEXT_STEPS.md):**
1. Update README.md with Sprint 1.7 completion info
2. Update docs/ROADMAP.md - Mark Sprint 1.7 as complete
3. Update docs/Sprint-1.7.md - Add final status summary
4. Optional: Test MCP Server with Claude Desktop
5. Create project log entry for Sprint 1.7 completion

**Estimated Time:** 30-60 minutes for documentation updates

### Implementation Status

**CPU Core:**
- ✅ Complete (8 registers, 4 flags, cycle tracking, interrupt enable)
- ✅ Decoder: 116 opcodes, all addressing modes
- ✅ Executor: 51/51 instructions (102% of Phase 1 target)
- ✅ Test Coverage: 92.88% (342 tests passing)

**Instruction Categories Implemented:**
- Data Movement: MOVR, MVI, MVO, MVI@, MVO@
- Arithmetic: ADDR, SUBR, INCR, DECR, ADD, SUB
- Logical: ANDR, XORR, CLRR, AND, XOR
- Comparison: TSTR, CMP
- Control: HLT, NOPP, EIS, DIS
- Control Flow: B, J, JR, BEQ, BNEQ, BC, BNC, BOV, BNOV, BMI, BPL, BLT, BGE, BLE, BGT
- Subroutines: JSR, JSRE, JSRD
- Stack: PSHR, PULR
- Shifts: SLL, SLLC, SLR, SAR, SARC
- Rotates: RLC, RRC
- Bit Manipulation: SWAP, NEGR

**What's Working:**
- ✅ Loops with counters
- ✅ Conditional branching (all flag conditions)
- ✅ Subroutine calls with stack
- ✅ Nested function calls
- ✅ Signed comparisons
- ✅ Bit manipulation (shifts, rotates, byte swapping)
- ✅ All Sprint 1.5.1 assembly examples fully executable

---

## Assembly Examples

The `examples/` directory contains 6 complete, well-documented CP-1600 assembly programs:

1. **01-hello-world** - Basic operations (15 lines)
2. **02-counter-loop** - Loop with conditional branch (20 lines)
3. **03-subroutine-call** - JSR/JR calling convention (25 lines)
4. **04-bit-manipulation** - Shifts, rotates, masking (30 lines)
5. **05-signed-math** - Signed comparisons and overflow (35 lines)
6. **06-nested-calls** - Stack management with PSHR/PULR (45 lines)

Each example includes comprehensive documentation (~250-400 lines) with:
- Execution traces
- Expected states
- Common patterns
- Pitfalls to avoid

These serve as both learning materials and test cases for the MCP server.

---

## Development Roadmap

### Phase 1: CPU Core (Current - Nearly Complete)

**Goal:** CPU-only debugging without peripherals

**Status:** ~95% complete (MCP server needs final documentation updates)

**Deliverables:**
- Complete CP-1600 CPU emulation (~50 instructions) ✅
- Cycle-accurate timing ✅
- Step-by-step execution control ✅
- Memory inspection and disassembly ✅
- Register and flag monitoring ✅
- Execution trace history ✅
- Basic MCP server (11 tools) ~90%

### Phase 2: Validation & Completion (Next)

**Goal:** Comprehensive testing and ROM format support

**Planned Features:**
- Full validation against jzIntv (reference emulator)
- Comprehensive test suite
- ROM format support (BIN+CFG, ROM)
- >99% jzIntv compatibility

**Estimated Timeline:** 2-3 weeks after Phase 1 completion

### Phase 3: Peripherals (Future)

**Goal:** Full system debugging beyond CPU

**Planned Features:**
- STIC graphics chip emulation
- PSG sound chip emulation
- Controller input simulation
- Visual display of screen output and sprite data
- Full system debugging (not just CPU)

### Phase 4: Production (Future)

**Goal:** Public release and ecosystem

**Planned Features:**
- Web-based interface (run in browser, no installation)
- VS Code extension
- Symbol file support (.sym from as1600)
- TAS (tool-assisted speedrun) recording/playback
- npm package publication
- Community launch

---

## Technology Stack

**Languages & Frameworks:**
- **TypeScript** (strict mode) - Primary language
- **Node.js** 18+ - Runtime environment
- **Turborepo** - Monorepo orchestration

**Testing:**
- **Vitest** - Testing framework
- **342 tests passing** - 92.88% line coverage

**MCP Integration:**
- **@modelcontextprotocol/sdk** - MCP protocol implementation

**Build Tools:**
- **SDK-1600** - CP-1600 assembler toolchain (as1600, bin2rom)
- Custom wrapper scripts for cross-platform support

---

## Toolchain Integration

The repository includes SDK-1600 tools (as1600, bin2rom) for assembling CP-1600 programs.

### Bootstrap Process

```bash
# First time setup
npm run toolchain:bootstrap
```

This builds `as1600` and `bin2rom` from jzIntv source and installs them to `tools/bin/<platform>/`.

### Assembling ROMs

```bash
# Via npm (recommended)
npm run as1600 -- myfile.asm -o myfile.bin

# Or directly with wrapper
./tools/as1600 myfile.asm -o myfile.bin
```

### Testing ROMs

```bash
# CLI runner
npm run cli:hello                    # Quick test with hello-world
npm run cli:run -- path/to/rom.bin  # Run any ROM

# With trace output
npm run cli:run -- path/to/rom.bin --trace --verbose
```

### Expected Artifacts

When assembling a .asm file:
- `.bin` - Binary ROM file (loadable by emulator)
- `.lst` - Listing file (assembly with addresses)
- `.sym` - Symbol table (labels and their addresses)

---

## Key Files

### Root Level

- **NEXT_STEPS.md** - Current sprint completion tasks (Sprint 1.7)
- **CLAUDE.md** - Guidance for Claude Code when working with this repository
- **README.md** - Project overview and getting started
- **package.json** - Monorepo configuration and scripts
- **turbo.json** - Turborepo configuration
- **tsconfig.json** - TypeScript configuration
- **claude_desktop_config.json.example** - MCP server config template

### Important Documentation

- **docs/ROADMAP.md** - High-level planning and phases
- **docs/ARCHITECTURE.md** - Technical architecture
- **docs/Sprint-1.7.md** - Current sprint documentation
- **docs/MCP_SETUP.md** - Claude Desktop setup guide
- **docs/GETTING_STARTED.md** - Quick-start guide

---

## Next Steps (Immediate)

Based on NEXT_STEPS.md, the immediate priorities are:

1. **Update README.md** - Add Sprint 1.7 completion info and quick-start section
2. **Update docs/ROADMAP.md** - Mark Sprint 1.7 as complete
3. **Update docs/Sprint-1.7.md** - Add final status summary and completion metrics
4. **Optional: Test MCP Server** - Verify all 11 tools work with Claude Desktop
5. **Create Project Log Entry** - Document Sprint 1.7 completion

**Priority:** Complete tasks 1-3 to officially close Sprint 1.7  
**Estimated Time:** 30-60 minutes for documentation updates

---

## Installation & Usage

### Current Status

**Not yet released** - The project is in active development. Sprint 1.7 is ~90% complete.

### Planned Installation (When Ready)

```bash
# Install globally
npm install -g pkintvmcp

# Configure Claude Desktop
# (Instructions in docs/MCP_SETUP.md)

# Start debugging with Claude
"Load my ROM and help me find where it's crashing"
```

### Web Interface (Planned)

A web-based interface is planned for Phase 4 at `pkintvmcp.dev`.

---

## Contributing

The project is open source (MIT license) and welcomes contributions. Key resources for contributors:

- **docs/PROJECT_SETUP.md** - Repository structure and build system
- **docs/ARCHITECTURE.md** - Technical design and module boundaries
- **docs/CPU_SPECIFICATION.md** - Instruction set details
- **docs/testing-guide.md** - Testing patterns and best practices
- **docs/project-log/** - Project history and decisions

### Community

- **Primary:** intvprog Discord server
- **Secondary:** intvprog email list
- AtariAge Intellivision forums

---

## Validation Strategy

### jzIntv Integration

**jzIntv** is the reference Intellivision emulator in C (GPL) by Joe Zbiciak.

**Approach:**
- Apply minimal patch to jzIntv for trace output
- Compare execution traces between pkIntvMCP and jzIntv
- Use Air Strike (standard Intellivision cartridge) for initial validation

**Success Criteria:**
- >99% instruction compatibility
- Zero known bugs on test suite

---

## CP-1600 Architecture Quick Reference

### Key Characteristics

- **10-bit instruction words** (called "decles") stored in ROM
- **16-bit data operations** - all registers and memory are 16-bit
- **8 registers:** R0-R5 (general purpose), R6 (stack pointer), R7 (program counter)
- **4 flags:** Sign (S), Zero (Z), Overflow (OV), Carry (C)
- **SDBD prefix:** Special instruction enabling 16-bit immediate values

### Memory Map

```
$0000-$003F: STIC registers (hardware, Phase 3)
$0100-$01EF: 8-bit RAM (240 bytes)
$0200-$035F: 16-bit RAM (352 words)
  $0200-$02EF: BACKTAB (240 words, screen display data)
  $02F0-$0318: Stack (40 words)
  $031D-$035C: MOB data (sprite data, 8 objects)
$1000-$1FFF: Exec ROM (4K, system BIOS)
$3000-$37FF: GROM (2K, 256 built-in characters)
$3800-$39FF: GRAM (512 bytes, 64 custom characters)
$5000-$6FFF: Cartridge ROM (4K-8K typical)
```

---

## Conclusion

**pkIntvMCP** is a well-structured, thoroughly documented project that is very close to its first usable release. The core CPU emulation is complete and tested, the MCP server is ~90% implemented, and comprehensive documentation exists for both users and developers.

The project represents a novel approach to retro computing debugging by leveraging AI assistants and the Model Context Protocol, making assembly debugging more accessible through natural language interaction.

**Immediate next steps** are purely documentation updates to officially close Sprint 1.7, followed by Phase 2 validation against jzIntv before the first public release.
