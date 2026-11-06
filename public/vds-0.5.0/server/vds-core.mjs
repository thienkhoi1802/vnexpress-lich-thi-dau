/**
 * VnExpress Design System: lõi dựng thẻ VDS, dùng chung cho hàm server Node (vds-tags.mjs) và vds-components.js.
 * Không phụ thuộc DOM hay hệ thống file. Bản PHP (vds-tags.php) làm đúng các bước này; quy tắc đầy đủ ở README.md.
 *
 * Thẻ VDS: component gọi theo tên như instance trong Figma, vd <vds-button variant="accent">Lưu</vds-button>.
 * Mẫu của từng component (components/vds-templates.json, biên dịch từ packages/react/src/<Component>/<tên>.html)
 * cho biết thuộc tính nhận vào và HTML dựng ra.
 */

// Giá trị thuộc tính trong ngoặc kép, ngoặc đơn hoặc không ngoặc; trong ngoặc được có ">".
const VALUE = String.raw`(?:"[^"]*"|'[^']*'|[^\s"'=<>\x60]+)`
export const ATTRS = String.raw`(?:\s+[^\s"'=<>/]+(?:\s*=\s*${VALUE})?)*`
const ATTR = new RegExp(String.raw`([^\s"'=<>/]+)(?:\s*=\s*(${VALUE}))?`, 'g')
const START_TAG = new RegExp(String.raw`<([a-zA-Z][\w-]*)(${ATTRS})\s*(/?)>`, 'g')
// Khoảng trắng theo HTML (space, tab, xuống dòng, form feed, CR); bản PHP dùng đúng tập này.
const SPACE = /[ \t\n\r\f]+/g
const hasText = (s) => /[^ \t\n\r\f]/.test(s)

/** Thuộc tính của thẻ, theo thứ tự: [tên, giá trị như viết trong HTML (bỏ ngoặc) hoặc null nếu không có giá trị]. */
export function parseAttrs(text) {
  return [...text.matchAll(ATTR)].map(([, name, value]) => [name, value === undefined ? null : value.replace(/^(["'])([\s\S]*)\1$/, '$2')])
}

const quote = (value) => (value.includes('"') ? `'${value}'` : `"${value}"`)
export const serializeAttrs = (attrs) => attrs.map(([name, value]) => (value === null ? ` ${name}` : ` ${name}=${quote(value)}`)).join('')

/** Gộp thuộc tính vào danh sách sẵn có: trùng tên thì ghi đè (giữ vị trí), class nối thêm; tên so không phân biệt hoa thường. */
export function mergeAttrs(own, given) {
  const merged = new Map(own.map(([name, value]) => [name.toLowerCase(), [name, value]]))
  for (const [name, value] of given) {
    const key = name.toLowerCase()
    const prev = merged.get(key)
    merged.set(key, [prev?.[0] ?? name, key === 'class' && prev?.[1] && value ? `${prev[1]} ${value}` : value])
  }
  return [...merged.values()]
}

/** Chữ đưa vào HTML (chữ hoặc giá trị thuộc tính): thoát < > ", giữ & vì giá trị đã ở dạng HTML. */
const escape = (value) => (typeof value === 'string' ? value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '')
/** Giá trị đọc từ DOM (đã giải mã) về dạng HTML, để trình duyệt và server dùng chung một dạng. */
export const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ─── Mẫu ────────────────────────────────────────────────────────────────────
// Mẫu đã biên dịch (packages/react/scripts/templates.mjs) là cây: chuỗi là HTML; { v } chèn giá trị (thoát < > ");
// { r } chèn nguyên văn; { p } chèn phần mẫu khác; { if, not?, in?, do } là khối điều kiện hoặc lặp.

const truthy = (value) => value === true || (typeof value === 'string' && hasText(value)) || (Array.isArray(value) && value.length > 0)

function lookup(scopes, name) {
  for (let i = scopes.length - 1; i >= 0; i--) if (Object.hasOwn(scopes[i], name)) return scopes[i][name]
  return undefined
}

function renderNodes(nodes, scopes, parts) {
  let out = ''
  for (const node of nodes) {
    if (typeof node === 'string') out += node
    else if ('v' in node) out += escape(lookup(scopes, node.v))
    else if ('r' in node) {
      const value = lookup(scopes, node.r)
      out += typeof value === 'string' ? value : ''
    } else if ('p' in node) out += renderNodes(parts[node.p], scopes, parts)
    else {
      const value = lookup(scopes, node.if)
      if (node.in) {
        const hit = (typeof value === 'string' && node.in.includes(value)) || (value === true && node.in.includes('true'))
        if (hit !== Boolean(node.not)) out += renderNodes(node.do, scopes, parts)
      } else if (Array.isArray(value) && !node.not) {
        for (const item of value) out += renderNodes(node.do, [...scopes, item], parts)
      } else if (truthy(value) !== Boolean(node.not)) out += renderNodes(node.do, scopes, parts)
    }
  }
  return out
}

// ─── Thuộc tính của thẻ ──────────────────────────────────────────────────────

/**
 * Đọc thuộc tính theo spec của component: thuộc tính khai báo thành props (chuỗi, true, false), phần còn lại (rest)
 * và class của tác giả giữ riêng để gắn vào HTML dựng ra.
 */
function readProps(def, tag, attrs, { warn, nextId }) {
  const spec = def.props
  const given = {}
  const rest = []
  let cls = null
  for (const [name, value] of attrs) {
    const key = name.toLowerCase()
    if (key === 'class') cls = value
    else if (Object.hasOwn(spec, key)) given[key] = value
    else rest.push([name, value])
  }
  const props = {}
  for (const [key, prop] of Object.entries(spec)) {
    let value = given[key]
    if (prop.boolean) value = value !== undefined
    else {
      // Không có giá trị: thuộc tính bật/tắt kiểu `selected` lấy giá trị flag (vd "a"); chuỗi rỗng coi như không có.
      if (value === null || value === '') value = prop.flag ?? undefined
      if (value !== undefined && prop.values && !Object.hasOwn(prop.values, value)) {
        warn(`VDS: <${tag}> ${key}="${value}" không hợp lệ (${Object.keys(prop.values).join(', ')})`)
        value = undefined
      }
      if (value !== undefined && prop.number && !(/^\d+$/.test(value) && +value >= prop.number[0] && +value <= prop.number[1])) {
        warn(`VDS: <${tag}> ${key}="${value}" phải là số từ ${prop.number[0]} tới ${prop.number[1]}`)
        value = undefined
      }
      if (value === undefined) value = prop.auto ? nextId() : (prop.default ?? false)
    }
    props[key] = value
  }
  return { props, rest, cls }
}

/** Danh sách sinh từ thuộc tính (vd các ô của Input Code Field): mỗi mục có index (từ 1), first, last, char. */
function buildLists(def, props) {
  const lists = {}
  for (const [name, list] of Object.entries(def.lists ?? {})) {
    const count = Number(props[list.repeat]) || 0
    const chars = typeof props[list.chars] === 'string' ? [...props[list.chars]] : []
    lists[name] = Array.from({ length: count }, (_, i) => ({ index: String(i + 1), first: i === 0, last: i === count - 1, char: chars[i] ?? false }))
  }
  return lists
}

/**
 * Gắn class của tác giả vào phần tử gốc (thẻ mở đầu tiên) và thuộc tính còn lại vào phần tử có `data-vds-rest`
 * (không có thì phần tử gốc). Thuộc tính của tác giả ghi đè thuộc tính của mẫu; class nối thêm.
 */
function applyAttrs(html, rest, cls) {
  const tags = [...html.matchAll(START_TAG)]
  if (!tags.length) return html
  const target = tags.find((m) => parseAttrs(m[2]).some(([name]) => name === 'data-vds-rest')) ?? tags[0]
  const edits = new Map()
  const edit = (m, given) => {
    const own = edits.get(m) ?? parseAttrs(m[2]).filter(([name]) => name !== 'data-vds-rest')
    edits.set(m, mergeAttrs(own, given))
  }
  edit(target, rest)
  if (cls) edit(tags[0], [['class', cls]])
  let out = ''
  let last = 0
  for (const m of tags) {
    if (!edits.has(m)) continue
    out += html.slice(last, m.index) + `<${m[1]}${serializeAttrs(edits.get(m))}${m[3] ? ' /' : ''}>`
    last = m.index + m[0].length
  }
  return out + html.slice(last)
}

/**
 * Dựng một thẻ component thành HTML.
 * @param {object} def mẫu của component (components[tag] trong vds-templates.json)
 * @param {string} tag tên thẻ, vd "vds-button"
 * @param {[string, string | null][]} attrs thuộc tính của thẻ (giá trị ở dạng HTML)
 * @param {string} inner HTML bên trong thẻ
 * @param {{ warn: (message: string) => void, nextId: () => string }} options
 */
export function renderComponent(def, tag, attrs, inner, options) {
  const { props, rest, cls } = readProps(def, tag, attrs, options)
  const content = inner.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, '')
  const text = content.replace(/<[^>]*>/g, '').replace(SPACE, ' ').replace(/^ | $/g, '')
  const scope = { ...props, ...buildLists(def, props), content, text }
  return applyAttrs(renderNodes(def.parts.main, [scope], def.parts), rest, cls)
}

// ─── Tìm thẻ trong HTML (server) ─────────────────────────────────────────────

// Bỏ qua chú thích, script, style, textarea; thẻ VDS mở, đóng, hoặc viết kiểu tự đóng.
const SCAN = new RegExp(String.raw`<!--[\s\S]*?-->|<(script|style|textarea)\b[^>]*>[\s\S]*?</\1\s*>|<(/?)(vds-[a-zA-Z][\w-]*)(${ATTRS})\s*(/?)>`, 'gi')

/**
 * Dựng các thẻ VDS ngoài cùng; thẻ lồng bên trong (và thẻ do mẫu sinh ra) dựng ở lượt sau.
 * render(tên, chuỗi thuộc tính, HTML bên trong) trả HTML, hoặc null để giữ thẻ và chỉ dựng phần bên trong.
 */
function expandOnce(html, render) {
  let out = ''
  let last = 0
  const stack = []
  for (const m of html.matchAll(SCAN)) {
    if (!m[3]) continue
    const name = m[3].toLowerCase()
    if (m[2]) {
      const at = stack.findLastIndex((open) => open.name === name)
      if (at < 0) continue
      const open = stack[at]
      stack.length = at
      if (at === 0) {
        const result = render(name, open.attrs, html.slice(open.end, m.index))
        if (result !== null) {
          out += html.slice(last, open.start) + result
          last = m.index + m[0].length
        } else {
          out += html.slice(last, open.end) + expandOnce(html.slice(open.end, m.index), render)
          last = m.index
        }
      }
    } else if (m[5]) {
      if (!stack.length) {
        const result = render(name, m[4], '')
        if (result !== null) {
          out += html.slice(last, m.index) + result
          last = m.index + m[0].length
        }
      }
    } else stack.push({ name, attrs: m[4], start: m.index, end: m.index + m[0].length })
  }
  return out + html.slice(last)
}

/**
 * Dựng mọi thẻ component trong HTML (chưa gồm icon, logo: phần đó đọc file, xem vds-tags.mjs).
 * @param {string} html
 * @param {Record<string, object>} components components trong vds-templates.json
 * @param {{ warn: (message: string) => void, nextId: () => string }} options
 */
export function expandComponents(html, components, options) {
  const unknown = new Set()
  const render = (name, attrs, inner) => {
    if (name === 'vds-icon' || name === 'vds-logo') return null
    const def = components[name]
    if (!def) {
      if (!unknown.has(name)) options.warn(`VDS: không có thẻ <${name}>`)
      unknown.add(name)
      return null
    }
    return renderComponent(def, name, parseAttrs(attrs), inner, options)
  }
  for (let pass = 0; pass < 16; pass++) {
    const next = expandOnce(html, render)
    if (next === html) break
    html = next
  }
  return html
}

// ─── Icon, logo ──────────────────────────────────────────────────────────────

export const ASSET_NAME = /^[A-Za-z0-9_-]+$/
// Thẻ icon, logo: rỗng, hoặc viết kiểu tự đóng. Cách viết của 0.3.0 (<i data-vds-icon="…"></i>) vẫn nhận, đổi sang thẻ mới.
export const ASSET_TAG = new RegExp(String.raw`<(vds-icon|vds-logo)(${ATTRS})\s*(?:/>|>[ \t\n\r\f]*</\1\s*>)`, 'gi')
const LEGACY_TAG = new RegExp(String.raw`<i(${ATTRS})\s*(?:/>|>[ \t\n\r\f]*</i>)`, 'gi')

/** Đổi <i data-vds-icon="X" …></i> (0.3.0) thành <vds-icon name="X" …></vds-icon>; tương tự cho logo. */
export function upgradeLegacy(html) {
  return html.replace(LEGACY_TAG, (tag, text) => {
    const attrs = parseAttrs(text)
    const ref = attrs.find(([name, value]) => /^data-vds-(icon|logo)$/i.test(name) && value !== null)
    if (!ref) return tag
    const kind = ref[0].toLowerCase().slice(9)
    return `<vds-${kind}${serializeAttrs([['name', ref[1]], ...attrs.filter((a) => a !== ref)])}></vds-${kind}>`
  })
}

/** Tên file icon theo cỡ: `size` thay cỡ ở cuối tên (nếu có) hoặc thêm vào, vd Share__Regular + 20 → Share__Regular__20. */
export const iconName = (name, size) => (size ? `${name.replace(/__\d+$/, '')}__${size}` : name)

/**
 * SVG thay cho thẻ icon, logo. Thuộc tính của thẻ (trừ name, size) chuyển sang <svg>: class nối vào class sẵn có,
 * thuộc tính khác ghi đè. Thêm data-vds-icon (hoặc data-vds-logo) là tên đã dùng. Có aria-label, aria-labelledby hoặc
 * title: ảnh có nhãn, thêm role="img"; không có: thêm aria-hidden="true". Luôn thêm focusable="false".
 * @param {string} file nội dung file SVG
 * @param {[string, string | null][]} attrs thuộc tính của thẻ, đã bỏ name, size
 * @param {[string, string]} marker vd ['data-vds-icon', 'Share__Regular__20']
 */
export function toSvg(file, attrs, marker) {
  const start = file.match(new RegExp(String.raw`<svg(${ATTRS})\s*>`, 'i'))
  if (!start) return null
  const merged = mergeAttrs(parseAttrs(start[1]), [...attrs, marker])
  const keys = new Set(merged.map(([name]) => name.toLowerCase()))
  const [key, value] = ['aria-label', 'aria-labelledby', 'title'].some((a) => keys.has(a)) ? ['role', 'img'] : ['aria-hidden', 'true']
  if (!keys.has(key)) merged.push([key, value])
  if (!keys.has('focusable')) merged.push(['focusable', 'false'])
  return `<svg${serializeAttrs(merged)}>${file.slice(start.index + start[0].length).replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, '').replace(/>[ \t\n\r\f]+</g, '><')}`
}
