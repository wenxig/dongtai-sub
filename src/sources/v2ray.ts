import { JSDOM } from 'jsdom'

import type { SourceGetter } from '../model'

const _: SourceGetter = async () => {
  const source =
    'https://github.com/Alvin9999-newpac/fanqiang/wiki/v2ray%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7'
  const res = await fetch(source, { method: 'GET' })
  if (!res.ok) throw new Error(`fail to fetch: ${res.status} ${res.statusText}`)

  const { document } = new JSDOM(await res.text()).window
  return Array.from(
    document.querySelectorAll<HTMLDivElement>('.highlight-source-shell, .highlight-source-txt')
  ).map(v => v.textContent.replaceAll('#', '#' + encodeURI('[group:v2ray] ')))
}

export default _