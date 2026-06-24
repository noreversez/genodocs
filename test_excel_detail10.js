const XLSX = require('xlsx');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['เปรียบเทียบปรับ'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
const text = data[2].find(c => typeof c === 'string');
console.log("Has newline '\\n'?", text.includes('\n'));
console.log("Has carriage return '\\r'?", text.includes('\r'));
console.log("Has multiple spaces?", text.includes('      '));
