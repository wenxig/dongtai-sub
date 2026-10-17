export {}

const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  target: 'bun',
  format: 'esm',
  compile: { target: 'bun-linux-x64', outfile: process.env.BINARY_OUTFILE ?? './bin/dongtai-sub' },
  minify: true,
  bytecode: true
})

if (!result.success) {
  console.error(result.logs)
  process.exit(1)
}