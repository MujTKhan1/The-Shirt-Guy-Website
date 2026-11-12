"""
Builds the layered garment assets from the supplied reference image.

Usage:  python tools/garment-layers.py <reference-image> public/assets
(The reference image itself is kept out of the repository.)

Outputs: shirt-blank.webp (cut-out, print and annotation marks removed),
shirt-shade.jpg (multiply map for the print), shirt-disp.jpg (displacement map).
Needs numpy, scipy and Pillow. Crop box and mark positions are specific to the
supplied reference image.
"""
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
BOX = (700, 60, 1520, 720)
c = np.asarray(im.crop(BOX)).astype(np.float32)
H, W, _ = c.shape
lum = c @ np.array([0.299, 0.587, 0.114], np.float32)
bg = np.array([244, 237, 225], np.float32)

# --- silhouette: background = bright pixels connected to the border
bright = lum > 175
lab, n = ndi.label(bright)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bgm = np.isin(lab, list(border))
fg = ~bgm
# remove thin leader lines & annotation text: opening then largest component
fg = ndi.binary_opening(fg, structure=np.ones((5, 5)))
lab2, n2 = ndi.label(fg)
sizes = ndi.sum(fg, lab2, range(1, n2 + 1))
fg = lab2 == (np.argmax(sizes) + 1)
fg = ndi.binary_fill_holes(fg)
fg = ndi.binary_closing(fg, structure=np.ones((3, 3)))
_yy, _xx = np.mgrid[0:H, 0:W]
fg |= ((_xx-640)**2 + (_yy-393)**2 < 8**2)
fg = ndi.binary_fill_holes(fg)

# soft alpha from luminance across a thin edge band
edge = fg & ~ndi.binary_erosion(fg, iterations=2)
outer = ndi.binary_dilation(fg, iterations=1) & ~fg
alpha = fg.astype(np.float32)
shirt_lum = 55.0
a_est = np.clip((240 - lum) / (240 - shirt_lum), 0, 1)
band = edge | outer
alpha[band] = a_est[band]
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
# un-premultiply ivory fringe
a3 = np.clip(alpha, 0.05, 1)[..., None]
col = np.where(band[..., None], (c - (1 - a3) * bg) / a3, c)
col = np.clip(col, 0, 255)

# --- print / annotation dots / neck label removal
interior = ndi.binary_erosion(fg, iterations=2)
LABEL = (414, 52, 470, 108)
lx0, ly0, lx1, ly1 = LABEL
PR = np.zeros((H, W), bool); PR[140:470, 215:575] = True
light = (lum > 118) & interior & PR
light[ly0-2:ly1+2, lx0-2:lx1+2] = False
yy, xx = np.mgrid[0:H, 0:W]
for (dx, dy) in [(184,129),(490,92),(233,372),(642,396),(108,405)]:
    light |= ((xx-dx)**2 + (yy-dy)**2 < 16**2) & fg
from PIL import ImageDraw
lm = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(lm)
for seg in [[(130,88),(186,130)], [(488,93),(562,60),(700,60)], [(40,405),(120,405),(236,371)], [(642,396),(684,466)]]:
    dr.line(seg, fill=255, width=7)
light |= (np.asarray(lm) > 0) & fg
r,g,b = c[...,0],c[...,1],c[...,2]
PR2 = np.zeros((H, W), bool); PR2[140:490, 215:600] = True
light |= (g > r + 6) & (g > b + 20) & PR2 & fg
# size mark 'L'
light[62:98, 468:486] |= lum[62:98, 468:486] > 80
hole = ndi.binary_dilation(light, iterations=4)
hole = ndi.binary_closing(hole, structure=np.ones((7, 7))) & fg

known = (fg & ~ndi.binary_dilation(hole, iterations=5) & ndi.binary_erosion(fg, iterations=4)).astype(np.float32)
def nconv(img, sig):
    num = ndi.gaussian_filter(img * known[..., None], (sig, sig, 0))
    den = ndi.gaussian_filter(known, sig)[..., None]
    return num / np.maximum(den, 1e-4)
low = nconv(col, 18) * 0.5 + nconv(col, 40) * 0.5
low_known = ndi.gaussian_filter(col * known[..., None], (6, 6, 0)) / np.maximum(ndi.gaussian_filter(known, 6)[..., None], 1e-4)
hp = col - low_known
rng0 = np.random.default_rng(3)
sdv = hp[ndi.binary_erosion(fg & ~hole, iterations=6)].std(axis=0)
noise_soft = ndi.gaussian_filter(rng0.normal(0,1,(H,W,1)).astype(np.float32),(0.5,0.5,0))*1.0*sdv*0.45
# texture transfer from nearby real fabric
tex = np.zeros_like(col); got = np.zeros((H, W), bool)
for (oy, ox) in [(0, -230), (0, 250), (230, 0), (-160, 120), (200, -150), (150, 220), (-120, -200)]:
    sy = np.clip(yy + oy, 0, H - 1); sx = np.clip(xx + ox, 0, W - 1)
    ok = (known[sy, sx] > 0) & ~got & ndi.binary_erosion(fg & ~hole, iterations=6)[sy, sx]
    tex[ok] = hp[sy[ok], sx[ok]]; got |= ok
tex[~got] = 0
filled = low + noise_soft
soft = ndi.gaussian_filter(ndi.binary_dilation(hole, iterations=2).astype(np.float32), 3)[..., None]
blank = col * (1 - soft) + filled * soft
# neck label: remove its text, keep the woven label's own shading
lab_reg = np.zeros((H, W), bool); lab_reg[ly0+3:ly1-3, lx0+3:lx1-3] = True
txt = lab_reg & (lum < 185)
txt = ndi.binary_dilation(txt, iterations=1) & lab_reg
kn2 = (lab_reg & ~txt).astype(np.float32)
num = ndi.gaussian_filter(col * kn2[..., None], (4, 4, 0)); den = ndi.gaussian_filter(kn2, 4)[..., None]
fill2 = num / np.maximum(den, 1e-4)
blank[txt] = fill2[txt]
blank = np.clip(blank, 0, 255)
dotz = np.zeros((H, W), bool)
for (dx, dy) in [(184,129),(642,396),(108,405)]:
    dotz |= ((xx-dx)**2 + (yy-dy)**2 < 18**2)
kill = dotz & (lum > 95) & ~ndi.binary_erosion(fg, iterations=5)
alpha = ndi.gaussian_filter(alpha, 0.5)
rgba = np.dstack([blank, alpha * 255]).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(f'{outdir}/shirt-blank.png')
Image.fromarray(rgba, 'RGBA').save(f'{outdir}/shirt-blank.webp', quality=90, method=6)

# shading map for printed ink (light = flat fabric, dark = folds)
L = (blank @ np.array([0.299, 0.587, 0.114], np.float32))
L = ndi.gaussian_filter(L, 1.2)
p = np.percentile(L[interior], [5, 50, 97])
shade = np.clip(0.86 + (L - p[1]) / (p[2] - p[0]) * 0.75, 0.42, 1.12) / 1.12
Image.fromarray(np.uint8(shade * 255)).save(f'{outdir}/shirt-shade.jpg', quality=88)
# displacement map (R=G=low-freq luminance)
D = ndi.gaussian_filter(L, 5)
D = (D - D[interior].mean()) / (D[interior].std() + 1e-6)
D = np.clip(128 + D * 40, 0, 255)
Image.fromarray(np.dstack([D, D, np.full_like(D, 128)]).astype(np.uint8)).save(f'{outdir}/shirt-disp.jpg', quality=90)
print('size', W, H, 'label', LABEL)
