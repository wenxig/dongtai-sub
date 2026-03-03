import { Buffer } from 'buffer'
import path from 'path'

import type { Generator } from '../model'

const templateDocPromise = Bun.file(path.resolve(process.cwd(), 'clash_template.yaml'))
  .text()
  .then(text => Bun.YAML.parse(text) as Record<string, any>)

const SS_PREFIX = 'ss://'
const VMESS_PREFIX = 'vmess://'
const HYSTERIA2_PREFIX = 'hysteria2://'
const VLESS_PREFIX = 'vless://'
const TROJAN_PREFIX = 'trojan://'

function parseQuery(
  query: string,
  params: Record<string, any>,
  opts?: { skipType?: boolean; alpnAsArray?: boolean }
) {
  let start = 0
  while (start < query.length) {
    let amp = query.indexOf('&', start)
    if (amp === -1) amp = query.length
    const pair = query.slice(start, amp)
    const eq = pair.indexOf('=')
    const key = eq === -1 ? pair : pair.slice(0, eq)
    if (key && (!opts?.skipType || key !== 'type')) {
      const value = eq === -1 ? '' : pair.slice(eq + 1)
      if (opts?.alpnAsArray && key === 'alpn') params.alpn = [value]
      else params[key] = value
    }
    start = amp + 1
  }
}

function splitHostPort(hostPort: string) {
  if (hostPort.startsWith('[')) {
    const right = hostPort.indexOf(']')
    return { server: hostPort.slice(1, right), port: Number(hostPort.slice(right + 2)) }
  }
  const sep = hostPort.lastIndexOf(':')
  return { server: hostPort.slice(0, sep), port: Number(hostPort.slice(sep + 1)) }
}

function parseName(prefix: string, nameRaw: string, fallback: string) {
  return nameRaw ? `[${prefix}] ${decodeURIComponent(nameRaw)}` : fallback
}

function splitBody(body: string) {
  const hash = body.indexOf('#')
  const withQuery = hash === -1 ? body : body.slice(0, hash)
  const nameRaw = hash === -1 ? '' : body.slice(hash + 1)
  const q = withQuery.indexOf('?')
  return {
    authority: q === -1 ? withQuery : withQuery.slice(0, q),
    query: q === -1 ? '' : withQuery.slice(q + 1),
    nameRaw
  }
}

function parseAuthUrl(raw: string, prefixLen: number) {
  const { authority, query, nameRaw } = splitBody(raw.slice(prefixLen))
  const at = authority.lastIndexOf('@')
  const auth = authority.slice(0, at)
  const { server, port } = splitHostPort(authority.slice(at + 1))
  return { auth, server, port, query, nameRaw }
}

function parseSS(url: string, idx: number) {
  const { authority, nameRaw } = splitBody(url.slice(SS_PREFIX.length))
  const at = authority.lastIndexOf('@')

  let cipher = ''
  let password = ''
  let server = ''
  let port = 0

  if (at !== -1) {
    const auth = authority.slice(0, at)
    ;({ server, port } = splitHostPort(authority.slice(at + 1)))
    if (auth.includes(':')) {
      const sep = auth.indexOf(':')
      cipher = auth.slice(0, sep)
      password = auth.slice(sep + 1)
    } else {
      const decoded = Buffer.from(auth, 'base64').toString()
      const sep = decoded.indexOf(':')
      cipher = decoded.slice(0, sep)
      password = decoded.slice(sep + 1)
    }
  } else {
    const decoded = Buffer.from(authority, 'base64').toString()
    const authSep = decoded.lastIndexOf('@')
    const methodAndPass = decoded.slice(0, authSep)
    ;({ server, port } = splitHostPort(decoded.slice(authSep + 1)))
    const sep = methodAndPass.indexOf(':')
    cipher = methodAndPass.slice(0, sep)
    password = methodAndPass.slice(sep + 1)
  }

  return { name: parseName('SS', nameRaw, `ss-${idx}`), server, port, type: 'ss', cipher, password }
}

function parseVMESS(url: string, idx: number) {
  const decoded = Buffer.from(url.slice(VMESS_PREFIX.length), 'base64').toString()
  const obj = JSON.parse(decoded) as Record<string, any>

  return {
    'name': obj.ps ? `[Vmess] ${obj.ps}` : `vmess-${idx}`,
    'server': obj.add,
    'port': Number(obj.port),
    'type': 'vmess',
    'uuid': obj.id,
    'alterId': obj.aid || 0,
    'cipher': obj.cipher || 'auto',
    'tls': obj.tls === 'tls' || obj.tls === true,
    'skip-cert-verify': true,
    'network': obj.net || 'tcp',
    'ws-opts': { path: obj.path || '', headers: { Host: obj.host || '' } }
  }
}

function parseHysteria2(url: string, idx: number) {
  const {
    auth: password,
    server,
    port,
    query,
    nameRaw
  } = parseAuthUrl(url, HYSTERIA2_PREFIX.length)
  const params: Record<string, any> = {}
  if (query) parseQuery(query, params, { alpnAsArray: true })

  return {
    'name': parseName('Hysteria2', nameRaw, `hysteria2-${idx}`),
    server,
    port,
    'type': 'hysteria2',
    password,
    'auth': password,
    'skip-cert-verify': true,
    ...params
  }
}

function parseVLESS(url: string, idx: number) {
  const { auth: uuid, server, port, query, nameRaw } = parseAuthUrl(url, VLESS_PREFIX.length)
  const params: Record<string, string> = {}
  if (query) parseQuery(query, params, { skipType: true })

  return {
    'name': parseName('VLESS', nameRaw, `vless-${idx}`),
    server,
    port,
    'type': 'vless',
    uuid,
    'skip-cert-verify': true,
    ...params
  }
}

function parseTROJAN(url: string, idx: number) {
  const { auth: password, server, port, query, nameRaw } = parseAuthUrl(url, TROJAN_PREFIX.length)
  const params: Record<string, string> = {}
  if (query) parseQuery(query, params)

  return {
    'name': parseName('Trojan', nameRaw, `trojan-${idx}`),
    server,
    port,
    'type': 'trojan',
    password,
    'skip-cert-verify': true,
    ...params
  }
}

function parseProxy(line: string, idx: number) {
  const sep = line.indexOf('://')
  if (sep === -1) return null

  try {
    switch (line.slice(0, sep)) {
      case 'ss':
        return parseSS(line, idx)
      case 'vmess':
        return parseVMESS(line, idx)
      case 'hysteria2':
        return parseHysteria2(line, idx)
      case 'vless':
        return parseVLESS(line, idx)
      case 'trojan':
        return parseTROJAN(line, idx)
      default:
        return null
    }
  } catch {
    return null
  }
}

const mihomo: Generator = async (subs, dir) => {
  const base = await templateDocPromise
  const doc = { ...base } as any

  const proxies: any[] = []
  const proxyNames: string[] = []
  for (let i = 0; i < subs.length; i += 1) {
    const proxy = parseProxy(subs[i], i)
    if (!proxy) continue
    proxies.push(proxy)
    proxyNames.push(proxy.name)
  }

  doc.proxies = proxies
  doc['proxy-groups'] = [
    { name: '节点选择', type: 'select', proxies: proxyNames.concat('自动选择', 'DIRECT') },
    {
      name: '自动选择',
      type: 'url-test',
      url: 'http://www.gstatic.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: proxyNames
    }
  ]
  await Bun.write(path.join(dir, 'sub.yaml'), Bun.YAML.stringify(doc))
}

export default mihomo