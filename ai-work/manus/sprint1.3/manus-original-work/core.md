# @emulator/core

Core emulator package with CPU, executor, and utilities for building a 16-bit CPU emulator.

## Overview

This package provides the foundational components for emulating a 16-bit CPU with register-based architecture. It includes CPU state management, instruction execution, memory interfaces, and bit manipulation utilities.

## Features

- **CPU Implementation** — 8 registers (R0-R7), 4 status flags (C, OV, Z, S), cycle counting
- **Instruction Execution** — Data movement (MOVR, MVI, MVO) with proper flag handling
- **Memory Interface** — Abstract memory interface for RAM/ROM integration
- **Bit Operations** — Utilities for 16-bit, 10-bit conversions and bit manipulation
- **Type Safety** — Full TypeScript support with strict mode enabled
- **Comprehensive Tests** — 132 passing tests with high coverage

## Installation

```bash
npm install @emulator/core
```

## Usage

### Basic Example

```typescript
import { CPU, Executor, Opcode } from '@emulator/core';

// Create CPU instance
const cpu = new CPU();

// Create memory (implement Memory interface)
const memory = new MyMemoryImplementation();

// Create executor
const executor = new Executor(cpu, memory);

// Execute an instruction
executor.execute({
  opcode: Opcode.MVI,
  operands: [0x1234, 0], // Load 0x1234 into R0
});

// Check register value
console.log(cpu.getRegister(0)); // 0x1234

// Check CPU state
const state = cpu.getState();
console.log(state.flags); // { C: false, OV: false, Z: false, S: false }
console.log(state.cycles); // 8
```

### CPU Operations

```typescript
// Register access
cpu.setRegister(0, 0x1234);
const value = cpu.getRegister(0);

// Program counter
cpu.setPC(0x1000);
cpu.incrementPC();
const pc = cpu.getPC();

// Flags
cpu.setFlags({ Z: true, S: false });
const flags = cpu.getFlags();

// State management
const state = cpu.getState(); // Deep copy
cpu.setState(state);
cpu.reset();

// Cycle counting
cpu.addCycles(6);
const cycles = cpu.getCycles();
```

### Instruction Execution

```typescript
// MOVR - Move register to register
executor.execute({
  opcode: Opcode.MOVR,
  operands: [0, 1], // R0 -> R1
});

// MVI - Move immediate to register
executor.execute({
  opcode: Opcode.MVI,
  operands: [0xABCD, 2], // #0xABCD -> R2
  sdbd: false, // 8 cycles (10 if true)
});

// MVO - Move register to memory
executor.execute({
  opcode: Opcode.MVO,
  operands: [0, 0x1000], // R0 -> [0x1000]
});
```

### Bit Operations

```typescript
import { toUint16, toInt16, toUint10, getBit, setBit, clearBit } from '@emulator/core';

// Type conversions
const wrapped = toUint16(0x10000); // 0x0000
const signed = toInt16(0xFFFF); // -1
const masked = toUint10(0x0FFF); // 0x03FF

// Bit manipulation
const bit = getBit(0x8000, 15); // 1
const set = setBit(0x0000, 15); // 0x8000
const cleared = clearBit(0xFFFF, 15); // 0x7FFF
```

## API Reference

### CPU Class

**Constructor**
- `new CPU()` — Creates CPU with initialized state

**Register Methods**
- `getRegister(index: number): number` — Get register value (0-7)
- `setRegister(index: number, value: number): void` — Set register value
- `getPC(): number` — Get program counter (R7)
- `setPC(val: number): void` — Set program counter
- `incrementPC(): void` — Increment PC with wrapping

**Flag Methods**
- `getFlags(): CPUFlags` — Get flag state (copy)
- `setFlags(partial: Partial<CPUFlags>): void` — Update flags

**State Methods**
- `getState(): CPUState` — Get complete state (deep copy)
- `setState(state: CPUState): void` — Load state (deep copy)
- `reset(): void` — Reset to initial state

**Cycle Methods**
- `addCycles(n: number): void` — Add to cycle counter
- `getCycles(): number` — Get current cycles

### Executor Class

**Constructor**
- `new Executor(cpu: CPU, memory: Memory, options?: ExecutorOptions)` — Creates executor

**Execution**
- `execute(instruction: Instruction): void` — Execute single instruction

### Memory Interface

```typescript
interface Memory {
  read(address: number): number;
  write(address: number, value: number): void;
}
```

Implement this interface to provide memory access for the executor.

### Types

**CPUFlags**
```typescript
interface CPUFlags {
  C: boolean;   // Carry
  OV: boolean;  // Overflow
  Z: boolean;   // Zero
  S: boolean;   // Sign
}
```

**CPUState**
```typescript
interface CPUState {
  registers: Uint16Array;  // 8 registers (R0-R7)
  flags: CPUFlags;
  cycles: number;
  halted: boolean;
  sdbd: boolean;
}
```

**Instruction**
```typescript
interface Instruction {
  opcode: Opcode;
  operands: number[];
  sdbd?: boolean;
}
```

**Opcode Enum**
- `MOVR` — Move register to register
- `MVI` — Move immediate to register
- `MVO` — Move register to memory
- Additional opcodes (stubs): ADDR, SUBR, INC, DEC, ANDR, XORR, CLR, TST, HLT

## Implemented Instructions

### MOVR - Move Register to Register
- **Format:** MOVR Rsrc, Rdst
- **Flags:** S, Z updated; C, OV unchanged
- **Cycles:** 6

### MVI - Move Immediate to Register
- **Format:** MVI #imm, Rdst
- **Flags:** S, Z updated; C, OV unchanged
- **Cycles:** 8 (normal), 10 (SDBD mode)

### MVO - Move Register to Memory
- **Format:** MVO Rsrc, addr
- **Flags:** None updated
- **Cycles:** 11

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Format

```bash
npx prettier --write "src/**/*.ts"
```

## Test Coverage

- **132 tests passing**
- **5 test suites**
- **~77% code coverage**

Test files:
- `cpu.types.test.ts` — CPU type definitions (15 tests)
- `cpu.test.ts` — CPU class functionality (28 tests)
- `executor.dispatch.test.ts` — Opcode routing (26 tests)
- `executor.data.test.ts` — Data movement instructions (30 tests)
- `bitops.test.ts` — Bit operations (33 tests)

## Architecture

```
src/
├── cpu/
│   ├── cpu.ts           # CPU implementation
│   └── cpu.types.ts     # CPU type definitions
├── executor/
│   ├── executor.ts      # Instruction executor
│   └── executor.types.ts # Executor types
├── utils/
│   └── bitops.ts        # Bit manipulation utilities
└── index.ts             # Public API exports
```

## License

MIT

## Contributing

This package is part of a larger emulator project. See the main repository for contribution guidelines.

## Next Steps

See `docs/sprint1.3-manus-suggestions.md` for detailed recommendations on:
- Completing remaining instructions (ADDR, SUBR, INC, DEC, ANDR, XORR, CLR, TST, HLT)
- Implementing full memory management
- Creating instruction decoder
- Building execution loop
- Adding branch/jump instructions
- Implementing debugging tools

## Version History

### 0.1.0 (Current)
- Initial implementation
- CPU with 8 registers and 4 flags
- Three data movement instructions (MOVR, MVI, MVO)
- Bit operation utilities
- Comprehensive test suite
