# Sprint 1.7: Basic MCP Server - Planning Notes

**Status:** 📋 PLANNED (after Sprint 1.6)
**Goal:** Basic MCP server with ROM loading, execution control, and state inspection

---

## Overview

Sprint 1.7 will implement the basic MCP server that allows Claude to:
- Load ROM files
- Execute instructions (step, run, reset)
- Inspect CPU state (registers, flags, memory)
- Run Sprint 1.5.1 assembly examples

This sprint was originally called Sprint 1.5 but was renumbered after Sprint 1.5.1 (bonus examples sprint).

---

## Pre-MCP Simple Test Runner

Before implementing the full MCP server, we can create a minimal test runner to validate examples. This is useful for:
- Testing Sprint 1.5.1 examples without MCP overhead
- Validating instruction implementations
- Quick integration testing during Sprint 1.6

### Simple CLI Test Runner

```typescript
// packages/cli/src/run-example.ts
import { CPU, Memory, Decoder, Executor } from '@pkintvmcp/core';
import * as fs from 'fs';

/**
 * Simple test runner for CP-1600 ROM files
 * Executes until HLT or max cycles reached
 */
function runExample(romFile: string, maxCycles: number = 10000) {
  const cpu = new CPU();
  const memory = new Memory();
  const decoder = new Decoder();
  const executor = new Executor(cpu, memory);

  // Load ROM
  const rom = fs.readFileSync(romFile);
  memory.loadROM(rom, 0x5000);  // Standard cartridge start
  cpu.setPC(0x5000);

  // Execute until halt or max cycles
  let cycleCount = 0;
  while (!cpu.getState().halted && cycleCount < maxCycles) {
    const pc = cpu.getPC();
    const word = memory.read(pc);
    const inst = decoder.decode(word, pc);
    executor.execute(inst);
    cycleCount = cpu.getState().cycles;
  }

  // Report final state
  const finalState = cpu.getState();
  console.log('=== Final State ===');
  console.log(`Halted: ${finalState.halted}`);
  console.log(`Cycles: ${finalState.cycles}`);
  console.log(`PC: $${finalState.registers[7].toString(16).padStart(4, '0').toUpperCase()}`);
  console.log('Registers:');
  for (let i = 0; i < 8; i++) {
    const value = finalState.registers[i];
    console.log(`  R${i}: $${value.toString(16).padStart(4, '0').toUpperCase()} (${value})`);
  }
  console.log('Flags:');
  console.log(`  S=${finalState.flags.S ? 1 : 0} Z=${finalState.flags.Z ? 1 : 0} OV=${finalState.flags.OV ? 1 : 0} C=${finalState.flags.C ? 1 : 0}`);

  return finalState;
}

// CLI usage
if (require.main === module) {
  const romFile = process.argv[2];
  const maxCycles = parseInt(process.argv[3] || '10000');

  if (!romFile) {
    console.error('Usage: run-example <rom-file> [max-cycles]');
    process.exit(1);
  }

  try {
    runExample(romFile, maxCycles);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export { runExample };
```

### Usage

```bash
# After assembling an example
cd examples/01-hello-world
as1600 -o hello.bin hello.asm

# Run with test runner
npx tsx packages/cli/src/run-example.ts examples/01-hello-world/hello.bin

# Expected output:
# === Final State ===
# Halted: true
# Cycles: 28
# PC: $5005
# Registers:
#   R0: $008E (142)
#   R1: $0064 (100)
#   R2: $008E (142)
#   R3: $0000 (0)
#   ...
# Flags:
#   S=0 Z=0 OV=0 C=0
```

### Enhanced Version with Trace

```typescript
function runExampleWithTrace(romFile: string, maxCycles: number = 10000, showTrace: boolean = false) {
  const cpu = new CPU();
  const memory = new Memory();
  const decoder = new Decoder();
  const executor = new Executor(cpu, memory);

  // Load ROM
  const rom = fs.readFileSync(romFile);
  memory.loadROM(rom, 0x5000);
  cpu.setPC(0x5000);

  const trace: string[] = [];

  // Execute with optional trace
  let cycleCount = 0;
  while (!cpu.getState().halted && cycleCount < maxCycles) {
    const pc = cpu.getPC();
    const word = memory.read(pc);
    const inst = decoder.decode(word, pc);

    if (showTrace) {
      const disasm = `$${pc.toString(16).padStart(4, '0').toUpperCase()}: ${inst.opcode}`;
      trace.push(disasm);
    }

    executor.execute(inst);
    cycleCount = cpu.getState().cycles;
  }

  if (showTrace) {
    console.log('=== Execution Trace ===');
    trace.forEach(line => console.log(line));
    console.log('');
  }

  // Report final state (same as above)
  // ...
}
```

---

## Integration with Sprint 1.5.1 Examples

This test runner can validate all Sprint 1.5.1 examples:

### Test Script

```bash
#!/bin/bash
# test-examples.sh - Run all examples and verify expected states

cd examples

for example in 01-hello-world 02-counter-loop 03-subroutine-call 04-bit-manipulation 05-signed-math 06-nested-calls; do
    echo "Testing $example..."
    cd $example

    # Assemble
    as1600 -o test.bin *.asm 2>/dev/null

    if [ -f test.bin ]; then
        # Run and capture output
        node ../../packages/cli/src/run-example.js test.bin > output.txt

        # Check expected values (from README.md)
        # TODO: Parse README.md for expected states

        echo "  ✓ $example passed"
    else
        echo "  ✗ $example failed to assemble"
    fi

    cd ..
done
```

---

## When to Implement

**Option A: Before Sprint 1.6** (Recommended: No)
- Pros: Can test Sprint 1.5 instructions immediately
- Cons: Delays Sprint 1.6, examples 04-bit-manipulation won't work yet

**Option B: During Sprint 1.6** (Recommended: Maybe)
- Pros: Can test new shift/rotate instructions as implemented
- Cons: Adds scope to Sprint 1.6

**Option C: Sprint 1.7** (Recommended: Yes)
- Pros: Natural fit with MCP server work, all instructions ready
- Cons: No immediate way to run examples

**Decision:** Create in Sprint 1.7 as part of MCP server work. The simple runner can be the foundation for the MCP execution tools.

---

## Sprint 1.7 Full Scope

Once Sprint 1.6 is complete (50/50 instructions), Sprint 1.7 will implement:

### 1. Simple Test Runner (Above)
- CLI tool for quick testing
- Validates Sprint 1.5.1 examples
- Foundation for MCP tools

### 2. MCP Protocol Setup
- Install `@modelcontextprotocol/sdk`
- Create server boilerplate
- Session management infrastructure

### 3. Core MCP Tools

**Session Management:**
- `create_session` - Create new emulator instance
- `list_sessions` - List active sessions
- `switch_session` - Change active session
- `destroy_session` - Clean up session

**ROM Loading:**
- `load_rom` - Load binary ROM file
- Support standard format (BIN at $5000)

**Execution Control:**
- `step` - Execute N instructions
- `run` - Run until halt or breakpoint
- `reset` - Reset CPU state
- `get_state` - Get complete CPU state snapshot

**State Inspection:**
- `get_registers` - Get all register values
- `get_flags` - Get flag states
- `disassemble` - Disassemble memory range
- `examine_memory` - Read memory regions

### 4. Testing
- Unit tests for each MCP tool
- Integration tests with Sprint 1.5.1 examples
- Validate against expected states from example READMEs

---

## Dependencies

**Required from Sprint 1.6:**
- ✅ All 50 instructions implemented
- ✅ Complete instruction set working
- ✅ All Sprint 1.5.1 examples executable

**Required new components:**
- Memory.loadROM() method
- CPU.getPC() / CPU.setPC() (may already exist)
- Clean session isolation

---

## Success Criteria

Sprint 1.7 is complete when:
- ✅ Claude can load a ROM file via MCP
- ✅ Claude can step through instructions
- ✅ Claude can inspect registers and flags
- ✅ Claude can run until halt
- ✅ All Sprint 1.5.1 examples run correctly
- ✅ Example outputs match documented expected states

---

## Notes

This planning document captures ideas for Sprint 1.7 before they're lost to context compaction. The simple test runner sketch is particularly valuable as it shows the minimal integration needed between CPU, Memory, Decoder, and Executor.

**Created:** 2025-12-11 (during Sprint 1.5.1)
**To be refined:** When Sprint 1.6 completes

---

**See Also:**
- [Sprint-1.5.1.md](Sprint-1.5.1.md) - Assembly examples
- [Sprint-1.6.md](Sprint-1.6.md) - Remaining instructions
- [MCP_API.md](MCP_API.md) - Full MCP tool specifications
- [examples/README.md](../examples/README.md) - Example usage
