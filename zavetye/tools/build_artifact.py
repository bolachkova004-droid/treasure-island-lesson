#!/usr/bin/env python3
"""Собирает игру в одну страницу для публикации как Artifact.

Страница публикации сама оборачивается в <!doctype html><head><body>, поэтому здесь
пишется только содержимое: <title>, стили (шрифты встроены как data:), разметка и скрипты.
Картинки (art/) и звуки (sfx/) публикуются рядом как отдельные файлы.

    python3 tools/build_artifact.py путь/к/zavetye.html
"""
import base64, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / 'index.html').read_text(encoding='utf-8')

def inline_fonts(css):
    def rep(m):
        data = base64.b64encode((ROOT / 'css' / m.group(1)).resolve().read_bytes()).decode()
        return f"url(data:font/woff2;base64,{data})"
    return re.sub(r"url\((\.\./fonts/[^)]+\.woff2)\)", rep, css)

head = html[html.index('<head>') + 6:html.index('</head>')]
body = html[html.index('<body>') + 6:html.rindex('</body>')]
title = re.search(r'<title>.*?</title>', head).group(0)
desc = re.search(r'<meta name="description"[^>]*>', head).group(0)
styles = [inline_fonts((ROOT / h).read_text(encoding='utf-8')) for h in re.findall(r'<link rel="stylesheet" href="([^"]+)">', head)]
scripts = re.findall(r'<script src="([^"]+)"></script>', body)
body = re.sub(r'<script src="[^"]+"></script>\n?', '', body).strip()
js = '\n'.join((ROOT / s).read_text(encoding='utf-8') for s in scripts)
out = f"{title}\n{desc}\n<style>\n{''.join(styles)}</style>\n{body}\n<script>\n{js}\n</script>\n"
Path(sys.argv[1]).write_text(out, encoding='utf-8')
print(f'{sys.argv[1]}: {len(out) // 1024} КБ, скриптов {len(scripts)}')
