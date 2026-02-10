import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Generator } from '../model'


const _: Generator = async (subs, dir) => {
  const outPath = path.join(dir, 'sub.txt')
  await writeFile(outPath, subs.join('\n'), 'utf8')
}

export default _