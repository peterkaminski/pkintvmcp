# pkIntvMCP - Intellivision Debugging with AI

**Debug CP-1600 programs by talking to Claude (or other AI assistants)**

pkIntvMCP is an emulator and debugging tool for the Intellivision's CP-1600 microprocessor that lets you debug programs conversationally using AI. Instead of cryptic debugger commands, just ask questions like "Why does my ROM crash at address $5020?" or "Where is this sprite data stored?"

## Project Status (IMPORTANT)

**ALPHA CODE**

This project is under active development, and different parts of the code and/or documentation may not match in the moment. Tests may not exist or may fail. It's all expected to converge and be reviewed at a later date.

As of 2025-12-14, the CPU is substantially complete. Internal unit tests pass, but external and integration tests have not been completed. There may be bugs, possibly significant.

The CLI test harness and MCP server can both run code. Right now, it should be able regular CP-1600 code, but it's not set up to run Intellivision carts yet, even though that's the ultimate intention.

## What Is This?

If you're working on Intellivision homebrew games or reverse-engineering classic cartridges, you know debugging CP-1600 assembly can be tedious. Traditional debuggers require memorizing commands and interpreting raw memory dumps.

pkIntvMCP takes a different approach: it exposes the emulator through a protocol (MCP - Model Context Protocol) that AI assistants understand. This means you can debug in plain English with an AI that has deep knowledge of the CP-1600 architecture, the Intellivision's quirks, and common assembly patterns.

### Example Debugging Session

```
You: "Load airstrk.bin and run to the first JSRD instruction"
Claude: Running... stopped at $5234 (JSRD $1A5C, R5)
        This is calling the EXEC's PRINT routine.

You: "What's in R1 right now?"
Claude: R1 = $021A (538 decimal)
        This is a BACKTAB address - row 2, column 10 on screen.

You: "Show me the execution trace for the last 10 instructions"
Claude: Here's the trace... [detailed disassembly with register changes]
```

The AI understands Intellivision specifics like BACKTAB coordinates, EXEC calls, MOB (sprite) registers, and can even reference your program's source code or symbol files if you provide them.

## Features

**Phase 1 (Current Development):**
- Complete CP-1600 CPU emulation (~50 instructions)
- Cycle-accurate timing
- Step-by-step execution control
- Breakpoints and watchpoints
- Memory inspection and disassembly
- Register and flag monitoring
- Execution trace history

**Phase 2 (Planned):**
- Full validation against jzIntv (reference emulator)
- Comprehensive test suite
- ROM format support (BIN+CFG, ROM)

**Phase 3 (Future):**
- STIC graphics chip emulation
- PSG sound chip emulation
- Controller input simulation
- Full system debugging (not just CPU)
- Visual display of screen output and sprite data

**Phase 4 (Future):**
- Web-based interface (run in browser, no installation)
- VS Code extension
- Symbol file support (.sym from as1600)
- TAS (tool-assisted speedrun) recording/playback

## Why MCP?

MCP (Model Context Protocol) is a standard way for AI assistants to interact with external tools. Think of it like CGI for AI - it lets Claude (or other AI assistants) safely run your emulator, inspect state, and provide intelligent analysis without you needing to learn a new debugger interface.

The AI can:
- Read and understand your assembly code
- Explain what instructions do
- Spot common bugs (forgot to save R5 in a subroutine?)
- Suggest fixes based on similar code patterns
- Convert between hex/decimal/binary instantly
- Remember context across your debugging session

## For Intellivision Developers

**This is not a replacement for jzIntv** - Joe Zbiciak's jzIntv is the gold standard Intellivision emulator and will remain so. pkIntvMCP is specifically designed for *debugging and analysis*, not gameplay or 100% hardware accuracy.

**What pkIntvMCP is good for:**
- Understanding how a ROM works (reverse engineering)
- Finding bugs in your assembly code
- Learning the CP-1600 instruction set
- Analyzing instruction timing and optimization
- Explaining complex code to others

**What to use jzIntv for:**
- Playing Intellivision games
- Testing if your homebrew game works correctly
- Accurate hardware behavior for shipping ROMs
- Maximum performance

We validate pkIntvMCP's behavior against jzIntv to ensure correctness, but they serve different purposes.

## Current Status

**Sprint 1.6.1 Complete** - Phase 1 Instruction Set 100% ✅

We're building this in phases:
- ✅ **Sprint 1.1**: Documentation and infrastructure complete
- ✅ **Sprint 1.2**: Instruction decoder complete (116 opcodes)
- ✅ **Sprint 1.3**: CPU core and executor foundation complete
- ✅ **Sprint 1.4**: Arithmetic and logical instructions (12 total)
- ✅ **Sprint 1.5**: Control flow and stack instructions (35 total)
- ✅ **Sprint 1.5.1**: 6 CP-1600 assembly examples (~2,500 lines documentation)
- ✅ **Sprint 1.6**: Shifts, rotates, and immediate forms (14 instructions)
- ✅ **Sprint 1.6.1**: Auto-increment instructions (MVI@, MVO@)
- 📋 **Sprint 1.7**: Basic MCP Server (execution control, state inspection)
- ⏳ **Phase 2**: Validation against jzIntv reference emulator

**Current Implementation Status:**
- **CPU Core**: ✅ Complete (8 registers, 4 flags, cycle tracking, interrupt enable)
- **Decoder**: ✅ Complete (116 opcodes, all addressing modes)
- **Executor**: ✅ 51/51 instructions (100% Phase 1 complete!)
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
- **Test Coverage**: 92.88% (342 tests passing)

**What's Working:**
- ✅ Loops with counters
- ✅ Conditional branching (all flag conditions)
- ✅ Subroutine calls with stack
- ✅ Nested function calls
- ✅ Signed comparisons
- ✅ Bit manipulation (shifts, rotates, byte swapping)
- ✅ All Sprint 1.5.1 assembly examples fully executable

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full development plan and [docs/project-log/](docs/project-log/) for detailed progress history.

### Assembly Examples

The [examples/](examples/) directory contains 6 complete, well-documented CP-1600 assembly programs:

- **[01-hello-world](examples/01-hello-world/)** - Basic operations (15 lines)
- **[02-counter-loop](examples/02-counter-loop/)** - Loop with conditional branch (20 lines)
- **[03-subroutine-call](examples/03-subroutine-call/)** - JSR/JR calling convention (25 lines)
- **[04-bit-manipulation](examples/04-bit-manipulation/)** - Shifts, rotates, masking (30 lines)
- **[05-signed-math](examples/05-signed-math/)** - Signed comparisons and overflow (35 lines)
- **[06-nested-calls](examples/06-nested-calls/)** - Stack management with PSHR/PULR (45 lines)

Each example includes comprehensive documentation (~250-400 lines) with execution traces, expected states, common patterns, and pitfalls. Perfect for learning CP-1600 programming or as test cases for the MCP server.

### Can I Use It Now?

Almost! The CPU core and complete Phase 1 instruction set (51/51 instructions) are implemented and tested. All Sprint 1.5.1 assembly examples are now fully executable. We need to implement the MCP server interface and validate against jzIntv before the tool is ready for real debugging.

**What's Left:**
- Sprint 1.7: Basic MCP Server (execution control, state inspection)
- Sprint 1.8: Debugging Tools (breakpoints, trace, run_until)
- Phase 2: jzIntv validation and testing
- **First Usable Release**: Approximately 2-3 weeks

If you want to contribute or follow along:
- Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details
- See [docs/Sprint-1.7.md](docs/Sprint-1.7.md) for next sprint plan
- Check [docs/project-log/](docs/project-log/) for recent progress
- Review [docs/WISHLIST.md](docs/WISHLIST.md) for future features

## For AI/MCP Developers

pkIntvMCP implements the Model Context Protocol with 30+ tools for emulator control:

**Execution Tools:**
- `cp1600_load_rom` - Load ROM image
- `cp1600_step` - Execute N instructions
- `cp1600_run` - Run until breakpoint/halt
- `cp1600_run_until` - Run to address/condition

**Inspection Tools:**
- `cp1600_get_state` - Full CPU state snapshot
- `cp1600_disassemble` - Disassemble memory range
- `cp1600_examine_memory` - Read memory regions
- `cp1600_get_trace` - Execution history

**Debugging Tools:**
- `cp1600_set_breakpoint` - Conditional breakpoints
- `cp1600_set_watchpoint` - Memory watchpoints
- `cp1600_find_pattern` - Search memory/trace

See [docs/MCP_API.md](docs/MCP_API.md) for complete API documentation.

## Installation

*(Coming soon - not yet released)*

When ready, pkIntvMCP will be available as:
```bash
npm install -g pkintvmcp
```

Or use the web interface at [pkintvmcp.dev](https://pkintvmcp.dev) (planned).

## Quick Start

*(Coming soon)*

```bash
# Install the MCP server
npm install -g pkintvmcp

# Configure Claude Desktop to use it
# (Instructions will be in docs/USER_GUIDE.md)

# Start debugging with Claude
"Load my ROM and help me find where it's crashing"
```

## Documentation

All detailed documentation is in the [docs/](docs/) folder:

**Getting Started:**
- [USER_GUIDE.md](docs/USER_GUIDE.md) - How to use pkIntvMCP with Claude
- [CPU_SPECIFICATION.md](docs/CPU_SPECIFICATION.md) - CP-1600 instruction reference

**Development:**
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture
- [PROJECT_SETUP.md](docs/PROJECT_SETUP.md) - Build system and structure
- [ROADMAP.md](docs/ROADMAP.md) - Development phases and timeline

**Reference:**
- [MCP_API.md](docs/MCP_API.md) - Complete MCP tool specifications
- [instruction-encoding.md](docs/instruction-encoding.md) - Opcode bit patterns
- [resources-guide.md](docs/resources-guide.md) - Reference materials guide

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Build**: Turborepo + npm workspaces
- **Testing**: Vitest with >90% coverage target
- **Validation**: Comparison against jzIntv traces
- **Protocol**: MCP (Model Context Protocol)

Built to run anywhere: Node.js, browser (via WebAssembly - planned), or as a library.

## Architecture

```
packages/
├── core/           # CP-1600 emulator core
├── mcp-cpu/        # MCP server (CPU-only debugging)
├── mcp-system/     # MCP server (full system, Phase 3)
├── validation/     # jzIntv integration tests
├── cli/            # Optional command-line debugger
└── web/            # Optional browser UI (Phase 4)
```

## Contributing

We're in early development, but contributions are welcome!

**Areas where help is needed:**
- CP-1600 instruction validation (compare against hardware/jzIntv)
- Test ROM creation (small programs to exercise specific instructions)
- Documentation improvements
- Web UI design (Phase 4)

See [docs/PROJECT_SETUP.md](docs/PROJECT_SETUP.md) for development setup.

## Credits

**Built with knowledge from:**
- **Joe Zbiciak** - jzIntv emulator and extensive Intellivision documentation
- **Carl Mueller Jr.** - De Re Intellivision
- **David Harley** - CP-1600 documentation and community knowledge
- The **intvprog community** - Years of collective Intellivision development wisdom

**Special thanks:**
- Air Strike (the test ROM) was written by Peter Kaminski at APh Technological Consulting in the 1980s

## License

MIT License - See LICENSE file for details

**Note**: The `resources/` folder contains reference materials with different copyright terms that are not part of the open-source distribution. See [docs/resources-guide.md](docs/resources-guide.md) for details.

## Community

- **Discord**: intvprog server (Intellivision programming community)
- **Forums**: AtariAge Intellivision forum
- **Issues**: GitHub issues for bugs and feature requests

## Related Projects

- **jzIntv** - The definitive Intellivision emulator (GPL)
- **as1600** - Intellivision assembler (part of jzIntv)
- **IntyBASIC** - BASIC compiler for Intellivision
- **LTO Flash!** - Intellivision flash cartridge

---

**Status**: 🚧 Active Development - Not Yet Ready for Use

**Check back soon for the first release!**

Made with ❤️ for the Intellivision homebrew community
