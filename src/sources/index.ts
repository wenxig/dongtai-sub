import type { SourceGetter } from '../model'

import ss from './ss'
import v2ray from './v2ray'

export const getSubscribeUrls: SourceGetter = () => Promise.all([v2ray(), ss()]).then(v => v.flat())