# VnExpress Design System 0.5.0

Bộ file cho production, phát hành ngày 27/10/2026; không bao giờ đổi sau khi phát hành.

| Thư mục | Nội dung |
| --- | --- |
| `fonts/` | `vds-fonts.css` và file font `.woff2` |
| `tokens/` | `vds.css`: biến CSS `--vds-*`, class chữ `.vds-text-*`, dark mode |
| `components/` | `vds-components.css`, `vds-components.js`: component, dựng thẻ VDS trên trình duyệt, hành vi; `vds-templates.json`: mẫu thẻ; `vds-fixtures.json`: ví dụ kèm HTML chuẩn |
| `icons/` | Icon SVG, gọi theo tên: `<vds-icon name="Bookmark__Regular__24"></vds-icon>`; `renamed.json`: icon đã đổi tên |
| `logos/` | Logo bản light, dark, themeable; web gọi theo tên: `<vds-logo name="Logo__VnExpress__Standard"></vds-logo>` |
| `agents/` | `vds-agents.md`: khối hướng dẫn VDS cho `AGENTS.md` của dự án; `install.mjs`: lệnh chèn hoặc thay khối |
| `server/` | Hàm mẫu Node, PHP dựng thẻ VDS thành HTML trước khi gửi trang; `README.md`: quy tắc cho ngôn ngữ khác |

Cách dùng: https://vnexpress-design-system.vne-designops.workers.dev/introduction/getting-started/#production
