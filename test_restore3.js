const fs = require('fs');

// Read the corrupted UTF8 string
const text = fs.readFileSync('js/app.js', 'utf8');

// The corrupted string has characters like 'à' (U+00E0) and '¸' (U+00B8).
// We want to extract their codepoints and treat them as bytes.
// Wait, PowerShell might have mapped some bytes to Windows-1252 characters 
// that have different Unicode codepoints (like Euro sign etc).
const iconv = require('iconv-lite');
try {
  // We encode the string to win1252 to get back the raw bytes!
  const rawBytes = iconv.encode(text, 'win1252');
  
  // Then decode those raw bytes as utf8!
  const restoredText = iconv.decode(rawBytes, 'utf8');
  
  // Let's check if it worked on the lines
  const lines = restoredText.split('\n');
  let successCount = 0;
  lines.forEach((l,i) => {
     if(l.includes('page-title') && /[ก-๙]/.test(l)) {
         console.log(i + ': ' + l.trim());
         successCount++;
     }
  });
  if (successCount > 0) {
      fs.writeFileSync('js/app.js.fixed', restoredText, 'utf8');
      console.log('Successfully saved app.js.fixed!');
  } else {
      console.log('Failed to restore Thai text.');
  }
} catch (e) {
  console.log(e);
}
