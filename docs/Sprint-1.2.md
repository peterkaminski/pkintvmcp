# Sprint 1.2: Instruction Decoder

**Status:** 🟢 In Progress
**Sprint Goal:** Implement instruction decoder that can parse all Phase 1 instructions
**Started:** 2025-12-08
**Target Completion:** When all tasks complete

---

## Sprint Overview

### Objective
Build the instruction decoder that converts 10-bit instruction words (decles) into structured `Instruction` objects with opcode, addressing mode, and operands extracted.

### Success Criteria
- ✅ Can decode all Phase 1 instructions (~20 instructions)
- ✅ Handles all addressing modes (register, immediate, direct, indirect)
- ✅ SDBD prefix support (16-bit immediates)
- ✅ Unit test coverage >90%
- ✅ Integration tests with sample instruction sequences

### Dependencies
- Sprint 1.1 complete ✅
- PROJECT_SETUP.md defines structure ✅

---

## Tasks

### 1. Initialize Monorepo Structure
**Status:** ✅ Complete (Sprint 1.1)
**Owner:** Claude
**Actual Effort:** Completed in Sprint 1.1

**Tasks:**
- [x] Create `packages/` directory structure
- [x] Initialize `packages/core` with package.json
- [x] Initialize `packages/mcp-cpu` with package.json
- [x] Set up root package.json with workspaces
- [x] Configure Turborepo (turbo.json)
- [x] Set up TypeScript configuration (root + per-package)
- [x] Install dependencies
- [x] Verify: `npm run build` runs (even with empty packages)
- [x] Verify: `npm test` runs (even with no tests yet)

**Verification:**
```bash
npm install
npm run build  # Should succeed
npm test       # Should run (no tests yet is OK)
```

---

### 2. Define Core Types
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 1-2 hours

**Location:** `packages/core/src/decoder/decoder.types.ts`

**Tasks:**
- [ ] Define `Opcode` enum (all Phase 1 opcodes)
- [ ] Define `AddressingMode` enum
- [ ] Define `Operand` interface
- [ ] Define `Instruction` interface
- [ ] Export from barrel (`packages/core/src/index.ts`)

**Code Structure:**
```typescript
export enum Opcode {
  // Data Movement
  MVI, MVO, MVOI, MOV, MOVR,

  // Arithmetic
  ADD, ADDR, SUB, SUBR, INC, INCR, DEC, DECR,

  // Logic
  AND, ANDR, XOR, XORR, CLR, CLRR,

  // Control Flow
  B, BEQ, BNEQ, J, JR, JSR,

  // Stack
  PSHR, PULR,

  // Status
  TST, TSTR, NOP,

  // Special
  SDBD, HLT,
}

export enum AddressingMode {
  IMPLIED,
  REGISTER,
  IMMEDIATE,
  DIRECT,
  INDIRECT,
  INDEXED,
  STACK,
  SDBD_MODIFIED,
}

export interface Operand {
  type: 'register' | 'immediate' | 'address';
  value: number;
}

export interface Instruction {
  address: number;
  opcode: Opcode;
  addressingMode: AddressingMode;
  operands: Operand[];
  raw: number;  // Original 10-bit instruction word
  sdbd: boolean;  // Was SDBD prefix active?
}
```

**Verification:**
```bash
cd packages/core
npm run build  # Should compile types
```

---

### 3. Implement Decoder Class (Basic Structure)
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 2-3 hours

**Location:** `packages/core/src/decoder/decoder.ts`

**Tasks:**
- [ ] Create `Decoder` class with constructor
- [ ] Implement `decode(address: number, sdbd: boolean): Instruction` method
- [ ] Implement `extractOpcode(word: number): Opcode` helper
- [ ] Implement `extractAddressingMode(word: number, opcode: Opcode): AddressingMode` helper
- [ ] Implement `extractOperands(word: number, mode: AddressingMode, sdbd: boolean): Operand[]` helper

**Code Structure:**
```typescript
export class Decoder {
  constructor(private memory: Memory) {}

  decode(address: number, sdbd: boolean): Instruction {
    const word = this.memory.read(address);
    const opcode = this.extractOpcode(word);
    const mode = this.extractAddressingMode(word, opcode);
    const operands = this.extractOperands(word, mode, sdbd);

    return {
      address,
      opcode,
      addressingMode: mode,
      operands,
      raw: word,
      sdbd,
    };
  }

  private extractOpcode(word: number): Opcode {
    // TODO: Implement bit pattern matching
    throw new Error('Not implemented');
  }

  private extractAddressingMode(word: number, opcode: Opcode): AddressingMode {
    // TODO: Implement addressing mode detection
    throw new Error('Not implemented');
  }

  private extractOperands(word: number, mode: AddressingMode, sdbd: boolean): Operand[] {
    // TODO: Extract operands based on addressing mode
    throw new Error('Not implemented');
  }
}
```

**Verification:**
```bash
cd packages/core
npm run build  # Should compile
```

---

### 4. Implement Memory Class (Stub)
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 1 hour

**Location:** `packages/core/src/memory/memory.ts`

**Tasks:**
- [ ] Create `Memory` class with Uint16Array (64K words)
- [ ] Implement `read(address: number): number`
- [ ] Implement `write(address: number, value: number): void`
- [ ] Add address masking (toUint16)

**Note:** This is a minimal implementation for Sprint 1.2. Full implementation in Sprint 1.3.

**Verification:**
```bash
cd packages/core
npm run build
npm test  # Basic read/write tests
```

---

### 5. Implement Opcode Extraction
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 3-4 hours

**Tasks:**
- [ ] Study CP-1600 instruction encoding (reference CPU_SPECIFICATION.md)
- [ ] Map bit patterns to opcodes for Phase 1 instructions
- [ ] Implement bit extraction logic
- [ ] Handle ambiguous patterns (if any)

**Approach:**
```typescript
private extractOpcode(word: number): Opcode {
  // CP-1600 instructions have varying bit patterns
  // Top bits typically indicate instruction class

  const bits9_8 = (word >> 8) & 0x03;
  const bits7_6 = (word >> 6) & 0x03;

  // Example: MVI has pattern 0010 00...
  if ((word & 0x3C0) === 0x080) {
    return Opcode.MVI;
  }

  // ... more pattern matching

  throw new Error(`Unknown instruction: 0x${word.toString(16)}`);
}
```

**Verification:**
- Unit tests with known instruction words
- Decode each Phase 1 instruction type

---

### 6. Implement Addressing Mode Detection
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 2-3 hours

**Tasks:**
- [ ] Map instruction opcodes to possible addressing modes
- [ ] Extract addressing mode bits from instruction word
- [ ] Handle special cases (stack, implied, etc.)

**Verification:**
- Unit tests with various addressing modes
- Ensure mode matches instruction specification

---

### 7. Implement Operand Extraction
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 3-4 hours

**Tasks:**
- [ ] Extract register operands (bits specify R0-R7)
- [ ] Extract immediate values (10-bit or 16-bit with SDBD)
- [ ] Extract addresses (direct addressing)
- [ ] Handle multi-word instructions (read additional words from memory)

**Complexity:**
- SDBD: Read two consecutive 10-bit words to form 16-bit immediate
- Immediate addressing: May be embedded or require additional word

**Verification:**
- Test each addressing mode with various operand values
- Test SDBD prefix (16-bit immediates)

---

### 8. Unit Tests (Per Instruction Type)
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 4-6 hours

**Location:** `packages/core/src/decoder/decoder.test.ts`

**Tasks:**
- [ ] Test suite for each Phase 1 instruction
- [ ] Test each addressing mode variant
- [ ] Test SDBD prefix with immediates
- [ ] Test edge cases (boundary values, zero, max)
- [ ] Achieve >90% code coverage

**Test Structure:**
```typescript
describe('Decoder', () => {
  let memory: Memory;
  let decoder: Decoder;

  beforeEach(() => {
    memory = new Memory();
    decoder = new Decoder(memory);
  });

  describe('MVI instruction', () => {
    test('decodes 10-bit immediate', () => {
      memory.write(0x5000, 0b0010_0001_0010_1010);  // MVI R1, #42
      const inst = decoder.decode(0x5000, false);

      expect(inst.opcode).toBe(Opcode.MVI);
      expect(inst.addressingMode).toBe(AddressingMode.IMMEDIATE);
      expect(inst.operands).toHaveLength(2);
      expect(inst.operands[0].type).toBe('register');
      expect(inst.operands[0].value).toBe(1);  // R1
      expect(inst.operands[1].type).toBe('immediate');
      expect(inst.operands[1].value).toBe(42);
    });

    test('decodes 16-bit immediate with SDBD', () => {
      memory.write(0x5000, 0b0010_0001_0000_0000);  // MVI R1, part 1
      memory.write(0x5001, 0b0010_0101_0011_0100);  // part 2 (0x1234)
      const inst = decoder.decode(0x5000, true);  // SDBD active

      expect(inst.sdbd).toBe(true);
      expect(inst.operands[1].value).toBe(0x1234);
    });
  });

  // ... tests for all Phase 1 instructions
});
```

**Verification:**
```bash
npm test -- --coverage
# Should show >90% coverage for decoder module
```

---

### 9. Integration Tests
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 2-3 hours

**Location:** `packages/core/src/decoder/decoder.integration.test.ts`

**Tasks:**
- [ ] Test sequences of instructions
- [ ] Test programs with branches and subroutines
- [ ] Test SDBD followed by various instructions
- [ ] Verify instruction addresses and PC increment

**Example:**
```typescript
test('decodes instruction sequence', () => {
  // Small program: MVI, ADDR, MVO
  memory.write(0x5000, encodeMVI(1, 42));
  memory.write(0x5001, encodeADDR(1, 2));
  memory.write(0x5002, encodeMVO(2, 0x0200));

  const inst1 = decoder.decode(0x5000, false);
  expect(inst1.opcode).toBe(Opcode.MVI);

  const inst2 = decoder.decode(0x5001, false);
  expect(inst2.opcode).toBe(Opcode.ADDR);

  const inst3 = decoder.decode(0x5002, false);
  expect(inst3.opcode).toBe(Opcode.MVO);
});
```

---

### 10. Documentation & Examples
**Status:** ⏳ Not Started
**Owner:** TBD
**Estimated Effort:** 1-2 hours

**Tasks:**
- [ ] Add JSDoc comments to public APIs
- [ ] Create example usage in README
- [ ] Document any quirks or edge cases
- [ ] Update ARCHITECTURE.md if design changed

**Example README section:**
```typescript
// Example: Decode an instruction
const memory = new Memory();
memory.write(0x5000, 0b0010_0001_0010_1010);  // MVI R1, #42

const decoder = new Decoder(memory);
const instruction = decoder.decode(0x5000, false);

console.log(instruction.opcode);  // Opcode.MVI
console.log(instruction.operands[0].value);  // 1 (R1)
console.log(instruction.operands[1].value);  // 42
```

---

## Sprint Completion Checklist

### Code Complete
- [ ] All Phase 1 instructions decode correctly
- [ ] All addressing modes supported
- [ ] SDBD prefix handling works
- [ ] Code compiles with no errors
- [ ] Code passes linter (ESLint)

### Testing Complete
- [ ] Unit tests written for all instruction types
- [ ] Unit test coverage >90%
- [ ] Integration tests pass
- [ ] Edge cases tested
- [ ] No failing tests

### Documentation Complete
- [ ] Public APIs have JSDoc comments
- [ ] README has usage examples
- [ ] Any design decisions documented
- [ ] ARCHITECTURE.md updated if needed

---

## Sprint Review

### Demo
Show Claude:
1. Decode a simple instruction (MVI)
2. Decode with SDBD prefix
3. Decode a sequence (small program)
4. Show test coverage report

### Retrospective Questions
1. What went well?
2. What could be improved?
3. Any blockers encountered?
4. Estimated vs actual effort?
5. Ready for Sprint 1.3?

---

## Next Sprint Preview: 1.3 - Core Execution Engine

**Goals:**
- Implement CPU class (registers, flags, PC)
- Implement Executor class
- Execute core instructions (ADD, SUB, MOV, etc.)
- Flag calculation (C, OV, Z, S)

**Depends on:**
- Sprint 1.2 decoder working ✅

---

## Notes & Decisions

### Design Decisions
*(Add decisions made during sprint)*

### Blockers
*(Add any blockers encountered)*

### Questions
*(Add questions that arose during sprint)*

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-08 | Peter/Claude | Initial Sprint 1.2 plan created |

---

**See Also:**
- [ROADMAP.md](ROADMAP.md) - Overall project phases
- [Sprint-1.1.md](Sprint-1.1.md) - Previous sprint (documentation)
- [CPU_SPECIFICATION.md](CPU_SPECIFICATION.md) - Instruction details
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
