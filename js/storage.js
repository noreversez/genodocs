'use strict';

const DEFAULT_EXAMPLES = [
  {
    id: 'ex_default_1',
    name: 'รถชน (ตกลงกันได้)',
    tag: 'จราจร',
    content: `ข้อที่ 1 เวลา 10.30 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	ขอรายงานการรับแจ้งเหตุ รถจักรยานยนต์เฉี่ยวชนรถยนต์
	เมื่อวันที่ 12 มีนาคม 2567 เวลาประมาณ 10.00 น. นาย ก. ผู้ขับขี่รถจักรยานยนต์ หมายเลขทะเบียน กข 123 ยะลา ได้ขับขี่มาตามถนนสิโรรส เมื่อถึงบริเวณหน้าโรงพยาบาลศูนย์ยะลา ได้เกิดเฉี่ยวชนกับรถยนต์ หมายเลขทะเบียน ขค 456 ยะลา ซึ่งมี นาย ข. เป็นผู้ขับขี่
	ผลการเฉี่ยวชนทำให้รถจักรยานยนต์ได้รับความเสียหายเล็กน้อย ไม่มีผู้ได้รับบาดเจ็บ
	คู่กรณีทั้งสองฝ่ายสามารถตกลงไกล่เกลี่ยกันได้ โดย นาย ก. ยอมรับผิดและชดใช้ค่าเสียหายเป็นเงินจำนวน 2,000 บาท ให้แก่ นาย ข. เรียบร้อยแล้ว ทั้งสองฝ่ายไม่ประสงค์จะดำเนินคดีอาญาและทางแพ่งต่อกันอีกต่อไป
	จึงบันทึกไว้เป็นหลักฐาน`
  },
  {
    id: 'ex_default_2',
    name: 'แจ้งเอกสารหาย (บัตร ปชช / บัญชี)',
    tag: 'เอกสารหาย',
    content: `ข้อที่ 2 เวลา 14.15 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	รับแจ้งจาก นาย สมหญิง สุขใจ อายุ 35 ปี อยู่บ้านเลขที่ 123 ม.1 ต.สะเตง อ.เมือง จว.ยะลา
	แจ้งว่า เมื่อวันที่ 10 มีนาคม 2567 เวลาประมาณ 09.00 น. ตนได้ทำกระเป๋าสตางค์หล่นหาย บริเวณตลาดสดเทศบาลนครยะลา ภายในกระเป๋ามีเอกสารสำคัญ ดังนี้
	1. บัตรประจำตัวประชาชน ระบุชื่อ นาย สมหญิง สุขใจ
	2. สมุดบัญชีธนาคารกรุงไทย สาขายะลา หมายเลขบัญชี 987-6-54321-0
	ผู้แจ้งประสงค์ขอลงบันทึกประจำวันไว้เป็นหลักฐาน เพื่อนำไปใช้ในการทำเอกสารใหม่
	จึงบันทึกไว้เป็นหลักฐาน`
  },
  {
    id: 'ex_default_3',
    name: 'คดีฉ้อโกงออนไลน์ (โอนเงินมิจฉาชีพ)',
    tag: 'อาชญากรรมทางเทคโนโลยี',
    content: `ข้อที่ 3 เวลา 16.45 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	รับแจ้งจาก นาย สมชาย ผู้เสียหาย อายุ 40 ปี
	แจ้งว่า เมื่อวันที่ 15 มีนาคม 2567 ตนได้ตกลงซื้อโทรศัพท์มือถือยี่ห้อ iPhone ผ่านทางหน้าเพจเฟซบุ๊กชื่อ "มือถือราคาถูก" ในราคา 15,000 บาท โดยได้โอนเงินจากบัญชีธนาคารกสิกรไทย ของตน ไปยังบัญชีธนาคารไทยพาณิชย์ หมายเลขบัญชี 111-2-33333-4 ชื่อบัญชี นาย มิจฉาชีพ หลอกลวง
	หลังจากโอนเงินไปแล้ว ไม่สามารถติดต่อผู้ขายได้และไม่ได้รับสินค้าแต่อย่างใด เชื่อว่าถูกหลอกลวง ทำให้ได้รับความเสียหาย
	จึงมาแจ้งความร้องทุกข์ต่อพนักงานสอบสวน เพื่อให้ดำเนินคดีกับ นาย มิจฉาชีพ หลอกลวง ในความผิดฐานฉ้อโกงประชาชน และ พ.ร.บ.คอมพิวเตอร์ฯ จนกว่าคดีจะถึงที่สุด
	จึงบันทึกไว้เป็นหลักฐาน`
  },
  {
    id: 'ex_default_4',
    name: 'คดีทำร้ายร่างกาย (ทะเลาะวิวาท)',
    tag: 'อาชญากรรม',
    content: `ข้อที่ 4 เวลา 20.15 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	รับแจ้งจาก นาย สมเกียรติ กล้าหาญ อายุ 28 ปี ผู้เสียหาย
	แจ้งว่า เมื่อวันที่ 20 มีนาคม 2567 เวลาประมาณ 19.30 น. ขณะที่ตนกำลังนั่งรับประทานอาหารอยู่ที่ร้านข้าวต้มริมทาง ถนนคุรุ ได้มี นาย แดง (ไม่ทราบชื่อ-สกุลจริง) ซึ่งมีปากเสียงกันมาก่อน เข้ามาใช้กำลังชกต่อยบริเวณใบหน้าตนจำนวน 2 ครั้ง ทำให้ได้รับบาดเจ็บ มีรอยฟกช้ำที่เบ้าตาขวา
	หลังก่อเหตุ นาย แดง ได้วิ่งหลบหนีไป ตนจึงได้เดินทางไปตรวจร่างกายที่โรงพยาบาลศูนย์ยะลา และมาพบพนักงานสอบสวน
	ผู้แจ้งประสงค์ให้ดำเนินคดีกับ นาย แดง ในข้อหาทำร้ายร่างกายผู้อื่น จนกว่าคดีจะถึงที่สุด
	จึงบันทึกไว้เป็นหลักฐานและดำเนินการสืบสวนต่อไป`
  },
  {
    id: 'ex_default_5',
    name: 'คดีลักทรัพย์ (งัดแงะบ้านพัก)',
    tag: 'ทรัพย์สิน',
    content: `ข้อที่ 5 เวลา 08.30 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	รับแจ้งจาก นาง วรรณา รักสงบ อายุ 55 ปี
	แจ้งว่า เมื่อวันที่ 22 มีนาคม 2567 เวลาประมาณ 08.00 น. ตนได้ตื่นนอนและพบว่า หน้าต่างบานเลื่อนหลังบ้านพักเลขที่ 456 ม.2 ต.สะเตง อ.เมือง จว.ยะลา มีร่องรอยถูกงัดแงะเปิดออก เมื่อตรวจสอบทรัพย์สินภายในบ้านพบว่ามีทรัพย์สินสูญหายไป ดังนี้
	1. โทรทัศน์สี ยี่ห้อ Samsung ขนาด 42 นิ้ว จำนวน 1 เครื่อง ราคาประมาณ 10,000 บาท
	2. เงินสด จำนวน 5,000 บาท
	รวมมูลค่าความเสียหายประมาณ 15,000 บาท โดยไม่ทราบว่าผู้ใดเป็นคนร้าย
	จึงมาแจ้งความร้องทุกข์เพื่อให้เจ้าหน้าที่ตำรวจติดตามจับกุมคนร้ายมาดำเนินคดีตามกฎหมาย
	จึงบันทึกไว้เป็นหลักฐาน และได้ประสานเจ้าหน้าที่พิสูจน์หลักฐานเข้าตรวจสอบที่เกิดเหตุแล้ว`
  },
  {
    id: 'ex_default_6',
    name: 'ลงบันทึกเป็นหลักฐาน (กรณีทั่วไป)',
    tag: 'ทั่วไป',
    content: `ข้อที่ 6 เวลา 11.00 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	รับแจ้งจาก นาย วิชัย มั่นคง อายุ 45 ปี 
	แจ้งว่า ตนเป็นเจ้าของกรรมสิทธิ์ที่ดินแปลงเลขที่ 123/45 ต.สะเตง อ.เมือง จว.ยะลา ซึ่งขณะนี้ได้มีบุคคลไม่ทราบชื่อนำวัสดุก่อสร้างมาวางรุกล้ำในพื้นที่ของตนเล็กน้อย ตนได้พยายามติดต่อหาตัวเจ้าของวัสดุดังกล่าวแล้วแต่ยังไม่พบตัว
	ผู้แจ้งยังไม่ประสงค์จะดำเนินคดีอาญากับผู้ใด เพียงแต่มาขอลงบันทึกประจำวันไว้เป็นหลักฐาน เพื่อแสดงความบริสุทธิ์ใจและใช้เป็นหลักฐานในการดำเนินการล้อมรั้วที่ดินของตนต่อไป
	จึงบันทึกไว้เป็นหลักฐานตามความประสงค์ของผู้แจ้ง`
  },
  {
    id: 'ex_default_7',
    name: 'คดียักยอกทรัพย์ (เช่ารถแล้วหนี)',
    tag: 'ทรัพย์สิน',
    content: `ข้อที่ 7 เวลา 13.00 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	รับแจ้งจาก นาย สมเกียรติ เจ้าของเต็นท์รถ อายุ 42 ปี 
	แจ้งว่า เมื่อวันที่ 10 เมษายน 2567 นาย ดำ (ผู้ต้องหา) ได้มาขอเช่ารถยนต์กระบะ ยี่ห้อ Toyota Revo หมายเลขทะเบียน กข 9999 ยะลา ของผู้แจ้ง ไปใช้งานเป็นเวลา 3 วัน ในราคา 3,000 บาท โดยมีกำหนดส่งคืนในวันที่ 13 เมษายน 2567 
	แต่เมื่อถึงกำหนดส่งคืน นาย ดำ กลับไม่นำรถมาคืน และไม่สามารถติดต่อได้ทุกช่องทาง ผู้แจ้งเชื่อว่า นาย ดำ ได้เบียดบังเอารถยนต์คันดังกล่าวไปเป็นของตนเองหรือผู้อื่นโดยทุจริต ทำให้ได้รับความเสียหายมูลค่าประมาณ 600,000 บาท
	จึงมาแจ้งความร้องทุกข์ต่อพนักงานสอบสวน เพื่อให้ดำเนินคดีอาญากับ นาย ดำ ในความผิดฐานยักยอกทรัพย์ จนกว่าคดีจะถึงที่สุด
	จึงบันทึกไว้เป็นหลักฐาน`
  },
  {
    id: 'ex_default_8',
    name: 'คดี พ.ร.บ.เช็ค (เช็คเด้ง)',
    tag: 'เศรษฐกิจ',
    content: `ข้อที่ 8 เวลา 15.30 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	รับแจ้งจาก น.ส. ร่ำรวย เงินทอง อายุ 35 ปี 
	แจ้งว่า เมื่อวันที่ 5 พฤษภาคม 2567 ตนได้นำเช็คของธนาคารกรุงเทพ สาขายะลา เลขที่เช็ค 1234567 ลงวันที่ 5 พฤษภาคม 2567 สั่งจ่ายเงินจำนวน 50,000 บาท ซึ่ง นาย ขาว เป็นผู้สั่งจ่าย เพื่อชำระหนี้ค่าสินค้า ไปขึ้นเงินที่ธนาคาร
	แต่ปรากฏว่าธนาคารได้ปฏิเสธการจ่ายเงินตามเช็คดังกล่าว โดยให้เหตุผลว่า "โปรดติดต่อผู้สั่งจ่าย" (เงินในบัญชีไม่พอจ่าย) ทำให้ผู้แจ้งได้รับความเสียหาย
	จึงมาแจ้งความร้องทุกข์เพื่อให้ดำเนินคดีกับ นาย ขาว ตาม พ.ร.บ.ว่าด้วยความผิดอันเกิดจากการใช้เช็ค พ.ศ. 2534 จนกว่าคดีจะถึงที่สุด
	จึงบันทึกไว้เป็นหลักฐานและได้ยึดเช็คฉบับดังกล่าวไว้ประกอบคดีแล้ว`
  },
  {
    id: 'ex_default_9',
    name: 'คดีบุกรุก (ยามวิกาล)',
    tag: 'อาชญากรรม',
    content: `ข้อที่ 9 เวลา 02.15 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	รับแจ้งจาก นาย หวงแหน ที่ดิน อายุ 50 ปี 
	แจ้งว่า เมื่อวันที่ 10 มิถุนายน 2567 เวลาประมาณ 01.30 น. ขณะที่ตนกำลังนอนหลับพักผ่อนอยู่ในบ้านเลขที่ 789 ม.3 ต.สะเตง อ.เมือง จว.ยะลา ได้ยินเสียงสุนัขเห่าบริเวณหน้าบ้าน จึงออกมาตรวจสอบ พบ นาย เขียว (ทราบชื่อภายหลัง) แอบปีนรั้วเข้ามาในบริเวณบ้านของตนในยามวิกาลโดยไม่มีเหตุอันควร
	ตนจึงได้ตะโกนเรียกให้เพื่อนบ้านช่วยจับกุมตัวไว้ได้ และได้แจ้งเจ้าหน้าที่ตำรวจสายตรวจมารับตัวไป
	ผู้แจ้งประสงค์ให้ดำเนินคดีกับ นาย เขียว ในความผิดฐานบุกรุกเคหสถานในเวลากลางคืน จนกว่าคดีจะถึงที่สุด
	จึงบันทึกไว้เป็นหลักฐาน`
  },
  {
    id: 'ex_default_10',
    name: 'อุบัติเหตุจราจร (บาดเจ็บ/ของหลวงเสียหาย)',
    tag: 'จราจร',
    content: `ข้อที่ 10 เวลา 09.45 น.
	ข้าพเจ้า ร.ต.อ. รักดี ใจงาม ตำแหน่ง รอง สว.(สอบสวน) สภ.เมืองยะลา จว.ยะลา
	ขอรายงานการรับแจ้งเหตุ รถยนต์ชนเสาไฟฟ้ามีผู้ได้รับบาดเจ็บ
	เมื่อวันที่ 20 มิถุนายน 2567 เวลาประมาณ 09.15 น. ได้รับแจ้งจากศูนย์วิทยุว่าเกิดอุบัติเหตุรถยนต์เสียหลักชนเสาไฟฟ้าริมทาง บริเวณทางโค้งถนนสาย 410 ต.บันนังสตา อ.บันนังสตา จว.ยะลา จึงได้เดินทางไปตรวจที่เกิดเหตุ
	พบรถยนต์เก๋ง ยี่ห้อ Honda Civic สีขาว หมายเลขทะเบียน กก 1111 ยะลา สภาพด้านหน้าพังยับเยิน ชนติดอยู่กับเสาไฟฟ้าริมทาง (ทรัพย์สินทางราชการได้รับความเสียหาย) และพบผู้ขับขี่ชื่อ นาย ประมาท ขาดสติ ได้รับบาดเจ็บสาหัสติดอยู่ภายในรถ เจ้าหน้าที่กู้ภัยได้นำตัวส่งโรงพยาบาลศูนย์ยะลา
	เบื้องต้นสันนิษฐานว่า ขับรถด้วยความเร็วสูงและหลุดโค้ง จึงได้ถ่ายภาพ ทำแผนที่เกิดเหตุ และประสานการไฟฟ้าส่วนภูมิภาคมาตรวจสอบความเสียหาย
	จึงบันทึกไว้เป็นหลักฐานและจะได้ทำการสอบสวนต่อไป`
  }
];

const storage = {
  K: {
    ENTRIES:   'pjw_entries',
    SETTINGS:  'pjw_settings',
    PROFILES:  'pjw_profiles',
    EXAMPLES:  'pjw_examples',
    DRAFT:     'pjw_draft',
  },

  // ──────────── Entries ────────────
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.K.ENTRIES) || '[]'); }
    catch { return []; }
  },

  save(entry) {
    const entries = this.getAll();
    if (entry.id) {
      const i = entries.findIndex(e => e.id === entry.id);
      if (i >= 0) { entries[i] = { ...entry, updatedAt: new Date().toISOString() }; }
      else         { entries.unshift(entry); }
    } else {
      entry.id        = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      entry.createdAt = new Date().toISOString();
      entries.unshift(entry);
    }
    localStorage.setItem(this.K.ENTRIES, JSON.stringify(entries));
    return entry.id;
  },

  getById(id) {
    return this.getAll().find(e => e.id === id) || null;
  },

  delete(id) {
    const entries = this.getAll().filter(e => e.id !== id);
    localStorage.setItem(this.K.ENTRIES, JSON.stringify(entries));
  },

  search(query = '', typeId = '') {
    const q = query.toLowerCase().trim();
    return this.getAll().filter(e => {
      if (typeId && e.type !== typeId) return false;
      if (!q) return true;
      return JSON.stringify(e).toLowerCase().includes(q);
    });
  },

  count()      { return this.getAll().length; },
  countToday() {
    const today = new Date().toDateString();
    return this.getAll().filter(e => new Date(e.createdAt).toDateString() === today).length;
  },
  countMonth() {
    const now = new Date();
    return this.getAll().filter(e => {
      const d = new Date(e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  },

  // ──────────── Auto-Save Draft ────────────
  saveDraft(data) {
    localStorage.setItem(this.K.DRAFT, JSON.stringify(data));
  },
  getDraft() {
    try { return JSON.parse(localStorage.getItem(this.K.DRAFT)); }
    catch { return null; }
  },
  clearDraft() {
    localStorage.removeItem(this.K.DRAFT);
  },

  // ──────────── Settings ────────────
  getSettings() {
    try { return JSON.parse(localStorage.getItem(this.K.SETTINGS) || '{}'); }
    catch { return {}; }
  },
  saveSettings(s) {
    localStorage.setItem(this.K.SETTINGS, JSON.stringify(s));
  },

  // ──────────── Profiles ────────────
  getProfiles() {
    try { return JSON.parse(localStorage.getItem(this.K.PROFILES) || '[]'); }
    catch { return []; }
  },
  saveProfiles(p) {
    localStorage.setItem(this.K.PROFILES, JSON.stringify(p));
  },

  // ──────────── Examples (Templates) ────────────
  getExamples() {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(this.K.EXAMPLES) || '[]'); } catch { list = []; }
    
    // Migrate defaults to localStorage if not done yet
    if (!localStorage.getItem('pjw_defaults_migrated')) {
      const existingIds = new Set(list.map(e => e.id));
      const toAdd = DEFAULT_EXAMPLES.filter(e => !existingIds.has(e.id));
      list = [...toAdd, ...list];
      localStorage.setItem(this.K.EXAMPLES, JSON.stringify(list));
      localStorage.setItem('pjw_defaults_migrated', '1');
    }

    // Clean up old faulty imports
    if (!localStorage.getItem('pjw_imported_v5_cleaned')) {
       list = list.filter(e => !e.id.startsWith('ex_imported_') || e.id.startsWith('ex_imported_v5_'));
       localStorage.setItem(this.K.EXAMPLES, JSON.stringify(list));
       localStorage.setItem('pjw_imported_v5_cleaned', '1');
       localStorage.removeItem('pjw_imported_migrated'); // allow re-import
    }

    // Migrate imported examples (from Excel)
    if (typeof IMPORTED_EXAMPLES !== 'undefined' && !localStorage.getItem('pjw_imported_migrated')) {
      const existingIds = new Set(list.map(e => e.id));
      const toAdd = IMPORTED_EXAMPLES.filter(e => !existingIds.has(e.id));
      list = [...list, ...toAdd];
      localStorage.setItem(this.K.EXAMPLES, JSON.stringify(list));
      localStorage.setItem('pjw_imported_migrated', '1');
    }
    
    return list;
  },

  getExampleById(id) {
    return this.getExamples().find(e => e.id === id) || null;
  },

  saveExample(ex) {
    let list = this.getExamples();

    if (ex.id) {
      const idx = list.findIndex(e => e.id === ex.id);
      if (idx !== -1) {
        list[idx] = { ...ex, updatedAt: new Date().toISOString() };
      } else {
        list.unshift(ex);
      }
    } else {
      ex.id        = 'ex_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      ex.createdAt = new Date().toISOString();
      list.unshift(ex);
    }
    localStorage.setItem(this.K.EXAMPLES, JSON.stringify(list));
    return ex.id;
  },

  deleteExample(id) {
    let list = this.getExamples();
    const filtered = list.filter(e => e.id !== id);
    localStorage.setItem(this.K.EXAMPLES, JSON.stringify(filtered));
  },

  toggleExampleStar(id) {
    let list = this.getExamples();
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
      list[idx].starred = !list[idx].starred;
      localStorage.setItem(this.K.EXAMPLES, JSON.stringify(list));
    }
  },

  searchExamples(query = '', category = '') {
    const q = query.toLowerCase().trim();
    const list = this.getExamples();
    return list.filter(e => {
      const matchQ = !q || (
        (e.name || '').toLowerCase().includes(q) ||
        (e.content || '').toLowerCase().includes(q) ||
        (e.tag || '').toLowerCase().includes(q)
      );
      const matchCat = !category || (e.category || e.tag || 'ทั่วไป') === category;
      return matchQ && matchCat;
    });
  },

  reorderExamples(newOrder) {
    // newOrder is array of ids in new order
    const list = this.getExamples();
    const map = new Map(list.map(e => [e.id, e]));
    const reordered = newOrder.map(id => map.get(id)).filter(Boolean);
    // append any items not in newOrder
    list.forEach(e => { if (!newOrder.includes(e.id)) reordered.push(e); });
    localStorage.setItem(this.K.EXAMPLES, JSON.stringify(reordered));
  },

  getCategories() {
    const list = this.getExamples();
    const cats = new Set(list.map(e => e.category || e.tag || 'ทั่วไป'));
    return [...cats];
  },

  // ──────────── Clear all ────────────
  clearAll() {
    Object.values(this.K).forEach(k => localStorage.removeItem(k));
  }
};
