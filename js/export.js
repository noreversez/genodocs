'use strict';

const exporter = {

  // ──────────────────────────────────────────────────────────────────
  // ตัวช่วยสร้าง HTML เอกสารเต็มรูปแบบ (A4) จาก docBody ของ preview
  // ──────────────────────────────────────────────────────────────────
  _buildDocHtml(bodyInnerHtml, title = 'บันทึกประจำวัน') {
    // Map preview CSS classes → Word/print inline styles
    const html = bodyInnerHtml
      // pi3 = tab-indent paragraph
      .replace(/<p class="pi3">/g, '<p style="margin:0;padding:0 0 3pt 0;text-indent:2.5em;">')
      // pi2 = double-indent paragraph
      .replace(/<p class="pi2">/g, '<p style="margin:0;padding:0 0 3pt 0;text-indent:5em;">')
      // pi1 = single indent
      .replace(/<p class="pi1">/g, '<p style="margin:0;padding:0 0 3pt 0;text-indent:1.5em;">')
      // generic p
      .replace(/<p>/g, '<p style="margin:0;padding:0 0 3pt 0;">');

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'
      lang="th">
<head>
<meta charset="utf-8">
<title>${title}</title>
<!--[if gte mso 9]><xml><w:WordDocument>
  <w:View>Print</w:View>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument></xml><![endif]-->
<style>
  @page WordSection1 {
    size:21cm 29.7cm;
    margin:2.5cm 2.5cm 2.5cm 3cm;
    mso-header-margin:.5cm;
    mso-footer-margin:.5cm;
    mso-paper-source:0;
  }
  @page { size:A4; margin:2.5cm 2.5cm 2.5cm 3cm; }
  @media print { body { margin: 0; } .no-print { display:none; } }
  div.WordSection1 { page:WordSection1; }
  body {
    font-family:"TH SarabunPSK","TH Sarabun New","Sarabun",serif;
    font-size:16pt;
    line-height:1.8;
    color:#000;
    background:#fff;
  }
  p { margin:0; padding:0 0 3pt 0; }
  h1.doc-title {
    font-family:"TH SarabunPSK","TH Sarabun New","Sarabun",serif;
    text-align:center;
    font-size:18pt;
    font-weight:bold;
    margin:0 0 4pt 0;
  }
  hr.doc-line { border:none; border-top:1px solid #000; margin:0 0 12pt 0; }
  b, strong { font-weight:bold; }
  i, em { font-style:italic; }
  u { text-decoration:underline; }
  ul, ol { margin:0; padding-left:2em; }
  li { margin:0; padding:2pt 0; }
</style>
</head>
<body>
<div class="WordSection1">
  <h1 class="doc-title">${title}</h1>
  <hr class="doc-line">
  ${html}
</div>
</body>
</html>`;
  },

  // ──────────────────────────────────────────────────────────────────
  // Word (.doc) — ดึง HTML ตรงจาก preview แล้วส่งออก
  // ──────────────────────────────────────────────────────────────────
  async toWord(filename, _rawText) {
    const docBodyEl = document.getElementById('docBody');
    const bodyHtml  = docBodyEl ? docBodyEl.innerHTML : this._textToHtml(_rawText);
    const doc = this._buildDocHtml(bodyHtml);
    const blob = new Blob(['\ufeff', doc], { type: 'application/msword' });

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
       a.download = `${filename}.doc`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  },

  // ──────────────────────────────────────────────────────────────────
  // PDF (.pdf) — สร้างหน้า popup ที่มีรูปแบบครบแล้วสั่ง print-to-PDF
  // html2pdf fallback ถ้า library โหลดได้
  // ──────────────────────────────────────────────────────────────────
  toPDF(filename, _htmlElementId) {
    const docBodyEl = document.getElementById('docBody');
    const bodyHtml  = docBodyEl ? docBodyEl.innerHTML : '';

    // ── Try html2pdf first (better quality) ──
    if (typeof html2pdf !== 'undefined' && docBodyEl) {
      if (window.toast) toast('กำลังสร้างไฟล์ PDF...', 'success');

      // Build a clean container that mirrors preview-doc styling
      const container = document.createElement('div');
      container.style.cssText = `
        position:absolute; left:-9999px; top:0;
        width:794px; /* A4 at 96dpi */
        background:#fff; color:#000;
        font-family:"TH SarabunPSK","TH Sarabun New","Sarabun",serif;
        font-size:16pt; line-height:1.8;
        padding:60px 72px;
      `;

      const title = document.createElement('div');
      title.style.cssText = 'text-align:center;font-size:18pt;font-weight:bold;margin-bottom:4pt;';
      title.textContent = 'บันทึกประจำวัน';

      const line = document.createElement('hr');
      line.style.cssText = 'border:none;border-top:1px solid #000;margin:0 0 12pt 0;';

      // Body — translate CSS classes to inline styles for html2pdf
      const bodyDiv = document.createElement('div');
      bodyDiv.innerHTML = (docBodyEl.innerHTML || '')
        .replace(/<p class="pi3">/g, '<p style="margin:0;padding:0 0 4pt 0;text-indent:2.5em;">')
        .replace(/<p class="pi2">/g, '<p style="margin:0;padding:0 0 4pt 0;text-indent:5em;">')
        .replace(/<p class="pi1">/g, '<p style="margin:0;padding:0 0 4pt 0;text-indent:1.5em;">')
        .replace(/<p>/g,             '<p style="margin:0;padding:0 0 4pt 0;">');

      container.appendChild(title);
      container.appendChild(line);
      container.appendChild(bodyDiv);
      document.body.appendChild(container);

      const opt = {
        margin:       [10, 10, 10, 15],
        filename:     `${filename}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(container).save().then(() => {
        document.body.removeChild(container);
      }).catch(() => {
        document.body.removeChild(container);
        this._printToPDF(filename, bodyHtml);
      });
      return;
    }

    // ── Fallback: open print popup ──
    this._printToPDF(filename, bodyHtml);
  },

  // Print popup (both for print button and PDF fallback)
  _printToPDF(filename, bodyHtml) {
    const doc = this._buildDocHtml(bodyHtml);
    const w = window.open('', '_blank', 'width=860,height=700');
    if (!w) { alert('กรุณาอนุญาต popup แล้วลองใหม่'); return; }
    w.document.write(doc.replace('</body>', `
      <div class="no-print" style="text-align:center;padding:12px;border-top:1px solid #ccc;margin-top:16px;">
        <button onclick="window.print()" style="font-size:14pt;padding:8px 24px;cursor:pointer;margin:4px;background:#3b82f6;color:#fff;border:none;border-radius:6px;">🖨️ พิมพ์ / บันทึก PDF</button>
        <button onclick="window.close()" style="font-size:14pt;padding:8px 24px;cursor:pointer;margin:4px;background:#e5e7eb;border:none;border-radius:6px;">✕ ปิด</button>
      </div>
    </body>`));
    w.document.close();
    setTimeout(() => { try { w.print(); } catch(e) {} }, 400);
  },

  // ──────────────────────────────────────────────────────────────────
  // Print (ปุ่มพิมพ์)
  // ──────────────────────────────────────────────────────────────────
  print(_rawText) {
    const docBodyEl = document.getElementById('docBody');
    const bodyHtml  = docBodyEl ? docBodyEl.innerHTML : this._textToHtml(_rawText);
    this._printToPDF('ปจว', bodyHtml);
  },

  // ──────────────────────────────────────────────────────────────────
  // Copy plain text
  // ──────────────────────────────────────────────────────────────────
  copyText(rawText) {
    return navigator.clipboard.writeText(rawText);
  },

  // ──────────── Legacy helper (backward compat) ────────────
  _textToHtml(rawText) {
    if (!rawText) return '';
    return rawText.split('\n').map(line => {
      const esc = this._esc(line);
      if (line.startsWith('\t'))
        return `<p style="margin:0;padding:0 0 3pt 0;text-indent:2.5em;">${this._esc(line.slice(1))}</p>`;
      if (line.startsWith('        '))
        return `<p style="margin:0;padding:0 0 3pt 0;text-indent:5em;">${this._esc(line.trimStart())}</p>`;
      return `<p style="margin:0;padding:0 0 3pt 0;">${esc || '&nbsp;'}</p>`;
    }).join('\n');
  },

  _esc(s) {
    let e = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    e = e.replace(/^ +/g, m => '&nbsp;'.repeat(m.length));
    e = e.replace(/ {2,}/g, m => '&nbsp;'.repeat(m.length - 1) + ' ');
    return e;
  }
};
