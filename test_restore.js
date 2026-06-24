const fs = require('fs');
const text = fs.readFileSync('js/app.js', 'utf8');

// The file was written as UTF8 by PowerShell.
// This means PowerShell took some characters (which it thought were Windows-1252), and encoded them to UTF8.
// We can turn the UTF8 string back into a Buffer of Windows-1252 bytes.
const iconv = require('iconv-lite');

try {
  // Convert the javascript string (which is corrupted UTF16) into Windows-874 or Windows-1252 bytes?
  // PowerShell on Thai Windows probably uses Windows-874 (TIS-620) as the default ANSI codepage!
  // Let's try converting it to bytes using windows-874
  const buf = iconv.encode(text, 'win874');
  
  // Now read those bytes as UTF-8!
  const restored = iconv.decode(buf, 'utf8');
  
  console.log("Restored sample:", restored.substring(1000, 1500));
} catch(e) {
  console.log("Error win874:", e.message);
}

try {
  const buf2 = iconv.encode(text, 'win1252');
  const restored2 = iconv.decode(buf2, 'utf8');
  console.log("Restored sample win1252:", restored2.substring(1000, 1500));
} catch(e) {
  console.log("Error win1252:", e.message);
}
