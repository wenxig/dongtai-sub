import type { Generator } from '../model'

const writers = await Promise.all(
  (await Array.fromAsync(new Bun.Glob('./*.ts').scan({ cwd: import.meta.dirname })))
    .filter(path => !path.includes('index'))
    .map(v => import(v).then<Generator>(v => v.default))
)

export const outputResults: Generator = (subs, dir) =>
  Promise.all(writers.map(writer => writer(subs, dir)))