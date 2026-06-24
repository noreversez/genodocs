const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');

const startIdx = content.indexOf('async function readSmartCard() {');
const nextFuncIdx = content.indexOf('function populateFieldsFromData', startIdx);

const newFunc = `async function readSmartCard() {
  toast('กำลังเชื่อมต่อเครื่องอ่านบัตร...', 'info');
  
  try {
    const res = await fetch('http://localhost:8080/');
    if (!res.ok) throw new Error('Agent HTTP error');
    
    const cardData = await res.json();
    if (cardData.error) {
      toast('อ่านบัตรไม่สำเร็จ: ' + cardData.error, 'error');
      return;
    }

    let filledCount = 0;
    
    let age = '';
    if (cardData.dob && cardData.dob.length === 10) {
        const parts = cardData.dob.split('-');
        if (parts.length === 3) {
           const birthYear = parseInt(parts[0], 10);
           const currentYear = new Date().getFullYear() + 543;
           age = (currentYear - birthYear).toString();
        }
    }

    const fieldsToFill = [
      { possibleIds: ['suspectId', 'driverId', 'accId', 'injId', 'compId'], val: cardData.citizenId },
      { possibleIds: ['suspectName', 'driverName', 'accName', 'injName', 'compName'], val: cardData.name },
      { possibleIds: ['suspectTitle', 'driverTitle', 'accTitle', 'injTitle', 'compTitle'], val: cardData.title },
      { possibleIds: ['suspectAge', 'driverAge', 'accAge', 'injAge', 'compAge'], val: age }, 
      { possibleIds: ['suspectHouseNo', 'driverHouseNo', 'accHouseNo', 'injHouseNo', 'compHouseNo'], val: cardData.address.split(' ')[0] },
      { possibleIds: ['suspectSubdistrict', 'driverSubdistrict', 'accSubdistrict', 'injSubdistrict', 'compSubdistrict'], val: '' },
      { possibleIds: ['suspectDistrict', 'driverDistrict', 'accDistrict', 'injDistrict', 'compDistrict'], val: '' },
      { possibleIds: ['suspectProvince', 'driverProvince', 'accProvince', 'injProvince', 'compProvince'], val: '' },
      { possibleIds: ['suspectNationality', 'driverNationality', 'accNationality', 'injNationality', 'compNationality'], val: 'ไทย' }
    ];

    fieldsToFill.forEach(mapping => {
      mapping.possibleIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value && mapping.val) {
          el.value = mapping.val;
          state.formData[id] = mapping.val;
          filledCount++;
          if (id.endsWith('Id') && typeof validateThaiId === 'function') {
             el.dispatchEvent(new Event('blur'));
          }
        }
      });
    });

    if (filledCount > 0) {
      toast(\`ดึงข้อมูลจากบัตรสำเร็จ (\${filledCount} ช่อง)\`, 'success');
      updatePreview();
    } else {
      toast('ไม่พบช่องข้อมูลที่รองรับในฟอร์มนี้ หรือข้อมูลเต็มแล้ว', 'warning');
    }

  } catch (err) {
    console.error(err);
    toast('ไม่พบโปรแกรมตัวกลาง (Agent) กรุณาเปิดโปรแกรมอ่านบัตรก่อนใช้งานครับ', 'error');
  }
}

`;

const newContent = content.substring(0, startIdx) + newFunc + content.substring(nextFuncIdx);
fs.writeFileSync('js/app.js', newContent, 'utf8');
