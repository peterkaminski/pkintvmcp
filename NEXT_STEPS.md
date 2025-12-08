# pkIntvMCP - Next Steps

**Updated:** 2025-12-08 (v1.2)

## PRD Updates Complete (v1.2)

The PRD has been restructured with:

✅ **Sprint/Milestone Structure**: Completion-based instead of calendar-based  
✅ **Clear "Done When" Criteria**: Each sprint has concrete deliverables  
✅ **Phase Gates**: Milestones validate readiness for next phase  
✅ **Flexible Progression**: Can tackle sprints in bursts, AI-accelerated or manual  
✅ **PROJECT_SETUP.md**: Added to core documentation set (Sprint 1.1)  

## Current Status: Sprint 1.1 (Foundation & Documentation)

### Sprint 1.1 Deliverables

**Core Documentation Set** (must complete before coding):

1. ✅ **PRD.md** - Product requirements (COMPLETE v1.2)
2. ⏳ **ARCHITECTURE.md** - System design and technical decisions
3. ⏳ **CPU_SPECIFICATION.md** - CP-1600 implementation details  
4. ⏳ **MCP_API.md** - Complete MCP interface specification
5. ⏳ **PROJECT_SETUP.md** - Repository structure, build system, conventions
6. ⏳ **USER_GUIDE.md** (Provisional) - Design-driven development guide

**Infrastructure:**
- Set up monorepo structure
- Initialize TypeScript + testing framework
- Skeleton code compiles
- Tests run

**Sprint 1.1 Done When**: All docs complete, project builds, tests run

---

## Next Document: ARCHITECTURE.md or PROJECT_SETUP.md?

Two options for next document:

### Option A: ARCHITECTURE.md (Technical Design)
**Purpose**: Define the "how" of implementation  
**Contents**:
- System overview diagram
- Component design (packages/core, packages/mcp-cpu, etc.)
- Data flow (ROM → Decoder → Executor → MCP)
- Module boundaries and interfaces
- State management strategy
- Technology stack decisions (TypeScript, testing framework, etc.)
- Extension points for Phase 3 peripherals

**Why first**: Establishes technical foundation, guides PROJECT_SETUP

### Option B: PROJECT_SETUP.md (Structure & Conventions)
**Purpose**: Define the "where" and "what" of organization  
**Contents**:
- Monorepo structure (packages/, docs/, test-roms/)
- Package layout (core, mcp-cpu, mcp-system, validation, cli, web)
- Build system (Turborepo, TypeScript config, npm scripts)
- Testing strategy (Jest/Vitest, unit/integration split)
- Code organization conventions (file naming, exports, etc.)
- Development workflow (local dev, testing, validation)
- Git workflow and branch strategy

**Why first**: Concrete structure, can start building skeleton immediately

**Recommendation**: ARCHITECTURE → PROJECT_SETUP → CPU_SPEC → MCP_API → USER_GUIDE  
(Architecture informs setup, setup enables specification work)

---

## Document Outlines for Claude Code

### ARCHITECTURE.md Structure

**1. System Overview**
- High-level diagram (text-based)
- Component relationships (core ↔ mcp-cpu ↔ mcp-system)
- Data flow: ROM → Memory → Decoder → Executor → MCP

**2. Package Architecture**
- `packages/core`: Emulator core (CPU, Memory, Decoder, Executor)
- `packages/mcp-cpu`: CPU-only MCP server
- `packages/mcp-system`: Full system MCP server (Phase 3)
- `packages/validation`: jzIntv integration tools
- `packages/cli`: Optional CLI debugger
- `packages/web`: Optional web UI (Phase 4)

**3. Core Module Design**
- CPU class: state, registers, flags, execution
- Memory class: 64K words, ROM/RAM distinction
- Decoder class: 10-bit → Instruction structure
- Executor class: instruction → state changes
- Types: Instruction, CPUState, Flags, etc.

**4. MCP Server Design**
- SessionManager: multiple simulator instances
- Tools: handlers for each MCP tool
- Resources: state/trace/memory providers
- Protocol: MCP SDK integration

**5. State Management**
- CPU state serialization (for save/restore)
- Deterministic execution (same input = same output)
- Trace buffer (circular, configurable size)

**6. Technology Decisions**
- TypeScript (strict mode)
- Testing: Jest or Vitest
- Build: Turborepo for monorepo
- Why JavaScript not Python (accessibility, web UI potential)

**7. Extension Points**
- How peripherals will plug in (Phase 3)
- Plugin architecture for custom tools
- Resource providers for custom data

---

### PROJECT_SETUP.md Structure

**1. Repository Structure**
```
pkIntvMCP/
├── packages/
│   ├── core/           # Emulator core
│   ├── mcp-cpu/        # CPU MCP server
│   ├── mcp-system/     # Full system (Phase 3)
│   ├── validation/     # jzIntv integration
│   ├── cli/            # Optional CLI
│   └── web/            # Optional web UI
├── docs/               # All documentation
├── test-roms/          # Test ROM collection
├── package.json        # Root package
├── turbo.json          # Turborepo config
└── tsconfig.json       # Shared TS config
```

**2. Package Details**
- Each package: purpose, dependencies, exports
- Internal structure (src/, test/, types/)
- Build outputs (dist/)

**3. Build System**
- Turborepo orchestration
- npm scripts (build, test, validate)
- TypeScript compilation
- Watch mode for development

**4. Testing Strategy**
- Unit tests: per-instruction, per-module
- Integration tests: multi-instruction sequences
- Validation tests: vs jzIntv
- Test organization (co-located vs separate)

**5. Code Conventions**
- File naming: kebab-case
- Class naming: PascalCase
- Function naming: camelCase
- Types: separate .types.ts files
- Exports: barrel exports (index.ts)

**6. Development Workflow**
- Local development setup
- Running tests
- Running validation
- Debugging the simulator

**7. Git Workflow**
- Branch strategy (main, develop, feature/*)
- Commit conventions
- PR process (when ready)

---

### CPU_SPECIFICATION.md Structure

**1. Instruction Set Overview**
- Categories: arithmetic, logic, data movement, control flow, shifts, misc
- Addressing modes: direct, indirect, immediate, register
- SDBD prefix behavior

**2. Instruction Details** (all ~50)
For each instruction:
- Mnemonic and variants
- Opcode format (10-bit pattern)
- Operands and addressing modes
- Operation description (pseudocode)
- Flag effects (C, OV, Z, S)
- Cycle timing (base + memory accesses)
- Edge cases and notes
- Test requirements

**3. Bit-Level Operations in TypeScript**
- Masking strategy (toUint16, toUint10)
- Flag calculation (especially overflow)
- Shift operations (>>>, not >>)
- SDBD handling
- Code examples

**4. Flag Semantics**
- Carry: ADD/SUB carry out
- Overflow: signed overflow detection
- Zero: result == 0
- Sign: bit 15 (or bit 7 for some ops)
- Which instructions affect which flags

**5. Memory System**
- 16-bit words
- Address space (ROM, RAM, MMIO regions)
- Wait states (future)

**6. Edge Cases**
- SDBD with different addressing modes
- Interrupts (Phase 3)
- Stack operations (R6 pre/post increment)
- Register aliasing (R7 = PC)

**7. Validation Strategy**
- Unit test structure
- Test data sources
- Coverage requirements (>90%)

---

### MCP_API.md Structure

**1. Overview**
- Purpose: enable Claude to debug CP-1600 programs
- Protocol: MCP standard
- Server types: mcp-cpu (Phase 1), mcp-system (Phase 3)

**2. Tools Reference**
For each tool (30+ total):
- Name and purpose
- Input schema (TypeScript/JSON)
- Output schema
- Examples
- Error cases

**3. Resources Reference**
For each resource (10+ total):
- URI pattern
- MIME type
- Format
- Update frequency
- Examples

**4. Usage Patterns**
- Session lifecycle
- Common debugging workflows
- Tool combinations
- Resource polling

**5. Error Handling**
- Error codes
- Error messages
- Recovery strategies

**6. Versioning**
- API stability
- Breaking changes
- Deprecation policy

---

### USER_GUIDE.md (Provisional) Structure

**1. Introduction**
- What is pkIntvMCP
- What can Claude help with
- Prerequisites

**2. Quick Start**
- Installing the MCP server
- Claude Desktop configuration
- First debugging session

**3. Common Workflows**
- Loading a ROM
- Stepping through code
- Setting breakpoints
- Inspecting state
- Finding a bug
- Understanding flag behavior

**4. Example Debugging Sessions**
- "Why does my ROM crash at 0x5020?"
- "How does this subroutine work?"
- "Where is this variable stored?"
- "Why isn't my sprite moving?"

**5. Advanced Features**
- Conditional breakpoints
- Trace analysis
- Performance profiling

**6. Tips & Tricks**
- Best questions to ask Claude
- How to provide context
- Iterative debugging

**7. Troubleshooting**
- Server won't start
- ROM won't load
- Unexpected behavior

---

## Resources Available

**In Project:**
- `/home/claude/intellivision-mcp/docs/` - all docs
- PRD v1.2 (complete)
- CP-1600 instruction set markdown
- Your Friend The EXEC PDF (in context window)

**For Reference:**
- CP-1600 Users Manual (cycle timing on page 53+)
- De Re Intellivision chapters
- jzIntv source code

---
