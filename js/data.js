'use strict';

// ====================
// HELPERS
// ====================
const THAI_MONTHS_LONG  = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function thaiDate(dateStr, short = false) {
  if (!dateStr) return '..........';
  const [y, m, d] = dateStr.split('-').map(Number);
  const be = y + 543;
  if (short) return `${d} ${THAI_MONTHS_SHORT[m-1]}${String(be).slice(-2)}`;
  return `${d} ${THAI_MONTHS_LONG[m-1]} ${be}`;
}

function thaiTime(t) {
  if (!t) return '..........';
  return t.replace(':', '.');
}

// ====================
// CONSTANTS
// ====================
const RANKS = [
  'พล.ต.อ.','พล.ต.ท.','พล.ต.ต.',
  'พ.ต.อ.(พิเศษ)','พ.ต.อ.','พ.ต.ท.','พ.ต.ต.',
  'ร.ต.อ.','ร.ต.ท.','ร.ต.ต.',
  'ด.ต.','จ.ส.ต.','ส.ต.อ.','ส.ต.ท.','ส.ต.ต.'
];

const POSITIONS = [
  'สว.(สอบสวน)','รอง สว.(สอบสวน)','สว.','รอง สว.',
  'ผกก.','รอง ผกก.','สารวัตร','รองสารวัตร','ผบ.หมู่'
];

const TITLES = ['นาย','นาง','น.ส.','ด.ช.','ด.ญ.'];

const VEHICLE_TYPES = ['รถจักรยานยนต์','รถยนต์','รถกระบะ','รถบรรทุก','รถตู้'];

const REPORT_SOURCES = [
  'ศูนย์วิทยุสื่อสาร',
  'ทางโทรศัพท์',
  'ผ่านวิทยุสื่อสาร',
  'ผู้เสียหายมาแจ้ง',
  'ประชาชนแจ้ง'
];

// ฐานความผิดสำเร็จรูป
const CHARGE_PRESETS = [
  { label: 'ฉ้อโกง',        text: 'ฉ้อโกง' },
  { label: 'ฉ้อโกง+พรบ.คอม', text: 'ฉ้อโกง และโดยทุจริต หรือโดยหลอกลวง นําเข้าสู่ระบบคอมพิวเตอร์ซึ่งข้อมูลคอมพิวเตอร์ที่บิดเบือนหรือปลอมไม่ว่าทั้งหมดหรือบางส่วน หรือข้อมูลคอมพิวเตอร์อันเป็นเท็จ โดยประการที่น่าจะเกิดความเสียหายแก่บุคคลใดบุคคลหนึ่ง' },
  { label: 'ลักทรัพย์',      text: 'ลักทรัพย์' },
  { label: 'วิ่งราวทรัพย์',  text: 'วิ่งราวทรัพย์' },
  { label: 'ชิงทรัพย์',      text: 'ชิงทรัพย์' },
  { label: 'ปล้นทรัพย์',     text: 'ปล้นทรัพย์' },
  { label: 'ยักยอก',         text: 'ยักยอก' },
  { label: 'กรรโชก',         text: 'กรรโชกทรัพย์' },
  { label: 'ทำร้ายร่างกาย', text: 'ทำร้ายร่างกาย' },
  { label: 'ฆ่าโดยเจตนา',   text: 'ฆ่าผู้อื่นโดยเจตนา' },
  { label: 'พยายามฆ่า',      text: 'พยายามฆ่าผู้อื่น' },
  { label: 'ยาเสพติด',       text: 'มีไว้ในครอบครองเพื่อจำหน่ายซึ่งยาเสพติดให้โทษประเภท 1 (เมทแอมเฟตามีน)' },
];

// ====================
// DOCUMENT TYPES
// ====================
// *** เพิ่มประเภทใหม่ได้โดยเพิ่ม object ใน array นี้ ***
const DOCUMENT_TYPES = [

  // ────────────────────────────────────────────────────────────────────
  // ประเภทที่ 1: รับแจ้งเหตุ
  // ────────────────────────────────────────────────────────────────────
  {
    id:    'incident_report',
    name:  'รับแจ้งเหตุ',
    icon:  '🚨',
    color: '#ef4444',
    bg:    'rgba(239,68,68,0.12)',
    desc:  'รับแจ้งเหตุจากศูนย์วิทยุ/โทรศัพท์ แล้วออกตรวจที่เกิดเหตุ',

    sections: [
      {
        title: 'ข้อมูลเจ้าหน้าที่',
        fields: [
          { id:'officerRank', label:'ยศ',                             type:'select',   options:RANKS,     required:true },
          { id:'officerName', label:'ชื่อ-สกุล',                     type:'text',     placeholder:'นิรันต์  นวลบุญ', required:true },
          { id:'officerPos',  label:'ตำแหน่ง',                       type:'select',   options:POSITIONS, required:true },
          { id:'station',     label:'สถานี (ไม่ต้องพิมพ์ "สภ.")',   type:'text',     placeholder:'เมืองยะลา', required:true },
          { id:'province',    label:'จังหวัด',                        type:'text',     placeholder:'ยะลา', required:true },
        ]
      },
      {
        title: 'การรับแจ้ง',
        fields: [
          { id:'reportDate',         label:'วันที่รับแจ้ง',               type:'date', required:true },
          { id:'reportTime',         label:'เวลารับแจ้ง',                 type:'time', required:true },
          { id:'reportSource',       label:'รับแจ้งจาก',                  type:'select', options:REPORT_SOURCES },
          { id:'reportSourceDetail', label:'รายละเอียด (เช่น "สภ.เมืองยะลา")', type:'text', placeholder:'สภ.เมืองยะลา' },
        ]
      },
      {
        title: 'เหตุการณ์และสถานที่',
        fields: [
          { id:'incidentDesc',      label:'ลักษณะเหตุการณ์',             type:'text', placeholder:'รถจักรยานยนต์เฉี่ยวชนแผงกั้นริมถนน', required:true },
          { id:'incidentResult',    label:'ผลของเหตุ',                    type:'text', placeholder:'มีผู้ได้รับบาดเจ็บและทรัพย์สินได้รับความเสียหาย' },
          { id:'locStreet',         label:'ถนน/จุดเกิดเหตุ',             type:'text', placeholder:'ถนนสิโรรส (หน้าประปา)' },
          { id:'locSubdistrict',    label:'ตำบล',                         type:'text', placeholder:'สะเตง' },
          { id:'locDistrict',       label:'อำเภอ',                        type:'text', placeholder:'เมืองยะลา' },
          { id:'locProvince',       label:'จังหวัด',                      type:'text', placeholder:'ยะลา' },
          { id:'incidentDate',      label:'วันที่เกิดเหตุจริง',           type:'date', required:true },
          { id:'incidentTime',      label:'เวลาเกิดเหตุจริง',            type:'time', required:true },
        ]
      },
      {
        title: 'ยานพาหนะ (ถ้ามี)',
        fields: [
          { id:'vehType',     label:'ประเภทรถ',              type:'select', options:['(ไม่มี)',...VEHICLE_TYPES] },
          { id:'vehBrand',    label:'ยี่ห้อ',                type:'text',   placeholder:'ยามาฮ่า' },
          { id:'vehModel',    label:'รุ่น',                  type:'text',   placeholder:'ฟิน' },
          { id:'vehColor',    label:'สี',                    type:'text',   placeholder:'เทา แดง' },
          { id:'vehPlateRed', label:'ป้ายทะเบียนป้ายแดง',   type:'checkbox' },
          { id:'vehDealer',   label:'ชื่อร้านค้า (ป้ายแดง)', type:'text',  placeholder:'พินิตมอเตอร์' },
          { id:'vehPlate',    label:'หมายเลขทะเบียน',        type:'text',   placeholder:'ช-5947' },
          { id:'vehStorage',  label:'นำมาเก็บรักษาที่',      type:'text',   placeholder:'สภ.เมืองยะลา' },
        ]
      },
      {
        title: 'ผู้บาดเจ็บ / ผู้เกี่ยวข้อง',
        fields: [
          { id:'injTitle',       label:'คำนำหน้า',         type:'select', options:TITLES },
          { id:'injName',        label:'ชื่อ-สกุล',        type:'text',   placeholder:'นุชจรี  นวลคำสิงห์' },
          { id:'injId',          label:'เลขบัตรประชาชน',   type:'text',   placeholder:'1430200130476', maxLength:13 },
          { id:'injAge',         label:'อายุ (ปี)',         type:'number', placeholder:'36' },
          { id:'injHouseNo',     label:'บ้านเลขที่',        type:'text',   placeholder:'85' },
          { id:'injMoo',         label:'หมู่ที่',           type:'text',   placeholder:'3' },
          { id:'injSubdistrict', label:'ตำบล',              type:'text',   placeholder:'บาละ' },
          { id:'injDistrict',    label:'อำเภอ',             type:'text',   placeholder:'กาบัง' },
          { id:'injProvince',    label:'จังหวัด',           type:'text',   placeholder:'ยะลา' },
          { id:'injPhone',       label:'โทร',               type:'text',   placeholder:'081-8762525' },
          { id:'hospital',       label:'ส่งโรงพยาบาล',      type:'text',   placeholder:'รพ.ยะลา' },
        ]
      }
    ],

    generate(d) {
      const sta = `สภ.${d.station||'...'}`;
      const off = `${d.officerRank||'...'} ${d.officerName||'...'}  ${d.officerPos||'...'}${sta} จว.${d.province||'...'}`;

      // Report source
      let src = '';
      if (d.reportSource === 'ศูนย์วิทยุสื่อสาร') {
        src = `ศูนย์วิทยุสื่อสาร ${d.reportSourceDetail || sta}`;
      } else if (d.reportSource) {
        src = d.reportSource + (d.reportSourceDetail ? ' ' + d.reportSourceDetail : '');
      }

      // Location
      const loc = [
        d.locStreet||'',
        d.locSubdistrict ? `ต.${d.locSubdistrict}` : '',
        d.locDistrict    ? `อ.${d.locDistrict}`    : '',
        (d.locProvince||d.province) ? `จว.${d.locProvince||d.province}` : ''
      ].filter(Boolean).join(' ');

      // Vehicle
      let veh = '';
      if (d.vehType && d.vehType !== '(ไม่มี)' && d.vehBrand) {
        veh = `${d.vehType}  ยี่ห้อ${d.vehBrand}`;
        if (d.vehModel) veh += ` รุ่น${d.vehModel}`;
        if (d.vehColor) veh += ` สี${d.vehColor}`;
        if (d.vehPlateRed) {
          veh += ` ติดแผ่นป้ายทะเบียนป้ายแดง ${d.vehDealer||''}`;
        }
        if (d.vehPlate) veh += ` ${d.vehPlate}`;
      }

      // Injured address
      let injAddr = [
        d.injHouseNo ? `${d.injHouseNo}` : '',
        d.injMoo     ? `หมู่ที่ ${d.injMoo}` : '',
        d.injSubdistrict ? `ต.${d.injSubdistrict}` : '',
        d.injDistrict    ? `อ.${d.injDistrict}`    : '',
        d.injProvince    ? `จว.${d.injProvince}`   : ''
      ].filter(Boolean).join(' ');

      let text = `${off}  แจ้งว่าเมื่อวันที่ ${thaiDate(d.reportDate)} เวลาประมาณ  ${thaiTime(d.reportTime)} น.`;
      text += ` ได้รับแจ้งจาก${src||'...'}  เกิดเหตุ${d.incidentDesc||'...'}`;
      if (d.incidentResult) text += ` ${d.incidentResult}`;
      text += `    เหตุเกิด ${loc||'...'}  จึงเดินทางไปตรวจที่เกิดเหตุ`;

      if (veh) {
        const dmg = d.incidentDesc && d.incidentDesc.includes('ชน') ? 'เฉี่ยวชนได้รับความเสียหาย' : 'ได้รับความเสียหาย';
        text += ` พบ ${veh} จอดอยู่ริมถนน มีร่องรอยการ${dmg}`;
        if (d.injName && d.hospital) {
          text += `  ผู้ขับขี่ได้รับบาดเจ็บเจ้าหน้าที่กู้ภัยฯ นำตัวส่ง ${d.hospital}`;
        }
      }

      text += `\n     จากนั้น ได้ทำการตรวจสถานที่เกิดเหตุ ถ่ายภาพและวาดแผนที่เกิดเหตุ ไว้แล้ว`;
      if (veh && d.vehStorage) {
        text += `   ได้นำ${d.vehType||'รถ'}คันที่เกิดเหตุมาเก็บรักษา ที่ ${d.vehStorage}`;
      }

      if (d.injName) {
        text += `\n        ต่อมาได้เดินทางไป ห้องฉุกเฉิน ${d.hospital||'...'}  ทราบชื่อผู้ขับขี่ คือ ${d.injTitle||''}${d.injName}`;
        if (d.injId)  text += ` (${d.injId})`;
        if (d.injAge) text += `  อายุ ${d.injAge} ปี`;
        if (injAddr)  text += ` ที่อยู่ ${injAddr}`;
        if (d.injPhone) text += `  โทร ${d.injPhone}`;
      }

      text += `\n\tเหตุเกิด ${loc||'...'}   เมื่อวันที่ ${thaiDate(d.incidentDate)}  เวลาประมาณ ${thaiTime(d.incidentTime)} น.`;

      return text;
    }
  },

  // ────────────────────────────────────────────────────────────────────
  // ประเภทที่ 2: รับเลขคดี
  // ────────────────────────────────────────────────────────────────────
  {
    id:    'case_reg',
    name:  'รับเลขคดี',
    icon:  '📁',
    color: '#3b82f6',
    bg:    'rgba(59,130,246,0.12)',
    desc:  'อ้าง ปจว.เดิม รับคำร้องทุกข์เป็นคดีอาญา พร้อมระบุเลขคดี',

    sections: [
      {
        title: 'อ้างอิง ปจว.เดิม',
        fields: [
          { id:'refItem', label:'ปจว.ข้อที่', type:'number', placeholder:'8', required:true },
          { id:'refTime', label:'เวลา ปจว.เดิม', type:'time', required:true },
          { id:'refDate', label:'วันที่ ปจว.เดิม', type:'date', required:true },
        ]
      },
      {
        title: 'คู่กรณี',
        fields: [
          { id:'compTitle', label:'คำนำหน้า (ผู้เสียหาย)',     type:'select', options:TITLES },
          { id:'compName',  label:'ชื่อ-สกุล ผู้เสียหาย',      type:'text', placeholder:'พลภัทร   เจนจบเขตต์', required:true },
          { id:'accTitle',  label:'คำนำหน้า (ผู้ถูกกล่าวหา)', type:'select', options:TITLES },
          { id:'accName',   label:'ชื่อ-สกุล ผู้ถูกกล่าวหา',  type:'text', placeholder:'ขจร  กลิ่มหอม', required:true },
          { id:'chargeShort', label:'ความผิดเบื้องต้น (ย่อ)',  type:'text', placeholder:'ฉ้อโกง', required:true },
        ]
      },
      {
        title: 'พนักงานสอบสวน',
        fields: [
          { id:'officerRank', label:'ยศ',        type:'select', options:RANKS, required:true },
          { id:'officerName', label:'ชื่อ-สกุล', type:'text',   required:true },
          { id:'officerPos',  label:'ตำแหน่ง',   type:'select', options:POSITIONS, required:true },
          { id:'station',     label:'สถานี',      type:'text', placeholder:'เมืองยะลา', required:true },
          { id:'province',    label:'จังหวัด',    type:'text', placeholder:'ยะลา', required:true },
        ]
      },
      {
        title: 'ข้อมูลคดี',
        fields: [
          { id:'caseNo',   label:'เลขที่คดีอาญา', type:'text',     placeholder:'123' },
          { id:'caseYear', label:'ปี พ.ศ.',         type:'text',     placeholder:'2569', required:true },
          { id:'caseDate', label:'วันที่รับคดี',    type:'date',     required:true },
          { id:'chargeFull', label:'ฐานความผิดเต็ม (พิมพ์เอง หรือเลือกจากปุ่มด้านล่าง)',
            type:'textarea', rows:5,
            placeholder:'ฉ้อโกง และโดยทุจริต หรือโดยหลอกลวง...', required:true,
            presets: CHARGE_PRESETS  // ← ปุ่มสำเร็จรูป
          },
        ]
      }
    ],

    generate(d) {
      const sta = `สภ.${d.station||'...'}`;
      const off = `${d.officerRank||'...'} ${d.officerName||'...'}  ${d.officerPos||'...'}${sta} จว.${d.province||'...'}`;

      let text = `อ้าง ปจว.ข้อ ${d.refItem||'...'} เวลา ${thaiTime(d.refTime)} น. ลงวันที่ ${thaiDate(d.refDate, true)}`;
      text += ` กรณี ${d.compTitle||''}${d.compName||'...'}   ผู้เสียหาย แจ้งความร้องทุกข์ให้ดำเนินคดีกับ${d.accTitle||''}${d.accName||'...'}   ในความผิดฐาน  ${d.chargeShort||'...'}ฯ`;
      text += `\n${off}  แจ้งว่าจากสอบปากผู้เสียหาย และรวบรวมพยานหลักฐาน เชื่อว่ามีการกระทำความผิดอาญาเกิดขึ้นจริง  จึงรับคำร้องทุกข์เป็นคดีอาญาที่    ${d.caseNo||''}/${d.caseYear||'...'}   ลงวันที่  ${thaiDate(d.caseDate, true)} ในความผิดฐาน  ${d.chargeFull||'...'} จะได้ทำการสอบสวนต่อไป`;

      return text;
    }
  },

  // ────────────────────────────────────────────────────────────────────
  // ประเภทที่ 3: รับแจ้งความ
  // ────────────────────────────────────────────────────────────────────
  {
    id:    'complaint',
    name:  'รับแจ้งความ',
    icon:  '📋',
    color: '#10b981',
    bg:    'rgba(16,185,129,0.12)',
    desc:  'ผู้เสียหายมาพบพนักงานสอบสวนเพื่อแจ้งความร้องทุกข์ด้วยตนเอง',

    sections: [
      {
        title: 'ผู้แจ้ง (ผู้เสียหาย)',
        fields: [
          { id:'compTitle',       label:'คำนำหน้า',     type:'select', options:TITLES, required:true },
          { id:'compName',        label:'ชื่อ-สกุล',    type:'text', placeholder:'จิราวรรณ  ชัยประภา', required:true },
          { id:'compAge',         label:'อายุ (ปี)',     type:'number', placeholder:'36' },
          { id:'compId',          label:'เลขบัตรประชาชน', type:'text', placeholder:'1102001196951', maxLength:13 },
          { id:'compHouseNo',     label:'บ้านเลขที่',   type:'text', placeholder:'34/1' },
          { id:'compSoi',         label:'ซอย (ถ้ามี)',  type:'text', placeholder:'ภูมิณรงค์' },
          { id:'compStreet',      label:'ถนน (ถ้ามี)',  type:'text', placeholder:'สิโรรส' },
          { id:'compSubdistrict', label:'ตำบล',         type:'text', placeholder:'สะเตง' },
          { id:'compDistrict',    label:'อำเภอ',        type:'text', placeholder:'เมืองยะลา' },
          { id:'compProvince',    label:'จังหวัด',      type:'text', placeholder:'ยะลา' },
          { id:'compPhone',       label:'โทรศัพท์',     type:'text', placeholder:'0984761669' },
        ]
      },
      {
        title: 'รายละเอียดเหตุ',
        fields: [
          { id:'accTitle',        label:'คำนำหน้า (ผู้ถูกกล่าวหา)', type:'select', options:TITLES },
          { id:'accName',         label:'ชื่อ-สกุล ผู้ถูกกล่าวหา',  type:'text', placeholder:'อานนท์   ประดิษฐแสง' },
          { id:'incidentDetails', label:'รายละเอียดเหตุการณ์',       type:'textarea', rows:6,
            placeholder:'ได้นำรถยนต์ ยี่ห้อโตโยต้า แคมรี สีดำ หมายเลขทะเบียน ขษ 2518 มาจำนำไว้กับผู้แจ้ง จำนวนเงิน 181,000 บาท...', required:true },
          { id:'locDetails',      label:'สถานที่เกิดเหตุ',            type:'text', placeholder:'หน้าผับนาซ่า  ถนนเฉลิมชัย' },
          { id:'locSubdistrict',  label:'ตำบล',                       type:'text', placeholder:'สะเตง' },
          { id:'locDistrict',     label:'อำเภอ',                      type:'text', placeholder:'เมืองยะลา' },
          { id:'locProvince',     label:'จังหวัด',                    type:'text', placeholder:'ยะลา' },
          { id:'incidentDate',    label:'วันที่เกิดเหตุ',             type:'date', required:true },
          { id:'incidentTime',    label:'เวลาเกิดเหตุ',               type:'time', required:true },
        ]
      },
      {
        title: 'พนักงานสอบสวนเวร',
        fields: [
          { id:'officerRank', label:'ยศ',        type:'select', options:RANKS, required:true },
          { id:'officerName', label:'ชื่อ-สกุล', type:'text', required:true },
          { id:'officerPos',  label:'ตำแหน่ง',   type:'select', options:POSITIONS, required:true },
          { id:'station',     label:'สถานี',      type:'text', placeholder:'เมืองยะลา', required:true },
        ]
      }
    ],

    generate(d) {
      const sta = `สภ.${d.station||'...'}`;
      const off = `${d.officerRank||'...'} ${d.officerName||'...'}  ${d.officerPos||'...'}${sta}`;

      const addr = [
        d.compHouseNo  ? `บ้านเลขที่ ${d.compHouseNo}` : '',
        d.compSoi      ? `ซ.${d.compSoi}`       : '',
        d.compStreet   ? `ถ.${d.compStreet}`    : '',
        d.compSubdistrict ? `ต.${d.compSubdistrict}` : '',
        d.compDistrict    ? `อ.${d.compDistrict}`    : '',
        d.compProvince    ? `จ.${d.compProvince}`    : '',
      ].filter(Boolean).join(' ');

      const loc = [
        d.locDetails     || '',
        d.locSubdistrict ? `ต.${d.locSubdistrict}` : '',
        d.locDistrict    ? `อ.${d.locDistrict}`    : '',
        d.locProvince    ? `จ.${d.locProvince}`    : '',
      ].filter(Boolean).join(' ');

      let text = `${d.compTitle||''}${d.compName||'...'} อายุ ${d.compAge||'...'} ปี`;
      if (d.compId) text += `  (${d.compId})`;
      text += ` ปัจจุบันพักอาศัยอยู่${addr||'...'}`;
      if (d.compPhone) text += ` โทร. ${d.compPhone}`;
      text += ` มาพบพนักงานสอบสวนแจ้งว่า                                `;
      text += `${d.accTitle||''}${d.accName||'...'} ${d.incidentDetails||'...'}`;
      text += `\n\tจึงเดินทางมาพบพนักงานสอบสวนเพื่อแจ้งความร้องทุกข์ ต่อพนักงานสอบสวนเพื่อดำเนินการสืบสวนสอบสวนดำเนินคดีตามกฎหมายต่อไป           `;
      text += `\nเหตุเกิด${loc||'...'} เมื่อวันที่ ${thaiDate(d.incidentDate)} เวลาประมาณ ${thaiTime(d.incidentTime)} น.`;
      text += `\n     ${off} พนักงานสอบสวนเวร  รับแจ้งไว้แล้ว และจะได้ทำการสอบสวนต่อไป`;

      return text;
    }
  },

  // ────────────────────────────────────────────────────────────────────
  // ประเภท: แบบอิสระ (Free Text)
  // ────────────────────────────────────────────────────────────────────
  {
    id:    'custom_text',
    name:  'ร่างแบบอิสระ (แก้ไขข้อความโดยตรง)',
    icon:  '📝',
    color: '#8b5cf6',
    bg:    'rgba(139,92,246,0.12)',
    desc:  'แก้ไขข้อความทั้งหมดได้อย่างอิสระ เหมาะสำหรับนำตัวอย่างมาแก้',
    sections: [
      {
        title: 'ตั้งชื่อบันทึก (สำหรับไว้ค้นหา)',
        fields: [
          { id:'title', label:'หัวข้อ / ชื่องาน', type:'text', placeholder:'เช่น ปจว.รถชนนาย A (14 ก.พ.)' }
        ]
      },
      {
        title: 'เนื้อหาบันทึกประจำวัน',
        fields: [
          { id:'customContent', label:'แก้ไขเนื้อหา', type:'textarea', rows:18, required:true, placeholder:'พิมพ์ข้อความบันทึกประจำวันของท่านที่นี่...' }
        ]
      }
    ],
    generate(d) {
      return d.customContent || '';
    }
  },
  // ──────────────────────────────────────────────────────────────────────
  // ประเภทที่ 4: เปรียบเทียบคดีจราจร
  // ──────────────────────────────────────────────────────────────────────
  {
    id:    'traffic_fine',
    name:  'เปรียบเทียบคดีจราจร',
    icon:  '🚦',
    color: '#f59e0b',
    bg:    'rgba(245,158,11,0.12)',
    desc:  'บันทึกการเปรียบเทียบปรับคดีจราจร กรณีคู่กรณีตกลงกันได้ หรือผู้ขับขี่รับผิด',
    sections: [
      {
        title: 'ข้อมูลเจ้าหน้าที่',
        fields: [
          { id:'officerRank', label:'ยศ',         type:'select', options:RANKS,     required:true },
          { id:'officerName', label:'ชื่อ-สกุล', type:'text',   placeholder:'นิรันต์  นวลบุญ', required:true },
          { id:'officerPos',  label:'ตำแหน่ง',   type:'select', options:POSITIONS, required:true },
          { id:'station',     label:'สถานี',      type:'text',   placeholder:'เมืองยะลา', required:true },
          { id:'province',    label:'จังหวัด',   type:'text',   placeholder:'ยะลา', required:true },
        ]
      },
      {
        title: 'อ้างอิง ปจว.เดิม (อุบัติเหตุ)',
        fields: [
          { id:'refItem', label:'ปจว.ข้อที่',       type:'number', placeholder:'3', required:true },
          { id:'refTime', label:'เวลา ปจว.เดิม',   type:'time',   required:true },
          { id:'refDate', label:'วันที่ ปจว.เดิม', type:'date',   required:true },
        ]
      },
      {
        title: 'ผู้ขับขี่ฝ่ายผิด',
        fields: [
          { id:'driverTitle',       label:'คำนำหน้า',           type:'select', options:TITLES, required:true },
          { id:'driverName',        label:'ชื่อ-สกุล',          type:'text',   placeholder:'สมชาย มากมี', required:true },
          { id:'driverId',          label:'เลขบัตรประชาชน',     type:'text',   placeholder:'1234567890123', maxLength:13 },
          { id:'driverAge',         label:'อายุ (ปี)',           type:'number', placeholder:'35' },
          { id:'driverLicenseNo',   label:'เลขใบขับขี่',        type:'text',   placeholder:'12-3456789' },
          { id:'driverLicenseType', label:'ประเภทใบขับขี่',     type:'text',   placeholder:'รถยนต์ส่วนบุคคล' },
        ]
      },
      {
        title: 'ยานพาหนะที่ก่อเหตุ',
        fields: [
          { id:'vehType',  label:'ประเภทรถ',       type:'select', options:VEHICLE_TYPES },
          { id:'vehBrand', label:'ยี่ห้อ',          type:'text',   placeholder:'Toyota' },
          { id:'vehPlate', label:'หมายเลขทะเบียน', type:'text',   placeholder:'กข 1234 กรุงเทพมหานคร' },
        ]
      },
      {
        title: 'การเปรียบเทียบปรับ',
        fields: [
          { id:'fineAmount', label:'จำนวนเงินค่าปรับ (บาท)', type:'number', placeholder:'500', required:true },
          { id:'fineCharge', label:'ฐานความผิด',              type:'text',   placeholder:'ขับรถโดยประมาท', required:true },
          { id:'fineDate',   label:'วันที่เปรียบเทียบ',      type:'date',   required:true },
          { id:'fineTime',   label:'เวลาเปรียบเทียบ',        type:'time',   required:true },
          { id:'fineRemark', label:'หมายเหตุ',               type:'text',   placeholder:'ชำระเงินสดแล้ว ณ วันที่เปรียบเทียบ' },
        ]
      },
    ],
    generate(d) {
      const sta = `สภ.${d.station||'...'}`;
      const off = `${d.officerRank||'...'} ${d.officerName||'...'}  ${d.officerPos||'...'}${sta} จว.${d.province||'...'}`;
      const driver = `${d.driverTitle||''}${d.driverName||'...'}`;
      const veh = [d.vehType, d.vehBrand ? `ยี่ห้อ${d.vehBrand}` : '', d.vehPlate].filter(Boolean).join(' ');
      let text = `อ้าง ปจว.ข้อ ${d.refItem||'...'} เวลา ${thaiTime(d.refTime)} น. ลงวันที่ ${thaiDate(d.refDate, true)} กรณีอุบัติเหตุจราจร`;
      text += `\n\t${off}  แจ้งว่า ได้ทำการเปรียบเทียบคดีโดย ${driver}`;
      if (d.driverId) text += ` (บัตรประชาชนเลขที่ ${d.driverId})`;
      if (d.driverAge) text += ` อายุ ${d.driverAge} ปี`;
      if (d.driverLicenseNo) text += ` ใบขับขี่เลขที่ ${d.driverLicenseNo} ประเภท ${d.driverLicenseType||'...'}`;
      if (veh) text += `  ผู้ขับขี่${veh}`;
      text += `\n\tมีความผิดฐาน ${d.fineCharge||'...'} ได้รับการเปรียบเทียบปรับเป็นเงิน จำนวน ${d.fineAmount||'...'} บาท`;
      text += ` เมื่อวันที่ ${thaiDate(d.fineDate)} เวลา ${thaiTime(d.fineTime)} น.`;
      if (d.fineRemark) text += ` (${d.fineRemark})`;
      text += `\n\tจึงบันทึกไว้เป็นหลักฐาน`;
      return text;
    }
  },

  // ──────────────────────────────────────────────────────────────────────
  // ประเภทที่ 5: ลงบันทึกจับกุมผู้ต้องหา
  // ──────────────────────────────────────────────────────────────────────
  {
    id:    'arrest_log',
    name:  'ลงบันทึกจับกุมผู้ต้องหา',
    icon:  '🔒',
    color: '#dc2626',
    bg:    'rgba(220,38,38,0.12)',
    desc:  'บันทึกการจับกุมผู้ต้องหา พร้อมข้อหา ของกลาง และการส่งตัวดำเนินคดี',
    sections: [
      {
        title: 'เจ้าหน้าที่ผู้จับกุม',
        fields: [
          { id:'officerRank', label:'ยศ',         type:'select', options:RANKS,     required:true },
          { id:'officerName', label:'ชื่อ-สกุล', type:'text',   placeholder:'นิรันต์  นวลบุญ', required:true },
          { id:'officerPos',  label:'ตำแหน่ง',   type:'select', options:POSITIONS, required:true },
          { id:'station',     label:'สถานี',      type:'text',   placeholder:'เมืองยะลา', required:true },
          { id:'province',    label:'จังหวัด',   type:'text',   placeholder:'ยะลา', required:true },
        ]
      },
      {
        title: 'ผู้ต้องหา',
        fields: [
          { id:'suspectTitle',       label:'คำนำหน้า',       type:'select', options:TITLES, required:true },
          { id:'suspectName',        label:'ชื่อ-สกุล',      type:'text',   placeholder:'อานนท์  ประดิษฐแสง', required:true },
          { id:'suspectId',          label:'เลขบัตรประชาชน', type:'text',   placeholder:'1234567890123', maxLength:13 },
          { id:'suspectAge',         label:'อายุ (ปี)',       type:'number', placeholder:'28' },
          { id:'suspectNationality', label:'สัญชาติ',        type:'text',   placeholder:'ไทย' },
          { id:'suspectHouseNo',     label:'บ้านเลขที่',     type:'text',   placeholder:'12' },
          { id:'suspectMoo',         label:'หมู่ที่',        type:'text',   placeholder:'4' },
          { id:'suspectSubdistrict', label:'ตำบล',           type:'text',   placeholder:'สะเตง' },
          { id:'suspectDistrict',    label:'อำเภอ',          type:'text',   placeholder:'เมืองยะลา' },
          { id:'suspectProvince',    label:'จังหวัด',        type:'text',   placeholder:'ยะลา' },
        ]
      },
      {
        title: 'รายละเอียดการจับกุม',
        fields: [
          { id:'arrestDate',     label:'วันที่จับกุม',           type:'date',     required:true },
          { id:'arrestTime',     label:'เวลาจับกุม',             type:'time',     required:true },
          { id:'arrestLocation', label:'สถานที่จับกุม',          type:'text',     placeholder:'บริเวณหน้าตลาดสด ถ.เฉลิมชัย', required:true },
          { id:'arrestCharge',   label:'ข้อหา/ความผิด',         type:'textarea', rows:4, required:true,
            placeholder:'มีไว้ในครอบครองเพื่อจำหน่ายซึ่งยาเสพติดให้โทษประเภท 1 (เมทแอมเฟตามีน)',
            presets: CHARGE_PRESETS },
          { id:'arrestEvidence', label:'ของกลางที่ยึดได้',      type:'textarea', rows:3,
            placeholder:'ยาบ้า จำนวน 10 เม็ด น้ำหนักรวม 0.28 กรัม' },
          { id:'arrestWitness',  label:'พยาน/ผู้ร่วมจับกุม',   type:'text', placeholder:'ร.ต.อ.สมศักดิ์ เกาะสมุย' },
        ]
      },
      {
        title: 'การส่งตัว',
        fields: [
          { id:'handoverTo',   label:'ส่งตัวให้กับ',                      type:'text', placeholder:'พนักงานสอบสวน สภ.เมืองยะลา', required:true },
          { id:'handoverDate', label:'วันที่ส่งตัว',                      type:'date', required:true },
          { id:'handoverTime', label:'เวลาส่งตัว',                        type:'time', required:true },
          { id:'handoverNote', label:'หมายเหตุ (เช่น ฝากขัง/ประกันตัว)', type:'text', placeholder:'ควบคุมตัวไว้ที่ สภ.เมืองยะลา เพื่อสอบสวน' },
        ]
      },
    ],
    generate(d) {
      const sta = `สภ.${d.station||'...'}`;
      const off = `${d.officerRank||'...'} ${d.officerName||'...'}  ${d.officerPos||'...'}${sta} จว.${d.province||'...'}`;
      const suspect = `${d.suspectTitle||''}${d.suspectName||'...'}`;
      const addr = [
        d.suspectHouseNo     ? `บ้านเลขที่ ${d.suspectHouseNo}` : '',
        d.suspectMoo         ? `ม.${d.suspectMoo}` : '',
        d.suspectSubdistrict ? `ต.${d.suspectSubdistrict}` : '',
        d.suspectDistrict    ? `อ.${d.suspectDistrict}` : '',
        d.suspectProvince    ? `จว.${d.suspectProvince}` : '',
      ].filter(Boolean).join(' ');
      let text = `${off}  แจ้งว่า เมื่อวันที่ ${thaiDate(d.arrestDate)} เวลาประมาณ ${thaiTime(d.arrestTime)} น.`;
      text += `  ได้จับกุมตัว ${suspect}`;
      if (d.suspectId) text += ` บัตรประชาชนเลขที่ ${d.suspectId}`;
      if (d.suspectAge) text += ` อายุ ${d.suspectAge} ปี`;
      if (d.suspectNationality) text += ` สัญชาติ${d.suspectNationality}`;
      if (addr) text += ` ที่อยู่ ${addr}`;
      text += `\n\tในข้อหา ${d.arrestCharge||'...'}`;
      text += `\n\tสถานที่จับกุม ${d.arrestLocation||'...'}`;
      if (d.arrestEvidence) text += `\n\tของกลางที่ยึดได้ ${d.arrestEvidence}`;
      if (d.arrestWitness)  text += `\n\tมีพยาน/ผู้ร่วมจับกุม ได้แก่ ${d.arrestWitness}`;
      text += `\n\tจากนั้นได้ส่งตัว${suspect} พร้อมของกลาง ให้กับ ${d.handoverTo||'...'}`;
      text += ` เมื่อวันที่ ${thaiDate(d.handoverDate)} เวลา ${thaiTime(d.handoverTime)} น.`;
      if (d.handoverNote) text += ` (${d.handoverNote})`;
      text += `\n\tจึงบันทึกไว้เป็นหลักฐาน`;
      return text;
    }
  },
];

// Helper: หาประเภทจาก id
function getDocType(id) {
  return DOCUMENT_TYPES.find(t => t.id === id) || null;
}
