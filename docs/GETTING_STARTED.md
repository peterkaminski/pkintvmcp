# Getting Started with pkIntvMCP

**pkIntvMCP** is an MCP (Model Context Protocol) server that enables AI assistants like Claude to debug and analyze CP-1600/Intellivision programs.

This guide will get you up and running quickly.

---

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/peterkaminski/pkintvmcp.git
cd pkintvmcp
npm install

# 2. Build the project
npm run build

# 3. Test with hello-world example
npm run cli:hello

# 4. (Optional) Set up Claude Desktop MCP integration
# See MCP_SETUP.md for detailed instructions
```

---

## What Can You Do?

**With the CLI runner:**
- Load and execute CP-1600 ROM binaries
- Step through instructions
- Inspect registers, flags, and memory
- Trace execution

**With the MCP server + Claude Desktop:**
- Ask Claude to debug Intellivision programs
- Interactively explore code behavior
- Get AI assistance understanding CP-1600 assembly
- Test and validate ROM programs

---

## Prerequisites

**Required:**
- Node.js >= 18.0.0
- npm >= 9.0.0

**Optional (for building ROMs):**
- macOS or Linux
- Make and C compiler (for building as1600 assembler)

**Check your versions:**
```bash
node --version  # Should be >= v18.0.0
npm --version   # Should be >= 9.0.0
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/peterkaminski/pkintvmcp.git
cd pkintvmcp
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages for the monorepo (core emulator, CLI, MCP server).

### 3. Build the Project

```bash
npm run build
```

This compiles all TypeScript packages to JavaScript.

**Verify the build:**
```bash
ls packages/core/dist/       # Core emulator
ls packages/cli/dist/        # CLI runner
ls packages/mcp-cpu/dist/    # MCP server
```

All three directories should contain compiled `.js` files.

---

## First Steps

### Option 1: CLI Runner (Standalone)

The CLI runner lets you execute ROMs without MCP/Claude:

```bash
# Run the hello-world example
npm run cli:hello
```

**Expected output:**
```
=== Execution Complete ===

Reason: halted
Instructions executed: 5
Cycles: 32

Registers:
  R0    : $008E (142)
  R1    : $0064 (100)
  R2    : $008E (142)
  ...
```

**Run any ROM:**
```bash
npm run cli:run -- /path/to/your/rom.bin
```

**With options:**
```bash
npm run cli:run -- /path/to/rom.bin --trace --verbose
```

### Option 2: MCP Server (with Claude Desktop)

The MCP server enables Claude to debug programs:

1. **Configure Claude Desktop**

   See [MCP_SETUP.md](MCP_SETUP.md) for complete instructions.

   Quick version:
   ```bash
   # Edit your Claude Desktop config
   # macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

   # Add (replace with your actual path):
   {
     "mcpServers": {
       "pkintvmcp": {
         "command": "node",
         "args": ["/path/to/pkintvmcp/packages/mcp-cpu/dist/index.js"],
         "env": {}
       }
     }
   }
   ```

2. **Restart Claude Desktop**

3. **Test the connection**

   Ask Claude: "Can you list the available pkIntvMCP tools?"

4. **Try debugging**

   Ask Claude: "Create a CP-1600 session and load the hello-world ROM"

---

## Building ROMs (Optional)

To assemble .asm files into .bin ROM files, you need the as1600 assembler.

### Bootstrap the Toolchain

```bash
npm run toolchain:bootstrap
```

This builds `as1600` and `bin2rom` from the jzintv source and installs them to `tools/bin/<platform>/`.

### Assemble a File

```bash
npm run as1600 -- myprogram.asm -o myprogram.bin
```

Or directly:
```bash
./tools/as1600 myprogram.asm -o myprogram.bin
```

### Example: Build Hello World

```bash
cd examples/01-hello-world
../../tools/as1600 hello-world.asm -o hello.bin
```

---

## Common Workflows

### Workflow 1: Test a ROM Standalone

```bash
# Build the ROM (if you have .asm source)
npm run as1600 -- myprogram.asm -o myprogram.bin

# Run it with the CLI
npm run cli:run -- myprogram.bin --trace

# Or with options
npm run cli:run -- myprogram.bin --load-address 5000 --max-cycles 10000
```

### Workflow 2: Debug with Claude

1. Configure Claude Desktop (see [MCP_SETUP.md](MCP_SETUP.md))
2. Start Claude Desktop
3. Say: "Create a CP-1600 session"
4. Say: "Load /path/to/myprogram.bin"
5. Say: "Step through 5 instructions and explain what's happening"
6. Say: "Show me the registers and flags"

### Workflow 3: Explore Examples

```bash
# Run hello-world
npm run cli:hello

# Explore other examples (these are .asm source files)
ls examples/

# Examples available:
# - 01-hello-world: Simple arithmetic
# - 02-counter-loop: Loop counting
# - 03-subroutine-call: JSR/RTS demonstration
# - 04-bit-manipulation: Shifts and rotates
# - 05-signed-math: Signed arithmetic
# - 06-nested-calls: Nested subroutine calls
```

---

## Available npm Scripts

**Build & Test:**
```bash
npm run build          # Build all packages
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run lint           # Run linter
npm run clean          # Clean build artifacts
```

**Toolchain:**
```bash
npm run toolchain:bootstrap  # Build as1600, bin2rom
npm run as1600 -- <args>     # Run assembler
npm run bin2rom -- <args>    # Run bin2rom converter
```

**CLI Runner:**
```bash
npm run cli:hello           # Quick test with hello-world
npm run cli:run -- <file>   # Run any ROM file
```

**MCP Server:**
```bash
npm run mcp:start          # Start MCP server (used by Claude Desktop)
```

---

## Project Structure

```
pkintvmcp/
├── packages/
│   ├── core/              # CP-1600 emulator core
│   │   ├── src/cpu/       # CPU state and operations
│   │   ├── src/memory/    # Memory system
│   │   ├── src/decoder/   # Instruction decoder
│   │   └── src/executor/  # Instruction executor
│   ├── cli/               # Standalone CLI test runner
│   └── mcp-cpu/           # MCP server for Claude
├── docs/                  # Documentation
│   ├── GETTING_STARTED.md # This file
│   ├── MCP_SETUP.md       # Claude Desktop setup
│   ├── ARCHITECTURE.md    # Technical architecture
│   ├── USER_GUIDE.md      # User workflows
│   └── ...
├── examples/              # Sample programs
│   ├── 01-hello-world/
│   ├── 02-counter-loop/
│   └── ...
├── tools/                 # Toolchain scripts
│   ├── bootstrap-sdk1600.sh
│   ├── as1600             # Assembler wrapper
│   └── bin2rom            # Binary converter wrapper
└── package.json           # Root package
```

---

## Next Steps

**Learn More:**
- [MCP_SETUP.md](MCP_SETUP.md) - Set up Claude Desktop integration
- [USER_GUIDE.md](USER_GUIDE.md) - Detailed usage workflows
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [CPU_SPECIFICATION.md](CPU_SPECIFICATION.md) - CP-1600 instruction set

**Try Examples:**
- Explore `examples/` directory
- Each example has detailed documentation explaining what it does

**Build Something:**
- Write your own CP-1600 assembly program
- Assemble it with `npm run as1600`
- Test it with `npm run cli:run`
- Debug it with Claude

**Contribute:**
- Report issues: https://github.com/peterkaminski/pkintvmcp/issues
- Read the roadmap: [docs/ROADMAP.md](ROADMAP.md)

---

## Troubleshooting

### Build Fails

**Problem:** `npm run build` fails

**Solutions:**
1. Check Node.js version: `node --version` (need >= 18)
2. Remove and reinstall: `rm -rf node_modules && npm install`
3. Check for errors in the output

### CLI Runner Doesn't Work

**Problem:** `npm run cli:hello` fails

**Solutions:**
1. Ensure you've run `npm run build`
2. Check that `packages/cli/dist/run-example.js` exists
3. Verify ROM file exists: `ls examples/01-hello-world/hello.bin`

### MCP Server Not Appearing

**Problem:** Claude Desktop doesn't show pkIntvMCP tools

**Solutions:**
1. Check configuration file path is correct
2. Use absolute paths (not relative or ~)
3. Restart Claude Desktop completely
4. Check Claude Desktop logs (Help > View Logs)
5. See detailed troubleshooting in [MCP_SETUP.md](MCP_SETUP.md)

### Toolchain Bootstrap Fails

**Problem:** `npm run toolchain:bootstrap` fails

**Solutions:**
1. Ensure you're on macOS or Linux
2. Check that jzintv source exists: `ls resources/jzintv-20200712-src`
3. Install build tools: `xcode-select --install` (macOS)
4. Try building manually in `resources/jzintv-20200712-src/as1600`

---

## Getting Help

**Documentation:**
- All docs are in the `docs/` directory
- Start with [MCP_SETUP.md](MCP_SETUP.md) and [USER_GUIDE.md](USER_GUIDE.md)

**Issues:**
- Report bugs: https://github.com/peterkaminski/pkintvmcp/issues
- Include: OS, Node version, error messages, steps to reproduce

**Community:**
- intvprog Discord server (for Intellivision development)
- AtariAge Intellivision forums

---

**Welcome to pkIntvMCP!** We hope you enjoy debugging CP-1600 programs with Claude.

**Last Updated:** 2025-12-14 (Sprint 1.7 completion)
