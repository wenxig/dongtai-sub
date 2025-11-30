import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { JSDOM } from "jsdom"
async function fetchAndWrite() {
  // 1. 从网络获取内容
  console.log('begin get')
  const url = 'https://github.com/Alvin9999/new-pac/wiki/v2ray%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7'
  const res = await fetch(url, {
    method: 'GET',
  })
  console.log('header done')
  if (!res.ok) {
    throw new Error(`请求失败：${res.status} ${res.statusText}`)
  }
  const { document } = (new JSDOM(await res.text())).window
  const text = Array.from(document.querySelectorAll<HTMLDivElement>('.highlight-source-shell')).map(v => v.textContent).join('\n')
  console.log('body done', text)


  // 2. 确保输出目录存在
  const outDir = path.resolve(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })

  // 3. 写入文件
  const outPath = path.join(outDir, 'sub.txt')
  await writeFile(outPath, text, 'utf8')

  console.log(`✅ 已写入 ${outPath}`)
}

fetchAndWrite().catch(err => {
  console.error('❌ 脚本执行出错：', err)
  process.exit(1)
})