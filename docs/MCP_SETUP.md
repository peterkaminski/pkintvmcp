# MCP Server Setup Guide - pkIntvMCP

This guide explains how to set up and use the pkIntvMCP MCP server with Claude Desktop for debugging CP-1600/Intellivision programs.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Verification](#verification)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)
7. [Available Tools](#available-tools)

---

## Prerequisites

**Required:**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Claude Desktop app

**To build ROMs (optional):**
- macOS or Linux (for building as1600 toolchain)
- Make and C compiler

---

## Installation

### 1. Clone and Build

```bash
# Clone the repository
git clone https://github.com/peterkaminski/pkintvmcp.git
cd pkintvmcp

# Install dependencies
npm install

# Build the project
npm run build

# Verify the MCP server builds correctly
ls packages/mcp-cpu/dist/index.js
```

### 2. Build Toolchain (Optional)

If you want to assemble .asm files to .bin files:

```bash
# Bootstrap the SDK-1600 toolchain (as1600, bin2rom)
npm run toolchain:bootstrap

# Verify tools are available
./tools/as1600 --help
```

---

## Configuration

### Method 1: Using claude_desktop_config.json (Recommended)

1. **Locate your Claude Desktop config file:**

   **macOS:**
   ```bash
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

   **Linux:**
   ```bash
   ~/.config/Claude/claude_desktop_config.json
   ```

   **Windows:**
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Add the pkIntvMCP server configuration:**

   Edit the file and add (replace `/path/to/pkintvmcp` with your actual path):

   ```json
   {
     "mcpServers": {
       "pkintvmcp": {
         "command": "node",
         "args": [
           "/path/to/pkintvmcp/packages/mcp-cpu/dist/index.js"
         ],
         "env": {}
       }
     }
   }
   ```

   **Example with actual path:**
   ```json
   {
     "mcpServers": {
       "pkintvmcp": {
         "command": "node",
         "args": [
           "/Users/peterkaminski/src/peterkaminski/pkintvmcp/packages/mcp-cpu/dist/index.js"
         ],
         "env": {}
       }
     }
   }
   ```

3. **Restart Claude Desktop**

   Completely quit and restart Claude Desktop for changes to take effect.

### Method 2: Using npm run (Alternative)

You can also configure Claude Desktop to use the npm script:

```json
{
  "mcpServers": {
    "pkintvmcp": {
      "command": "npm",
      "args": [
        "run",
        "mcp:start",
        "--prefix",
        "/path/to/pkintvmcp"
      ],
      "env": {}
    }
  }
}
```

---

## Verification

### Check if MCP Server is Connected

1. Open Claude Desktop
2. Start a new conversation
3. Look for the tools icon (🔧) - you should see pkIntvMCP tools available

### Test the Connection

Ask Claude:
```
Can you list the available pkIntvMCP tools?
```

Claude should be able to see and list all 11 CP-1600 debugging tools.

### Run a Quick Test

Ask Claude:
```
Create a CP-1600 debugging session and load the hello-world example ROM
```

Claude should be able to:
1. Create a session using `cp1600_create_session`
2. Load a ROM using `cp1600_load_rom`
3. Execute and inspect the program

---

## Usage Examples

### Example 1: Basic Debugging Session

**You:** "Create a new CP-1600 debugging session"

Claude will use: `cp1600_create_session`

**You:** "Load the hello-world ROM from /path/to/pkintvmcp/examples/01-hello-world/hello.bin"

Claude will use: `cp1600_load_rom`

**You:** "Step through 3 instructions and show me the state"

Claude will use: `cp1600_step` and `cp1600_get_state`

### Example 2: Running a Complete Program

**You:** "Create a session, load hello-world, run it to completion, and show me the final register values"

Claude will:
1. Create session
2. Load ROM
3. Run until halt
4. Get final state

### Example 3: Memory Inspection

**You:** "Show me what's in memory at address $5000 to $5010"

Claude will use: `cp1600_examine_memory`

### Example 4: Disassembly

**You:** "Disassemble 10 instructions starting at $5000"

Claude will use: `cp1600_disassemble`

---

## Troubleshooting

### Server Not Appearing in Claude Desktop

**Problem:** pkIntvMCP doesn't show up in tools

**Solutions:**
1. Verify the path in `claude_desktop_config.json` is correct
2. Ensure you've built the project: `npm run build`
3. Check that `packages/mcp-cpu/dist/index.js` exists
4. Restart Claude Desktop completely (Quit, not just close window)
5. Check Claude Desktop logs (Help > View Logs)

### "Module not found" Errors

**Problem:** Node.js can't find required modules

**Solutions:**
1. Run `npm install` in the project root
2. Ensure Node.js version is >= 18.0.0: `node --version`
3. Rebuild the project: `npm run build`

### Tools Execute but Fail

**Problem:** Tools are visible but return errors

**Solutions:**
1. Check the error message - it usually explains what's wrong
2. Ensure you've created a session before using other tools
3. Ensure you've loaded a ROM before trying to execute
4. Verify ROM file path is correct and absolute

### Toolchain Issues (as1600, bin2rom)

**Problem:** Can't assemble .asm files

**Solutions:**
1. Run bootstrap: `npm run toolchain:bootstrap`
2. Check that jzintv source exists in `resources/jzintv-20200712-src`
3. Ensure you have build tools installed (make, gcc)
4. Try building manually:
   ```bash
   cd resources/jzintv-20200712-src/as1600
   make
   ```

---

## Available Tools

The pkIntvMCP server provides 11 tools for CP-1600 debugging:

### Session Management
- **cp1600_create_session** - Create a new debugging session
- **cp1600_list_sessions** - List all active sessions
- **cp1600_destroy_session** - Destroy a session

### ROM Loading & Execution
- **cp1600_load_rom** - Load a ROM binary into memory
- **cp1600_step** - Execute N instructions (default: 1)
- **cp1600_run** - Run until halt or max instructions
- **cp1600_reset** - Reset CPU to initial state

### State Inspection
- **cp1600_get_state** - Get complete CPU state
- **cp1600_get_registers** - Get register values
- **cp1600_get_flags** - Get flag values
- **cp1600_examine_memory** - Read memory ranges
- **cp1600_disassemble** - Disassemble instructions

For complete tool specifications, see [MCP_API.md](MCP_API.md).

---

## Example Workflows

### Workflow 1: Debug a Simple Program

```
1. Ask: "Create a session and load hello-world.bin"
2. Ask: "Show me the registers"
3. Ask: "Step one instruction"
4. Ask: "What changed?"
5. Ask: "Run to completion and show final state"
```

### Workflow 2: Investigate Specific Code

```
1. Ask: "Create a session and load my-program.bin"
2. Ask: "Disassemble 20 instructions starting at $5000"
3. Ask: "Set PC to $5000 and step through the first loop"
4. Ask: "Show me memory at $200 to $210"
```

### Workflow 3: Compare Multiple Runs

```
1. Ask: "Create two sessions"
2. Ask: "Load program.bin in both sessions"
3. Ask: "In session 1, step 10 times"
4. Ask: "In session 2, run to completion"
5. Ask: "Compare the final states"
```

---

## Next Steps

- **Try the examples:** Explore the programs in `examples/` directory
- **Read the docs:** See `docs/USER_GUIDE.md` for more workflows
- **Build ROMs:** Use `npm run as1600 -- myfile.asm` to assemble programs
- **Run standalone:** Use `npm run cli:hello` to test without MCP

---

## Getting Help

- **Issues:** https://github.com/peterkaminski/pkintvmcp/issues
- **Docs:** See `docs/` directory in the repository
- **Examples:** See `examples/` directory for sample programs

---

**Last Updated:** 2025-12-14 (Sprint 1.7 completion)
