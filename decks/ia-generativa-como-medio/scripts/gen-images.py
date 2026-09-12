#!/usr/bin/env python3
"""Genera las imagenes del deck con Gemini (Nano Banana Pro).
El sistema visual del deck.yaml se antepone a cada brief, para que las
imagenes se lean como una sola charla y no como piezas sueltas.
Uso: python3 scripts/gen-images.py 01 02 04 05"""
import base64, io, json, os, pathlib, sys, urllib.request, yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
CARDS, OUT = ROOT/"cards", ROOT/"cards"/"assets"
MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3-pro-image")

def key():
    env = pathlib.Path.home()/".config/gemini/credentials.env"
    if env.exists():
        for ln in env.read_text().splitlines():
            if "=" in ln and not ln.strip().startswith("#"):
                k, v = ln.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    k = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not k: sys.exit("sin GEMINI_API_KEY")
    return k

deck = yaml.safe_load((CARDS/"deck.yaml").read_text())
sv = deck["sistema_visual"]
cards = {}
for f in sorted(CARDS.glob("*.yaml")):
    if f.name == "deck.yaml": continue
    for c in (yaml.safe_load(f.read_text()) or {}).get("cards", []):
        cards[c["id"]] = c

SISTEMA = (
 f"Sistema visual obligatorio, aplica a todas las imagenes de esta serie.\n"
 f"Tratamiento: {sv['tratamiento']}\n"
 f"{{acento}}\n"
 f"Encuadre: {sv['encuadre']}\n"
 f"Prohibido: {sv['prohibido']}\n"
 f"Ademas: sin texto, sin letras, sin numeros, sin logos y sin marcas de agua "
 f"dentro de la imagen. Formato apaisado 16:9. Fotografia real, no ilustracion, "
 f"no render 3D, no collage."
)

def gen(cid, k):
    c = cards[cid]
    brief = c["visual"]["brief"]
    usa = c["visual"].get("acento", False)
    acento = (f"Acento de color: {sv['acento']}" if usa else
              "Acento de color: NINGUNO. La imagen es estrictamente monocroma. "
              "No debe aparecer ningun objeto ni detalle azul ni de ningun color saturado.")
    prompt = (f"{SISTEMA.format(acento=acento)}\n\nEscena de esta lamina: {brief}\n\n"
              "REGLA FINAL, la mas importante: la fotografia llena el fotograma entero, "
              "de borde a borde, como un fotograma de cine. Esta terminantemente prohibido "
              "que aparezca un marco, un borde, una orla, una vineta, una esquina redondeada, "
              "un paspartu, un reborde de papel, un efecto de copia antigua o cualquier cosa "
              "que parezca una foto apoyada sobre una superficie. Nada de fondo alrededor "
              "de la imagen. El encuadre es 16:9 y la escena ocupa el 100 por ciento.")
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"],
                             "imageConfig": {"aspectRatio": "16:9"}},
    }).encode()
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}"
           f":generateContent?key={k}")
    req = urllib.request.Request(url, body, {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=240) as r:
        d = json.load(r)
    for cand in d.get("candidates", []):
        for p in cand.get("content", {}).get("parts", []):
            if "inlineData" in p:
                raw = base64.b64decode(p["inlineData"]["data"])
                OUT.mkdir(parents=True, exist_ok=True)
                (OUT/f"{cid}.png").write_bytes(raw)
                return len(raw)
    raise RuntimeError(json.dumps(d)[:600])

if __name__ == "__main__":
    k = key()
    ids = sys.argv[1:] or []
    if not ids: sys.exit("pasa los ids: 01 02 04 05")
    for cid in ids:
        if cid not in cards: sys.exit(f"no existe la lamina {cid}")
        if cards[cid]["visual"].get("kind") != "image":
            print(f"{cid}: no lleva imagen, se salta"); continue
        n = gen(cid, k)
        print(f"{cid}: {cards[cid]['name']} · {n//1024} KB → cards/assets/{cid}.png")
