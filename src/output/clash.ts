import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import { stringify } from 'yaml'

import type { Generator } from '../model'

const _: Generator = async (subs, dir) => {
  const outPath = path.join(dir, 'clash.txt')
  const proxies = subs.map(sub => {
    const scheme = sub.split(':', 1)[0] ?? 'unknown'
    return { name: sub, type: scheme, url: sub }
  })
  const doc = { proxies }
  await writeFile(outPath, stringify(doc), 'utf8')
}

export default _