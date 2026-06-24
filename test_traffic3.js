const XLSX = require('xlsx');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\2ปจว.คดีจราจร.xls';
const workbook = XLSX.readFile(filePath);

for (const sheetName of workbook.SheetNames) {
  if (['ก', 'ข้อมูล', 'ข้อมูลฯ'].includes(sheetName)) continue;
  
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: false });
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    for (const cell of row) {
      if (typeof cell === 'string' && cell.trim().length > 60) {
        console.log([] Length:  | Content: );
      }
    }
  }
}
