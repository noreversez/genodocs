const fs = require('fs');
let exportJs = fs.readFileSync('js/export.js', 'utf8');

const regexToWord = /toWord\(filename, _rawText\) \{[\s\S]*?URL\.revokeObjectURL\(url\), 1500\);\n  \},/;
exportJs = exportJs.replace(regexToWord, `async toWord(filename, _rawText) {
    const docBodyEl = document.getElementById('docBody');
    const bodyHtml  = docBodyEl ? docBodyEl.innerHTML : this._textToHtml(_rawText);
    const doc = this._buildDocHtml(bodyHtml);
    const blob = new Blob(['\\ufeff', doc], { type: 'application/msword' });

    try {
       const res = await fetch('http://localhost:8080/export?name=' + encodeURIComponent(filename + '.doc'), {
           method: 'POST',
           body: blob
       });
       if (!res.ok) throw new Error('Agent failed');
       // Don't toast here since agent might open explorer
    } catch(e) {
       console.error("Agent export failed, falling back to browser download:", e);
       const url  = URL.createObjectURL(blob);
       const a    = document.createElement('a');
       a.href     = url;
       a.download = \`\${filename}.doc\`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  },`);

fs.writeFileSync('js/export.js', exportJs, 'utf8');
