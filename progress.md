# Progress

## 2026-10-16

- Inspected repository structure, scripts, source loaders, source fetchers, and output generators.
- Created the performance work plan and initial findings.
- Replaced the broken macro imports and runtime module scans with static registrations.
- Replaced full `jsdom` parsing with Bun `HTMLRewriter` extraction and removed the unused runtime/parser dependencies.
- Added a shared HTML subscription extractor and fixed the strict undefined access in Mihomo parsing.
- Verified live fetching, generated outputs, type checking, lint, formatting, bundling, and parser benchmarks.
- Removed the generated `dist/app` validation artifact from the worktree.
- Switched source URLs from rendered GitHub HTML to raw wiki Markdown, reducing transferred content by over 95% and removing the HTML parser from the runtime path.
- Removed the CI production dependency install because the runtime dependency set is empty.
- Reused one Markdown fence extractor for both sources and validated the extracted node blocks against the live raw files.
- Optimized CI orchestration with fixed Bun version, overlapping-run cancellation, change detection, and a narrow commit allowlist.
- Added sparse checkout for the files needed by the fetch job.

