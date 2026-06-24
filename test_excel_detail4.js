const XLSX = require('xlsx');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls';
const workbook = XLSX.readFile(filePath);
const sheetName = 'ปจว.Wไทยสารบรรณ9';
if (workbook.Sheets[sheetName]) {
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: false });
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i].filter(c => c !== undefined && c !== null && c !== '');
    if(row.length > 0) {
      console.log(`Row ${i}:`, JSON.stringify(row));
    }
  }
} else {
  console.log("Sheet not found");
}
