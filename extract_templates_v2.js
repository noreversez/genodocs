const XLSX = require('xlsx');
const fs = require('fs');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls';
const workbook = XLSX.readFile(filePath);

const templates = [];
let idCounter = 1;

for (const sheetName of workbook.SheetNames) {
  if (['ก', 'ข้อมูล', 'ข้อมูลฯ'].includes(sheetName) || sheetName.includes('พยาน') || sheetName.includes('ผู้ต้องหา') || sheetName.includes('ผู้กล่าวหา')) continue;
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    let content = null;
    for (const cell of row) {
      if (typeof cell === 'string' && cell.trim().length > 120) {
        content = cell.trim();
        break;
      }
    }
    
    if (content) {
      let title = '';
      if (i > 0 && data[i-1]) {
         const prevRowStr = data[i-1].filter(c => typeof c === 'string').join(' ').trim();
         if (prevRowStr.length > 0 && prevRowStr.length < 100 && !prevRowStr.includes('ปจว.ข้อ') && !prevRowStr.includes('เวลา')) {
            title = prevRowStr;
         }
      }
      
      if (!title && i > 1 && data[i-2]) {
         const prev2RowStr = data[i-2].filter(c => typeof c === 'string').join(' ').trim();
         if (prev2RowStr.length > 0 && prev2RowStr.length < 100 && !prev2RowStr.includes('ปจว.ข้อ') && !prev2RowStr.includes('เวลา')) {
            title = prev2RowStr;
         }
      }

      if (!title) title = sheetName + ' (แบบที่ ' + idCounter + ')';
      
      title = title.replace(/฿/g, ''); // Remove weird characters
      
      templates.push({
        id: 'ex_imported_v2_' + idCounter++,
        name: title.trim(),
        tag: sheetName.replace(/\(\d+\)/g, '').replace(/ฯ/g, '').trim(),
        content: content
      });
    }
  }
}

console.log('Extracted ' + templates.length + ' COMPLETE templates.');
for(let i=0; i<Math.min(5, templates.length); i++) {
   console.log('Title:', templates[i].name);
   console.log('Tag:', templates[i].tag);
   console.log('Content snippet:', templates[i].content.substring(0, 100) + '...');
   console.log('---');
}

const jsContent = 'const IMPORTED_EXAMPLES = ' + JSON.stringify(templates, null, 2) + ';';
fs.writeFileSync('C:\\Users\\NB\\.gemini\\antigravity\\scratch\\police-daily-log\\js\\imported_templates.js', jsContent, 'utf8');
