# pkIntvMCP - MCP API Specification

**Version:** 1.0
**Date:** 2025-12-08
**Status:** Draft
**Phase:** Sprint 1.1 (Foundation & Documentation)

---

## Table of Contents

1. [Overview](#overview)
2. [Server Information](#server-information)
3. [Session Management](#session-management)
4. [Execution Control Tools](#execution-control-tools)
5. [State Inspection Tools](#state-inspection-tools)
6. [Breakpoint Tools](#breakpoint-tools)
7. [Trace Tools](#trace-tools)
8. [Resources](#resources)
9. [Usage Patterns](#usage-patterns)
10. [Error Handling](#error-handling)
11. [Versioning](#versioning)

---

## Overview

### Purpose

pkIntvMCP is an MCP (Model Context Protocol) server that enables AI assistants like Claude to debug and analyze CP-1600/Intellivision programs through a comprehensive debugging interface. The server provides tools for execution control, state inspection, breakpoints, and execution tracing.

### Protocol

- **Protocol**: Model Context Protocol (MCP) v1.0
- **Transport**: stdio (standard input/output)
- **Message Format**: JSON-RPC 2.0
- **SDK**: `@modelcontextprotocol/sdk` v0.5.0+

### Server Types

**Phase 1: mcp-cpu** (Current)
- CPU-only debugging
- No peripheral emulation
- Focus: Instruction execution, register/memory inspection
- ~30 tools, ~10 resources

**Phase 3: mcp-system** (Future)
- Full system emulation (CPU + STIC + PSG + Input)
- All mcp-cpu tools included
- Additional peripheral tools and resources
- Backwards compatible with mcp-cpu

---

## Server Information

### Server Metadata

```json
{
  "name": "pkIntvMCP",
  "version": "0.1.0",
  "vendor": "Peter Kaminski",
  "description": "CP-1600/Intellivision debugging server for AI assistants",
  "capabilities": {
    "tools": {},
    "resources": {}
  }
}
```

### Installation

**NPM Package** (Phase 4):
```bash
npm install -g @pkintvmcp/mcp-cpu
```

**Claude Desktop Configuration:**
```json
{
  "mcpServers": {
    "pkintvmcp": {
      "command": "npx",
      "args": ["@pkintvmcp/mcp-cpu"]
    }
  }
}
```

---

## Session Management

### cp1600_create_session

**Description**: Create a new debugging session. Each session maintains isolated CPU/memory state.

**Input Schema**:
```typescript
{
  sessionId?: string;  // Optional: Specify session ID (default: auto-generated UUID)
}
```

**Output Schema**:
```typescript
{
  sessionId: string;      // UUID of created session
  createdAt: string;      // ISO 8601 timestamp
  state: {
    registers: number[];  // [R0-R7], all initialized to 0
    flags: {
      sign: boolean;
      zero: boolean;
      carry: boolean;
      overflow: boolean;
    };
    halted: boolean;      // false
    cycleCount: number;   // 0
  };
}
```

**Example**:
```typescript
// Input
{}

// Output
{
  "sessionId": "abc123-def456-789",
  "createdAt": "2025-12-08T10:30:00Z",
  "state": {
    "registers": [0, 0, 0, 0, 0, 0, 0, 0],
    "flags": {
      "sign": false,
      "zero": false,
      "carry": false,
      "overflow": false
    },
    "halted": false,
    "cycleCount": 0
  }
}
```

**Errors**:
- `session_exists`: Specified sessionId already exists

---

### cp1600_list_sessions

**Description**: List all active debugging sessions.

**Input Schema**:
```typescript
{}
```

**Output Schema**:
```typescript
{
  sessions: Array<{
    sessionId: string;
    createdAt: string;
    lastActivity: string;
    romLoaded: boolean;
    romName?: string;
    pc: number;           // Current program counter (R7)
    instructionCount: number;
  }>;
}
```

**Example**:
```typescript
// Output
{
  "sessions": [
    {
      "sessionId": "abc123",
      "createdAt": "2025-12-08T10:30:00Z",
      "lastActivity": "2025-12-08T10:35:42Z",
      "romLoaded": true,
      "romName": "air-strike.bin",
      "pc": 20768,
      "instructionCount": 1542
    }
  ]
}
```

---

### cp1600_destroy_session

**Description**: Destroy a debugging session and free resources.

**Input Schema**:
```typescript
{
  sessionId: string;  // Session to destroy
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123" }

// Output
{ "success": true, "message": "Session abc123 destroyed" }
```

**Errors**:
- `session_not_found`: Session ID does not exist

---

## Execution Control Tools

### cp1600_load_rom

**Description**: Load a ROM file into session memory. Automatically detects ROM format and loads to appropriate address (typically $5000).

**Input Schema**:
```typescript
{
  sessionId: string;
  romPath: string;      // Absolute or relative path to ROM file
  startAddress?: number; // Optional: Override default load address
}
```

**Output Schema**:
```typescript
{
  loaded: boolean;
  romSize: number;       // Size in 16-bit words
  startAddress: number;  // Address where ROM was loaded
  entryPoint: number;    // Initial PC value ($5000 typical)
  format: string;        // "bin" | "rom" | "int"
}
```

**Example**:
```typescript
// Input
{
  "sessionId": "abc123",
  "romPath": "/home/user/roms/air-strike.bin"
}

// Output
{
  "loaded": true,
  "romSize": 4096,
  "startAddress": 20480,  // $5000
  "entryPoint": 20480,
  "format": "bin"
}
```

**Errors**:
- `session_not_found`: Session ID does not exist
- `file_not_found`: ROM file not found at path
- `invalid_rom`: ROM file format not recognized
- `rom_too_large`: ROM exceeds available memory

---

### cp1600_step

**Description**: Execute N instructions and return state. Stops early if halted or breakpoint hit.

**Input Schema**:
```typescript
{
  sessionId: string;
  count?: number;  // Default: 1, Range: 1-10000
}
```

**Output Schema**:
```typescript
{
  instructionsExecuted: number;  // Actual instructions executed
  stopped: boolean;              // true if stopped early
  reason?: string;               // "halted" | "breakpoint" | "completed"
  stoppedAt?: number;            // PC where execution stopped
  state: {
    registers: number[];         // [R0-R7]
    flags: {
      sign: boolean;
      zero: boolean;
      carry: boolean;
      overflow: boolean;
    };
    halted: boolean;
    cycleCount: number;
  };
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123", "count": 10 }

// Output
{
  "instructionsExecuted": 10,
  "stopped": false,
  "state": {
    "registers": [0, 42, 100, 0, 256, 0, 752, 20490],
    "flags": { "sign": false, "zero": false, "carry": false, "overflow": false },
    "halted": false,
    "cycleCount": 64
  }
}
```

**Errors**:
- `session_not_found`: Session ID does not exist
- `no_rom_loaded`: Must load ROM before executing
- `invalid_count`: count out of range

---

### cp1600_run

**Description**: Run until halted, breakpoint, or max instructions reached.

**Input Schema**:
```typescript
{
  sessionId: string;
  maxInstructions?: number;  // Default: 100000, Range: 1-1000000
}
```

**Output Schema**:
```typescript
{
  instructionsExecuted: number;
  stopped: boolean;
  reason: string;  // "halted" | "breakpoint" | "max_instructions"
  stoppedAt?: number;
  state: { /* same as cp1600_step */ };
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123", "maxInstructions": 50000 }

// Output
{
  "instructionsExecuted": 1542,
  "stopped": true,
  "reason": "breakpoint",
  "stoppedAt": 20512,
  "state": { /* ... */ }
}
```

**Errors**:
- `session_not_found`: Session ID does not exist
- `no_rom_loaded`: Must load ROM before executing

---

### cp1600_run_until

**Description**: Run until a condition is met (address reached, register value, flag state).

**Input Schema**:
```typescript
{
  sessionId: string;
  condition: {
    address?: number;           // Stop when PC reaches this address
    register?: {                // Stop when register matches
      reg: number;              // Register number (0-7)
      value: number;            // Value to match
      comparison?: string;      // "eq" | "ne" | "gt" | "lt" | "ge" | "le"
    };
    flag?: {                    // Stop when flag matches
      flag: string;             // "sign" | "zero" | "carry" | "overflow"
      value: boolean;           // Expected flag value
    };
  };
  maxInstructions?: number;     // Safety limit, default: 100000
}
```

**Output Schema**:
```typescript
{
  instructionsExecuted: number;
  stopped: boolean;
  reason: string;  // "condition_met" | "max_instructions" | "halted"
  conditionMet: boolean;
  state: { /* same as cp1600_step */ };
}
```

**Example**:
```typescript
// Input: Run until PC reaches $5020
{
  "sessionId": "abc123",
  "condition": { "address": 20512 }
}

// Output
{
  "instructionsExecuted": 42,
  "stopped": true,
  "reason": "condition_met",
  "conditionMet": true,
  "state": { "registers": [0,0,0,0,0,0,0,20512], /* ... */ }
}
```

**Errors**:
- `session_not_found`: Session ID does not exist
- `invalid_condition`: Condition syntax error

---

### cp1600_reset

**Description**: Reset CPU to initial state. Clears registers, flags, and cycle count. ROM remains loaded.

**Input Schema**:
```typescript
{
  sessionId: string;
}
```

**Output Schema**:
```typescript
{
  state: { /* initial state with registers at 0 */ };
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123" }

// Output
{
  "state": {
    "registers": [0, 0, 0, 0, 0, 0, 0, 20480],  // PC set to entry point
    "flags": { "sign": false, "zero": false, "carry": false, "overflow": false },
    "halted": false,
    "cycleCount": 0
  }
}
```

---

## State Inspection Tools

### cp1600_get_state

**Description**: Get complete CPU state snapshot.

**Input Schema**:
```typescript
{
  sessionId: string;
}
```

**Output Schema**:
```typescript
{
  registers: {
    r0: number;
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    r5: number;
    r6: number;  // Stack pointer
    r7: number;  // Program counter
  };
  flags: {
    sign: boolean;
    zero: boolean;
    carry: boolean;
    overflow: boolean;
  };
  halted: boolean;
  cycleCount: number;
  sdbd: boolean;  // SDBD prefix active
}
```

---

### cp1600_get_registers

**Description**: Get register values in various formats.

**Input Schema**:
```typescript
{
  sessionId: string;
  format?: string;  // "hex" | "dec" | "both" (default: "hex")
}
```

**Output Schema**:
```typescript
{
  registers: {
    r0: string;  // e.g., "0x002A" or "42" or "0x002A (42)"
    r1: string;
    // ... r2-r7
  };
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123", "format": "both" }

// Output
{
  "registers": {
    "r0": "0x0000 (0)",
    "r1": "0x002A (42)",
    "r2": "0x0064 (100)",
    "r3": "0x0000 (0)",
    "r4": "0x0100 (256)",
    "r5": "0x0000 (0)",
    "r6": "0x02F0 (752)",
    "r7": "0x500A (20490)"
  }
}
```

---

### cp1600_get_flags

**Description**: Get flag state with human-readable descriptions.

**Input Schema**:
```typescript
{
  sessionId: string;
}
```

**Output Schema**:
```typescript
{
  flags: {
    sign: { value: boolean; description: string; };
    zero: { value: boolean; description: string; };
    carry: { value: boolean; description: string; };
    overflow: { value: boolean; description: string; };
  };
  summary: string;  // e.g., "S=0 Z=1 C=0 OV=0"
}
```

**Example**:
```typescript
// Output
{
  "flags": {
    "sign": { "value": false, "description": "Result is positive" },
    "zero": { "value": true, "description": "Result is zero" },
    "carry": { "value": false, "description": "No carry/borrow" },
    "overflow": { "value": false, "description": "No signed overflow" }
  },
  "summary": "S=0 Z=1 C=0 OV=0"
}
```

---

### cp1600_disassemble

**Description**: Disassemble instructions from memory address.

**Input Schema**:
```typescript
{
  sessionId: string;
  address: number;      // Start address
  count?: number;       // Number of instructions (default: 10, max: 100)
}
```

**Output Schema**:
```typescript
{
  instructions: Array<{
    address: number;
    addressHex: string;  // e.g., "$5000"
    opcode: number;      // Raw 10-bit opcode
    mnemonic: string;    // e.g., "MVI R1, #$42"
    bytes: number[];     // Instruction words (1-3 decles)
    cycles: number;      // Cycle count (Phase 2)
  }>;
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123", "address": 20480, "count": 5 }

// Output
{
  "instructions": [
    {
      "address": 20480,
      "addressHex": "$5000",
      "opcode": 544,
      "mnemonic": "MVI R1, #$42",
      "bytes": [544],
      "cycles": 8
    },
    {
      "address": 20481,
      "addressHex": "$5001",
      "opcode": 96,
      "mnemonic": "ADDR R1, R2",
      "bytes": [96],
      "cycles": 6
    },
    // ... 3 more instructions
  ]
}
```

---

### cp1600_examine_memory

**Description**: Read memory range and format as hex/ASCII.

**Input Schema**:
```typescript
{
  sessionId: string;
  address: number;      // Start address
  length: number;       // Number of words (default: 16, max: 256)
  format?: string;      // "hex" | "dec" | "both" | "ascii" (default: "hex")
}
```

**Output Schema**:
```typescript
{
  address: number;
  length: number;
  data: number[];       // Raw 16-bit words
  formatted: string;    // Formatted output for display
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123", "address": 20480, "length": 16 }

// Output
{
  "address": 20480,
  "length": 16,
  "data": [544, 96, 832, 0, 1, 42, 100, 256, 0, 0, 752, 20490, 0, 0, 0, 0],
  "formatted":
    "$5000: 0220 0060 0340 0000 0001 002A 0064 0100\n" +
    "$5008: 0000 0000 02F0 500A 0000 0000 0000 0000"
}
```

---

## Breakpoint Tools

### cp1600_set_breakpoint

**Description**: Set a breakpoint at address or with condition.

**Input Schema**:
```typescript
{
  sessionId: string;
  address?: number;             // Address breakpoint
  condition?: string;           // JavaScript expression (advanced)
  enabled?: boolean;            // Default: true
}
```

**Output Schema**:
```typescript
{
  id: number;                   // Breakpoint ID
  address?: number;
  condition?: string;
  enabled: boolean;
}
```

**Example**:
```typescript
// Input: Simple address breakpoint
{ "sessionId": "abc123", "address": 20512 }

// Output
{ "id": 1, "address": 20512, "enabled": true }

// Input: Conditional breakpoint
{
  "sessionId": "abc123",
  "condition": "registers[4] === 0"  // Break when R4 == 0
}

// Output
{ "id": 2, "condition": "registers[4] === 0", "enabled": true }
```

**Errors**:
- `session_not_found`: Session ID does not exist
- `invalid_condition`: Condition syntax error

---

### cp1600_list_breakpoints

**Description**: List all breakpoints in session.

**Input Schema**:
```typescript
{
  sessionId: string;
}
```

**Output Schema**:
```typescript
{
  breakpoints: Array<{
    id: number;
    address?: number;
    condition?: string;
    enabled: boolean;
    hitCount: number;  // How many times breakpoint was hit
  }>;
}
```

**Example**:
```typescript
// Output
{
  "breakpoints": [
    { "id": 1, "address": 20512, "enabled": true, "hitCount": 3 },
    { "id": 2, "condition": "registers[4] === 0", "enabled": true, "hitCount": 0 }
  ]
}
```

---

### cp1600_clear_breakpoint

**Description**: Remove a breakpoint by ID or clear all.

**Input Schema**:
```typescript
{
  sessionId: string;
  id?: number;      // Breakpoint ID, or omit to clear all
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  cleared: number;  // Number of breakpoints removed
}
```

**Example**:
```typescript
// Input: Clear specific breakpoint
{ "sessionId": "abc123", "id": 1 }

// Output
{ "success": true, "cleared": 1 }

// Input: Clear all breakpoints
{ "sessionId": "abc123" }

// Output
{ "success": true, "cleared": 2 }
```

---

## Trace Tools

### cp1600_enable_trace

**Description**: Enable execution trace buffer for session.

**Input Schema**:
```typescript
{
  sessionId: string;
  bufferSize?: number;  // Default: 1000, Range: 100-10000
}
```

**Output Schema**:
```typescript
{
  enabled: boolean;
  bufferSize: number;
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123", "bufferSize": 5000 }

// Output
{ "enabled": true, "bufferSize": 5000 }
```

---

### cp1600_get_trace

**Description**: Retrieve execution trace entries.

**Input Schema**:
```typescript
{
  sessionId: string;
  count?: number;  // Number of most recent entries (default: 100, max: 1000)
}
```

**Output Schema**:
```typescript
{
  trace: Array<{
    instructionNumber: number;  // Sequential count
    address: number;            // PC at fetch
    addressHex: string;         // e.g., "$5000"
    mnemonic: string;           // Disassembled instruction
    registersBefore: number[];  // [R0-R7] before execution
    registersAfter: number[];   // [R0-R7] after execution
    flagsAfter: {               // Flags after execution
      sign: boolean;
      zero: boolean;
      carry: boolean;
      overflow: boolean;
    };
    memoryWrites: Array<{       // Memory changes during instruction
      address: number;
      oldValue: number;
      newValue: number;
    }>;
    cycles: number;             // Cycles consumed (Phase 2)
  }>;
}
```

**Example**:
```typescript
// Input
{ "sessionId": "abc123", "count": 3 }

// Output
{
  "trace": [
    {
      "instructionNumber": 1,
      "address": 20480,
      "addressHex": "$5000",
      "mnemonic": "MVI R1, #$42",
      "registersBefore": [0, 0, 0, 0, 0, 0, 752, 20480],
      "registersAfter": [0, 66, 0, 0, 0, 0, 752, 20481],
      "flagsAfter": { "sign": false, "zero": false, "carry": false, "overflow": false },
      "memoryWrites": [],
      "cycles": 8
    },
    {
      "instructionNumber": 2,
      "address": 20481,
      "addressHex": "$5001",
      "mnemonic": "ADDR R1, R2",
      "registersBefore": [0, 66, 0, 0, 0, 0, 752, 20481],
      "registersAfter": [0, 66, 66, 0, 0, 0, 752, 20482],
      "flagsAfter": { "sign": false, "zero": false, "carry": false, "overflow": false },
      "memoryWrites": [],
      "cycles": 6
    },
    // ... 1 more entry
  ]
}
```

---

## Resources

### cp1600://sessions/{id}/state

**Description**: Current CPU state as dynamic resource.

**URI Pattern**: `cp1600://sessions/{sessionId}/state`

**MIME Type**: `application/json`

**Content**:
```json
{
  "registers": { "r0": 0, "r1": 42, /* ... */ },
  "flags": { "sign": false, "zero": false, "carry": false, "overflow": false },
  "halted": false,
  "cycleCount": 64
}
```

**Update Frequency**: After every instruction execution

---

### cp1600://sessions/{id}/trace

**Description**: Recent execution trace as dynamic resource.

**URI Pattern**: `cp1600://sessions/{sessionId}/trace`

**MIME Type**: `text/plain`

**Content**:
```
$5000: MVI R1, #$42       | R0=0000 R1=0000→002A R7=5000→5001 | Z=0 S=0
$5001: ADDR R1, R2        | R1=002A R2=0000→002A R7=5001→5002 | Z=0 S=0
$5002: MVO@ R2, R4        | R2=002A R4=0100→0101 [@0100]=002A | Z=0 S=0
...
```

**Update Frequency**: After every instruction execution

---

### cp1600://sessions/{id}/memory/{start}/{end}

**Description**: Memory range as dynamic resource.

**URI Pattern**: `cp1600://sessions/{sessionId}/memory/{startAddress}/{endAddress}`

**MIME Type**: `application/octet-stream` or `application/json`

**Content** (JSON format):
```json
{
  "start": 20480,
  "end": 20495,
  "data": [544, 96, 832, 0, 1, 42, 100, 256, 0, 0, 752, 20490, 0, 0, 0, 0]
}
```

---

## Usage Patterns

### Pattern 1: Load and Step Through ROM

```typescript
// 1. Create session
const { sessionId } = await cp1600_create_session();

// 2. Load ROM
await cp1600_load_rom({ sessionId, romPath: "test.bin" });

// 3. Step through a few instructions
for (let i = 0; i < 10; i++) {
  const result = await cp1600_step({ sessionId, count: 1 });
  console.log(`PC: ${result.state.registers[7]}, Flags: ${result.state.flags}`);
}
```

### Pattern 2: Debug a Crash

```typescript
// 1. Load ROM and set breakpoint at crash address
const { sessionId } = await cp1600_create_session();
await cp1600_load_rom({ sessionId, romPath: "buggy.bin" });
await cp1600_set_breakpoint({ sessionId, address: 0x5020 });

// 2. Run until breakpoint
const result = await cp1600_run({ sessionId });
console.log(`Stopped at: ${result.stoppedAt}, reason: ${result.reason}`);

// 3. Examine state
const state = await cp1600_get_state({ sessionId });
console.log(`Registers: ${state.registers}`);

// 4. Get execution history leading to crash
const trace = await cp1600_get_trace({ sessionId, count: 20 });
trace.trace.forEach(entry => {
  console.log(`${entry.addressHex}: ${entry.mnemonic}`);
});
```

### Pattern 3: Find Uninitialized Register

```typescript
// 1. Set conditional breakpoint: break when R4 == 0 and it's being used
await cp1600_set_breakpoint({
  sessionId,
  condition: "registers[4] === 0 && mnemonic.includes('@R4')"
});

// 2. Run until condition met
const result = await cp1600_run({ sessionId });

// 3. Disassemble around problem
const disasm = await cp1600_disassemble({
  sessionId,
  address: result.stoppedAt - 5,
  count: 10
});
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "session_not_found",
    "message": "Session abc123 not found. Use cp1600_create_session or cp1600_list_sessions to see active sessions.",
    "details": {
      "sessionId": "abc123",
      "availableSessions": ["xyz789"]
    }
  }
}
```

### Error Codes

| Code | Description | Recovery |
|------|-------------|----------|
| `session_not_found` | Session ID does not exist | Create new session or check session list |
| `session_exists` | Session ID already exists | Use different ID or destroy existing session |
| `no_rom_loaded` | ROM must be loaded before execution | Load ROM with cp1600_load_rom |
| `file_not_found` | ROM file not found at path | Check file path, use absolute path |
| `invalid_rom` | ROM format not recognized | Verify ROM file is valid CP-1600 binary |
| `rom_too_large` | ROM exceeds available memory | Use smaller ROM or different load address |
| `invalid_address` | Address out of range (0x0000-0xFFFF) | Use valid 16-bit address |
| `invalid_condition` | Breakpoint condition syntax error | Check JavaScript expression syntax |
| `invalid_count` | Count parameter out of range | Use value within documented range |
| `execution_error` | Error during instruction execution | Check trace, may be CPU bug |

### Error Message Philosophy

- **Self-explanatory**: Error messages should explain what went wrong
- **Contextual**: Include relevant context (session ID, address, etc.)
- **Actionable**: Suggest how to fix the problem
- **Examples**: Point to tools or commands that might help

**Good Error Message**:
```
"Session abc123 not found. Use cp1600_create_session to create a new session,
or cp1600_list_sessions to see active sessions. Available sessions: [xyz789]"
```

**Bad Error Message**:
```
"Session not found"
```

---

## Versioning

### API Stability

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backwards-compatible)
- **PATCH**: Bug fixes (backwards-compatible)

**Current Version**: `0.1.0` (Pre-release)

### Breaking Changes

Breaking changes will be announced in:
1. CHANGELOG.md
2. Release notes
3. Deprecation warnings (1 minor version advance notice)

**Example Deprecation**:
```json
{
  "warning": "cp1600_get_registers format parameter will be removed in v1.0.0. Use cp1600_format_value tool instead.",
  "deprecatedIn": "0.9.0",
  "removedIn": "1.0.0"
}
```

### Version Negotiation

**Client specifies required version:**
```json
{
  "requiredVersion": "0.1.x",
  "clientName": "Claude Desktop",
  "clientVersion": "1.2.3"
}
```

**Server responds with compatibility:**
```json
{
  "serverVersion": "0.1.5",
  "compatible": true,
  "features": ["basic-execution", "breakpoints", "tracing"]
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-08 | Peter/Claude | Initial MCP API specification |

---

**Next Steps:**
1. ✅ PRD.md complete
2. ✅ ARCHITECTURE.md complete
3. ✅ CPU_SPECIFICATION.md complete
4. ✅ MCP_API.md complete (this document)
5. ⏳ PROJECT_SETUP.md (repository structure and build setup)
6. ⏳ USER_GUIDE.md (provisional user documentation)
