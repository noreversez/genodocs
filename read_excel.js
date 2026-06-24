const XLSX = require('xlsx');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls';
try {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log('Sheets:', sheetNames);
  for (const sheetName of sheetNames) {
    console.log('\n--- Sheet:', sheetName, '---');
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
    for (let i = 0; i < Math.min(30, data.length); i++) {
      // filtering out empty cells
      const row = data[i].filter(c => c !== undefined && c !== null && c !== '');
      if (row.length > 0) console.log('Row', i, ':', JSON.stringify(row));
    }
  }
} catch(e) { console.error(e.message); }
