# ChatGPT 5.2 as1600 Plan

You’ll be happiest if `as1600` is **(a)** in a predictable path inside the repo, **(b)** bootstrapped by a single command, and **(c)** works for both you *and* non-interactive agents (Claude Code) without relying on your shell dotfiles.

Below is a pattern I’ve used for “native toolchain inside a TS repo”.

## Recommended shape: repo-local toolchain + bootstrap script

### 1) Pick a canonical location

Create a repo-local bin dir (gitignored), e.g.

* `tools/bin/<platform>/as1600`
* `tools/bin/<platform>/bin2rom` (you said you’ll need this soon too)
* optional: `tools/bin/<platform>/jzintv`

…and a stable shim that always exists:

* `tools/as1600` (a wrapper script that finds the right binary and execs it)

This way, both humans and agents can run:

```bash
./tools/as1600 ...
```

No PATH magic required.

### 2) Add a bootstrap script that *either* downloads prebuilt *or* builds from your local source

`as1600` is distributed as part of the SDK-1600 / jzIntv toolset. ([AtariAge Forums][1])
There’s also an OS X bundle referenced by devs (e.g. `jzintv-20200712-osx-sdl2.zip`). ([AtariAge Forums][2])

So make `tools/bootstrap-sdk1600.sh` do:

**Preferred on Apple Silicon:** build from source (native arch) to avoid “Bad CPU type” issues people sometimes hit with old prebuilts. ([AtariAge Forums][3])
**Fast path on Intel Mac:** download the prebuilt zip and extract only what you need.

Pseudo-flow:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLAT="$(uname -s)-$(uname -m)"      # e.g. Darwin-arm64
OUT="$ROOT/tools/bin/$PLAT"
mkdir -p "$OUT"

if [[ -x "$OUT/as1600" ]]; then
  echo "as1600 already present: $OUT/as1600"
  exit 0
fi

# Option A: build from vendored source you already have (resources/jzintv-20200712-src)
if [[ -d "$ROOT/resources/jzintv-20200712-src" ]]; then
  echo "Building as1600 from source..."
  (cd "$ROOT/resources/jzintv-20200712-src" && make as1600 bin2rom)
  cp "$ROOT/resources/jzintv-20200712-src/as1600" "$OUT/as1600"
  cp "$ROOT/resources/jzintv-20200712-src/bin2rom" "$OUT/bin2rom"
  exit 0
fi

# Option B: download the prebuilt SDK zip (pin URL + sha256 in the script)
echo "Downloading SDK-1600 tools..."
# curl -L -o /tmp/jzintv.zip "https://.../jzintv-20200712-osx-sdl2.zip"
# verify sha256
# unzip and copy bin/as1600 + bin/bin2rom into "$OUT/"
```

Even if the exact `make` targets differ in your jzIntv source tree, the key is: **bootstrap installs into `tools/bin/<platform>/` and becomes deterministic for agents.**

Also: the `as1600` utility is well-documented in the upstream docs, so you can link your team/agents directly to the canonical directive/CLI behavior reference. ([spatula-city.org][4])

### 3) Add a thin wrapper `tools/as1600`

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLAT="$(uname -s)-$(uname -m)"
BIN="$ROOT/tools/bin/$PLAT/as1600"

if [[ ! -x "$BIN" ]]; then
  "$ROOT/tools/bootstrap-sdk1600.sh"
fi

exec "$BIN" "$@"
```

Now Claude Code can always just call `./tools/as1600`.

### 4) Wire it into your TypeScript workflow (npm scripts)

In `package.json`:

```json
{
  "scripts": {
    "toolchain:bootstrap": "bash tools/bootstrap-sdk1600.sh",
    "as1600": "bash tools/as1600",
    "rom:build": "bash tools/build-rom.sh"
  }
}
```

Then `tools/build-rom.sh` can do the whole pipeline (assemble → bin/rom conversion → drop output in `dist/roms/`).

This matters because your repo roadmap explicitly calls out future `.sym` support from `as1600`. ([GitHub][5])

## Make it “agent-proof” (Claude Code / other agents)

Add a short section to your repo’s agent instructions (you already have a `CLAUDE.md` file in the repo root) telling agents:

* always run `npm run toolchain:bootstrap` before building ROMs
* always invoke toolchain via `./tools/as1600` / `./tools/bin2rom` (not global PATH)
* output locations + expected artifacts (`.bin`, `.cfg`, `.rom`, `.sym`)

Why this helps: agents don’t reliably inherit your interactive shell PATH, but they *can* reliably run repo-relative executables.

## Optional upgrade: pin versions & make CI happy

If you ever want repeatability across machines:

* Put the **expected jzIntv version string** and **sha256** for the downloaded zip in the bootstrap script.
* Or put a small `tools/toolchain.lock.json` with `{ version, url, sha256 }` and have the bootstrap read it.

## If you want the “cleanest” dev UX on macOS

Use **direnv** (or mise) *only as a convenience*, not as a dependency:

* `.envrc` adds `tools/bin/<platform>` to PATH **after** bootstrap
* but your scripts still work repo-relative without it

---

[1]: https://forums.atariage.com/topic/220057-sdk1600-for-intellivision-programming/?utm_source=chatgpt.com "SDK1600 for intellivision programming"
[2]: https://forums.atariage.com/topic/355489-jzintv-on-mac-silicon/?utm_source=chatgpt.com "JZINTV on Mac Silicon - Intellivision / Aquarius"
[3]: https://forums.atariage.com/topic/378758-jzintv-bash-bin2rom-bad-cpu-type-in-executable/?utm_source=chatgpt.com "jzintv -bash: ./bin2rom: Bad CPU type in executable"
[4]: https://spatula-city.org/~im14u2c/intv/jzintv/doc/utilities/as1600.txt?utm_source=chatgpt.com "as1600.txt - Spatula City!"
[5]: https://github.com/peterkaminski/pkintvmcp/ "GitHub - peterkaminski/pkintvmcp: MCP emulator and debugging tool for CP-1600 & Intellivision"
