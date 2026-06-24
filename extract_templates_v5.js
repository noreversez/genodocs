const XLSX = require('xlsx');
const fs = require('fs');

const filePaths = [
  { path: 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls', tagPrefix: 'อาญา', minLen: 80 },
  { path: 'C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\2ปจว.คดีจราจร.xls', tagPrefix: 'จราจร', minLen: 50 }
];

const templates = [];
let idCounter = 1;

for (const fp of filePaths) {
  if (!fs.existsSync(fp.path)) continue;
  const workbook = XLSX.readFile(fp.path);

  for (const sheetName of workbook.SheetNames) {
    if (['ก', 'ข้อมูล', 'ข้อมูลฯ'].includes(sheetName) || sheetName.includes('พยาน') || sheetName.includes('ผู้ต้องหา') || sheetName.includes('ผู้กล่าวหา')) continue;
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      let content = null;
      for (const cell of row) {
        if (typeof cell === 'string' && cell.trim().length >= fp.minLen) {
          content = cell.trim();
          break;
        }
      }
      
      if (content) {
        // filter out garbage
        if (content.split(' ').every(w => w.length < 5) && content.length > 200) continue; 
        
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
        title = title.replace(/฿/g, '').trim(); 
        if (title.length < 3) title = sheetName + ' - ' + title;

        let tag = sheetName.replace(/\(\d+\)/g, '').replace(/ฯ/g, '').trim();
        tag = fp.tagPrefix + ' / ' + tag;

        // Convert multiple spaces to newlines
        let formattedContent = content.replace(/ {4,}/g, '\n').trim();

        // Also check if the row below contains supplementary text (like signature lines)
        if (i + 1 < data.length && data[i+1]) {
           let nextRowStr = data[i+1].filter(c => typeof c === 'string' && c.length > 5 && !c.includes('ปจว.ข้อ')).join('\n').trim();
           if (nextRowStr.length > 0 && nextRowStr.length < 100 && !nextRowStr.includes('เหตุ')) {
              formattedContent += '\n\n' + nextRowStr.replace(/ {4,}/g, '\n');
              // skip next row in next iteration
              i++;
           }
        }

        templates.push({
          id: 'ex_imported_v5_' + idCounter++,
          name: title,
          tag: tag,
          content: formattedContent
        });
      }
    }
  }
}

const jsContent = 'const IMPORTED_EXAMPLES = ' + JSON.stringify(templates, null, 2) + ';';
fs.writeFileSync('C:\\Users\\NB\\.gemini\\antigravity\\scratch\\police-daily-log\\js\\imported_templates.js', jsContent, 'utf8');
console.log('Extracted ' + templates.length + ' COMPLETE templates.');
