const XLSX = require('xlsx');

function parseTemplates(filePath, tagPrefix) {
    const workbook = XLSX.readFile(filePath);
    const templates = [];
    let idCounter = 1;

    for (const sheetName of workbook.SheetNames) {
        if (['ก', 'ข้อมูล', 'ข้อมูลฯ'].includes(sheetName) || sheetName.includes('พยาน') || sheetName.includes('ผู้ต้องหา') || sheetName.includes('ผู้กล่าวหา')) continue;
        
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: false });
        
        let currentTemplate = null;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            // Extract meaningful strings from the row
            const strings = row.filter(c => typeof c === 'string' && c.trim().length > 0).map(c => c.trim());
            if (strings.length === 0) continue;
            
            const firstStr = strings[0];
            
            // Detect start of a new section
            if (firstStr === 'เหตุ' || firstStr === 'ปจว.ข้อ' || firstStr === 'อ้างเลขคดี' || firstStr === 'ทั่วไป') {
                if (currentTemplate && currentTemplate.lines.length > 0) {
                    templates.push(currentTemplate);
                }
                
                let title = sheetName;
                if (firstStr === 'เหตุ' && strings.length > 1) {
                    title = strings[1];
                } else if (firstStr !== 'ปจว.ข้อ' && firstStr !== 'เหตุ') {
                    title = firstStr;
                }
                
                currentTemplate = {
                    title: title,
                    sheet: sheetName,
                    lines: []
                };
            } else {
                // It's a content line
                if (!currentTemplate) {
                    currentTemplate = { title: sheetName, sheet: sheetName, lines: [] };
                }
                // Join cells with space, then convert 4+ spaces to newlines
                let lineStr = strings.join(' ');
                lineStr = lineStr.replace(/ {4,}/g, '\n');
                currentTemplate.lines.push(lineStr);
            }
        }
        
        if (currentTemplate && currentTemplate.lines.length > 0) {
            templates.push(currentTemplate);
        }
    }
    
    // Filter and format
    const validTemplates = [];
    for (const t of templates) {
        const content = t.lines.join('\n').trim();
        // Skip if too short or just headers
        if (content.length < 20) continue;
        
        validTemplates.push({
            id: 'ex_test_' + idCounter++,
            name: t.title,
            tag: tagPrefix + ' / ' + t.sheet,
            content: content
        });
    }
    return validTemplates;
}

const templates1 = parseTemplates('C:\\Users\\NB\\OneDrive\\Desktop\\ฝึกงานบางซื่อ\\1พ.ต.ท.สุภัทร เหมจินดา68-1-1\\3ประจำวัน67-12-12\\1ปจว.คดีอาญาฯ.xls', 'อาญา');
console.log('Criminal:', templates1.length);
console.log('Sample Criminal:');
if (templates1.length > 0) console.log(templates1[1]);

