import type { SourceGetter } from '../model'

const getters = await Promise.all(
  (await Array.fromAsync(new Bun.Glob('./*.ts').scan({ cwd: import.meta.dirname })))
    .filter(path => !path.includes('index'))
    .map(path => import(path).then<SourceGetter>(v => v.default))
)

export const getSubscribeUrls: SourceGetter = () =>
  Promise.all(getters.map(getter => getter())).then(v => v.flat())