/**
 * VnExpress Design System: dựng thẻ VDS phía server, trước khi gửi trang về trình duyệt.
 * Mã mẫu cho Node.js 18 trở lên, không cần thư viện ngoài. Cùng quy tắc với vds-tags.php và vds-components.js;
 * server viết bằng ngôn ngữ khác làm theo README.md cùng thư mục.
 *
 * HTML viết thẻ VDS: component <vds-button variant="accent">Lưu</vds-button>, icon <vds-icon name="Bookmark__Regular__24">
 * </vds-icon>, logo <vds-logo name="Logo__VnExpress__Standard"></vds-logo>. expand() đổi mọi thẻ thành HTML đầy đủ,
 * nên trang hiện đúng ngay, không cần JS.
 *
 *   import { createVdsTags } from '/var/www/vds-<phiên bản>/server/vds-tags.mjs'
 *   const vds = createVdsTags() // nguồn: bộ phát hành chứa file này
 *   res.send(await vds.expand(html))
 *
 * Nguồn ở chỗ khác, vd server VDS của công ty: createVdsTags({ source: 'https://…/<phiên bản>/' }).
 * Trang HTML tĩnh (landing page, mini-site): node vds-tags.mjs dist/index.html dist/about.html (ghi đè từng file).
 */
import { realpathSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ASSET_NAME, ASSET_TAG, expandComponents, iconName, parseAttrs, toSvg, upgradeLegacy } from './vds-core.mjs'

/** Thư mục gốc dạng URL, có "/" ở cuối: nhận URL, chuỗi http(s)://, file://, hoặc đường dẫn trên máy. */
function baseUrl(source) {
  const url = source instanceof URL ? new URL(source) : /^[a-z][a-z\d+.-]*:\/\//i.test(source) ? new URL(source) : pathToFileURL(resolve(source))
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url
}

/**
 * @param {{ source?: string | URL, warn?: (message: string) => void }} [options]
 *   source: thư mục bộ phát hành VDS (chứa components/, icons/, logos/), đường dẫn trên server hoặc địa chỉ http(s).
 *   Mặc định: bộ phát hành chứa file này. warn: ghi cảnh báo (thẻ, thuộc tính, tên sai, tên cũ), mặc định console.warn.
 */
export function createVdsTags({ source = new URL('..', import.meta.url), warn = (message) => console.warn(message) } = {}) {
  const base = baseUrl(source)
  // Bộ phát hành không bao giờ đổi: mỗi file chỉ đọc một lần trong suốt thời gian chạy server.
  const files = new Map()
  const read = (path) => {
    if (!files.has(path)) {
      const url = new URL(path, base)
      const text = url.protocol === 'file:' ? readFile(url, 'utf8') : fetch(url).then((r) => (r.ok ? r.text() : null))
      files.set(path, text.catch(() => null))
    }
    return files.get(path)
  }
  let templates
  let renamed
  const svgs = new Map()
  const svgOf = (kind, name, follow = true) => {
    const key = `${kind}:${name}`
    if (!svgs.has(key)) svgs.set(key, find(kind, name, follow))
    return svgs.get(key)
  }
  async function find(kind, name, follow) {
    if (!ASSET_NAME.test(name)) return warn(`VDS: tên ${kind} không hợp lệ "${name}"`), null
    const file = await read(kind === 'icon' ? `icons/Icon__${name}.svg` : `logos/themeable/${name}.svg`)
    if (file) return file
    // Icon đã đổi tên: icons/renamed.json ghi tên cũ -> tên mới, giữ ít nhất một phiên bản sau khi đổi.
    if (kind === 'icon' && follow) {
      renamed ??= read('icons/renamed.json').then((text) => (text ? JSON.parse(text) : {}))
      const next = (await renamed)[name]
      if (next) {
        warn(`VDS: icon "${name}" đã đổi tên thành "${next}", sửa lại tên trong HTML`)
        return svgOf(kind, next, false)
      }
    }
    return warn(`VDS: không có ${kind} "${name}"`), null
  }

  return {
    /**
     * Đổi mọi thẻ VDS trong chuỗi HTML thành HTML đầy đủ. Thẻ, tên không có thì giữ nguyên và ghi cảnh báo.
     * @param {string} html
     * @returns {Promise<string>}
     */
    async expand(html) {
      templates ??= read('components/vds-templates.json').then((text) => (text ? JSON.parse(text).components : null))
      const components = await templates
      if (!components) warn('VDS: không đọc được components/vds-templates.json, chỉ dựng icon, logo')
      // id tự sinh (vd Input Text Field không có id) đếm lại từ đầu cho mỗi trang.
      let id = 0
      html = upgradeLegacy(html)
      if (components) html = expandComponents(html, components, { warn, nextId: () => `vds-${++id}` })
      // Icon, logo: đọc mọi file cần cùng lúc, rồi thay.
      const tags = [...html.matchAll(ASSET_TAG)].map((m) => {
        const attrs = parseAttrs(m[2])
        const get = (key) => attrs.find(([name]) => name.toLowerCase() === key)?.[1] ?? null
        const kind = m[1].toLowerCase().slice(4)
        const name = get('name')
        return { kind, name: name === null ? null : kind === 'icon' ? iconName(name, get('size')) : name, attrs: attrs.filter(([n]) => !/^(name|size)$/i.test(n)) }
      })
      for (const tag of tags) if (tag.name === null) warn(`VDS: <vds-${tag.kind}> thiếu thuộc tính name`)
      const loaded = await Promise.all(tags.map((tag) => (tag.name === null ? null : svgOf(tag.kind, tag.name))))
      let i = 0
      return html.replace(ASSET_TAG, (tag) => {
        const { kind, name, attrs } = tags[i]
        const file = loaded[i++]
        return (file && toSvg(file, attrs, [`data-vds-${kind}`, name])) || tag
      })
    },
  }
}

// Chạy thẳng: node vds-tags.mjs a.html b.html (trang tĩnh), nguồn là bộ phát hành chứa file này.
const isMain = () => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}
if (isMain()) {
  const vds = createVdsTags()
  for (const file of process.argv.slice(2)) await writeFile(file, await vds.expand(await readFile(file, 'utf8')))
}
