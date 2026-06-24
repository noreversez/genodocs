const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');

const regexToggleStar = /function toggleStar\([\s\S]*?\}\s*function renderExamples\(/;
appJs = appJs.replace(regexToggleStar, `async function toggleStar(id) {
  const infoStr = localStorage.getItem('agentExamplesInfo') || '{}';
  const info = JSON.parse(infoStr);
  if (!info[id]) info[id] = {};
  info[id].starred = !info[id].starred;
  localStorage.setItem('agentExamplesInfo', JSON.stringify(info));
  const q = document.getElementById('exSearch') ? document.getElementById('exSearch').value : '';
  renderExamples(q);
}

async function renderExamples(`);

const regexRenderEx = /function renderExamples[\s\S]*?if \(window\.lucide\) lucide\.createIcons\(\);\n\}/;
appJs = appJs.replace(regexRenderEx, `async function renderExamples(q = '') {
  const el = document.getElementById('page-examples');
  
  if (!state.agentTemplates) {
    try {
      const res = await fetch('http://localhost:8080/templates');
      if (res.ok) state.agentTemplates = await res.json();
      else state.agentTemplates = [];
    } catch(e) {
      el.innerHTML = \`<div class="empty-state"><h3>ไม่สามารถเชื่อมต่อ Agent ได้</h3><p>กรุณารันไฟล์ Start_App.bat หรือ run_agent.bat</p></div>\`;
      return;
    }
  }

  const infoStr = localStorage.getItem('agentExamplesInfo') || '{}';
  const info = JSON.parse(infoStr);

  let examples = state.agentTemplates.map(f => {
      return {
        id: f,
        name: f.replace(/\\.(docx|txt|doc)$/i, ''),
        starred: info[f]?.starred || false
      };
  });

  if (q) examples = examples.filter(ex => ex.name.toLowerCase().includes(q.toLowerCase()));

  const starred = examples.filter(ex => ex.starred);
  const unstarred = examples.filter(ex => !ex.starred);

  el.innerHTML = \`
    <div class="page-header">
      <div>
        <h1 class="page-title">คลังแม่แบบคดี (เปิดจากไฟล์ในเครื่อง)</h1>
        <p class="page-sub">บันทึกเป็นไฟล์ Word (.docx) และแก้หน้าตาได้อิสระ</p>
      </div>
      <button class="btn btn-primary" onclick="openTemplatesFolder()">📂 เปิดโฟลเดอร์แม่แบบ</button>
      <button class="btn btn-ghost" onclick="state.agentTemplates = null; renderExamples();" title="รีเฟรช">🔄</button>
    </div>

    <div class="search-bar" style="margin-bottom:20px">
      <input id="exSearch" type="text" class="fld-input" value="\${esc(q)}"
        placeholder="ค้นหาชื่อไฟล์แม่แบบ..."
        oninput="renderExamples(this.value)">
    </div>

    \${starred.length > 0 ? \`
      <div style="margin-bottom:24px;">
        <h3 style="margin: 0 0 12px 4px; font-size: 15px; color: #eab308; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="star" style="width:16px;height:16px;fill:currentColor"></i> ⭐ รายการโปรด
        </h3>
        <div style="display:flex;flex-direction:column;gap:0;">
          \${starred.map(ex => exampleCard(ex)).join('')}
        </div>
      </div>
    \` : ''}

    \${unstarred.length > 0 ? \`
      <div style="margin-bottom:24px;">
        <h3 style="margin: 0 0 12px 4px; font-size: 15px; color: var(--primary); display: flex; align-items: center; gap: 6px;">
          <i data-lucide="folder" style="width:16px;height:16px;"></i> ไฟล์ทั้งหมดในระบบ
        </h3>
        <div style="display:flex;flex-direction:column;gap:0;">
          \${unstarred.map(ex => exampleCard(ex)).join('')}
        </div>
      </div>
    \` : (starred.length === 0 ? \`
      <div style="margin-top:24px">
        <label class="upload-zone" onclick="openTemplatesFolder()">
          <div class="upload-zone-icon">📂</div>
          <div class="upload-zone-text">คลิกเพื่อเปิดโฟลเดอร์</div>
          <div class="upload-zone-sub">จากนั้น ลากไฟล์ Word หรือคลิกขวา > New > Microsoft Word Document</div>
        </label>
        <div class="empty-state">
          <h3>\${q ? 'ไม่พบไฟล์ที่ค้นหา' : 'ยังไม่มีไฟล์แม่แบบ'}</h3>
        </div>
      </div>
    \` : '')}
  \`;
  if (window.lucide) lucide.createIcons();
}`);

const regexExCard = /function exampleCard[\s\S]*?\}\s*function useExample/;
appJs = appJs.replace(regexExCard, `function exampleCard(ex) {
  const starIcon = ex.starred 
    ? '<i data-lucide="star" style="width:18px;height:18px;fill:#eab308;color:#eab308"></i>' 
    : '<i data-lucide="star" style="width:18px;height:18px;color:#9ca3af"></i>';

  return \`
    <div class="example-card">
      <div class="example-icon">📄</div>
      <div class="example-info">
        <div class="example-name">\${escHtml(ex.id)}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0" onclick="event.stopPropagation()">
        <button class="btn btn-sm btn-ghost" title="ติดดาว/เลิกติดดาว" onclick="toggleStar('\${ex.id}')" style="padding:4px;">\${starIcon}</button>
        <button class="btn btn-sm btn-ghost" onclick="editWordFile('\${ex.id}')">เปิดแก้ใน Word</button>
        <button class="btn btn-sm btn-primary" onclick="useWordFile('\${ex.id}')">ใช้งาน</button>
      </div>
    </div>
  \`;
}

async function openTemplatesFolder() {
   try {
       await fetch('http://localhost:8080/templates/openFolder', {method: 'POST'});
       toast('เปิดโฟลเดอร์เรียบร้อยแล้ว', 'info');
   } catch(e) {
       toast('ไม่สามารถเปิดโฟลเดอร์ได้', 'error');
   }
}

async function editWordFile(id) {
   try {
       toast('กำลังเปิดไฟล์ด้วย Microsoft Word...', 'info');
       await fetch('http://localhost:8080/templates/open?name=' + encodeURIComponent(id), {method: 'POST'});
   } catch(e) {
       toast('ไม่สามารถเปิดไฟล์ได้', 'error');
   }
}

async function useWordFile(id) {
   try {
       toast('กำลังดึงข้อมูลแม่แบบ...', 'info');
       const res = await fetch('http://localhost:8080/templates/read?name=' + encodeURIComponent(id));
       const data = await res.json();
       
       if (id.toLowerCase().endsWith('.txt')) {
           const text = atob(data.base64);
           openUseExampleModal({ id, name: id, content: text });
       } else if (id.toLowerCase().endsWith('.docx')) {
           if (typeof mammoth === 'undefined') {
               toast('ไม่พบ mammoth.js สำหรับถอดรหัส Word', 'error');
               return;
           }
           const binaryString = atob(data.base64);
           const len = binaryString.length;
           const bytes = new Uint8Array(len);
           for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
           
           mammoth.extractRawText({ arrayBuffer: bytes.buffer })
               .then(result => {
                   openUseExampleModal({ id, name: id, content: result.value });
               })
               .catch(e => {
                   console.error(e);
                   toast('ไม่สามารถอ่านเนื้อหา Word ได้', 'error');
               });
       } else {
           toast('รองรับเฉพาะไฟล์ .txt และ .docx', 'warning');
       }
   } catch(e) {
       toast('ไม่สามารถอ่านไฟล์ได้', 'error');
   }
}

function useExample`);

fs.writeFileSync('js/app.js', appJs, 'utf8');
