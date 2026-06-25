import codecs

with codecs.open('js/app.js', 'r', 'utf-8') as f:
    content = f.read()

idx = content.find('async function exportAllToAgent()')
if idx != -1:
    content = content[:idx]

new_code = '''
function convertToHtml(text) {
  const lines = text.split('\\n');
  let html = '<html><body>';
  for (const line of lines) {
    if (!line.trim()) {
      html += '<p><br/></p>';
    } else {
      let l = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (l.startsWith('\\t')) {
        l = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + l.substring(1);
      }
      html += <p style=\"font-family: 'TH Sarabun PSK', sans-serif; font-size: 16pt; margin: 0; padding: 0;\"></p>;
    }
  }
  html += '</body></html>';
  return html;
}

async function exportAllToAgent() {
  if (typeof JSZip === 'undefined' || typeof htmlDocx === 'undefined') {
      toast('ระบบกำลังโหลดไลบรารี โปรดรอสักครู่แล้วลองใหม่', 'warning');
      return;
  }

  const examples = storage.getExamples();
  toast('กำลังเตรียมไฟล์แม่แบบทั้งหมด ' + examples.length + ' ไฟล์...', 'info');
  
  const zip = new JSZip();
  let count = 0;

  for (const ex of examples) {
    const safeName = ex.name.replace(/[\/\\\\?%*:|\"<>]/g, '-');
    const html = convertToHtml(ex.content);
    const docxBlob = htmlDocx.asBlob(html);
    zip.file(safeName + '.docx', docxBlob);
    count++;
  }

  zip.generateAsync({type:\"blob\"}).then(function(content) {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = \"Templates_All.zip\";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast(ดาวน์โหลดสำเร็จ  ไฟล์ (อยู่ในไฟล์ Templates_All.zip));
      }, 100);
  });
}
'''

with codecs.open('js/app.js', 'w', 'utf-8-sig') as f:
    f.write(content + new_code)

print("DONE")
