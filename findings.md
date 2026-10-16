# Findings

## Baseline

- The main path fetches two GitHub wiki pages concurrently through dynamically discovered source modules.
- Each page is parsed into a full `jsdom` document, although only highlighted block text is needed.
- Mihomo parsing is synchronous and catches errors per line; template loading is started at module load.
- There are no repository performance benchmarks or automated tests.

## Measured Results

- The original `jsdom` path parsed the same GitHub HTML 20 times in about 3,566 ms and reached about 457 MB RSS.
- Bun `HTMLRewriter` parsed the same HTML 20 times in about 42 ms and reached about 19 MB RSS.
- The parser-only comparison is about 85x faster with roughly 24x lower peak memory.
- A live end-to-end run completed successfully in about 2.1-3.2 seconds; network latency dominates this result.
- The live run generated 3 subscription lines and 2 supported Mihomo proxy entries.
- GitHub raw Markdown responses are about 13.8 KB and 14.9 KB uncompressed, versus about 300 KB of HTML per page; compressed transfers measured about 5.5-5.8 KB per page.
- Three raw Markdown fetch samples ranged from about 0.8-2.2 seconds per request; the two requests remain the dominant cold-start cost.

## Validation

- `bun x tsc --noEmit`
- `bun x oxlint src build.ts`
- `bun x oxfmt --check src build.ts`
- `bun run begin`
- `bun run bd`

## Remaining Limits

- GitHub fetch latency remains the main end-to-end cost.
- The Markdown extractor relies on the wiki keeping subscription links in fenced code blocks.
- CI no longer installs production dependencies because the runtime has no external dependencies.
- The workflow now cancels overlapping hourly runs, pins the Bun runtime, and skips README updates and commits when both generated subscription files are unchanged.
- The commit step stages only `README.md`, `data/sub.txt`, and `data/sub.yaml`, avoiding accidental repository-wide writes.
- Checkout now uses sparse paths for the runtime inputs and generated files; this is a small saving for the current repository but scales with repository growth.

## Decisions

- Preserve the public output files and supported proxy schemes.
- Measure network, source extraction, proxy parsing, and serialization separately where possible.

