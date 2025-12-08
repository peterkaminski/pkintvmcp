# pkIntvMCP - Wishlist & Backlog

**Last Updated:** 2025-12-08

This document tracks nice-to-have features, ideas, and future enhancements that are not critical to the core mission but would add value. Items here may be pulled into the roadmap as priorities evolve.

---

## Phase 1-2 Enhancements (CPU Debugging)

### Time-Travel Debugging
**Priority:** Medium
**Phase:** Post-2.0

- Rewind execution (step backwards)
- Save execution snapshots at intervals
- Diff two execution states
- "What changed between step N and step M?"

**Value:** Powerful debugging feature, especially for hard-to-reproduce bugs

**Complexity:** High - requires state snapshots, memory management

---

### Differential Debugging
**Priority:** Low
**Phase:** Post-2.0

- Run two ROMs side-by-side
- Compare execution traces
- Highlight where they diverge
- Useful for: "Why does version A work but version B crash?"

**Value:** Helps identify what change introduced a bug

**Complexity:** Medium - mostly UI/tooling work

---

### Conditional Breakpoint Expressions
**Priority:** Medium
**Phase:** 2.x (already partially planned in ROADMAP)

- Complex JavaScript expressions: `registers[4] === 0 && flags.zero`
- Memory watch: `memory[0x0200] > 100`
- Hit counts: "Break on 5th time through this loop"

**Value:** Powerful debugging, reduces manual stepping

**Complexity:** Medium - expression evaluation, safety sandboxing

---

### Call Stack Reconstruction
**Priority:** Medium
**Phase:** Post-1.6

- Analyze R4/R5/R6 usage patterns
- Build call stack from JSR/JR patterns
- Show "where am I in the call hierarchy?"
- Useful for: "How did I get to this subroutine?"

**Value:** Essential for understanding complex code flow

**Complexity:** Medium - pattern recognition in trace

---

### Code Coverage Analysis
**Priority:** Low
**Phase:** Post-2.0

- Track which instructions were executed
- Visualize "hot paths" vs "cold code"
- Identify dead code
- Useful for: optimization, testing completeness

**Value:** Helps optimize and understand code usage

**Complexity:** Low - just track execution counts

---

### Memory Search & Pattern Matching
**Priority:** Low
**Phase:** Post-2.0

- Search memory for specific values
- Find byte patterns
- "Where is the string 'GAME OVER' stored?"

**Value:** Useful for reverse engineering

**Complexity:** Low - simple memory scan

---

## Phase 3 Enhancements (Peripherals)

### Visual Debugging Overlays
**Priority:** High
**Phase:** 3.x (partially in ROADMAP)

- Display frame buffer with overlays:
  - MOB bounding boxes
  - Collision regions
  - BACKTAB grid
  - Hot spots (updated this frame)
- Export annotated screenshots

**Value:** Essential for graphics debugging

**Complexity:** Medium - rendering + annotation

---

### STIC Register History
**Priority:** Medium
**Phase:** 3.x

- Track all STIC register writes
- Timeline view: "When did MOB 0 X position change?"
- Diff two frames: "What changed?"

**Value:** Debug animation and timing issues

**Complexity:** Medium - trace buffer for MMIO

---

### Audio Waveform Visualization
**Priority:** Low
**Phase:** 3.x

- Real-time waveform display
- Frequency analysis (FFT)
- Channel isolation
- Export WAV files

**Value:** Debug sound issues, create audio samples

**Complexity:** Medium - audio processing

---

### Controller Input Recording/Playback (TAS)
**Priority:** Medium
**Phase:** 3.x (already in ROADMAP)

- Record button presses
- Save as file (.tas format)
- Replay for testing
- Useful for: automated testing, tool-assisted speedruns

**Value:** Reproducible testing, TAS community

**Complexity:** Low - just record/playback input state

---

## User Interface Enhancements

### Web-Based Debugger UI
**Priority:** High
**Phase:** 4.x (already in ROADMAP)

- Browser-based interface
- Visual register/memory display
- Interactive disassembly
- Graphics/audio output
- No installation required

**Value:** Accessibility, easier onboarding

**Complexity:** High - full React/TypeScript app

---

### VS Code Extension
**Priority:** Medium
**Phase:** Post-4.0

- Integrate pkIntvMCP into VS Code
- Inline breakpoints (click line number)
- Watch window for registers
- Step/run/continue toolbar
- Hover for register values

**Value:** Developer-friendly IDE integration

**Complexity:** High - VS Code extension API, DAP protocol

---

### Claude Code Custom Prompts
**Priority:** Low
**Phase:** Post-1.6

- Slash commands: `/debug-rom`, `/find-bug`, `/explain-code`
- Saved debugging workflows
- Common patterns codified

**Value:** Faster debugging, less typing

**Complexity:** Low - just custom slash commands

---

### Syntax Highlighting for Disassembly
**Priority:** Low
**Phase:** Post-1.5

- Color-code instruction types
- Highlight registers vs addresses vs immediates
- Mark branch targets

**Value:** Easier to read disassembly

**Complexity:** Low - formatting strings

---

## Advanced Features

### Automated Test Generation
**Priority:** Low
**Phase:** Post-2.0

- Record execution → Generate test case
- "Bless" a trace as expected behavior
- Regression detection: "Execution changed from last time"

**Value:** Prevents regressions

**Complexity:** High - trace comparison, test framework

---

### Performance Regression Detection
**Priority:** Low
**Phase:** Post-2.5

- Track cycle counts over time
- Alert when hotspot gets slower
- Compare against baseline

**Value:** Catch performance issues early

**Complexity:** Medium - cycle tracking + storage

---

### ROM Patching Tools
**Priority:** Low
**Phase:** Post-2.0

- Apply binary patches
- Save modified ROM
- Useful for: testing fixes, creating variants

**Value:** Quick iteration on ROM modifications

**Complexity:** Low - binary file manipulation

---

### Symbolic Debugging (with .sym files)
**Priority:** Medium
**Phase:** Post-2.0

- Load .sym files from assembler
- Show function names instead of addresses
- Show variable names in memory
- Much easier to understand disassembly

**Value:** Huge improvement for readability

**Complexity:** Medium - symbol file parsing, lookup

---

### Multi-ROM Comparison
**Priority:** Low
**Phase:** Post-2.0

- Compare multiple ROM versions
- "What's different between v1 and v2?"
- Binary diff with disassembly

**Value:** Understand ROM evolution

**Complexity:** Medium - binary diff + disassembly alignment

---

## Community & Ecosystem

### Example ROM Collection
**Priority:** Medium
**Phase:** 4.x

- Curated test ROMs
- Tutorial programs
- Common patterns demonstrated
- "Learn by example"

**Value:** Educational, onboarding

**Complexity:** Low - just ROM curation + docs

---

### Community Discord Bot
**Priority:** Low
**Phase:** Post-4.0

- Claude bot in intvprog Discord
- Quick debugging help
- Share sessions via bot

**Value:** Community engagement

**Complexity:** Medium - Discord bot + MCP integration

---

### ROM Library Integration
**Priority:** Low
**Phase:** Post-4.0

- Browse ROMs from AtariAge
- One-click load into debugger
- Metadata (author, year, description)

**Value:** Easy discovery

**Complexity:** Medium - web scraping or API

---

### Tutorial Videos / Screencasts
**Priority:** High
**Phase:** 4.x

- "How to debug with Claude"
- "Understanding CP-1600 flags"
- "Finding a sprite bug"

**Value:** Onboarding, marketing

**Complexity:** High - video production

---

## Integration & Interoperability

### jzIntv Live Comparison Mode
**Priority:** Medium
**Phase:** Post-2.2

- Run both emulators in lockstep
- Real-time divergence detection
- "Stop when traces differ"

**Value:** Immediate validation during development

**Complexity:** High - IPC synchronization

---

### as1600 Assembler Integration
**Priority:** Low
**Phase:** Post-2.0

- Compile .asm → ROM → Load
- Automated workflow
- Show source alongside disassembly

**Value:** Streamlined development

**Complexity:** Medium - assembler integration

---

### IntyBASIC Integration
**Priority:** Low
**Phase:** Post-2.0

- Support IntyBASIC compiler output
- Source-level debugging (map back to BASIC)

**Value:** Homebrew developer friendliness

**Complexity:** High - compiler integration, source mapping

---

## Research & Experimentation

### Machine Learning for Bug Detection
**Priority:** Very Low
**Phase:** Research

- Train model on "good" vs "buggy" traces
- Automatic anomaly detection
- "This execution looks unusual"

**Value:** Novel research, automated debugging

**Complexity:** Very High - ML model, training data

---

### Fuzzing / Automated Testing
**Priority:** Low
**Phase:** Post-2.5

- Generate random ROM sequences
- Test for crashes, hangs
- Coverage-guided fuzzing

**Value:** Find edge cases, improve emulator robustness

**Complexity:** Medium - fuzzing framework

---

### WebAssembly Port
**Priority:** Low
**Phase:** Post-4.0

- Compile core to WASM
- Run in browser with native performance
- Useful for web UI

**Value:** Better web performance

**Complexity:** High - WASM compilation, testing

---

## Non-Goals / Explicitly Deferred

These are things we've decided NOT to pursue:

❌ **Other Retro Systems** - CP-1600/Intellivision only
❌ **Cycle-Exact Emulation** - Approximate timing sufficient
❌ **Gameplay Focus** - Debugging, not casual gaming
❌ **Assembler/Compiler** - Use existing tools (as1600)
❌ **Commercial Licensing** - Open source only
❌ **Mobile Apps** - Web + desktop only

---

## How Items Move from Wishlist to Roadmap

1. **Community demand** - Multiple users request it
2. **Strategic value** - Aligns with core mission
3. **Feasibility** - Can be implemented in reasonable time
4. **Dependencies** - Required features already complete

**Process:**
- Discuss in intvprog Discord or GitHub issues
- Evaluate priority, complexity, value
- Add to roadmap sprint if approved
- Update this wishlist to mark status

---

## Contributing Ideas

Have an idea? Add it here via pull request, or discuss in:
- **intvprog Discord** - Real-time discussion
- **GitHub Issues** - Formal feature requests
- **Email list** - Async discussion

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-08 | Peter/Claude | Initial wishlist created |

---

**See Also:**
- [ROADMAP.md](ROADMAP.md) - Planned work and phases
- [PRD.md](PRD_v1.2.md) - Product requirements and vision
- [Sprint-1.2.md](Sprint-1.2.md) - Current sprint work
