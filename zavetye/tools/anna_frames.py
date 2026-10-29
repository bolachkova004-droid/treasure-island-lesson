"""Покадровая анимация Анны из роликов Kling.
  python3 tools/anna_frames.py walk ролик_ходьбы.mp4
  python3 tools/anna_frames.py turn ролик_разворота.mp4
  python3 tools/anna_frames.py idle ролик_стояния.mp4
Ролик: Анна в полный рост на ровном зелёном фоне (стартовые кадры — kling/anna/*.jpg).
Что делает:
  1) вынимает кадры, вырезает зелёный фон (мягкий край, без зелёной каймы);
  2) ставит каждый кадр «ногами в одну точку» и к одному росту (600 px), чтобы фигура не прыгала;
  3) walk — находит один полный цикл (два шага) и берёт из него 16 кадров;
     turn — 12 кадров от «смотрит вправо» к «смотрит влево»; idle — 12 кадров петлёй;
  4) кладёт лист кадров в art/s_anna_<вид>.webp и описание в js/anna_frames.js.
Нужно: pip install imageio-ffmpeg pillow numpy"""
import sys, os, re, json, subprocess, tempfile, glob
import numpy as np
from PIL import Image
import imageio_ffmpeg
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = imageio_ffmpeg.get_ffmpeg_exe()
H_FIG = 600            # рост фигуры в листе, как у s_anna
N = { 'walk':16, 'turn':12, 'idle':12 }

def frames(path):
    d = tempfile.mkdtemp()
    subprocess.run([FF, '-loglevel', 'error', '-i', path, '-vf', 'fps=24', os.path.join(d, 'f%04d.png')], check=True)
    return [np.asarray(Image.open(f).convert('RGB')).astype(np.float32) for f in sorted(glob.glob(os.path.join(d, '*.png')))]

def key(rgb):
    """альфа из «зелёности»: g − max(r, b); мягкий порог; зелёная кайма гасится"""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # цвет фона — по краям кадра
    edge = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3), rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    gness = g - np.maximum(r, b); ref = max(30., bg[1] - max(bg[0], bg[2]))
    dist = np.sqrt(((rgb - bg) ** 2).sum(-1))
    a = np.clip(1 - (gness / ref - .25) / .5, 0, 1) * np.clip((dist - 18) / 40, 0, 1)
    a = np.clip(a * 1.15, 0, 1)
    out = rgb.copy(); spill = g > np.maximum(r, b); out[..., 1] = np.where(spill, np.maximum(r, b) + (g - np.maximum(r, b)) * .25, g)
    return out, a

def place(rgb, a):
    """обрезка по фигуре, ступни — к низу, центр по корпусу; масштаб к росту H_FIG"""
    ys, xs = np.nonzero(a > .5)
    if len(ys) < 100: return None
    top, bot = ys.min(), ys.max(); h = bot - top
    band = (ys > top + h * .2) & (ys < top + h * .6)          # корпус: по нему центр, руки и ноги не дёргают фигуру
    cx = xs[band].mean() if band.any() else xs.mean()
    return { 'top':top, 'bot':bot, 'cx':cx, 'rgb':rgb, 'a':a }

def main(kind, path):
    raw = frames(path); P = [place(*key(f)) for f in raw]; P = [p for p in P if p]
    if not P: sys.exit('не нашла фигуру на зелёном фоне')
    hs = np.median([p['bot'] - p['top'] for p in P]); sc = H_FIG / hs
    if kind == 'walk':   # цикл: через сколько кадров силуэт повторяется (два шага)
        sil = [np.asarray(Image.fromarray((p['a'] * 255).astype(np.uint8)).resize((48, 96))).astype(np.float32) for p in P]
        best = None
        for per in range(10, min(60, len(P) - 2)):
            d = np.mean([np.abs(sil[i] - sil[i + per]).mean() for i in range(0, len(P) - per)])
            if best is None or d < best[0]: best = (d, per)
        per = best[1]; s0 = max(0, (len(P) - per) // 2); pick = [P[s0 + round(i * per / N['walk'])] for i in range(N['walk'])]
    else:
        idx = np.linspace(0, len(P) - 1, N[kind]).round().astype(int); pick = [P[i] for i in idx]
    W = int(round(max((p['a'] > .05).any(0).sum() for p in pick) * sc * 1.25)) + 40
    Hh = int(round(H_FIG * 1.06)); sheet = Image.new('RGBA', (W * len(pick), Hh), (0, 0, 0, 0))
    for i, p in enumerate(pick):
        rgba = np.dstack([p['rgb'], p['a'] * 255]).clip(0, 255).astype(np.uint8); im = Image.fromarray(rgba, 'RGBA')
        im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
        cell = Image.new('RGBA', (W, Hh), (0, 0, 0, 0)); cell.paste(im, (round(W / 2 - p['cx'] * sc), round(Hh - 6 - p['bot'] * sc)), im)
        sheet.paste(cell, (i * W, 0))
    out = os.path.join(ROOT, 'art', f's_anna_{kind}.webp'); sheet.save(out, quality=88, method=6)
    # описание листа
    js = os.path.join(ROOT, 'js', 'anna_frames.js'); src = open(js, encoding='utf-8').read()
    meta = json.loads(re.search(r'/\*META\*/(.*?)/\*END\*/', src, re.S).group(1))
    meta[kind] = { 'key':f's_anna_{kind}', 'n':len(pick), 'fw':W, 'fh':Hh, 'ax':W / 2, 'foot':Hh - 6, 'fig':H_FIG }
    src = re.sub(r'/\*META\*/.*?/\*END\*/', '/*META*/' + json.dumps(meta, ensure_ascii=False) + '/*END*/', src, flags=re.S)
    open(js, 'w', encoding='utf-8').write(src)
    print(f'{kind}: {len(pick)} кадров, лист {sheet.width}×{sheet.height}, {os.path.getsize(out) // 1024} КБ')

if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in N: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
