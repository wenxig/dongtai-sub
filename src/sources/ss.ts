import type { SourceGetter } from '../model'

import { extractSubscriptions } from './extract'

const source =
  'https://raw.githubusercontent.com/wiki/Alvin9999-newpac/fanqiang/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7.md'

export default (async (): Promise<string[]> => {
  const res = await Bun.fetch(source, { method: 'GET' })
  if (!res.ok) throw new Error(`fail to fetch: ${res.status} ${res.statusText}`)

  return extractSubscriptions(await res.text())
}) as SourceGetter