import type { Generator } from '../model'

import v2ray from './v2ray'
import clash from './clash'
import mihomo from './mihomo'

export const outputResults: Generator = (subs, dir) =>
  Promise.all([v2ray(subs, dir), clash(subs, dir), mihomo(subs, dir)])