const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const filePath = path.resolve(__dirname, 'data-dlbd.xlsx');
  const workbook = new ExcelJS.Workbook();
  console.log('Loading workbook from', filePath);
  await workbook.xlsx.readFile(filePath);

  const pivotSheet = workbook.getWorksheet('Pageview theo tháng');
  if (!pivotSheet) {
    throw new Error('Sheet "Pageview theo tháng" not found!');
  }

  // Define category specifications
  const categoryDefs = [
    {
      id: 'trang-chu',
      name: 'Lớp Trang chủ',
      filterDesc: 'Khớp chính xác URL: https://vnexpress.net/the-thao/du-lieu-bong-da',
      match: (u) => u === 'https://vnexpress.net/the-thao/du-lieu-bong-da'
    },
    {
      id: 'giai-dau',
      name: 'Lớp Giải đấu',
      filterDesc: 'URL chứa "/giai-dau/"',
      match: (u) => u.includes('/giai-dau/')
    },
    {
      id: 'tran-dau',
      name: 'Lớp Trận đấu',
      filterDesc: 'URL chứa "/tran-dau/"',
      match: (u) => u.includes('/tran-dau/')
    },
    {
      id: 'doi-bong',
      name: 'Lớp Đội bóng',
      filterDesc: 'URL chứa "/doi-bong/"',
      match: (u) => u.includes('/doi-bong/')
    },
    {
      id: 'cau-thu',
      name: 'Lớp Cầu thủ',
      filterDesc: 'URL chứa "/cau-thu/"',
      match: (u) => u.includes('/cau-thu/')
    },
    {
      id: 'khac',
      name: 'Lớp Khác / Còn lại',
      filterDesc: 'Các trang danh mục không dấu gạch chéo cuối, dự đoán tỷ số, v.v.',
      match: () => true
    }
  ];

  const catMap = {};
  categoryDefs.forEach(c => {
    catMap[c.id] = {
      ...c,
      urls: [],
      totalPv: 0
    };
  });

  let grandTotalPv = 0;

  for (let r = 2; r <= pivotSheet.rowCount; r++) {
    const row = pivotSheet.getRow(r);
    const url = (row.getCell(1).value || '').toString().trim();
    const sumVal = row.getCell(23).value;
    const pv = typeof sumVal === 'object' && sumVal !== null ? Number(sumVal.result) : Number(sumVal);

    grandTotalPv += pv;

    let matched = false;
    for (const c of categoryDefs) {
      if (c.id !== 'khac' && c.match(url)) {
        catMap[c.id].urls.push({ url, pv, originalRow: r });
        catMap[c.id].totalPv += pv;
        matched = true;
        break;
      }
    }
    if (!matched) {
      catMap['khac'].urls.push({ url, pv, originalRow: r });
      catMap['khac'].totalPv += pv;
    }
  }

  // Sort URLs descending in each category
  categoryDefs.forEach(c => {
    catMap[c.id].urls.sort((a, b) => b.pv - a.pv);
  });

  console.log('Grand total PV:', grandTotalPv);
  categoryDefs.forEach(c => {
    const d = catMap[c.id];
    console.log(`${d.name}: ${d.urls.length} URLs, ${d.totalPv.toLocaleString()} PV (${((d.totalPv / grandTotalPv) * 100).toFixed(2)}%)`);
  });

  // Remove existing 'Thống kê' sheet if present
  const existingSheet = workbook.getWorksheet('Thống kê');
  if (existingSheet) {
    workbook.removeWorksheet(existingSheet.id);
  }

  // Create new sheet
  const statSheet = workbook.addWorksheet('Thống kê', {
    views: [{ showGridLines: true }]
  });

  // Styling helper constants
  const FONT_FAMILY = 'Segoe UI';
  const COLOR_PRIMARY = 'FF1F4E79'; // Deep Navy
  const COLOR_HEADER_FILL = 'FF203764'; // Darker Navy
  const COLOR_ACCENT = 'FF2F5597';
  const COLOR_LIGHT_BLUE = 'FFD9E1F2';
  const COLOR_LIGHT_GRAY = 'FFF2F2F2';
  const COLOR_BORDER = 'FFD9D9D9';
  const COLOR_DARK_BORDER = 'FF8EA9DB';

  const thinBorder = {
    top: { style: 'thin', color: { argb: COLOR_BORDER } },
    left: { style: 'thin', color: { argb: COLOR_BORDER } },
    bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
    right: { style: 'thin', color: { argb: COLOR_BORDER } }
  };

  const headerBorder = {
    top: { style: 'thin', color: { argb: COLOR_DARK_BORDER } },
    left: { style: 'thin', color: { argb: COLOR_DARK_BORDER } },
    bottom: { style: 'medium', color: { argb: COLOR_PRIMARY } },
    right: { style: 'thin', color: { argb: COLOR_DARK_BORDER } }
  };

  // Set column widths
  statSheet.columns = [
    { width: 8 },   // A: STT / Index
    { width: 28 },  // B: Lớp trang / Danh mục
    { width: 75 },  // C: Điều kiện / URL
    { width: 18 },  // D: Tổng Pageview
    { width: 22 },  // E: Tỉ lệ đóng góp (%)
    { width: 22 }   // F: Ghi chú / Tỉ lệ trên tổng
  ];

  let currRow = 1;

  // Title block
  statSheet.mergeCells(`A${currRow}:F${currRow}`);
  const titleCell = statSheet.getCell(`A${currRow}`);
  titleCell.value = 'BÁO CÁO THỐNG KÊ PAGEVIEW THEO LỚP TRANG - DỮ LIỆU BÓNG ĐÁ VNEXPRESS';
  titleCell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  statSheet.getRow(currRow).height = 36;
  currRow += 2;

  // SECTION 1: TỔNG HỢP TỈ LỆ ĐÓNG GÓP
  statSheet.mergeCells(`A${currRow}:F${currRow}`);
  const s1Header = statSheet.getCell(`A${currRow}`);
  s1Header.value = 'I. BẢNG TỔNG HỢP TỈ LỆ ĐÓNG GÓP PAGEVIEW CỦA CÁC LỚP TRANG';
  s1Header.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLOR_PRIMARY } };
  statSheet.getRow(currRow).height = 24;
  currRow++;

  // Table 1 headers
  const t1Headers = ['STT', 'Lớp trang', 'Điều kiện nhận diện', 'Số lượng URL', 'Tổng Pageview', 'Tỉ lệ đóng góp (%)'];
  const t1HeaderRow = statSheet.getRow(currRow);
  t1HeaderRow.height = 25;
  t1Headers.forEach((h, idx) => {
    const cell = t1HeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT } };
    cell.alignment = { vertical: 'middle', horizontal: idx === 1 || idx === 2 ? 'left' : 'center' };
    cell.border = headerBorder;
  });
  currRow++;

  const summaryStartRow = currRow;
  categoryDefs.forEach((cat, index) => {
    const d = catMap[cat.id];
    const row = statSheet.getRow(currRow);
    row.height = 22;

    // Col A: STT
    const cellA = row.getCell(1);
    cellA.value = index + 1;
    cellA.alignment = { vertical: 'middle', horizontal: 'center' };
    cellA.border = thinBorder;
    cellA.font = { name: FONT_FAMILY, size: 9.5 };

    // Col B: Lớp trang
    const cellB = row.getCell(2);
    cellB.value = d.name;
    cellB.alignment = { vertical: 'middle', horizontal: 'left' };
    cellB.border = thinBorder;
    cellB.font = { name: FONT_FAMILY, size: 9.5, bold: true };

    // Col C: Điều kiện
    const cellC = row.getCell(3);
    cellC.value = d.filterDesc;
    cellC.alignment = { vertical: 'middle', horizontal: 'left' };
    cellC.border = thinBorder;
    cellC.font = { name: FONT_FAMILY, size: 9, italic: true };

    // Col D: Số lượng URL
    const cellD = row.getCell(4);
    cellD.value = d.urls.length;
    cellD.numFmt = '#,##0';
    cellD.alignment = { vertical: 'middle', horizontal: 'right' };
    cellD.border = thinBorder;
    cellD.font = { name: FONT_FAMILY, size: 9.5 };

    // Col E: Tổng Pageview
    const cellE = row.getCell(5);
    cellE.value = d.totalPv;
    cellE.numFmt = '#,##0';
    cellE.alignment = { vertical: 'middle', horizontal: 'right' };
    cellE.border = thinBorder;
    cellE.font = { name: FONT_FAMILY, size: 9.5, bold: true };

    // Col F: Tỉ lệ đóng góp
    const cellF = row.getCell(6);
    // Formula referencing Total Pageview row
    const totalRowIndex = summaryStartRow + categoryDefs.length;
    cellF.value = {
      formula: `E${currRow}/E${totalRowIndex}`,
      result: d.totalPv / grandTotalPv
    };
    cellF.numFmt = '0.00%';
    cellF.alignment = { vertical: 'middle', horizontal: 'right' };
    cellF.border = thinBorder;
    cellF.font = { name: FONT_FAMILY, size: 9.5, bold: true };

    // Alternating background
    if (index % 2 === 1) {
      for (let c = 1; c <= 6; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    }

    currRow++;
  });

  // Total Row for Table 1
  const summaryTotalRow = statSheet.getRow(currRow);
  summaryTotalRow.height = 24;
  summaryTotalRow.getCell(1).value = '';
  summaryTotalRow.getCell(2).value = 'TỔNG CỘNG';
  summaryTotalRow.getCell(3).value = 'Toàn bộ dữ liệu VnExpress Dữ liệu bóng đá';
  
  const sumUrlsFormula = `SUM(D${summaryStartRow}:D${currRow - 1})`;
  const sumPvFormula = `SUM(E${summaryStartRow}:E${currRow - 1})`;
  const sumPctFormula = `SUM(F${summaryStartRow}:F${currRow - 1})`;

  summaryTotalRow.getCell(4).value = { formula: sumUrlsFormula, result: 7093 };
  summaryTotalRow.getCell(4).numFmt = '#,##0';

  summaryTotalRow.getCell(5).value = { formula: sumPvFormula, result: grandTotalPv };
  summaryTotalRow.getCell(5).numFmt = '#,##0';

  summaryTotalRow.getCell(6).value = { formula: sumPctFormula, result: 1.0 };
  summaryTotalRow.getCell(6).numFmt = '0.00%';

  const totalBorder = {
    top: { style: 'thin', color: { argb: COLOR_PRIMARY } },
    left: { style: 'thin', color: { argb: COLOR_BORDER } },
    bottom: { style: 'double', color: { argb: COLOR_PRIMARY } },
    right: { style: 'thin', color: { argb: COLOR_BORDER } }
  };

  for (let c = 1; c <= 6; c++) {
    const cell = summaryTotalRow.getCell(c);
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: COLOR_PRIMARY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_BLUE } };
    cell.border = totalBorder;
    if (c >= 4) cell.alignment = { vertical: 'middle', horizontal: 'right' };
    else if (c === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    else cell.alignment = { vertical: 'middle', horizontal: 'left' };
  }
  currRow += 2;

  // Note for section 1
  statSheet.mergeCells(`A${currRow}:F${currRow}`);
  const noteCell = statSheet.getCell(`A${currRow}`);
  noteCell.value = '(*) Ghi chú: Nhóm "Lớp Khác / Còn lại" bao gồm 8 URL (chiếm 0.31% PV): trong đó có trang danh mục https://vnexpress.net/the-thao/du-lieu-bong-da/doi-bong (23.749 PV), https://vnexpress.net/the-thao/du-lieu-bong-da/cau-thu (586 PV), https://vnexpress.net/the-thao/du-lieu-bong-da/giai-dau (15 PV) do URL không chứa dấu gạch chéo cuối. Nếu tính gộp trang danh mục vào từng lớp tương ứng thì Lớp Đội bóng chiếm 5.89%, Lớp Cầu thủ chiếm 1.35%, Lớp Giải đấu chiếm 56.98%.';
  noteCell.font = { name: FONT_FAMILY, size: 8.5, italic: true, color: { argb: 'FF555555' } };
  noteCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  statSheet.getRow(currRow).height = 34;
  currRow += 2;

  // SECTION 2: TOP 10 TRANG THEO TỪNG LỚP TRANG
  statSheet.mergeCells(`A${currRow}:F${currRow}`);
  const s2Header = statSheet.getCell(`A${currRow}`);
  s2Header.value = 'II. THỐNG KÊ CHI TIẾT TOP 10 TRANG CÓ PAGEVIEW CAO NHẤT TRONG TỪNG LỚP TRANG';
  s2Header.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLOR_PRIMARY } };
  statSheet.getRow(currRow).height = 24;
  currRow++;

  // We loop through the 5 main categories + Khác
  for (const cat of categoryDefs) {
    const d = catMap[cat.id];
    const topItems = d.urls.slice(0, 10);

    // Section sub-header
    statSheet.mergeCells(`A${currRow}:F${currRow}`);
    const subH = statSheet.getCell(`A${currRow}`);
    subH.value = `▶ ${d.name.toUpperCase()} (Tổng: ${d.totalPv.toLocaleString()} PV - ${d.urls.length} URLs - Chiếm ${((d.totalPv / grandTotalPv) * 100).toFixed(2)}% toàn site)`;
    subH.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    subH.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
    subH.alignment = { vertical: 'middle', horizontal: 'left' };
    statSheet.getRow(currRow).height = 24;
    currRow++;

    // Table headers for Top 10
    const topHeaders = ['Hạng', 'URL Trang', 'Mô tả / Nhận diện', 'Tổng Pageview', 'Tỉ lệ trong lớp (%)', 'Tỉ lệ trên toàn site (%)'];
    const rHead = statSheet.getRow(currRow);
    rHead.height = 22;
    topHeaders.forEach((th, idx) => {
      const cell = rHead.getCell(idx + 1);
      cell.value = th;
      cell.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT } };
      cell.alignment = { vertical: 'middle', horizontal: idx === 1 || idx === 2 ? 'left' : 'center' };
      cell.border = headerBorder;
    });
    currRow++;

    topItems.forEach((item, rankIdx) => {
      const row = statSheet.getRow(currRow);
      row.height = 20;

      // Col A: Hạng
      const cA = row.getCell(1);
      cA.value = `Top ${rankIdx + 1}`;
      cA.alignment = { vertical: 'middle', horizontal: 'center' };
      cA.font = { name: FONT_FAMILY, size: 9, bold: rankIdx < 3 };
      cA.border = thinBorder;

      // Col B: URL
      const cB = row.getCell(2);
      cB.value = item.url;
      cB.alignment = { vertical: 'middle', horizontal: 'left' };
      cB.font = { name: FONT_FAMILY, size: 9, color: { argb: 'FF004B91' }, underline: false };
      cB.border = thinBorder;

      // Col C: Mô tả ngắn / Tên trang rút gọn
      const cC = row.getCell(3);
      let shortName = item.url.replace('https://vnexpress.net/the-thao/du-lieu-bong-da', '');
      if (!shortName) shortName = '/ (Trang chủ)';
      cC.value = shortName;
      cC.alignment = { vertical: 'middle', horizontal: 'left' };
      cC.font = { name: FONT_FAMILY, size: 8.5, color: { argb: 'FF444444' } };
      cC.border = thinBorder;

      // Col D: Tổng PV
      const cD = row.getCell(4);
      cD.value = item.pv;
      cD.numFmt = '#,##0';
      cD.alignment = { vertical: 'middle', horizontal: 'right' };
      cD.font = { name: FONT_FAMILY, size: 9, bold: true };
      cD.border = thinBorder;

      // Col E: Tỉ lệ trong lớp
      const cE = row.getCell(5);
      cE.value = d.totalPv > 0 ? item.pv / d.totalPv : 0;
      cE.numFmt = '0.00%';
      cE.alignment = { vertical: 'middle', horizontal: 'right' };
      cE.font = { name: FONT_FAMILY, size: 9 };
      cE.border = thinBorder;

      // Col F: Tỉ lệ trên toàn site
      const cF = row.getCell(6);
      cF.value = item.pv / grandTotalPv;
      cF.numFmt = '0.00%';
      cF.alignment = { vertical: 'middle', horizontal: 'right' };
      cF.font = { name: FONT_FAMILY, size: 9 };
      cF.border = thinBorder;

      // Top 3 highlight
      if (rankIdx === 0) {
        cA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // Soft Gold
      } else if (rankIdx === 1) {
        cA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; // Soft Silver
      } else if (rankIdx === 2) {
        cA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }; // Soft Bronze
      }

      if (rankIdx % 2 === 1 && rankIdx > 2) {
        for (let col = 1; col <= 6; col++) {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }
      }

      currRow++;
    });

    // Space after each table
    currRow++;
  }

  // SECTION 3: TỔNG HỢP VÀ BIỂU ĐỒ PAGEVIEW THEO TỪNG THÁNG
  statSheet.mergeCells(`A${currRow}:F${currRow}`);
  const s3Header = statSheet.getCell(`A${currRow}`);
  s3Header.value = 'III. BẢNG TỔNG HỢP VÀ BIỂU ĐỒ PAGEVIEW TỔNG THEO TỪNG THÁNG CỦA TOÀN BỘ TRANG';
  s3Header.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: COLOR_PRIMARY } };
  statSheet.getRow(currRow).height = 24;
  currRow++;

  // Sub-note
  statSheet.mergeCells(`A${currRow}:F${currRow}`);
  const s3Sub = statSheet.getCell(`A${currRow}`);
  s3Sub.value = 'Số liệu tổng hợp pageview 21 tháng (01/2025 - 09/2026) của toàn bộ 7.093 trang Dữ liệu bóng đá VnExpress';
  s3Sub.font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: 'FF555555' } };
  statSheet.getRow(currRow).height = 20;
  currRow++;

  // Table 3 headers
  const t3Headers = ['STT', 'Tháng', 'Tổng Pageview', 'Tỉ lệ (%)', 'Tăng trưởng MoM (%)', 'Nhận xét xu hướng'];
  const t3HeaderRow = statSheet.getRow(currRow);
  t3HeaderRow.height = 24;
  t3Headers.forEach((th, idx) => {
    const cell = t3HeaderRow.getCell(idx + 1);
    cell.value = th;
    cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT } };
    cell.alignment = { vertical: 'middle', horizontal: idx === 1 ? 'left' : 'center' };
    cell.border = headerBorder;
  });
  currRow++;

  const mTableStartRow = currRow;
  const numPivotRows = pivotSheet.rowCount;

  // Calculate monthly totals from pivotSheet
  const monthData = [];
  for (let c = 2; c <= 22; c++) {
    const colName = String.fromCharCode('A'.charCodeAt(0) + c - 1); // B, C, ... V
    const monthName = pivotSheet.getRow(1).getCell(c).value;
    let sum = 0;
    for (let r = 2; r <= numPivotRows; r++) {
      sum += (pivotSheet.getRow(r).getCell(c).value || 0);
    }
    monthData.push({ month: monthName, colName, sum });
  }

  const mTotalRowIdx = mTableStartRow + monthData.length;

  monthData.forEach((mItem, mIdx) => {
    const rIdx = currRow;
    const row = statSheet.getRow(rIdx);
    row.height = 20;

    // Col A: STT
    const cA = row.getCell(1);
    cA.value = mIdx + 1;
    cA.alignment = { vertical: 'middle', horizontal: 'center' };
    cA.font = { name: FONT_FAMILY, size: 9 };
    cA.border = thinBorder;

    // Col B: Tháng
    const cB = row.getCell(2);
    cB.value = mItem.month;
    cB.alignment = { vertical: 'middle', horizontal: 'center' };
    cB.font = { name: FONT_FAMILY, size: 9, bold: true };
    cB.border = thinBorder;

    // Col C: Tổng Pageview (Formula linking to Pageview theo tháng sheet)
    const cC = row.getCell(3);
    const pvFormula = `SUM('Pageview theo tháng'!${mItem.colName}$2:${mItem.colName}$${numPivotRows})`;
    cC.value = { formula: pvFormula, result: mItem.sum };
    cC.numFmt = '#,##0';
    cC.alignment = { vertical: 'middle', horizontal: 'right' };
    cC.font = { name: FONT_FAMILY, size: 9, bold: true };
    cC.border = thinBorder;

    // Col D: Tỉ lệ (%)
    const cD = row.getCell(4);
    cD.value = { formula: `C${rIdx}/C${mTotalRowIdx}`, result: mItem.sum / grandTotalPv };
    cD.numFmt = '0.00%';
    cD.alignment = { vertical: 'middle', horizontal: 'right' };
    cD.font = { name: FONT_FAMILY, size: 9 };
    cD.border = thinBorder;

    // Col E: Tăng trưởng MoM (%)
    const cE = row.getCell(5);
    if (mIdx === 0) {
      cE.value = '-';
      cE.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      const prevRowIdx = rIdx - 1;
      const momResult = (mItem.sum - monthData[mIdx - 1].sum) / monthData[mIdx - 1].sum;
      cE.value = { formula: `(C${rIdx}-C${prevRowIdx})/C${prevRowIdx}`, result: momResult };
      cE.numFmt = '+0.00%;-0.00%;0.00%';
      cE.alignment = { vertical: 'middle', horizontal: 'right' };
    }
    cE.font = { name: FONT_FAMILY, size: 9 };
    cE.border = thinBorder;

    // Col F: Nhận xét xu hướng
    const cF = row.getCell(6);
    let note = '';
    if (mItem.month === '2025-03') note = 'Đỉnh điểm pageview đầu năm 2025 (811k PV)';
    else if (mItem.month === '2025-05') note = 'Chung kết Cúp C1 & vòng cuối các giải VĐQG Châu Âu';
    else if (mItem.month === '2025-07') note = 'Giai đoạn thấp điểm mùa hè các giải bóng đá';
    else if (mItem.month === '2026-05') note = 'Đỉnh điểm pageview đầu năm 2026 (625k PV)';
    else if (mItem.month === '2026-06') note = 'VCK World Cup / Euro & các trận cầu tâm điểm hè 2026';
    cF.value = note;
    cF.alignment = { vertical: 'middle', horizontal: 'left' };
    cF.font = { name: FONT_FAMILY, size: 8.5, italic: true, color: { argb: 'FF666666' } };
    cF.border = thinBorder;

    if (mIdx % 2 === 1) {
      for (let col = 1; col <= 6; col++) {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    }

    currRow++;
  });

  // Total row for month data
  const mTotalRow = statSheet.getRow(currRow);
  mTotalRow.height = 24;
  mTotalRow.getCell(1).value = '';
  mTotalRow.getCell(2).value = 'TỔNG CỘNG 21 THÁNG';
  mTotalRow.getCell(3).value = { formula: `SUM(C${mTableStartRow}:C${currRow - 1})`, result: grandTotalPv };
  mTotalRow.getCell(3).numFmt = '#,##0';
  mTotalRow.getCell(4).value = { formula: `SUM(D${mTableStartRow}:D${currRow - 1})`, result: 1.0 };
  mTotalRow.getCell(4).numFmt = '0.00%';
  mTotalRow.getCell(5).value = '';
  mTotalRow.getCell(6).value = '';

  for (let c = 1; c <= 6; c++) {
    const cell = mTotalRow.getCell(c);
    cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: COLOR_PRIMARY } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_BLUE } };
    cell.border = totalBorder;
    if (c === 3 || c === 4) cell.alignment = { vertical: 'middle', horizontal: 'right' };
    else if (c === 1 || c === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }
  currRow += 2;

  // Adjust column widths nicely
  statSheet.getColumn(1).width = 10; // Hạng / STT
  statSheet.getColumn(2).width = 72; // URL
  statSheet.getColumn(3).width = 38; // Tên ngắn / Điều kiện
  statSheet.getColumn(4).width = 18; // Tổng Pageview
  statSheet.getColumn(5).width = 20; // Tỉ lệ trong lớp
  statSheet.getColumn(6).width = 22; // Tỉ lệ trên toàn site

  console.log('Writing back to workbook...');
  try {
    await workbook.xlsx.writeFile(filePath);
    console.log('SUCCESS: Written directly to data-dlbd.xlsx');
  } catch (err) {
    if (err.code === 'EBUSY') {
      const fallbackPath = path.resolve(__dirname, 'data-dlbd-thong-ke.xlsx');
      console.log('FILE LOCKED: data-dlbd.xlsx is currently open in Excel.');
      console.log('Saving to fallback path: ' + fallbackPath);
      await workbook.xlsx.writeFile(fallbackPath);
      console.log('SUCCESS: Written to data-dlbd-thong-ke.xlsx');
    } else {
      throw err;
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
