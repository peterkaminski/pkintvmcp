# pkIntvMCP - Project Setup Guide

**Version:** 1.0
**Date:** 2025-12-08
**Status:** Draft
**Phase:** Sprint 1.1 (Foundation & Documentation)

---

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [Package Details](#package-details)
3. [Build System](#build-system)
4. [Testing Strategy](#testing-strategy)
5. [Code Conventions](#code-conventions)
6. [Development Workflow](#development-workflow)
7. [Git Workflow](#git-workflow)

---

## Repository Structure

### Top-Level Layout

```
pkIntvMCP/
├── packages/                  # Monorepo packages
│   ├── core/                  # Emulator core
│   ├── mcp-cpu/               # CPU-only MCP server
│   ├── mcp-system/            # Full system MCP server (Phase 3)
│   ├── validation/            # jzIntv integration tools
│   ├── cli/                   # Optional CLI debugger
│   └── web/                   # Optional web UI (Phase 4)
├── docs/                      # Documentation
│   ├── PRD_v1.2.md            # Product requirements
│   ├── ARCHITECTURE.md        # Technical architecture
│   ├── CPU_SPECIFICATION.md   # Instruction set details
│   ├── MCP_API.md             # MCP interface reference
│   ├── PROJECT_SETUP.md       # This document
│   ├── USER_GUIDE.md          # User documentation
│   └── adr/                   # Architecture Decision Records
├── test-roms/                 # Test ROM collection
│   ├── basic-ops.rom          # Basic operations test
│   ├── branches.rom           # Branch instructions test
│   ├── stack.rom              # Stack operations test
│   └── air-strike.bin         # Commercial ROM for validation
├── resources/                 # Non-open-source background materials
│   └── [excluded from git]    # Design conversations, restricted docs
├── .gitignore                 # Git exclusions
├── package.json               # Root package (Turborepo)
├── turbo.json                 # Turborepo configuration
├── tsconfig.json              # Shared TypeScript configuration
├── README.md                  # Project overview
├── LICENSE                    # Open source license
└── CLAUDE.md                  # Claude Code project instructions

Total estimated files: ~150-200 files (Phase 1)
```

---

## Package Details

### packages/core

**Purpose:** Pure emulator implementation with no I/O dependencies

**Package.json:**
```json
{
  "name": "@pkintvmcp/core",
  "version": "0.1.0",
  "description": "CP-1600 CPU emulator core",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "eslint": "^8.55.0"
  }
}
```

**Structure:**
```
packages/core/
├── src/
│   ├── cpu/
│   │   ├── cpu.ts              # CPU class implementation
│   │   ├── cpu.types.ts        # CPUState, Flags interfaces
│   │   └── cpu.test.ts         # Unit tests
│   ├── memory/
│   │   ├── memory.ts           # Memory class
│   │   ├── memory.types.ts     # MemoryRegion, MemoryMap
│   │   └── memory.test.ts      # Unit tests
│   ├── decoder/
│   │   ├── decoder.ts          # Instruction decoder
│   │   ├── decoder.types.ts    # Instruction, Opcode, AddressingMode
│   │   └── decoder.test.ts     # Unit tests
│   ├── executor/
│   │   ├── executor.ts         # Main executor class
│   │   ├── instructions/       # Instruction implementations
│   │   │   ├── arithmetic.ts   # ADD, SUB, INC, DEC, ADC, NEG
│   │   │   ├── logic.ts        # AND, XOR, OR
│   │   │   ├── movement.ts     # MOV, MVI, MVO
│   │   │   ├── control.ts      # B, BEQ, J, JSR
│   │   │   ├── stack.ts        # PSHR, PULR
│   │   │   ├── shifts.ts       # SLL, SLR, SAR, RLC, RRC, SWAP
│   │   │   └── misc.ts         # SDBD, NOP, HLT, GSWD, RSWD
│   │   ├── executor.types.ts   # InstructionHandler type
│   │   └── executor.test.ts    # Integration tests
│   ├── trace/
│   │   ├── trace-buffer.ts     # Circular trace buffer
│   │   ├── trace-buffer.types.ts
│   │   └── trace-buffer.test.ts
│   ├── utils/
│   │   ├── bit-ops.ts          # toUint16, toUint10, flag helpers
│   │   └── bit-ops.test.ts
│   └── index.ts                # Barrel export
├── dist/                       # Build output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

**Exports:**
```typescript
// packages/core/src/index.ts
export { CPU } from './cpu/cpu.js';
export { Memory } from './memory/memory.js';
export { Decoder } from './decoder/decoder.js';
export { Executor } from './executor/executor.js';
export { TraceBuffer } from './trace/trace-buffer.js';

export type { CPUState, Flags } from './cpu/cpu.types.js';
export type { Instruction, Opcode, AddressingMode } from './decoder/decoder.types.js';
export type { TraceEntry, MemoryWrite } from './trace/trace-buffer.types.js';
```

**Dependencies:** None (pure TypeScript)

**Key Characteristics:**
- No file I/O, no network, no Node.js-specific APIs
- Can run in browser or Node.js
- Fully deterministic
- Heavily unit tested (>90% coverage target)

---

### packages/mcp-cpu

**Purpose:** MCP server for CPU-only debugging (Phase 1)

**Package.json:**
```json
{
  "name": "@pkintvmcp/mcp-cpu",
  "version": "0.1.0",
  "description": "MCP server for CP-1600 debugging",
  "bin": {
    "pkintvmcp-cpu": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@pkintvmcp/core": "workspace:*",
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.10.0"
  }
}
```

**Structure:**
```
packages/mcp-cpu/
├── src/
│   ├── server.ts               # MCP server initialization
│   ├── session-manager.ts      # Multi-session management
│   ├── session-manager.types.ts
│   ├── tools/
│   │   ├── execution.ts        # load_rom, step, run, run_until, reset
│   │   ├── inspection.ts       # get_state, get_registers, get_flags, etc.
│   │   ├── breakpoints.ts      # set/clear/list breakpoints
│   │   ├── trace.ts            # enable_trace, get_trace
│   │   └── index.ts            # Tool registry
│   ├── resources/
│   │   ├── state-resource.ts   # cp1600://sessions/{id}/state
│   │   ├── trace-resource.ts   # cp1600://sessions/{id}/trace
│   │   ├── memory-resource.ts  # cp1600://sessions/{id}/memory/{start}/{end}
│   │   └── index.ts
│   ├── types.ts                # MCP-specific types
│   └── index.ts                # Main entry point
├── dist/                       # Build output
├── package.json
├── tsconfig.json
└── README.md
```

**Entry Point:**
```typescript
#!/usr/bin/env node
// packages/mcp-cpu/src/index.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SessionManager } from './session-manager.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';

async function main() {
  const sessionManager = new SessionManager();

  const server = new Server({
    name: 'pkIntvMCP',
    version: '0.1.0',
  }, {
    capabilities: {
      tools: {},
      resources: {},
    },
  });

  registerTools(server, sessionManager);
  registerResources(server, sessionManager);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('pkIntvMCP server running on stdio');
}

main().catch(console.error);
```

---

### packages/validation

**Purpose:** jzIntv integration for validation testing

**Package.json:**
```json
{
  "name": "@pkintvmcp/validation",
  "version": "0.1.0",
  "description": "jzIntv integration for validation",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "validate": "node dist/validate.js"
  },
  "dependencies": {
    "@pkintvmcp/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.10.0"
  }
}
```

**Structure:**
```
packages/validation/
├── src/
│   ├── jzintv-wrapper.ts       # Subprocess wrapper for jzIntv
│   ├── trace-parser.ts         # Parse jzIntv trace output
│   ├── compare-traces.ts       # Compare pkIntvMCP vs jzIntv traces
│   ├── validate.ts             # Main validation harness
│   └── index.ts
├── jzintv/                     # jzIntv source (gitignored, downloaded)
│   └── patches/                # Minimal patches for trace output
├── dist/
├── package.json
└── README.md
```

---

### packages/cli (Optional)

**Purpose:** Command-line debugger interface

**Structure:**
```
packages/cli/
├── src/
│   ├── repl.ts                 # Interactive REPL
│   ├── commands.ts             # Command implementations
│   └── index.ts
├── dist/
├── package.json
└── README.md
```

---

### packages/web (Optional, Phase 4)

**Purpose:** Web-based debugger UI

**Structure:**
```
packages/web/
├── src/
│   ├── components/             # React components
│   ├── App.tsx                 # Main app
│   └── index.tsx
├── public/
├── package.json
└── README.md
```

---

## Build System

### Turborepo Configuration

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
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
    },
    "validate": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

**Root package.json:**
```json
{
  "name": "pkintvmcp",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "lint": "turbo run lint",
    "validate": "turbo run validate",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### TypeScript Configuration

**Root tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Per-package tsconfig.json:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../core" }  // For packages that depend on core
  ]
}
```

### Build Commands

**Build all packages:**
```bash
npm run build
```

**Build single package:**
```bash
cd packages/core
npm run build
```

**Watch mode (development):**
```bash
cd packages/core
npm run test:watch
```

**Clean build:**
```bash
npm run clean
npm run build
```

---

## Testing Strategy

### Test Organization

**Co-located Tests:**
```
cpu.ts          # Implementation
cpu.test.ts     # Unit tests (same directory)
```

**Test Types:**
1. **Unit tests**: Test individual modules in isolation
2. **Integration tests**: Test instruction execution end-to-end
3. **Validation tests**: Compare against jzIntv (packages/validation)

### Vitest Configuration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.types.ts',
      ],
      thresholds: {
        statements: 90,  // Phase 1 target
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
```

### Test Structure Example

```typescript
// packages/core/src/cpu/cpu.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { CPU } from './cpu.js';
import { Memory } from '../memory/memory.js';

describe('CPU', () => {
  let cpu: CPU;
  let memory: Memory;

  beforeEach(() => {
    memory = new Memory();
    cpu = new CPU(memory);
  });

  describe('reset', () => {
    test('sets all registers to 0', () => {
      cpu.setRegister(0, 123);
      cpu.setRegister(1, 456);
      cpu.reset();

      expect(cpu.getRegister(0)).toBe(0);
      expect(cpu.getRegister(1)).toBe(0);
    });

    test('clears all flags', () => {
      cpu.flags.zero = true;
      cpu.flags.carry = true;
      cpu.reset();

      expect(cpu.flags.zero).toBe(false);
      expect(cpu.flags.carry).toBe(false);
    });
  });

  describe('register access', () => {
    test('R7 is program counter', () => {
      cpu.setRegister(7, 0x5000);
      expect(cpu.getRegister(7)).toBe(0x5000);
      expect(cpu.pc).toBe(0x5000);  // Alias
    });
  });
});
```

### Running Tests

**All tests:**
```bash
npm test
```

**Single package:**
```bash
cd packages/core
npm test
```

**Watch mode:**
```bash
npm run test:watch
```

**Coverage report:**
```bash
npm test -- --coverage
```

### Coverage Targets

**Phase 1:**
- Overall: >90% line coverage
- Core modules (CPU, Memory, Decoder, Executor): >95%
- Critical paths (instruction execution): 100%

**Phase 2:**
- Overall: >95% line coverage
- All modules: >90%

---

## Code Conventions

### File Naming

- **Source files**: kebab-case
  - `cpu-state.ts`, `trace-buffer.ts`, `bit-ops.ts`
- **Test files**: `*.test.ts`
  - `cpu.test.ts`, `memory.test.ts`
- **Type files**: `*.types.ts`
  - `cpu.types.ts`, `decoder.types.ts`

### Class Naming

- **Classes**: PascalCase
  - `CPU`, `Memory`, `Decoder`, `TraceBuffer`

### Function/Method Naming

- **Functions**: camelCase
  - `getState()`, `incrementPC()`, `loadROM()`
- **Private methods**: Prefix with `_` (optional)
  - `_resolveOperand()`, `_updateFlags()`

### Type Naming

- **Interfaces**: PascalCase
  - `CPUState`, `Instruction`, `AddressingMode`
- **Type aliases**: PascalCase
  - `Opcode`, `Flags`, `Register`
- **Enums**: PascalCase
  - `enum Opcode { ADD, SUB, ... }`

### Constants

- **Constants**: UPPER_SNAKE_CASE
  - `MAX_MEMORY_SIZE`, `DEFAULT_TRACE_BUFFER_SIZE`
- **Exported constants**: UPPER_SNAKE_CASE
  - `export const DEFAULT_STACK_ADDRESS = 0x02F0;`

### Module Organization

**Barrel Exports:**
```typescript
// packages/core/src/index.ts
export { CPU } from './cpu/cpu.js';
export { Memory } from './memory/memory.js';
// ... more exports

export type { CPUState } from './cpu/cpu.types.js';
export type { Instruction } from './decoder/decoder.types.js';
// ... more type exports
```

**Import Style:**
```typescript
// Named imports
import { CPU, Memory } from '@pkintvmcp/core';
import type { CPUState, Instruction } from '@pkintvmcp/core';

// Not default exports
// import CPU from '@pkintvmcp/core';  // Avoid this
```

### Comments & Documentation

**JSDoc for Public APIs:**
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
  // Implementation
}
```

**Inline comments for complex logic:**
```typescript
// Calculate signed overflow: overflow occurs when both operands have
// the same sign but the result has a different sign
const signA = (a & 0x8000) !== 0;
const signB = (b & 0x8000) !== 0;
const signR = (result & 0x8000) !== 0;
const overflow = (signA === signB) && (signR !== signA);
```

**TODO comments:**
```typescript
// TODO(Phase 2): Implement exact cycle timing
// TODO(Phase 3): Add peripheral I/O handling
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone https://github.com/peterkaminski/pkintvmcp.git
cd pkintvmcp

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### Development Loop

**1. Make changes to core:**
```bash
cd packages/core
# Edit files in src/
npm run test:watch  # Run tests in watch mode
```

**2. Test MCP server:**
```bash
cd packages/mcp-cpu
npm run build
npm run start  # Starts MCP server on stdio

# In another terminal:
# Configure Claude Desktop to use local server
# Edit ~/.config/claude/claude_desktop_config.json
```

**3. Run validation:**
```bash
npm run validate  # Compare against jzIntv
```

### Debugging

**Node.js debugging:**
```bash
node --inspect-brk dist/index.js
# Attach Chrome DevTools or VS Code debugger
```

**VS Code launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/packages/mcp-cpu/dist/index.js",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/packages/*/dist/**/*.js"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Git Workflow

### Branch Strategy

**Main branch:** `main`
- Always stable, buildable, tests passing
- Direct commits allowed during early development (pre-v1.0)
- Protected once project reaches v1.0

**Feature branches** (optional, for larger features):
- `feature/instruction-decoder`
- `feature/trace-buffer`
- Merge to `main` via pull request

**Sprint branches** (optional):
- `sprint/1.2-decoder`
- `sprint/1.3-executor`

### Commit Conventions

**Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build system, dependencies

**Examples:**
```
feat: implement MVI instruction decoder

Add decoder logic for MVI (Move Immediate) instruction including
10-bit and 16-bit immediate modes with SDBD prefix handling.

Closes #42
```

```
fix: correct overflow flag calculation in ADD

The overflow detection was incorrectly checking unsigned carry
instead of signed overflow. Updated to detect when both operands
have the same sign but result has different sign.

Fixes #87
```

### Pull Request Process (Phase 2+)

1. Create feature branch
2. Make changes, add tests
3. Ensure all tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Create pull request
6. Code review
7. Merge to main

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-08 | Peter/Claude | Initial project setup guide |

---

**Next Steps:**
1. ✅ PRD.md complete
2. ✅ ARCHITECTURE.md complete
3. ✅ CPU_SPECIFICATION.md complete
4. ✅ MCP_API.md complete
5. ✅ PROJECT_SETUP.md complete (this document)
6. ⏳ USER_GUIDE.md (provisional user documentation)

**Ready to Initialize Project:**
```bash
# Create monorepo structure
mkdir -p packages/{core,mcp-cpu,validation,cli,web}
mkdir -p docs test-roms

# Initialize packages
cd packages/core && npm init -y
cd ../mcp-cpu && npm init -y
# ... etc

# Setup Turborepo
npm install -D turbo
npm install

# First build
npm run build
```
