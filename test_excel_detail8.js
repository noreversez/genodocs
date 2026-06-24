const XLSX = require('xlsx');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls';
const workbook = XLSX.readFile(filePath);
for (const sheetName of workbook.SheetNames) {
  if (sheetName === 'ก') continue;
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: false });
  for (let i = 0; i < data.length - 2; i++) {
    const row1 = data[i];
    const row2 = data[i+1];
    const row3 = data[i+2];
    if (!row1 || !row2 || !row3) continue;
    
    // Check if we have multiple consecutive rows of text that are NOT "เหตุ" or "ปจว.ข้อ"
    const isText = (r) => {
        if (!r || r.length === 0) return false;
        const str = r.find(c => typeof c === 'string' && c.trim().length > 10);
        if (!str) return false;
        if (str.includes('ปจว.ข้อ') || str.includes('เหตุ')) return false;
        return true;
    };
    
    if (isText(row1) && isText(row2) && isText(row3)) {
       console.log(`\n[${sheetName}] Found multi-line block starting at row ${i}:`);
       console.log(`Row ${i}:`, JSON.stringify(row1));
       console.log(`Row ${i+1}:`, JSON.stringify(row2));
       console.log(`Row ${i+2}:`, JSON.stringify(row3));
       break; // just show one example per sheet
    }
  }
}
