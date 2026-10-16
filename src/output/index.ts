import type { Generator } from '../model'

import mihomo from './mihomo'
import v2ray from './v2ray'

const writers: Generator[] = [mihomo, v2ray]

export const outputResults: Generator = (subs, dir) =>
  Promise.all(writers.map(writer => writer(subs, dir)))