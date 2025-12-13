# Sprint 1.7: Basic MCP Server

**Status:** 📋 PLANNED
**Started:** TBD
**Completed:** TBD
**Branch:** `pkcc-sprint1-7-YYYY-MM-DD`

---

## Sprint Goal

Create a basic MCP (Model Context Protocol) server that enables Claude to load CP-1600 ROM files, execute instructions, and inspect CPU state. This sprint transforms the standalone emulator core into an AI-accessible debugging tool.

---

## Context

### Completed Sprints

**Sprint 1.1** ✅ (2025-12-08)
- Complete documentation suite
- Monorepo infrastructure with Turborepo + TypeScript

**Sprint 1.2** ✅ (2025-12-09)
- Instruction decoder (116 opcodes, all addressing modes)
- Comprehensive decoder tests

**Sprint 1.3** ✅ (2025-12-09)
- CPU core (8 registers, 4 flags, cycle tracking)
- Executor foundation with dispatch system
- Data movement instructions: MOVR, MVI, MVO

**Sprint 1.4** ✅ (2025-12-09)
- Arithmetic instructions: ADDR, SUBR, INCR, DECR
- Logical instructions: ANDR, XORR, CLRR
- Status instructions: TSTR, HLT
- 226 tests passing, 94.19% coverage

**Sprint 1.5** ✅ (2025-12-11)
- Control flow: B, J, JR, BEQ, BNEQ, BC, BNC, BOV, BNOV, BMI, BPL
- Signed comparison: BLT, BGE, BLE, BGT
- Subroutines: JSR, JSRE, JSRD
- Stack: PSHR, PULR
- Control: NOPP, EIS, DIS
- 288 tests passing, 92.86% coverage

**Sprint 1.5.1 (Bonus)** ✅ (2025-12-11)
- 6 complete CP-1600 assembly examples (~2,500 lines documentation)
- Examples: hello-world, counter-loop, subroutine-call, bit-manipulation, signed-math, nested-calls
- Comprehensive READMEs with execution traces and expected states
- Ready as test cases for MCP server validation

**Sprint 1.6** ✅ (2025-12-12)
- Shift instructions: SLL, SLLC, SLR, SAR, SARC
- Rotate instructions: RLC, RRC
- Bit manipulation: SWAP, NEGR
- Immediate/memory operations: ADD, SUB, CMP, AND, XOR
- 332 tests passing, 92.97% coverage
- Testing guide documentation created

**Sprint 1.6.1** ✅ (2025-12-12)
- Auto-increment instructions: MVI@, MVO@
- 342 tests passing, 92.88% coverage
- SLL walkthrough documentation
- **All 51/51 Phase 1 instructions implemented** (102% of original 50-instruction target)

### Current Status (Start of Sprint 1.7)

- **CPU Core:** ✅ Complete
- **Decoder:** ✅ Complete (116 opcodes)
- **Executor:** ✅ Complete (51/51 instructions, 102% of Phase 1 target)
- **Test Coverage:** 92.88% line coverage
- **Total Tests:** 342 passing
- **Phase 1 Instruction Set:** ✅ COMPLETE

---

## Sprint Objectives

### Primary Deliverables

1. **Simple CLI Test Runner** (foundation for MCP tools)
   - Load ROM files from disk
   - Execute until HLT or max cycles
   - Display final CPU state
   - Foundation for MCP execution tools

2. **MCP Protocol Setup**
   - Install and configure `@modelcontextprotocol/sdk`
   - Create server boilerplate
   - Session management infrastructure

3. **Core MCP Tools - Session Management**
   - `cp1600_create_session` - Create new emulator instance
   - `cp1600_list_sessions` - List active sessions
   - `cp1600_switch_session` - Change active session (optional, if multi-session)
   - `cp1600_destroy_session` - Clean up session

4. **Core MCP Tools - ROM Loading**
   - `cp1600_load_rom` - Load binary ROM file
   - Support standard cartridge format (BIN files at $5000)

5. **Core MCP Tools - Execution Control**
   - `cp1600_step` - Execute N instructions
   - `cp1600_run` - Run until halt
   - `cp1600_reset` - Reset CPU to initial state
   - `cp1600_get_state` - Get complete CPU state snapshot

6. **Core MCP Tools - State Inspection**
   - `cp1600_get_registers` - Get all register values
   - `cp1600_get_flags` - Get flag states
   - `cp1600_disassemble` - Disassemble memory range
   - `cp1600_examine_memory` - Read memory regions

7. **Testing & Validation**
   - Unit tests for each MCP tool
   - Integration tests with Sprint 1.5.1 examples
   - Validate against expected states from example READMEs

---

## Architecture

### Package Structure

```
packages/
├── core/              # Emulator core (CPU, Memory, Decoder, Executor) ✅
├── mcp-cpu/           # MCP server (this sprint)
│   ├── src/
│   │   ├── server.ts      # MCP server entry point
│   │   ├── session.ts     # Session management
│   │   ├── tools/         # MCP tool implementations
│   │   │   ├── session.ts   # create_session, list_sessions, etc.
│   │   │   ├── execution.ts # step, run, reset
│   │   │   └── inspection.ts # get_state, get_registers, etc.
│   │   └── types.ts       # MCP-specific types
│   ├── package.json
│   └── tsconfig.json
└── cli/               # Optional CLI tools (test runner)
    ├── src/
    │   └── run-example.ts  # Simple test runner
    └── package.json
```

### Session Model

**Single Session (Phase 1):**
- One active emulator instance per MCP connection
- Simplifies implementation
- Sufficient for debugging single ROM

**Future: Multi-Session (Phase 2+):**
- Multiple simultaneous emulator instances
- Compare execution of different ROMs
- Differential debugging

### ROM Loading

**Standard Format:**
- Binary files (no headers)
- Load address: `$5000` (standard cartridge start)
- PC initialized to `$5000`
- ROM size: Typically 4K-8K (0x1000-0x2000 words)

**Memory Map:**
```
$0000-$003F: Reserved (STIC registers, Phase 3)
$0100-$01EF: 8-bit RAM (240 bytes)
$0200-$035F: 16-bit RAM (352 words)
$1000-$1FFF: Exec ROM (4K, system BIOS)
$5000-$6FFF: Cartridge ROM (loaded here)
```

---

## Tool Specifications

### Session Management Tools

#### cp1600_create_session

**Purpose:** Create a new emulator instance

**Parameters:**
- `session_id` (string, optional): Custom session ID, auto-generated if not provided

**Returns:**
- `session_id` (string): The created session ID
- `status` (string): "created"

**Example:**
```json
{
  "name": "cp1600_create_session",
  "arguments": {}
}

Response:
{
  "session_id": "session_1234567890",
  "status": "created"
}
```

---

#### cp1600_list_sessions

**Purpose:** List all active sessions

**Parameters:** None

**Returns:**
- `sessions` (array): List of session objects
  - `session_id` (string)
  - `created_at` (timestamp)
  - `rom_loaded` (boolean)
  - `state` (string): "idle", "running", "halted"

**Example:**
```json
{
  "name": "cp1600_list_sessions",
  "arguments": {}
}

Response:
{
  "sessions": [
    {
      "session_id": "session_1234567890",
      "created_at": "2025-12-12T12:00:00Z",
      "rom_loaded": true,
      "state": "halted"
    }
  ]
}
```

---

#### cp1600_destroy_session

**Purpose:** Clean up and destroy a session

**Parameters:**
- `session_id` (string): Session to destroy

**Returns:**
- `status` (string): "destroyed"

---

### ROM Loading Tools

#### cp1600_load_rom

**Purpose:** Load a binary ROM file into memory

**Parameters:**
- `session_id` (string): Target session
- `rom_path` (string): Path to ROM file (relative to examples/ or absolute)
- `load_address` (number, optional): Load address (default: 0x5000)

**Returns:**
- `status` (string): "loaded"
- `rom_size` (number): Size in bytes
- `load_address` (number): Address where ROM was loaded
- `entry_point` (number): PC initialized to this address

**Example:**
```json
{
  "name": "cp1600_load_rom",
  "arguments": {
    "session_id": "session_1234567890",
    "rom_path": "examples/01-hello-world/hello.bin"
  }
}

Response:
{
  "status": "loaded",
  "rom_size": 32,
  "load_address": 20480,
  "entry_point": 20480
}
```

---

### Execution Control Tools

#### cp1600_step

**Purpose:** Execute N instructions

**Parameters:**
- `session_id` (string): Target session
- `count` (number, optional): Number of instructions to execute (default: 1)

**Returns:**
- `executed` (number): Number of instructions actually executed (may be less if halted)
- `halted` (boolean): Whether CPU is now halted
- `pc` (number): Current program counter
- `cycles` (number): Total cycle count

**Example:**
```json
{
  "name": "cp1600_step",
  "arguments": {
    "session_id": "session_1234567890",
    "count": 5
  }
}

Response:
{
  "executed": 5,
  "halted": false,
  "pc": 20485,
  "cycles": 36
}
```

---

#### cp1600_run

**Purpose:** Run until halt or max cycles

**Parameters:**
- `session_id` (string): Target session
- `max_cycles` (number, optional): Maximum cycles to execute (default: 10000)

**Returns:**
- `halted` (boolean): Whether execution stopped due to HLT
- `reason` (string): "halted", "max_cycles_reached"
- `cycles` (number): Total cycle count
- `pc` (number): Current program counter

**Example:**
```json
{
  "name": "cp1600_run",
  "arguments": {
    "session_id": "session_1234567890",
    "max_cycles": 10000
  }
}

Response:
{
  "halted": true,
  "reason": "halted",
  "cycles": 142,
  "pc": 20485
}
```

---

#### cp1600_reset

**Purpose:** Reset CPU to initial state

**Parameters:**
- `session_id` (string): Target session
- `preserve_rom` (boolean, optional): Keep ROM loaded (default: true)

**Returns:**
- `status` (string): "reset"
- `pc` (number): Program counter after reset

**Example:**
```json
{
  "name": "cp1600_reset",
  "arguments": {
    "session_id": "session_1234567890"
  }
}

Response:
{
  "status": "reset",
  "pc": 20480
}
```

---

### State Inspection Tools

#### cp1600_get_state

**Purpose:** Get complete CPU state snapshot

**Parameters:**
- `session_id` (string): Target session

**Returns:**
- `registers` (object): All 8 register values (R0-R7)
- `flags` (object): All 4 flags (C, OV, Z, S)
- `halted` (boolean): Halt state
- `cycles` (number): Total cycle count
- `pc` (number): Current program counter (R7)

**Example:**
```json
{
  "name": "cp1600_get_state",
  "arguments": {
    "session_id": "session_1234567890"
  }
}

Response:
{
  "registers": {
    "R0": 142,
    "R1": 100,
    "R2": 142,
    "R3": 0,
    "R4": 256,
    "R5": 0,
    "R6": 0,
    "R7": 20485
  },
  "flags": {
    "C": false,
    "OV": false,
    "Z": false,
    "S": false
  },
  "halted": true,
  "cycles": 142,
  "pc": 20485
}
```

---

#### cp1600_get_registers

**Purpose:** Get all register values

**Parameters:**
- `session_id` (string): Target session

**Returns:**
- `registers` (object): R0-R7 values

---

#### cp1600_get_flags

**Purpose:** Get flag states

**Parameters:**
- `session_id` (string): Target session

**Returns:**
- `flags` (object): C, OV, Z, S values

---

#### cp1600_disassemble

**Purpose:** Disassemble memory range to assembly mnemonics

**Parameters:**
- `session_id` (string): Target session
- `start_address` (number): Start address
- `end_address` (number, optional): End address (default: start + 16)

**Returns:**
- `disassembly` (array): Array of disassembled instructions
  - `address` (number): Instruction address
  - `opcode` (string): Mnemonic (e.g., "MVI", "ADDR")
  - `operands` (string): Human-readable operands
  - `raw` (number): Raw instruction word

**Example:**
```json
{
  "name": "cp1600_disassemble",
  "arguments": {
    "session_id": "session_1234567890",
    "start_address": 20480,
    "end_address": 20490
  }
}

Response:
{
  "disassembly": [
    {
      "address": 20480,
      "opcode": "MVI",
      "operands": "R1, #$0042",
      "raw": 564
    },
    {
      "address": 20481,
      "opcode": "MVI",
      "operands": "R2, #$0064",
      "raw": 612
    }
  ]
}
```

---

#### cp1600_examine_memory

**Purpose:** Read memory regions

**Parameters:**
- `session_id` (string): Target session
- `start_address` (number): Start address
- `count` (number, optional): Number of words to read (default: 16)

**Returns:**
- `memory` (array): Array of memory values
  - `address` (number)
  - `value` (number)

**Example:**
```json
{
  "name": "cp1600_examine_memory",
  "arguments": {
    "session_id": "session_1234567890",
    "start_address": 512,
    "count": 4
  }
}

Response:
{
  "memory": [
    { "address": 512, "value": 142 },
    { "address": 513, "value": 0 },
    { "address": 514, "value": 0 },
    { "address": 515, "value": 0 }
  ]
}
```

---

## Implementation Plan

### Phase 1: Simple CLI Test Runner (Foundation)

**Goal:** Create standalone test runner to validate examples before MCP complexity

**Files:**
- `packages/cli/src/run-example.ts`
- `packages/cli/package.json`

**Tasks:**
1. Create CLI package structure
2. Implement ROM loading (binary file → Memory)
3. Implement execution loop (decode → execute until HLT)
4. Implement state reporting (registers, flags, cycles)
5. Add optional trace mode
6. Test with all Sprint 1.5.1 examples

**Success Criteria:**
- All 6 examples run to completion
- Final states match documented expected values
- Cycle counts match (if documented)

---

### Phase 2: MCP Package Structure

**Goal:** Set up MCP server infrastructure

**Files:**
- `packages/mcp-cpu/src/server.ts`
- `packages/mcp-cpu/src/session.ts`
- `packages/mcp-cpu/src/types.ts`
- `packages/mcp-cpu/package.json`

**Tasks:**
1. Install `@modelcontextprotocol/sdk` dependency
2. Create MCP server boilerplate
3. Implement session management class
4. Set up tool registration system
5. Configure build and testing

---

### Phase 3: Session Management Tools

**Goal:** Implement session lifecycle tools

**Files:**
- `packages/mcp-cpu/src/tools/session.ts`

**Tasks:**
1. Implement `cp1600_create_session`
2. Implement `cp1600_list_sessions`
3. Implement `cp1600_destroy_session`
4. Write unit tests
5. Test with Claude

---

### Phase 4: ROM Loading

**Goal:** Implement ROM loading tool

**Files:**
- `packages/mcp-cpu/src/tools/loading.ts`

**Tasks:**
1. Add `Memory.loadROM()` method to core (if not exists)
2. Implement `cp1600_load_rom`
3. Support file path resolution (relative to examples/)
4. Write unit tests
5. Test with example ROMs

---

### Phase 5: Execution Control

**Goal:** Implement step, run, reset tools

**Files:**
- `packages/mcp-cpu/src/tools/execution.ts`

**Tasks:**
1. Implement `cp1600_step`
2. Implement `cp1600_run`
3. Implement `cp1600_reset`
4. Write unit tests
5. Test with example ROMs

---

### Phase 6: State Inspection

**Goal:** Implement state inspection tools

**Files:**
- `packages/mcp-cpu/src/tools/inspection.ts`

**Tasks:**
1. Implement `cp1600_get_state`
2. Implement `cp1600_get_registers`
3. Implement `cp1600_get_flags`
4. Implement `cp1600_disassemble`
5. Implement `cp1600_examine_memory`
6. Write unit tests

---

### Phase 7: Integration Testing

**Goal:** Validate entire MCP server with real usage

**Tasks:**
1. Write integration tests using all Sprint 1.5.1 examples
2. Validate against expected states from READMEs
3. Test with Claude (manual validation)
4. Document common workflows in USER_GUIDE.md

---

## Test Strategy

### Unit Tests

Each MCP tool needs:
1. **Success case** - Tool works correctly
2. **Invalid session** - Tool handles non-existent session ID
3. **Invalid parameters** - Tool validates input parameters
4. **Error handling** - Tool handles errors gracefully

### Integration Tests

**Example-Based Testing:**
For each Sprint 1.5.1 example:
1. Create session
2. Load ROM
3. Run until halt
4. Verify final state matches documented expectations
5. Verify cycle count (if documented)

**Test Examples:**
- `01-hello-world`: Simple execution, verify R0=142, R1=100, R2=142
- `02-counter-loop`: Loop execution, verify R0=10 after 10 iterations
- `03-subroutine-call`: JSR/JR, verify stack operations
- `04-bit-manipulation`: Shifts/rotates, verify bit extraction
- `05-signed-math`: Signed arithmetic, verify overflow/carry flags
- `06-nested-calls`: Deep call stack, verify R4/R5/R6 usage

---

## Success Criteria

### Completion Checklist

- [ ] Simple CLI test runner implemented
- [ ] All Sprint 1.5.1 examples run correctly with test runner
- [ ] MCP server package created
- [ ] Session management tools implemented
- [ ] ROM loading tool implemented
- [ ] Execution control tools implemented
- [ ] State inspection tools implemented
- [ ] All MCP tools have unit tests
- [ ] Integration tests pass for all examples
- [ ] Claude can successfully:
  - [ ] Create a session
  - [ ] Load a ROM file
  - [ ] Step through instructions
  - [ ] Run to completion
  - [ ] Inspect registers and flags
  - [ ] Examine memory
  - [ ] Disassemble code

### Quality Metrics

- **Test Count:** 400+ tests (current 342 + ~60 new MCP tests)
- **Coverage:** Maintain >90% for core, >85% for MCP server
- **Documentation:** All tools documented in MCP_API.md
- **Code Quality:** No TypeScript errors, follows existing patterns

---

## Dependencies

### Required from Previous Sprints

- ✅ CPU core with all registers and flags (Sprint 1.3)
- ✅ Decoder with all addressing modes (Sprint 1.2)
- ✅ Executor with 51/51 instructions (Sprints 1.3-1.6.1)
- ✅ Sprint 1.5.1 examples with expected states

### New Components Required

**Core Package Additions:**
- `Memory.loadROM(data: Buffer, address: number)` - Load ROM into memory
- `CPU.getPC()` / `CPU.setPC(address: number)` - May already exist
- Export all necessary types and classes

**New Packages:**
- `packages/cli` - CLI test runner
- `packages/mcp-cpu` - MCP server

**External Dependencies:**
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- Node.js `fs` module - File system access for ROM loading

---

## Technical Decisions

### Session Management: Single vs Multi-Session

**Decision:** Start with single session per MCP connection

**Rationale:**
- Simplifies implementation
- Sufficient for Phase 1 (CPU-only debugging)
- Can add multi-session in Phase 2+

**Future Enhancement:**
- Multi-session for differential debugging (compare ROMs)
- Session persistence (save/load emulator state)

---

### ROM Format Support

**Decision:** Binary files only, no ROM headers

**Rationale:**
- as1600 assembler outputs raw binary
- Simplest format for Phase 1
- Header formats (BIN+CFG, ROM) can be added later

**Future Enhancement:**
- Support .cfg files (metadata)
- Support .rom format (Intellivision ROM format)
- Auto-detect load address from file format

---

### Error Handling Strategy

**Decision:** Return structured errors in tool responses

**Example:**
```json
{
  "error": true,
  "message": "Session not found: session_xyz",
  "code": "SESSION_NOT_FOUND"
}
```

**Rationale:**
- MCP tools should not throw exceptions
- Claude can handle structured errors gracefully
- Error codes enable programmatic handling

---

## Known Limitations (Phase 1)

### Not Implemented in Sprint 1.7

The following features are planned for later sprints:

**Sprint 1.8 (Debugging Tools):**
- Breakpoints (address, conditional)
- Execution trace buffer
- `run_until` with conditions
- MCP resources (state, trace)

**Phase 2 (Validation):**
- jzIntv integration
- Trace comparison
- Cycle-exact timing validation

**Phase 3 (Peripherals):**
- STIC (graphics) emulation
- PSG (sound) emulation
- Controller input

---

## User Workflows

### Workflow 1: Run an Example ROM

```
1. Claude: "Let me create a session and load the hello-world example"
   cp1600_create_session() → session_id

2. Claude: "Loading the ROM file"
   cp1600_load_rom(session_id, "examples/01-hello-world/hello.bin")

3. Claude: "Running until halt"
   cp1600_run(session_id)

4. Claude: "Let me check the final state"
   cp1600_get_state(session_id)

5. Claude: "The program executed correctly! R0=142, R1=100, R2=142 as expected."
```

---

### Workflow 2: Step Through Code

```
1. Claude: "I'll step through the first few instructions"
   cp1600_step(session_id, 1)

2. Claude: "Let me see what this instruction did"
   cp1600_get_registers(session_id)
   cp1600_get_flags(session_id)

3. Claude: "Let me disassemble the next few instructions"
   cp1600_disassemble(session_id, <current_pc>, <current_pc + 5>)

4. Claude: "I'll step 3 more instructions"
   cp1600_step(session_id, 3)
```

---

### Workflow 3: Investigate Memory

```
1. Claude: "Let me check what's at address $0200"
   cp1600_examine_memory(session_id, 0x0200, 16)

2. Claude: "I see the BACKTAB area. Let me check the stack"
   cp1600_examine_memory(session_id, 0x02F0, 8)

3. Claude: "The stack pointer is at $02F3, which matches R6"
   cp1600_get_registers(session_id)
```

---

## Timeline

**Expected Start:** After Sprint 1.6.1 completion
**Target Completion:** TBD (completion-based, not calendar-based)
**Estimated Effort:**
- Simple test runner: 1 session
- MCP infrastructure: 1 session
- Session management tools: 1 session
- ROM loading: 0.5 sessions
- Execution control: 1 session
- State inspection: 1.5 sessions
- Testing & integration: 1 session
- **Total:** ~7 sessions

**Dependencies:**
- ✅ Sprint 1.6.1 complete (all instructions implemented)
- ✅ Sprint 1.5.1 examples available for testing

---

## Notes

### Design Decisions

**Simple Before Complex:** The CLI test runner provides a foundation for MCP tools and validates the core emulator works end-to-end before adding MCP complexity.

**Session Model:** Single session per connection simplifies Phase 1. Multi-session can be added later for advanced use cases.

**Tool Granularity:** Separate tools for each operation (get_registers vs get_flags) gives Claude fine-grained control and clearer semantics.

**Example-Driven Testing:** Sprint 1.5.1 examples provide comprehensive integration tests with documented expected states.

### After This Sprint

With Sprint 1.7 complete, the project will have:
- ✅ Full CP-1600 instruction set (51/51 instructions)
- ✅ MCP server with execution control
- ✅ Claude can debug CP-1600 programs
- ✅ All Sprint 1.5.1 examples validated
- ✅ Ready for Phase 1 completion gate

**Next Sprint (1.8):** Advanced debugging tools:
- Breakpoints (address-based)
- Execution trace buffer
- Conditional execution (`run_until`)
- MCP resources (state, trace)

**Phase 1 Completion Gate:**
After Sprint 1.8, Phase 1 will be complete and ready for Phase 2 (validation against jzIntv).

---

**Last Updated:** 2025-12-12 by Claude Code

**See Also:**
- [Sprint-1.6.md](Sprint-1.6.md) - Previous sprint (instruction completion)
- [Sprint-1.5.1.md](Sprint-1.5.1.md) - Assembly examples for testing
- [MCP_API.md](MCP_API.md) - Complete MCP tool specifications
- [ROADMAP.md](ROADMAP.md) - Overall project plan
- [PROJECT_SETUP.md](PROJECT_SETUP.md) - Build and test setup
