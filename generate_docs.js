const fs = require('fs');
const path = require('path');
const htmlDocx = require('html-docx-js');

function convertToHtml(text) {
  const lines = text.split('\n');
  let html = '<html><body>';
  for (const line of lines) {
    if (!line.trim()) {
      html += '<p><br/></p>';
    } else {
      let l = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (l.startsWith('\t')) {
        l = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + l.substring(1);
      }
      html += `<p style="font-family: 'TH Sarabun PSK', sans-serif; font-size: 16pt; margin: 0; padding: 0;">${l}</p>`;
    }
  }
  html += '</body></html>';
  return html;
}

(async () => {
    const templatesDir = path.join(__dirname, 'smartcard-agent', 'Templates');
    if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
    }

    const storageJs = fs.readFileSync(path.join(__dirname, 'js', 'storage.js'), 'utf8');
    const match = storageJs.match(/const DEFAULT_EXAMPLES = (\[[\s\S]*?\]);/);
    if (match) {
        const DEFAULT_EXAMPLES = eval(match[1]);
        
        for (const ex of DEFAULT_EXAMPLES) {
            const safeName = ex.name.replace(/[\/\\?%*:|"<>]/g, '-');
            const fileName = `${safeName}.docx`;
            const filePath = path.join(templatesDir, fileName);
            
            const html = convertToHtml(ex.content);
            // In Node, html-docx-js returns a Buffer
            const docxBuffer = htmlDocx.asBlob(html);
            
            if (Buffer.isBuffer(docxBuffer)) {
                fs.writeFileSync(filePath, docxBuffer);
            } else if (docxBuffer.arrayBuffer) {
                const buf = Buffer.from(await docxBuffer.arrayBuffer());
                fs.writeFileSync(filePath, buf);
            }
            console.log(`Generated: ${fileName}`);
        }
    } else {
        console.log("Could not parse DEFAULT_EXAMPLES");
    }
})();
