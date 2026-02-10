import { mkdir } from 'fs/promises'
import path from 'path'

import { outputResults } from './output'
import { getSubscribeUrls } from './sources'

const nodeLists = await getSubscribeUrls()

const outDir = path.resolve(process.cwd(), 'data')
await mkdir(outDir, { recursive: true })

await outputResults(nodeLists, outDir)