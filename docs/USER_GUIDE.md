# pkIntvMCP - User Guide (Provisional)

**Version:** 1.0 (Provisional)
**Date:** 2025-12-08
**Status:** Draft - Pre-Implementation
**Phase:** Sprint 1.1 (Foundation & Documentation)

> **Note**: This is a provisional user guide created before implementation. It describes the planned user experience and will be updated as features are implemented.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Common Workflows](#common-workflows)
5. [Example Debugging Sessions](#example-debugging-sessions)
6. [Advanced Features](#advanced-features)
7. [Tips & Tricks](#tips--tricks)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is pkIntvMCP?

pkIntvMCP is an MCP (Model Context Protocol) server that enables AI assistants like Claude to debug and analyze CP-1600/Intellivision programs. It provides a comprehensive debugging interface with:

- **Execution control**: Step through code, run to breakpoints
- **State inspection**: Examine registers, flags, memory
- **Breakpoints**: Stop execution at specific addresses or conditions
- **Execution tracing**: See instruction history leading to bugs

### What Can Claude Help With?

When you use pkIntvMCP with Claude, you can ask Claude to:

- **Debug crashes**: "Why does my ROM crash at address $5020?"
- **Analyze code**: "What does this subroutine do?"
- **Find bugs**: "Find where R4 is being used without initialization"
- **Understand behavior**: "Why isn't the zero flag being set?"
- **Optimize code**: "Which instructions are being executed most?"

### Prerequisites

**Required:**
- Node.js 18.0 or higher
- Claude Desktop or Claude API access
- A CP-1600 ROM file to debug (.bin, .rom, or .int format)

**Optional:**
- CP-1600 instruction set reference (for learning)
- jzIntv emulator (for comparison/validation)

---

## Installation

### Option 1: NPM Install (Phase 4, Not Yet Available)

```bash
# Global installation
npm install -g @pkintvmcp/mcp-cpu

# Verify installation
pkintvmcp-cpu --version
```

### Option 2: From Source (Current)

```bash
# Clone repository
git clone https://github.com/peterkaminski/pkintvmcp.git
cd pkintvmcp

# Install dependencies
npm install

# Build all packages
npm run build

# Verify build
node packages/mcp-cpu/dist/index.js --version
```

### Claude Desktop Configuration

**Edit your Claude Desktop config file:**

**macOS/Linux:**
```bash
~/.config/claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Add pkIntvMCP server:**
```json
{
  "mcpServers": {
    "pkintvmcp": {
      "command": "node",
      "args": ["/path/to/pkintvmcp/packages/mcp-cpu/dist/index.js"]
    }
  }
}
```

**Restart Claude Desktop** to load the new MCP server.

---

## Quick Start

### First Debugging Session

**1. Start a conversation with Claude:**
```
User: I want to debug a CP-1600 ROM. Can you help?

Claude: Yes! I can help you debug your CP-1600 ROM using the pkIntvMCP server.
First, I'll create a debugging session and load your ROM.

What's the path to your ROM file?
```

**2. Provide ROM path:**
```
User: /home/user/roms/test-program.bin

Claude: [Uses cp1600_create_session and cp1600_load_rom tools]

Great! I've loaded your ROM. It's 4096 words starting at address $5000.
The entry point is $5000.

What would you like me to do? I can:
- Step through the code instruction by instruction
- Run to a specific address
- Set breakpoints
- Examine memory or registers
```

**3. Start debugging:**
```
User: Step through the first 5 instructions and tell me what they do.

Claude: [Uses cp1600_step tool with count=5]

Here's what the first 5 instructions do:

$5000: MVI R1, #$42       - Load 0x0042 into R1
$5001: MVI R2, #$64       - Load 0x0064 (100) into R2
$5002: ADDR R1, R2        - Add R1 to R2, result in R2 (R2 = 166)
$5003: MVO@ R2, R4        - Store R2 to address in R4, then R4++
$5004: B $5010            - Branch to $5010

After these 5 instructions:
- R1 = 0x0042 (66)
- R2 = 0x00A6 (166)
- R4 = 0x0001 (incremented from 0)
- PC = 0x5010 (branched)
- Flags: Zero=0, Sign=0, Carry=0, Overflow=0
```

---

## Common Workflows

### Workflow 1: Loading a ROM

```
User: Load /home/user/roms/my-game.bin

Claude: [Uses cp1600_create_session and cp1600_load_rom]

ROM loaded successfully:
- File: my-game.bin
- Size: 8192 words (16 KB)
- Loaded at: $5000-$6FFF
- Entry point: $5000

Ready to debug. What would you like to do next?
```

### Workflow 2: Stepping Through Code

```
User: Step through one instruction at a time and explain what's happening.

Claude: [Uses cp1600_step repeatedly]

Step 1:
$5000: MVII #$2F0, R6     - Initialize stack pointer to $02F0

Registers after: R6 = 0x02F0

Step 2:
$5002: JSR R5, init_routine  - Call subroutine at init_routine, save return address in R5

Registers after: R5 = 0x5004 (return address), PC = 0x5100 (jumped to init_routine)

Step 3:
$5100: MVI R1, #$0         - Clear R1 (set to 0)

Registers after: R1 = 0x0000, Zero flag = 1

Would you like me to continue stepping, or run until a specific address?
```

### Workflow 3: Setting Breakpoints

```
User: Set a breakpoint at $5020 and run until we hit it.

Claude: [Uses cp1600_set_breakpoint and cp1600_run]

Breakpoint set at $5020.
Running...

Stopped at breakpoint after 147 instructions.

Current state at $5020:
- Instruction: MVI@ R4, R1    (Load from address in R4 into R1)
- Registers:
  R1 = 0x0000
  R2 = 0x00A6
  R4 = 0x0000  ← R4 is zero! This might be a problem.
  R5 = 0x5004
  R6 = 0x02F0
  R7 = 0x5020 (PC)

This instruction is trying to read from address 0x0000 (because R4 is zero).
That might be your bug - R4 should have been initialized before this point.

Would you like me to trace back to find where R4 should have been set?
```

### Workflow 4: Inspecting State

```
User: Show me the current state of all registers and flags.

Claude: [Uses cp1600_get_state]

CPU State:
===========
Registers:
  R0 = 0x0000 (0)
  R1 = 0x002A (42)
  R2 = 0x00A6 (166)
  R3 = 0x0000 (0)
  R4 = 0x0100 (256)
  R5 = 0x5004 (20484) - Return address
  R6 = 0x02F0 (752) - Stack pointer
  R7 = 0x5020 (20512) - Program counter

Flags:
  Sign (S) = 0 (positive)
  Zero (Z) = 0 (non-zero result)
  Carry (C) = 0 (no carry/borrow)
  Overflow (OV) = 0 (no signed overflow)

Execution:
  Halted = No
  Cycle count = 1247
```

### Workflow 5: Examining Memory

```
User: Show me what's in memory at $0200 (BACKTAB area).

Claude: [Uses cp1600_examine_memory]

Memory at $0200-$020F (BACKTAB - screen display data):

$0200: 0800 0801 0802 0803 0804 0805 0806 0807
$0208: 0808 0809 080A 080B 080C 080D 080E 080F

This shows the first 16 screen cards. Each word is a screen card:
- Card $0800 is character 0x00 (space) with attribute 0x08 (color)
- These define what appears on the Intellivision screen.
```

### Workflow 6: Understanding Flag Behavior

```
User: Why is the zero flag set?

Claude: [Examines recent execution history using cp1600_get_trace]

Looking at the execution history, the zero flag was set by instruction:

$501E: SUBR R1, R2        - Subtract R1 from R2, result in R2

Before: R1 = 0x00A6, R2 = 0x00A6
After: R2 = 0x0000

Since R1 and R2 were equal, subtracting them gives zero, which sets the
Zero flag. This is likely being used for a comparison:

$501F: BEQ equal_label    - Branch if equal (if Z=1)

So the code is checking if R1 == R2, and since they were equal, it will
take the branch.
```

---

## Example Debugging Sessions

### Example 1: "Why does my ROM crash at 0x5020?"

```
User: My ROM crashes at address $5020. Can you help me figure out why?

Claude: Let me debug this for you. I'll set a breakpoint at $5020 and examine
the state when we get there.

[Uses cp1600_create_session, cp1600_load_rom, cp1600_set_breakpoint, cp1600_run]

Found the problem! At $5020, the instruction is:

$5020: MVI@ R4, R1        - Load from address pointed to by R4

But R4 = 0x0000, so it's trying to read from address $0000.

Let me trace back to see where R4 should have been initialized...

[Uses cp1600_get_trace]

I can see that R4 was never set. Looking at the code before $5020:

$5010: MVI R1, #$42
$5011: MVI R2, #$64
$5012: ADDR R1, R2
...
$5020: MVI@ R4, R1        ← Crash here, R4 still = 0

You need to initialize R4 before using it as a pointer. Add something like:

$5010: MVII #$0200, R4    - Initialize R4 to point to $0200
$5012: MVI R1, #$42       - Then continue with your code
...

That will give R4 a valid address before it's used.
```

### Example 2: "How does this subroutine work?"

```
User: Can you explain what the subroutine at $5100 does?

Claude: I'll step through the subroutine and explain each instruction.

[Uses cp1600_disassemble and cp1600_step with trace enabled]

Here's what the subroutine at $5100 does:

Subroutine: multiply_by_2 (at $5100)
Purpose: Multiply R1 by 2

$5100: SLL R1             - Shift R1 left by 1 bit (multiply by 2)
$5101: JR R5              - Return to caller (jump to address in R5)

This is a simple subroutine that doubles the value in R1 using a left shift.

Example: If R1 = 5 before calling, R1 = 10 after.

This is called from:
$5050: JSR R5, $5100      - Call multiply_by_2, save return address in R5

After the subroutine returns, execution continues at $5052.
```

### Example 3: "Find where this variable is stored"

```
User: The score is stored somewhere in memory. Can you help me find where?

Claude: I can help find that. Let me run the code and watch for memory writes
to common RAM areas.

[Uses cp1600_run with memory tracing enabled]

I found several memory writes. Let me check the BACKTAB area ($0200-$02EF)
where game data is typically stored:

$5030: MVO R2, $0280      - Store R2 (value = 0x0042) to $0280

This looks like it could be your score! Let me verify by running a bit more
and seeing if this address gets updated when scoring:

[Continues execution, monitors $0280]

Yes! Address $0280 is being updated by the scoring routine at $5100.
Each time a point is scored, the value at $0280 increases by 1.

Your score is stored at memory address $0280.
```

### Example 4: "Why isn't my sprite moving?"

**Note**: This example requires Phase 3 (STIC emulation), not available in Phase 1.

```
User: My sprite isn't moving. Can you help debug this?

Claude: (Phase 3 feature) I can check the MOB (sprite) data in memory.

[Examines MOB data at $031D-$035C]

Looking at MOB 0 data at $031D:
- Status: Active
- Position: X=80, Y=60
- ROM pointer: $6000
- Velocity: X=0, Y=0  ← This is the problem!

Your sprite's velocity is set to zero, so it's not moving. The code needs
to set non-zero velocity values:

$5200: MVII #$0001, R1    - Set X velocity to 1
$5202: MVO R1, $031E      - Store to MOB 0 X velocity field

That will make the sprite move to the right at 1 pixel per frame.
```

---

## Advanced Features

### Conditional Breakpoints (Phase 2)

```
User: Break when R4 equals zero and we're about to use it as a pointer.

Claude: [Uses cp1600_set_breakpoint with condition]

Setting conditional breakpoint:
Condition: R4 == 0 AND instruction uses @R4 addressing

[Runs until condition met]

Stopped at $5025:
$5025: MVI@ R4, R1        - About to use R4 as pointer
R4 = 0x0000              - But R4 is zero!

This is the problem. R4 needs to be initialized before this point.
```

### Trace Analysis

```
User: Show me the last 20 instructions that were executed.

Claude: [Uses cp1600_get_trace with count=20]

Execution trace (most recent 20 instructions):

#128: $5000: MVI R1, #$42      | R1: 0000→002A | Z=0
#129: $5001: MVI R2, #$64      | R2: 0000→0064 | Z=0
#130: $5002: ADDR R1, R2       | R2: 0064→008E | Z=0 C=0
#131: $5003: MVO@ R2, R4       | [@0100]=008E R4:0100→0101
#132: $5004: INCR R1           | R1: 002A→002B | Z=0
... (15 more instructions)

This shows the instruction history leading up to the current state.
Each line shows address, instruction, register changes, and flag changes.
```

### Performance Profiling (Phase 2)

```
User: Which part of my code is taking the most time?

Claude: [Runs with cycle profiling enabled]

Cycle profiling results (top 5 hot spots):

1. $5100-$5120: multiply_routine
   - Cycles: 12,450 (45% of total)
   - Called: 250 times
   - Avg per call: 49.8 cycles

2. $5200-$5210: update_display
   - Cycles: 6,720 (24% of total)
   - Called: 60 times
   - Avg per call: 112 cycles

3. $5300-$5305: add_score
   - Cycles: 3,200 (11% of total)
   - Called: 100 times
   - Avg per call: 32 cycles

Your multiply_routine is the hotspot. Consider optimizing it with a
lookup table instead of repeated addition.
```

---

## Tips & Tricks

### Best Questions to Ask Claude

**Good questions:**
- "Why does the program crash at this address?"
- "What does this code section do?"
- "Find where register R4 is first used without being set"
- "Show me the execution leading up to this flag being set"
- "Explain the flag behavior in this instruction"

**Less helpful questions:**
- "Make my code better" (too vague)
- "Write a new feature" (not a debugging task)

### How to Provide Context

**Include:**
- ROM file path
- Address where problem occurs
- What you expected vs what happened
- Any relevant register or memory addresses

**Example:**
```
My ROM at /home/user/game.bin crashes at $5020. I expect R4 to contain
$0200 (pointer to BACKTAB), but it's zero. The crash happens after
calling the init_routine at $5100.
```

### Iterative Debugging

**Pattern:**
1. Start broad: "Load ROM and run to crash point"
2. Narrow down: "Show me registers at crash"
3. Investigate: "Trace back to where R4 should be set"
4. Verify: "Run with R4 initialized correctly"

### Understanding Execution Flow

**Use disassembly to see code structure:**
```
User: Show me the code at $5000

Claude: [Uses cp1600_disassemble]

$5000: MVII #$2F0, R6     - Initialize stack
$5002: JSR R5, init       - Call init routine
$5004: JSR R5, main_loop  - Call main loop
$5006: B $5006            - Infinite loop (halt)

This is a typical program structure: setup stack, initialize, run main
loop, then infinite loop to prevent falling through.
```

---

## Troubleshooting

### Server Won't Start

**Problem**: MCP server doesn't appear in Claude

**Solutions:**
1. Check Claude Desktop config file syntax (valid JSON)
2. Verify server path is correct
3. Restart Claude Desktop
4. Check server runs manually: `node dist/index.js --version`

### ROM Won't Load

**Problem**: "ROM file not found" error

**Solutions:**
1. Use absolute path: `/home/user/roms/game.bin`
2. Check file exists: `ls -l /path/to/rom`
3. Verify file format (.bin, .rom, or .int)
4. Check file permissions (readable)

### Unexpected Behavior

**Problem**: ROM executes differently than expected

**Solutions:**
1. Compare with jzIntv emulator (if available)
2. Check instruction is implemented correctly
3. Verify ROM loaded at correct address
4. Examine flags carefully (especially Carry vs Overflow)

### Performance Issues

**Problem**: Stepping is slow

**Solutions:**
1. Use `run_until` instead of stepping 1000 times
2. Set breakpoints at key locations
3. Reduce trace buffer size if memory is an issue

### Understanding Errors

**Common error messages:**

| Error | Meaning | Solution |
|-------|---------|----------|
| "Session not found" | Session ID invalid | Create new session with cp1600_create_session |
| "No ROM loaded" | Must load ROM first | Use cp1600_load_rom before executing |
| "Invalid address" | Address out of range | Use address between 0x0000-0xFFFF |
| "ROM too large" | ROM exceeds memory | Use smaller ROM or check file |

---

## Appendix: Quick Reference

### Common Tool Usage

| Task | Tool | Example |
|------|------|---------|
| Create session | `cp1600_create_session` | "Create a new debugging session" |
| Load ROM | `cp1600_load_rom` | "Load /path/to/rom.bin" |
| Step 1 instruction | `cp1600_step` | "Step one instruction" |
| Step N instructions | `cp1600_step` | "Step 10 instructions" |
| Run to address | `cp1600_run_until` | "Run until $5020" |
| Set breakpoint | `cp1600_set_breakpoint` | "Set breakpoint at $5020" |
| Show registers | `cp1600_get_registers` | "Show all registers" |
| Show flags | `cp1600_get_flags` | "What are the current flags?" |
| Disassemble | `cp1600_disassemble` | "Show code at $5000" |
| Examine memory | `cp1600_examine_memory` | "Show memory at $0200" |
| Get trace | `cp1600_get_trace` | "Show last 20 instructions" |

### Addressing Modes Quick Reference

| Mode | Example | Description |
|------|---------|-------------|
| Register | `R1` | Register value |
| Immediate | `#$42` | Literal value (10-bit or 16-bit with SDBD) |
| Direct | `$5000` | Memory at address |
| Indirect | `@R4` | Memory at address in R4 |
| Auto-increment | `@R4++` | Memory at R4, then R4++ |

### Flag Meanings

| Flag | Set When | Used For |
|------|----------|----------|
| Sign (S) | Bit 15 = 1 | Negative numbers (two's complement) |
| Zero (Z) | Result = 0 | Equality tests (BEQ/BNEQ) |
| Carry (C) | Unsigned overflow | Unsigned arithmetic, shifts |
| Overflow (OV) | Signed overflow | Signed arithmetic |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-08 | Peter/Claude | Initial provisional user guide |

---

**Note**: This guide will be updated as features are implemented and user feedback is incorporated.

**Sprint 1.1 Complete** - All 6 documentation deliverables finished:
1. ✅ PRD.md
2. ✅ ARCHITECTURE.md
3. ✅ CPU_SPECIFICATION.md
4. ✅ MCP_API.md
5. ✅ PROJECT_SETUP.md
6. ✅ USER_GUIDE.md (this document)

**Next Sprint**: Begin implementation (Sprint 1.2 - Instruction Decoder)
