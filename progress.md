# Progress

## 2026-10-16

- Inspected repository structure, scripts, source loaders, source fetchers, and output generators.
- Created the performance work plan and initial findings.
- Replaced the broken macro imports and runtime module scans with static registrations.
- Replaced full `jsdom` parsing with Bun `HTMLRewriter` extraction and removed the unused runtime/parser dependencies.
- Added a shared HTML subscription extractor and fixed the strict undefined access in the former Clash parser.
- Verified live fetching, generated outputs, type checking, lint, formatting, bundling, and parser benchmarks.
- Removed the generated `dist/app` validation artifact from the worktree.
- Switched source URLs from rendered GitHub HTML to raw wiki Markdown, reducing transferred content by over 95% and removing the HTML parser from the runtime path.
- Removed the CI production dependency install because the runtime dependency set is empty.
- Reused one Markdown fence extractor for both sources and validated the extracted node blocks against the live raw files.
- Optimized CI orchestration with fixed Bun version, overlapping-run cancellation, change detection, and a narrow commit allowlist.
- Added sparse checkout for the files needed by the fetch job.
- Moved standalone compilation to `.github/workflows/build-binary.yml` and changed the hourly workflow to execute the committed Linux binary.
- Removed the local `dist` output in favor of the CI-managed `bin/dongtai-sub` artifact.
- Sequenced source push handling through `workflow_run` so fetching waits for a successful binary build.
- Corrected and type-checked the Bun target and ESM build options; verified the build script emits a Linux x86-64 ELF binary.
- Validated both workflow YAML files and reran TypeScript, lint, format, and whitespace checks.
- Renamed the output implementation to `clash.ts`, removed the external Clash template, and delegated protocol parsing to a remote `proxy-providers` entry.

