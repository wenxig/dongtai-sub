import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/index.ts',
  dts: false,
  platform: 'node',
  format: 'esm',
  inlineOnly: false
})