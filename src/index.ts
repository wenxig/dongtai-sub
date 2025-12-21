import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { JSDOM } from "jsdom"
async function fetchAndWrite() {
  // 1. 从网络获取内容
  const sources = [
    'https://github.com/Alvin9999-newpac/fanqiang/wiki/v2ray%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7',
    'https://github.com/Alvin9999-newpac/fanqiang/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7',
  ]
  const nodeLists = await Promise.all(sources.map(async source => {
    const res = await fetch(source, {
      method: 'GET',
    })
    console.log('header done')
    if (!res.ok) {
      throw new Error(`请求失败：${res.status} ${res.statusText}`)
    }
    const { document } = (new JSDOM(await res.text())).window
    return Array.from(document.querySelectorAll<HTMLDivElement>('.highlight-source-shell')).map(v => v.textContent)
  }))

  // 2. 确保输出目录存在
  const outDir = path.resolve(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })

  // 3. 写入文件
  const outPath = path.join(outDir, 'sub.txt')
  await writeFile(outPath, nodeLists.flat().join('\n'), 'utf8')

  console.log(`✅ 已写入 ${outPath}`)
}

fetchAndWrite().catch(err => {
  console.error('❌ 脚本执行出错：', err)
  process.exit(1)
})
