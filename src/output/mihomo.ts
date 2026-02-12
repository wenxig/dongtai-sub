import fs from 'fs'
import path from 'path'
import type { Generator } from '../model'
import { Buffer } from 'buffer'

function getTemplateYaml(): string {
  const templatePath = path.resolve(process.cwd(), 'clash_template.yaml')
  return fs.readFileSync(templatePath, 'utf8')
}

function parseSS(url: string, idx: number) {
  let server = '', port = '', cipher = '', password = '';
  let match = url.match(/^ss:\/\/(.+)/);
  if (!match) return null;
  let info = match[1];
  if (info.includes('@')) {
    let [left, right] = info.split('@');
    let [method, pwd] = left.split(':');
    let [srv, prt] = right.split(':');
    cipher = method;
    password = pwd;
    server = srv;
    port = prt;
  } else {
    try {
      const base64 = info.split('#')[0];
      const decoded = Buffer.from(base64, 'base64').toString();
      const m = decoded.match(/([^:]+):([^@]+)@([^:]+):(\d+)/);
      if (m) {
        cipher = m[1];
        password = m[2];
        server = m[3];
        port = m[4];
      }
    } catch {}
  }
  return { name: `ss-${idx}`, type: 'ss', server, port, cipher, password, udp: true };
}

function parseVMESS(url: string, idx: number) {
  let match = url.match(/^vmess:\/\/(.+)/);
  if (!match) return null;
  let decoded = '';
  try { decoded = Buffer.from(match[1], 'base64').toString(); } catch {}
  let obj: any = {};
  try { obj = JSON.parse(decoded); } catch {}
  return {
    name: `vmess-${idx}`,
    type: 'vmess',
    server: obj.add || '',
    port: obj.port || '',
    uuid: obj.id || '',
    alterId: obj.aid || 0,
    cipher: obj.cipher || 'auto',
    tls: obj.tls === 'tls' || obj.tls === true,
    network: obj.net || 'tcp',
    'ws-path': obj.path || '',
    'ws-headers': obj.host ? { Host: obj.host } : undefined
  };
}

function parseVLESS(url: string, idx: number) {
  let match = url.match(/^vless:\/\/(.+)/);
  if (!match) return null;
  let info = match[1];
  let [user, host] = info.split('@');
  let [server, port] = host.split(':');
  let params: Record<string, string> = {};
  let query = host.split('?')[1];
  if (query) {
    query.split('&').forEach(kv => {
      let [k, v] = kv.split('=');
      params[k] = v;
    });
  }
  return {
    name: `vless-${idx}`,
    type: 'vless',
    server,
    port,
    uuid: user,
    ...params
  };
}

function parseSSR(url: string, idx: number) {
  let match = url.match(/^ssr:\/\/(.+)/);
  if (!match) return null;
  let decoded = '';
  try { decoded = Buffer.from(match[1], 'base64').toString(); } catch {}
  let arr = decoded.split(':');
  if (arr.length < 6) return null;
  let [server, port, protocol, method, obfs, password] = arr;
  return {
    name: `ssr-${idx}`,
    type: 'ssr',
    server,
    port,
    protocol,
    cipher: method,
    obfs,
    password
  };
}

function parseHysteria2(url: string, idx: number) {
  let match = url.match(/^hysteria2:\/\/(.+)/);
  if (!match) return null;
  let info = match[1];
  let [user, host] = info.split('@');
  let [server, port] = host.split(':');
  let params: Record<string, string> = {};
  let query = host.split('?')[1];
  if (query) {
    query.split('&').forEach(kv => {
      let [k, v] = kv.split('=');
      params[k] = v;
    });
  }
  return {
    name: `hysteria2-${idx}`,
    type: 'hysteria2',
    server,
    port,
    ...params
  };
}

function parseProxy(line: string, idx: number) {
  if (line.startsWith('ss://')) return parseSS(line, idx);
  if (line.startsWith('vmess://')) return parseVMESS(line, idx);
  if (line.startsWith('vless://')) return parseVLESS(line, idx);
  if (line.startsWith('ssr://')) return parseSSR(line, idx);
  if (line.startsWith('hysteria2://')) return parseHysteria2(line, idx);
  return { name: `unknown-${idx}`, type: 'unknown', url: line };
}

function genProxiesYaml(subs: string[]): string {
  return subs.map((line, idx) => {
    const obj = parseProxy(line, idx);
    if (!obj) return `  name: unknown-${idx}\n  type: unknown\n  url: ${line}`;
    return Object.entries(obj).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  }).join('\n-\n');
}

const mihomo: Generator = async (subs, dir) => {
  const outPath = path.join(dir, 'sub.yaml');
  let template = getTemplateYaml();
  const proxiesYaml = genProxiesYaml(subs);
  template = template.replace(/proxies:\s*\n/, `proxies:\n-\n${proxiesYaml}\n`);
  const proxyNames = subs.map((line, idx) => {
    const obj = parseProxy(line, idx);
    return obj && obj.name ? obj.name : `unknown-${idx}`;
  });
  template = template.replace(/proxies:\n([\s\S]*?)proxy-groups:/, `proxies:\n-\n${proxiesYaml}\nproxy-groups:`);
  template = template.replace(/proxies:\n([\s\S]*?)rules:/, () => {
    const autoGroup = `  - name: 自动选择\n    type: url-test\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    tolerance: 50\n    proxies:\n${proxyNames.map(n => `      - ${n}`).join('\n')}`;
    const selectGroup = `  - name: 节点选择\n    type: select\n    proxies:\n${proxyNames.map(n => `      - ${n}`).join('\n')}\n      - 自动选择\n      - DIRECT`;
    return `proxies:\n-\n${proxiesYaml}\nproxy-groups:\n${selectGroup}\n\n${autoGroup}\n\nrules:`;
  });
  fs.writeFileSync(outPath, template, 'utf8');
}

export default mihomo;