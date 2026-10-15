'use strict';
/* =====================================================================
   КАТ-СЦЕНЫ ОБРЯДОВ В 3D
   Свой стиль: ночная северная река, туман, огни; женщины в праздничном —
   без лиц, как куклы-обереги. Камера идёт по планам, песня — субтитрами.
   Библиотека three.js грузится только перед первой кат-сценой (lib/three.min.js).
   ===================================================================== */
const CUT = { loading:null, on:false };
function loadThree(){
  if(window.THREE) return Promise.resolve(window.THREE);
  if(CUT.loading) return CUT.loading;
  CUT.loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'lib/three.min.js'; s.onload = () => res(window.THREE); s.onerror = () => { CUT.loading = null; rej(new Error('three')); }; document.head.appendChild(s); });
  return CUT.loading;
}
function webglOK(){ try{ const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }catch(e){ return false; } }
const CUTS = { river_rite:{ key:'cut_rusal', title:'Проводы русалок', build: buildRusal } };
function cutFor(id){ const c = CUTS[id]; return c && st && !(st.tut && st.tut[c.key]) && !window.NOCUT && webglOK() ? c : null; }

/* ---------- текстуры, нарисованные на холсте ---------- */
function ctex(w, h, draw, rep){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; if(rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } t.anisotropy = 4; return t; }
const rhombs = (g, x0, y, w, h, col) => { g.strokeStyle = col; g.lineWidth = 2; for(let x = x0; x < w; x += h * 1.2){ g.beginPath(); g.moveTo(x, y + h / 2); g.lineTo(x + h * .6, y); g.lineTo(x + h * 1.2, y + h / 2); g.lineTo(x + h * .6, y + h); g.closePath(); g.stroke(); g.fillStyle = col; g.fillRect(x + h * .5, y + h * .4, h * .2, h * .2); } };
function ponevaTex(base, line){ return ctex(256, 256, (g, w, h) => {   // клетчатая понёва с вышитым подолом
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.globalAlpha = .5; g.fillStyle = line; for(let i = 0; i < w; i += 16){ g.fillRect(i, 0, 3, h); g.fillRect(0, i, w, 3); }
  g.globalAlpha = .2; for(let i = 7; i < w; i += 16){ g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); }
  g.globalAlpha = .1; for(let i = 0; i < 2500; i++){ g.fillStyle = Math.random() < .5 ? '#000' : '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
  g.globalAlpha = 1; g.fillStyle = '#140d0b'; g.fillRect(0, h - 30, w, 30); rhombs(g, 2, h - 27, w, 20, '#b88a3a'); }, [5, 1]); }
function shirtTex(){ return ctex(256, 256, (g, w, h) => {   // белая льняная рубаха, красная вышивка по вороту и рукавам
  g.fillStyle = '#cfc4ad'; g.fillRect(0, 0, w, h);
  g.globalAlpha = .08; for(let i = 0; i < 900; i++){ g.fillStyle = Math.random() < .5 ? '#000' : '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 1, 3); } g.globalAlpha = 1;
  g.fillStyle = '#7e1416'; g.fillRect(0, h * .78, w, 22); rhombs(g, 0, h * .78 + 2, w, 18, '#d8bf8c'); g.fillStyle = '#7e1416'; g.fillRect(0, 10, w, 14); rhombs(g, 0, 12, w, 10, '#1a0c0a'); }, [2, 1]); }
function kerchiefTex(base, dot){ return ctex(128, 128, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = dot; for(let y = 8; y < h; y += 18) for(let x = (y / 18 % 2) * 9 + 4; x < w; x += 18){ g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } }, [2, 2]); }
function strawTex(){ return ctex(128, 128, (g, w, h) => { g.fillStyle = '#b59048'; g.fillRect(0, 0, w, h); for(let i = 0; i < 260; i++){ g.strokeStyle = `rgba(${200 + Math.random() * 50},${160 + Math.random() * 50},${70 + Math.random() * 40},.8)`; g.lineWidth = 1 + Math.random(); const x = Math.random() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (Math.random() - .5) * 10, h); g.stroke(); } }); }
function glowTex(){ return ctex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); }
function flameTex(){ return ctex(64, 128, (g, w, h) => { const gr = g.createRadialGradient(32, 92, 2, 32, 80, 50); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(.3, 'rgba(255,190,90,.9)'); gr.addColorStop(.7, 'rgba(220,90,30,.35)'); gr.addColorStop(1, 'rgba(160,40,10,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(62, 70, 46, 112); g.quadraticCurveTo(32, 124, 18, 112); g.quadraticCurveTo(2, 70, 32, 4); g.fill(); }); }
function mistTex(){ return ctex(256, 128, (g, w, h) => { for(let i = 0; i < 40; i++){ const x = Math.random() * w, y = h * (.35 + Math.random() * .3), r = 20 + Math.random() * 45; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } const m = g.createLinearGradient(0, 0, w, 0); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(.15, 'rgba(0,0,0,0)'); m.addColorStop(.85, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = m; g.fillRect(0, 0, w, h); }); }

/* ---------- женщина-кукла: без лица, в праздничном ---------- */
function makeWoman(o){
  const T3 = THREE, G = new T3.Group(), mat = (map, col, e) => new T3.MeshStandardMaterial({ map, color: col || 0xffffff, roughness: .85, metalness: 0, emissive: e || 0x000000 });
  const lathe = (pts, m, seg = 18) => new T3.Mesh(new T3.LatheGeometry(pts.map(([x, y]) => new T3.Vector2(x, y)), seg), m);
  const skirt = lathe([[0.001, 0], [.36, 0], [.34, .22], [.29, .55], [.22, .84], [.18, .96]], mat(o.poneva)); G.add(skirt);
  const torso = lathe([[.18, .94], [.2, 1.08], [.21, 1.22], [.17, 1.36], [.07, 1.43], [.001, 1.44]], mat(o.shirt)); G.add(torso);
  const belt = new T3.Mesh(new T3.TorusGeometry(.19, .018, 6, 20), mat(null, o.belt || 0xa3171a)); belt.rotation.x = Math.PI / 2; belt.position.y = .95; G.add(belt);
  const beads = new T3.Mesh(new T3.TorusGeometry(.085, .016, 6, 16), mat(null, o.beads || 0xc0391e, o.beads === 0xd98c1c ? 0x331800 : 0)); beads.rotation.x = Math.PI / 2.4; beads.position.set(0, 1.4, .03); G.add(beads);
  const head = new T3.Mesh(new T3.SphereGeometry(.1, 18, 14), mat(null, 0xb9987c)); head.position.y = 1.55; head.scale.set(.95, 1.08, .98); G.add(head);   // лица нет
  if(o.wreath){
    const hair = new T3.Mesh(new T3.SphereGeometry(.112, 16, 12, 0, Math.PI * 2, 0, Math.PI * .55), mat(null, 0x5a4027)); hair.position.y = 1.56; G.add(hair);
    const braid = new T3.Mesh(new T3.CylinderGeometry(.03, .018, .55, 6), mat(null, 0x5a4027)); braid.position.set(0, 1.25, -.11); G.add(braid);
    const wr = new T3.Mesh(new T3.TorusGeometry(.115, .03, 6, 18), mat(null, 0x3f5a2a)); wr.rotation.x = Math.PI / 2; wr.position.y = 1.63; G.add(wr);
    for(let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2, f = new T3.Mesh(new T3.SphereGeometry(.026, 6, 5), mat(null, i % 3 ? 0x3d63c9 : 0xe8c53a, i % 3 ? 0x0a1440 : 0x302000)); f.position.set(Math.cos(a) * .118, 1.65, Math.sin(a) * .118); G.add(f); }
  } else {
    const k = new T3.Mesh(new T3.SphereGeometry(.122, 18, 12, Math.PI / 2 + .62, Math.PI * 2 - 1.24, 0, Math.PI * .78), mat(o.kerchief)); k.material.side = T3.DoubleSide; k.position.y = 1.555; G.add(k);
    const tail = new T3.Mesh(new T3.ConeGeometry(.12, .3, 4), mat(o.kerchief)); tail.position.set(0, 1.4, -.1); tail.rotation.x = .35; G.add(tail);
  }
  const arm = side => { const A = new T3.Group(); const sl = new T3.Mesh(new T3.CylinderGeometry(.045, .055, .55, 8), mat(o.shirt)); sl.position.y = -.27; A.add(sl);
    const hand = new T3.Mesh(new T3.SphereGeometry(.04, 8, 6), mat(null, 0xb9987c)); hand.position.y = -.56; A.add(hand); A.position.set(side * .22, 1.36, 0); G.add(A); return A; };
  G.userData.armR = arm(1); G.userData.armL = arm(-1);
  if(o.torch){   // факел в правой руке
    const tr = new T3.Group(); const stick = new T3.Mesh(new T3.CylinderGeometry(.018, .022, .7, 6), mat(null, 0x3a2614)); stick.position.y = .3; tr.add(stick);
    const fl = new T3.Sprite(new T3.SpriteMaterial({ map: R3.flame, color: 0xffffff, blending: T3.AdditiveBlending, depthWrite: false, transparent: true })); fl.scale.set(.32, .6, 1); fl.position.y = .8; tr.add(fl);
    const gl = new T3.Sprite(new T3.SpriteMaterial({ map: R3.glow, color: 0xff9a3c, blending: T3.AdditiveBlending, depthWrite: false, transparent: true, opacity: .55 })); gl.scale.set(2.2, 2.2, 1); gl.position.y = .75; tr.add(gl);
    tr.position.y = -.56; G.userData.armR.add(tr); G.userData.armR.rotation.x = -2.2; G.userData.flame = fl; G.userData.flameGlow = gl;
  }
  G.scale.setScalar(o.h || 1); G.userData.ph = Math.random() * 6; return G;
}
/* шаг: чуть покачивается, руки ходят */
function walkPose(W, t, speed){
  const ph = W.userData.ph + t * speed * 5.2, a = Math.abs(Math.sin(ph));
  W.children[0].position.y = 0; W.position.y = (W.userData.y0 || 0) + a * .025 * (speed > 0 ? 1 : 0);
  W.rotation.z = Math.sin(ph) * .025 * (speed > 0 ? 1 : 0);
  if(!W.userData.flame) W.userData.armR.rotation.x = Math.sin(ph) * .35 * (speed > 0 ? 1 : .1);
  if(!W.userData.carry) W.userData.armL.rotation.x = -Math.sin(ph) * .35 * (speed > 0 ? 1 : .1);
  if(W.userData.flame){ const f = .9 + Math.sin(t * 13 + W.userData.ph) * .08 + Math.sin(t * 29) * .05; W.userData.flame.scale.set(.32 * f, .6 * (2 - f), 1); W.userData.flameGlow.material.opacity = .45 + f * .12; }
}
const R3 = {};

/* =====================================================================
   ПРОВОДЫ РУСАЛОК
   ===================================================================== */
function buildRusal(renderer){
  const T3 = THREE, S = new T3.Scene(), FOG = new T3.Color(0x03060d);
  S.fog = new T3.FogExp2(FOG, .05); S.background = FOG.clone();
  R3.glow = R3.glow || glowTex(); R3.flame = R3.flame || flameTex(); R3.mist = R3.mist || mistTex(); R3.straw = R3.straw || strawTex();
  const moonDir = new T3.Vector3(-.35, .32, -1).normalize();
  // небо с луной и звёздами
  const sky = new T3.Mesh(new T3.SphereGeometry(400, 32, 16), new T3.ShaderMaterial({ side: T3.BackSide, depthWrite: false, fog: false,
    uniforms: { uMoon: { value: moonDir } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vD; uniform vec3 uMoon; float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){ float y = clamp(vD.y, 0., 1.); vec3 c = mix(vec3(.022,.034,.06), vec3(.004,.006,.016), pow(y, .6));
        float m = max(dot(vD, uMoon), 0.); c += vec3(1.2,1.25,1.3) * smoothstep(.9993, .9996, m) + vec3(.12,.15,.22) * pow(m, 60.) + vec3(.02,.03,.05) * pow(m, 6.);
        vec3 q = floor(vD * 260.); float s = step(.9965, h(q)) * smoothstep(.05, .35, vD.y); c += vec3(.8) * s * (.5 + .5 * h(q + 1.));
        gl_FragColor = vec4(c, 1.); }` }));
  S.add(sky);
  // свет: луна, небо, костёр
  S.add(new T3.HemisphereLight(0x22304f, 0x030304, .3));
  const moon = new T3.DirectionalLight(0x8fa6e8, .22); moon.position.copy(moonDir).multiplyScalar(50); S.add(moon);
  // берега
  const groundM = new T3.MeshStandardMaterial({ color: 0x0c120c, roughness: 1 });
  const near = new T3.Mesh(new T3.PlaneGeometry(140, 40, 60, 20), groundM); near.rotation.x = -Math.PI / 2; near.position.set(0, 0, 25.5);
  { const p = near.geometry.attributes.position; for(let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i); const zW = 25.5 - y; p.setZ(i, (zW - 6) * .06 * Math.max(0, zW - 6) * .12 + Math.sin(x * .3) * .08 + (zW < 6.6 ? -.25 : 0)); } near.geometry.computeVertexNormals(); }
  S.add(near);
  const far = new T3.Mesh(new T3.PlaneGeometry(140, 60, 40, 20), groundM); far.rotation.x = -Math.PI / 2; far.position.set(0, .2, -36); S.add(far);
  // вода: лунная дорожка, рябь, туман
  const water = new T3.Mesh(new T3.PlaneGeometry(140, 13, 1, 1), new T3.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uMoon: { value: moonDir }, uFog: { value: FOG }, uDen: { value: .045 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec3 vW; uniform float uT; uniform vec3 uMoon; uniform vec3 uFog; uniform float uDen;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+1.),f.x), f.y); }
      void main(){ vec3 V = normalize(cameraPosition - vW); vec2 p = vW.xz;
        float a = n(p * 1.3 + vec2(uT * .35, uT * .08)) + .5 * n(p * 3.7 - vec2(uT * .5, -uT * .2)) + .25 * n(p * 9. + uT);
        float b = n(p.yx * 1.1 - vec2(uT * .2, uT * .3)) + .5 * n(p.yx * 4.3 + uT * .4);
        vec3 N = normalize(vec3((a - .85) * .22, 1., (b - .75) * .22));
        vec3 R = reflect(-V, N); float fr = .04 + .9 * pow(1. - max(dot(V, N), 0.), 4.);
        vec3 sky = mix(vec3(.025,.04,.07), vec3(.004,.007,.016), clamp(R.y * 1.4, 0., 1.));
        float m = max(dot(R, uMoon), 0.);
        vec3 c = vec3(.002,.004,.008) + sky * fr + vec3(1.,.96,.86) * (pow(m, 900.) * 9. + pow(m, 70.) * .25);
        float d = length(cameraPosition - vW); float f = 1. - exp(-uDen * uDen * d * d);
        gl_FragColor = vec4(mix(c, uFog, f), 1.); }` }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -.05, 0); S.add(water);
  // ели: по три конуса друг на друге
  const spruce = (n, zA, zB, seed) => { const geo = new T3.ConeGeometry(1, 1, 7), m = new T3.MeshStandardMaterial({ color: 0x0d1712, roughness: 1 });
    const I = new T3.InstancedMesh(geo, m, n * 3), M = new T3.Matrix4(); let k = 0, r = seed;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for(let i = 0; i < n; i++){ const x = -70 + rnd() * 140, z = zA + rnd() * (zB - zA), H = 6 + rnd() * 9;
      for(let j = 0; j < 3; j++){ const w = H * (.32 - j * .07), y = H * (.25 + j * .25); M.compose(new T3.Vector3(x, y + (zA < 0 ? .2 : 0), z), new T3.Quaternion(), new T3.Vector3(w, H * .45, w)); I.setMatrixAt(k++, M); } }
    S.add(I); };
  spruce(220, -9, -45, 7); spruce(120, 20, 42, 13);
  // трава и камыш у берега
  { const geo = new T3.ConeGeometry(.03, .45, 3), m = new T3.MeshStandardMaterial({ color: 0x18241a, roughness: 1 }), n = 3500, I = new T3.InstancedMesh(geo, m, n), M = new T3.Matrix4(), Q = new T3.Quaternion(), E = new T3.Euler();
    for(let i = 0; i < n; i++){ let x, z; do{ x = -45 + Math.random() * 70; z = 6.4 + Math.random() * 14; } while((z > 7.8 && z < 9.4) || (z > 9.4 && z < 13 && x > -4 && x < 3)); const reed = z < 7 && Math.random() < .6, s = reed ? 2.2 : .6 + Math.random() * .7;
      E.set((Math.random() - .5) * .3, 0, (Math.random() - .5) * .3); Q.setFromEuler(E); M.compose(new T3.Vector3(x, s * .27 - (z < 6.6 ? .2 : 0), z), Q, new T3.Vector3(1, s, 1)); I.setMatrixAt(i, M); }
    S.add(I); }
  // мостки
  const wood = new T3.MeshStandardMaterial({ color: 0x3b2c1f, roughness: .95 });
  for(let i = 0; i < 11; i++){ const b = new T3.Mesh(new T3.BoxGeometry(1.3, .07, .36), wood); b.position.set(4 + (Math.random() - .5) * .06, .32, 6.6 - i * .42); b.rotation.y = (Math.random() - .5) * .05; S.add(b); }
  for(const z of [6.4, 4.2, 2.3]) for(const x of [3.4, 4.6]){ const p = new T3.Mesh(new T3.CylinderGeometry(.06, .07, 1.4, 6), wood); p.position.set(x, -.3, z); S.add(p); }
  // ива у мостков
  { const tr = new T3.Mesh(new T3.CylinderGeometry(.22, .35, 3.6, 8), wood); tr.position.set(6.4, 1.6, 7.4); tr.rotation.z = -.15; S.add(tr);
    const lm = new T3.MeshStandardMaterial({ color: 0x0f1a12, roughness: 1 }), geo = new T3.CylinderGeometry(.008, .004, 2.2, 3), I = new T3.InstancedMesh(geo, lm, 320), M = new T3.Matrix4();
    for(let i = 0; i < 320; i++){ const a = Math.random() * Math.PI * 2, r = .3 + Math.random() * 1.5; M.compose(new T3.Vector3(6.6 + Math.cos(a) * r, 2.4 - Math.random() * .6, 7.4 + Math.sin(a) * r * .8), new T3.Quaternion(), new T3.Vector3(1, .6 + Math.random() * .7, 1)); I.setMatrixAt(i, M); }
    S.add(I); }
  // костёр на берегу
  const fire = new T3.Group(); fire.position.set(-1.5, 0, 11.2); S.add(fire);
  for(let i = 0; i < 5; i++){ const l = new T3.Mesh(new T3.CylinderGeometry(.05, .06, .9, 5), wood); l.rotation.z = Math.PI / 2; l.rotation.y = i * 1.25; l.position.y = .06; fire.add(l); }
  const fireSpr = []; for(let i = 0; i < 3; i++){ const f = new T3.Sprite(new T3.SpriteMaterial({ map: R3.flame, blending: T3.AdditiveBlending, depthWrite: false, transparent: true })); f.position.set((i - 1) * .18, .45, 0); f.scale.set(.6, 1.1, 1); fire.add(f); fireSpr.push(f); }
  const fireL = new T3.PointLight(0xff8a3a, 2.2, 14, 2); fireL.position.set(0, .8, 0); fire.add(fireL);
  // туман над водой
  const mists = []; for(let i = 0; i < 18; i++){ const m = new T3.Mesh(new T3.PlaneGeometry(22, 4), new T3.MeshBasicMaterial({ map: R3.mist, transparent: true, depthWrite: false, opacity: .12, color: 0x40506e, fog: false }));
    m.position.set(-40 + i * 6 + Math.random() * 3, .5 + Math.random() * .9, -5 + Math.random() * 13); m.userData.v = .25 + Math.random() * .35; S.add(m); mists.push(m); }
  // светлячки
  const ffN = 120, ffG = new T3.BufferGeometry(), ffP = new Float32Array(ffN * 3); for(let i = 0; i < ffN; i++){ ffP[i * 3] = -25 + Math.random() * 40; ffP[i * 3 + 1] = .3 + Math.random() * 1.8; ffP[i * 3 + 2] = 6 + Math.random() * 10; }
  ffG.setAttribute('position', new T3.BufferAttribute(ffP, 3)); const ff = new T3.Points(ffG, new T3.PointsMaterial({ map: R3.glow, size: .14, color: 0xffcf73, transparent: true, blending: T3.AdditiveBlending, depthWrite: false })); S.add(ff);
  // отражения огней на воде — вытянутые блики к камере
  const streaks = []; const addStreak = (src, s = 1) => { const m = new T3.Mesh(new T3.PlaneGeometry(.16 * s, 3.6 * s), new T3.MeshBasicMaterial({ map: R3.glow, color: 0xff9a44, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, opacity: .3 })); m.rotation.x = -Math.PI / 2; S.add(m); streaks.push({ m, src }); };
  addStreak(fire, 1.6);

  // шествие: шесть женщин и две девочки с куклой
  const tex = { shirt: shirtTex(), pon: [ponevaTex('#7e1715', '#120707'), ponevaTex('#8f2318', '#160806'), ponevaTex('#5e1111', '#0b0404'), ponevaTex('#3a1a1c', '#000')],
    ker: [kerchiefTex('#9e1f1a', '#d9a640'), kerchiefTex('#b37a18', '#6e1410'), kerchiefTex('#cbc1ab', '#8a1517'), kerchiefTex('#1b2036', '#9e1f1a')] };
  const W = [];
  const add = (o, x) => { const w = makeWoman({ shirt: tex.shirt, ...o }); w.position.set(x, 0, 8.6); w.rotation.y = Math.PI / 2; S.add(w); W.push(w); return w; };
  const grunya = add({ poneva: tex.pon[0], kerchief: tex.ker[0], torch: true, beads: 0xd98c1c, h: .96 }, -22);
  add({ poneva: tex.pon[1], kerchief: tex.ker[1], torch: true }, -23.4);
  const girl1 = add({ poneva: tex.pon[1], wreath: true, h: .74 }, -24.8), girl2 = add({ poneva: tex.pon[2], wreath: true, h: .72 }, -25.5);
  add({ poneva: tex.pon[2], kerchief: tex.ker[2], torch: true }, -26.9);
  const nina = add({ poneva: tex.pon[3], kerchief: tex.ker[3] }, -28.2);
  add({ poneva: tex.pon[0], kerchief: tex.ker[1], torch: true }, -29.6);
  girl1.userData.carry = girl2.userData.carry = true; girl1.userData.armL.rotation.x = girl2.userData.armL.rotation.x = -1.1;
  for(const w of W) if(w.userData.flame) addStreak(w.userData.flame, .8);
  const torchLights = W.filter(w => w.userData.flame).slice(0, 3).map(w => { const L = new T3.PointLight(0xff9440, 1.6, 9, 2); w.userData.flame.parent.add(L); L.position.y = .8; return L; });
  // шест у Нины
  const pole = new T3.Mesh(new T3.CylinderGeometry(.025, .03, 3.4, 6), wood); pole.position.set(.05, -.2, .3); pole.rotation.x = .3; nina.userData.armR.add(pole);
  // соломенная кукла в рубахе, тоже без лица
  const doll = new T3.Group(); { const body = new T3.Mesh(new T3.ConeGeometry(.17, .62, 10), new T3.MeshStandardMaterial({ map: R3.straw, roughness: 1 })); body.position.y = .31; doll.add(body);
    const sh = new T3.Mesh(new T3.CylinderGeometry(.09, .15, .3, 10), new T3.MeshStandardMaterial({ map: tex.shirt, roughness: 1 })); sh.position.y = .42; doll.add(sh);
    const hd = new T3.Mesh(new T3.SphereGeometry(.075, 10, 8), new T3.MeshStandardMaterial({ map: R3.straw, roughness: 1 })); hd.position.y = .66; doll.add(hd);
    const arms = new T3.Mesh(new T3.CylinderGeometry(.02, .02, .42, 5), new T3.MeshStandardMaterial({ map: R3.straw })); arms.rotation.z = Math.PI / 2; arms.position.y = .5; doll.add(arms); }
  S.add(doll);
  // русалка на краю мостков
  const rus = makeWoman({ shirt: ctex(8, 8, (g) => { g.fillStyle = '#dfe6ee'; g.fillRect(0, 0, 8, 8); }), poneva: ctex(8, 8, (g) => { g.fillStyle = '#c9d3dc'; g.fillRect(0, 0, 8, 8); }), wreath: true });
  rus.traverse(o => { if(o.material){ o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; o.material.depthWrite = false; o.material.emissive = new T3.Color(0x1c2a3a); } });
  { const hair = new T3.Mesh(new T3.CylinderGeometry(.13, .2, 1.3, 10, 1, true), new T3.MeshStandardMaterial({ color: 0x1b2a22, transparent: true, opacity: 0, side: T3.DoubleSide })); hair.position.set(0, 1.0, -.08); rus.add(hair); }
  rus.position.set(4, .02, 2.15); rus.rotation.y = Math.PI * .85; rus.scale.setScalar(.92); rus.children[0].scale.y = .6; S.add(rus);

  // ход обряда во времени: где кто, что поётся
  const LEAD_SPEED = 1.15, STOP_X = 2.2;
  const songT = 6, lines = SONGS.rusal.lines, sub = lines.map((l, i) => ({ t: songT + i * 3.1, text: l }));
  const ev = [ { t: songT, f: () => hum('rusal') }, { t: songT + 6.4, f: () => hum('rusal') }, { t: songT + 12.8, f: () => hum('rusal') }, { t: songT + 19.2, f: () => hum('rusal') } ];
  const pos = (w, i, t) => {   // позиция каждого в шествии
    const lead = -22 + Math.min(t, 21) * LEAD_SPEED, run = t > 33 ? (t - 33) : 0;
    const gap = [0, 1.4, 2.8, 3.5, 4.9, 6.2, 7.6][i];
    let x = Math.min(lead - gap, STOP_X - gap * .55), z = 8.6;
    if(t > 21){ z = 8.6 - Math.min(1, (t - 21) / 3) * (i === 2 || i === 3 ? 2.1 : i === 5 ? 1.4 : .9) + (i % 2 ? .5 : 0); }
    if(run){ x -= run * run * .9 + run * 2; z += Math.min(run, 2) * .4; }
    return { x, z, moving: t < 21 + gap * .5 || run > 0, back: run > 0 };
  };
  const camShots = [   // планы камеры: [начало, конец, откуда→куда, на что смотреть→куда]
    [0, 7, [-8, 1.6, 17], [-4, 1.3, 14], [-6, 1, 0], [-3, .9, 0]],
    [7, 17, null, null, null, null],               // проводка рядом с шествием (считается ниже)
    [17, 25, [1.2, .85, 10.4], [1.8, .8, 10.1], [-3.2, .95, 8.6], [.4, .85, 7.8]],
    [25, 33, [1.2, .45, 1.2], [1.6, .4, 1.6], [3.4, .3, 4.6], [3.5, .35, 4.6]],
    [33, 39, [-1.6, 1.7, 12.6], [-1.2, 1.9, 13.2], [2.4, .4, 3.8], [2.8, .3, 2.6]],
    [39, 46, [.2, .75, -2.6], [.5, .72, -2.3], [4, .8, 2.3], [4, .78, 2.3]],
  ];
  const ease = x => x * x * (3 - 2 * x), lerp3 = (a, b, k) => new T3.Vector3(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
  return { scene: S, duration: 46, sub, ev,
    update(t, cam){
      water.material.uniforms.uT.value = t;
      // шествие
      W.forEach((w, i) => { const p = pos(w, i, t); w.position.x = p.x; w.position.z = p.z; w.rotation.y = p.back ? -Math.PI / 2 : (t > 21 && !p.moving ? Math.PI * .9 : Math.PI / 2); walkPose(w, t, p.moving ? (p.back ? 1.8 : 1) : 0); });
      // кукла: у девочек в руках, потом на воде — стоит, потом течение берёт
      const gx = (girl1.position.x + girl2.position.x) / 2, gz = (girl1.position.z + girl2.position.z) / 2;
      if(t < 24){ doll.position.set(gx, .68, gz); doll.rotation.set(0, 0, Math.PI / 2 * 0); }
      else if(t < 26){ const k = ease((t - 24) / 2); doll.position.set(gx + (3.5 - gx) * k, .68 * (1 - k) - .02 * k, gz + (4.6 - gz) * k); }
      else if(t < 34){ doll.position.set(3.5, -.02, 4.6); doll.rotation.z = Math.sin(t * 1.3) * .015; }
      else { const d = t - 34; doll.position.set(3.5 + d * .35, -.02 - Math.max(0, d - 8) * .02, 4.6 - d * .55); doll.rotation.y = d * .25; doll.rotation.z = Math.sin(t * 1.7) * .05; }
      // шест Нины тянется к кукле
      nina.userData.armR.rotation.x = t > 31 && t < 35 ? -1.2 : Math.sin(t * 2) * .1;
      // русалка — на миг, в конце
      const ra = t > 39.5 ? Math.min(1, (t - 39.5) / 1.5) * (t > 44 ? Math.max(0, 1 - (t - 44) / 1.2) : 1) : 0;
      rus.traverse(o => { if(o.material){ o.material.opacity = ra * .42; } });
      // огонь, туман, светлячки, отражения
      for(const f of fireSpr){ const k = .85 + Math.random() * .3; f.scale.set(.6 * k, 1.1 * (2 - k), 1); }
      fireL.intensity = 2 + Math.sin(t * 17) * .25 + Math.random() * .2;
      for(const L of torchLights) L.intensity = 1.4 + Math.sin(t * 15 + L.id) * .2;
      for(const m of mists){ m.position.x += m.userData.v * .016; if(m.position.x > 40) m.position.x = -40; m.lookAt(cam.position.x, m.position.y, cam.position.z); }
      const P = ff.geometry.attributes.position; for(let i = 0; i < ffN; i++){ P.array[i * 3 + 1] += Math.sin(t * 1.3 + i) * .003; P.array[i * 3] += Math.cos(t * .7 + i * 2) * .004; } P.needsUpdate = true;
      ff.material.opacity = .6 + Math.sin(t * 3) * .2;
      const wp = new T3.Vector3();
      for(const s of streaks){ s.src.getWorldPosition(wp); const vis = wp.z > 6.2 ? 0 : 1; const toCam = new T3.Vector3(cam.position.x - wp.x, 0, cam.position.z - wp.z).normalize();
        s.m.position.set(wp.x + toCam.x * 1.6, -.03, Math.min(wp.z, 6) + toCam.z * 1.6); s.m.rotation.z = Math.atan2(toCam.x, toCam.z); s.m.material.opacity = (.2 + Math.random() * .06) * (wp.z < 9.5 ? 1 : .5) * (vis ? 1 : .6); }
      // камера
      const sh = camShots.find(s => t >= s[0] && t < s[1]) || camShots[camShots.length - 1], k = ease(Math.min(1, (t - sh[0]) / (sh[1] - sh[0])));
      if(sh[2]){ cam.position.copy(lerp3(sh[2], sh[3], k)); cam.lookAt(lerp3(sh[4], sh[5], k)); }
      else { const lx = grunya.position.x; cam.position.set(lx + 3.2 - k * 1.2, 1.25 + Math.sin(t * .6) * .03, 12.6); cam.lookAt(lx - 1.6, 1.15, 8.6); }
    } };
}


/* ---------- кино: свечение, виньетка, зерно, ночная цветокоррекция (свой проход, без лишних библиотек) ---------- */
function makePost(R){
  const T3 = THREE, isGL2 = R.capabilities.isWebGL2, type = isGL2 ? T3.HalfFloatType : T3.UnsignedByteType;
  const mk = (w, h) => new T3.WebGLRenderTarget(w, h, { type, depthBuffer: true });
  const P = { main: mk(2, 2), a: mk(2, 2), b: mk(2, 2) };
  const quad = new T3.Mesh(new T3.PlaneGeometry(2, 2)), qs = new T3.Scene(), qc = new T3.OrthographicCamera(-1, 1, 1, -1, 0, 1); qs.add(quad);
  const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const bright = new T3.ShaderMaterial({ uniforms: { tex: { value: null } }, vertexShader: vs, toneMapped: false,
    fragmentShader: 'varying vec2 vUv; uniform sampler2D tex; void main(){ vec3 c = texture2D(tex, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(.55, 1.4, l), 1.); }' });
  const blur = new T3.ShaderMaterial({ uniforms: { tex: { value: null }, dir: { value: new T3.Vector2() } }, vertexShader: vs, toneMapped: false,
    fragmentShader: 'varying vec2 vUv; uniform sampler2D tex; uniform vec2 dir; void main(){ vec3 c = texture2D(tex, vUv).rgb * .227; c += (texture2D(tex, vUv + dir * 1.385).rgb + texture2D(tex, vUv - dir * 1.385).rgb) * .316; c += (texture2D(tex, vUv + dir * 3.23).rgb + texture2D(tex, vUv - dir * 3.23).rgb) * .07; gl_FragColor = vec4(c, 1.); }' });
  const comp = new T3.ShaderMaterial({ uniforms: { tex: { value: null }, bloom: { value: null }, t: { value: 0 }, exp: { value: 1.0 } }, vertexShader: vs, toneMapped: false,
    fragmentShader: `varying vec2 vUv; uniform sampler2D tex, bloom; uniform float t, exp;
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){ vec3 c = texture2D(tex, vUv).rgb + texture2D(bloom, vUv).rgb * 1.15;
        c *= exp; c = aces(c);
        float L = dot(c, vec3(.299, .587, .114)); c = mix(vec3(L), c, .88);                 // чуть меньше насыщенности
        c = mix(c, c * vec3(.86, .95, 1.12), .55 * (1. - smoothstep(.15, .6, L)));         // тени — в холодную синеву
        c = mix(c, c * vec3(1.08, 1., .9), smoothstep(.45, .9, L) * .5);                  // огонь — тёплый
        vec2 q = vUv - .5; c *= 1. - dot(q, q) * 1.05;                                    // виньетка
        c = pow(c, vec3(1. / 2.2));
        c += (h(vUv * 931. + t) - .5) * .045;                                             // плёночное зерно
        gl_FragColor = vec4(c, 1.); }` });
  return {
    size(w, h){ const pr = R.getPixelRatio(); P.main.setSize(w * pr, h * pr); const bw = Math.max(1, (w * pr) >> 2), bh = Math.max(1, (h * pr) >> 2); P.a.setSize(bw, bh); P.b.setSize(bw, bh); blur.userData = [1 / bw, 1 / bh]; },
    render(scene, cam, t){
      R.setRenderTarget(P.main); R.render(scene, cam);
      quad.material = bright; bright.uniforms.tex.value = P.main.texture; R.setRenderTarget(P.a); R.render(qs, qc);
      const [ix, iy] = blur.userData || [.004, .004];
      for(let i = 0; i < 2; i++){ quad.material = blur; blur.uniforms.tex.value = P.a.texture; blur.uniforms.dir.value.set(ix * (1 + i), 0); R.setRenderTarget(P.b); R.render(qs, qc);
        blur.uniforms.tex.value = P.b.texture; blur.uniforms.dir.value.set(0, iy * (1 + i)); R.setRenderTarget(P.a); R.render(qs, qc); }
      quad.material = comp; comp.uniforms.tex.value = P.main.texture; comp.uniforms.bloom.value = P.a.texture; comp.uniforms.t.value = t % 10; R.setRenderTarget(null); R.render(qs, qc);
    },
    dispose(){ P.main.dispose(); P.a.dispose(); P.b.dispose(); } };
}

/* ---------- показ кат-сцены поверх игры ---------- */
function cutUI(){
  let el = document.getElementById('cut'); if(el) return el;
  el = document.createElement('div'); el.id = 'cut'; el.className = 'cut';
  el.innerHTML = '<canvas class="cut-cv"></canvas><div class="cut-bar top"></div><div class="cut-bar bot"></div><p class="cut-title"></p><p class="cut-sub" aria-live="polite"></p><button type="button" class="cut-skip">Пропустить <span aria-hidden="true">›</span></button><div class="cut-fade"></div>';
  document.body.appendChild(el); return el;
}
function playCut(id, done){
  const C = CUTS[id]; let finished = false;
  const finish = () => { if(finished) return; finished = true; st.tut[C.key] = 1; save(); CUT.on = false; ui.cut = false; cancelAnimationFrame(CUT.raf); removeEventListener('resize', onR);
    const el = document.getElementById('cut'); el.classList.add('out'); setTimeout(() => { el.classList.remove('on', 'out'); if(CUT.renderer){ CUT.post && CUT.post.dispose(); CUT.renderer.dispose(); CUT.renderer.forceContextLoss && CUT.renderer.forceContextLoss(); CUT.renderer = null; } }, 700); done(); };
  ui.cut = true; CUT.on = true; hideDlg && hideDlg(); hideHint && hideHint();
  const el = cutUI(); el.classList.add('on'); el.querySelector('.cut-title').textContent = C.title; el.querySelector('.cut-sub').textContent = '';
  el.querySelector('.cut-skip').onclick = () => { track('cutscene_skipped', {}); finish(); };
  CUT.skip = finish;
  const onR = () => { if(!CUT.renderer) return; CUT.renderer.setSize(innerWidth, innerHeight, false); CUT.post && CUT.post.size(innerWidth, innerHeight); CUT.cam.aspect = innerWidth / innerHeight; CUT.cam.updateProjectionMatrix(); };
  loadThree().then(() => {
    if(finished) return;
    const cv = el.querySelector('.cut-cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    R.setPixelRatio(Math.min(1.5, devicePixelRatio || 1)); R.setSize(innerWidth, innerHeight, false);
    R.outputEncoding = THREE.LinearEncoding; R.toneMapping = THREE.NoToneMapping;   // тон и гамма — в своём проходе
    const post = CUT.post = makePost(R); post.size(innerWidth, innerHeight);
    CUT.renderer = R; const cam = CUT.cam = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 62 : 42, innerWidth / innerHeight, .05, 600);
    const P = C.build(R); addEventListener('resize', onR);
    const t0 = performance.now(); let si = -1; const evDone = new Set(); trackOnce('cutscene_' + C.key);
    const loop = () => {
      if(finished) return;
      const t = (performance.now() - t0) / 1000 * (window.CUT_SPEED ?? 1) + (window.CUT_T0 || 0);
      P.update(t, cam); post.render(P.scene, cam, t);
      // субтитры песни
      let cur = -1; for(let i = 0; i < P.sub.length; i++) if(t >= P.sub[i].t) cur = i;
      if(cur !== si){ si = cur; const s = el.querySelector('.cut-sub'); s.classList.remove('on'); void s.offsetWidth; if(cur >= 0){ s.textContent = P.sub[cur].text; s.classList.add('on'); } }
      if(t > P.sub[P.sub.length - 1].t + 3.5) el.querySelector('.cut-sub').classList.remove('on');
      for(const e of P.ev) if(t >= e.t && !evDone.has(e)){ evDone.add(e); e.f(); }
      el.querySelector('.cut-title').classList.toggle('on', t > .8 && t < 5.5);
      el.querySelector('.cut-fade').style.opacity = t < 1.2 ? 1 - t / 1.2 : t > P.duration - 1.6 ? Math.min(1, (t - P.duration + 1.6) / 1.4) : 0;
      if(t >= P.duration){ finish(); return; }
      CUT.raf = requestAnimationFrame(loop);
    };
    CUT.raf = requestAnimationFrame(loop);
  }).catch(() => finish());   // нет WebGL или библиотеки — просто продолжаем разговор
}
/* Esc и пробел во время кат-сцены: Esc — пропустить, остальное не доходит до игры */
addEventListener('keydown', e => { if(!CUT.on) return; e.stopImmediatePropagation(); e.preventDefault(); if(e.code === 'Escape' && CUT.skip) CUT.skip(); }, true);
