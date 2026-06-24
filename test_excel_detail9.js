const XLSX = require('xlsx');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['ถอนคำร้องทุกข์ ฯ'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
for (let i = 0; i < 20; i++) {
  console.log(`Row ${i}:`, JSON.stringify(data[i]));
}
