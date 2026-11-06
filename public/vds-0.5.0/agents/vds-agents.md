<!-- VDS:START 0.5.0 -->
<!-- Khối hướng dẫn VnExpress Design System cho AI agent, bản 0.5.0. Không sửa tay trong khối: nâng VDS thì thay cả khối bằng agents/vds-agents.md của bộ phát hành mới (lệnh: node <thư mục VDS>/agents/install.mjs). Thông tin riêng của dự án ghi ngoài khối. -->

## VnExpress Design System (VDS) 0.5.0

Dự án này dùng VnExpress Design System (VDS) bản 0.5.0 cho mọi giao diện web: HTML, CSS, JS, template phía server. Làm đúng khối này; không dựa vào hiểu biết có sẵn về VDS hay về design system khác.

### Cách làm việc

- Việc giao diện nào cũng làm theo khối này, từ đầu tới cuối phiên.
- Không chắc thì đọc đúng trang tài liệu (bản Markdown, link ở mục Tra cứu); không đoán, không tự đặt tên token, thẻ, thuộc tính, tên icon.
- Bộ file VDS của dự án (thư mục bộ phát hành, server dựng thẻ ở đâu): xem mục "VDS trong dự án này" ngoài khối; chưa có thì hỏi người dùng rồi ghi vào mục đó.
- Bộ phát hành dự án đang dùng khác bản 0.5.0 của khối này (vd thư mục `vds-x.y.z` khác số): khối không khớp với bộ file. Chạy `agents/install.mjs` của chính bộ đó để thay khối (không chạy được thì báo người dùng) trước khi làm tiếp.
- Tài liệu luôn là bản mới nhất, có thể mới hơn 0.5.0: thẻ, thuộc tính, giá trị chỉ dùng loại có trong khối này.
- Prototype (trang để xem, demo, review nội bộ) được gọi thẳng file trên tài liệu (https://vnexpress-design-system.vne-designops.workers.dev/generated/…); production (người dùng thật truy cập) chỉ dùng bộ phát hành đặt trên server của dự án.

### Quy tắc bắt buộc

- Chỉ dùng token VDS: biến CSS (CSS variable) `--vds-*`, class chữ `.vds-text-*` (vd `.vds-text-article-title-primary-bold-md`), variable shadow `--vds-shadow-*`. Không gán cứng màu, cỡ chữ (font size), khoảng cách (spacing), bo góc (radius), bóng đổ (shadow).
- Chọn font theo vai trò, qua class chữ:
  - tiêu đề tin bài: Merriweather (`article/title/primary/*`);
  - chữ giao diện ngắn như nhãn, nút (button), menu, tiêu đề khối: Merriweather Sans (`microcopy/*`, `heading/*`);
  - văn bản đọc liền mạch (dài quá 2 dòng hoặc là câu): Arial (`article/paragraph/standard/*`), Android dùng Roboto;
  - số liệu: Roboto Mono (`numeric/*`);
  - Breakers Slab chỉ cho chuyên mục Góc nhìn: tiêu đề bài và heading (`article/title/goc-nhin/*`), không dùng cho chỗ khác.
- Nền `surface/000`, chữ mặc định `text/regular`. Màu nhấn đỏ đô (accent) dùng ít và có chủ đích, để dẫn mắt tới chỗ cần chú ý (vd heading khối tin, mục đang chọn (selected), button hành động chính); không dùng làm nền lớn hay để trang trí. Xanh dương dành cho link và tín hiệu của hệ thống: thông tin, vòng focus (focus ring).
- Link trong nội dung luôn gạch chân (nét 1px), màu `text/link/regular`. Button, menu, tiêu đề tin (cả khối tin là link) không gạch chân.
- Bố cục (layout) kiểu báo in: mỗi tin có padding bên trong nên các tin đặt sát nhau, phân tách bằng đường kẻ (divider) mảnh 1px (`component/divider/fill/*`). Không dùng card và shadow cho nội dung thường.
- Hỗ trợ light và dark: đặt `data-theme="dark"` trên thẻ `<html>`, token Color tự đổi; không viết màu riêng cho dark.
- Tương phản (contrast) theo WCAG 2.2 AA: chữ thường ≥ 4,5:1, chữ lớn ≥ 3:1, icon và viền (border) cần thấy ≥ 3:1. Đặt token chữ trên đúng nền đi kèm (bảng Contrast ở trang Color). `text/subdued`, `text/subdued-lighter` cố ý chìm, chỉ cho thông tin phụ (helper, placeholder, meta của tin) và thành phần bị vô hiệu hoá (disabled).
- Component có sẵn trong VDS thì bắt buộc dùng, không tự vẽ lại: [Alert Inline](https://vnexpress-design-system.vne-designops.workers.dev/components/alert-inline.md), [Alert Toast](https://vnexpress-design-system.vne-designops.workers.dev/components/alert-toast.md), [Button](https://vnexpress-design-system.vne-designops.workers.dev/components/button.md), [Button Inline](https://vnexpress-design-system.vne-designops.workers.dev/components/button-inline.md), [Button Touch](https://vnexpress-design-system.vne-designops.workers.dev/components/button-touch.md), [Input Code Field](https://vnexpress-design-system.vne-designops.workers.dev/components/input-code-field.md), [Input Text Field](https://vnexpress-design-system.vne-designops.workers.dev/components/input-text-field.md), [Selection Item Chip](https://vnexpress-design-system.vne-designops.workers.dev/components/selection-item-chip.md), [Tabs](https://vnexpress-design-system.vne-designops.workers.dev/components/tabs.md). Viết thẻ VDS theo bảng thuộc tính ở trang của component (vd `<vds-tabs>`, `<vds-input-text-field>`); tab, ô nhập mã, chip, nút đóng thông báo cần `vds-components.js` để có hành vi. Chỉ chép HTML (tab HTML của ví dụ) ở nơi không dựng được thẻ: dự án React, email, CMS chặn thẻ lạ. Component chưa có (News Item, Header, Footer…): tự dựng từ token và class chữ, đặt tên và thuộc tính theo component trong Figma (vd Button: Type, Size, State).
- Icon và logo chỉ lấy từ VDS, gọi theo tên (`<vds-icon name="…">`, `<vds-logo name="…">`); không dán SVG vào HTML, không dùng thẻ `<img>` (icon không đổi được màu, logo không đổi theo theme); riêng app icon (`AppIcon__*`, có ảnh nhúng, file nặng) dùng `<img>` trỏ tới file. Icon một màu xám, đen, trắng (`mono` trong manifest) nhận màu từ `color` (token `icon/fill/*`); icon nhiều màu, icon một màu có sắc giữ màu gốc.
- Câu chữ trung lập, ngắn gọn. Ngày, giờ, số, địa điểm viết theo các trang Content Rules (vd `21/10/2026`, `09:00`).

### Component: viết bằng thẻ VDS

Thẻ VDS gọi component theo tên như instance trong Figma. Server dựng thẻ thành HTML trước khi gửi trang (`server/vds-tags.php`, `server/vds-tags.mjs` trong bộ phát hành); server chưa dựng thì `vds-components.js` dựng trên trình duyệt.

- Không viết tay HTML, class `vds-*` của component: chỉ viết thẻ dưới đây. Luôn viết thẻ đóng, vd `</vds-button>`.
- Thuộc tính khác (`id`, `aria-label`, `data-*`…) gắn vào phần tử ngoài cùng (Input Text Field: vào ô nhập); `class` nối thêm vào class của component.
- Thuộc tính icon nhận tên icon bỏ cỡ, vd `icon-left="Share__Regular"`: component tự đặt đúng cỡ.
- Ví dụ, ý nghĩa từng thuộc tính: cột Chi tiết.

| Thẻ | Nội dung trong thẻ | Thuộc tính | Chi tiết |
| --- | --- | --- | --- |
| `<vds-alert-inline>` | Câu thông báo, một dòng | `context` = `info`, `info-alternative`, `positive`, `warning`, `negative` (mặc định `info`); `align` = `left`, `center`, `right` (mặc định `left`) | [alert-inline.md](https://vnexpress-design-system.vne-designops.workers.dev/components/alert-inline.md) |
| `<vds-alert-toast>` | Nội dung thông báo (Has message) | `context` = `info`, `positive`, `warning`, `negative` (mặc định `info`); `title` (Tiêu đề); `dismissible`; `dismiss-label` (`aria-label` của button đóng; mặc định `Đóng`); `action` (Nhãn button hành động); `action-below`; `action-href` (Có đường dẫn thì button hành động thành link) | [alert-toast.md](https://vnexpress-design-system.vne-designops.workers.dev/components/alert-toast.md) |
| `<vds-button>` | Nhãn (bỏ trống khi dùng icon) | `variant` = `uncontained`, `contained`, `contained-bordered`, `ghost`, `ghost-subdued`, `ghost-on-color`, `accent`, `accent-subdued`, `support`, `link-subtle`, `link`, `info-uncontained`, `info-contained`, `positive-uncontained`, `positive-contained`, `warning-uncontained`, `warning-contained`, `negative-uncontained`, `negative-contained` (mặc định `contained`); `size` = `sm`, `md`, `lg` (mặc định `md`); `icon-left` (tên icon bỏ cỡ); `icon-right` (tên icon bỏ cỡ); `icon` (tên icon bỏ cỡ); `circle`; `far`; `selected` = `a`, `b`; `disabled`; `full-width`; `href` (Có `href` thì dựng thẻ `a`); `type` (`type` của thẻ `button`; mặc định `button`) | [button.md](https://vnexpress-design-system.vne-designops.workers.dev/components/button.md) |
| `<vds-button-inline>` | Nhãn | `strong`; `icon-left` (tên icon bỏ cỡ); `icon-right` (tên icon bỏ cỡ); `disabled`; `type` (`type` của thẻ `button`; mặc định `button`) | [button-inline.md](https://vnexpress-design-system.vne-designops.workers.dev/components/button-inline.md) |
| `<vds-button-touch>` | Để trống (chỉ có icon) | `variant` = `touch`, `contained`, `on-color`, `on-image` (mặc định `touch`); `size` = `sm`, `md` (mặc định `md`); `icon` (tên icon bỏ cỡ); `selected`; `disabled`; `href` (Có `href` thì dựng thẻ `a`); `type` (`type` của thẻ `button`; mặc định `button`) | [button-touch.md](https://vnexpress-design-system.vne-designops.workers.dev/components/button-touch.md) |
| `<vds-input-code-field>` | Để trống | `length` (Số ô; mặc định `5`); `allow` = `numeric`, `alphanumeric` (mặc định `numeric`); `label` (Tên của nhóm ô cho trình đọc màn hình; mặc định `Mã xác thực`); `name` (Tên trường khi gửi form); `value` (Mã đã nhập (vd hiện lại khi báo lỗi)); `helper` (Dòng phụ); `error` (Thông báo lỗi); `disabled` | [input-code-field.md](https://vnexpress-design-system.vne-designops.workers.dev/components/input-code-field.md) |
| `<vds-input-text-field>` | Phần cuối ô (Has button), thường là vds-button-inline; để trống nếu không có | `size` = `sm`, `md`, `lg` (mặc định `md`); `label` (Nhãn); `label-hidden`; `icon` (tên icon bỏ cỡ); `helper` (Dòng phụ); `error` (Thông báo lỗi); `disabled`; `id` (`id` của ô nhập) | [input-text-field.md](https://vnexpress-design-system.vne-designops.workers.dev/components/input-text-field.md) |
| `<vds-selection-item-chip>` | Nhãn | `size` = `sm`, `md`, `lg` (mặc định `md`); `selected`; `icon` (tên icon bỏ cỡ); `role` = `radio`; `disabled`; `type` (`type` của thẻ `button`; mặc định `button`) | [selection-item-chip.md](https://vnexpress-design-system.vne-designops.workers.dev/components/selection-item-chip.md) |
| `<vds-tab>` | Nhãn tab | `selected`; `disabled`; `panel` (`id` của vùng nội dung tab điều khiển (`aria-controls`)) | [tabs.md](https://vnexpress-design-system.vne-designops.workers.dev/components/tabs.md) |
| `<vds-tabs>` | Các thẻ vds-tab | `width` = `hug`, `fixed` (mặc định `hug`) | [tabs.md](https://vnexpress-design-system.vne-designops.workers.dev/components/tabs.md) |

Icon đứng riêng: `<vds-icon name="Bookmark__Regular__24"></vds-icon>` (thêm `size` để đổi cỡ trong tên); logo: `<vds-logo name="Logo__VnExpress__Standard"></vds-logo>`. Tra tên icon: [danh sách icon](https://vnexpress-design-system.vne-designops.workers.dev/generated/icons/index.md); tên logo: trang [Logo](https://vnexpress-design-system.vne-designops.workers.dev/foundations/logo.md).

### Tra cứu (bản Markdown)

- Foundations: [VnExpress Identity](https://vnexpress-design-system.vne-designops.workers.dev/foundations/identity.md), [Color](https://vnexpress-design-system.vne-designops.workers.dev/foundations/color.md), [Typography](https://vnexpress-design-system.vne-designops.workers.dev/foundations/typography.md), [Spacing & Sizing](https://vnexpress-design-system.vne-designops.workers.dev/foundations/spacing.md), [Elevation](https://vnexpress-design-system.vne-designops.workers.dev/foundations/elevation.md), [Iconography](https://vnexpress-design-system.vne-designops.workers.dev/foundations/iconography.md), [Logo](https://vnexpress-design-system.vne-designops.workers.dev/foundations/logo.md), [Layout & Grid](https://vnexpress-design-system.vne-designops.workers.dev/foundations/layout.md)
- Design Tokens: [Overview](https://vnexpress-design-system.vne-designops.workers.dev/tokens/overview.md), [Usage](https://vnexpress-design-system.vne-designops.workers.dev/tokens/usage.md)
- Content Rules: [Date & Time](https://vnexpress-design-system.vne-designops.workers.dev/content/time.md), [Numbers](https://vnexpress-design-system.vne-designops.workers.dev/content/numbers.md), [Locations](https://vnexpress-design-system.vne-designops.workers.dev/content/locations.md), [Truncation](https://vnexpress-design-system.vne-designops.workers.dev/content/truncation.md)
- Toàn bộ tài liệu, tóm tắt: [llms.txt](https://vnexpress-design-system.vne-designops.workers.dev/llms.txt)

### Trước khi giao

Tự kiểm từng mục; mục nào chưa đạt thì sửa trước khi báo xong.

- Không có mã màu hex, cỡ chữ (font size) hay khoảng cách (spacing) gán cứng trong code.
  Mọi giá trị đi qua `var(--vds-*)`.
- Đã nhúng `vds-fonts.css`: tiêu đề tin hiện Merriweather, không phải font dự phòng.
- Tiêu đề tin dùng Merriweather; đoạn văn dài dùng Arial; nhãn, button, menu dùng Merriweather Sans.
- Giao diện đúng ở cả light và dark, không có chữ chìm mất hay nền lệch tông.
- Nội dung phân tách bằng đường kẻ (divider) mảnh, không có card đổ bóng (shadow).
- Button, input, tab, chip, alert viết bằng thẻ VDS (`<vds-button>`, `<vds-input-text-field>`…), không tự vẽ lại.
- Icon và logo gọi theo tên (`<vds-icon>`, `<vds-logo>`), không có SVG dán thẳng trong HTML.
- Ngày giờ viết dạng `21/10/2026`, `09:00`; không `21/10/26`, `9h`.
<!-- VDS:END -->
