import type { Generator } from '../model'

import clash from './clash'
import v2ray from './v2ray'

const writers: Generator[] = [clash, v2ray]

export const outputResults: Generator = (subs, dir) =>
  Promise.all(writers.map(writer => writer(subs, dir)))