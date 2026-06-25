'use strict';

// ════════════════════════════════════════════
//  APP STATE
// ════════════════════════════════════════════
const state = {
  page:         'dashboard',
  selectedType: null,
  formData:     {},
  editingId:    null,
  liveText:     '',
};

// ════════════════════════════════════════════
//  UX & UI HELPERS
// ════════════════════════════════════════════
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('sw_dark_mode', isDark ? '1' : '0');
  const icon = document.querySelector('#themeToggle i');
  if (icon && window.lucide) {
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastEl = document.createElement('div');
  toastEl.className = `toast toast-${type}`;
  
  const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
  
  toastEl.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toastEl);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toastEl.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toastEl.remove(), 300);
  }, 3000);
}

// Override basic toast if needed elsewhere
window.toast = (msg) => showToast(msg, 'success');

// ════════════════════════════════════════════
//  SPEECH TO TEXT
// ════════════════════════════════════════════
let activeRecognition = null;

function toggleSpeechToText(inputId, btnId) {
  if (activeRecognition) {
    activeRecognition.stop();
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('เบราว์เซอร์ไม่รองรับ แนะนำให้ใช้ Google Chrome หรือ Edge', 'error');
    return;
  }
  
  const recognition = new SpeechRecognition();
  recognition.lang = 'th-TH';
  recognition.continuous = true;
  recognition.interimResults = false;
  
  const inputEl = document.getElementById(inputId);
  const btnEl = document.getElementById(btnId);
  const originalHtml = btnEl.innerHTML;
  
  recognition.onstart = () => {
    activeRecognition = recognition;
    btnEl.innerHTML = `<i data-lucide="mic" class="spin" style="width:16px;height:16px;"></i> กำลังฟัง... (คลิกหยุด)`;
    btnEl.style.color = '#ef4444';
    btnEl.style.background = '#fee2e2';
    if (window.lucide) lucide.createIcons();
  };
  
  recognition.onresult = (event) => {
    let newFinal = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) newFinal += event.results[i][0].transcript;
    }
    if (newFinal) {
      const currentVal = inputEl.value;
      inputEl.value = currentVal + (currentVal && !currentVal.endsWith(' ') && !currentVal.endsWith('\n') ? ' ' : '') + newFinal;
      onFieldChange(inputId, inputEl.value);
    }
  };
  
  recognition.onerror = (event) => {
    if (event.error !== 'no-speech') showToast('ระบบรับเสียงผิดพลาด: ' + event.error, 'error');
  };
  
  recognition.onend = () => {
    activeRecognition = null;
    btnEl.innerHTML = originalHtml;
    btnEl.style.background = 'transparent';
    if (window.lucide) lucide.createIcons();
  };
  
  recognition.start();
}

function exportHistoryCSV() {
  const entries = storage.search(document.getElementById('sInput')?.value || '', document.getElementById('sType')?.value || '');
  if (!entries.length) {
    showToast('ไม่มีข้อมูลให้ดาวน์โหลด', 'error');
    return;
  }
  exporter.toCSV(`สรุปประวัติบันทึก_${dateSuffix()}`, entries);
}

async function validateCurrentWithAI() {
  const apiKey = storage.getSettings().geminiApiKey;
  if (!apiKey) {
    showToast('กรุณาตั้งค่า Gemini API Key ก่อนใช้งาน AI', 'error');
    return;
  }
  
  const text = state.liveText;
  if (!text) return;
  
  const originalHtml = document.getElementById('docBody').innerHTML;
  document.getElementById('docBody').innerHTML = `<div style="text-align:center; margin-top:40px; color:#a855f7;"><i data-lucide="loader-2" class="spin" style="width:32px;height:32px;"></i><p style="margin-top:12px;">AI กำลังตรวจสอบความถูกต้อง...</p></div>`;
  if (window.lucide) lucide.createIcons();
  
  try {
    const report = await AI.validateLog(text, apiKey);
    
    const m = document.createElement('div');
    m.id = 'entryModal';
    m.className = 'modal-overlay';
    m.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <div class="modal-hdr">
          <h3 style="display:flex;align-items:center;gap:6px;color:#a855f7;"><i data-lucide="check-circle"></i> ผลตรวจทานโดย AI</h3>
          <button class="btn btn-sm btn-ghost" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="font-size:14.5px; line-height:1.6; color:#374151;">
          ${report.replace(/\n/g, '<br>')}
        </div>
        <div class="modal-ftr">
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">รับทราบ</button>
        </div>
      </div>
    `;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    showToast('ข้อผิดพลาด: ' + err.message, 'error');
  } finally {
    document.getElementById('docBody').innerHTML = originalHtml;
  }
}

async function refineToneCurrent() {
  const apiKey = storage.getSettings().geminiApiKey;
  if (!apiKey) {
    showToast('กรุณาตั้งค่า Gemini API Key ก่อนใช้งาน AI', 'error');
    return;
  }
  
  // Refine text from customContent or rawContent if present, else warn.
  const targetId = state.formData.customContent !== undefined ? 'customContent' : (state.formData.rawContent !== undefined ? 'rawContent' : null);
  if (!targetId) {
    showToast('แม่แบบปัจจุบันไม่รองรับการเกลาภาษา (ต้องใช้กล่องข้อความอิสระ)', 'error');
    return;
  }

  const text = state.formData[targetId];
  if (!text) {
    showToast('ไม่มีข้อความให้เกลาภาษา', 'error');
    return;
  }

  const btn = document.getElementById('btnRefineTone');
  if (btn) {
    btn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> กำลังเกลา...`;
    btn.disabled = true;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const refinedText = await AI.refineTone(text, apiKey);
    
    // Show modal to confirm
    const m = document.createElement('div');
    m.id = 'refineModal';
    m.className = 'modal-overlay';
    m.innerHTML = `
      <div class="modal" style="max-width:600px;">
        <div class="modal-hdr">
          <h3 style="display:flex;align-items:center;gap:6px;color:#f59e0b;"><i data-lucide="sparkles"></i> ตรวจสอบข้อความที่เกลาแล้ว</h3>
          <button class="btn btn-sm btn-ghost" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="font-size:14.5px; line-height:1.6; color:#374151;">
          <textarea id="refinedResult" class="fld-input fld-ta" rows="10">${escHtml(refinedText)}</textarea>
        </div>
        <div class="modal-ftr">
          <button class="btn btn-primary" id="btnApplyRefine">นำไปใช้</button>
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">ยกเลิก</button>
        </div>
      </div>
    `;
    m.querySelector('#btnApplyRefine').onclick = () => {
      const finalVal = m.querySelector('#refinedResult').value;
      onFieldChange(targetId, finalVal);
      const el = document.getElementById(targetId);
      if (el) el.value = finalVal;
      m.remove();
      showToast('นำข้อความไปใช้แล้ว', 'success');
    };
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    if (window.lucide) lucide.createIcons();

  } catch (err) {
    showToast('ข้อผิดพลาด: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.innerHTML = `<i data-lucide="sparkles" style="width:14px;height:14px;"></i> เกลาภาษา`;
      btn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('sw_dark_mode') === '1') {
    document.body.classList.add('dark');
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.setAttribute('data-lucide', 'sun');
  }
  initNav();
  navigate('dashboard');
  
  setTimeout(() => checkDraftOnLoad(), 500);
});

function checkDraftOnLoad() {
  const draft = storage.getDraft();
  if (draft && draft.type && Object.keys(draft.formData || {}).length > 0) {
    if (confirm('ระบบพบข้อมูลที่ยังบันทึกไม่เสร็จค้างอยู่ คุณต้องการกู้คืนข้อมูลเดิมหรือไม่?')) {
      state.selectedType = draft.type;
      state.formData = draft.formData;
      navigate('new');
      showToast('กู้คืนข้อมูลสำเร็จ');
    } else {
      storage.clearDraft();
    }
  }
}

// ════════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════════
function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      if (item.dataset.page === 'new') {
        const draft = storage.getDraft();
        const hasDraft = draft && draft.type && Object.keys(draft.formData || {}).length > 0;
        if (hasDraft && !confirm('คุณมีข้อมูลที่ยังพิมพ์ค้างอยู่ ต้องการยกเลิกและเริ่มใหม่หรือไม่?')) return;
        storage.clearDraft();
        state.selectedType = null;
        state.formData     = {};
        state.editingId    = null;
      }
      navigate(item.dataset.page);
    });
  });
}

function navigate(page) {
  state.page = page;
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.page === page)
  );
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${page}`).classList.remove('hidden');

  switch (page) {
    case 'dashboard':  renderDashboard();    break;
    case 'new':
      if (state.selectedType) renderForm();
      else                    renderTypeSelector();
      break;
    case 'assistant': renderAssistant();   break;
    case 'history':   renderHistory();     break;
    case 'examples':  renderExamples();    break;
    case 'settings':  renderSettings();    break;
  }
}

// ════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════
function renderDashboard() {
  const el     = document.getElementById('page-dashboard');
  const today  = storage.countToday();
  const month  = storage.countMonth();
  const total  = storage.count();
  const recent = storage.getAll().slice(0, 6);

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">หน้าแรก</h1>
        <p class="page-sub">${nowThai()}</p>
      </div>
      <button class="btn btn-primary" onclick="navigate('new')">+ สร้างบันทึกใหม่</button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">บันทึกวันนี้</div>
        <div class="stat-val">${today}</div>
        <div class="stat-desc">รายการ</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">เดือนนี้</div>
        <div class="stat-val">${month}</div>
        <div class="stat-desc">รายการ</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">ทั้งหมด</div>
        <div class="stat-val">${total}</div>
        <div class="stat-desc">รายการ</div>
      </div>
    </div>

    <div class="section-hdr" style="margin-top:28px"><h2>สร้างด่วน</h2></div>
    <div class="quick-types">
      ${DOCUMENT_TYPES.map(t => `
        <button class="quick-card" onclick="startNew('${t.id}')">
          <span class="qc-dot" style="background:${t.color}"></span>
          <span>${t.name}</span>
        </button>
      `).join('')}
    </div>

    ${recent.length ? `
      <div class="section-hdr" style="margin-top:28px">
        <h2>บันทึกล่าสุด</h2>
        <a class="link" href="#" onclick="navigate('history')">ดูทั้งหมด →</a>
      </div>
      <div class="entries-list">${recent.map(e => entryCard(e, true)).join('')}</div>
    ` : `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>ยังไม่มีบันทึก</h3>
        <p>เริ่มต้นสร้างบันทึกประจำวันแรกของคุณ</p>
        <button class="btn btn-primary" onclick="navigate('new')">สร้างบันทึกใหม่</button>
      </div>
    `}
  `;
  if (window.lucide) lucide.createIcons();
}

// ════════════════════════════════════════════
//  TYPE SELECTOR
// ════════════════════════════════════════════
function renderTypeSelector() {
  const el = document.getElementById('page-new');
  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">สร้างบันทึกประจำวัน</h1>
        <p class="page-sub">เลือกประเภทบันทึก</p>
      </div>
    </div>
    <div class="type-cards">
      ${DOCUMENT_TYPES.map(t => `
        <div class="type-card" onclick="startNew('${t.id}')">
          <div class="tc-dot" style="background:${t.color}"></div>
          <div class="tc-name">${t.name}</div>
          <div class="tc-desc">${t.desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ════════════════════════════════════════════
//  FORM
// ════════════════════════════════════════════
function getNextItemNo() {
  const today = new Date().toLocaleDateString('en-CA');
  const s = storage.getSettings();
  if (s.lastLogDate !== today) {
    s.lastLogDate = today;
    s.lastLogNo = 0;
  }
  s.lastLogNo += 1;
  storage.saveSettings(s);
  return s.lastLogNo;
}

function startNew(typeId, prefillText) {
  state.selectedType = typeId;
  state.formData     = {};
  state.editingId    = null;

  // Pre-fill default profile
  const s = storage.getSettings();
  if (s.defaultProfile) {
    const p = s.defaultProfile;
    Object.assign(state.formData, {
      officerRank: p.rank,
      officerName: p.name,
      officerPos:  p.pos,
      station:     p.station,
      province:    p.province,
    });
  }

  if (typeId !== 'custom_text') {
    state.formData.itemNo = getNextItemNo();
    state.formData.itemTime = new Date().toTimeString().slice(0, 5);
  }

  showPageNew();
  renderForm(prefillText);
}

function showPageNew() {
  state.page = 'new';
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.page === 'new')
  );
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-new').classList.remove('hidden');
}

function renderForm(prefillText) {
  const type = getDocType(state.selectedType);
  if (!type) { renderTypeSelector(); return; }

  const el = document.getElementById('page-new');
  el.innerHTML = `
    <div class="form-hdr" style="display:flex; justify-content:space-between; align-items:center;">
      <nav class="form-breadcrumb">
        <a class="link" href="#" onclick="renderTypeSelector()">สร้างบันทึกใหม่</a>
        <span class="crumb-sep">›</span>
        <span class="crumb-cur">${type.name}</span>
      </nav>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-sm" style="background:var(--bg-card); border:1px solid #3b82f6; color:#3b82f6; font-weight:600; display:flex; align-items:center; gap:6px;" onclick="readSmartCard()">
          <i data-lucide="credit-card" style="width:16px;height:16px;"></i> อ่านบัตร ปชช.
        </button>
        <button class="btn btn-sm" style="background:var(--bg-card); border:1px solid #e5e7eb; color:#a855f7; font-weight:600; display:flex; align-items:center; gap:6px;" onclick="showAiAutofillModal()">
          <i data-lucide="sparkles" style="width:16px;height:16px;"></i> AI ช่วยแยกข้อมูล
        </button>
      </div>
    </div>

    <div class="form-layout">
      <!-- ───── Left: Form ───── -->
      <div class="form-panel" id="formPanel">
        ${buildProfileBar()}
        ${buildSmartVarsUI()}
        ${state.selectedType !== 'custom_text' ? `
          <div class="form-section">
            <div class="sec-title-bar" onclick="this.parentElement.classList.toggle('collapsed')">ลำดับประจำวัน (อัตโนมัติ)</div>
            <div class="sec-body">
              <div class="fields-grid" style="grid-template-columns:1fr 1fr;">
                <div class="field-group">
                  <label class="fld-label">ข้อที่</label>
                  <input type="number" id="itemNo" class="fld-input" value="${state.formData.itemNo || ''}" oninput="onFieldChange('itemNo', this.value)">
                </div>
                <div class="field-group">
                  <label class="fld-label">เวลา</label>
                  <input type="time" id="itemTime" class="fld-input" value="${state.formData.itemTime || ''}" oninput="onFieldChange('itemTime', this.value)">
                </div>
              </div>
            </div>
          </div>
        ` : ''}
        ${type.sections.map(sec => `
          <div class="form-section">
            <div class="sec-title-bar" onclick="this.parentElement.classList.toggle('collapsed')">${sec.title}</div>
            <div class="sec-body">
              <div class="fields-grid">
                ${sec.fields.map(f => buildField(f)).join('')}
              </div>
            </div>
          </div>
        `).join('')}

        <div class="form-actions">
          <button class="btn btn-primary btn-lg" onclick="saveEntry()">บันทึก</button>
          <button class="btn btn-secondary" onclick="exportCurrent()">Export Word</button>
          <button class="btn btn-secondary" style="background:#e11d48; color:#fff; border-color:#e11d48;" onclick="exportPDFCurrent()">Export PDF</button>
          <button class="btn btn-ghost" onclick="printCurrent()">พิมพ์</button>
          <button class="btn btn-ghost" onclick="saveFormAsTemplate()" title="บันทึกบันทึกนี้เป็นแม่แบบ" style="border:1px dashed var(--border2)">
            <i data-lucide="bookmark-plus" style="width:14px;height:14px"></i> บันทึกเป็นแม่แบบ
          </button>
        </div>
      </div>

      <!-- ───── Right: Preview ───── -->
      <div class="preview-panel" id="previewPanel">
        <div class="preview-hdr">
          <span class="preview-hdr-label">ตัวอย่างเอกสาร</span>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn btn-sm btn-ghost" id="btnRefineTone" onclick="refineToneCurrent()" style="color:#f59e0b; border:1px solid #fde68a; border-radius:16px; padding:4px 10px; background:#fffbeb;"><i data-lucide="sparkles" style="width:14px;height:14px;"></i> เกลาภาษา</button>
            <button class="btn btn-sm btn-primary" onclick="validateCurrentWithAI()" style="background:#a855f7; border-color:#a855f7; border-radius:16px; padding:4px 10px;"><i data-lucide="check-circle" style="width:14px;height:14px;"></i> ตรวจด้วย AI</button>
            <button class="btn btn-sm btn-ghost" id="btnWordMode" onclick="toggleWordMode()" style="border-radius:16px; padding:4px 10px; border:1px solid #3b82f6; color:#3b82f6;"><i data-lucide="file-edit" style="width:14px;height:14px;"></i> แก้ไขอิสระ</button>
            <button class="btn btn-sm btn-ghost" id="copyBtn" onclick="copyPreview()">คัดลอก</button>
          </div>
        </div>
        <!-- Word-mode toolbar (hidden by default) -->
        <div id="wordToolbar" style="display:none; gap:4px; padding:8px 12px; background:var(--bg-card); border-bottom:1px solid var(--border); flex-wrap:wrap; align-items:center;">
          <select id="wt-fontsize" onchange="document.execCommand('fontSize',false,this.value)" title="ขนาดตัวอักษร" style="padding:2px 6px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:13px;">
            <option value="3">16pt</option><option value="4" selected>18pt</option><option value="5">20pt</option><option value="6">24pt</option><option value="7">28pt</option>
          </select>
          <div style="width:1px;height:20px;background:var(--border);margin:0 4px;"></div>
          <button class="wt-btn" onclick="document.execCommand('bold')" title="ตัวหนา"><b>B</b></button>
          <button class="wt-btn" onclick="document.execCommand('italic')" title="ตัวเอียง"><i>I</i></button>
          <button class="wt-btn" onclick="document.execCommand('underline')" title="ขีดเส้นใต้"><u>U</u></button>
          <div style="width:1px;height:20px;background:var(--border);margin:0 4px;"></div>
          <button class="wt-btn" onclick="document.execCommand('justifyLeft')"   title="ชิดซ้าย"><i data-lucide="align-left" style="width:14px;height:14px;"></i></button>
          <button class="wt-btn" onclick="document.execCommand('justifyCenter')" title="กึ่งกลาง"><i data-lucide="align-center" style="width:14px;height:14px;"></i></button>
          <button class="wt-btn" onclick="document.execCommand('justifyRight')"  title="ชิดขวา"><i data-lucide="align-right" style="width:14px;height:14px;"></i></button>
          <button class="wt-btn" onclick="document.execCommand('justifyFull')"   title="เต็มตั้งแต่สองข้าง"><i data-lucide="align-justify" style="width:14px;height:14px;"></i></button>
          <div style="width:1px;height:20px;background:var(--border);margin:0 4px;"></div>
          <button class="wt-btn" onclick="document.execCommand('insertUnorderedList')" title="รายการ"><i data-lucide="list" style="width:14px;height:14px;"></i></button>
          <button class="wt-btn" onclick="document.execCommand('indent')"         title="เยื้องเข้า"><i data-lucide="indent" style="width:14px;height:14px;"></i></button>
          <button class="wt-btn" onclick="document.execCommand('outdent')"        title="เยื้องออก"><i data-lucide="outdent" style="width:14px;height:14px;"></i></button>
          <div style="width:1px;height:20px;background:var(--border);margin:0 4px;"></div>
          <button class="wt-btn" onclick="document.execCommand('undo')"           title="ย้อนกลับ"><i data-lucide="undo" style="width:14px;height:14px;"></i></button>
          <button class="wt-btn" onclick="document.execCommand('redo')"           title="ทำซ้ำ"><i data-lucide="redo" style="width:14px;height:14px;"></i></button>
          <div style="flex:1"></div>
          <span style="font-size:11px; color:var(--text-muted); background:#fef3c7; padding:2px 8px; border-radius:10px;">✏️ โหมดแก้ไขอิสระ — กดปุ่ม "แก้ไขอิสระ" อีกครั้งเพื่อออก</span>
        </div>
        <div class="preview-doc" id="previewDoc">
          <div class="doc-title" id="docTitle" contenteditable="true" 
               title="คลิกเพื่อแก้ไขหัวเอกสาร" 
               oninput="state.formData.docTitle = this.innerText" 
               style="outline:none; cursor:text; padding:4px; border-radius:4px;"
               onfocus="this.style.background='#f3f4f6'"
               onblur="this.style.background='transparent'">${escHtml(state.formData.docTitle || 'บันทึกประจำวัน')}</div>
          <hr class="doc-line">
          <div class="doc-body" id="docBody"></div>
        </div>
      </div>
    </div>
  `;

  // If editing, populate fields first
  if (state.editingId) populateFields();

  // If prefill text from example, populate a raw-text field if available
  if (prefillText) {
    const rawField = type.sections.flatMap(s => s.fields).find(f => f.id === 'rawContent');
    if (rawField) {
      state.formData['rawContent'] = prefillText;
      const el = document.getElementById('rawContent');
      if (el) el.value = prefillText;
    }
  }

  bindAllFields();
  updatePreview();
}

// ════════════════════════════════════════════
//  SMART PLACEHOLDERS (ตัวแปรอัจฉริยะ)
// ════════════════════════════════════════════
function buildSmartVarsUI() {
  if (state.selectedType !== 'custom_text') return '';
  const text = state.formData.customContent || '';
  const regex = /\[(.*?)\]/g;
  let match;
  const vars = new Set();
  while ((match = regex.exec(text)) !== null) {
    if (match[1].trim()) vars.add(match[1].trim());
  }
  
  if (vars.size === 0) return '';
  
  // Save original template for replacement later
  state.smartTemplate = text; 
  
  let html = `
    <div class="form-section" style="border-left: 4px solid var(--primary); background: rgba(59, 130, 246, 0.03);">
      <div class="sec-title-bar" style="background:transparent; color:var(--primary); padding-bottom:4px;" onclick="this.parentElement.classList.toggle('collapsed')">
        🪄 ตัวแปรอัจฉริยะ (Smart Placeholders)
      </div>
      <div class="sec-body" style="padding-top:0;">
        <p style="font-size:13px; color:#6b7280; margin-bottom:16px;">พิมพ์ข้อมูลในช่องด้านล่าง แล้วคำในวงเล็บ [...] จะเปลี่ยนให้เองทุกจุด</p>
        <div class="fields-grid">
  `;
  vars.forEach(v => {
    html += `
      <div class="field-group">
        <label class="fld-label">${escHtml(v)}</label>
        <input type="text" class="fld-input smart-var-input" data-var="${escHtml(v)}" oninput="applySmartVariables()">
      </div>
    `;
  });
  html += `
        </div>
      </div>
    </div>
  `;
  return html;
}

function applySmartVariables() {
  if (!state.smartTemplate) return;
  let text = state.smartTemplate;
  document.querySelectorAll('.smart-var-input').forEach(inp => {
    const v = inp.dataset.var;
    const val = inp.value;
    if (val) {
      // Escape regex special chars in v
      const escapedV = v.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('\\[' + escapedV + '\\]', 'g');
      text = text.replace(regex, val);
    }
  });
  
  // Update state and textarea
  state.formData.customContent = text;
  const ta = document.getElementById('customContent');
  if (ta) ta.value = text;
  updatePreview();
}

// ──────────── Smart Card Reader ────────────
async function readSmartCard() {
  toast('กำลังเชื่อมต่อเครื่องอ่านบัตร...', 'info');
  
  // จำลองการอ่านบัตร (Simulation)
  // ในการใช้งานจริง จะใช้ fetch() ไปยัง localhost agent ของสถานีตำรวจ
  // เช่น fetch('http://localhost:8080/smartcard/api/readAll')
  
  setTimeout(() => {
    // ข้อมูลจำลองที่ได้จากการอ่านบัตร
    const mockData = {
      title: 'นาย',
      name: 'สมชาย รักชาติ',
      citizenId: '1103456789123',
      dob: '2528-05-14',
      address: '123/4 ม.5 ต.บางรัก อ.เมือง จ.เชียงใหม่'
    };
    
    let filledCount = 0;
    
    // หาช่องที่น่าจะเป็นข้อมูลบัตรประชาชนในฟอร์มปัจจุบัน
    const fieldsToFill = [
      { possibleIds: ['suspectId', 'driverId', 'accId', 'injId', 'compId'], val: mockData.citizenId },
      { possibleIds: ['suspectName', 'driverName', 'accName', 'injName', 'compName'], val: mockData.name },
      { possibleIds: ['suspectTitle', 'driverTitle', 'accTitle', 'injTitle', 'compTitle'], val: mockData.title },
      { possibleIds: ['suspectAge', 'driverAge', 'accAge', 'injAge', 'compAge'], val: '38' }, // คำนวณจำลอง
      { possibleIds: ['suspectHouseNo'], val: '123/4' },
      { possibleIds: ['suspectMoo'], val: '5' },
      { possibleIds: ['suspectSubdistrict'], val: 'บางรัก' },
      { possibleIds: ['suspectDistrict'], val: 'เมือง' },
      { possibleIds: ['suspectProvince'], val: 'เชียงใหม่' },
      { possibleIds: ['suspectNationality'], val: 'ไทย' }
    ];

    fieldsToFill.forEach(mapping => {
      mapping.possibleIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) {
          el.value = mapping.val;
          state.formData[id] = mapping.val;
          filledCount++;
          // Trigger validation colors if any
          if (id.endsWith('Id') && typeof validateThaiId === 'function') {
             el.dispatchEvent(new Event('blur'));
          }
        }
      });
    });

    if (filledCount > 0) {
      toast(`ดึงข้อมูลจากบัตรสำเร็จ (${filledCount} ช่อง)`, 'success');
      updatePreview();
    } else {
      toast('ไม่พบช่องข้อมูลที่รองรับในฟอร์มนี้ หรือข้อมูลเต็มแล้ว', 'warning');
    }
  }, 1500);
}

function buildProfileBar() {
  const profiles = storage.getProfiles();
  if (!profiles.length) return '';
  return `<div class="profile-bar">
    <span>โหลดโปรไฟล์:</span>
    ${profiles.map((p, i) => `
      <button class="btn btn-sm btn-ghost" onclick="loadProfile(${i})">${p.rank} ${p.name.split(' ')[0]}</button>
    `).join('')}
  </div>`;
}

// ──────────── Field builder ────────────
function buildField(f) {
  const val = state.formData[f.id] !== undefined ? state.formData[f.id] : '';
  const req  = f.required ? '<span class="req">*</span>' : '';

  if (f.type === 'checkbox') {
    return `<div class="field-group field-full">
      <label class="chk-label">
        <input type="checkbox" id="${f.id}" ${val ? 'checked' : ''}
          onchange="onFieldChange('${f.id}', this.checked)">
        <span>${f.label}</span>
      </label>
    </div>`;
  }

  if (f.type === 'select') {
    const opts = f.options.map(o =>
      `<option value="${esc(o)}" ${val === o ? 'selected' : ''}>${esc(o)}</option>`
    ).join('');
    return `<div class="field-group">
      <label class="fld-label" for="${f.id}">${f.label} ${req}</label>
      <select id="${f.id}" class="fld-input" onchange="onFieldChange('${f.id}', this.value)">
        <option value="">— เลือก —</option>${opts}
      </select>
    </div>`;
  }

  if (f.type === 'textarea') {
    const presetBtns = (f.presets || []).map(p =>
      `<button type="button" class="preset-btn" onclick="setPreset('${f.id}',${JSON.stringify(p.text)})">${p.label}</button>`
    ).join('');
    const presetsHtml = presetBtns ? `<div class="presets">${presetBtns}</div>` : '';
    return `<div class="field-group field-full">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="fld-label" for="${f.id}" style="margin-bottom:0;">${f.label} ${req}</label>
        <button type="button" id="micBtn-${f.id}" class="btn btn-sm btn-ghost" style="color:#ef4444;" onclick="toggleSpeechToText('${f.id}', 'micBtn-${f.id}')" title="พิมพ์ด้วยเสียง">
          <i data-lucide="mic" style="width:16px;height:16px;"></i> พิมพ์ด้วยเสียง
        </button>
      </div>
      ${presetsHtml}
      <textarea id="${f.id}" class="fld-input fld-ta" rows="${f.rows || 4}"
        placeholder="${esc(f.placeholder || '')}"
        oninput="onFieldChange('${f.id}', this.value)">${esc(val)}</textarea>
    </div>`;
  }

  // text / number / date / time
  const isIdField = f.id.endsWith('Id') || f.id.toLowerCase().includes('cardid') || f.id.toLowerCase().includes('idcard');
  const extraHandler = isIdField ? ` onblur="validateThaiId('${f.id}')"` : '';
  return `<div class="field-group">
    <label class="fld-label" for="${f.id}">${f.label} ${req}</label>
    <input type="${f.type}" id="${f.id}" class="fld-input"
      value="${esc(String(val))}"
      placeholder="${esc(f.placeholder || '')}"
      ${f.maxLength ? `maxlength="${f.maxLength}"` : ''}
      oninput="onFieldChange('${f.id}', this.value)"${extraHandler}>
    ${isIdField ? `<div id="${f.id}_hint" style="font-size:12px;margin-top:3px;"></div>` : ''}
  </div>`;
}

function bindAllFields() { /* fields use inline handlers */ }

function onFieldChange(id, val) {
  state.formData[id] = val;
  storage.saveDraft({ type: state.selectedType, formData: state.formData });
  updatePreview();
}

function validateThaiId(fieldId) {
  const val = (document.getElementById(fieldId)?.value || '').replace(/[- ]/g, '');
  const hint = document.getElementById(fieldId + '_hint');
  if (!hint || !val) return;
  if (val.length !== 13 || !/^\d{13}$/.test(val)) {
    hint.innerHTML = '<span style="color:#ef4444;">⚠️ เลขบัตรประชาชนต้องมี 13 หลัก (กรอก ' + val.length + ' หลัก)</span>';
    return;
  }
  // Thai national ID checksum algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(val[i]) * (13 - i);
  const check = (11 - (sum % 11)) % 10;
  if (check === parseInt(val[12])) {
    hint.innerHTML = '<span style="color:#10b981;">✅ เลขบัตรประชาชนถูกต้อง</span>';
  } else {
    hint.innerHTML = '<span style="color:#ef4444;">❌ เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง</span>';
  }
}

function setPreset(id, text) {
  state.formData[id] = text;
  const el = document.getElementById(id);
  if (el) el.value = text;
  storage.saveDraft({ type: state.selectedType, formData: state.formData });
  updatePreview();
}

function loadProfile(idx) {
  const profiles = storage.getProfiles();
  const p = profiles[idx];
  if (!p) return;
  Object.assign(state.formData, {
    officerRank: p.rank,
    officerName: p.name,
    officerPos:  p.pos,
    station:     p.station,
    province:    p.province,
  });
  ['officerRank', 'officerName', 'officerPos', 'station', 'province'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = state.formData[id] || '';
  });
  updatePreview();
}

function populateFields() {
  const entry = storage.getById(state.editingId);
  if (!entry) return;
  state.formData = { ...entry.data };
  Object.entries(state.formData).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!val;
    else el.value = val ?? '';
  });
}

// ────────────── Word Mode ──────────────
let _wordMode = false;
function toggleWordMode() {
  const body = document.getElementById('docBody');
  const toolbar = document.getElementById('wordToolbar');
  const btn = document.getElementById('btnWordMode');
  if (!body || !toolbar || !btn) return;

  _wordMode = !_wordMode;

  if (_wordMode) {
    // Snapshot current rendered HTML into the editor
    body.contentEditable = 'true';
    body.style.outline = '2px solid #3b82f6';
    body.style.borderRadius = '4px';
    body.style.minHeight = '200px';
    toolbar.style.display = 'flex';
    btn.innerHTML = '<i data-lucide="file-check" style="width:14px;height:14px;"></i> ออกโหมดแก้ไข';
    btn.style.color = '#fff';
    btn.style.background = '#3b82f6';
    btn.style.borderColor = '#3b82f6';
    body.focus();
    showToast('โหมดแก้ไขอิสระ — พิมพ์หรือจัดรูปแบบได้เลย');
  } else {
    // Commit edits: extract plain text back from innerHTML
    const editedHtml = body.innerHTML;
    const editedText = htmlToPlainText(editedHtml);
    state.liveText = editedText;
    // Sync back to appropriate field
    const targetId = 'customContent' in state.formData ? 'customContent'
      : 'rawContent' in state.formData ? 'rawContent' : null;
    if (targetId) {
      state.formData[targetId] = editedText;
      const el = document.getElementById(targetId);
      if (el) el.value = editedText;
    } else {
      // For structured types, store in overrideContent
      state.formData._manualOverride = editedText;
    }
    body.contentEditable = 'false';
    body.style.outline = '';
    body.style.borderRadius = '';
    toolbar.style.display = 'none';
    btn.innerHTML = '<i data-lucide="file-edit" style="width:14px;height:14px;"></i> แก้ไขอิสระ';
    btn.style.color = '#3b82f6';
    btn.style.background = '';
    btn.style.borderColor = '#3b82f6';
    storage.saveDraft({ type: state.selectedType, formData: state.formData });
    showToast('บันทึกการแก้ไขเรียบร้อยแล้ว', 'success');
  }
  if (window.lucide) lucide.createIcons();
}

function htmlToPlainText(html) {
  // Convert common formatting tags to plain text equivalents
  return html
    .replace(/<p class="pi3">(.*?)<\/p>/gi, '\t$1\n')
    .replace(/<p class="pi2">(.*?)<\/p>/gi, '        $1\n')
    .replace(/<p class="pi1">(.*?)<\/p>/gi, '$1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<em>(.*?)<\/em>/gi, '$1')
    .replace(/<u>(.*?)<\/u>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ──────────── Live Preview ────────────
function updatePreview() {
  if (_wordMode) return; // Don't overwrite user edits in word mode
  const type = getDocType(state.selectedType);
  const body = document.getElementById('docBody');
  if (!type || !body) return;

  try {
    let text;
    // If user has manually overridden the content, use that
    if (state.formData._manualOverride) {
      text = state.formData._manualOverride;
    } else {
      text = type.generate(state.formData);
      // Auto-inject itemNo and itemTime if they exist in formData and not customText
      if (state.selectedType !== 'custom_text') {
        const itemNo = state.formData.itemNo || '.....';
        const itemTime = state.formData.itemTime ? thaiTime(state.formData.itemTime) : '.....';
        text = `ข้อที่ ${itemNo} เวลา ${itemTime} น.\n${text.startsWith('\t') || text.startsWith(' ') ? '' : '\t'}${text}`;
      }
    }

    state.liveText = text;
    body.innerHTML = textToPreviewHtml(text);
  } catch (e) {
    body.innerHTML = `<p style="color:red">เกิดข้อผิดพลาด: ${e.message}</p>`;
  }
}

function textToPreviewHtml(text) {
  return text.split('\n').map(line => {
    const s = escHtml(line);
    if (line.startsWith('\t'))       return `<p class="pi3">${escHtml(line.slice(1))}</p>`;
    if (line.startsWith('        ')) return `<p class="pi2">${escHtml(line.trimStart())}</p>`;
    if (line.startsWith('     '))    return `<p class="pi1">${escHtml(line.trimStart())}</p>`;
    return `<p>${s}</p>`;
  }).join('');
}

function copyPreview() {
  if (!state.liveText) return;
  exporter.copyText(state.liveText).then(() => {
    const btn = document.getElementById('copyBtn');
    if (btn) { btn.textContent = 'คัดลอกแล้ว'; setTimeout(() => btn.textContent = 'คัดลอก', 2000); }
  });
}

// ──────────── Save / Export ────────────
function saveEntry() {
  const type = getDocType(state.selectedType);
  if (!type) return;
  const existing = state.editingId ? storage.getById(state.editingId) : null;
  const id = storage.save({
    id:        state.editingId || null,
    type:      state.selectedType,
    typeName:  type.name,
    data:      { ...state.formData },
    text:      state.liveText,
    createdAt: existing?.createdAt || new Date().toISOString(),
  });
  state.editingId = id;
  storage.clearDraft();
  toast('บันทึกเรียบร้อยแล้ว');
}

function exportCurrent() {
  const type = getDocType(state.selectedType);
  if (!type) return;
  const docBody = document.getElementById('docBody');
  if (!docBody || !docBody.innerHTML.trim()) { toast('ยังไม่มีเนื้อหาเอกสาร'); return; }
  exporter.toWord(`ปจว_${type.name}_${dateSuffix()}`, state.liveText);
}

function exportPDFCurrent() {
  const type = getDocType(state.selectedType);
  if (!type) return;
  const docBody = document.getElementById('docBody');
  if (!docBody || !docBody.innerHTML.trim()) { toast('ยังไม่มีเนื้อหาเอกสาร'); return; }
  exporter.toPDF(`ปจว_${type.name}_${dateSuffix()}`, 'previewDoc');
}

function printCurrent() {
  const docBody = document.getElementById('docBody');
  if (!docBody || !docBody.innerHTML.trim()) { toast('ยังไม่มีเนื้อหาเอกสาร'); return; }
  exporter.print(state.liveText);
}

// ════════════════════════════════════════════
//  HISTORY
// ════════════════════════════════════════════
function renderHistory(q = '', typeId = '') {
  const el      = document.getElementById('page-history');
  const entries = storage.search(q, typeId);

  let listHtml = '';
  if (entries.length) {
    if (!q && !typeId) {
      // Grouping logic (only when no search/filter)
      const childrenMap = {};
      entries.forEach(e => {
        if (e.data && e.data.refItem) {
          const ref = String(e.data.refItem);
          if (!childrenMap[ref]) childrenMap[ref] = [];
          childrenMap[ref].push(e);
        }
      });
      
      const parts = [];
      const renderedRefs = new Set();
      
      entries.forEach(e => {
        const refItem = e.data && e.data.refItem ? String(e.data.refItem) : null;
        const myItemNo = e.data && e.data.itemNo ? String(e.data.itemNo) : null;
        
        if (refItem) {
          // Check if parent exists in current entries list
          const parentExists = entries.some(p => p.data && String(p.data.itemNo) === refItem);
          if (parentExists) return; // Skip here, will be rendered under parent
          parts.push(entryCard(e, true)); // Orphan, render at root
        } else {
          // Top-level item
          parts.push(entryCard(e, true));
          if (myItemNo && childrenMap[myItemNo] && !renderedRefs.has(myItemNo)) {
            parts.push(`<div style="margin-left:24px; border-left:2px solid var(--border); padding-left:16px; margin-top:-8px; margin-bottom:8px; position:relative;">`);
            childrenMap[myItemNo].forEach(child => {
              parts.push(entryCard(child, true, true));
            });
            parts.push(`</div>`);
            renderedRefs.add(myItemNo);
          }
        }
      });
      listHtml = `<div class="entries-list">${parts.join('')}</div>`;
    } else {
      // Flat list for search
      listHtml = `<div class="entries-list">${entries.map(e => entryCard(e, true)).join('')}</div>`;
    }
  } else {
    listHtml = `<div class="empty-state">
           <div class="empty-icon">${q ? '🔍' : '📋'}</div>
           <h3>${q ? 'ไม่พบผลลัพธ์' : 'ยังไม่มีบันทึก'}</h3>
           <p>${q ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มสร้างบันทึกแรก'}</p>
         </div>`;
  }

  el.innerHTML = `
    <div class="page-header" style="justify-content: space-between; display: flex;">
      <h1 class="page-title">ประวัติบันทึก</h1>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary" onclick="showSummaryModal()" style="background:#3b82f6; border:none;"><i data-lucide="bar-chart-2" style="width:16px;height:16px;"></i> สรุปยอดเวรวันนี้</button>
        <button class="btn btn-primary" onclick="exportHistoryCSV()" style="background:#10b981; border:none;"><i data-lucide="download" style="width:16px;height:16px;"></i> ดาวน์โหลด Excel</button>
      </div>
    </div>
    <div class="search-bar">
      <input id="sInput" type="text" class="fld-input" value="${esc(q)}"
        placeholder="ค้นหา ชื่อ สถานที่ เลขคดี..."
        oninput="renderHistory(this.value, document.getElementById('sType').value)">
      <select id="sType" class="fld-input" style="max-width:180px"
        onchange="renderHistory(document.getElementById('sInput').value, this.value)">
        <option value="">ทุกประเภท</option>
        ${DOCUMENT_TYPES.map(t =>
          `<option value="${t.id}" ${typeId === t.id ? 'selected' : ''}>${t.name}</option>`
        ).join('')}
      </select>
    </div>
    ${listHtml}
  `;
  if (window.lucide) lucide.createIcons();
}

function entryCard(entry, showActions, isSub = false) {
  const type = getDocType(entry.type);
  const d    = entry.data || {};
  let sum  = d.title || d.compName || d.injName || d.incidentDesc || d.accName || d.suspectName || d.fineCharge;
  if (!sum && d.customContent) sum = d.customContent.split('\n')[0].substring(0, 50) + (d.customContent.length > 50 ? '...' : '');
  if (!sum) sum = '(ไม่มีชื่อ)';
  const dt   = new Date(entry.createdAt).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const color = type?.color || '#9b9b9b';

  const subIcon = isSub ? `<div style="position:absolute; left:-18px; top:18px; color:var(--border);"><i data-lucide="corner-down-right" style="width:16px;height:16px;"></i></div>` : '';
  const itemBadge = d.itemNo ? `<span style="font-size:11px;background:#e5e7eb;color:#4b5563;padding:2px 6px;border-radius:4px;margin-right:6px;">ข้อ ${d.itemNo}</span>` : '';

  const actions = showActions ? `
    <div class="card-actions" onclick="event.stopPropagation()">
      <button class="btn btn-sm btn-ghost" title="ลงบันทึกต่อเนื่อง" onclick="continueLog('${entry.id}')"><i data-lucide="link" style="width:16px;height:16px;"></i></button>
      <button class="btn btn-sm btn-ghost" title="แก้ไข"  onclick="editEntry('${entry.id}')"><i data-lucide="edit-2" style="width:16px;height:16px;"></i></button>
      <button class="btn btn-sm btn-ghost" title="สำเนา"  onclick="duplicateEntry('${entry.id}')"><i data-lucide="copy" style="width:16px;height:16px;"></i></button>
      <button class="btn btn-sm btn-ghost" title="Export Word" onclick="exportEntry('${entry.id}')"><i data-lucide="file-text" style="width:16px;height:16px;"></i></button>
      <button class="btn btn-sm btn-danger" title="ลบ"   onclick="deleteEntry('${entry.id}')"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>
    </div>` : '';

  return `<div class="entry-card" onclick="viewEntry('${entry.id}')" style="position:relative;">
    ${subIcon}
    <span class="entry-type-dot" style="background:${color}"></span>
    <div class="entry-body">
      <div class="entry-sum">${itemBadge}${escHtml(sum)}</div>
      <div class="entry-type-name">${escHtml(entry.typeName || 'ไม่ทราบ')}</div>
    </div>
    <span class="entry-dt">${dt}</span>
    ${actions}
  </div>`;
}

function viewEntry(id) {
  const entry = storage.getById(id);
  if (!entry) return;
  showModal(entry);
}

function showModal(entry) {
  closeModal();
  const type = getDocType(entry.type);
  const m    = document.createElement('div');
  m.id        = 'entryModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal">
      <div class="modal-hdr">
        <h3>${type?.name || 'บันทึก'}</h3>
        <button class="btn btn-sm btn-ghost" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="preview-doc preview-modal">
          <div class="doc-title">บันทึกประจำวัน</div>
          <hr class="doc-line">
          <div class="doc-body">${textToPreviewHtml(entry.text || '')}</div>
        </div>
      </div>
      <div class="modal-ftr">
        <button class="btn btn-primary"   onclick="exportEntry('${entry.id}')"><i data-lucide="file-text" style="width:16px;height:16px;margin-right:4px;"></i> Export Word</button>
        <button class="btn btn-secondary" onclick="printEntry('${entry.id}')"><i data-lucide="printer" style="width:16px;height:16px;margin-right:4px;"></i> พิมพ์</button>
        <button class="btn btn-ghost"     onclick="duplicateEntry('${entry.id}')"><i data-lucide="copy" style="width:16px;height:16px;margin-right:4px;"></i> สำเนา</button>
        <button class="btn btn-ghost"     onclick="editEntry('${entry.id}')"><i data-lucide="edit-2" style="width:16px;height:16px;margin-right:4px;"></i> แก้ไข</button>
        <button class="btn btn-ghost"     onclick="closeModal()"><i data-lucide="x" style="width:16px;height:16px;margin-right:4px;"></i> ปิด</button>
      </div>
    </div>`;
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  document.body.appendChild(m);
  if (window.lucide) lucide.createIcons();
}

function closeModal() { document.getElementById('entryModal')?.remove(); }

function editEntry(id) {
  closeModal();
  const entry = storage.getById(id);
  if (!entry) return;
  state.editingId    = id;
  state.selectedType = entry.type;
  state.formData     = { ...entry.data };
  showPageNew();
  renderForm();
}

function exportEntry(id) {
  closeModal();
  const entry = storage.getById(id);
  if (!entry) return;
  const type = getDocType(entry.type);
  exporter.toWord(`ปจว_${type?.name || ''}${dateSuffix()}`, entry.text || '');
}

function printEntry(id) {
  closeModal();
  const entry = storage.getById(id);
  if (entry) exporter.print(entry.text || '');
}

function deleteEntry(id) {
  if (!confirm('ยืนยันการลบบันทึก?')) return;
  storage.delete(id);
  closeModal();
  if (state.page === 'dashboard') renderDashboard();
  else if (state.page === 'history') renderHistory(document.getElementById('sInput')?.value, document.getElementById('sType')?.value);
}

function duplicateEntry(id) {
  const entry = storage.getById(id);
  if (!entry) return;
  
  const newEntry = {
    type: entry.type,
    typeName: entry.typeName,
    data: JSON.parse(JSON.stringify(entry.data)),
    text: entry.text
  };
  
  storage.save(newEntry);
  closeModal();
  
  if (state.page === 'dashboard') renderDashboard();
  else if (state.page === 'history') renderHistory(document.getElementById('sInput')?.value, document.getElementById('sType')?.value);
  
  toast('ทำสำเนาบันทึกสำเร็จ');
}

function continueLog(id) {
  const entry = storage.getById(id);
  if (!entry) return;
  const d = new Date(entry.createdAt);
  const dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const refText = `อ้างถึง ปจว.ข้อที่ ${entry.data.itemNo || '...'} เวลา ${timeStr} น. ลงวันที่ ${dateStr}\n\n`;

  state.editingId = null;
  state.selectedType = 'custom_text';
  state.formData = { customContent: refText };
  navigate('new');
  showToast('สร้างบันทึกต่อเนื่องแล้ว กรอกข้อมูลเพิ่มเติมได้เลย');
}

function showSummaryModal() {
  const entries = storage.getAll().filter(e => new Date(e.createdAt).toDateString() === new Date().toDateString());
  
  let summaryHtml = '';
  if (entries.length === 0) {
    summaryHtml = '<p style="text-align:center;color:#6b7280;margin:20px 0;">ไม่มีรายการบันทึกในวันนี้</p>';
  } else {
    // Count by type
    const typeCounts = {};
    entries.forEach(e => {
      typeCounts[e.typeName] = (typeCounts[e.typeName] || 0) + 1;
    });
    
    summaryHtml += '<div style="margin-bottom:16px; font-weight:600; font-size:16px;">สรุปยอดประจำวันที่ ' + nowThai() + '</div>';
    summaryHtml += '<ul style="list-style:none; padding:0; margin:0 0 20px 0;">';
    summaryHtml += `<li style="padding:8px 0; border-bottom:1px solid #eee; display:flex; justify-content:space-between;"><span>ยอดรวมทั้งหมด</span><span style="font-weight:bold;color:var(--primary);">${entries.length} เรื่อง</span></li>`;
    for (const [t, count] of Object.entries(typeCounts)) {
      summaryHtml += `<li style="padding:8px 0; border-bottom:1px dashed #eee; display:flex; justify-content:space-between; color:#4b5563;"><span>- ${escHtml(t)}</span><span style="font-weight:bold;">${count} เรื่อง</span></li>`;
    }
    summaryHtml += '</ul>';
  }

  const m = document.createElement('div');
  m.id = 'summaryModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal modal-sm" id="summaryPrintArea">
      <div class="modal-hdr no-print">
        <h3>📊 สรุปยอดเวรวันนี้</h3>
        <button class="btn btn-sm btn-ghost" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body" style="font-size:15px; line-height:1.6; color:#374151;">
        ${summaryHtml}
      </div>
      <div class="modal-ftr no-print">
        <button class="btn btn-primary" onclick="exporter.toPDF('สรุปยอดเวร_${dateSuffix()}', 'summaryPrintArea')">Export PDF</button>
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">ปิด</button>
      </div>
    </div>
  `;
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
}

// ════════════════════════════════════════════
//  AI AUTO-FILL (แยกข้อมูลลงฟอร์ม)
// ════════════════════════════════════════════
function showAiAutofillModal() {
  const apiKey = storage.getSettings().geminiApiKey;
  if (!apiKey) {
    alert('กรุณาตั้งค่า Gemini API Key ที่เมนู "ตั้งค่า / โปรไฟล์" ก่อนใช้งาน AI');
    return;
  }
  
  closeModal(); // close any existing modal
  const m = document.createElement('div');
  m.id = 'entryModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-hdr">
        <h3 style="display:flex;align-items:center;gap:8px;"><i data-lucide="sparkles" style="color:#a855f7;width:20px;height:20px;"></i> AI ช่วยแยกข้อมูล</h3>
        <button class="btn btn-sm btn-ghost" onclick="closeModal()"><i data-lucide="x" style="width:16px;height:16px;"></i></button>
      </div>
      <div class="modal-body">
        <p style="font-size:14px; color:#6b7280; margin-bottom:12px;">วางข้อความดิบๆ เช่น ข้อมูลจากบัตรประชาชน, ที่อยู่ยาวๆ หรือรายละเอียดเหตุการณ์ แล้ว AI จะพยายามนำไปกรอกลงช่องต่างๆ ของฟอร์มนี้ให้อัตโนมัติ</p>
        <textarea id="aiRawInput" class="fld-input" style="min-height:150px; font-size:15px; line-height:1.6;" placeholder="วางข้อความที่นี่..."></textarea>
        <div id="aiLoading" style="display:none; color:#a855f7; margin-top:12px; font-size:14px; text-align:center;">
          <div style="display:flex; justify-content:center; align-items:center; gap:8px;">
            กำลังประมวลผลด้วย AI กรุณารอสักครู่...
          </div>
        </div>
      </div>
      <div class="modal-ftr">
        <button class="btn btn-primary" id="aiBtnStart" onclick="startAiAutofill()"><i data-lucide="sparkles" style="width:16px;height:16px;margin-right:4px;"></i> เริ่มแยกข้อมูล</button>
        <button class="btn btn-ghost" onclick="closeModal()">ยกเลิก</button>
      </div>
    </div>
  `;
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  document.body.appendChild(m);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => document.getElementById('aiRawInput')?.focus(), 100);
}

async function startAiAutofill() {
  const rawText = document.getElementById('aiRawInput').value.trim();
  if (!rawText) return;
  
  const apiKey = storage.getSettings().geminiApiKey;
  const typeId = state.selectedType;
  const docType = getDocType(typeId);
  if (!docType) return;
  
  // Extract all fields in the current form type
  const formFields = docType.sections.flatMap(s => s.fields).filter(f => !['label', 'rawContent', 'customContent'].includes(f.type));
  
  document.getElementById('aiLoading').style.display = 'block';
  document.getElementById('aiBtnStart').disabled = true;
  
  try {
    const result = await AI.extractFormDataWithAI(rawText, formFields, apiKey);
    
    // Apply results to state and inputs
    let updatedCount = 0;
    for (const key in result) {
      if (result[key] && result[key] !== "") {
        state.formData[key] = result[key];
        const el = document.getElementById(key);
        if (el) el.value = result[key];
        updatedCount++;
      }
    }
    
    closeModal();
    if (updatedCount > 0) {
      toast('AI แยกข้อมูลลงฟอร์มได้ ' + updatedCount + ' ช่อง');
      updatePreview();
    } else {
      toast('AI ไม่พบข้อมูลที่ตรงกับฟอร์มนี้');
    }
    
  } catch (err) {
    alert('ข้อผิดพลาด: ' + err.message);
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('aiBtnStart').disabled = false;
  }
}

// ════════════════════════════════════════════
//  EXAMPLES PAGE v2 — Full Template Management
// ════════════════════════════════════════════

// State for examples page
const exState = { q: '', category: '', previewId: null };

// Category color helper
function catBadgeClass(cat) {
  const safe = (cat || 'ทั่วไป').replace(/\s+/g, '');
  return `cat-badge c-${safe}`;
}

async function toggleStar(id) {
  storage.toggleExampleStar(id);
  renderExamples(exState.q, exState.category);
}

async function renderExamples(q = '', category = '') {
  exState.q = q;
  exState.category = category;
  const el = document.getElementById('page-examples');

  // Load agent templates once
  if (!state.agentTemplates) {
    try {
      const res = await fetch('http://localhost:8080/templates');
      if (res.ok) state.agentTemplates = await res.json();
      else state.agentTemplates = [];
    } catch(e) {
      state.agentTemplates = [];
    }
  }

  // Build combined list: localStorage examples
  let allExamples = storage.getExamples();
  if (q || category) {
    allExamples = storage.searchExamples(q, category);
  }

  const cats = storage.getCategories();
  const catCounts = {};
  storage.getExamples().forEach(e => {
    const c = e.category || e.tag || 'ทั่วไป';
    catCounts[c] = (catCounts[c] || 0) + 1;
  });

  const starred   = allExamples.filter(e => e.starred);
  const unstarred = allExamples.filter(e => !e.starred);

  el.innerHTML = `
    <div class="page-header" style="margin-bottom:16px">
      <div>
        <h1 class="page-title">คลังตัวอย่าง & แม่แบบ</h1>
        <p class="page-sub">จัดการตัวอย่างบันทึกประจำวัน · ลากเรียงลำดับ · แก้ไขได้ทันที</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn btn-secondary" onclick="openBatchImportModal()" title="นำเข้าไฟล์ Word หลายไฟล์">
          <i data-lucide="upload" style="width:15px;height:15px"></i> นำเข้า Word
        </button>
        <button class="btn btn-primary" onclick="openNewExampleModal()">
          <i data-lucide="plus" style="width:15px;height:15px"></i> สร้างใหม่
        </button>
        <button class="btn btn-ghost" onclick="state.agentTemplates = null; renderExamples(exState.q, exState.category);" title="รีเฟรช">
          <i data-lucide="refresh-cw" style="width:15px;height:15px"></i>
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-bar" style="margin-bottom:12px">
      <input id="exSearch" type="text" class="fld-input" value="${escHtml(q)}"
        placeholder="ค้นหาชื่อ, เนื้อหา, หมวดหมู่..."
        oninput="renderExamples(this.value, exState.category)">
    </div>

    <!-- Filter Chips -->
    <div class="filter-chips">
      <span class="chip ${!category ? 'active' : ''}" onclick="renderExamples(exState.q, '')">
        <i data-lucide="layers" style="width:12px;height:12px"></i> ทั้งหมด
        <span class="chip-count">${storage.getExamples().length}</span>
      </span>
      ${cats.map(c => `
        <span class="chip ${category === c ? 'active' : ''}" onclick="renderExamples(exState.q, '${escHtml(c)}')">
          ${escHtml(c)} <span class="chip-count">${catCounts[c] || 0}</span>
        </span>
      `).join('')}
    </div>

    <!-- Starred -->
    ${starred.length > 0 ? `
      <div style="margin-bottom:20px">
        <div style="font-size:13px;font-weight:600;color:#eab308;display:flex;align-items:center;gap:5px;margin-bottom:8px">
          <i data-lucide="star" style="width:14px;height:14px;fill:#eab308"></i> รายการโปรด
        </div>
        <div id="exListStarred">
          ${starred.map(ex => exCardV2(ex)).join('')}
        </div>
      </div>
    ` : ''}

    <!-- All examples -->
    <div style="margin-bottom:20px">
      ${starred.length > 0 ? `
        <div style="font-size:13px;font-weight:600;color:var(--text-2);display:flex;align-items:center;gap:5px;margin-bottom:8px">
          <i data-lucide="file-text" style="width:14px;height:14px"></i> ทั้งหมด (${unstarred.length})
        </div>
      ` : ''}
      ${unstarred.length > 0 ? `
        <div id="exListMain">
          ${unstarred.map(ex => exCardV2(ex)).join('')}
        </div>
      ` : (allExamples.length === 0 ? `
        <div class="empty-state" style="margin-top:32px">
          <i data-lucide="inbox" style="width:48px;height:48px;color:var(--text-3);margin-bottom:12px"></i>
          <h3>${q || category ? 'ไม่พบตัวอย่างที่ค้นหา' : 'ยังไม่มีตัวอย่าง'}</h3>
          <p>กด "+ สร้างใหม่" หรือนำเข้าจากไฟล์ Word</p>
        </div>
      ` : '')}
    </div>

    <!-- Agent Templates section -->
    ${state.agentTemplates && state.agentTemplates.length > 0 ? `
      <div style="margin-top:8px;border-top:1px solid var(--border);padding-top:20px">
        <div style="font-size:13px;font-weight:600;color:var(--text-2);display:flex;align-items:center;gap:5px;margin-bottom:8px">
          <i data-lucide="folder-open" style="width:14px;height:14px"></i> ไฟล์ Word บนเครื่อง
          <button class="btn btn-sm btn-ghost" onclick="openTemplatesFolder()" style="margin-left:auto">
            <i data-lucide="external-link" style="width:12px;height:12px"></i> เปิดโฟลเดอร์
          </button>
        </div>
        <div>
          ${state.agentTemplates
            .filter(f => !q || f.toLowerCase().includes(q.toLowerCase()))
            .map(f => agentFileCard(f)).join('')}
        </div>
      </div>
    ` : ''}
  `;

  if (window.lucide) lucide.createIcons();

  // Setup Sortable on main list (no filter active)
  if (!q && !category) {
    const mainList = document.getElementById('exListMain');
    if (mainList && window.Sortable) {
      Sortable.create(mainList, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'dragging',
        onEnd(evt) {
          const items = [...mainList.querySelectorAll('.ex-card-v2')];
          const newOrder = items.map(el => el.dataset.id);
          storage.reorderExamples(newOrder);
          toast('เรียงลำดับใหม่แล้ว');
        }
      });
    }
  }

  // Ensure preview panel exists
  ensurePreviewPanel();
}

function exCardV2(ex) {
  const cat = ex.category || ex.tag || 'ทั่วไป';
  const starIcon = ex.starred
    ? `<i data-lucide="star" style="width:14px;height:14px;fill:#eab308;color:#eab308"></i>`
    : `<i data-lucide="star" style="width:14px;height:14px;color:#d1d5db"></i>`;
  const snippet = (ex.content || '').replace(/\s+/g,' ').slice(0,80);
  const updDate = ex.updatedAt || ex.createdAt || '';
  const dateStr = updDate ? new Date(updDate).toLocaleDateString('th-TH',{day:'2-digit',month:'short'}) : '';

  return `
    <div class="ex-card-v2" data-id="${ex.id}">
      <span class="drag-handle" title="ลากเพื่อเรียงลำดับ">
        <i data-lucide="grip-vertical" style="width:16px;height:16px"></i>
      </span>
      <div class="ex-body" onclick="openPreviewPanel('${ex.id}')">
        <div class="ex-name">
          <i data-lucide="file-text" style="width:14px;height:14px;flex-shrink:0;color:var(--accent)"></i>
          ${escHtml(ex.name)}
          <span class="${catBadgeClass(cat)}">${escHtml(cat)}</span>
        </div>
        <div class="ex-meta">${escHtml(snippet)}${snippet.length >= 80 ? '…' : ''} ${dateStr ? '· ' + dateStr : ''}</div>
      </div>
      <div class="ex-actions" onclick="event.stopPropagation()">
        <button class="btn btn-sm btn-ghost" title="${ex.starred ? 'เลิกติดดาว' : 'ติดดาว'}" onclick="toggleStar('${ex.id}')" style="padding:4px">${starIcon}</button>
        <button class="btn btn-sm btn-ghost" title="ดูตัวอย่าง" onclick="openPreviewPanel('${ex.id}')">
          <i data-lucide="eye" style="width:13px;height:13px"></i>
        </button>
        <button class="btn btn-sm btn-ghost" title="แก้ไข" onclick="openEditExampleModal('${ex.id}')">
          <i data-lucide="pencil" style="width:13px;height:13px"></i>
        </button>
        <button class="btn btn-sm btn-primary" onclick="useExample('${ex.id}')">ใช้งาน</button>
        <button class="btn btn-sm btn-ghost" title="ลบ" onclick="deleteExample('${ex.id}')" style="color:var(--red);padding:4px">
          <i data-lucide="trash-2" style="width:13px;height:13px"></i>
        </button>
      </div>
    </div>
  `;
}

function agentFileCard(f) {
  const name = f.replace(/\.(docx|txt|doc)$/i, '');
  return `
    <div class="ex-card-v2">
      <div class="ex-body">
        <div class="ex-name">
          <i data-lucide="file-box" style="width:14px;height:14px;flex-shrink:0;color:#f59e0b"></i>
          ${escHtml(name)}
          <span class="cat-badge" style="background:#fef3c7;color:#92400e">.${f.split('.').pop()}</span>
        </div>
      </div>
      <div class="ex-actions" onclick="event.stopPropagation()">
        <button class="btn btn-sm btn-ghost" onclick="editWordFile('${escHtml(f)}')">
          <i data-lucide="external-link" style="width:12px;height:12px"></i> เปิดใน Word
        </button>
        <button class="btn btn-sm btn-secondary" onclick="importAgentFile('${escHtml(f)}')">
          <i data-lucide="download" style="width:12px;height:12px"></i> นำเข้า
        </button>
        <button class="btn btn-sm btn-primary" onclick="useWordFile('${escHtml(f)}')">ใช้งาน</button>
      </div>
    </div>
  `;
}

// ── Preview Panel ──
function ensurePreviewPanel() {
  if (document.getElementById('slidePanel')) return;
  const panel = document.createElement('div');
  panel.id = 'slidePanel';
  panel.className = 'slide-panel';
  panel.innerHTML = `
    <div class="slide-panel-hdr">
      <span class="slide-panel-title" id="slidePanelTitle">ตัวอย่าง</span>
      <button class="btn btn-sm btn-ghost" onclick="closePreviewPanel()">
        <i data-lucide="x" style="width:16px;height:16px"></i>
      </button>
    </div>
    <div class="slide-panel-body">
      <pre id="slidePanelContent"></pre>
    </div>
    <div class="slide-panel-footer">
      <button class="btn btn-primary" style="flex:1" id="slideUseBtn" onclick="">ใช้งาน</button>
      <button class="btn btn-secondary" id="slideEditBtn" onclick="">แก้ไข</button>
    </div>
  `;
  document.body.appendChild(panel);
  if (window.lucide) lucide.createIcons();
}

function openPreviewPanel(id) {
  const ex = storage.getExampleById(id);
  if (!ex) return;
  exState.previewId = id;
  ensurePreviewPanel();
  document.getElementById('slidePanelTitle').textContent = ex.name;
  document.getElementById('slidePanelContent').textContent = ex.content || '';
  document.getElementById('slideUseBtn').onclick = () => { closePreviewPanel(); useExample(id); };
  document.getElementById('slideEditBtn').onclick = () => { closePreviewPanel(); openExampleFormModal(id); };
  document.getElementById('slidePanel').classList.add('open');
}

function closePreviewPanel() {
  const panel = document.getElementById('slidePanel');
  if (panel) panel.classList.remove('open');
  exState.previewId = null;
}

// ── In-App Editor ──
const CATEGORIES = ['ทั่วไป','จราจร','อาชญากรรม','ทรัพย์สิน','เศรษฐกิจ','เอกสารหาย','อาชญากรรมทางเทคโนโลยี','สอบสวน','อื่นๆ'];

function openEditExampleModal(id) {
  const ex = id ? storage.getExampleById(id) : null;
  openExampleFormModal(ex);
}

function openNewExampleModal() {
  openExampleFormModal(null);
}

function openExampleFormModal(ex) {
  document.getElementById('exFormModal')?.remove();
  const m = document.createElement('div');
  m.id = 'exFormModal';
  m.className = 'modal-overlay';
  const name    = ex ? escHtml(ex.name) : '';
  const content = ex ? escHtml(ex.content || '') : '';
  const curCat  = ex ? (ex.category || ex.tag || 'ทั่วไป') : 'ทั่วไป';

  m.innerHTML = `
    <div class="modal modal-fulltext" style="max-width:680px;width:95%;max-height:92vh;display:flex;flex-direction:column">
      <div class="modal-hdr" style="flex-shrink:0">
        <h3>${ex ? 'แก้ไขตัวอย่าง' : 'สร้างตัวอย่างใหม่'}</h3>
        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('exFormModal').remove()">
          <i data-lucide="x" style="width:16px;height:16px"></i>
        </button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px">
        <div>
          <label class="fld-label">ชื่อตัวอย่าง</label>
          <input id="exFormName" class="fld-input" type="text" value="${name}" placeholder="เช่น รับแจ้งคดีฉ้อโกง">
        </div>
        <div>
          <label class="fld-label">หมวดหมู่</label>
          <select id="exFormCat" class="fld-input">
            ${CATEGORIES.map(c => `<option value="${c}" ${c===curCat?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div style="flex:1;display:flex;flex-direction:column">
          <label class="fld-label">เนื้อหาตัวอย่าง</label>
          <textarea id="exFormContent" class="fld-input fld-textarea" rows="10" placeholder="วางข้อความตัวอย่างบันทึกประจำวันที่นี่...">${content}</textarea>
        </div>
      </div>
      <div style="padding:16px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0">
        <button class="btn btn-ghost" onclick="document.getElementById('exFormModal').remove()">ยกเลิก</button>
        <button class="btn btn-primary" onclick="saveExampleForm('${ex ? ex.id : ''}')">
          <i data-lucide="save" style="width:14px;height:14px"></i> บันทึก
        </button>
      </div>
    </div>
  `;
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
  if (window.lucide) lucide.createIcons();
  document.getElementById('exFormName').focus();
}

function saveExampleForm(id) {
  const name    = document.getElementById('exFormName').value.trim();
  const cat     = document.getElementById('exFormCat').value;
  const content = document.getElementById('exFormContent').value.trim();
  if (!name) { toast('กรุณาใส่ชื่อตัวอย่าง', 'warning'); return; }
  if (!content) { toast('กรุณาใส่เนื้อหาตัวอย่าง', 'warning'); return; }
  const ex = { id: id || undefined, name, category: cat, tag: cat, content };
  storage.saveExample(ex);
  document.getElementById('exFormModal').remove();
  toast(id ? 'แก้ไขตัวอย่างแล้ว ✓' : 'สร้างตัวอย่างใหม่แล้ว ✓', 'success');
  renderExamples(exState.q, exState.category);
  // Refresh AI context list if on assistant page
  const cList = document.getElementById('chatContextList');
  if (cList) cList.innerHTML = renderContextList(storage.getExamples());
}

// ── Batch Import from Agent files ──
function openBatchImportModal() {
  if (!state.agentTemplates || state.agentTemplates.length === 0) {
    toast('ไม่พบไฟล์ Word ในโฟลเดอร์แม่แบบ', 'warning');
    return;
  }
  document.getElementById('batchImportModal')?.remove();
  const m = document.createElement('div');
  m.id = 'batchImportModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal" style="max-width:560px;width:95%;max-height:85vh;display:flex;flex-direction:column">
      <div class="modal-hdr" style="flex-shrink:0">
        <h3>นำเข้าไฟล์ Word เป็นตัวอย่าง</h3>
        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('batchImportModal').remove()">
          <i data-lucide="x" style="width:16px;height:16px"></i>
        </button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1">
        <p style="font-size:13px;color:var(--text-2);margin-bottom:12px">
          เลือกไฟล์ที่ต้องการนำเข้าเป็นตัวอย่างในระบบ (อ่านเนื้อหา .docx โดยอัตโนมัติ)
        </p>
        <div style="margin-bottom:10px;display:flex;gap:8px">
          <button class="btn btn-sm btn-ghost" onclick="batchSelectAll(true)">เลือกทั้งหมด</button>
          <button class="btn btn-sm btn-ghost" onclick="batchSelectAll(false)">ยกเลิกทั้งหมด</button>
        </div>
        <div id="batchList">
          ${state.agentTemplates.map(f => `
            <label class="batch-check-card">
              <input type="checkbox" class="batch-cb" value="${escHtml(f)}" checked>
              <span class="batch-label">
                <i data-lucide="file-text" style="width:13px;height:13px;color:var(--accent)"></i>
                ${escHtml(f.replace(/\.(docx|txt|doc)$/i,''))}
              </span>
              <span class="batch-size cat-badge" style="background:#e0e7ff;color:#3730a3">${f.split('.').pop()}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div style="padding:16px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0">
        <button class="btn btn-ghost" onclick="document.getElementById('batchImportModal').remove()">ยกเลิก</button>
        <button class="btn btn-primary" onclick="doBatchImport()">
          <i data-lucide="download" style="width:14px;height:14px"></i> นำเข้าที่เลือก
        </button>
      </div>
    </div>
  `;
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
  if (window.lucide) lucide.createIcons();
}

function batchSelectAll(v) {
  document.querySelectorAll('.batch-cb').forEach(cb => cb.checked = v);
}

async function doBatchImport() {
  const checked = [...document.querySelectorAll('.batch-cb:checked')].map(cb => cb.value);
  if (!checked.length) { toast('กรุณาเลือกอย่างน้อย 1 ไฟล์', 'warning'); return; }

  document.getElementById('batchImportModal').remove();
  toast(`กำลังนำเข้า ${checked.length} ไฟล์...`, 'info');

  let ok = 0, fail = 0;
  for (const f of checked) {
    try {
      const res  = await fetch('http://localhost:8080/templates/read?name=' + encodeURIComponent(f));
      const data = await res.json();
      let content = '';

      if (f.toLowerCase().endsWith('.txt')) {
        content = atob(data.base64);
      } else if (f.toLowerCase().endsWith('.docx') && typeof mammoth !== 'undefined') {
        const bin = atob(data.base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
        content = result.value;
      }

      if (content) {
        storage.saveExample({
          name: f.replace(/\.(docx|txt|doc)$/i, ''),
          category: 'ทั่วไป',
          tag: 'ทั่วไป',
          content
        });
        ok++;
      }
    } catch(e) { fail++; }
  }

  toast(`นำเข้าสำเร็จ ${ok} ไฟล์${fail ? ` (ล้มเหลว ${fail})` : ''} ✓`, ok > 0 ? 'success' : 'error');
  renderExamples(exState.q, exState.category);
}

// ── Import single agent file ──
async function importAgentFile(f) {
  toast('กำลังนำเข้า ' + f + '...', 'info');
  try {
    const res  = await fetch('http://localhost:8080/templates/read?name=' + encodeURIComponent(f));
    const data = await res.json();
    let content = '';
    if (f.toLowerCase().endsWith('.txt')) {
      content = atob(data.base64);
    } else if (f.toLowerCase().endsWith('.docx') && typeof mammoth !== 'undefined') {
      const bin = atob(data.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
      content = result.value;
    }
    if (content) {
      storage.saveExample({ name: f.replace(/\.(docx|txt|doc)$/i,''), category:'ทั่วไป', tag:'ทั่วไป', content });
      toast('นำเข้าสำเร็จ ✓', 'success');
      renderExamples(exState.q, exState.category);
    } else {
      toast('ไม่สามารถอ่านเนื้อหาไฟล์ได้', 'error');
    }
  } catch(e) { toast('นำเข้าล้มเหลว', 'error'); }
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

function useExample(id) {
  const ex = storage.getExampleById(id);
  if (!ex) return;
  openUseExampleModal(ex);
}

function openUseExampleModal(ex) {
  state.activeExternalExample = ex;
  document.getElementById('useExModal')?.remove();
  const m = document.createElement('div');
  m.id = 'useExModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal modal-sm">
      <div class="modal-hdr">
        <h3>ใช้ตัวอย่าง: ${escHtml(ex.name)}</h3>
        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('useExModal').remove()">
          <i data-lucide="x" style="width:16px;height:16px"></i>
        </button>
      </div>
      <div class="modal-body">
        <p style="font-size:13.5px;color:#6b6b6b;margin-bottom:16px">เลือกประเภทบันทึกที่ต้องการสร้าง แล้วระบบจะเปิดฟอร์มพร้อมข้อความตัวอย่างประกอบ</p>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${DOCUMENT_TYPES.map(t => `
            <button class="example-card" style="cursor:pointer;border:1px solid var(--border)"
              onclick="document.getElementById('useExModal').remove(); startNewFromExample('${t.id}', '${ex.id}')">
              <div class="example-icon" style="background:transparent;border:none;font-size:10px">
                <span style="display:block;width:10px;height:10px;border-radius:50%;background:${t.color}"></span>
              </div>
              <div class="example-info">
                <div class="example-name">${escHtml(t.name)}</div>
                <div class="example-meta">${escHtml(t.desc)}</div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
  if (window.lucide) lucide.createIcons();
}

function startNewFromExample(typeId, exId) {
  let ex = storage.getExampleById(exId);
  if (!ex && state.activeExternalExample && state.activeExternalExample.id === exId) {
    ex = state.activeExternalExample;
  }
  state.selectedType = typeId;
  state.formData     = {};
  state.editingId    = null;
  // Pre-fill profile
  const s = storage.getSettings();
  if (s.defaultProfile) {
    const p = s.defaultProfile;
    Object.assign(state.formData, {
      officerRank: p.rank, officerName: p.name,
      officerPos: p.pos, station: p.station, province: p.province,
    });
  }
  // Auto-fill full text if it's the free text form
  if (typeId === 'custom_text' && ex) {
    state.formData.customContent = ex.content;
  }
  showPageNew();
  renderForm();
  // Show example as a side note only if structured form
  if (ex && typeId !== 'custom_text') {
    showExampleSideNote(ex);
    toast('เปิดตัวอย่างที่มุมขวาล่างเพื่ออ้างอิง');
  } else if (typeId === 'custom_text') {
    toast('นำข้อความจากตัวอย่างใส่ลงในฟอร์มแล้ว');
  }
}

function showExampleSideNote(ex) {
  document.getElementById('exSideNote')?.remove();
  const note = document.createElement('div');
  note.id = 'exSideNote';
  note.style.cssText = `
    position:fixed; right:24px; bottom:80px; width:360px; max-height:300px;
    background:var(--bg); border:1px solid var(--border); border-radius:8px;
    box-shadow:0 8px 24px rgba(0,0,0,.12); z-index:888;
    display:flex; flex-direction:column; overflow:hidden;
  `;
  note.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg-page)">
      <span style="font-size:12px;font-weight:600;color:var(--text-2)">ตัวอย่าง: ${escHtml(ex.name)}</span>
      <button onclick="document.getElementById('exSideNote').remove()"
        style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--text-3)">✕</button>
    </div>
    <div style="overflow-y:auto;flex:1;padding:12px 14px">
      <pre style="font-family:'TH SarabunPSK', 'TH Sarabun New', 'Sarabun', serif;font-size:14pt;white-space:pre-wrap;line-height:1.6;color:var(--text)">${escHtml(ex.content || '')}</pre>
    </div>
  `;
  document.body.appendChild(note);
}

function deleteExample(id) {
  if (!confirm('ต้องการลบตัวอย่างนี้?')) return;
  storage.deleteExample(id);
  AI.activeExampleIds.delete(id);
  if (exState.previewId === id) closePreviewPanel();
  renderExamples(exState.q, exState.category);
}

// ── Save current form as Template (called from form page) ──
function saveFormAsTemplate() {
  const type = getDocType(state.selectedType);
  if (!type) { toast('กรุณาเลือกประเภทบันทึกก่อน', 'warning'); return; }
  const preview = document.getElementById('previewText')?.innerText || document.getElementById('previewText')?.textContent || '';
  if (!preview.trim()) { toast('กรุณาร่างบันทึกก่อนบันทึกเป็นแม่แบบ', 'warning'); return; }

  document.getElementById('saveTemplateModal')?.remove();
  const m = document.createElement('div');
  m.id = 'saveTemplateModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal modal-sm">
      <div class="modal-hdr">
        <h3>บันทึกเป็นแม่แบบ</h3>
        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('saveTemplateModal').remove()">
          <i data-lucide="x" style="width:16px;height:16px"></i>
        </button>
      </div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label class="fld-label">ชื่อแม่แบบ</label>
          <input id="saveTplName" class="fld-input" type="text" value="${escHtml(type.name)} — ${new Date().toLocaleDateString('th-TH')}" placeholder="ชื่อแม่แบบ">
        </div>
        <div>
          <label class="fld-label">หมวดหมู่</label>
          <select id="saveTplCat" class="fld-input">
            ${CATEGORIES.map(c => `<option value="${c}" ${c===type.name?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="padding:16px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="document.getElementById('saveTemplateModal').remove()">ยกเลิก</button>
        <button class="btn btn-primary" onclick="confirmSaveFormAsTemplate()">
          <i data-lucide="save" style="width:14px;height:14px"></i> บันทึก
        </button>
      </div>
    </div>
  `;
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
  if (window.lucide) lucide.createIcons();
  document.getElementById('saveTplName').focus();

  // store preview text for later
  m._previewContent = preview;
}

function confirmSaveFormAsTemplate() {
  const name    = document.getElementById('saveTplName').value.trim();
  const cat     = document.getElementById('saveTplCat').value;
  const m       = document.getElementById('saveTemplateModal');
  const content = m._previewContent || '';
  if (!name) { toast('กรุณาใส่ชื่อแม่แบบ', 'warning'); return; }
  storage.saveExample({ name, category: cat, tag: cat, content });
  m.remove();
  toast('บันทึกเป็นแม่แบบแล้ว ✓', 'success');
}

// ════════════════════════════════════════════
//  SETTINGS

// ════════════════════════════════════════════
function renderSettings() {
  const el       = document.getElementById('page-settings');
  const profiles = storage.getProfiles();
  const settings = storage.getSettings();

  el.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">ตั้งค่า</h1>
    </div>

    <!-- Profiles -->
    <div class="settings-box">
      <div class="settings-box-hdr">
        <h2>โปรไฟล์พนักงานสอบสวน</h2>
        <p class="text-muted">บันทึกข้อมูลเพื่อกรอกอัตโนมัติเมื่อสร้างบันทึกใหม่</p>
      </div>
      <div class="settings-box-body">
        <div id="profileList" style="margin-bottom:10px">
          ${profiles.map((p, i) => profileCard(p, i)).join('')}
        </div>
        <button class="btn btn-secondary" onclick="openProfileModal(null,-1)">+ เพิ่มโปรไฟล์</button>
      </div>
    </div>

    <!-- Default profile -->
    <div class="settings-box">
      <div class="settings-box-hdr">
        <h2>โปรไฟล์เริ่มต้น</h2>
        <p class="text-muted">โปรไฟล์ที่จะโหลดอัตโนมัติทุกครั้ง</p>
      </div>
      <div class="settings-box-body">
        <div class="field-group" style="max-width:320px">
          <label class="fld-label">เลือกโปรไฟล์ที่ใช้บ่อย</label>
          <select class="fld-input" onchange="setDefaultProfile(this.value)">
            <option value="">— ไม่เลือก —</option>
            ${profiles.map((p, i) => `
              <option value="${i}" ${settings.defaultProfileIdx == i ? 'selected' : ''}>${p.rank} ${p.name}</option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- Gemini API Key -->
    <div class="settings-box">
      <div class="settings-box-hdr">
        <h2>ผู้ช่วย AI (Gemini)</h2>
        <p class="text-muted">สร้าง API Key ได้ฟรีที่ aistudio.google.com</p>
      </div>
      <div class="settings-box-body">
        <div class="field-group" style="max-width:480px">
          <label class="fld-label">API Key</label>
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <input type="password" id="geminiKeyInput" class="fld-input"
              placeholder="AIza..."
              value="${esc(settings.geminiApiKey || '')}">
          </div>
          
          <label class="fld-label">เวอร์ชั่นของ AI</label>
          <div style="display:flex;gap:8px">
            <select id="geminiModelSelect" class="fld-input">
              <option value="gemini-2.5-flash" ${settings.geminiModel === 'gemini-2.5-flash' || !settings.geminiModel ? 'selected' : ''}>Gemini 2.5 Flash (ใหม่ล่าสุด เร็ว)</option>
              <option value="gemini-1.5-flash" ${settings.geminiModel === 'gemini-1.5-flash' ? 'selected' : ''}>Gemini 1.5 Flash (แนะนำหาก 2.5 ล่ม/ไม่ว่าง)</option>
              <option value="gemini-1.5-pro" ${settings.geminiModel === 'gemini-1.5-pro' ? 'selected' : ''}>Gemini 1.5 Pro (ฉลาดแต่คิวอาจยาว)</option>
            </select>
            <button class="btn btn-secondary" onclick="saveApiKey()">บันทึก</button>
          </div>
          <span style="font-size:11.5px;color:var(--text-3);margin-top:8px;display:block;line-height:1.5;">
            API Key จะถูกเก็บในเบราว์เซอร์นี้เท่านั้น<br>
            <span style="color:#eab308;font-weight:600;">* หากพบ Error: "High demand" หรือ "Unavailable" ให้เปลี่ยนเป็น 1.5 Flash ครับ</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Danger -->
    <div class="settings-box danger-box">
      <div class="settings-box-hdr">
        <h2>ลบข้อมูล</h2>
        <p class="text-muted">ลบบันทึกและข้อมูลทั้งหมดออกจากเบราว์เซอร์นี้</p>
      </div>
      <div class="settings-box-body">
        <button class="btn btn-danger" onclick="clearAll()">ลบข้อมูลทั้งหมด</button>
      </div>
    </div>
  `;
}

function profileCard(p, i) {
  return `<div class="profile-card">
    <div class="pc-info">
      <span class="pc-rank">${esc(p.rank)}</span>
      <span class="pc-name">${esc(p.name)}</span>
      <span class="pc-pos">${esc(p.pos)} สภ.${esc(p.station)} จว.${esc(p.province)}</span>
    </div>
    <div style="display:flex;gap:4px">
      <button class="btn btn-sm btn-ghost"  onclick="openProfileModal(${i}, ${i})">แก้ไข</button>
      <button class="btn btn-sm btn-danger" onclick="deleteProfile(${i})">ลบ</button>
    </div>
  </div>`;
}

function openProfileModal(editIdx, saveIdx) {
  document.getElementById('profileModal')?.remove();
  const profiles = storage.getProfiles();
  const p = editIdx !== null ? profiles[editIdx] : null;
  const m = document.createElement('div');
  m.id = 'profileModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal modal-sm">
      <div class="modal-hdr">
        <h3>${saveIdx >= 0 ? 'แก้ไข' : 'เพิ่ม'}โปรไฟล์</h3>
        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('profileModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="fields-grid">
          <div class="field-group">
            <label class="fld-label">ยศ</label>
            <select id="pRank" class="fld-input">
              ${RANKS.map(r => `<option ${p?.rank === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <div class="field-group">
            <label class="fld-label">ชื่อ-สกุล</label>
            <input id="pName" type="text" class="fld-input" value="${esc(p?.name || '')}">
          </div>
          <div class="field-group">
            <label class="fld-label">ตำแหน่ง</label>
            <select id="pPos" class="fld-input">
              ${POSITIONS.map(r => `<option ${p?.pos === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <div class="field-group">
            <label class="fld-label">สถานี (ไม่ต้องพิมพ์ สภ.)</label>
            <input id="pStation" type="text" class="fld-input" value="${esc(p?.station || '')}">
          </div>
          <div class="field-group field-full">
            <label class="fld-label">จังหวัด</label>
            <input id="pProvince" type="text" class="fld-input" value="${esc(p?.province || '')}">
          </div>
        </div>
      </div>
      <div class="modal-ftr">
        <button class="btn btn-primary" onclick="saveProfile(${saveIdx})">บันทึก</button>
        <button class="btn btn-ghost" onclick="document.getElementById('profileModal').remove()">ยกเลิก</button>
      </div>
    </div>`;
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
}

function saveProfile(idx) {
  const profiles = storage.getProfiles();
  const p = {
    rank:     document.getElementById('pRank').value,
    name:     document.getElementById('pName').value.trim(),
    pos:      document.getElementById('pPos').value,
    station:  document.getElementById('pStation').value.trim(),
    province: document.getElementById('pProvince').value.trim(),
  };
  if (!p.name) { alert('กรุณาระบุชื่อ'); return; }
  if (idx >= 0) profiles[idx] = p; else profiles.push(p);
  storage.saveProfiles(profiles);
  document.getElementById('profileModal')?.remove();
  renderSettings();
  toast('บันทึกโปรไฟล์แล้ว');
}

function deleteProfile(idx) {
  if (!confirm('ต้องการลบโปรไฟล์นี้?')) return;
  const profiles = storage.getProfiles();
  profiles.splice(idx, 1);
  storage.saveProfiles(profiles);
  renderSettings();
}

function setDefaultProfile(idx) {
  const s = storage.getSettings();
  s.defaultProfileIdx = idx;
  s.defaultProfile    = idx !== '' ? storage.getProfiles()[parseInt(idx)] : null;
  storage.saveSettings(s);
}

function clearAll() {
  if (!confirm('ต้องการลบข้อมูลทั้งหมด? ไม่สามารถกู้คืนได้')) return;
  storage.clearAll();
  navigate('dashboard');
  toast('ล้างข้อมูลแล้ว');
}

function saveApiKey() {
  const key = document.getElementById('geminiKeyInput')?.value.trim();
  const model = document.getElementById('geminiModelSelect')?.value || 'gemini-2.5-flash';
  const s = storage.getSettings();
  s.geminiApiKey = key;
  s.geminiModel = model;
  storage.saveSettings(s);
  toast('บันทึกการตั้งค่า AI แล้ว');
}

// ════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════
const THAI_DAY = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const THAI_MON = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function nowThai() {
  const n = new Date();
  return `วัน${THAI_DAY[n.getDay()]}ที่ ${n.getDate()} ${THAI_MON[n.getMonth()]} ${n.getFullYear() + 543}`;
}

function dateSuffix() {
  const n = new Date();
  return `_${n.getFullYear()+543}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}`;
}

function esc(s)     { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function toast(msg) {
  document.getElementById('toast')?.remove();
  const t = document.createElement('div');
  t.id = 'toast'; t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast-show'));
  setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 400); }, 3000);
}



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
    const safeName = ex.name.replace(/[\/\\?%*:|"<>]/g, '-');
    const html = convertToHtml(ex.content);
    const docxBlob = htmlDocx.asBlob(html);
    zip.file(safeName + '.docx', docxBlob);
    count++;
  }

  zip.generateAsync({type:"blob"}).then(function(content) {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Templates_All.zip";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast(`ดาวน์โหลดสำเร็จ ${count} ไฟล์ (อยู่ในไฟล์ Templates_All.zip)`);
      }, 100);
  });
}

