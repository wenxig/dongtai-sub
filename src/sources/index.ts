import type { SourceGetter } from '../model'

import getSS from './ss'
import getV2ray from './v2ray'

const getters: SourceGetter[] = [getSS, getV2ray]

export const getSubscribeUrls: SourceGetter = () =>
  Promise.all(getters.map(getter => getter())).then(results => results.flat())