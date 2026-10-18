"""Сжимает ролики из Kling и подключает их к игре.
  python3 tools/video_prep.py ПАПКА_ИЛИ_ФАЙЛЫ...
Имя файла = ключ: p_grunya_warm.mp4 (живой портрет), c_noon.mp4 (кат-сцена).
Портреты → 540×960, без звука; кат-сцены → 1280×720, звук сохраняется.
Результат — video/КЛЮЧ.mp4 (H.264, для Safari) и video/КЛЮЧ.webm (VP9, легче);
список VIDEOS в js/video.js обновляется сам.
Значок «KlingAI» в правом нижнем углу закрашивается (delogo); --keep-logo — оставить.
Нужен ffmpeg: pip install imageio-ffmpeg"""
import sys, os, re, glob, subprocess
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'video'); os.makedirs(OUT, exist_ok=True)
files = []
KEEP = '--keep-logo' in sys.argv
def size(f):
    err = subprocess.run([FF, '-i', f], capture_output=True, text=True).stderr
    m = re.search(r'Video:.*?(\d{3,5})x(\d{3,5})', err); return (int(m.group(1)), int(m.group(2))) if m else (0, 0)
def logo(f):
    # значок Kling: ~142×38 при ширине кадра 720, в 18 px от правого и 20 px от нижнего края
    W, H = size(f)
    if KEEP or not W: return ''
    k = min(W, H) / 720; w, h = round(150 * k), round(42 * k); x, y = W - w - round(14 * k), H - h - round(17 * k)
    return f'delogo=x={x}:y={y}:w={w}:h={h},'
for a in [a for a in sys.argv[1:] if not a.startswith('--')]:
    files += sorted(glob.glob(os.path.join(a, '*.mp4')) + glob.glob(os.path.join(a, '*.mov'))) if os.path.isdir(a) else [a]
for f in files:
    key = re.sub(r'\.(mp4|mov|webm)$', '', os.path.basename(f), flags=re.I)
    if not re.match(r'^(p|c)_[a-z0-9_]+$', key): print('пропускаю (имя должно быть p_… или c_…):', f); continue
    dst = os.path.join(OUT, key + '.mp4')
    pre = logo(f)
    if key.startswith('p_'):
        vf, extra = pre + 'scale=540:960:force_original_aspect_ratio=decrease,pad=540:960:(ow-iw)/2:oh-ih:color=0x1a1613,fps=24', ['-an', '-crf', '27']
    else:
        vf, extra = pre + 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24', ['-c:a', 'aac', '-b:a', '96k', '-crf', '24']
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', f, '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-movflags', '+faststart', *extra, dst], check=True)
    wa = ['-an'] if key.startswith('p_') else ['-c:a', 'libopus', '-b:a', '80k']
    crf = '36' if key.startswith('p_') else '33'
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', f, '-vf', vf, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', crf, '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', *wa, dst[:-4] + '.webm'], check=True)
    print(f'{key}: mp4 {os.path.getsize(dst) // 1024} КБ, webm {os.path.getsize(dst[:-4] + ".webm") // 1024} КБ')
# список роликов в js/video.js
keys = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(OUT, '*.mp4')))
js = os.path.join(ROOT, 'js', 'video.js'); s = open(js, encoding='utf-8').read()
body = ''.join(f"  {k}: 'video/{k}',\n" for k in keys)
s = re.sub(r'const VIDEOS = \{\n.*?\};', 'const VIDEOS = {\n' + body + '};', s, flags=re.S)
open(js, 'w', encoding='utf-8').write(s)
print('в игре роликов:', len(keys))
