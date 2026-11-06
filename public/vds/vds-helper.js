/**
 * VnExpress Design System (VDS) Helper Utilities
 * Implements content formatting rules according to VDS:
 * - Time: https://vnexpress-design-system.vne-designops.workers.dev/content/time/
 * - Numbers: https://vnexpress-design-system.vne-designops.workers.dev/content/numbers/
 * - Theme: https://vnexpress-design-system.vne-designops.workers.dev/tokens/usage/
 */

(function() {
  const WEEKDAYS = ['chủ nhật', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy'];
  const pad = (n) => String(n).padStart(2, '0');
  const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Timezone adjustment (default GMT+7)
  const zoned = (date, offset = 7) => new Date(date.getTime() + offset * 3600000);
  const dayNumber = (d) => Math.floor(d.getTime() / 86400000);
  const weekday = (d) => upperFirst(WEEKDAYS[d.getUTCDay()]);

  /**
   * Định dạng đầy đủ VDS: "Thứ hai, 1/1/2023, 09:00 (GMT+7)"
   */
  window.vdsFormatDateTime = function(dateInput, offset = 7) {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    const d = zoned(date, offset);
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1;
    const year = d.getUTCFullYear();
    const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    const zone = `GMT${offset >= 0 ? '+' : ''}${offset}`;

    return `${weekday(d)}, ${day}/${month}/${year}, ${time} (${zone})`;
  };

  /**
   * Rút gọn ngày trong năm: "16/10" hoặc "5/1/2022" nếu khác năm
   */
  window.vdsFormatShortDate = function(dateInput, now = new Date(), offset = 7) {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    const d = zoned(date, offset);
    const year = d.getUTCFullYear();
    const sameYear = year === zoned(now, offset).getUTCFullYear();
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}${sameYear ? '' : `/${year}`}`;
  };

  /**
   * Thời gian trên item trận đấu: "16/10, 02:00"
   */
  window.vdsFormatMatchItemTime = function(dateInput, offset = 7) {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    const d = zoned(date, offset);
    const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}, ${time}`;
  };

  /**
   * Quy ước số VDS: Dấu "." ngăn cách hàng nghìn, "," trước phần thập phân
   */
  window.vdsFormatNumber = function(value, maximumFractionDigits = 2) {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(value);
  };

  /**
   * Rút gọn số lớn: K, M, B
   */
  window.vdsFormatCompact = function(value) {
    if (typeof value !== 'number' || isNaN(value)) return value;
    if (Math.abs(value) < 1000) return window.vdsFormatNumber(value);
    const UNITS = [
      [1e9, 'B'],
      [1e6, 'M'],
      [1e3, 'K']
    ];
    for (let i = 0; i < UNITS.length; i++) {
      const [size, suffix] = UNITS[i];
      if (Math.abs(value) < size) continue;
      const num = value / size;
      const rounded = Math.round(num * 10) / 10;
      return `${String(rounded).replace('.', ',')}${suffix}`;
    }
    return String(value);
  };

  // Chỉ dùng giao diện Sáng (Light): bỏ chế độ Tối
  document.documentElement.setAttribute('data-theme', 'light');
  try { localStorage.removeItem('vds-theme'); } catch (e) {}
})();
