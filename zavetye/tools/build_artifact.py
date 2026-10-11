#!/usr/bin/env python3
"""Собирает игру в одну страницу для публикации как Artifact.

Страница публикации сама оборачивается в <!doctype html><head><body>, поэтому здесь
пишется только содержимое: <title>, стили, разметка и скрипты.
Картинки (art/), звуки (sfx/) и шрифты (fonts/) публикуются рядом как отдельные файлы.

    python3 tools/build_artifact.py путь/к/zavetye.html
"""
import base64, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / 'index.html').read_text(encoding='utf-8')

def font_paths(css):
    # шрифты публикуются рядом отдельными файлами (fonts/*.woff2), а не base64 внутри страницы
    return re.sub(r"url\(\.\./fonts/", "url(fonts/", css)

head = html[html.index('<head>') + 6:html.index('</head>')]
body = html[html.index('<body>') + 6:html.rindex('</body>')]
title = re.search(r'<title>.*?</title>', head).group(0)
desc = re.search(r'<meta name="description"[^>]*>', head).group(0)
styles = [font_paths((ROOT / h).read_text(encoding='utf-8')) for h in re.findall(r'<link rel="stylesheet" href="([^"]+)">', head)]
scripts = re.findall(r'<script src="([^"]+)"></script>', body)
body = re.sub(r'<script src="[^"]+"></script>\n?', '', body).strip()
js = '\n'.join((ROOT / s).read_text(encoding='utf-8') for s in scripts)
# площадка оборачивает страницу сама; чтобы не было белой вспышки, фон задаётся первым и с !important,
# а <title>, <meta> и стили сразу переносятся в <head>
early = ('<style>html,body{background:#13110f!important;color:#ece3cf!important}</style>\n'
         '<script>(function(){var h=document.head;if(!h)return;document.querySelectorAll("body title,body meta,body style,body link").forEach(function(n){h.appendChild(n)});})();</script>\n')
out = f"{title}\n{desc}\n<style>\n{''.join(styles)}</style>\n{early}{body}\n<script>\n{js}\n</script>\n"
Path(sys.argv[1]).write_text(out, encoding='utf-8')
print(f'{sys.argv[1]}: {len(out) // 1024} КБ, скриптов {len(scripts)}')
