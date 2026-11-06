# VnExpress Football - Lịch Thi Đấu, Kết Quả & Chi Tiết Giải Đấu

Hệ thống giao diện Lịch thi đấu, Kết quả trực tiếp (LIVE) và Chi tiết giải đấu bóng đá chuẩn phong cách VnExpress Thể Thao.

## ✨ Tính năng nổi bật

### 1. Trang chủ: Lịch thi đấu & Kết quả (`/`)
- **Menu ngày trực quan**: Mặc định active ngay vào tab **"Hôm nay"**.
- **Rule hiển thị thông minh**:
  - Trang *Lịch thi đấu* (tab Hôm nay): Hiển thị các trận sắp/đang diễn ra trong ngày + kết quả các trận trong 12 tiếng gần nhất.
  - Trang *Kết quả* (tab Hôm nay): Hiển thị kết quả các trận đã đá trong ngày + lịch thi đấu các trận trong 12 tiếng tới.
- **Header cố định (Sticky/Pinned Header)**: Ghim cố định ở đầu trang trên cả PC và Mobile khi cuộn trang.
- **Chuẩn hóa thời gian**: Định dạng template `Thứ [x] [dd]/[mm]/[yyyy], [hh]:[mm]`. Trên item trận đấu hiển thị gọn `[dd]/[mm], [hh]:[mm]`.
- **Trạng thái chuẩn**: Đổi trạng thái `FT` thành `KT`, bỏ nhãn `SẮP DIỄN RA`.
- **Chế độ xem**: Chế độ dòng thời gian (Timeline) và Chế độ SCS Combo View (Lịch đấu - Kết quả - Bảng điểm).

### 2. Trang Chi tiết giải đấu (`/giai-dau/:slug`)
- **URL chuẩn SEO**:
  - `/giai-dau/:slug` (Tổng quan & Tin tức)
  - `/giai-dau/:slug/lich-thi-dau` (Lịch thi đấu đầy đủ từ hôm nay đi về tương lai)
  - `/giai-dau/:slug/ket-qua` (Kết quả đầy đủ từ hôm nay trở về quá khứ)
  - `/giai-dau/:slug/bang-xep-hang` (Bảng xếp hạng chi tiết với 11 cột thông số + phong độ 5 trận)
- **4 Sub-pages**:
  - **Tổng quan & Tin tức**: Widget tóm tắt lịch thi đấu dạng slider, bài viết tiêu điểm, danh sách tin tức 20 tin/trang có phân trang, widget dự đoán tỷ số, mini BXH và vua phá lưới.
  - **Lịch thi đấu**: Full fixtures gom nhóm theo vòng, bộ lọc vòng và tìm kiếm CLB realtime.
  - **Kết quả**: Full results gom nhóm theo vòng, tỷ số nổi bật, video highlight popup.
  - **Bảng xếp hạng**: Bảng xếp hạng chi tiết (#, CLB, Tr, T, H, B, BT, BB, HS, Điểm, 5 trận gần nhất 🟢 T / 🟡 H / 🔴 B), màu phân vùng cúp châu Âu / xuống hạng và danh sách Top ghi bàn đầy đủ.
- **Tối ưu Mobile**: Hoàn toàn responsive trên mọi kích thước màn hình thiết bị di động.

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

```bash
# Cài đặt dependencies
npm install

# Khởi chạy server
npm start
# hoặc
node server.js
```

Truy cập ứng dụng tại: `http://localhost:3000`
