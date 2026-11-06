/**
 * VnExpress Design System: chèn khối hướng dẫn VDS cho AI agent vào file hướng dẫn của dự án (AGENTS.md).
 *
 *   node <thư mục VDS>/agents/install.mjs                  chèn vào ./AGENTS.md (tạo file nếu chưa có)
 *   node <thư mục VDS>/agents/install.mjs docs/AGENTS.md
 *
 * Khối nằm giữa hai dòng <!-- VDS:START … --> và <!-- VDS:END -->. Đã có khối thì chỉ thay đúng khối đó (vd khi nâng
 * VDS), phần còn lại của file giữ nguyên; chưa có thì thêm vào cuối file. Nội dung khối: vds-agents.md cùng thư mục.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BLOCK = /<!-- VDS:START[^>]*-->[\s\S]*?<!-- VDS:END -->/
const block = readFileSync(new URL('./vds-agents.md', import.meta.url), 'utf8').trim()
const target = resolve(process.argv[2] ?? 'AGENTS.md')
const version = block.match(/<!-- VDS:START (\S+)/)?.[1] ?? ''

if (!existsSync(target)) {
  writeFileSync(target, `${block}\n`)
  console.log(`✓ Đã tạo ${target} với khối hướng dẫn VDS ${version}.`)
} else {
  const text = readFileSync(target, 'utf8')
  const found = text.match(BLOCK)
  writeFileSync(target, found ? text.replace(BLOCK, () => block) : `${text.replace(/\s*$/, '')}\n\n${block}\n`)
  console.log(`✓ ${found ? 'Đã thay' : 'Đã thêm'} khối hướng dẫn VDS ${version} trong ${target}.`)
}
const claude = resolve(target, '../CLAUDE.md')
if (!existsSync(claude) || !readFileSync(claude, 'utf8').includes('@AGENTS.md')) {
  console.log('  Claude Code đọc CLAUDE.md: thêm dòng @AGENTS.md vào CLAUDE.md cạnh AGENTS.md để Claude nạp cùng.')
}
console.log('  Ngoài khối, ghi mục "VDS trong dự án này": thư mục bộ file VDS, server dựng thẻ ở đâu, component đang dùng.')
