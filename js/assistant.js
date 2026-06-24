'use strict';

// ════════════════════════════════════════════
//  AI ASSISTANT — Gemini-powered chat
//  สว.ช่วยเขียน v1.2
// ════════════════════════════════════════════

const AI = {
  // Chat history for multi-turn conversation
  history: [],

  // Which example IDs are toggled ON as context
  activeExampleIds: new Set(),

  // Gemini API endpoint base
  getApiUrl() {
    const model = storage.getSettings().geminiModel || 'gemini-2.5-flash';
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  },

  // Google Search grounding toggle
  searchEnabled: false,

  // ── Build system prompt ──
  buildSystemPrompt() {
    const profile  = storage.getSettings().defaultProfile;
    const examples = storage.getExamples().filter(ex => this.activeExampleIds.has(ex.id));

    let sys = `คุณคือผู้ช่วยพนักงานสอบสวนผู้เชี่ยวชาญ ชื่อ "สว.ช่วยเขียน"
ความเชี่ยวชาญของคุณคือการร่างบันทึกประจำวัน (ปจว.) ตามคำสั่งกรมตำรวจที่ 419/2557 และแนวปฏิบัติที่ถูกต้อง

กฎการร่างบันทึกประจำวัน:
- ใช้ภาษาราชการที่สุภาพ เป็นทางการ กระชับ ชัดเจน
- ต้องระบุ "อ้าง ปจว.ข้อ..." เมื่อเป็นการรับเรื่องต่อเนื่อง
- ระบุยศ ชื่อ ตำแหน่ง สังกัด ของพนักงานสอบสวนที่รายงาน
- ระบุวัน เวลา สถานที่เกิดเหตุอย่างชัดเจน
- สำหรับคดีอาญาต้องระบุฐานความผิดและเลขคดี
- ลงท้ายด้วย "จึงบันทึกไว้เป็นหลักฐาน" ทุกครั้ง
- การเว้นวรรคใช้รูปแบบเดียวกับตัวอย่างที่กำหนด
- ปีพุทธศักราช ไม่ใช่คริสต์ศักราช`;

    if (profile) {
      sys += `\n\nข้อมูลพนักงานสอบสวนประจำ:
- ยศ: ${profile.rank}
- ชื่อ-สกุล: ${profile.name}
- ตำแหน่ง: ${profile.pos}
- สถานี: สภ.${profile.station}
- จังหวัด: จว.${profile.province}`;
    }

    if (examples.length > 0) {
      sys += '\n\n══════════════════════════════════\nตัวอย่างการเขียนบันทึกประจำวันที่ถูกต้อง (ใช้เป็นแม่แบบ):\n══════════════════════════════════';
      examples.forEach((ex, i) => {
        sys += `\n\n[ตัวอย่างที่ ${i + 1}: ${ex.name}${ex.tag ? ' — ' + ex.tag : ''}]\n${ex.content}`;
      });
      sys += '\n══════════════════════════════════';
    }

    sys += `\n\nเมื่อผู้ใช้ขอให้ร่างบันทึกประจำวัน:
1. ร่างเนื้อหาที่สมบูรณ์พร้อมใช้งาน โดยยึดรูปแบบจากตัวอย่างข้างต้น
2. หากข้อมูลไม่ครบ ให้ใช้ "..." หรือ "[ระบุ...]" แทน แล้วแจ้งว่าขาดข้อมูลอะไร
3. หลังร่างแล้วสรุปสั้นๆ ว่าต้องกรอกข้อมูลเพิ่มเติมอะไรบ้าง
4. ตอบเป็นภาษาไทยเสมอ`;

    return sys;
  },

  // ── Call Gemini API ──
  async sendMessage(userText, apiKey) {
    const systemPrompt = this.buildSystemPrompt();

    // Build contents array (multi-turn)
    const contents = [];

    // History
    this.history.forEach(h => {
      contents.push({ role: h.role, parts: [{ text: h.text }] });
    });

    // Current user message
    contents.push({ role: 'user', parts: [{ text: userText }] });

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      }
    };

    // Enable Google Search grounding when toggled on
    if (this.searchEnabled) {
      payload.tools = [{ google_search: {} }];
    }

    const res = await fetch(`${this.getApiUrl()}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];

    // Collect all text parts (some responses split across parts)
    const parts = candidate?.content?.parts || [];
    const reply = parts.map(p => p.text || '').join('').trim() || '(ไม่มีคำตอบ)';

    // Extract grounding sources if search was used
    const groundingMeta = candidate?.groundingMetadata;
    const sources = (groundingMeta?.groundingChunks || []).map(c => ({
      title: c.web?.title || c.retrievedContext?.title || '',
      uri:   c.web?.uri   || c.retrievedContext?.uri   || '',
    })).filter(s => s.uri);

    // Save to history (include sources metadata)
    this.history.push({ role: 'user',  text: userText });
    this.history.push({ role: 'model', text: reply, sources });

    // Keep last 20 turns to avoid token overflow
    if (this.history.length > 40) this.history = this.history.slice(-40);

    return reply;
  },

  async extractFormDataWithAI(rawText, formFields, apiKey) {
    if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน AI');
    if (!rawText.trim()) throw new Error('กรุณาใส่ข้อความที่ต้องการให้ AI แยกข้อมูล');
    
    // Prepare the schema definition for the prompt
    const fieldDescriptions = formFields.map(f => `- "${f.id}": ${f.label} (ชนิด: ${f.type})`).join('\\n');
    
    const prompt = `
คุณเป็นผู้ช่วยตำรวจไทย ทำหน้าที่ดึงข้อมูลจากข้อความดิบ (raw text) เพื่อนำไปหยอดลงในฟอร์มบันทึกประจำวัน
ข้อความดิบ:
"""
${rawText}
"""

รายชื่อฟิลด์ในฟอร์ม (id: คำอธิบาย):
${fieldDescriptions}

คำสั่ง:
1. วิเคราะห์ข้อความดิบและสกัดข้อมูลที่เกี่ยวข้องกับฟิลด์ต่างๆ ให้แม่นยำที่สุด
2. ส่งกลับผลลัพธ์ในรูปแบบ JSON object เท่านั้น โดยใช้ key เป็น "id" ของฟิลด์ และ value เป็นค่าที่สกัดได้
3. หากฟิลด์ไหนไม่มีข้อมูลในข้อความ ให้ใช้ value เป็น "" (string ว่าง)
4. ห้ามส่งข้อความอื่นนอกเหนือจาก JSON
`;

    try {
      const res = await fetch(`${this.getApiUrl()}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return JSON.parse(reply);
    } catch (err) {
      throw err;
    }
  },

  async validateLog(logText, apiKey) {
    if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน AI');
    if (!logText.trim()) throw new Error('ไม่มีข้อความให้ตรวจสอบ');

    const prompt = `
คุณคือผู้ตรวจทานบันทึกประจำวันของพนักงานสอบสวนตามระเบียบสำนักงานตำรวจแห่งชาติ (ตร.419)
โปรดตรวจสอบบันทึกประจำวันต่อไปนี้ ว่ามีองค์ประกอบครบถ้วนตามหลักการเขียนหรือไม่
เช่น ขาดวันเวลาสถานที่เกิดเหตุ, ขาดชื่อผู้แจ้ง/ผู้เสียหาย, ขาดข้อหา/ความผิด, หรือมีข้อมูลสำคัญใดหายไป

ข้อความ:
"""
${logText}
"""

คำสั่ง:
- ตอบสั้นๆ ชี้เป้าว่าขาดอะไรบ้าง (เป็นข้อๆ)
- ถ้าครบถ้วนสมบูรณ์ดีแล้ว ให้ตอบว่า "✅ บันทึกนี้มีความครบถ้วนสมบูรณ์ดี สามารถนำไปใช้งานได้ครับ"
- ห้ามแก้หรือร่างข้อความให้ใหม่ ให้ตอบเฉพาะจุดที่ต้องแก้ไข/เพิ่มเติมเท่านั้น
`;

    try {
      const res = await fetch(`${this.getApiUrl()}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'ไม่มีคำตอบจาก AI';
    } catch (err) {
      throw err;
    }
  },

  async refineTone(logText, apiKey) {
    if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน AI');
    if (!logText.trim()) throw new Error('ไม่มีข้อความให้เกลาภาษา');

    const prompt = `
คุณคือผู้เชี่ยวชาญด้านงานสอบสวนของสำนักงานตำรวจแห่งชาติ
กรุณาเกลาภาษาของข้อความต่อไปนี้ ให้เป็น "สำนวนตำรวจที่ถูกต้องตามระเบียบ ตร.419"
มีความเป็นทางการ กระชับ สละสลวย และน่าเชื่อถือ

ข้อความต้นฉบับ:
"""
${logText}
"""

คำสั่ง:
- ส่งกลับเฉพาะข้อความที่เกลาภาษาแล้วเท่านั้น ห้ามมีคำอธิบายเพิ่มเติม
- โครงสร้างและข้อมูลสำคัญต้องอยู่ครบถ้วน
`;

    try {
      const res = await fetch(`${this.getApiUrl()}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      return data.candidates?.[0]?.content?.parts?.[0]?.text || logText;
    } catch (err) {
      throw err;
    }
  },

  clearHistory() {
    this.history = [];
  }
};

// ════════════════════════════════════════════
//  RENDER ASSISTANT PAGE
// ════════════════════════════════════════════
function renderAssistant() {
  const el       = document.getElementById('page-assistant');
  const apiKey   = storage.getSettings().geminiApiKey || '';
  const examples = storage.getExamples();

  // Init all examples as active context if none selected yet
  if (AI.activeExampleIds.size === 0 && examples.length > 0) {
    examples.forEach(ex => AI.activeExampleIds.add(ex.id));
  }

  el.innerHTML = `
    <div class="page-header" style="margin-bottom:16px">
      <div>
        <h1 class="page-title">ผู้ช่วย AI</h1>
        <p class="page-sub">ร่างบันทึกประจำวันด้วย Gemini AI</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="AI.clearHistory();renderAssistantMessages()">ล้างบทสนทนา</button>
      </div>
    </div>

    ${!apiKey ? `
      <div class="api-notice">
        ⚠️ ยังไม่ได้ตั้งค่า Gemini API Key — ไปที่
        <a href="#" onclick="navigate('settings')">ตั้งค่า</a>
        เพื่อกรอก API Key ก่อนใช้งานผู้ช่วย AI
        <br><small style="opacity:.7">สร้าง API Key ฟรีได้ที่ aistudio.google.com</small>
      </div>
    ` : ''}

    <div class="assistant-layout">
      <!-- Chat area -->
      <div class="chat-main">
        <div class="chat-messages" id="chatMessages">
          ${renderChatMessages()}
        </div>
        <div class="chat-input-area">
          <div class="chat-input-row">
            <textarea id="chatInput" class="chat-textarea" rows="1"
              placeholder="พิมพ์คำขอ เช่น &quot;ร่างประจำวันรับแจ้งเหตุ รถชน ผู้บาดเจ็บชื่อ นายสมชาย...&quot;"
              onkeydown="handleChatKey(event)"
              oninput="autoResizeChat(this)"></textarea>
            <button id="searchToggleBtn"
              onclick="toggleSearchMode()"
              title="เปิด/ปิด Google Search Grounding"
              style="background:${AI.searchEnabled ? 'var(--accent)' : 'transparent'};color:${AI.searchEnabled ? '#fff' : 'inherit'};border:1px solid var(--border2);border-radius:7px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;flex-shrink:0;transition:background .12s,border-color .12s;">🔍</button>
            <button class="chat-send-btn" id="chatSendBtn"
              onclick="sendChatMessage()" ${!apiKey ? 'disabled' : ''} title="ส่ง (Enter)">
              ➤
            </button>
          </div>
          <div class="chat-hint" id="chatHint">Enter เพื่อส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · 🔍 = Google Search</div>
        </div>
      </div>

      <!-- Context sidebar -->
      <div class="chat-context">
        <div class="chat-context-hdr">ตัวอย่างอ้างอิง</div>
        <div class="chat-context-body" id="chatContextList">
          ${renderContextList(examples)}
        </div>
      </div>
    </div>
  `;
}

function renderContextList(examples) {
  if (!examples.length) {
    return `<div style="padding:12px 8px;font-size:12.5px;color:var(--text-3);line-height:1.6">
      ยังไม่มีตัวอย่างไฟล์<br>
      <a class="link" href="#" onclick="navigate('examples')" style="font-size:12px">+ อัพโหลดไฟล์</a>
    </div>`;
  }
  return examples.map(ex => {
    const on = AI.activeExampleIds.has(ex.id);
    return `<div class="context-item ${on ? 'active' : ''}" onclick="toggleExampleContext('${ex.id}')">
      <span class="context-dot ${on ? '' : 'off'}"></span>
      <span class="context-label" title="${escHtml(ex.name)}">${escHtml(ex.name)}</span>
    </div>`;
  }).join('');
}

function toggleExampleContext(id) {
  if (AI.activeExampleIds.has(id)) {
    AI.activeExampleIds.delete(id);
  } else {
    AI.activeExampleIds.add(id);
  }
  // Re-render context list
  const examples = storage.getExamples();
  const list = document.getElementById('chatContextList');
  if (list) list.innerHTML = renderContextList(examples);
}

function renderChatMessages() {
  if (AI.history.length === 0) {
    return `<div class="chat-welcome">
      <div class="chat-welcome-icon">◎</div>
      <h2>ผู้ช่วยพนักงานสอบสวน</h2>
      <p>ผมช่วยร่างบันทึกประจำวันตามคำสั่ง ตร.419 ได้เลย
      บอกข้อมูลเหตุการณ์มา แล้วจะร่างข้อความให้ถูกรูปแบบ</p>
      <div class="chat-suggestions">
        <button class="chat-suggestion" onclick="useSuggestion(this.textContent)">ช่วยร่างประจำวันรับแจ้งเหตุ อุบัติเหตุรถชนคน</button>
        <button class="chat-suggestion" onclick="useSuggestion(this.textContent)">ช่วยร่างประจำวันรับเลขคดี แจ้งข้อกล่าวหาผู้ต้องหา</button>
        <button class="chat-suggestion" onclick="useSuggestion(this.textContent)">ช่วยร่างประจำวันรับแจ้งความ คดีฉ้อโกง</button>
        <button class="chat-suggestion" onclick="useSuggestion(this.textContent)">ช่วยปรับปรุงข้อความที่ผมร่างไว้ให้ถูกต้องกว่านี้</button>
      </div>
    </div>`;
  }

  return AI.history.map((h, i) => {
    const isUser = h.role === 'user';
    const isLast = i === AI.history.length - 1;
    const isAI   = !isUser;

    const actionBtns = isAI && isLast ? `
      <div class="msg-actions">
        <button class="btn btn-sm btn-secondary" onclick="copyAIMessage(${i})">คัดลอก</button>
        <button class="btn btn-sm btn-ghost" onclick="saveAIMessage(${i})">บันทึกเป็นตัวอย่าง</button>
        <button class="btn btn-sm btn-ghost" onclick="exportAIMessage(${i})">Export Word</button>
      </div>
    ` : '';

    return `<div class="msg ${isUser ? 'msg-user' : 'msg-ai'}">
      <div class="msg-avatar">${isUser ? 'ท่าน' : 'AI'}</div>
      <div class="msg-body">
        <div class="msg-bubble">${escHtml(h.text)}</div>
        ${actionBtns}
      </div>
    </div>`;
  }).join('');
}

function renderAssistantMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  container.innerHTML = renderChatMessages();
  scrollChatToBottom();
}

function scrollChatToBottom() {
  const container = document.getElementById('chatMessages');
  if (container) container.scrollTop = container.scrollHeight;
}

// ── Send message ──
async function sendChatMessage() {
  const input  = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const text   = input?.value.trim();
  if (!text) return;

  const apiKey = storage.getSettings().geminiApiKey;
  if (!apiKey) {
    toast('กรุณาตั้งค่า Gemini API Key ก่อน');
    navigate('settings');
    return;
  }

  // Add user message to UI immediately
  AI.history.push({ role: 'user', text });
  input.value = '';
  autoResizeChat(input);
  sendBtn.disabled = true;

  renderAssistantMessages();

  // Show typing indicator
  const container = document.getElementById('chatMessages');
  if (container) {
    const typing = document.createElement('div');
    typing.id = 'typingIndicator';
    typing.className = 'msg msg-ai';
    typing.innerHTML = `
      <div class="msg-avatar">AI</div>
      <div class="msg-body">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>`;
    container.appendChild(typing);
    scrollChatToBottom();
  }

  try {
    // Remove user message we manually pushed (sendMessage will push again)
    AI.history.pop();
    const reply = await AI.sendMessage(text, apiKey);
    document.getElementById('typingIndicator')?.remove();
    renderAssistantMessages();
  } catch (err) {
    document.getElementById('typingIndicator')?.remove();
    AI.history.push({ role: 'model', text: `❌ เกิดข้อผิดพลาด: ${err.message}\n\nกรุณาตรวจสอบ API Key ของท่านในหน้าตั้งค่า` });
    renderAssistantMessages();
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function autoResizeChat(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
}

function useSuggestion(text) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = text;
    autoResizeChat(input);
    input.focus();
  }
}

// ── Google Search toggle ──
function toggleSearchMode() {
  AI.searchEnabled = !AI.searchEnabled;
  const btn  = document.getElementById('searchToggleBtn');
  const hint = document.getElementById('chatHint');
  if (btn) {
    btn.style.background     = AI.searchEnabled ? 'var(--accent-bg)' : 'transparent';
    btn.style.borderColor    = AI.searchEnabled ? 'var(--accent)'    : 'var(--border2)';
    btn.title = AI.searchEnabled
      ? 'Google Search เปิดอยู่ — คลิกเพื่อปิด'
      : 'คลิกเพื่อเปิด Google Search Grounding';
  }
  if (hint) {
    hint.innerHTML = AI.searchEnabled
      ? 'Enter เพื่อส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · <span style="color:var(--accent);font-weight:600">🔍 Google Search เปิดอยู่</span>'
      : 'Enter เพื่อส่ง · Shift+Enter ขึ้นบรรทัดใหม่ · 🔍 = Google Search';
  }
  toast(AI.searchEnabled ? '🔍 Google Search เปิดแล้ว' : 'Google Search ปิดแล้ว');
}

// ── Message actions ──
function copyAIMessage(idx) {
  const h = AI.history[idx];
  if (!h) return;
  exporter.copyText(h.text).then(() => toast('คัดลอกแล้ว'));
}

function saveAIMessage(idx) {
  const h = AI.history[idx];
  if (!h) return;
  const name = `AI ร่าง — ${new Date().toLocaleDateString('th-TH')}`;
  storage.saveExample({ name, tag: 'AI', content: h.text });
  toast('บันทึกเป็นตัวอย่างแล้ว');
  // Refresh context list
  const examples = storage.getExamples();
  const list = document.getElementById('chatContextList');
  if (list) list.innerHTML = renderContextList(examples);
}

function exportAIMessage(idx) {
  const h = AI.history[idx];
  if (!h) return;
  exporter.toWord(`ปจว_AI_${dateSuffix()}`, h.text);
}
