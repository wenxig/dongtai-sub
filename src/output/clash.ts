import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Generator } from '../model'

const _: Generator = async (subs, dir) => {
  const outPath = path.join(dir, 'clash.txt')
  const base64 = Buffer.from(subs.join('\n')).toString('base64')
  await writeFile(outPath, base64, 'utf8')
}

export default _