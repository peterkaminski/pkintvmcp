---

# ✅ **Prompt 0 — Initialize the Manus mini-repo**

Paste this into a *clean new Manus project*:

---

**PROMPT 0 — INIT PROJECT**

We are creating a small, self-contained TypeScript project that will later be copied into a larger emulator project.

Please initialize a minimal repo with this exact structure:

```
packages/
  core/
    package.json
    tsconfig.json
    jest.config.js
    src/
      index.ts
      cpu/
        cpu.types.ts
        cpu.ts
      executor/
        executor.ts
      utils/
        bitops.ts
```

Requirements:

* Use **TypeScript strict mode**.
* Use **Jest** for testing. Configure it with ts-jest so `npm test` works immediately.
* Set module resolution to `NodeNext` or `Node16` (your choice, just consistent).
* `index.ts` should re-export public APIs from cpu, executor, utils (empty for now).
* Create an initial `package.json` with scripts:

  * `"build": "tsc"`
  * `"test": "jest"`
* Run `npm install` so the environment is fully bootstrapped.

After setup, show me the file tree and confirm tests run (even if none exist yet).

---

# ✅ **Prompt 1 — Implement `cpu.types.ts` + tests**

Paste after Project Init is complete:

---

**PROMPT 1 — CPU TYPES**

Create the file `packages/core/src/cpu/cpu.types.ts` with these TypeScript definitions:

### `CPUFlags`

```
{
  C: boolean;   // Carry
  OV: boolean;  // Overflow
  Z: boolean;   // Zero
  S: boolean;   // Sign
}
```

### `CPUState`

```
{
  registers: Uint16Array;  // length 8 (R0–R7), 16-bit unsigned
  flags: CPUFlags;
  cycles: number;
  halted: boolean;
  sdbd: boolean;
}
```

### `ExecutorOptions`

```
{
  trace?: boolean;
}
```

**Requirements:**

* Export all three interfaces.
* Re-export them in `packages/core/src/index.ts`.
* Add a Jest test under `packages/core/src/cpu/__tests__/cpu.types.test.ts` that:

  * Constructs a valid CPUState
  * Confirms `registers` is a Uint16Array of length 8
  * Confirms flags shape/type
  * Confirms TypeScript does not allow invalid keys or missing fields (negative tests via `@ts-expect-error`)

Run the tests when done.

---

# ✅ **Prompt 2 — Implement the `CPU` class + tests**

Paste after Prompt 1 finishes:

---

**PROMPT 2 — CPU CLASS**

Implement `packages/core/src/cpu/cpu.ts` containing a `CPU` class using the types defined earlier.

### CPU requirements:

* Registers: `Uint16Array(8)`, R0–R7 (R7 = PC).
* Flags: initialized to `{C:false, OV:false, Z:false, S:false}`.
* `cycles = 0`, `halted = false`, `sdbd = false`.

### Methods:

```
getRegister(index: number): number
setRegister(index: number, value: number): void   // wrap with toUint16()
getPC(): number         // PC is R7
setPC(val: number): void
incrementPC(): void     // wraps at 16 bits
getFlags(): CPUFlags    // return a copy
setFlags(partial: Partial<CPUFlags>): void
reset(): void           // zero regs, zero flags, cycles=0, halted=false, sdbd=false
getState(): CPUState    // deep clone of state
setState(state: CPUState): void  // deep load, copying arrays
addCycles(n: number): void
getCycles(): number
```

### Dependencies

Import `{ toUint16 }` from `../utils/bitops`.

### Tests

Create `packages/core/src/cpu/__tests__/cpu.test.ts`:

Test cases:

* Register bounds check throws on invalid register index (<0 or >7).
* `setRegister` wraps via `toUint16` (e.g., 0x1_0000 → 0x0000).
* `incrementPC` wraps correctly from 0xFFFF → 0x0000.
* `getState()` returns deep copies (mutating snapshot does NOT mutate CPU).
* `reset()` restores default state.

Run tests afterward.

---

# ✅ **Prompt 3 — Create Executor skeleton + stub instruction handlers**

Paste after Prompt 2 completes:

---

**PROMPT 3 — EXECUTOR SKELETON**

Create `packages/core/src/executor/executor.ts` defining an `Executor` class with the following:

Constructor takes:

* `cpu: CPU`
* `memory: Memory` (for now create a minimal interface in this file unless I provide one)
* `options?: ExecutorOptions`

The class must include:

### Public API

```
execute(instruction: Instruction): void
```

### Internal API (create stub methods)

```
private executeMovr(inst: Instruction): void
private executeMvi(inst: Instruction): void
private executeMvo(inst: Instruction): void

private executeAddr(inst: Instruction): void
private executeSubr(inst: Instruction): void
private executeInc(inst: Instruction): void
private executeDec(inst: Instruction): void

private executeAndr(inst: Instruction): void
private executeXorr(inst: Instruction): void
private executeClr(inst: Instruction): void

private executeTst(inst: Instruction): void
private executeHlt(inst: Instruction): void
```

### Flag helper

Add the function:

```
private setArithmeticFlags(
    result: number,
    op1: number,
    op2: number,
    isSubtraction: boolean
): void
```

Implement correct behavior:

* **Z flag** = result === 0
* **S flag** = bit 15 of result
* **C flag (unsigned borrow/carry)** based on addition vs subtraction
* **OV flag (signed overflow)** per 16-bit arithmetic rules

### Dispatch

`execute()` should switch on `instruction.opcode` and call the appropriate stub.

### Tests

Add `packages/core/src/executor/__tests__/executor.dispatch.test.ts`:

* Ensure each opcode calls the correct stub.
* Confirm wrong opcodes throw.
* No instruction semantics yet — stubs OK.

Make sure type errors fail fast: define minimal placeholder `Instruction` + `OpcodeEnum` inside this file if needed.

---

# ✅ **Prompt 4 — Bit operations utility**

Paste next:

---

**PROMPT 4 — BITOPS**

Implement `packages/core/src/utils/bitops.ts` with:

```
export function toUint16(x: number): number   // x & 0xFFFF
export function toInt16(x: number): number    // signed conversion
export function toUint10(x: number): number   // x & 0x03FF
```

Add tests in `packages/core/src/utils/__tests__/bitops.test.ts`:

Test cases:

* toUint16: wrap 0x10000 → 0x0000, 0x1FFFF → 0xFFFF
* toInt16: 0x7FFF = 32767, 0x8000 = -32768, 0xFFFF = -1
* toUint10: mask properly to 10 bits

---

# ✅ **Prompt 5 — Implement data-movement instructions (MOVR, MVI, MVO)**

Paste when ready:

---

**PROMPT 5 — DATA INSTRUCTIONS (MOVR, MVI, MVO)**

Implement:

### MOVR

* Copies register → register.
* Flags: update S and Z; do NOT modify C or OV.
* Cycles: add according to spec.

### MVI

* Move immediate → register.
* Flags: S, Z updated; C/OV untouched.
* Cycles: use inst.sdbd to determine timing.

### MVO

* Move register → memory.
* Flags: none (do NOT update).
* Cycles: per spec.

Update tests:

* Register src/dest correctness
* Immediate loads
* Memory writes
* Flags correct
* Cycle counts correct
* Edge cases: zero, negative (bit 15 = 1), high-bit values

After implementing, run tests.

---

Ensure all tests pass, format all files with Prettier (or your formatter), and clean up unused imports.


