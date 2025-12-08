# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**pkIntvMCP** is an MCP (Model Context Protocol) server that enables AI assistants like Claude to debug and analyze CP-1600/Intellivision programs. The project emulates the CP-1600 16-bit microprocessor with a comprehensive debugging interface.

**Current Status**: Sprint 1.1 (Foundation & Documentation) - Planning phase with no code yet.

## Project Architecture

### Planned Monorepo Structure
```
packages/
├── core/           # Emulator core (CPU, Memory, Decoder, Executor)
├── mcp-cpu/        # CPU-only MCP server (Phase 1)
├── mcp-system/     # Full system MCP server (Phase 3: STIC, PSG, controllers)
├── validation/     # jzIntv integration for testing
├── cli/            # Optional CLI debugger
└── web/            # Optional web UI (Phase 4)
docs/               # All documentation
test-roms/          # Test ROM collection
```

### Core Module Design
- **CPU class**: State, registers (R0-R7), flags (C, OV, Z, S), execution loop
- **Memory class**: 64K words (16-bit), ROM/RAM distinction
- **Decoder class**: 10-bit instruction words → structured Instruction objects
- **Executor class**: Instruction → CPU state changes
- **SessionManager**: Multiple simultaneous simulator instances (MCP requirement)

### Technology Stack
- **TypeScript** (strict mode) - chosen over Python for web UI potential and accessibility
- **Build**: Turborepo for monorepo orchestration
- **Testing**: Jest or Vitest (to be decided)
- **MCP SDK**: @modelcontextprotocol/sdk

## Development Phases

### Phase 1: CPU Core (Current)
Focus on CPU-only debugging without peripherals. Must validate against jzIntv reference emulator.

**Sprint 1.1 Deliverables** ✅ **COMPLETE**:
1. ✅ PRD.md (v1.2)
2. ✅ ARCHITECTURE.md (v1.0)
3. ✅ CPU_SPECIFICATION.md (v1.0)
4. ✅ MCP_API.md (v1.0)
5. ✅ PROJECT_SETUP.md (v1.0)
6. ✅ USER_GUIDE.md (v1.0 provisional)

**Sprint 1.1 Status**: ✅ Documentation complete. Ready for Sprint 1.2 (Instruction Decoder implementation).

### Phase 2: Validation & Completion
Complete all ~50 CP-1600 instructions, achieve >99% jzIntv compatibility, comprehensive testing.

### Phase 3: Peripherals (Future)
Add STIC (graphics), PSG (sound), controller emulation for full system debugging.

### Phase 4: Production (Future)
npm package publication, community launch, optional web UI.

## CP-1600 Architecture Reference

### Key CPU Characteristics
- **10-bit instruction words** stored in ROM (called "decles")
- **16-bit data operations** - all registers and memory are 16-bit
- **8 registers**: R0-R5 (general purpose), R6 (stack pointer), R7 (program counter)
- **4 flags**: Sign, Zero, Overflow, Carry
- **SDBD prefix**: Special instruction that enables 16-bit immediate values across two decles
- **Addressing modes**: Direct, indirect, immediate, register, including @@R4 and @@R5

### Memory Map (Important for emulation)
- $0000-$003F: STIC registers (hardware, Phase 3)
- $0100-$01EF: 8-bit RAM (240 bytes)
- $0200-$035F: 16-bit RAM (352 words)
  - $0200-$02EF: BACKTAB (240 words, screen display data)
  - $02F0-$0318: Stack (40 words)
  - $031D-$035C: MOB data (sprite data, 8 objects)
- $1000-$1FFF: Exec ROM (4K, system BIOS)
- $3000-$37FF: GROM (2K, 256 built-in characters)
- $3800-$39FF: GRAM (512 bytes, 64 custom characters)
- $5000-$6FFF: Cartridge ROM (4K-8K typical)

### Critical Implementation Notes
- **JavaScript bit operations**: Requires explicit masking (toUint16, toUint10) for correctness
- **Deterministic execution**: Same input must produce same output (essential for debugging)
- **Cycle timing**: Will track exact cycle counts from CP-1600 manual (page 53+), format: base + W*memory_accesses
- **Flag calculation**: Overflow detection is subtle, requires careful implementation

## Validation Strategy

### jzIntv Integration
- **jzIntv**: Reference Intellivision emulator in C (GPL) by Joe Zbiciak
- **Approach**: Apply minimal patch to jzIntv for trace output, compare traces
- **Test ROM**: Air Strike (standard Intellivision cartridge) for initial validation
- **Success criteria**: >99% instruction compatibility, zero known bugs on test suite

### Test Structure
- **Unit tests**: Per-instruction validation
- **Integration tests**: Multi-instruction sequences, control flow
- **Edge cases**: SDBD with various addressing modes, stack operations, register aliasing (R7=PC)
- **Coverage target**: >90% Phase 1, >95% Phase 2

## MCP Interface Design

### Tools (30+ planned)
Execution control: `cp1600_load_rom`, `cp1600_step`, `cp1600_run`, `cp1600_run_until`, `cp1600_reset`
State inspection: `cp1600_get_state`, `cp1600_get_registers`, `cp1600_get_flags`, `cp1600_disassemble`, `cp1600_examine_memory`
Debugging: `cp1600_set_breakpoint`, `cp1600_clear_breakpoint`, `cp1600_enable_trace`, `cp1600_get_trace`
Sessions: Multiple simultaneous debugging sessions with isolation

### Resources (10+ planned)
- `cp1600://sessions/{id}/state` - Current CPU state
- `cp1600://sessions/{id}/trace` - Execution history
- `cp1600://sessions/{id}/memory/{start}/{end}` - Memory ranges

## Code Conventions (Planned)

- **File naming**: kebab-case
- **Classes**: PascalCase
- **Functions**: camelCase
- **Types**: Separate `.types.ts` files
- **Exports**: Barrel exports via `index.ts`

## Key Documentation

### Core Documentation
- **PRD_v1.2.md**: Complete product requirements (30KB, comprehensive)
- **ARCHITECTURE.md**: Technical architecture and design decisions (system design, packages, modules)
- **CPU_SPECIFICATION.md**: CP-1600 instruction set details (~50 instructions)
- **MCP_API.md**: Complete MCP interface specification (30+ tools, 10+ resources)
- **PROJECT_SETUP.md**: Repository structure, build system, testing strategy
- **USER_GUIDE.md**: Provisional user documentation (workflows, examples)

### Project Tracking Documents

**ROADMAP.md** - High-level planning
- Overview of all 4 phases
- Sprint breakdown and milestone gates
- Current status and what's next
- Update at start/end of each sprint

**WISHLIST.md** - Backlog and ideas
- Nice-to-have features
- Community requests
- Future enhancements
- Research topics
- Add ideas as they arise

**Sprint-N.md** - Current and historical sprints
- Sprint-1.1.md: Foundation & Documentation (✅ complete)
- Sprint-1.2.md: Instruction Decoder (⏳ current)
- Sprint-1.3.md: Core Execution Engine (planned)
- Detailed task lists, progress tracking
- Keep all sprint docs for project history

### Resources Folder (Non-Open-Source Materials)
The `resources/` folder contains background materials with different copyright restrictions that should NOT be moved to the open-source project root or subfolders:
- Initial design conversations and brainstorming sessions
- External documentation that may have licensing restrictions
- Research materials and references

**Important**: Content in `resources/` is excluded from version control (.gitignore) and should remain separate from the main project. Do not copy or move files from `resources/` into the open-source portions of the repository.

### External References
- CP-1600 Microprocessor Users Manual (May 1975) - cycle timing on page 53+
- Your Friend, The EXEC (1981) - Exec API reference
- De Re Intellivision - hardware and development reference
- jzIntv source: https://github.com/jenergy/jzintv
- MCP Specification: https://modelcontextprotocol.io

### Community
- **Primary**: intvprog Discord server
- **Secondary**: intvprog email list
- AtariAge Intellivision forums

## Important Constraints

### What to Avoid
- **Not cycle-exact**: Approximate timing sufficient for Phase 1-2, exact timing only where necessary
- **Not a gameplay emulator**: Focus is debugging, not casual gaming
- **CPU-only in Phase 1-2**: No STIC/PSG/peripherals until Phase 3
- **No assembler/compiler**: Use existing tools (as1600), focus is debugging

### Critical Success Factors
1. **Bit-accurate emulation**: JavaScript numeric types require careful handling
2. **jzIntv compatibility**: Validation is essential, >99% compatibility required
3. **Clear error messages**: MCP tools must be self-documenting for Claude
4. **Deterministic behavior**: Critical for reproducible debugging

## When Ready to Code

1. **Start with PROJECT_SETUP.md**: Defines repository structure and build system
2. **Then ARCHITECTURE.md**: Technical design and module boundaries
3. **Then CPU_SPECIFICATION.md**: All ~50 instructions with pseudocode and test requirements
4. **Initialize monorepo**: Turborepo + TypeScript + testing framework
5. **Build skeleton**: All packages compile, tests run (even if empty)
6. **Begin Sprint 1.2**: Instruction decoder implementation

## Non-Goals

- Perfect hardware accuracy (not cycle-exact like higan/bsnes)
- Support for other retro systems (Intellivision/CP-1600 only)
- Commercial support (open source, community-driven)
- Assembler or development tools (use existing ecosystem)
