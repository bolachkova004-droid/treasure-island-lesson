// Проверка на устройствах из аудита (iPhone SE … большой монитор): нет ошибок и горизонтальной прокрутки, скриншоты в OUT.
const { chromium } = require('playwright');
const DEV = [ ['se',375,667,1], ['ip14',390,844,1], ['pmax',430,932,1], ['and360',360,800,1], ['ipadP',820,1180,1], ['ipadL',1180,820,1], ['phoneL',844,390,1], ['mac13',1440,900,0], ['big',2560,1440,0] ];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for(const [tag, w, h, touch] of DEV){
    if(only && !only.includes(tag)) continue;
    const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: !!touch, isMobile: !!touch && w < 900, deviceScaleFactor: 1 })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto((process.env.GAME_URL || 'http://localhost:8767/index.html')); await p.waitForFunction(() => LOAD.ready, null, { timeout: 30000 }); await p.waitForTimeout(500);
    const shots = [];
    const snap = async n => { const f = `${process.env.OUT || '.'}/dv-${tag}-${n}.png`; await p.screenshot({ path: f }); shots.push(f);
      const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth })); if(o.sw > o.iw + 1) errs.push(`${n}: горизонтальная прокрутка ${o.sw}>${o.iw}`); };
    await snap('1title');
    await p.click('#bNew'); await p.waitForTimeout(200); await p.click('#bGo'); await p.waitForTimeout(3300);
    await p.evaluate(() => { Object.assign(st, { strip:'village', phase:0, day:2 }); Object.assign(st.flags, { arrived:true, caseOpen:true, talkedGrisha:true }); st.seen.push('village'); st.x = spot('village', 'Чемодан', 3430); snapCam(); hideHint(); updateHud(); });
    await p.waitForTimeout(1200); await snap('2play');
    await p.evaluate(() => { Object.assign(st, { strip:'grunya', phase:1 }); st.x = 600; st.seen.push('grunya'); snapCam(); for(const id of ['c_saturday','c_suitcase','c_timetable','c_noon','e2','e3','c_forged','c_threads']) gain(id); meet('grunya'); meet('grisha'); st.notes.push('n1','rules'); st.lore.push('pech','kolodec');
      st.changes.push({ day:2, phase:1, text:'На старой дороге появилась остановка: жестяной навес, лавка, расписание.', key:'busstop' }); st.ver.s = 'mother'; st.ver.att = ['c_noon','c_suitcase']; openScene('gr_talk'); });
    await p.waitForTimeout(900); for(let i = 0; i < 2; i++){ await p.evaluate(() => advance()); await p.waitForTimeout(250); }
    await p.waitForTimeout(400); await snap('3dlg');
    await p.evaluate(() => { closeDlg(); openBook('case'); }); await p.waitForTimeout(700); await snap('4book');
    await p.evaluate(() => { bookTab = 'en'; renderBook(); }); await p.waitForTimeout(500); await snap('5en');
    await p.evaluate(() => { closeBook(); openMenu(); }); await p.waitForTimeout(400); await snap('6menu');
    await p.evaluate(() => { closeMenu(); st.outcome = 'truth'; st.flags.cEff = 'mother'; st.clues.e3.lens = 'plan'; st.ver.att = ['c_noon','c_suitcase','c_timetable']; showEnd('stay'); }); await p.waitForTimeout(500); await snap('7end');
    console.log(tag, JSON.stringify(errs));
    await p.context().close();
  }
  await b.close();
})();
