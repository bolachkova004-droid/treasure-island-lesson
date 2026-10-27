#!/usr/bin/env python3
"""Собирает index.html — весь Treasure Island в одном файле.

Ученице нужна одна ссылка, поэтому index.html — это страница с вкладками
«Главы I–II · III · IV · V · Слова», а внутри неё лежат готовые уроки
целиком (каждый в своём iframe, чтобы стили не смешивались). Файл не
зависит от остальных файлов и работает даже скачанным.

Исходники, которые правим руками:
  lesson-1-2.html, chapter-3.html, chapter-4.html, chapter-5.html,
  a2-words.html, chapter-kit.js, chapter-kit.css, speech.js

После любой правки исходников запустить:  python3 build-index.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
read = lambda name: (ROOT / name).read_text(encoding='utf-8')

PARTS = [
    # id,      файл,              подпись на вкладке, заголовок окна
    ('12',    'lesson-1-2.html', 'Главы I–II', 'Главы I–II · The Benbow Ledger'),
    ('ch3',   'chapter-3.html',  'Глава III',  'Глава III · The Black Spot'),
    ('ch4',   'chapter-4.html',  'Глава IV',   'Глава IV · The Sea-Chest'),
    ('ch5',   'chapter-5.html',  'Глава V',    'Глава V · The Last of the Blind Man'),
    ('words', 'a2-words.html',   'Слова A2',   'Тренажёр слов A2'),
]
FILE_TO_PART = {f: pid for pid, f, _, _ in PARTS}
FILE_TO_PART.update({'index.html': '12', 'index-3.html': '12'})

# Ссылки между уроками внутри общего файла переключают вкладку,
# а при открытии урока отдельным файлом работают как обычные ссылки.
BRIDGE = """<script>
(() => {
  const FILES = %s;
  const part = href => FILES[String(href || '').split('#')[0].split('?')[0].split('/').pop()];
  const inHub = window.parent !== window;
  window.__tiGo = href => { const id = part(href); if(inHub && id) window.parent.postMessage({ tiGo:id }, '*'); else location.href = href; };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if(!a || !inHub) return;
    const id = part(a.getAttribute('href'));
    if(id){ e.preventDefault(); window.parent.postMessage({ tiGo:id }, '*'); }
  }, true);
})();
</script>""" % json.dumps(FILE_TO_PART)


def inline(html):
    """Подставляет общие файлы прямо в страницу урока."""
    def sub(pattern, repl):
        nonlocal html
        html, n = re.subn(pattern, lambda m: repl, html)
        return n
    sub(r'<link rel="stylesheet" href="chapter-kit\.css">', '<style>\n' + read('chapter-kit.css') + '\n</style>')
    sub(r'<script src="chapter-kit\.js"></script>', '<script>\n' + read('chapter-kit.js') + '\n</script>')
    sub(r'<script src="speech\.js"></script>', '<script>\n' + read('speech.js') + '\n</script>')
    html = re.sub(r"location\.href = '([\w-]+\.html)'", r"__tiGo('\1')", html)
    assert 'src="speech.js"' not in html and 'href="chapter-kit.css"' not in html
    return html.replace('</body>', BRIDGE + '\n</body>', 1)


def js_string(html):
    # '<' экранируем целиком, чтобы внутри <script> не встретилось </script> или <!--
    return json.dumps(html, ensure_ascii=False).replace('<', '\\u003c')


tabs = ''.join('<button class="tab" data-part="%s" role="tab">%s</button>' % (pid, label) for pid, _, label, _ in PARTS)
data = ',\n'.join('  %s: { title:%s, html:%s }' % (json.dumps(pid), json.dumps(title, ensure_ascii=False), js_string(inline(read(f))))
                  for pid, f, _, title in PARTS)

HUB = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#16324f">
<meta name="format-detection" content="telephone=no">
<title>Treasure Island · уроки английского</title>
<!-- Этот файл собирается скриптом build-index.py — не редактируйте его вручную. -->
<style>
*{box-sizing:border-box}
html,body{height:100%%;margin:0;background:#16324f;overflow:hidden}
body{display:flex;flex-direction:column;height:100vh;height:100dvh;font-family:Rubik,"Trebuchet MS",sans-serif}
.hub{display:flex;align-items:center;gap:10px;flex:0 0 auto;padding:6px max(10px,env(safe-area-inset-right)) 6px max(10px,env(safe-area-inset-left));padding-top:max(6px,env(safe-area-inset-top));
  color:#fff;background:linear-gradient(90deg,#16324f,#23476e)}
.hub b{flex:0 0 auto;font-size:15px;font-weight:800;letter-spacing:.02em;white-space:nowrap}
.hub b span{color:#ffd36b}
.tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:0 0 auto;min-height:38px;padding:6px 13px;font:inherit;font-size:14px;font-weight:700;color:#fff;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.22);border-radius:12px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tab[aria-selected="true"]{color:#16324f;background:#ffd36b;border-color:#ffd36b}
.tab:focus-visible{outline:3px solid #ffd36b;outline-offset:2px}
.stage{position:relative;flex:1 1 auto;min-height:0;background:#cfeeff}
.stage iframe{position:absolute;inset:0;width:100%%;height:100%%;border:0;background:#cfeeff}
.stage iframe[hidden]{display:none}
@media (max-width:640px){ .hub b{display:none} .tab{font-size:13px;padding:6px 11px} }
</style>
</head>
<body>
<header class="hub"><b>Treasure <span>Island</span></b><nav class="tabs" role="tablist" aria-label="Части книги">%(tabs)s</nav></header>
<main class="stage" id="stage"></main>
<script>
(() => {
'use strict';
const PARTS = {
%(data)s
};
const KEY = 'treasure-hub-tab';
const stage = document.getElementById('stage');
const frames = {};
function show(id, keepHash){
  if(!PARTS[id]) id = '12';
  if(!frames[id]){
    const f = document.createElement('iframe');
    f.title = PARTS[id].title;
    f.setAttribute('allow', 'microphone; clipboard-write; web-share; autoplay');
    f.srcdoc = PARTS[id].html;
    stage.appendChild(f);
    frames[id] = f;
  }
  Object.keys(frames).forEach(k => { frames[k].hidden = k !== id; });
  document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.part === id)));
  const tab = document.querySelector('.tab[data-part="' + id + '"]');
  if(tab && tab.scrollIntoView) tab.scrollIntoView({ block:'nearest', inline:'nearest' });
  try { localStorage.setItem(KEY, id); } catch(e){}
  if(!keepHash){ try { history.replaceState(null, '', '#' + id); } catch(e){} }
  document.title = PARTS[id].title + ' · Treasure Island';
  try { frames[id].contentWindow.focus(); } catch(e){}
}
document.querySelector('.tabs').addEventListener('click', e => { const t = e.target.closest('[data-part]'); if(t) show(t.dataset.part); });
window.addEventListener('message', e => { if(e.data && e.data.tiGo && Object.values(frames).some(f => f.contentWindow === e.source)) show(e.data.tiGo); });
/* старые ссылки вида #page-5 ведут на лист основного урока */
const hash = location.hash.slice(1), page = hash.match(/^page-(\\d+)$/);
if(page){
  try {
    const k = 'benbow-ledger-v1', s = JSON.parse(localStorage.getItem(k) || '{}');
    s.page = Math.max(0, +page[1] - 1); localStorage.setItem(k, JSON.stringify(s));
  } catch(e){}
  show('12');
} else {
  let saved = ''; try { saved = localStorage.getItem(KEY) || ''; } catch(e){}
  show(PARTS[hash] ? hash : (saved || '12'), !PARTS[hash]);
}
})();
</script>
</body>
</html>
"""

out = HUB % {'tabs': tabs, 'data': data}
(ROOT / 'index.html').write_text(out, encoding='utf-8')
print('index.html: %d КБ, частей: %d' % (len(out.encode('utf-8')) // 1024, len(PARTS)))
