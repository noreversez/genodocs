const XLSX = require('xlsx');
const fs = require('fs');
const filePath = 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls';
const workbook = XLSX.readFile(filePath);

const templates = [];
let idCounter = 100;

for (const sheetName of workbook.SheetNames) {
  // skip informational sheets
  if (sheetName === 'ก' || sheetName.includes('พยาน') || sheetName.includes('ผู้ต้องหา') || sheetName.includes('ข้อมูล')) continue;
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    // Find a long text cell
    let content = null;
    for (const cell of row) {
      if (typeof cell === 'string' && cell.trim().length > 70) {
        content = cell.trim();
        break;
      }
    }
    
    if (content) {
      // Try to find a title from previous rows
      let title = '';
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        const prevRow = data[j];
        if (!prevRow) continue;
        const potentialTitles = prevRow.filter(c => typeof c === 'string' && c.trim().length > 0 && c.trim().length < 50);
        if (potentialTitles.length > 0) {
           title = potentialTitles[0].trim();
           // if it's "เหตุ" or "ปจว.ข้อ", skip or look further
           if (title === 'เหตุ' && potentialTitles.length > 1) {
             title = potentialTitles[1].trim();
           }
           if (title !== 'ปจว.ข้อ' && title !== 'เหตุ') {
             break;
           } else {
             title = '';
           }
        }
      }
      
      if (!title) title = sheetName + ' (' + idCounter + ')';
      
      templates.push({
        id: 'ex_imported_' + idCounter++,
        name: title,
        tag: sheetName,
        content: content
      });
    }
  }
}

const jsContent = 'const IMPORTED_EXAMPLES = ' + JSON.stringify(templates, null, 2) + ';';
fs.writeFileSync('C:\\Users\\NB\\.gemini\\antigravity\\scratch\\police-daily-log\\js\\imported_templates.js', jsContent, 'utf8');
console.log('Extracted ' + templates.length + ' templates.');
