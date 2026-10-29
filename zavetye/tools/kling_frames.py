"""Стартовые кадры для Kling AI (image-to-video).
Портреты: 1080x1920 (9:16), фигура во всю ширину, низом к низу кадра, на ровном тёмном фоне.
Так видео ложится ровно поверх статичного портрета, а маской служит альфа самого портрета.
Сцены: 1920x1080 (16:9) из фонов игры; для «появлений» — пара кадров: начальный и конечный.
Запуск: python3 tools/kling_frames.py"""
from PIL import Image, ImageEnhance
import os, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda f: os.path.join(ROOT, 'art', f)
OUT = os.path.join(ROOT, 'kling')
BG = (26, 22, 19)
os.makedirs(os.path.join(OUT, 'portraits'), exist_ok=True); os.makedirs(os.path.join(OUT, 'scenes'), exist_ok=True)

def portrait(path):
    im = Image.open(path).convert('RGBA'); W, H = 1080, 1920
    k = W / im.width; im = im.resize((W, round(im.height * k)), Image.LANCZOS)
    if im.height > H: im = im.crop((0, im.height - H, W, im.height))
    c = Image.new('RGBA', (W, H), BG + (255,)); c.alpha_composite(im, (0, H - im.height))
    return c.convert('RGB')

def cover(path, W=1920, H=1080, fx=.5, fy=.5):
    im = Image.open(path).convert('RGB'); k = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = round((im.width - W) * fx), round((im.height - H) * fy)
    return im.crop((x, y, x + W, y + H)), k, x, y

def put(base, sprite, cx, foot, h, alpha=1.0, bright=1.0, flip=False):
    s = Image.open(A(sprite)).convert('RGBA'); s = s.resize((round(s.width * h / s.height), round(h)), Image.LANCZOS)
    if flip: s = s.transpose(Image.FLIP_LEFT_RIGHT)
    if bright != 1: r, g, b, a = s.split(); rgb = ImageEnhance.Brightness(Image.merge('RGB', (r, g, b))).enhance(bright); s = Image.merge('RGBA', (*rgb.split(), a))
    if alpha != 1: s.putalpha(s.getchannel('A').point(lambda v: int(v * alpha)))
    b = base.convert('RGBA'); b.alpha_composite(s, (round(cx - s.width / 2), round(foot - s.height))); return b.convert('RGB')

save = lambda im, name: im.save(os.path.join(OUT, name), quality=93)

for f in sorted(glob.glob(A('p_*.webp'))):
    save(portrait(f), 'portraits/' + os.path.basename(f).replace('.webp', '.jpg'))

road, *_ = cover(A('bg_road.jpg')); save(road, 'scenes/c_arrive_1.jpg')
street, *_ = cover(A('bg_street_1.jpg'), fx=.3); save(street, 'scenes/c_arrive_2.jpg')
house, *_ = cover(A('bg_aglaya_house.jpg'), fx=.35); save(house, 'scenes/c_house.jpg')
field, *_ = cover(A('bg_field.jpg'), fy=.6); save(field, 'scenes/c_noon_start.jpg')
save(put(field, 's_noon.webp', 980, 780, 600, alpha=.85), 'scenes/c_noon_end.jpg')
edge, *_ = cover(A('bg_field.jpg'), fx=0, fy=.6); save(edge, 'scenes/c_leshy_start.jpg')
save(put(edge, 's_leshy.webp', 330, 640, 430, bright=.85), 'scenes/c_leshy_end.jpg')
stop, *_ = cover(A('bg_forest_stop.jpg')); save(stop, 'scenes/c_stop.jpg')
save(put(stop, 's_young.webp', 1350, 860, 470), 'scenes/c_stop_boy.jpg')
save(put(road, 's_bus.webp', 1350, 900, 520), 'scenes/c_bus.jpg')
# Анна для покадровой анимации: в полный рост, на ровном зелёном фоне (его потом вырезает tools/anna_frames.py)
os.makedirs(os.path.join(OUT, 'anna'), exist_ok=True)
GREEN = (0, 177, 64)
def anna_frame(sprite, flip=False, W=1080, H=1920, fh=1480):
    im = Image.open(A(sprite)).convert('RGBA'); im = im.resize((round(im.width * fh / im.height), fh), Image.LANCZOS)
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    c = Image.new('RGBA', (W, H), GREEN + (255,)); c.alpha_composite(im, ((W - im.width) // 2, round(H * .9) - fh)); return c.convert('RGB')
save(anna_frame('s_anna.webp'), 'anna/anna_side_right.jpg')
save(anna_frame('s_anna.webp', True), 'anna/anna_side_left.jpg')
save(anna_frame('s_anna_front.webp'), 'anna/anna_front.jpg')
# лист персонажа: спереди, сбоку, сзади и портрет — для референса героя в Kling (Elements / Subject)
sheet = Image.new('RGB', (1920, 1080), (196, 192, 186))
for i, (f, fl) in enumerate([('s_anna_front.webp', False), ('s_anna.webp', False), ('s_anna_back.webp', False)]):
    im = Image.open(A(f)).convert('RGBA'); im = im.resize((round(im.width * 980 / im.height), 980), Image.LANCZOS)
    c = sheet.convert('RGBA'); c.alpha_composite(im, (60 + i * 330 + (300 - im.width) // 2, 60)); sheet = c.convert('RGB')
pt = Image.open(A('p_anna_neutral.webp')).convert('RGBA'); pt = pt.resize((round(pt.width * 980 / pt.height), 980), Image.LANCZOS)
c = sheet.convert('RGBA'); c.alpha_composite(pt, (1920 - pt.width - 40, 60)); sheet = c.convert('RGB'); save(sheet, 'anna/anna_sheet.jpg')
# кат-сцены с Анной: фон игры + Анна в нужной позе
flat, *_ = cover(A('bg_city_flat.jpg')); save(put(flat, 's_anna.webp', 960, 1000, 640, flip=True), 'scenes/c_anna_parcel.jpg')
busf = put(road, 's_bus.webp', 1420, 900, 520); save(put(busf, 's_anna_back.webp', 620, 1010, 560), 'scenes/c_anna_bus.jpg')
save(put(street, 's_anna_back.webp', 1180, 1030, 470), 'scenes/c_anna_door.jpg')
river, *_ = cover(A('bg_river.jpg')); save(put(river, 's_anna.webp', 1040, 652, 270), 'scenes/c_anna_river.jpg')
print('ok', len(os.listdir(os.path.join(OUT, 'portraits'))), len(os.listdir(os.path.join(OUT, 'scenes'))))
