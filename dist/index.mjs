import { mkdir } from "fs/promises";
import path from "path";
import { writeFile } from "node:fs/promises";
import path$1 from "node:path";
import { stringify } from "yaml";
import { JSDOM } from "jsdom";

//#region src/output/v2ray.ts
const _$3 = async (subs, dir) => {
	await writeFile(path$1.join(dir, "sub.txt"), subs.join("\n"), "utf8");
};

//#endregion
//#region src/output/clash.ts
const _$2 = async (subs, dir) => {
	await writeFile(path$1.join(dir, "clash.txt"), stringify({ proxies: subs.map((sub) => {
		return {
			name: sub,
			type: sub.split(":", 1)[0] ?? "unknown",
			url: sub
		};
	}) }), "utf8");
};

//#endregion
//#region src/output/index.ts
const outputResults = (subs, dir) => Promise.all([_$3(subs, dir), _$2(subs, dir)]);

//#endregion
//#region src/sources/ss.ts
const _$1 = async () => {
	const res = await fetch("https://github.com/Alvin9999-newpac/fanqiang/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7", { method: "GET" });
	if (!res.ok) throw new Error(`fail to fetch: ${res.status} ${res.statusText}`);
	const { document } = new JSDOM(await res.text()).window;
	return Array.from(document.querySelectorAll(".highlight-source-shell, .highlight-source-txt")).map((v) => v.textContent.replaceAll("#", "#" + encodeURI("[group:ss] ")));
};

//#endregion
//#region src/sources/v2ray.ts
const _ = async () => {
	const res = await fetch("https://github.com/Alvin9999-newpac/fanqiang/wiki/v2ray%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7", { method: "GET" });
	if (!res.ok) throw new Error(`fail to fetch: ${res.status} ${res.statusText}`);
	const { document } = new JSDOM(await res.text()).window;
	return Array.from(document.querySelectorAll(".highlight-source-shell, .highlight-source-txt")).map((v) => v.textContent.replaceAll("#", "#" + encodeURI("[group:v2ray] ")));
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