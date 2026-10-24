'use strict';
/* =====================================================================
   ОЩУЩЕНИЕ — фирменные взаимодействия
   - переход между местами: темнота смыкается кругом вокруг Анны и
     раскрывается уже на новом месте;
   - разговор: мир за спиной собеседников уходит в мягкий расфокус;
   - улика: карточка показывается и улетает в тетрадь, узелок на
     тетради вздрагивает; на телефоне — короткий отклик вибрацией.
   ===================================================================== */
const FEEL = { reduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
const haptic = ms => { try{ if(navigator.vibrate && matchMedia('(pointer:coarse)').matches) navigator.vibrate(ms); }catch(e){} };

/* где сейчас Анна на экране (в css-пикселях) */
function annaScreen(){
  try{ const k = charK(st.strip), x = (R(st.strip, st.x) - camX) * VIEW.s / VIEW.dpr, y = (VIEW.oy + (GY - 62 * k) * VIEW.s) / VIEW.dpr;
    return [Math.max(0, Math.min(innerWidth, x)), Math.max(0, Math.min(innerHeight, y))]; }catch(e){ return [innerWidth / 2, innerHeight * .6]; }
}
/* круг темноты: close — смыкается к Анне, иначе раскрывается от неё */
function iris(close, done){
  const el = $('fade');
  if(FEEL.reduce){ el.classList.toggle('on', close); setTimeout(() => done && done(), close ? 450 : 300); return; }
  const [ix, iy] = annaScreen(), Rm = Math.hypot(Math.max(ix, innerWidth - ix), Math.max(iy, innerHeight - iy)) + 80, D = close ? 480 : 560, t0 = performance.now();
  el.style.setProperty('--ix', ix + 'px'); el.style.setProperty('--iy', iy + 'px'); el.classList.add('iris'); el.classList.remove('on');
  const step = now => { const q = Math.min(1, (now - t0) / D), e = close ? q * q * q : 1 - Math.pow(1 - q, 3);
    el.style.setProperty('--r', (close ? Rm - (Rm + 90) * e : -90 + (Rm + 90) * e) + 'px');
    if(q < 1) requestAnimationFrame(step); else { if(!close) el.classList.remove('iris'); done && done(); } };
  requestAnimationFrame(step);
}

/* ---------- улика летит в тетрадь ---------- */
let flyQ = Promise.resolve();
function clueFly(c){
  haptic(18);
  flyQ = flyQ.then(() => new Promise(res => {
    const el = document.createElement('div'); el.className = 'flyc' + (c.kind === 'en' ? ' en' : '');
    const pic = c.img && ASSETS[c.img] ? `<img src="${ASSETS[c.img]}" alt="">` : '';
    el.innerHTML = `${pic}<span class="k">${c.kind === 'en' ? 'Запись по-английски' : KIND[c.kind] || 'Улика'} · в тетрадь</span><b>${c.t}</b>`;
    el.setAttribute('role', 'status'); document.body.appendChild(el);
    const book = $('bBook').getBoundingClientRect(), r = el.getBoundingClientRect();
    const dx = book.left + book.width / 2 - (r.left + r.width / 2), dy = book.top + book.height / 2 - (r.top + r.height / 2);
    const done = () => { el.remove(); const k = $('bookDot'); if(k){ k.hidden = false; k.classList.remove('pulse'); void k.offsetWidth; k.classList.add('pulse'); } res(); };
    if(FEEL.reduce || !el.animate){ setTimeout(() => { el.classList.add('gone'); setTimeout(done, 400); }, 1800); return; }
    const a = el.animate([
      { opacity:0, transform:'translate(-50%, 10px) scale(.94)' },
      { opacity:1, transform:'translate(-50%, 0) scale(1)', offset:.12 },
      { opacity:1, transform:'translate(-50%, 0) scale(1)', offset:.62 },
      { opacity:.0, transform:`translate(calc(-50% + ${dx}px), ${dy}px) scale(.18) rotate(-6deg)` } ], { duration:2300, easing:'cubic-bezier(.45,.05,.3,1)', fill:'forwards' });
    a.onfinish = done;
  }));
}
