# AI Work Directory

This directory contains **AI-assisted development artifacts** used across the
project: transcripts, prompts, exported code, integration notes, review
summaries, decision logs, and experiment outputs from tools such as Claude
Code, ChatGPT, Manus, Gemini, and others.

Its purpose is to **centralize all coordination work between humans and AI
systems** in one predictable location, separate from tracked source code
(`packages/`), docs (`docs/`), and test materials (`test-roms/`).

This directory is *not* part of the build or runtime environment.  
It is safe to store:
- planning documents
- sprint breakdowns and task lists
- agent prompts and instruction sets
- exported ZIPs or tarballs from AI tools
- transcripts of interactive sessions
- architectural discussions and analysis
- scratch files or partial experiments

---

## Goals of this Directory

1. **Keep AI-generated and coordination artifacts out of the main source tree.**
2. **Provide a clean, organized place for multi-agent workflows.**
3. **Maintain a traceable, reviewable history of AI interactions that influence code.**
4. **Enable tooling-specific subdirectories (Claude, Manus, ChatGPT, Gemini, etc).**
5. **Allow humans to reason about design and decisions without cluttering packages/.**

This space is intentionally flexible. It supports both temporary artifacts and
long-term coordination records.

---

## Recommended Subdirectory Structure

Initial pattern, can be added to:

```
chatgpt/
claude/
manus/
gemini/
common/
```

### What Goes Where?
## Workflow Examples

### 1. Manus → Repo Integration
1. Create a work plan (prompts) for Manus for Sprint 1.3: `ai-work/manus/sprint1.3/prompts-for-manus-sprint1.3.md`
2. Have Manus work on sprint.
3. Export a zip of resulting files from Manus, e.g. `ai-work/manus/sprint1.3/Imanus-sprint1.3-work.zip`
4. Use Claude Code to ingest the ZIP, analyze it, and generate an
   integration plan in `ai-work/manus/sprint1.3/`
5. Apply changes to `packages/` only once reviewed.
---

## What Should *Not* Go Here

- Actual TypeScript source that will be part of the emulator (place that in
  `packages/`).
- Build artifacts or compiled output.
- Test ROMs or CP-1600 program samples (those go to `test-roms/`).
- Large binaries not associated with AI exports.

---

## Version Control Guidance

- **Do commit** prompts, transcripts, plans, zips, exported files, and internal AI discussions.
  This preserves traceability and improves future reproducibility.
- **Do not commit** sensitive credentials, raw `.env` data, open browser dumps,
  or proprietary materials that cannot be shared.
- **Consider pruning large / obsolete AI artifacts** occasionally to keep the repo light,
  or rotate them into archival branches.

---

## Naming Conventions

- Use date prefixes (e.g., `2025-12-09-sprint1.3-plan.md`).
- Use descriptive tags like `analysis`, `integration`, `export`, `decision`, etc.
- Prefer lowercase kebab-case for file and directory names.

---

## Vision

This directory is the **coordination nexus** between human developers and the
AI tools we use. As the agentic ecosystem evolves, new subdirectories can be
added without disturbing the overall structure.

The intent is to create a **transparent, well-organized, reproducible record of
AI collaboration**, improving engineering clarity while keeping the main codebase
focused and clean.

---

## Integration Example Prompt

```
I used ChatGPT to analyze the Sprint 1.3 document, to create prompts for Manus to do the Sprint 1.3 work. I gave Manus those prompts, then collected its work output.

I've made a new top-level dir, `ai-work`, for coordination between various AI tools. There is a `ai-work/README.md` explaining the purpose and structure of the dir.

I've switched to a new branch for the next steps, pkma-sprint1.3-2025-12-09

In this case, I'm giving you Manus's work output for Sprint 1.3 in `/ai-work/manus/sprint1.3/manus-sprint1.3-work.zip`.

Unzip the work output into a temp folder in `ai-work`, analyze the files, then infer whether to integrate the work
  output into our repo.

Propose an integration plan in a short checklist before making changes, including:
  - Where to copy or move each Manus source file in the main repo
  - How to adapt exports (index files)
  - How to merge or replace any overlapping functionality
  - Which tests to port or adapt, and where they should live
  - Any open questions, assumptions, or suggestions you have after your analysis

After showing me the plan, start executing it step by step:
  - Copy or move Manus files into the main repo structure (preserving relative imports where reasonable).
  - Adjust TypeScript paths, imports, and exports to match the project’s tsconfig and module layout.
  - Integrate or adapt test files so the main project’s test runner picks them up.

When integration is wired up:
  - Run the relevant tests (or the full `npm test` / `pnpm test` / `yarn test`, depending on the repo).
  - Use comments like `// TODO(PK): ...` for anything that clearly needs a human’s decision.

```

