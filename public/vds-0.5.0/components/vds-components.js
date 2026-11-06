/*
 * VnExpress Design System 0.5.0: dựng thẻ VDS (component, icon, logo gọi theo tên) và hành vi (behavior) của component: tab, Input Code Field, chip, button đóng của Alert Toast.
 * Nạp sau vds-fonts.css và vds.css (token). Mẫu HTML từng component: https://vnexpress-design-system.vne-designops.workers.dev/components/overview/
 */
(() => {
  if (window.VDS) return
  try {
    const src = document.currentScript && document.currentScript.src
    const host = location.hostname
    if (src && src.startsWith('https://vnexpress-design-system.vne-designops.workers.dev/') && host && host !== 'vnexpress-design-system.vne-designops.workers.dev' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) && !/\.(localhost|test)$/.test(host)) {
      console.warn('VDS: trang này đang gọi vds-components.js thẳng từ trang tài liệu (docs), tức hotlink. Cách này chỉ dành cho prototype (trang để xem, demo, review nội bộ): docs có thể đổi địa chỉ hoặc tạm ngừng, khi đó trang mất giao diện. Production: tải bản phát hành (release) về server của sản phẩm. Hướng dẫn: https://vnexpress-design-system.vne-designops.workers.dev/introduction/getting-started/#prototype-va-production')
    }
  } catch {}
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
const ATTRS = String.raw`(?:\s+[^\s"'=<>/]+(?:\s*=\s*${VALUE})?)*`
const ATTR = new RegExp(String.raw`([^\s"'=<>/]+)(?:\s*=\s*(${VALUE}))?`, 'g')
const START_TAG = new RegExp(String.raw`<([a-zA-Z][\w-]*)(${ATTRS})\s*(/?)>`, 'g')
// Khoảng trắng theo HTML (space, tab, xuống dòng, form feed, CR); bản PHP dùng đúng tập này.
const SPACE = /[ \t\n\r\f]+/g
const hasText = (s) => /[^ \t\n\r\f]/.test(s)

/** Thuộc tính của thẻ, theo thứ tự: [tên, giá trị như viết trong HTML (bỏ ngoặc) hoặc null nếu không có giá trị]. */
function parseAttrs(text) {
  return [...text.matchAll(ATTR)].map(([, name, value]) => [name, value === undefined ? null : value.replace(/^(["'])([\s\S]*)\1$/, '$2')])
}

const quote = (value) => (value.includes('"') ? `'${value}'` : `"${value}"`)
const serializeAttrs = (attrs) => attrs.map(([name, value]) => (value === null ? ` ${name}` : ` ${name}=${quote(value)}`)).join('')

/** Gộp thuộc tính vào danh sách sẵn có: trùng tên thì ghi đè (giữ vị trí), class nối thêm; tên so không phân biệt hoa thường. */
function mergeAttrs(own, given) {
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
const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

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
function renderComponent(def, tag, attrs, inner, options) {
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
function expandComponents(html, components, options) {
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

const ASSET_NAME = /^[A-Za-z0-9_-]+$/
// Thẻ icon, logo: rỗng, hoặc viết kiểu tự đóng. Cách viết của 0.3.0 (<i data-vds-icon="…"></i>) vẫn nhận, đổi sang thẻ mới.
const ASSET_TAG = new RegExp(String.raw`<(vds-icon|vds-logo)(${ATTRS})\s*(?:/>|>[ \t\n\r\f]*</\1\s*>)`, 'gi')
const LEGACY_TAG = new RegExp(String.raw`<i(${ATTRS})\s*(?:/>|>[ \t\n\r\f]*</i>)`, 'gi')

/** Đổi <i data-vds-icon="X" …></i> (0.3.0) thành <vds-icon name="X" …></vds-icon>; tương tự cho logo. */
function upgradeLegacy(html) {
  return html.replace(LEGACY_TAG, (tag, text) => {
    const attrs = parseAttrs(text)
    const ref = attrs.find(([name, value]) => /^data-vds-(icon|logo)$/i.test(name) && value !== null)
    if (!ref) return tag
    const kind = ref[0].toLowerCase().slice(9)
    return `<vds-${kind}${serializeAttrs([['name', ref[1]], ...attrs.filter((a) => a !== ref)])}></vds-${kind}>`
  })
}

/** Tên file icon theo cỡ: `size` thay cỡ ở cuối tên (nếu có) hoặc thêm vào, vd Share__Regular + 20 → Share__Regular__20. */
const iconName = (name, size) => (size ? `${name.replace(/__\d+$/, '')}__${size}` : name)

/**
 * SVG thay cho thẻ icon, logo. Thuộc tính của thẻ (trừ name, size) chuyển sang <svg>: class nối vào class sẵn có,
 * thuộc tính khác ghi đè. Thêm data-vds-icon (hoặc data-vds-logo) là tên đã dùng. Có aria-label, aria-labelledby hoặc
 * title: ảnh có nhãn, thêm role="img"; không có: thêm aria-hidden="true". Luôn thêm focusable="false".
 * @param {string} file nội dung file SVG
 * @param {[string, string | null][]} attrs thuộc tính của thẻ, đã bỏ name, size
 * @param {[string, string]} marker vd ['data-vds-icon', 'Share__Regular__20']
 */
function toSvg(file, attrs, marker) {
  const start = file.match(new RegExp(String.raw`<svg(${ATTRS})\s*>`, 'i'))
  if (!start) return null
  const merged = mergeAttrs(parseAttrs(start[1]), [...attrs, marker])
  const keys = new Set(merged.map(([name]) => name.toLowerCase()))
  const [key, value] = ['aria-label', 'aria-labelledby', 'title'].some((a) => keys.has(a)) ? ['role', 'img'] : ['aria-hidden', 'true']
  if (!keys.has(key)) merged.push([key, value])
  if (!keys.has('focusable')) merged.push(['focusable', 'false'])
  return `<svg${serializeAttrs(merged)}>${file.slice(start.index + start[0].length).replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, '').replace(/>[ \t\n\r\f]+</g, '><')}`
}

/**
 * Hành vi của component VDS khi dùng HTML thuần (không React).
 * Sản phẩm nạp bản đóng gói `vds-components.js`: tự gắn cho cả trang khi tải.
 * Sự kiện bắt ở gốc (document hoặc phần tử truyền vào), nên nội dung chèn thêm sau (Ajax) vẫn chạy.
 * Docs gọi `init(khung)` để gắn riêng cho từng khung ví dụ; `init` trả về hàm gỡ.
 * `init` cũng dựng thẻ VDS (component, icon, logo) thành HTML (xem renderTags).
 *
 * Sự kiện phát ra (bubbles):
 * - `vds:change` trên tablist, chip, radiogroup, ô nhập mã: detail theo từng component.
 * - `vds:complete` trên ô nhập mã khi nhập đủ ký tự: detail { value }.
 * - `vds:dismiss` trên Alert Toast trước khi ẩn; gọi preventDefault() để giữ lại.
 *
 * Cùng hành vi với component React trong `src/*` (Tabs, InputCodeField…). Sửa một bên thì sửa cả bên kia.
 */


const emit = (target, type, detail, cancelable = false) =>
  target.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable, detail }))

// ─── Tabs: bấm, mũi tên trái/phải, Home/End; ẩn hiện vùng nội dung theo aria-controls ───────────

const tabsOf = (tablist) => [...tablist.querySelectorAll('[role="tab"]')].filter((t) => t.closest('[role="tablist"]') === tablist)

function selectTab(tab, focus) {
  const tablist = tab.closest('[role="tablist"]')
  const tabs = tabsOf(tablist)
  for (const t of tabs) {
    const selected = t === tab
    t.setAttribute('aria-selected', String(selected))
    t.tabIndex = selected ? 0 : -1
    const panel = t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls'))
    if (panel) panel.hidden = !selected
  }
  if (focus) tab.focus()
  emit(tablist, 'vds:change', { index: tabs.indexOf(tab), value: tab.dataset.value ?? tab.textContent.trim(), tab })
}

function onTabKey(event, tab) {
  const steps = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' }
  const step = steps[event.key]
  if (step === undefined) return
  event.preventDefault()
  const enabled = tabsOf(tab.closest('[role="tablist"]')).filter((t) => !t.disabled)
  if (!enabled.length) return
  const pos = enabled.indexOf(tab)
  const next = step === 'first' ? 0 : step === 'last' ? enabled.length - 1 : (pos + step + enabled.length) % enabled.length
  selectTab(enabled[next], true)
}

/** Chỉ tab đang chọn nhận phím Tab (tabindex 0); vùng nội dung của tab khác bị ẩn. */
function normalizeTabs(root) {
  for (const tablist of root.querySelectorAll('.vds-tabs[role="tablist"]')) {
    const tabs = tabsOf(tablist)
    const current = tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs.find((t) => !t.disabled)
    for (const t of tabs) {
      t.tabIndex = t === current ? 0 : -1
      const panel = t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls'))
      if (panel) panel.hidden = t !== current
    }
  }
}

// ─── Selection Item Chip: bật/tắt (aria-pressed) hoặc chọn một trong nhóm (role="radio") ──────────

function chipRadios(group) {
  return [...group.querySelectorAll('.vds-selection-item-chip[role="radio"]')].filter((c) => !c.disabled)
}

function selectRadio(chip, focus) {
  const group = chip.closest('[role="radiogroup"]')
  if (!group) return
  for (const c of chipRadios(group)) {
    const on = c === chip
    c.setAttribute('aria-checked', String(on))
    c.classList.toggle('vds-selection-item-chip--selected', on)
    c.tabIndex = on ? 0 : -1
  }
  if (focus) chip.focus()
  emit(group, 'vds:change', { value: chip.dataset.value ?? chip.textContent.trim(), chip })
}

function toggleChip(chip) {
  const on = chip.getAttribute('aria-pressed') !== 'true'
  chip.setAttribute('aria-pressed', String(on))
  chip.classList.toggle('vds-selection-item-chip--selected', on)
  emit(chip, 'vds:change', { selected: on, value: chip.dataset.value ?? chip.textContent.trim() })
}

function onRadioKey(event, chip) {
  const steps = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  const step = steps[event.key]
  const group = chip.closest('[role="radiogroup"]')
  if (step === undefined || !group) return
  event.preventDefault()
  const radios = chipRadios(group)
  selectRadio(radios[(radios.indexOf(chip) + step + radios.length) % radios.length], true)
}

// ─── Input Code Field: mỗi ký tự một ô; tự nhảy ô, xoá lùi, dán cả mã ─────────────────────────────

const codeCells = (field) => [...field.querySelectorAll('.vds-input-code-field__cell')]
const codeValue = (field) => codeCells(field).map((c) => c.value).join('')
const codePattern = (field) => (field.dataset.allow === 'alphanumeric' ? /[^0-9a-zA-Z]/g : /[^0-9]/g)

function focusCell(field, index) {
  const cells = codeCells(field)
  const cell = cells[Math.max(0, Math.min(index, cells.length - 1))]
  cell?.focus()
  cell?.select()
}

function commitCode(field, next, before) {
  const cells = codeCells(field)
  const value = next.slice(0, cells.length)
  cells.forEach((c, i) => (c.value = value[i] ?? ''))
  const hidden = field.querySelector('input[type="hidden"]')
  if (hidden) hidden.value = value
  emit(field, 'vds:change', { value })
  if (value.length === cells.length && value !== before) emit(field, 'vds:complete', { value })
}

/** Ghi chuỗi bắt đầu từ ô `index` (ô trống đầu tiên nếu `index` vượt quá phần đã nhập). */
function writeCode(field, index, text, before) {
  const clean = text.replace(codePattern(field), '')
  if (!clean) return commitCode(field, before, before)
  const start = Math.min(index, before.length)
  commitCode(field, before.slice(0, start) + clean + before.slice(start + clean.length), before)
  focusCell(field, start + clean.length)
}

// Giá trị trước khi gõ: ô vừa gõ đã đổi nên lưu lại lúc focus và sau mỗi lần ghi.
const lastCode = new WeakMap()

function onCodeInput(cell) {
  const field = cell.closest('.vds-input-code-field')
  const cells = codeCells(field)
  const index = cells.indexOf(cell)
  const before = lastCode.get(field) ?? ''
  const raw = cell.value
  // Gõ đè lên ô đã có ký tự: lấy ký tự mới. Dán hoặc tự điền nhiều ký tự: rải ra các ô sau.
  writeCode(field, index, raw.length === 2 && before[index] ? raw.slice(-1) : raw, before)
  lastCode.set(field, codeValue(field))
}

function onCodeKey(event, cell) {
  const field = cell.closest('.vds-input-code-field')
  const index = codeCells(field).indexOf(cell)
  const value = codeValue(field)
  if (event.key === 'Backspace') {
    event.preventDefault()
    if (value[index]) commitCode(field, value.slice(0, index) + value.slice(index + 1), value)
    else if (index > 0) {
      commitCode(field, value.slice(0, index - 1) + value.slice(index), value)
      focusCell(field, index - 1)
    }
    lastCode.set(field, codeValue(field))
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    focusCell(field, index - 1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    focusCell(field, Math.min(index + 1, value.length))
  }
}

// ─── Thẻ VDS: component, icon, logo gọi theo tên ─────────────────────────────
// <vds-button variant="accent">Lưu</vds-button>, <vds-icon name="Bookmark__Regular__24"></vds-icon>,
// <vds-logo name="Logo__VnExpress__Standard"></vds-logo> đổi thành HTML đầy đủ. Production nên dựng trên server, trang
// không cần JS (server/vds-tags.mjs, vds-tags.php, cùng lõi vds-core.mjs); phần này cho prototype, trang HTML tĩnh và
// nội dung chèn thêm sau khi tải. User chốt 24-25/10/2026: dùng VDS theo tên từ nguồn chung, không chép bản sao.
// Mẫu component (vds-templates.json) nằm sẵn trong bản đóng gói vds-components.js. File icon, logo lấy ở thư mục chứa
// icons/, logos/ của cùng bộ file: bản đóng gói tự đặt theo vị trí của chính nó (thư mục cha của components/), hoặc
// theo thuộc tính data-vds-assets trên thẻ script.

const ASSET = 'vds-icon, vds-logo, i[data-vds-icon], i[data-vds-logo]'
let templates = null
let assetBase = null
const assetFiles = new Map()
const assetSvgs = new Map()
let renamedIcons = null
let ids = 0

/**
 * Đặt thư mục chứa icons/, logos/ (vd '/vds-<phiên bản>/') và mẫu component (nội dung vds-templates.json).
 * Bản đóng gói tự đặt cả hai, không cần gọi.
 * @param {{ assets?: string, templates?: { components: object } }} [options]
 */
function configure({ assets, templates: compiled } = {}) {
  if (assets) assetBase = new URL(assets, document.baseURI)
  if (compiled) templates = compiled.components
}

const warn = (message) => console.warn(message)
// id tự sinh không trùng id đã có trên trang (kể cả id server đã sinh).
const nextId = () => {
  let id
  do id = `vds-${++ids}`
  while (document.getElementById(id))
  return id
}

/** Dựng các thẻ component ngoài cùng trong root (kể cả chính root), lặp tới khi hết thẻ (mẫu có thể sinh thẻ con). */
function renderComponents(root) {
  if (!templates) return
  const selector = Object.keys(templates).join(',')
  for (let pass = 0; pass < 16; pass++) {
    const found = [...(root instanceof Element && root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)].filter(
      (el) => el.parentNode && !el.parentElement?.closest(selector),
    )
    if (!found.length) return
    for (const el of found) {
      const attrs = [...el.attributes].map((a) => [a.name, escapeHtml(a.value)])
      el.outerHTML = renderComponent(templates[el.localName], el.localName, attrs, el.innerHTML, { warn, nextId })
    }
    if (found.includes(root)) return
  }
}

function loadAsset(path) {
  const url = new URL(path, assetBase).href
  if (!assetFiles.has(url)) assetFiles.set(url, fetch(url).then((r) => (r.ok ? r.text() : null)).catch(() => null))
  return assetFiles.get(url)
}

/** SVG gốc của icon, logo theo tên (mỗi tên tìm một lần); tên cũ đã đổi thì lấy theo icons/renamed.json. */
function assetSvg(kind, name, follow = true) {
  const key = `${kind}:${name}`
  if (!assetSvgs.has(key)) assetSvgs.set(key, findAsset(kind, name, follow))
  return assetSvgs.get(key)
}

async function findAsset(kind, name, follow) {
  if (!ASSET_NAME.test(name)) return console.warn(`VDS: tên ${kind} không hợp lệ "${name}"`), null
  if (!assetBase) return console.warn('VDS: chưa biết thư mục icon, logo; gọi VDS.configure({ assets }) hoặc thêm data-vds-assets vào thẻ script'), null
  const text = await loadAsset(kind === 'icon' ? `icons/Icon__${name}.svg` : `logos/themeable/${name}.svg`)
  const svg = text && new DOMParser().parseFromString(text, 'image/svg+xml').documentElement
  if (svg?.nodeName === 'svg') {
    // Bỏ khoảng trắng giữa các thẻ, như hàm phía server: chữ của nút, tab chứa icon không lẫn dấu xuống dòng.
    for (const el of [svg, ...svg.querySelectorAll('*')]) for (const node of [...el.childNodes]) if (node.nodeType === 3 && !node.data.trim()) node.remove()
    return svg
  }
  if (kind === 'icon' && follow) {
    renamedIcons ??= loadAsset('icons/renamed.json').then((json) => (json ? JSON.parse(json) : {})).catch(() => ({}))
    const next = (await renamedIcons)[name]
    if (next) {
      console.warn(`VDS: icon "${name}" đã đổi tên thành "${next}", sửa lại tên trong HTML`)
      return assetSvg(kind, next, false)
    }
  }
  return console.warn(`VDS: không có ${kind} "${name}"`), null
}

/**
 * Thay thẻ icon, logo bằng SVG, cùng quy tắc với toSvg trong vds-core.mjs: thuộc tính của thẻ (trừ name, size) chuyển
 * sang <svg> (class nối thêm), thêm data-vds-icon hoặc data-vds-logo; có aria-label, aria-labelledby hoặc title thì
 * thêm role="img", không có thì aria-hidden="true".
 */
async function renderAsset(el) {
  const legacy = el.localName === 'i'
  const kind = (legacy ? el.hasAttribute('data-vds-icon') : el.localName === 'vds-icon') ? 'icon' : 'logo'
  const given = legacy ? el.getAttribute(`data-vds-${kind}`) : el.getAttribute('name')
  if (given === null) return console.warn(`VDS: <vds-${kind}> thiếu thuộc tính name`)
  const name = kind === 'icon' && !legacy ? iconName(given, el.getAttribute('size')) : given
  const source = await assetSvg(kind, name)
  if (!source || !el.isConnected) return
  const svg = document.importNode(source, true)
  for (const { name: attr, value } of el.attributes) {
    if (legacy ? /^data-vds-(icon|logo)$/.test(attr) : attr === 'name' || attr === 'size') continue
    if (attr === 'class') svg.classList.add(...el.classList)
    else svg.setAttribute(attr, value)
  }
  svg.setAttribute(`data-vds-${kind}`, name)
  const [key, value] = ['aria-label', 'aria-labelledby', 'title'].some((a) => svg.hasAttribute(a)) ? ['role', 'img'] : ['aria-hidden', 'true']
  if (!svg.hasAttribute(key)) svg.setAttribute(key, value)
  if (!svg.hasAttribute('focusable')) svg.setAttribute('focusable', 'false')
  // Viết nhầm kiểu tự đóng (<vds-icon … />) thì trình duyệt gói luôn phần sau vào thẻ: trả phần đó ra ngoài.
  if (el.children.length || el.textContent.trim()) el.after(...el.childNodes)
  el.replaceWith(svg)
}

/**
 * Đổi mọi thẻ VDS bên trong root (kể cả chính root) thành HTML: component ngay, icon và logo khi tải xong file.
 * @param {Document | Element} [root]
 */
function renderTags(root = document) {
  renderComponents(root)
  const found = [...root.querySelectorAll(ASSET)]
  if (root instanceof Element && root.matches(ASSET)) found.unshift(root)
  for (const el of found) renderAsset(el)
}

// ─── Gắn sự kiện ──────────────────────────────────────────────────────────────

/**
 * Gắn hành vi cho mọi component VDS bên trong `root`.
 * @param {Document | HTMLElement} [root]
 * @returns {() => void} hàm gỡ sự kiện
 */
function init(root = document) {
  const off = []
  // Thẻ VDS: dựng ngay những thẻ đang có, và cả thẻ chèn thêm sau (Ajax, JS dựng giao diện).
  renderTags(root)
  const observer = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) renderTags(node.parentElement ?? node)
  })
  observer.observe(root, { childList: true, subtree: true })
  off.push(() => observer.disconnect())
  const on = (type, handler) => {
    root.addEventListener(type, handler)
    off.push(() => root.removeEventListener(type, handler))
  }
  normalizeTabs(root)

  on('click', (event) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return
    const tab = target.closest('.vds-tabs [role="tab"]')
    if (tab && !tab.disabled) return selectTab(tab, false)
    const dismiss = target.closest('.vds-alert-toast__dismiss')
    if (dismiss) {
      const toast = dismiss.closest('.vds-alert-toast')
      if (toast && emit(toast, 'vds:dismiss', {}, true)) toast.hidden = true
      return
    }
    const chip = target.closest('.vds-selection-item-chip')
    if (chip && !chip.disabled) {
      if (chip.getAttribute('role') === 'radio') selectRadio(chip, false)
      else if (chip.hasAttribute('aria-pressed')) toggleChip(chip)
    }
  })

  on('keydown', (event) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return
    const tab = target.closest('.vds-tabs [role="tab"]')
    if (tab) return onTabKey(event, tab)
    const radio = target.closest('.vds-selection-item-chip[role="radio"]')
    if (radio) return onRadioKey(event, radio)
    if (target.matches('.vds-input-code-field__cell')) onCodeKey(event, target)
  })

  on('focusin', (event) => {
    const cell = event.target instanceof Element && event.target.closest('.vds-input-code-field__cell')
    if (!cell) return
    const field = cell.closest('.vds-input-code-field')
    const value = codeValue(field)
    lastCode.set(field, value)
    // Không để trống ô ở giữa: chuyển về ô trống đầu tiên.
    if (codeCells(field).indexOf(cell) > value.length) focusCell(field, value.length)
    else cell.select()
  })

  on('input', (event) => {
    const cell = event.target instanceof Element && event.target.closest('.vds-input-code-field__cell')
    if (cell) onCodeInput(cell)
  })

  on('paste', (event) => {
    const cell = event.target instanceof Element && event.target.closest('.vds-input-code-field__cell')
    if (!cell) return
    event.preventDefault()
    const field = cell.closest('.vds-input-code-field')
    writeCode(field, codeCells(field).indexOf(cell), event.clipboardData?.getData('text') ?? '', codeValue(field))
    lastCode.set(field, codeValue(field))
  })

  // Input Text Field: bấm vào vùng trống của ô (icon, lề) cũng đưa con trỏ vào ô nhập.
  on('mousedown', (event) => {
    const target = event.target instanceof Element ? event.target : null
    const field = target?.closest('.vds-input-text-field__field')
    if (!field || target.closest('input, button, a')) return
    event.preventDefault()
    field.querySelector('.vds-input-text-field__input')?.focus()
  })

  return () => off.forEach((fn) => fn())
}

  configure({ templates: {"version":"0.5.0","components":{"vds-alert-inline":{"props":{"context":{"figma":"Context","default":"info","values":{"info":"Info","info-alternative":"Info (alternative)","positive":"Positive","warning":"Warning","negative":"Negative"},"note":"Icon 16px theo Context"},"align":{"figma":"Alignment","default":"left","values":{"left":"Left","center":"Center","right":"Right"}}},"figma":"Alert__Inline","content":"Câu thông báo, một dòng","parts":{"main":["<div class=\"vds-alert-inline",{"if":"context","not":true,"in":["info"],"do":[" vds-alert-inline--",{"v":"context"}]},{"if":"align","not":true,"in":["left"],"do":[" vds-alert-inline--",{"v":"align"}]},"\"><span class=\"vds-alert-inline__icon\"><vds-icon name=\"",{"p":"icon"},"\" size=\"16\"></vds-icon></span><span class=\"vds-alert-inline__message\">",{"r":"content"},"</span></div>"],"icon":[{"if":"context","in":["info"],"do":["Info__Filled"]},{"if":"context","in":["info-alternative"],"do":["Info__Regular"]},{"if":"context","in":["positive"],"do":["CheckmarkCircle__Filled"]},{"if":"context","in":["warning"],"do":["Warning__Filled"]},{"if":"context","in":["negative"],"do":["DismissCircle__Filled"]}]}},"vds-alert-toast":{"props":{"context":{"figma":"Context","default":"info","values":{"info":"Info","positive":"Positive","warning":"Warning","negative":"Negative"},"note":"Icon 20px theo Context"},"title":{"figma":"Has title","note":"Tiêu đề, chữ thuần"},"dismissible":{"figma":"Right item = Dismiss","boolean":true,"note":"Button đóng: Button {Context} uncontained, chỉ icon"},"dismiss-label":{"default":"Đóng","note":"`aria-label` của button đóng"},"action":{"figma":"Right item = Button","note":"Nhãn button hành động: Button {Context} contained, cỡ Medium"},"action-below":{"figma":"Right item = Button Line Break","boolean":true,"note":"Button hành động xuống dòng"},"action-href":{"note":"Có đường dẫn thì button hành động thành link"}},"figma":"Alert__Toast","content":"Nội dung thông báo (Has message)","parts":{"main":["<div class=\"vds-alert-toast",{"if":"context","not":true,"in":["info"],"do":[" vds-alert-toast--",{"v":"context"}]},{"if":"dismissible","do":[" vds-alert-toast--dismissible"]},"\" role=\"status\"><span class=\"vds-alert-toast__icon\" aria-hidden=\"true\"><vds-icon name=\"",{"p":"icon"},"\" size=\"20\"></vds-icon></span><div class=\"vds-alert-toast__body\">",{"if":"title","do":["<p class=\"vds-alert-toast__title\">",{"v":"title"},"</p>"]},{"if":"content","do":["<div class=\"vds-alert-toast__message\">",{"r":"content"},"</div>"]},"</div>",{"if":"action","do":["<vds-button variant=\"",{"v":"context"},"-contained\"",{"if":"action-href","do":[" href=\"",{"v":"action-href"},"\""]}," class=\"vds-alert-toast__action",{"if":"action-below","do":[" vds-alert-toast__action--below"]},"\">",{"v":"action"},"</vds-button>"]},{"if":"dismissible","do":["<vds-button variant=\"",{"v":"context"},"-uncontained\" icon=\"Dismiss__Filled\" aria-label=\"",{"v":"dismiss-label"},"\" class=\"vds-alert-toast__dismiss\"></vds-button>"]},"</div>"],"icon":[{"if":"context","in":["info"],"do":["Info__Filled"]},{"if":"context","in":["positive"],"do":["CheckmarkCircle__Filled"]},{"if":"context","in":["warning"],"do":["Warning__Filled"]},{"if":"context","in":["negative"],"do":["DismissCircle__Filled"]}]}},"vds-button":{"props":{"variant":{"figma":"Type","default":"contained","values":{"uncontained":"Uncontained","contained":"Contained","contained-bordered":"Contained (bordered)","ghost":"Ghost","ghost-subdued":"Ghost subdued","ghost-on-color":"Ghost on color","accent":"Accent","accent-subdued":"Accent subdued","support":"Support","link-subtle":"Link subtle","link":"Link","info-uncontained":"Info uncontained","info-contained":"Info contained","positive-uncontained":"Positive uncontained","positive-contained":"Positive contained","warning-uncontained":"Warning uncontained","warning-contained":"Warning contained","negative-uncontained":"Negative uncontained","negative-contained":"Negative contained"}},"size":{"figma":"Size","default":"md","values":{"sm":"Small (32px)","md":"Medium (40px)","lg":"Large (48px)"}},"icon-left":{"figma":"Icon position = Left","icon":true,"note":"Icon trước nhãn; có cả `icon-right` là Left & Right"},"icon-right":{"figma":"Icon position = Right","icon":true,"note":"Icon sau nhãn"},"icon":{"figma":"Icon position = Only (rounded)","icon":true,"note":"Chỉ có icon, không nhãn; bắt buộc `aria-label`"},"circle":{"figma":"Icon position = Only (circle)","boolean":true,"note":"Dùng cùng `icon`"},"far":{"figma":"Icon position = Far left, Far right","boolean":true,"note":"Icon sát mép, nhãn ở giữa; dùng cùng `icon-left`, `icon-right` và `full-width`"},"selected":{"figma":"State = Selected A, Selected B","default":false,"flag":"a","values":{"a":"Selected A","b":"Selected B"},"note":"Viết `selected` không giá trị là Selected A; dùng với Type Contained"},"disabled":{"figma":"State = Disabled","boolean":true},"full-width":{"boolean":true,"note":"Rộng hết khung chứa"},"href":{"note":"Có `href` thì dựng thẻ `a`: link dạng button"},"type":{"default":"button","note":"`type` của thẻ `button`, vd `submit`"}},"figma":"Button","content":"Nhãn (bỏ trống khi dùng icon)","parts":{"main":[{"if":"href","do":["<a href=\"",{"v":"href"},"\" class=\"",{"p":"class"},"\"",{"if":"selected","do":[" aria-current=\"page\""]},{"if":"disabled","do":[" aria-disabled=\"true\""]},">",{"p":"inner"},"</a>"]},{"if":"href","not":true,"do":["<button type=\"",{"v":"type"},"\" class=\"",{"p":"class"},"\"",{"if":"selected","do":[" aria-pressed=\"true\""]},{"if":"disabled","do":[" disabled"]},">",{"p":"inner"},"</button>"]}],"class":["vds-button vds-state-layer",{"if":"variant","in":["accent","support","ghost-on-color"],"do":[" vds-state-layer--on-color"]}," vds-focus-ring vds-button--",{"v":"variant"},{"if":"size","not":true,"in":["md"],"do":[" vds-button--",{"v":"size"}]},{"if":"selected","do":[" vds-button--selected-",{"v":"selected"}]},{"if":"icon","do":[" vds-button--icon-only",{"if":"circle","do":[" vds-button--circle"]}]},{"if":"icon","not":true,"do":[{"if":"far","do":[" vds-button--far"]}]},{"if":"full-width","do":[" vds-button--full-width"]}],"inner":[{"if":"icon","do":["<span class=\"vds-button__icon\" aria-hidden=\"true\"><vds-icon name=\"",{"v":"icon"},"\" size=\"",{"p":"icon-size"},"\"></vds-icon></span>"]},{"if":"icon","not":true,"do":[{"if":"icon-left","do":["<span class=\"vds-button__icon",{"if":"far","do":[" vds-button__icon--far-left"]},"\" aria-hidden=\"true\"><vds-icon name=\"",{"v":"icon-left"},"\" size=\"",{"p":"icon-size"},"\"></vds-icon></span>"]},"<span class=\"vds-button__label\">",{"r":"content"},"</span>",{"if":"icon-right","do":["<span class=\"vds-button__icon",{"if":"far","do":[" vds-button__icon--far-right"]},"\" aria-hidden=\"true\"><vds-icon name=\"",{"v":"icon-right"},"\" size=\"",{"p":"icon-size"},"\"></vds-icon></span>"]}]}],"icon-size":[{"if":"size","in":["sm"],"do":["16"]},{"if":"size","not":true,"in":["sm"],"do":["20"]}]}},"vds-button-inline":{"props":{"strong":{"figma":"Type = Strong label","boolean":true,"note":"Nhãn đậm, cho hành động chính của ô. Không có: Regular label"},"icon-left":{"figma":"Icon position = Left","icon":true,"note":"Icon 20px trước nhãn"},"icon-right":{"figma":"Icon position = Right","icon":true,"note":"Icon 20px sau nhãn"},"disabled":{"figma":"State = Disabled","boolean":true},"type":{"default":"button","note":"`type` của thẻ `button`, vd `submit`"}},"figma":"Button__Inline","content":"Nhãn","parts":{"main":["<button type=\"",{"v":"type"},"\" class=\"vds-button-inline vds-state-layer vds-focus-ring",{"if":"strong","do":[" vds-button-inline--strong"]},"\"",{"if":"disabled","do":[" disabled"]},">",{"if":"icon-left","do":["<span class=\"vds-button-inline__icon\" aria-hidden=\"true\"><vds-icon name=\"",{"v":"icon-left"},"\" size=\"20\"></vds-icon></span>"]},{"r":"content"},{"if":"icon-right","do":["<span class=\"vds-button-inline__icon\" aria-hidden=\"true\"><vds-icon name=\"",{"v":"icon-right"},"\" size=\"20\"></vds-icon></span>"]},"</button>"]}},"vds-button-touch":{"props":{"variant":{"figma":"Type","default":"touch","values":{"touch":"Touch","contained":"Touch contained","on-color":"Touch on-color","on-image":"Touch on image"}},"size":{"figma":"Size","default":"md","values":{"sm":"Small (32px, icon 20px)","md":"Medium (40px, icon 24px)"}},"icon":{"icon":true,"note":"Bắt buộc; cỡ theo Size. Kèm `aria-label` vì button không có chữ"},"selected":{"figma":"State = Selected A","boolean":true},"disabled":{"figma":"State = Disabled","boolean":true},"href":{"note":"Có `href` thì dựng thẻ `a`, vd về trang chủ"},"type":{"default":"button","note":"`type` của thẻ `button`"}},"figma":"Button__Touch","content":"Để trống (chỉ có icon)","parts":{"main":[{"if":"href","do":["<a href=\"",{"v":"href"},"\" class=\"",{"p":"class"},"\"",{"if":"selected","do":[" aria-current=\"page\""]},{"if":"disabled","do":[" aria-disabled=\"true\""]},">",{"p":"icon"},"</a>"]},{"if":"href","not":true,"do":["<button type=\"",{"v":"type"},"\" class=\"",{"p":"class"},"\"",{"if":"selected","do":[" aria-pressed=\"true\""]},{"if":"disabled","do":[" disabled"]},">",{"p":"icon"},"</button>"]}],"class":["vds-button-touch vds-state-layer",{"if":"variant","in":["on-color","on-image"],"do":[" vds-state-layer--on-color"]}," vds-focus-ring",{"if":"variant","not":true,"in":["touch"],"do":[" vds-button-touch--",{"v":"variant"}]},{"if":"size","in":["sm"],"do":[" vds-button-touch--sm"]},{"if":"selected","do":[" vds-button-touch--selected"]}],"icon":["<vds-icon name=\"",{"v":"icon"},"\" size=\"",{"if":"size","in":["sm"],"do":["20"]},{"if":"size","not":true,"in":["sm"],"do":["24"]},"\"></vds-icon>"]}},"vds-input-code-field":{"props":{"length":{"default":"5","number":[1,12],"note":"Số ô, bằng độ dài mã"},"allow":{"default":"numeric","values":{"numeric":"Chỉ số","alphanumeric":"Chữ và số"}},"label":{"default":"Mã xác thực","note":"Tên của nhóm ô cho trình đọc màn hình"},"name":{"note":"Tên trường khi gửi form: thêm ô ẩn chứa cả mã"},"value":{"note":"Mã đã nhập (vd hiện lại khi báo lỗi)"},"helper":{"figma":"Has helper","note":"Dòng phụ, chữ thuần"},"error":{"figma":"State = Rest error","note":"Thông báo lỗi, thay dòng phụ bằng Alert Inline Negative căn giữa"},"disabled":{"figma":"State = Disabled, Disabled entry","boolean":true}},"figma":"Input__CodeField","content":"Để trống","lists":{"cells":{"repeat":"length","chars":"value"}},"parts":{"main":["<div class=\"vds-input-code-field",{"if":"error","do":[" vds-input-code-field--error"]},{"if":"disabled","do":[" vds-input-code-field--disabled"]},"\"",{"if":"allow","in":["alphanumeric"],"do":[" data-allow=\"alphanumeric\""]},"><div class=\"vds-input-code-field__cells\" role=\"group\" aria-label=\"",{"v":"label"},"\">",{"if":"cells","do":["<input class=\"vds-input-code-field__cell\" type=\"text\" inputmode=\"",{"if":"allow","in":["alphanumeric"],"do":["text"]},{"if":"allow","not":true,"in":["alphanumeric"],"do":["numeric"]},"\" autocomplete=\"",{"if":"first","do":["one-time-code"]},{"if":"first","not":true,"do":["off"]},"\" aria-label=\"Ký tự ",{"v":"index"}," trên ",{"v":"length"},"\"",{"if":"error","do":[" aria-invalid=\"true\""]},{"if":"disabled","do":[" disabled"]},{"if":"char","do":[" value=\"",{"v":"char"},"\""]},">"]},"</div>",{"if":"name","do":["<input type=\"hidden\" name=\"",{"v":"name"},"\"",{"if":"value","do":[" value=\"",{"v":"value"},"\""]},">"]},{"if":"error","do":["<vds-alert-inline context=\"negative\" align=\"center\" role=\"alert\">",{"v":"error"},"</vds-alert-inline>"]},{"if":"error","not":true,"do":[{"if":"helper","do":["<p class=\"vds-input-code-field__helper\">",{"v":"helper"},"</p>"]}]},"</div>"]}},"vds-input-text-field":{"props":{"size":{"figma":"Size","default":"md","values":{"sm":"Small (32px)","md":"Medium (40px)","lg":"Large (48px)"}},"label":{"figma":"Has label","note":"Nhãn, chữ thuần. Luôn có"},"label-hidden":{"boolean":true,"note":"Ẩn nhãn khỏi giao diện, trình đọc màn hình vẫn đọc"},"icon":{"figma":"Has icon","icon":true,"note":"Icon 20px đầu ô"},"helper":{"figma":"Has helper","note":"Dòng phụ, chữ thuần"},"error":{"figma":"State = Rest error, Typing error","note":"Thông báo lỗi, thay dòng phụ bằng Alert Inline Negative"},"disabled":{"figma":"State = Disabled, Disabled entry","boolean":true},"id":{"auto":true,"note":"`id` của ô nhập; không có thì tự sinh"}},"figma":"Input__TextField","content":"Phần cuối ô (Has button), thường là vds-button-inline; để trống nếu không có","parts":{"main":["<div class=\"vds-input-text-field",{"if":"size","not":true,"in":["md"],"do":[" vds-input-text-field--",{"v":"size"}]},{"if":"error","do":[" vds-input-text-field--error"]},{"if":"disabled","do":[" vds-input-text-field--disabled"]},"\">",{"if":"label","do":["<label for=\"",{"v":"id"},"\" class=\"vds-input-text-field__label",{"if":"label-hidden","do":[" vds-visually-hidden"]},"\">",{"v":"label"},"</label>"]},"<div class=\"vds-input-text-field__field\">",{"if":"icon","do":["<span class=\"vds-input-text-field__icon\" aria-hidden=\"true\"><vds-icon name=\"",{"v":"icon"},"\" size=\"20\"></vds-icon></span>"]},"<input id=\"",{"v":"id"},"\" class=\"vds-input-text-field__input\"",{"if":"error","do":[" aria-invalid=\"true\""]},{"p":"described"},{"if":"disabled","do":[" disabled"]}," data-vds-rest>",{"if":"content","do":["<span class=\"vds-input-text-field__trailing\">",{"r":"content"},"</span>"]},"</div>",{"if":"error","do":["<vds-alert-inline id=\"",{"v":"id"},"-note\" context=\"negative\">",{"v":"error"},"</vds-alert-inline>"]},{"if":"error","not":true,"do":[{"if":"helper","do":["<p id=\"",{"v":"id"},"-note\" class=\"vds-input-text-field__helper\">",{"v":"helper"},"</p>"]}]},"</div>"],"described":[{"if":"error","do":[" aria-describedby=\"",{"v":"id"},"-note\""]},{"if":"error","not":true,"do":[{"if":"helper","do":[" aria-describedby=\"",{"v":"id"},"-note\""]}]}]}},"vds-selection-item-chip":{"props":{"size":{"figma":"Size","default":"md","values":{"sm":"Small (32px)","md":"Medium (40px)","lg":"Large (48px)"}},"selected":{"figma":"State = Selected","boolean":true},"icon":{"figma":"Icon = True","icon":true,"note":"Icon 24px trước nhãn"},"role":{"values":{"radio":"Chip trong nhóm chọn một (`role=\"radiogroup\"`)"},"note":"Không có: chip bật tắt"},"disabled":{"boolean":true},"type":{"default":"button","note":"`type` của thẻ `button`"}},"figma":"Selection__Item__Chip","content":"Nhãn","parts":{"main":["<button type=\"",{"v":"type"},"\"",{"if":"role","do":[" role=\"",{"v":"role"},"\""]}," class=\"vds-selection-item-chip vds-state-layer vds-focus-ring",{"if":"size","not":true,"in":["md"],"do":[" vds-selection-item-chip--",{"v":"size"}]},{"if":"selected","do":[" vds-selection-item-chip--selected"]},"\"",{"p":"state"},{"if":"disabled","do":[" disabled"]},">",{"if":"icon","do":["<span class=\"vds-selection-item-chip__icon\" aria-hidden=\"true\"><vds-icon name=\"",{"v":"icon"},"\" size=\"24\"></vds-icon></span>"]},{"r":"content"},"</button>"],"state":[{"if":"role","in":["radio"],"do":[" aria-checked=\"",{"if":"selected","do":["true"]},{"if":"selected","not":true,"do":["false"]},"\" tabindex=\"",{"if":"selected","do":["0"]},{"if":"selected","not":true,"do":["-1"]},"\""]},{"if":"role","not":true,"in":["radio"],"do":[" aria-pressed=\"",{"if":"selected","do":["true"]},{"if":"selected","not":true,"do":["false"]},"\""]}]}},"vds-tab":{"props":{"selected":{"figma":"State = Selected","boolean":true,"note":"Đúng một tab"},"disabled":{"figma":"State = Disabled","boolean":true},"panel":{"note":"`id` của vùng nội dung tab điều khiển (`aria-controls`)"}},"figma":"_Tabs__Item","content":"Nhãn tab","parts":{"main":["<button type=\"button\" role=\"tab\" class=\"vds-tabs__item\" aria-selected=\"",{"if":"selected","do":["true"]},{"if":"selected","not":true,"do":["false"]},"\"",{"if":"panel","do":[" aria-controls=\"",{"v":"panel"},"\""]}," tabindex=\"",{"if":"selected","do":["0"]},{"if":"selected","not":true,"do":["-1"]},"\"",{"if":"disabled","do":[" disabled"]},"><span class=\"vds-tabs__label\" data-text=\"",{"v":"text"},"\"><span>",{"r":"content"},"</span></span></button>"]}},"vds-tabs":{"props":{"width":{"figma":"Width","default":"hug","values":{"hug":"Hug (mỗi tab vừa nhãn)","fixed":"Fixed (chia đều bề ngang)"}}},"figma":"Tabs","content":"Các thẻ vds-tab","parts":{"main":["<div class=\"vds-tabs",{"if":"width","in":["fixed"],"do":[" vds-tabs--fixed"]},"\" role=\"tablist\">",{"r":"content"},"</div>"]}}}} })
  const script = document.currentScript
  if (script) configure({ assets: script.dataset.vdsAssets || (script.src && new URL('../', script.src).href) })
window.VDS = { init, configure, renderTags }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init())
else init()
})()
