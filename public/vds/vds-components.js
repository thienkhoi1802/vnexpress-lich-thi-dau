/*
 * VnExpress Design System 0.2.0: hành vi của component (tab, ô nhập mã, chip, nút đóng thông báo).
 * Nạp sau vds-fonts.css và vds.css (token). Mẫu HTML từng component: https://vnexpress-design-system.vne-designops.workers.dev/components/overview/
 */
(() => {
  if (window.VDS) return
  try {
    const src = document.currentScript && document.currentScript.src
    const host = location.hostname
    if (src && src.startsWith('https://vnexpress-design-system.vne-designops.workers.dev/') && host && host !== 'vnexpress-design-system.vne-designops.workers.dev' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) && !/\.(localhost|test)$/.test(host)) {
      console.warn('VDS: trang này đang gọi vds-components.js từ link của trang tài liệu. Link này chỉ dành cho bản thử: trang tài liệu có thể đổi địa chỉ hoặc tạm ngừng, khi đó sản phẩm mất giao diện. Sản phẩm thật: tải bộ file theo phiên bản về máy chủ của sản phẩm. Hướng dẫn: https://vnexpress-design-system.vne-designops.workers.dev/introduction/getting-started/')
    }
  } catch {}
/**
 * Hành vi của component VDS khi dùng HTML thuần (không React).
 * Sản phẩm nạp bản đóng gói `vds-components.js`: tự gắn cho cả trang khi tải.
 * Sự kiện bắt ở gốc (document hoặc phần tử truyền vào), nên nội dung chèn thêm sau (Ajax) vẫn chạy.
 * Docs gọi `init(khung)` để gắn riêng cho từng khung ví dụ; `init` trả về hàm gỡ.
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

// ─── Gắn sự kiện ──────────────────────────────────────────────────────────────

/**
 * Gắn hành vi cho mọi component VDS bên trong `root`.
 * @param {Document | HTMLElement} [root]
 * @returns {() => void} hàm gỡ sự kiện
 */
function init(root = document) {
  const off = []
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

window.VDS = { init }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init())
else init()
})()
