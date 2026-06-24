const fs = require('fs');
let txt = fs.readFileSync('index.html', 'utf8');

try {
    const buf = Buffer.from(txt, 'latin1');
    const decoded = buf.toString('utf8');
    if (decoded.includes('ผู้ช่วยจีโน่')) {
        fs.writeFileSync('index.html', decoded, 'utf8');
        console.log("Fixed successfully!");
    } else {
        console.log("Failed to fix: Pattern not found.");
    }
} catch (e) {
    console.log(e);
}
