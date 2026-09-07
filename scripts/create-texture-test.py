"""Generate the code-drawn RGBA test fixture; requires Pillow, no downloaded art."""
from pathlib import Path
from PIL import Image, ImageDraw

S = 4
im = Image.new("RGBA", (512*S, 320*S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
def polygon(points, fill):
    d.polygon([(x*S, y*S) for x,y in points], fill=fill)
def ellipse(box, fill):
    d.ellipse(tuple(v*S for v in box), fill=fill)
# Simple teal silhouette with transparent padding; no white matte.
polygon([(163,160),(45,75),(45,245)], "#19c9b5")
polygon([(225,116),(260,52),(302,119)], "#0a988d")
polygon([(220,205),(272,267),(300,205)], "#0a988d")
ellipse((120,90,463,235), "#2cddc8")
ellipse((368,124,411,167), "#ffffff")
ellipse((384,135,405,156), "#072d37")
ellipse((389,136,395,142), "#ffffff")
polygon([(218,158),(291,176),(237,204)], "#098f8a")
im = im.resize((512,320), Image.Resampling.LANCZOS)
target = Path(__file__).resolve().parents[1] / "public/assets/creatures/texture-test-creature.png"
im.save(target, optimize=True)
print(target)
