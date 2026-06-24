const fs = require('fs');
const iconv = require('iconv-lite');
let txt = fs.readFileSync('index.html', 'utf8');

try {
    // txt is a string where each char represents a Windows-874 decoded character
    // We need to encode it back to Windows-874 bytes to recover the original UTF-8 bytes
    const buf = iconv.encode(txt, 'win874');
    const decoded = buf.toString('utf8');
    
    if (decoded.includes('ผู้ช่วยจีโน่')) {
        fs.writeFileSync('index.html', decoded, 'utf8');
        console.log("Fixed successfully with win874!");
    } else {
        // Try cp1252
        const buf2 = iconv.encode(txt, 'win1252');
        const decoded2 = buf2.toString('utf8');
        if (decoded2.includes('ผู้ช่วยจีโน่')) {
            fs.writeFileSync('index.html', decoded2, 'utf8');
            console.log("Fixed successfully with win1252!");
        } else {
            console.log("Failed to fix: Pattern not found.");
        }
    }
} catch (e) {
    console.log(e);
}
