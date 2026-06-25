import codecs

with codecs.open('js/assistant.js', 'r', 'utf-8-sig') as f:
    content = f.read()

hdr_old = '<div class=\"chat-context-hdr\">ตัวอย่างอ้างอิง</div>'
hdr_new = '<div class=\"chat-context-hdr\" style=\"display:flex; justify-content:space-between; align-items:center;\">ตัวอย่างอ้างอิง <button class=\"btn btn-sm btn-ghost\" onclick=\"openManageAiExamplesModal()\">จัดการ</button></div>'
content = content.replace(hdr_old, hdr_new)

new_functions = '''
function openManageAiExamplesModal() {
  document.getElementById('manageAiExModal')?.remove();
  const m = document.createElement('div');
  m.id = 'manageAiExModal';
  m.className = 'modal-overlay';
  const examples = storage.getExamples();
  let listHtml = examples.map(ex => 
    <div style="border:1px solid var(--border); padding:10px; border-radius:6px; margin-bottom:10px;">
      <input type="text" id="ai_ex_name_" value="" class="input" style="margin-bottom:8px; width:100%;">
      <textarea id="ai_ex_content_" class="input" rows="4" style="width:100%; font-size:13px; line-height:1.5;"></textarea>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
        <button class="btn btn-sm btn-ghost" onclick="deleteAiExample('')" style="color:var(--danger)">ลบ</button>
        <button class="btn btn-sm btn-primary" onclick="saveAiExampleEdit('')">บันทึก</button>
      </div>
    </div>
  ).join('');

  m.innerHTML = 
    <div class="modal" style="max-width:600px; width:90%; max-height:90vh; display:flex; flex-direction:column;">
      <div class="modal-hdr" style="flex-shrink:0;">
        <h3>จัดการตัวอย่างอ้างอิง AI</h3>
        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('manageAiExModal').remove()">ปิด</button>
      </div>
      <div class="modal-body" style="overflow-y:auto; flex-grow:1;">
        <p style="font-size:13px; color:var(--text-3); margin-bottom:15px;">แก้ไขข้อความตัวอย่างที่ AI ใช้เป็นแม่แบบในการร่างบันทึกประจำวัน</p>
        
      </div>
    </div>
  ;
  document.body.appendChild(m);
}

function saveAiExampleEdit(id) {
  const name = document.getElementById('ai_ex_name_' + id).value.trim();
  const content = document.getElementById('ai_ex_content_' + id).value.trim();
  if (!name || !content) return toast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
  
  let list = storage.getExamples();
  const idx = list.findIndex(e => e.id === id);
  if (idx !== -1) {
    list[idx].name = name;
    list[idx].content = content;
    localStorage.setItem(storage.K.EXAMPLES, JSON.stringify(list));
    toast('บันทึกการแก้ไขแล้ว', 'success');
    document.getElementById('manageAiExModal').remove();
    // Refresh context list
    const examples = storage.getExamples();
    const cList = document.getElementById('chatContextList');
    if (cList) cList.innerHTML = renderContextList(examples);
  }
}

function deleteAiExample(id) {
  if (!confirm('ยืนยันการลบตัวอย่างนี้?')) return;
  storage.deleteExample(id);
  AI.activeExampleIds.delete(id);
  toast('ลบตัวอย่างแล้ว', 'success');
  document.getElementById('manageAiExModal').remove();
  openManageAiExamplesModal();
  // Refresh context list
  const examples = storage.getExamples();
  const cList = document.getElementById('chatContextList');
  if (cList) cList.innerHTML = renderContextList(examples);
}
'''
content = content + "\\n" + new_functions

with codecs.open('js/assistant.js', 'w', 'utf-8-sig') as f:
    f.write(content)

print("DONE")
