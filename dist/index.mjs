import { mkdir } from "fs/promises";
import path from "path";
import { writeFile } from "node:fs/promises";
import path$1 from "node:path";
import fs from "fs";
import yaml from "js-yaml";
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
	const atMatch = url.match(/^ss:\/\/(.+)@(.+):(\d+)(?:#(.+))?/);
	if (atMatch) {
		const [_, base64, server, port, nameRaw] = atMatch;
		let decoded = "";
		try {
			decoded = Buffer$1.from(base64.split("?")[0], "base64").toString();
		} catch {}
		const m = decoded.match(/([^:]+):(.+)/);
		if (m) {
			const [, cipher, password] = m;
			return {
				name: nameRaw ? `[SS] ${decodeURIComponent(nameRaw)}` : `ss-${idx}`,
				server: server.replace(/^\[|\]$/g, ""),
				port: Number(port),
				type: "ss",
				cipher,
				password
			};
		}
	}
	const base64Match = url.match(/^ss:\/\/(.+?)(?:#(.+))?$/);
	if (base64Match) {
		const [_, base64, nameRaw] = base64Match;
		let decoded = "";
		try {
			decoded = Buffer$1.from(base64.split("?")[0], "base64").toString();
		} catch {}
		const m = decoded.match(/([^:]+):(.+)@([^:]+):(\d+)/);
		if (m) {
			const [, cipher, password, server, port] = m;
			return {
				name: nameRaw ? `[SS] ${decodeURIComponent(nameRaw)}` : `ss-${idx}`,
				server: server.replace(/^\[|\]$/g, ""),
				port: Number(port),
				type: "ss",
				cipher,
				password
			};
		}
	}
	const match = url.match(/^ss:\/\/(.+):(.+)@(.+):(\d+)(?:#(.+))?/);
	if (match) {
		const [_, cipher, password, server, port, nameRaw] = match;
		return {
			name: nameRaw ? `[SS] ${decodeURIComponent(nameRaw)}` : `ss-${idx}`,
			server: server.replace(/^\[|\]$/g, ""),
			port: Number(port),
			type: "ss",
			cipher,
			password
		};
	}
	return null;
}
function parseVMESS(url, idx) {
	const match = url.match(/^vmess:\/\/(.+)/);
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
		name: obj.ps ? `[Vmess] ${obj.ps}` : `vmess-${idx}`,
		server: obj.add || "",
		port: Number(obj.port) || "",
		type: "vmess",
		uuid: obj.id || "",
		alterId: obj.aid || 0,
		cipher: obj.cipher || "auto",
		tls: obj.tls === "tls" || obj.tls === true,
		"skip-cert-verify": true,
		network: obj.net || "tcp",
		"ws-opts": {
			path: obj.path || "",
			headers: { Host: obj.host || "" }
		}
	};
}
function parseHysteria2(url, idx) {
	const match = url.match(/^hysteria2:\/\/(.+)@(.+):(\d+)(?:\?([^#]+))?(?:#(.+))?/);
	if (!match) return null;
	const [_, password, server, port, query, nameRaw] = match;
	const params = {};
	if (query) query.split("&").forEach((kv) => {
		const [k, v] = kv.split("=");
		if (k === "alpn") params.alpn = [v];
		else params[k] = v;
	});
	return {
		name: nameRaw ? `[Hysteria2] ${decodeURIComponent(nameRaw)}` : `hysteria2-${idx}`,
		server,
		port: Number(port),
		type: "hysteria2",
		password,
		auth: password,
		"skip-cert-verify": true,
		...params
	};
}
function parseVLESS(url, idx) {
	const match = url.match(/^vless:\/\/(.+)@(.+):(\d+)(?:\?([^#]+))?(?:#(.+))?/);
	if (!match) return null;
	const [_, uuid, server, port, query, nameRaw] = match;
	const params = {};
	if (query) query.split("&").forEach((kv) => {
		const [k, v] = kv.split("=");
		if (k !== "type") params[k] = v;
	});
	return {
		name: nameRaw ? `[VLESS] ${decodeURIComponent(nameRaw)}` : `vless-${idx}`,
		server,
		port: Number(port),
		type: "vless",
		uuid,
		"skip-cert-verify": true,
		...params
	};
}
function parseTROJAN(url, idx) {
	const match = url.match(/^trojan:\/\/(.+)@(.+):(\d+)(?:\?([^#]+))?(?:#(.+))?/);
	if (!match) return null;
	const [_, password, server, port, query, nameRaw] = match;
	const params = {};
	if (query) query.split("&").forEach((kv) => {
		const [k, v] = kv.split("=");
		params[k] = v;
	});
	return {
		name: nameRaw ? `[Trojan] ${decodeURIComponent(nameRaw)}` : `trojan-${idx}`,
		server,
		port: Number(port),
		type: "trojan",
		password,
		"skip-cert-verify": true,
		...params
	};
}
function parseProxy(line, idx) {
	if (line.startsWith("ss://")) return parseSS(line, idx);
	if (line.startsWith("vmess://")) return parseVMESS(line, idx);
	if (line.startsWith("hysteria2://")) return parseHysteria2(line, idx);
	if (line.startsWith("vless://")) return parseVLESS(line, idx);
	if (line.startsWith("trojan://")) return parseTROJAN(line, idx);
	return null;
}
function genProxiesArr(subs) {
	return subs.map((line, idx) => parseProxy(line, idx)).filter(Boolean);
}
const mihomo = async (subs, dir) => {
	const outPath = path.join(dir, "sub.yaml");
	let template = getTemplateYaml();
	const doc = yaml.load(template);
	const proxiesArr = genProxiesArr(subs);
	doc.proxies = proxiesArr;
	const proxyNames = proxiesArr.map((p) => p.name);
	doc["proxy-groups"] = [{
		name: "节点选择",
		type: "select",
		proxies: [
			...proxyNames,
			"自动选择",
			"DIRECT"
		]
	}, {
		name: "自动选择",
		type: "url-test",
		url: "http://www.gstatic.com/generate_204",
		interval: 300,
		tolerance: 50,
		proxies: proxyNames
	}];
	fs.writeFileSync(outPath, yaml.dump(doc, { lineWidth: 120 }), "utf8");
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