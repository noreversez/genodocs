const fs = require('fs');
const text = fs.readFileSync('js/app.js', 'utf8');
const iconv = require('iconv-lite');

try {
  const buf = iconv.encode(text, 'win874');
  const restored = iconv.decode(buf, 'utf8');
  console.log("Restored win874:");
  const lines = restored.split('\n');
  lines.forEach((l, i) => {
     if(l.includes('page-title')) console.log(i + ': ' + l.trim());
  });
} catch(e) {
  console.log("Error win874:", e.message);
}
