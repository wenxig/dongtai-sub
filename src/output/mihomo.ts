import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import type { Generator } from '../model'
import { Buffer } from 'buffer'

function getTemplateYaml(): string {
  const templatePath = path.resolve(process.cwd(), 'clash_template.yaml')
  return fs.readFileSync(templatePath, 'utf8')
}

function parseSS(url: string, idx: number) {
  // ss://[method]:[password]@[server]:[port]#name
  const match = url.match(/^ss:\/\/(.+)@(.+):(\d+)(?:#(.+))?/);
  if (!match) return null;
  const [_, methodPwd, server, port, nameRaw] = match;
  const [cipher, password] = methodPwd.split(':');
  const name = nameRaw ? `[SS] ${decodeURIComponent(nameRaw)}` : `ss-${idx}`;
  return {
    name,
    server,
    port: Number(port),
    type: 'ss',
    cipher,
    password
  };
}

function parseVMESS(url: string, idx: number) {
  // vmess://base64json
  const match = url.match(/^vmess:\/\/(.+)/);
  if (!match) return null;
  let decoded = '';
  try { decoded = Buffer.from(match[1], 'base64').toString(); } catch {}
  let obj: any = {};
  try { obj = JSON.parse(decoded); } catch {}
  const name = obj.ps ? `[Vmess] ${obj.ps}` : `vmess-${idx}`;
  return {
    name,
    server: obj.add || '',
    port: Number(obj.port) || '',
    type: 'vmess',
    uuid: obj.id || '',
    alterId: obj.aid || 0,
    cipher: obj.cipher || 'auto',
    tls: obj.tls === 'tls' || obj.tls === true,
    'skip-cert-verify': true,
    network: obj.net || 'tcp',
    'ws-opts': {
      path: obj.path || '',
      headers: { Host: obj.host || '' }
    }
  };
}

function parseHysteria2(url: string, idx: number) {
  // hysteria2://password@server:port?sni=xxx&alpn=xxx#name
  const match = url.match(/^hysteria2:\/\/(.+)@(.+):(\d+)(?:\?([^#]+))?(?:#(.+))?/);
  if (!match) return null;
  const [_, password, server, port, query, nameRaw] = match;
  const params = {} as any;
  if (query) {
    query.split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      if (k === 'alpn') params.alpn = [v];
      else params[k] = v;
    });
  }
  const name = nameRaw ? `[Hysteria2] ${decodeURIComponent(nameRaw)}` : `hysteria2-${idx}`;
  return {
    name,
    server,
    port: Number(port),
    type: 'hysteria2',
    password,
    auth: password,
    'skip-cert-verify': true,
    ...params
  };
}

function parseVLESS(url: string, idx: number) {
  // vless://uuid@server:port?params#name
  const match = url.match(/^vless:\/\/(.+)@(.+):(\d+)(?:\?([^#]+))?(?:#(.+))?/);
  if (!match) return null;
  const [_, uuid, server, port, query, nameRaw] = match;
  const params: Record<string, string> = {};
  if (query) {
    query.split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      params[k] = v;
    });
  }
  const name = nameRaw ? `[VLESS] ${decodeURIComponent(nameRaw)}` : `vless-${idx}`;
  return {
    name,
    server,
    port: Number(port),
    type: 'vless',
    uuid,
    'skip-cert-verify': true,
    ...params
  };
}

function parseTROJAN(url: string, idx: number) {
  // trojan://password@server:port?params#name
  const match = url.match(/^trojan:\/\/(.+)@(.+):(\d+)(?:\?([^#]+))?(?:#(.+))?/);
  if (!match) return null;
  const [_, password, server, port, query, nameRaw] = match;
  const params: Record<string, string> = {};
  if (query) {
    query.split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      params[k] = v;
    });
  }
  const name = nameRaw ? `[Trojan] ${decodeURIComponent(nameRaw)}` : `trojan-${idx}`;
  return {
    name,
    server,
    port: Number(port),
    type: 'trojan',
    password,
    'skip-cert-verify': true,
    ...params
  };
}

function parseProxy(line: string, idx: number) {
  if (line.startsWith('ss://')) return parseSS(line, idx);
  if (line.startsWith('vmess://')) return parseVMESS(line, idx);
  if (line.startsWith('hysteria2://')) return parseHysteria2(line, idx);
  if (line.startsWith('vless://')) return parseVLESS(line, idx);
  if (line.startsWith('trojan://')) return parseTROJAN(line, idx);
  return null;
}

function genProxiesArr(subs: string[]): any[] {
  return subs.map((line, idx) => parseProxy(line, idx)).filter(Boolean);
}

const mihomo: Generator = async (subs, dir) => {
  const outPath = path.join(dir, 'sub.yaml');
  let template = getTemplateYaml();
  const doc = yaml.load(template) as any;
  const proxiesArr = genProxiesArr(subs);
  doc.proxies = proxiesArr;
  const proxyNames = proxiesArr.map(p => p.name);
  doc['proxy-groups'] = [
    {
      name: '节点选择',
      type: 'select',
      proxies: [...proxyNames, '自动选择', 'DIRECT']
    },
    {
      name: '自动选择',
      type: 'url-test',
      url: 'http://www.gstatic.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: proxyNames
    }
  ];
  fs.writeFileSync(outPath, yaml.dump(doc, { lineWidth: 120 }), 'utf8');
}

export default mihomo;