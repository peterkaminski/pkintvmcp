# Resources Guide

**Purpose**: This document catalogs the reference materials in the `resources/` directory and explains when to use each during development.

**Important**: Files in `resources/` have different, potentially incompatible licensing terms. Assume they should NOT be copied in whole or part into the open source portion of this project. They are background materials only.

---

## Quick Reference by Development Phase

### Sprint 1.2-1.4 (Instruction Decoder & Executor)
**Primary references:**
- `CP-1600_Microprocessor_Instruction_Set_Simplified_Presentation.md.txt` - Detailed instruction descriptions
- `jzintv-20200712-src/doc/programming/cp1600_summary.txt` - Concise instruction table with cycle timings
- `jzintv-20200712-src/doc/programming/cp1600_ref.pdf` - Official CP-1600 reference

**Key insight**: Use the simplified presentation for implementation details, cross-reference with jzIntv summary for cycle counts.

### Sprint 1.5-1.6 (MCP Server & Testing)
**Primary references:**
- `Air Strike/air-strike-commented-disassembly.md` - Real Intellivision program for test cases
- `Air Strike/airstrk/airstrk.asm.txt` - Original Air Strike source code
- `jzintv-20200712-src/examples/` - Many small test programs

**Key insight**: Air Strike is a complete, working game we can use for integration testing. The commented disassembly shows real usage patterns of EXEC APIs and game structure.

### Phase 2 (Validation & Completion)
**Primary references:**
- `jzintv-20200712-src/` - Complete jzIntv source code for comparison
- `jzintv-20200712-src/doc/jzintv/debugger.txt` - jzIntv debugger reference
- All test ROM examples in `jzintv-20200712-src/examples/`

### Phase 3 (Peripherals: STIC, PSG, Controllers)
**Primary references:**
- `jzintv-20200712-src/doc/programming/memory_map.txt` - Complete Intellivision memory map
- `jzintv-20200712-src/doc/programming/stic.txt` - STIC graphics chip documentation
- `jzintv-20200712-src/doc/programming/psg.txt` - PSG sound chip documentation
- `jzintv-20200712-src/doc/programming/graphics_mem.txt` - Graphics memory details
- `jzintv-20200712-src/doc/programming/interrupts.txt` - Interrupt handling
- `De_Re_Intellivision/dri_6.txt` - Hardware architecture (Chapter 6)
- `De_Re_Intellivision/dri_9.txt` - Additional hardware details (Chapter 9)

### Throughout Development
**Primary references:**
- `Your Friend The EXEC (Transcribed).pdf` - EXEC ROM API calls
- `Claude-pkIntvMCP-first-convo-2025-12-08.md` - Project goals and initial decisions
- `CP-1600_Microprocessor_Users_Manual_May75.pdf` - Official processor manual (cycle timing on page 53+)

---

## Detailed Resource Descriptions

### CP-1600 Processor Documentation

#### CP-1600_Microprocessor_Instruction_Set_Simplified_Presentation.md.txt (23 KB)
- **Format**: Markdown
- **Content**: All ~50 CP-1600 instructions with detailed descriptions
- **Quality**: May have transcription errors (OCR from PDF, then LLM-processed)
- **Missing**: Precise cycle timing (use jzIntv docs for this)
- **Best for**: Understanding instruction semantics, operation descriptions, flag behavior
- **Key sections**:
  - Section 3.0: General instruction format (10-bit instructions)
  - Section 3.1: Instruction timing and symbolic notation
  - Section 3.2: External reference instructions (memory access)
  - Section 3.3: Internal reference instructions (register-only)

**Usage notes**:
- Cross-reference with official manual for cycle counts
- Watch for OCR errors: "RO" → "R0", "MVl@" → "MVI@", "RI" → "R1"
- Exclusive OR symbol: ⊕ (was ¥ in original text)
- Replacement operator: ← (was -> in original)

#### CP-1600_Microprocessor_Users_Manual_May75.pdf (9.5 MB)
- **Format**: Scanned PDF
- **Content**: Official General Instruments CP-1600 manual from May 1975
- **Quality**: Original source documentation
- **Best for**: Authoritative cycle timing (page 53+), official specifications
- **Challenge**: Scanned PDF - may need OCR or manual transcription for timing data

**Usage notes**:
- This is the authoritative source for timing information
- Page 53+ has the complete cycle timing tables
- Use when there's any doubt about instruction behavior

### jzIntv Documentation (Best Intellivision Emulator)

#### jzintv-20200712-src/doc/programming/cp1600_summary.txt
- **Format**: Plain text with ASCII tables
- **Content**: Concise instruction reference with cycle counts
- **Quality**: Excellent - maintained by Joe Zbiciak, highly accurate
- **Best for**: Quick reference during implementation, cycle timing validation
- **Key data**:
  - Register-to-register: 6/7 cycles (7 if dest is R6/R7)
  - Shifts: 6 cycles (8 for 2-position)
  - Control: 4 cycles (not interruptable)
  - Jumps: 12 cycles
  - Branches: 7 cycles (9 if taken for unconditional)
  - Memory ops: 8-11 cycles depending on addressing mode

**Usage notes**:
- Use this as your primary cycle timing reference
- Cross-reference with official manual when in doubt
- Format is very readable, great for implementation

#### jzintv-20200712-src/doc/programming/memory_map.txt
- **Format**: Plain text with detailed tables
- **Content**: Complete Intellivision memory map
- **Quality**: Excellent, comprehensive
- **Best for**: Phase 3 implementation (STIC, PSG, RAM layout)
- **Key sections**:
  - $0000-$007F: STIC registers (VBLANK access restrictions!)
  - $0100-$01EF: 8-bit scratch RAM
  - $01F0-$01FF: PSG registers
  - $0200-$035F: 16-bit system RAM (includes BACKTAB, stack, MOB data)
  - $1000-$1FFF: EXEC ROM
  - $3000-$37FF: GROM (graphics ROM)
  - $3800-$39FF: GRAM (graphics RAM)
  - $5000-$6FFF: Typical cartridge ROM space

**Usage notes**:
- Essential for Phase 3 peripheral emulation
- Pay attention to VBLANK access restrictions
- STIC and GRAM have aliased addresses (important!)
- EXEC boot sequence documented at end

#### jzintv-20200712-src/doc/programming/stic.txt
- **Format**: Plain text
- **Content**: STIC graphics chip documentation
- **Best for**: Phase 3 - implementing graphics emulation
- **Covers**: MOB (sprite) control, BACKTAB (screen), color stack, timing

#### jzintv-20200712-src/doc/programming/psg.txt
- **Format**: Plain text
- **Content**: PSG (Programmable Sound Generator) documentation
- **Best for**: Phase 3 - implementing sound emulation
- **Covers**: AY-3-8914 chip registers, sound generation

#### jzintv-20200712-src/doc/programming/interrupts.txt
- **Format**: Plain text
- **Content**: CP-1600 interrupt handling
- **Best for**: Phase 2/3 - completing interrupt support
- **Covers**: VBLANK interrupts, interrupt vectors, EIS/DIS/TCI instructions

#### jzintv-20200712-src/doc/programming/cp1600_ref.pdf
- **Format**: PDF
- **Content**: CP-1600 reference documentation
- **Quality**: High quality reference
- **Best for**: Alternative to the official manual, often clearer formatting

### Real Intellivision Code Examples

#### Air Strike/air-strike-commented-disassembly.md
- **Format**: Markdown with annotated assembly
- **Content**: Complete disassembly of Air Strike with commentary by Claude
- **Quality**: Good overall structure, but may have errors (created by LLM)
- **Best for**: Understanding real game architecture, test case creation
- **Key sections**:
  - Game header structure (cartridge metadata)
  - Process table (multi-process architecture)
  - EXEC API calls in real use (CLEARRAM, DOSOUND, INITOBJ, etc.)
  - Memory layout ($031D-$0322 aircraft data, etc.)
  - Real sprite/graphics data structures

**Usage notes**:
- This is Peter Kaminski's original Intellivision game from his time at APh Technological Consulting
- Excellent for understanding real-world code patterns
- Shows proper EXEC integration and multi-process design
- Good source of integration test scenarios
- Use with caution - LLM-generated commentary may have errors

#### Air Strike/airstrk/airstrk.asm.txt
- **Format**: as1600 assembly source code
- **Content**: Original Air Strike source code
- **Quality**: Original source - authoritative
- **Best for**: Understanding assembler syntax, real instruction usage
- **Includes**: macros.mac.txt - macro definitions used in the game

**Usage notes**:
- This is the ground truth for Air Strike behavior
- Good for creating validation test cases
- Shows real-world SDBD usage, addressing modes, EXEC calls

#### jzintv-20200712-src/examples/
- **Content**: Many small example programs
- **Best for**: Unit test inspiration, specific feature examples
- **Notable examples**:
  - `hello/` - Minimal "Hello World" program
  - `balls1/`, `balls2/` - Simple graphics demos
  - `4-tris/` - Tetris clone (complete game)
  - `spacepat/` - Space Patrol (complete game with docs)
  - `library/` - Utility routines (sqrt, etc.)

### System Documentation

#### Your Friend The EXEC (Transcribed).pdf (564 KB)
- **Format**: PDF (transcribed from original document)
- **Content**: EXEC ROM operating system API reference
- **Best for**: Understanding EXEC services available to cartridges
- **Covers**:
  - System initialization
  - Screen/graphics functions (PRINT, FILLMEM, etc.)
  - Object management (INITOBJ, ANIMATE, etc.)
  - Sound routines (PLAY, DOSOUND, etc.)
  - Process management (FREEZE, THAW, etc.)
  - Utility functions (RAND, MULT, etc.)

**Usage notes**:
- Essential for Phase 2/3 when running real ROMs
- Many Intellivision programs rely heavily on EXEC services
- Phase 1 focuses on CPU only, but EXEC context is helpful

#### De Re Intellivision (De_Re_Intellivision/)

##### dri_6.txt (74 KB) - Chapter 6
- **Content**: Hardware architecture details
- **Best for**: Understanding system-level design
- **Covers**: Memory organization, peripheral chips, timing

##### dri_9.txt (31 KB) - Chapter 9
- **Content**: Additional hardware information
- **Best for**: Deep hardware understanding

**Usage notes**:
- These are classic Intellivision development references
- Written for original developers, very technical
- Good for Phase 3 peripheral implementation

### Project History

#### Claude-pkIntvMCP-first-convo-2025-12-08.md
- **Format**: Markdown (conversation transcript)
- **Content**: First conversation between Peter and Claude that started this project
- **Best for**: Understanding project goals, architectural decisions, rationale
- **Key decisions documented**:
  - Why TypeScript over Python (web UI potential, accessibility)
  - Build-from-scratch approach with jzIntv validation
  - MCP as the interface (not traditional debugger UI)
  - Phase-based roadmap structure
  - CPU-first approach (defer peripherals to Phase 3)

**Usage notes**:
- Reference when there's a question about "why did we decide X?"
- Good for grounding when making similar architectural choices
- Captures the vision and mission of the project

---

## Working with These Resources

### Copyright and Licensing
- **Never copy**: Don't copy text verbatim from these documents into our open source code/docs
- **Use for reference**: Use them to understand how things work, then implement independently
- **Attribution**: Where appropriate, credit jzIntv, De Re Intellivision, etc. in comments
- **Clean room**: Ideal approach is to read the spec, understand it, then implement from understanding

### Validation Strategy
1. **Read**: Official manual and jzIntv docs for specification
2. **Implement**: Write our own code based on understanding
3. **Test**: Validate against jzIntv behavior using trace comparison
4. **Document**: Write our own documentation in our own words

### When Sources Conflict
Priority order:
1. **CP-1600 Users Manual** (May 1975) - official source
2. **jzIntv implementation** - battle-tested, widely used
3. **jzIntv documentation** - maintained by expert (Joe Zbiciak)
4. **Simplified presentation** - may have transcription errors
5. **De Re Intellivision** - good but may have inaccuracies

When in doubt: test against actual jzIntv behavior.

---

## Quick Reference Index

### I need to understand instruction X
1. Start: `jzintv-20200712-src/doc/programming/cp1600_summary.txt`
2. Details: `CP-1600_Microprocessor_Instruction_Set_Simplified_Presentation.md.txt`
3. Official spec: `CP-1600_Microprocessor_Users_Manual_May75.pdf`

### I need cycle timing for instruction X
1. Quick: `jzintv-20200712-src/doc/programming/cp1600_summary.txt`
2. Official: `CP-1600_Microprocessor_Users_Manual_May75.pdf` (page 53+)

### I need to understand the memory map
- `jzintv-20200712-src/doc/programming/memory_map.txt`

### I need a real program to test against
1. Small: `jzintv-20200712-src/examples/hello/`
2. Medium: `Air Strike/` (familiar code)
3. Large: `jzintv-20200712-src/examples/4-tris/` or `spacepat/`

### I need to understand EXEC API calls
1. `Your Friend The EXEC (Transcribed).pdf`
2. Real usage: `Air Strike/air-strike-commented-disassembly.md`

### I need to implement peripherals (Phase 3)
1. STIC: `jzintv-20200712-src/doc/programming/stic.txt`
2. PSG: `jzintv-20200712-src/doc/programming/psg.txt`
3. Memory: `jzintv-20200712-src/doc/programming/memory_map.txt`
4. Hardware: `De_Re_Intellivision/dri_6.txt`

### I forgot why we made decision X
- `Claude-pkIntvMCP-first-convo-2025-12-08.md`

---

## Resource Health Check

**Complete and ready:**
- ✅ CP-1600 instruction set documentation
- ✅ jzIntv reference documentation
- ✅ Real test ROMs (Air Strike + examples)
- ✅ Memory map and peripheral docs
- ✅ Project history and rationale

**Still needed:**
- ⏳ Actual cycle timing data (must extract from Users Manual PDF, page 53+)
- ⏳ jzIntv source code study (for validation implementation patterns)

**Not needed yet:**
- Phase 3: STIC/PSG implementation details
- Phase 3: Interrupt handling details
- Phase 4: as1600 assembler integration

---

## Document Metadata

| Field | Value |
|-------|-------|
| Created | 2025-12-08 |
| Sprint | 1.1 |
| Purpose | Catalog resources/ directory for development reference |
| Audience | Developers (including future Claude sessions) |
| Update frequency | As needed when new resources added or insights discovered |

---

**See Also:**
- [PROJECT_SETUP.md](../PROJECT_SETUP.md) - Repository structure and build system
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
- [CPU_SPECIFICATION.md](../CPU_SPECIFICATION.md) - Our own instruction set documentation
