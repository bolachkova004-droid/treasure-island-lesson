'use strict';
/* =====================================================================
   ВИДЕО — живые портреты и кат-сцены (ролики из Kling AI)
   Ролики лежат в video/ и перечислены в VIDEOS; tools/video_prep.py
   сжимает присланные файлы и сам дописывает их сюда.
   Портрет: ролик 9:16, первый кадр — тот же портрет на тёмном фоне
   (kling/portraits/*.jpg). Видео ложится поверх картинки, маской служит
   прозрачность самого портрета, поэтому фона не видно. Под конец ролик
   растворяется в неподвижный портрет и начинается снова — шва нет.
   Кат-сцена: один или несколько роликов 16:9 подряд, один раз за игру.
   Нет ролика — всё работает, как раньше.
   ===================================================================== */
const VIDEOS = {
};
const VCUTS = {
  p_road:       { key:'v_arrive', title:'Заветье', clips:['c_arrive_1', 'c_arrive_2'] },
  p_house_in:   { key:'v_house', clips:['c_house'] },
  noon:         { key:'v_noon', title:'Полдень', clips:['c_noon'] },
  leshy:        { key:'v_leshy', clips:['c_leshy'] },
  forest_night: { key:'v_izba', title:'Изба на порогах', clips:['c_izba'] },
  fr:           { key:'v_stop', title:'Шесть тридцать восемь', clips:['c_stop'] },
  river_rite:   { key:'cut_rusal', title:'Проводы русалок', clips:['c_rusal'] },   // если будет ролик — вместо 3D
  bus_sunday:   { key:'v_bus', clips:['c_bus'] },
};
/* у каждого ролика два файла: .webm (VP9) и .mp4 (H.264, для Safari) — берём тот, что браузер умеет */
const VEXT = (() => { try{ const v = document.createElement('video'); return v.canPlayType('video/webm; codecs="vp9"') ? '.webm' : v.canPlayType('video/mp4; codecs="avc1.4D401F"') ? '.mp4' : ''; }catch(e){ return ''; } })();
const vidOK = !!VEXT;
const vsrc = k => VIDEOS[k] && VIDEOS[k] + VEXT;

/* ---------- живые портреты ---------- */
const imgKey = im => Object.keys(IMG).find(k => IMG[k] === im);
function slotVideo(el, im){
  const key = im && imgKey(im), src = vidOK && key && vsrc(key);
  let v = el.querySelector('video.pv');
  if(!src){ if(v){ v.classList.remove('on'); v.pause(); v.removeAttribute('src'); v.load(); v.dataset.k = ''; } return; }
  if(v && v.dataset.k === key) return;
  if(!v){ v = document.createElement('video'); v.className = 'pv'; v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto'; v.setAttribute('aria-hidden', 'true');
    el.querySelector('.bob').appendChild(v);
    v.addEventListener('playing', () => { if(v.dataset.k) v.classList.add('on'); });
    // за полсекунды до конца растворяемся в неподвижный портрет и начинаем заново
    v.addEventListener('timeupdate', () => { if(v.duration && v.currentTime > v.duration - .55 && v.classList.contains('on')){ v.classList.remove('on'); setTimeout(() => { if(!v.dataset.k) return; v.currentTime = 0; v.play().catch(() => {}); }, 420); } });
    v.addEventListener('error', () => { v.classList.remove('on'); v.dataset.k = ''; }); }
  v.classList.remove('on'); v.dataset.k = key;
  const m = `url("${im.src}")`; v.style.webkitMaskImage = v.style.maskImage = m;
  v.src = src; v.currentTime = 0; v.play().catch(() => {});
}
function stopPortraitVideos(){ document.querySelectorAll('.portrait video.pv').forEach(v => { v.classList.remove('on'); v.pause(); v.dataset.k = ''; }); }

/* ---------- кат-сцены ---------- */
function vcutFor(id){
  const c = VCUTS[id]; if(!c || !vidOK || !st || window.NOCUT || (st.tut && st.tut[c.key])) return null;
  return c.clips.every(k => VIDEOS[k]) ? c : null;
}
function playVCut(id, done){
  const C = VCUTS[id]; let finished = false, i = -1;
  const el = cutUI(); let v = el.querySelector('video.cut-vid');
  if(!v){ v = document.createElement('video'); v.className = 'cut-vid'; v.playsInline = true; v.setAttribute('playsinline', ''); el.insertBefore(v, el.firstChild); }
  const fade = el.querySelector('.cut-fade'), title = el.querySelector('.cut-title');
  const finish = () => { if(finished) return; finished = true; st.tut[C.key] = 1; save(); CUT.on = false; ui.cut = false; clearTimeout(CUT.tt);
    el.classList.add('out'); setTimeout(() => { el.classList.remove('on', 'out', 'vmode'); v.pause(); v.removeAttribute('src'); v.load(); }, 700); done(); };
  const next = () => { if(finished) return; i++; if(i >= C.clips.length) return finish();
    fade.style.transition = 'opacity .5s ease'; fade.style.opacity = 1;
    setTimeout(() => { if(finished) return; v.src = vsrc(C.clips[i]); v.currentTime = 0; v.muted = false; v.volume = Math.min(1, (SET.amb ?? 70) / 100);
      v.play().catch(() => { v.muted = true; v.play().catch(() => next()); }); }, i ? 450 : 0); };
  v.onplaying = () => { fade.style.opacity = 0; };
  v.onended = next; v.onerror = next;
  v.ontimeupdate = () => { if(v.duration && v.currentTime > v.duration - .5) fade.style.opacity = 1; };
  ui.cut = true; CUT.on = true; hideDlg(); hideHint(); trackOnce('vcut_' + C.key);
  el.classList.add('on', 'vmode'); el.querySelector('.cut-sub').textContent = ''; el.querySelector('.cut-sub').classList.remove('on');
  title.textContent = C.title || ''; title.classList.toggle('on', !!C.title); CUT.tt = setTimeout(() => title.classList.remove('on'), 4200);
  el.querySelector('.cut-skip').onclick = () => { track('cutscene_skipped', { key:C.key }); finish(); };
  CUT.skip = finish;
  next();
}
