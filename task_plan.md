# Performance Optimization Plan

## Goal

Improve the runtime efficiency of the subscription fetch, parse, and output pipeline while preserving generated output behavior.

## Phases

- [complete] Move standalone binary compilation to CI and make the scheduled job execute it without Bun.
- [complete] Replace hardcoded protocol parsing and template loading with a provider-backed Clash output.
- [complete] Establish baseline timings, output counts, and type checks.
- [complete] Remove avoidable startup and parsing overhead in source loading and HTML extraction.
- [complete] Optimize proxy parsing and output generation without changing supported formats.
- [complete] Re-run benchmarks and validation, then document measurable results and remaining limits.

## Next Step

Cloud binary build, binary-only scheduled workflow, and provider-backed Clash output are implemented and validated locally.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|

