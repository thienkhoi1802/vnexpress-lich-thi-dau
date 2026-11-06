# Dựng thẻ VDS phía server

Bộ phát hành VDS có sẵn hàm dựng cho Node (`vds-tags.mjs`, lõi ở `vds-core.mjs`) và PHP (`vds-tags.php`).
Server viết bằng ngôn ngữ khác: viết hàm `expand(html)` theo các bước dưới đây, rồi tự kiểm bằng `../components/vds-fixtures.json`: mỗi mục có `input` (HTML có thẻ VDS) và `output` (HTML phải dựng ra, từng ký tự).

Cách dùng thẻ: https://vnexpress-design-system.vne-designops.workers.dev/components/overview/

## Dữ liệu

- `components/vds-templates.json`: mẫu của từng thẻ component. Mỗi thẻ có `props` (thuộc tính nhận vào), `lists` (danh sách sinh từ thuộc tính), `parts` (mẫu đã biên dịch, `parts.main` là phần chính).
- `icons/Icon__{tên}.svg`, `icons/renamed.json` (tên cũ, tên mới của icon đã đổi tên), `logos/themeable/{tên}.svg`.

Mọi file trong một bộ phát hành không bao giờ đổi: đọc một lần rồi giữ trong bộ nhớ.
Khoảng trắng dưới đây là space, tab, LF, FF, CR.

## expand(html)

1. Đổi cách viết của 0.3.0: thẻ `<i …></i>` rỗng (hoặc `<i … />`) có `data-vds-icon="X"` thành `<vds-icon name="X" …></vds-icon>`, các thuộc tính khác giữ nguyên thứ tự; tương tự `data-vds-logo`.
2. Dựng thẻ component, nhiều lượt tới khi HTML không đổi nữa (tối đa 16 lượt). Mỗi lượt:
   - Tìm thẻ `vds-*` ngoài cùng; bỏ qua chú thích, nội dung `script`, `style`, `textarea`. Tên thẻ so không phân biệt hoa thường; `<vds-x … />` là thẻ rỗng.
   - Thẻ có trong `vds-templates.json`: thay cả thẻ bằng HTML dựng theo mục "Dựng một thẻ". HTML đó có thể chứa thẻ VDS khác (vd icon trong button), lượt sau dựng tiếp.
   - `vds-icon`, `vds-logo`, thẻ lạ: giữ thẻ, dựng phần bên trong. Thẻ lạ ghi cảnh báo.
3. Thay mọi thẻ `<vds-icon …></vds-icon>`, `<vds-logo …></vds-logo>` rỗng (hoặc viết `/>`) theo mục "Icon, logo".

## Dựng một thẻ

1. Đọc thuộc tính của thẻ. Tên so không phân biệt hoa thường; giá trị giữ nguyên dạng HTML (không giải mã entity, bỏ ngoặc bao ngoài).
   - `class`: giữ riêng.
   - Thuộc tính có trong `props`: thành giá trị cho mẫu (bước 2).
   - Còn lại: danh sách `rest`, giữ thứ tự.
2. Giá trị của từng mục trong `props`, theo thứ tự trong `props`:
   - `boolean`: có thuộc tính là true, không có là false.
   - Khác: thuộc tính không có giá trị hoặc giá trị rỗng thì lấy `flag` nếu có, không thì coi như không có.
     Có `values` mà giá trị không phải một khoá của `values`, hoặc có `number: [nhỏ nhất, lớn nhất]` mà giá trị không phải số nguyên trong khoảng đó: ghi cảnh báo, coi như không có.
     Không có: `auto` thì sinh id `vds-1`, `vds-2`… (đếm lại từ 1 mỗi lần gọi expand); không thì lấy `default`; không có `default` thì false.
3. `lists`: mỗi mục `{ repeat, chars }` thành danh sách có số mục bằng giá trị của `repeat`; mục thứ i có `index` (chuỗi "1", "2"…), `first`, `last`, `char` (ký tự thứ i của giá trị `chars`, không có thì false).
4. `content`: HTML bên trong thẻ, bỏ khoảng trắng đầu và cuối.
   `text`: `content` bỏ mọi thẻ `<…>`, gộp mỗi chuỗi khoảng trắng thành một dấu cách, bỏ dấu cách đầu và cuối.
5. Dựng `parts.main` theo mục "Mẫu", với phạm vi gồm các giá trị trên.
6. Gắn thuộc tính vào HTML vừa dựng:
   - `class` của tác giả (nếu khác rỗng) nối vào class của thẻ mở đầu tiên, cách một dấu cách.
   - `rest` gộp vào thẻ mở có thuộc tính `data-vds-rest`, không có thì thẻ mở đầu tiên: trùng tên (không phân biệt hoa thường) thì ghi đè giá trị tại chỗ, không trùng thì thêm vào cuối. Bỏ `data-vds-rest`.
   - Viết lại thẻ mở đã gộp: ` tên="giá trị"`, giá trị có `"` thì dùng ngoặc đơn; thuộc tính không có giá trị chỉ ghi tên.

## Mẫu

Mỗi phần mẫu là một mảng nút, dựng lần lượt rồi nối lại:

- Chuỗi: chép nguyên.
- `{ "v": tên }`: giá trị của tên, nếu là chuỗi thì thay `<`, `>`, `"` bằng `&lt;`, `&gt;`, `&quot;`; true, false, danh sách thành chuỗi rỗng.
- `{ "r": tên }`: giá trị chuỗi chép nguyên; khác chuỗi thành chuỗi rỗng.
- `{ "p": tên phần }`: dựng phần đó trong cùng phạm vi.
- `{ "if": tên, "not": true?, "in": [...]?, "do": [...] }`:
  - có `in`: đúng khi giá trị là chuỗi nằm trong `in` (giá trị true so như chuỗi "true");
  - không có `in`, không có `not`, giá trị là danh sách khác rỗng: dựng `do` cho từng mục, mục đó thêm vào phạm vi trong cùng;
  - còn lại: đúng khi giá trị là true, chuỗi có ký tự khác khoảng trắng, hoặc danh sách khác rỗng;
  - `not` đảo đúng thành sai; đúng thì dựng `do`.
- Tra tên: từ phạm vi trong cùng ra ngoài.

## Icon, logo

1. Tên: thuộc tính `name`; thiếu thì giữ thẻ, ghi cảnh báo.
   Thẻ `vds-icon` có `size` (khác rỗng): bỏ cỡ ở cuối tên (`__` cùng chữ số) rồi thêm `__{size}`, vd `Share__Regular` và `20` thành `Share__Regular__20`.
2. Tên chỉ gồm chữ, số, `_`, `-`; khác thì giữ thẻ, ghi cảnh báo.
3. Đọc `icons/Icon__{tên}.svg` hoặc `logos/themeable/{tên}.svg`.
   Icon không có file: tra `icons/renamed.json`, có tên mới thì ghi cảnh báo và đọc file của tên mới; vẫn không có thì giữ thẻ, ghi cảnh báo.
4. Thẻ `<svg …>` đầu tiên của file: gộp thuộc tính như bước 6 của "Dựng một thẻ", nhưng `class` cũng gộp như thuộc tính khác (nối vào class sẵn có). Thứ tự gộp: thuộc tính của thẻ VDS trừ `name`, `size`, rồi `data-vds-icon` (hoặc `data-vds-logo`) bằng tên ở bước 1.
5. Có `aria-label`, `aria-labelledby` hoặc `title` mà chưa có `role`: thêm `role="img"`; không có cả ba mà chưa có `aria-hidden`: thêm `aria-hidden="true"`. Chưa có `focusable`: thêm `focusable="false"`.
6. HTML thay cho thẻ: thẻ `<svg>` đã gộp, rồi phần còn lại của file sau thẻ mở đó, bỏ khoảng trắng đầu cuối và khoảng trắng giữa `>` và `<`.
