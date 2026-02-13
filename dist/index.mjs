import { mkdir } from "fs/promises";
import path from "path";
import { writeFile } from "node:fs/promises";
import path$1 from "node:path";
import fs from "fs";
import { Buffer as Buffer$1 } from "buffer";
import { JSDOM } from "jsdom";

//#region src/output/v2ray.ts
const _$3 = async (subs, dir) => {
	await writeFile(path$1.join(dir, "sub.txt"), subs.join("\n"), "utf8");
};

//#endregion
//#region src/output/clash.ts
const _$2 = async (subs, dir) => {
	await writeFile(path$1.join(dir, "clash.txt"), Buffer.from(subs.join("\n")).toString("base64"), "utf8");
};

//#endregion
//#region src/output/mihomo.ts
function getTemplateYaml() {
	const templatePath = path.resolve(process.cwd(), "clash_template.yaml");
	return fs.readFileSync(templatePath, "utf8");
}
function parseSS(url, idx) {
	let server = "", port = "", cipher = "", password = "";
	let match = url.match(/^ss:\/\/(.+)/);
	if (!match) return null;
	let info = match[1];
	if (info.includes("@")) {
		let [left, right] = info.split("@");
		let [method, pwd] = left.split(":");
		let [srv, prt] = right.split(":");
		cipher = method;
		password = pwd;
		server = srv;
		port = prt;
	} else try {
		const base64 = info.split("#")[0];
		const m = Buffer$1.from(base64, "base64").toString().match(/([^:]+):([^@]+)@([^:]+):(\d+)/);
		if (m) {
			cipher = m[1];
			password = m[2];
			server = m[3];
			port = m[4];
		}
	} catch {}
	return {
		name: `ss-${idx}`,
		type: "ss",
		server,
		port,
		cipher,
		password,
		udp: true
	};
}
function parseVMESS(url, idx) {
	let match = url.match(/^vmess:\/\/(.+)/);
	if (!match) return null;
	let decoded = "";
	try {
		decoded = Buffer$1.from(match[1], "base64").toString();
	} catch {}
	let obj = {};
	try {
		obj = JSON.parse(decoded);
	} catch {}
	return {
		name: `vmess-${idx}`,
		type: "vmess",
		server: obj.add || "",
		port: obj.port || "",
		uuid: obj.id || "",
		alterId: obj.aid || 0,
		cipher: obj.cipher || "auto",
		tls: obj.tls === "tls" || obj.tls === true,
		network: obj.net || "tcp",
		"ws-path": obj.path || "",
		"ws-headers": obj.host ? { Host: obj.host } : void 0
	};
}
function parseVLESS(url, idx) {
	let match = url.match(/^vless:\/\/(.+)/);
	if (!match) return null;
	let [user, host] = match[1].split("@");
	let [server, port] = host.split(":");
	let params = {};
	let query = host.split("?")[1];
	if (query) query.split("&").forEach((kv) => {
		let [k, v] = kv.split("=");
		params[k] = v;
	});
	return {
		name: `vless-${idx}`,
		type: "vless",
		server,
		port,
		uuid: user,
		...params
	};
}
function parseSSR(url, idx) {
	let match = url.match(/^ssr:\/\/(.+)/);
	if (!match) return null;
	let decoded = "";
	try {
		decoded = Buffer$1.from(match[1], "base64").toString();
	} catch {}
	let arr = decoded.split(":");
	if (arr.length < 6) return null;
	let [server, port, protocol, method, obfs, password] = arr;
	return {
		name: `ssr-${idx}`,
		type: "ssr",
		server,
		port,
		protocol,
		cipher: method,
		obfs,
		password
	};
}
function parseHysteria2(url, idx) {
	let match = url.match(/^hysteria2:\/\/(.+)/);
	if (!match) return null;
	let [user, host] = match[1].split("@");
	let [server, port] = host.split(":");
	let params = {};
	let query = host.split("?")[1];
	if (query) query.split("&").forEach((kv) => {
		let [k, v] = kv.split("=");
		params[k] = v;
	});
	return {
		name: `hysteria2-${idx}`,
		type: "hysteria2",
		server,
		port,
		...params
	};
}
function parseProxy(line, idx) {
	if (line.startsWith("ss://")) return parseSS(line, idx);
	if (line.startsWith("vmess://")) return parseVMESS(line, idx);
	if (line.startsWith("vless://")) return parseVLESS(line, idx);
	if (line.startsWith("ssr://")) return parseSSR(line, idx);
	if (line.startsWith("hysteria2://")) return parseHysteria2(line, idx);
	return {
		name: `unknown-${idx}`,
		type: "unknown",
		url: line
	};
}
function genProxiesYaml(subs) {
	return subs.map((line, idx) => {
		const obj = parseProxy(line, idx);
		if (!obj) return `  name: unknown-${idx}\n  type: unknown\n  url: ${line}`;
		return Object.entries(obj).map(([k, v]) => `  ${k}: ${v}`).join("\n");
	}).join("\n-\n");
}
const mihomo = async (subs, dir) => {
	const outPath = path.join(dir, "sub.yaml");
	let template = getTemplateYaml();
	const proxiesYaml = genProxiesYaml(subs);
	template = template.replace(/proxies:\s*\n/, `proxies:\n-\n${proxiesYaml}\n`);
	const proxyNames = subs.map((line, idx) => {
		const obj = parseProxy(line, idx);
		return obj && obj.name ? obj.name : `unknown-${idx}`;
	});
	template = template.replace(/proxies:\n([\s\S]*?)proxy-groups:/, `proxies:\n-\n${proxiesYaml}\nproxy-groups:`);
	template = template.replace(/proxies:\n([\s\S]*?)rules:/, () => {
		const autoGroup = `  - name: 自动选择\n    type: url-test\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    tolerance: 50\n    proxies:\n${proxyNames.map((n) => `      - ${n}`).join("\n")}`;
		return `proxies:\n-\n${proxiesYaml}\nproxy-groups:\n${`  - name: 节点选择\n    type: select\n    proxies:\n${proxyNames.map((n) => `      - ${n}`).join("\n")}\n      - 自动选择\n      - DIRECT`}\n\n${autoGroup}\n\nrules:`;
	});
	fs.writeFileSync(outPath, template, "utf8");
};

//#endregion
//#region src/output/index.ts
const outputResults = (subs, dir) => Promise.all([
	_$3(subs, dir),
	_$2(subs, dir),
	mihomo(subs, dir)
]);

//#endregion
//#region src/sources/ss.ts
const _$1 = async () => {
	const res = await fetch("https://github.com/Alvin9999-newpac/fanqiang/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7", { method: "GET" });
	if (!res.ok) throw new Error(`fail to fetch: ${res.status} ${res.statusText}`);
	const { document } = new JSDOM(await res.text()).window;
	return Array.from(document.querySelectorAll(".highlight-source-shell, .highlight-source-txt")).map((v) => v.textContent.replaceAll("#", "#" + encodeURI("group->ss ")));
};

//#endregion
//#region src/sources/v2ray.ts
const _ = async () => {
	const res = await fetch("https://github.com/Alvin9999-newpac/fanqiang/wiki/v2ray%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7", { method: "GET" });
	if (!res.ok) throw new Error(`fail to fetch: ${res.status} ${res.statusText}`);
	const { document } = new JSDOM(await res.text()).window;
	return Array.from(document.querySelectorAll(".highlight-source-shell, .highlight-source-txt")).map((v) => v.textContent.replaceAll("#", "#" + encodeURI("group->v2ray ")));
};

//#endregion
//#region src/sources/index.ts
const getSubscribeUrls = () => Promise.all([_(), _$1()]).then((v) => v.flat());

//#endregion
//#region src/index.ts
const nodeLists = await getSubscribeUrls();
const outDir = path.resolve(process.cwd(), "data");
await mkdir(outDir, { recursive: true });
await outputResults(nodeLists, outDir);

//#endregion
export {  };