const XLSX = require('xlsx');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['ร้องทุกข์มอบคดี (2)'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
console.log("Row 6:", data[6]);
