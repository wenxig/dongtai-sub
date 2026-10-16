export {}

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  compile: { outfile: 'app' },
  format: 'esm',
  minify: true,
  bytecode: true
})