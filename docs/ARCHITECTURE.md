# pkIntvMCP - Technical Architecture Document

**Version:** 1.0
**Date:** 2025-12-08
**Status:** Draft
**Phase:** Sprint 1.1 (Foundation & Documentation)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Package Architecture](#package-architecture)
3. [Core Module Design](#core-module-design)
4. [MCP Server Design](#mcp-server-design)
5. [State Management](#state-management)
6. [Technology Decisions](#technology-decisions)
7. [Extension Points](#extension-points)
8. [Implementation Guidelines](#implementation-guidelines)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Claude / LLM                         │
│                    (via MCP Protocol)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ MCP JSON-RPC
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    MCP Server Layer                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Session    │  │    Tools     │  │  Resources   │      │
│  │  Manager    │  │   Handler    │  │   Provider   │      │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼────────────────┼──────────────────┼──────────────┘
          │                │                  │
          │                │                  │
┌─────────▼────────────────▼──────────────────▼──────────────┐
│                    Emulator Core                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   CPU    │  │  Memory  │  │ Decoder  │  │ Executor │  │
│  │  State   │◄─┤  System  │◄─┤  Engine  │◄─┤  Engine  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │              │         │
│       └─────────────┴──────────────┴──────────────┘         │
│                    ┌──────────┐                             │
│                    │  Trace   │                             │
│                    │  Buffer  │                             │
│                    └──────────┘                             │
└─────────────────────────────────────────────────────────────┘
          │
          │ Binary ROM File
          │
┌─────────▼─────────────────────────────────────────────────┐
│                      Test ROM                              │
│                  (Air Strike, etc.)                        │
└────────────────────────────────────────────────────────────┘
```

### Component Relationships

**Data Flow Direction:** ROM → Memory → Decoder → Executor → CPU State → MCP

1. **ROM Loading**: Binary ROM file loaded into Memory System
2. **Fetch**: CPU reads instruction from Memory at PC (Program Counter)
3. **Decode**: Decoder converts 10-bit instruction word into structured Instruction object
4. **Execute**: Executor applies Instruction to CPU State, updates registers/flags
5. **Inspect**: MCP Tools/Resources query CPU State and Memory for debugging
6. **Trace**: Execution history captured in circular Trace Buffer

### Phase Evolution

**Phase 1 (Current):** CPU-only architecture
- Core emulator (CPU, Memory, Decoder, Executor)
- MCP-CPU server with debugging tools
- No peripherals (STIC, PSG, controllers)

**Phase 3 (Future):** Full system architecture
- Add peripheral modules (STIC, PSG, Input)
- Memory-mapped I/O bus
- MCP-System server with peripheral tools
- Frame-accurate timing synchronization

---

## Package Architecture

### Monorepo Structure

```
pkIntvMCP/
├── packages/
│   ├── core/              # Emulator core (CPU, Memory, Decoder, Executor)
│   ├── mcp-cpu/           # CPU-only MCP server (Phase 1)
│   ├── mcp-system/        # Full system MCP server (Phase 3)
│   ├── validation/        # jzIntv integration and testing tools
│   ├── cli/               # Optional CLI debugger
│   └── web/               # Optional web UI (Phase 4)
├── docs/                  # All documentation
├── test-roms/             # Test ROM collection (Air Strike, etc.)
├── package.json           # Root package (Turborepo orchestration)
├── turbo.json             # Turborepo configuration
├── tsconfig.json          # Shared TypeScript configuration
└── .gitignore             # Version control exclusions
```

### Package: `@pkintvmcp/core`

**Purpose:** Pure emulator implementation, no I/O dependencies

**Exports:**
- `CPU` - CPU state and execution control
- `Memory` - 64K word memory system
- `Decoder` - Instruction decoder (10-bit → structured)
- `Executor` - Instruction executor (Instruction → state changes)
- `TraceBuffer` - Circular execution history
- Types: `CPUState`, `Instruction`, `Flags`, `AddressingMode`, etc.

**Dependencies:** None (pure TypeScript)

**Characteristics:**
- No file I/O, no network, no MCP protocol
- Fully deterministic (same input → same output)
- Extensively unit tested (>90% coverage target)
- Can be used standalone (e.g., in web UI without Node.js)

**Internal Structure:**
```
packages/core/
├── src/
│   ├── cpu/
│   │   ├── cpu.ts              # CPU class (state, registers, execution loop)
│   │   ├── cpu.types.ts        # CPUState, Flags interfaces
│   │   └── cpu.test.ts         # CPU unit tests
│   ├── memory/
│   │   ├── memory.ts           # Memory class (64K words, ROM/RAM)
│   │   ├── memory.types.ts     # MemoryRegion, MemoryMap types
│   │   └── memory.test.ts      # Memory unit tests
│   ├── decoder/
│   │   ├── decoder.ts          # Decoder class (10-bit → Instruction)
│   │   ├── decoder.types.ts    # Instruction, AddressingMode types
│   │   └── decoder.test.ts     # Decoder unit tests
│   ├── executor/
│   │   ├── executor.ts         # Executor class (dispatch to handlers)
│   │   ├── instructions/       # Individual instruction implementations
│   │   │   ├── arithmetic.ts   # ADD, SUB, ADC, etc.
│   │   │   ├── logic.ts        # AND, XOR, OR, etc.
│   │   │   ├── movement.ts     # MOV, MVI, MVO, etc.
│   │   │   ├── control.ts      # B, J, JSR, JR, etc.
│   │   │   ├── stack.ts        # PSHR, PULR
│   │   │   ├── shifts.ts       # SLL, SLR, SAR, RLC, RRC, SWAP
│   │   │   └── misc.ts         # GSWD, RSWD, NOP, etc.
│   │   ├── executor.types.ts   # InstructionHandler type
│   │   └── executor.test.ts    # Integration tests
│   ├── trace/
│   │   ├── trace-buffer.ts     # Circular buffer implementation
│   │   ├── trace-buffer.types.ts
│   │   └── trace-buffer.test.ts
│   ├── utils/
│   │   ├── bit-ops.ts          # toUint16, toUint10, flag calculations
│   │   └── bit-ops.test.ts
│   └── index.ts                # Barrel export
├── package.json
└── tsconfig.json
```

### Package: `@pkintvmcp/mcp-cpu`

**Purpose:** MCP server for CPU-only debugging (Phase 1)

**Exports:**
- MCP server binary/entry point
- Tool handlers (cp1600_load_rom, cp1600_step, etc.)
- Resource providers (state, trace, memory)

**Dependencies:**
- `@pkintvmcp/core` (emulator)
- `@modelcontextprotocol/sdk` (MCP protocol)
- Node.js file system (for ROM loading)

**Characteristics:**
- Multi-session support via SessionManager
- Stateless tool handlers (all state in sessions)
- JSON-RPC transport via MCP SDK
- Clear error messages for Claude

**Internal Structure:**
```
packages/mcp-cpu/
├── src/
│   ├── server.ts               # MCP server initialization
│   ├── session-manager.ts      # Multi-session state management
│   ├── tools/
│   │   ├── execution.ts        # load_rom, step, run, run_until, reset
│   │   ├── inspection.ts       # get_state, get_registers, get_flags, etc.
│   │   ├── breakpoints.ts      # set/clear/list breakpoints
│   │   ├── trace.ts            # enable_trace, get_trace
│   │   └── index.ts
│   ├── resources/
│   │   ├── state-resource.ts   # cp1600://sessions/{id}/state
│   │   ├── trace-resource.ts   # cp1600://sessions/{id}/trace
│   │   ├── memory-resource.ts  # cp1600://sessions/{id}/memory/{start}/{end}
│   │   └── index.ts
│   ├── types.ts                # MCP-specific types
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Package: `@pkintvmcp/mcp-system`

**Purpose:** Full system MCP server with peripherals (Phase 3)

**Status:** Future, not in Phase 1

**Will include:**
- All mcp-cpu functionality
- STIC emulation (graphics)
- PSG emulation (sound)
- Controller emulation (input)
- Additional tools/resources for peripherals

### Package: `@pkintvmcp/validation`

**Purpose:** jzIntv integration for validation testing

**Exports:**
- `compareTraces()` - Compare pkIntvMCP trace vs jzIntv trace
- `runTestSuite()` - Execute full validation suite
- Utilities for jzIntv integration

**Dependencies:**
- `@pkintvmcp/core`
- Child process execution (for jzIntv binary)

**Characteristics:**
- Minimal patch to jzIntv for trace output
- Automated ROM execution on both emulators
- Detailed divergence reporting

### Package: `@pkintvmcp/cli` (Optional)

**Purpose:** Command-line debugger interface

**Status:** Optional, low priority

**Would provide:**
- Interactive debugging REPL
- Human-friendly output formatting
- Script-based testing

### Package: `@pkintvmcp/web` (Optional, Phase 4)

**Purpose:** Web-based debugger UI

**Status:** Optional, Phase 4

**Would provide:**
- Browser-based interface
- Visual register/memory display
- Interactive disassembly view

---

## Core Module Design

### CPU Class

**Responsibilities:**
- Maintain CPU state (registers, flags, PC)
- Execute instruction fetch-decode-execute loop
- Provide single-step and run-until capabilities
- Track cycle count (Phase 2)

**State:**
```typescript
interface CPUState {
  // General Purpose Registers (16-bit)
  r0: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
  r6: number;  // Stack Pointer
  r7: number;  // Program Counter (PC)

  // Status Flags
  flags: Flags;

  // Execution State
  halted: boolean;
  cycleCount: number;  // Phase 2

  // SDBD State
  sdbd: boolean;  // SDBD prefix active for next instruction
}

interface Flags {
  sign: boolean;      // S: bit 15 of result (or bit 7 for some ops)
  zero: boolean;      // Z: result == 0
  overflow: boolean;  // OV: signed overflow occurred
  carry: boolean;     // C: carry out or borrow
}
```

**Key Methods:**
```typescript
class CPU {
  constructor(memory: Memory);

  // Execution Control
  reset(): void;                           // Reset to initial state
  step(): CPUState;                        // Execute one instruction
  run(maxInstructions?: number): CPUState; // Run until halt/breakpoint
  runUntil(condition: Condition): CPUState; // Run until condition met

  // State Access
  getState(): CPUState;
  getRegister(reg: number): number;  // reg 0-7
  getFlags(): Flags;

  // Internal (used by Executor)
  setRegister(reg: number, value: number): void;
  setFlags(flags: Partial<Flags>): void;
  incrementPC(): void;
}
```

**Register Semantics:**
- R0-R5: General purpose
- R6: Stack pointer (grows upward, pre-increment push, post-decrement pop)
- R7: Program counter (auto-increments after fetch)
- All registers are 16-bit, masking via `toUint16()` on all writes

**SDBD Handling:**
- When SDBD instruction executed, sets `cpu.sdbd = true`
- Next instruction uses 16-bit immediate (read two consecutive 10-bit words)
- After instruction executes with SDBD, flag cleared automatically

### Memory Class

**Responsibilities:**
- Store 64K words of 16-bit memory
- Handle ROM vs RAM distinction
- Provide read/write with address masking

**Implementation:**
```typescript
class Memory {
  private memory: Uint16Array;  // 64K * 16-bit
  private romMask: Uint8Array;  // 64K * 1 bit (ROM=1, RAM=0)

  constructor();

  // Basic Operations
  read(address: number): number;           // Mask address to 16-bit
  write(address: number, value: number): void;  // Check ROM protection

  // ROM Loading
  loadROM(data: Uint16Array, startAddress: number, length: number): void;

  // Bulk Access
  readRange(start: number, length: number): Uint16Array;

  // Utilities
  isROM(address: number): boolean;
  clear(): void;
}
```

**Memory Map (Phase 1):**
- Phase 1 treats all memory as generic read/write
- ROM regions marked via `romMask` to prevent writes
- MMIO regions ($0000-$003F) are just RAM (no peripheral behavior yet)

**Memory Map (Phase 3):**
- MMIO regions trigger peripheral reads/writes
- Extension point for peripheral integration

### Decoder and Executor: Design and Separation

**Overview:**
The decoder and executor form the heart of the instruction processing pipeline. They are intentionally designed as separate, independent components following a classic two-stage architecture common in CPU emulation and compiler design.

**What the Decoder Does:**
- **Input:** Memory address + SDBD state (boolean)
- **Process:** Reads instruction word(s) from memory at the given address and parses the binary encoding
- **Output:** Structured `Instruction` object with opcode, addressing mode, operands, and metadata
- **Key responsibility:** Understanding the CP-1600 instruction encoding format (10-bit words, bit fields, multi-word instructions)

The decoder is purely a **parser** - it translates from binary machine code to a structured intermediate representation. It knows nothing about what instructions do, only how they're encoded.

**What the Executor Does:**
- **Input:** `Instruction` object from decoder
- **Process:** Dispatches to instruction-specific handler based on opcode
- **Output:** Updated CPU state (registers, flags, program counter, cycle count)
- **Key responsibility:** Implementing the semantics and behavior of each CP-1600 instruction

The executor is purely an **interpreter** - it takes structured instructions and applies their effects to the CPU state. It knows nothing about instruction encoding, only what each instruction does.

**Why They Are Separate:**

1. **Separation of Concerns:**
   - Decoder: "How is this instruction encoded?" (parsing problem)
   - Executor: "What does this instruction do?" (semantic problem)
   - Each component can be understood, tested, and debugged independently

2. **Testability:**
   - Decoder tests: "Does it correctly parse instruction bits into operands?"
   - Executor tests: "Does it correctly update CPU state for this operation?"
   - Clean interfaces make unit testing straightforward

3. **Maintainability:**
   - Changes to instruction encoding (e.g., fixing operand order) only affect decoder
   - Changes to instruction behavior (e.g., flag calculation) only affect executor
   - Decoder can be verified against CP-1600 reference manual independently
   - Executor can be verified against jzIntv behavior independently

4. **Flexibility:**
   - Same executor could work with different frontends (assembler, disassembler, JIT)
   - Same decoder output could feed multiple backends (interpreter, tracer, analyzer)
   - Clean architecture supports future extensions (e.g., web UI debugger)

**How They Work Together:**

```
┌─────────────┐
│   Memory    │
│ (ROM/RAM)   │
└──────┬──────┘
       │
       │ instruction word(s)
       ▼
┌─────────────┐
│   Decoder   │──────┐
│             │      │ reads multiple words if needed
└──────┬──────┘      │ (immediate values, branch targets)
       │             │
       │ Instruction │
       │  (struct)   │
       ▼             ▼
┌─────────────┐   ┌────────┐
│  Executor   │◄──┤ Memory │
│             │   └────────┘
└──────┬──────┘
       │
       │ state updates
       ▼
┌─────────────┐
│     CPU     │
│   (State)   │
└─────────────┘
```

**Data Flow Example (ADDI instruction):**

1. **Decoder phase:**
   - Reads word at PC: `0x0287` (ADDI R0, #42 encoding)
   - Extracts opcode bits → `Opcode.ADD`
   - Extracts mode bits → `AddressingMode.IMMEDIATE`
   - Reads next word for immediate value: `0x002A` (42)
   - Extracts destination register bits → R0
   - Returns: `{ opcode: ADD, mode: IMMEDIATE, operands: [{ type: 'immediate', value: 42 }, { type: 'register', value: 0 }], length: 2 }`

2. **Executor phase:**
   - Receives Instruction object
   - Dispatches to `executeADD()` handler
   - Reads operands: immediate=42, dst=R0
   - Reads R0 current value
   - Computes: R0_new = R0_old + 42
   - Updates flags (S, Z, C, OV)
   - Writes R0_new back to CPU
   - Updates cycle count
   - Returns (caller advances PC by instruction.length)

**Current Implementation Status:**
- ✅ Decoder: Immediate, register, direct, indirect, branch addressing modes complete
- ✅ Executor: ~30 instructions implemented (MOVR, ADD, SUB, branches, etc.)
- 🟢 In progress: Multi-word jump instruction decoding
- ⏳ Todo: Remaining shifts, rotates, special instructions

### Decoder Class

**Responsibilities:**
- Parse 10-bit instruction words into structured Instruction objects
- Extract opcode, addressing mode, operands
- Handle SDBD-modified addressing modes

**Instruction Structure:**
```typescript
interface Instruction {
  address: number;         // Address of instruction (for trace/debug)
  opcode: Opcode;          // Instruction type (ADD, SUB, MVI, etc.)
  addressingMode: AddressingMode;
  operands: Operand[];     // Variable length based on instruction
  raw: number;             // Original 10-bit instruction word
  sdbd: boolean;           // Was SDBD prefix active?
}

enum Opcode {
  // Arithmetic
  ADD, SUB, ADC, NEG, INC, DEC, CMP,
  // Logic
  AND, XOR, OR, CLR, TST,
  // Data Movement
  MOV, MVI, MVO, MVOI,
  // Control Flow
  B, BEQ, BNE, BMI, BPL, BC, BNC, BOV, BNOV,
  J, JSR, JR,
  // Stack
  PSHR, PULR,
  // Shifts/Rotates
  SLL, SLR, SAR, RLC, RRC, SWAP,
  // Misc
  SDBD, NOP, GSWD, RSWD, HLT,
  // ... (all ~50 instructions)
}

enum AddressingMode {
  IMPLIED,       // No operands (e.g., NOP, HLT)
  REGISTER,      // Rn
  IMMEDIATE,     // #value
  DIRECT,        // $addr
  INDIRECT,      // @Rn
  INDEXED,       // $addr(Rn)
  STACK,         // Special for PSHR/PULR
  SDBD_MODIFIED, // 16-bit immediate via SDBD prefix
}

interface Operand {
  type: 'register' | 'immediate' | 'address';
  value: number;
}
```

**Key Methods:**
```typescript
class Decoder {
  constructor(memory: Memory);

  decode(address: number, sdbd: boolean): Instruction;

  // Internal
  private extractOpcode(word: number): Opcode;
  private extractAddressingMode(word: number, opcode: Opcode): AddressingMode;
  private extractOperands(word: number, mode: AddressingMode, sdbd: boolean): Operand[];
}
```

**Decoding Strategy:**
- Instruction format: 10-bit words with variable bit field layouts
- Top bits typically encode opcode category
- Lower bits encode addressing mode and register selection
- Some instructions span multiple words (e.g., immediate values)
- SDBD prefix affects immediate operand size (10-bit → 16-bit)

### Executor Class

**Responsibilities:**
- Dispatch decoded instructions to handlers
- Implement instruction semantics
- Update CPU state (registers, flags, PC)
- Track cycle counts (Phase 2)

**Implementation:**
```typescript
class Executor {
  constructor(cpu: CPU, memory: Memory);

  execute(instruction: Instruction): void;

  // Internal: instruction handlers (one per Opcode)
  private executeADD(inst: Instruction): void;
  private executeSUB(inst: Instruction): void;
  // ... (all ~50 instructions)
}
```

**Handler Pattern:**
Each instruction handler follows:
1. Fetch operands (resolve addressing mode)
2. Perform operation
3. Calculate result
4. Update flags
5. Write result
6. Update PC
7. Increment cycle count

**Example: ADD instruction**
```typescript
private executeADD(inst: Instruction): void {
  const src = this.resolveOperand(inst.operands[0]);
  const dst = this.resolveOperand(inst.operands[1]);

  const result = dst + src;
  const result16 = toUint16(result);

  // Update flags
  this.cpu.setFlags({
    sign: (result16 & 0x8000) !== 0,
    zero: result16 === 0,
    carry: result > 0xFFFF,
    overflow: detectSignedOverflow(dst, src, result16),
  });

  // Write result
  this.writeOperand(inst.operands[1], result16);

  // Update PC
  this.cpu.incrementPC();

  // Cycle counting (Phase 2)
  this.cpu.cycleCount += calculateCycles(inst);
}
```

**Flag Calculation Details:**

**Sign Flag:**
- Set if bit 15 of result is 1 (negative in two's complement)
- Some operations use bit 7 (8-bit operations)

**Zero Flag:**
- Set if result equals 0 after masking to 16 bits

**Carry Flag:**
- ADD/INC: set if result > 0xFFFF (carry out)
- SUB/DEC/CMP: set if no borrow (src >= dst)
- Shifts: carry out from bit shifted

**Overflow Flag (most complex):**
- Set when signed operation produces wrong-signed result
- ADD: overflow if both operands same sign, result different sign
- SUB: overflow if operands different sign, result != dst sign
- Detection via bit 15 inspection:
```typescript
function detectSignedOverflow(a: number, b: number, result: number): boolean {
  // For ADD: overflow if sign(a) == sign(b) && sign(result) != sign(a)
  const signA = (a & 0x8000) !== 0;
  const signB = (b & 0x8000) !== 0;
  const signR = (result & 0x8000) !== 0;
  return (signA === signB) && (signR !== signA);
}
```

**Bit Operations in TypeScript:**
JavaScript's bitwise operators treat operands as 32-bit signed integers, requiring explicit masking:
```typescript
// Utilities (in bit-ops.ts)
function toUint16(value: number): number {
  return (value & 0xFFFF) >>> 0;  // >>> 0 ensures unsigned
}

function toUint10(value: number): number {
  return (value & 0x3FF) >>> 0;
}

// Shifts must use unsigned right shift (>>>)
const logicalShiftRight = (value >>> 1) & 0xFFFF;  // NOT value >> 1
```

### TraceBuffer Class

**Responsibilities:**
- Record execution history
- Circular buffer (configurable size)
- Provide formatted trace output

**Implementation:**
```typescript
interface TraceEntry {
  instructionNumber: number;  // Sequential count
  address: number;            // PC at fetch
  instruction: Instruction;   // Decoded instruction
  before: CPUState;           // State before execution
  after: CPUState;            // State after execution
  memoryWrites: MemoryWrite[]; // Memory changes during instruction
}

interface MemoryWrite {
  address: number;
  oldValue: number;
  newValue: number;
}

class TraceBuffer {
  private buffer: TraceEntry[];
  private size: number;
  private index: number;  // Circular index
  private enabled: boolean;

  constructor(size: number = 1000);

  enable(): void;
  disable(): void;

  record(entry: TraceEntry): void;
  getTrace(count?: number): TraceEntry[];  // Most recent N entries
  clear(): void;
}
```

**Trace Integration:**
- CPU calls `traceBuffer.record()` after each instruction
- MCP tools query trace buffer for execution history
- Useful for Claude to understand "what happened before crash"

---

## MCP Server Design

### SessionManager

**Responsibilities:**
- Manage multiple simultaneous debugging sessions
- Each session has isolated CPU/Memory/TraceBuffer state
- Handle session lifecycle (create, destroy, list)

**Implementation:**
```typescript
interface Session {
  id: string;              // UUID
  cpu: CPU;
  memory: Memory;
  trace: TraceBuffer;
  breakpoints: Breakpoint[];
  createdAt: Date;
  lastActivity: Date;
}

class SessionManager {
  private sessions: Map<string, Session>;

  createSession(): string;  // Returns session ID
  getSession(id: string): Session | null;
  destroySession(id: string): void;
  listSessions(): SessionInfo[];

  // Cleanup
  pruneInactiveSessions(timeoutMs: number): void;
}
```

**Session Isolation:**
- Each Claude conversation can have its own session
- Multiple sessions can debug different ROMs simultaneously
- No shared state between sessions

### Tools Handler

**Responsibilities:**
- Implement MCP tool interface
- Validate inputs
- Delegate to core emulator
- Format responses for Claude
- Provide clear error messages

**Tool Implementation Pattern:**
```typescript
// Example: cp1600_step tool
async function handleStep(sessionId: string, count: number = 1): Promise<StepResult> {
  // 1. Validate inputs
  if (count < 1 || count > 10000) {
    throw new MCPError('count must be between 1 and 10000');
  }

  // 2. Get session
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    throw new MCPError(`Session ${sessionId} not found`);
  }

  // 3. Execute
  for (let i = 0; i < count; i++) {
    if (session.cpu.halted) break;

    // Check breakpoints
    if (hasBreakpointAt(session.breakpoints, session.cpu.r7)) {
      return {
        stopped: true,
        reason: 'breakpoint',
        stoppedAt: session.cpu.r7,
        instructionsExecuted: i,
        state: session.cpu.getState(),
      };
    }

    session.cpu.step();
  }

  // 4. Return formatted result
  return {
    stopped: false,
    instructionsExecuted: count,
    state: session.cpu.getState(),
  };
}
```

**Error Handling Philosophy:**
- Errors should be self-explanatory for Claude
- Include context (e.g., "Session abc123 not found. Use cp1600_list_sessions to see active sessions.")
- Distinguish user errors (bad inputs) from system errors (bugs)

### Tools Reference (Phase 1)

**Session Management:**
- `cp1600_create_session()` → `{sessionId}`
- `cp1600_list_sessions()` → `{sessions: SessionInfo[]}`
- `cp1600_destroy_session(sessionId)` → `{success: boolean}`

**ROM Loading:**
- `cp1600_load_rom(sessionId, romPath)` → `{loaded: boolean, size: number, entryPoint: number}`

**Execution Control:**
- `cp1600_step(sessionId, count=1)` → `{instructionsExecuted, state, stopped, reason?}`
- `cp1600_run(sessionId, maxInstructions=100000)` → `{instructionsExecuted, state, stopped, reason}`
- `cp1600_run_until(sessionId, condition)` → `{instructionsExecuted, state, stopped}`
- `cp1600_reset(sessionId)` → `{state}`

**State Inspection:**
- `cp1600_get_state(sessionId)` → `{state: CPUState}`
- `cp1600_get_registers(sessionId)` → `{r0..r7}`
- `cp1600_get_flags(sessionId)` → `{sign, zero, overflow, carry}`
- `cp1600_disassemble(sessionId, address, count=10)` → `{instructions: DisassembledInstruction[]}`
- `cp1600_examine_memory(sessionId, start, length)` → `{data: number[], ascii: string}`

**Breakpoints:**
- `cp1600_set_breakpoint(sessionId, address, condition?)` → `{id: number}`
- `cp1600_list_breakpoints(sessionId)` → `{breakpoints: Breakpoint[]}`
- `cp1600_clear_breakpoint(sessionId, id)` → `{success: boolean}`

**Tracing:**
- `cp1600_enable_trace(sessionId, bufferSize=1000)` → `{enabled: boolean}`
- `cp1600_get_trace(sessionId, count=100)` → `{trace: TraceEntry[]}`

### Resources Provider

**Responsibilities:**
- Expose dynamic data as MCP resources
- Update as state changes
- Provide structured data for Claude

**Resource URIs:**
- `cp1600://sessions/{id}/state` → Current CPU state (JSON)
- `cp1600://sessions/{id}/trace` → Execution trace (JSON)
- `cp1600://sessions/{id}/memory/{start}/{end}` → Memory range (JSON or binary)

**Resource Update Pattern:**
- Resources are read-only (Claude cannot modify via resources)
- Resources reflect current session state
- Use tools to modify state, resources to observe

### Protocol Integration

**MCP SDK Usage:**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'pkIntvMCP',
  version: '0.1.0',
}, {
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Register tools
server.setRequestHandler('tools/list', async () => ({
  tools: [/* tool definitions */],
}));

server.setRequestHandler('tools/call', async (request) => {
  // Route to appropriate handler
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## State Management

### CPU State Serialization

**Requirements:**
- Save/restore full CPU state
- Support for "rewind" (Phase 4)
- Diff two states for comparison

**Serialization Format (JSON):**
```json
{
  "registers": {
    "r0": 0, "r1": 0, "r2": 0, "r3": 0,
    "r4": 0, "r5": 0, "r6": 0, "r7": 0x5000
  },
  "flags": {
    "sign": false,
    "zero": true,
    "overflow": false,
    "carry": false
  },
  "halted": false,
  "cycleCount": 0,
  "sdbd": false
}
```

**Memory Serialization:**
- Full memory dump: 64K words × 2 bytes = 128KB
- Binary format preferred for efficiency
- Optional: sparse format (only non-zero regions)

### Deterministic Execution

**Critical Requirement:** Same ROM + same inputs = same outputs

**Sources of Non-Determinism to Avoid:**
- Random number generators
- Timestamps
- Floating point arithmetic (use integer only)
- Undefined behavior (uninitialized memory)

**Testing Determinism:**
```typescript
test('execution is deterministic', () => {
  const rom = loadTestROM();

  // Run 1
  const cpu1 = new CPU(new Memory());
  cpu1.memory.loadROM(rom, 0x5000, rom.length);
  for (let i = 0; i < 1000; i++) cpu1.step();
  const state1 = cpu1.getState();

  // Run 2
  const cpu2 = new CPU(new Memory());
  cpu2.memory.loadROM(rom, 0x5000, rom.length);
  for (let i = 0; i < 1000; i++) cpu2.step();
  const state2 = cpu2.getState();

  // Must match exactly
  expect(state1).toEqual(state2);
});
```

### Trace Buffer Management

**Circular Buffer Strategy:**
- Fixed size (e.g., 1000 entries)
- Oldest entries overwritten when full
- Efficient memory usage (no unbounded growth)

**Configurable Size:**
- Small (100): minimal overhead, recent history only
- Medium (1000): default, good for most debugging
- Large (10000): deep history, memory-intensive

**Trace Output Formats:**
- JSON: structured, Claude-friendly
- Text: human-readable, terminal output
- Binary: efficient, for large traces (Phase 4)

---

## Technology Decisions

### TypeScript (Strict Mode)

**Why TypeScript:**
- Type safety reduces bugs (critical for emulator correctness)
- Better IDE support (autocomplete, refactoring)
- Gradual typing (can start loose, tighten later)
- Compiles to JavaScript (run anywhere)

**Why NOT Python:**
- Web UI potential (TypeScript/JavaScript runs in browser)
- Better ecosystem for MCP SDK (TypeScript first-class)
- Performance (JIT compilation, V8 optimizations)
- Type checking at compile time

**Strict Mode Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Testing Framework

**Options Considered:**
- **Jest**: Mature, large ecosystem, slower
- **Vitest**: Modern, fast, Vite-compatible
- **Node Test Runner**: Built-in, minimal dependencies

**Decision: Vitest** (tentative, can revisit)

**Rationale:**
- Fast execution (important for large test suite)
- Modern TypeScript support
- Watch mode for development
- Compatible with potential Vite-based web UI

**Test Organization:**
- Co-located tests: `cpu.test.ts` next to `cpu.ts`
- Integration tests: separate `tests/` directory
- Test ROM validation: `packages/validation/`

### Build System: Turborepo

**Why Turborepo:**
- Monorepo orchestration (build order, dependencies)
- Incremental builds (only rebuild changed packages)
- Remote caching (future: CI/CD speedup)
- Task parallelization

**Turborepo Configuration (`turbo.json`):**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    }
  }
}
```

**Build Commands:**
```bash
npm run build         # Build all packages
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run validate      # Run jzIntv validation suite
```

### Node.js Version

**Target: Node.js 18+**

**Rationale:**
- MCP SDK requires Node.js 18+
- Modern JavaScript features (top-level await, optional chaining)
- Stable LTS release
- Good performance (V8 10.2+)

---

## Extension Points

### Phase 3: Peripheral Integration

**Design Goal:** Add peripherals without rewriting core

**Approach 1: Memory-Mapped I/O Bus**

```typescript
interface PeripheralDevice {
  // Address range this device handles
  startAddress: number;
  endAddress: number;

  // Called when CPU reads from MMIO range
  read(address: number): number;

  // Called when CPU writes to MMIO range
  write(address: number, value: number): void;

  // Called once per frame (60Hz)
  update(cycles: number): void;
}

class Memory {
  private devices: PeripheralDevice[] = [];

  registerDevice(device: PeripheralDevice): void {
    this.devices.push(device);
  }

  read(address: number): number {
    // Check if address is in peripheral range
    const device = this.findDevice(address);
    if (device) {
      return device.read(address);
    }
    // Otherwise read from RAM
    return this.memory[address];
  }

  // Similar for write()
}
```

**Approach 2: Event-Driven Architecture**

```typescript
interface SystemBus {
  on(event: 'read' | 'write', callback: (address: number, value?: number) => void): void;
  emit(event: 'read' | 'write', address: number, value?: number): void;
}

// STIC registers on events
systemBus.on('write', (address, value) => {
  if (address >= 0x0000 && address <= 0x003F) {
    stic.writeRegister(address, value!);
  }
});
```

**Decision:** Approach 1 (Peripheral Device interface)
- More explicit, easier to test
- Clear ownership of address ranges
- Better performance (direct dispatch vs event overhead)

### Plugin Architecture for Custom Tools

**Design Goal:** Allow users to add custom MCP tools

**Extension Point:**
```typescript
interface CustomTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;

  execute(session: Session, params: any): Promise<any>;
}

class MCPServer {
  registerTool(tool: CustomTool): void {
    this.tools.set(tool.name, tool);
  }
}
```

**Example Custom Tool:**
```typescript
// Find all JSR instructions in ROM
const findSubroutines: CustomTool = {
  name: 'cp1600_find_subroutines',
  description: 'Find all JSR instructions and their targets',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
    },
  },

  async execute(session, params) {
    const subroutines = [];
    // Scan memory for JSR opcodes
    // ...
    return { subroutines };
  },
};
```

### Resource Providers for Custom Data

**Extension Point:**
```typescript
interface ResourceProvider {
  uri: string;  // e.g., "cp1600://custom/data"
  mimeType: string;

  fetch(): Promise<ResourceContent>;
}

class MCPServer {
  registerResourceProvider(provider: ResourceProvider): void {
    this.resourceProviders.set(provider.uri, provider);
  }
}
```

---

## Implementation Guidelines

### Code Style

**File Naming:** kebab-case
- `cpu-state.ts`, `trace-buffer.ts`, `bit-ops.ts`

**Class Naming:** PascalCase
- `CPU`, `Memory`, `Decoder`, `TraceBuffer`

**Function/Method Naming:** camelCase
- `getState()`, `incrementPC()`, `loadROM()`

**Type Naming:** PascalCase
- `CPUState`, `Instruction`, `AddressingMode`

**Constants:** UPPER_SNAKE_CASE
- `MAX_MEMORY_SIZE`, `DEFAULT_TRACE_BUFFER_SIZE`

### Module Organization

**Barrel Exports (`index.ts`):**
```typescript
// packages/core/src/index.ts
export { CPU } from './cpu/cpu.js';
export { Memory } from './memory/memory.js';
export { Decoder } from './decoder/decoder.js';
export { Executor } from './executor/executor.js';
export { TraceBuffer } from './trace/trace-buffer.js';

export type { CPUState, Flags } from './cpu/cpu.types.js';
export type { Instruction, Opcode, AddressingMode } from './decoder/decoder.types.js';
// ...
```

**Type Files:** Separate `.types.ts` files for interfaces/types
- Reduces circular dependencies
- Cleaner separation of concerns
- Better for documentation generation

### Testing Strategy

**Unit Tests:** Test individual modules in isolation
```typescript
// cpu.test.ts
describe('CPU', () => {
  test('reset sets all registers to 0', () => {
    const cpu = new CPU(new Memory());
    cpu.setRegister(0, 123);
    cpu.reset();
    expect(cpu.getRegister(0)).toBe(0);
  });
});
```

**Integration Tests:** Test instruction execution end-to-end
```typescript
// executor.test.ts
describe('ADD instruction', () => {
  test('ADD R0, R1 adds correctly', () => {
    const memory = new Memory();
    const cpu = new CPU(memory);
    const decoder = new Decoder(memory);
    const executor = new Executor(cpu, memory);

    cpu.setRegister(0, 5);
    cpu.setRegister(1, 10);

    // Decode ADD R0, R1 instruction
    memory.write(0x5000, 0b0001000001);  // ADD opcode with R0, R1
    const inst = decoder.decode(0x5000, false);

    executor.execute(inst);

    expect(cpu.getRegister(0)).toBe(15);
    expect(cpu.flags.zero).toBe(false);
  });
});
```

**Validation Tests:** Compare against jzIntv
```typescript
// validation.test.ts
describe('jzIntv compatibility', () => {
  test('Air Strike ROM matches jzIntv trace', async () => {
    const pkTrace = await runPkIntvMCP('air-strike.rom', 1000);
    const jzTrace = await runJzIntv('air-strike.rom', 1000);

    const divergence = compareTraces(pkTrace, jzTrace);
    expect(divergence).toBeNull();  // No divergence
  });
});
```

**Coverage Targets:**
- Phase 1: >90% line coverage
- Phase 2: >95% line coverage
- Critical paths (instruction execution): 100%

### Documentation Standards

**Code Comments:**
- Public APIs: JSDoc comments
- Complex logic: Inline comments explaining "why"
- Edge cases: Document known quirks

**JSDoc Example:**
```typescript
/**
 * Execute a single instruction at the current PC.
 *
 * Fetches the instruction from memory, decodes it, executes it,
 * and updates CPU state accordingly.
 *
 * @returns The CPU state after execution
 * @throws {Error} If the instruction is invalid
 */
step(): CPUState {
  // Implementation...
}
```

**Architecture Decision Records (ADRs):**
- Document significant technical decisions
- Format: Context, Decision, Consequences
- Store in `docs/adr/`

---

## Appendix: Instruction Implementation Checklist

For each instruction, implementation requires:

1. **Opcode Definition:** Add to `Opcode` enum
2. **Decoder Logic:** Extract operands from 10-bit word
3. **Executor Handler:** Implement `executeXXX()` method
4. **Flag Calculation:** Correct C, OV, Z, S behavior
5. **Unit Test:** Test with known inputs/outputs
6. **Edge Cases:** Test boundary conditions
7. **Cycle Timing:** Add cycle count (Phase 2)
8. **SDBD Interaction:** Test with SDBD prefix (if applicable)
9. **jzIntv Validation:** Verify against reference trace

**Priority Order (Phase 1):**
1. Core arithmetic: ADD, SUB, INC, DEC (needed for basic programs)
2. Data movement: MOV, MVI, MVO (needed to manipulate data)
3. Logic: AND, XOR, CLR, TST (needed for conditionals)
4. Control flow: B, BEQ, BNE, J, JSR, JR (needed for branches)
5. Stack: PSHR, PULR (needed for subroutines)

**Deferred to Phase 2:**
- Advanced shifts: SLL, SLR, SAR, RLC, RRC, SWAP
- Special: GSWD, RSWD (hardware-specific)
- Full addressing modes (@@R4, @@R5)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-08 | Peter/Claude | Initial architecture document |

---

**Next Steps:**
1. ✅ PRD.md complete
2. ✅ ARCHITECTURE.md complete (this document)
3. ⏳ CPU_SPECIFICATION.md (detailed instruction specifications)
4. ⏳ MCP_API.md (complete MCP interface reference)
5. ⏳ PROJECT_SETUP.md (repository structure and build setup)
6. ⏳ USER_GUIDE.md (provisional user documentation)
