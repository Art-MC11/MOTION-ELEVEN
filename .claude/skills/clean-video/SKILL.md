---
name: clean-video
description: Nettoie un rush vidéo face caméra quand Meir dit « clean vidéo » (ou demande de nettoyer, monter, sous-titrer un rush) : coupes, voix, son qui suit l'image, sous-titres animés, bruitages, export 9:16.
---

# Clean vidéo

Chaîne déjà écrite et testée. Ne pas la réécrire : recopier les deux scripts ci-dessous, les lancer, puis ajuster seulement ce que la vidéo demande.

## 1. Installer (une fois par session, environ 1 minute)

```bash
pip install -q --break-system-packages sherpa-onnx numpy opencv-python-headless
mkdir -p ~/.cache/clean-video && cd ~/.cache/clean-video
M=sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8
[ -f $M/tokens.txt ] || (curl -sSL -o m.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/$M.tar.bz2 && tar xjf m.tar.bz2 && rm m.tar.bz2)
[ -s face_yunet.onnx ] && [ $(stat -c%s face_yunet.onnx) -gt 100000 ] || curl -sSL -o face_yunet.onnx https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx
```

Puis écrire `~/clean-video/cv_asr.py` et `~/clean-video/cv_clean.py` avec le contenu exact des sections « Scripts » (outil Write).

## 2. Déroulé

1. **Transcrire** : `python3 -I ~/clean-video/cv_asr.py RUSH.mp4 words.json`. Lire le texte et les horaires.
2. **Choisir les prises** quand il y a des reprises ou des phrases ratées : garder la meilleure prise de chaque phrase et écrire `keep.json` (`s`/`e` en secondes du rush, `text` corrigé si la reconnaissance s'est trompée, `dist` pour forcer la distance : `proche`, `moyen`, `loin`, `très loin`). Sans reprises, laisser la coupe automatique (silences, euh, hum).
3. **Mots clés** : choisir 1 mot fort par groupe de mots (le sens, pas juste le plus long) et le passer avec `--keywords "mot1,mot2"`.
4. **Lancer** : `cd DOSSIER_DE_TRAVAIL && python3 -I ~/clean-video/cv_clean.py RUSH.mp4 [--keep keep.json] [--keywords ...] [--music musique.mp3] [--out Nom_v1.mp4]`. Options : `--no-sfx`, `--no-zoom`, `--no-subs`, `--no-distance`, `--color C6FF3D`.
5. **Vérifier avant d'envoyer** : regarder `check.jpg` (sous-titres lisibles, pas cachés par la tête), retranscrire la sortie pour vérifier qu'aucun mot n'est coupé, `ffmpeg -i sortie.mp4 -af ebur128 -f null -` (viser environ -14 LUFS). Corriger puis seulement envoyer avec SendUserFile.
6. **Versions** : nommer `Nom_v1.mp4`, `Nom_v2.mp4`… et dire en quelques points ce qui a changé.

## 3. Règles de Meir (à appliquer même si elles ne sont pas redemandées)

- **Le son suit l'image** : on entend ce que la caméra entendrait. Personne loin = voix basse, filtrée (sans aigus ni graves), avec écho. Face caméra = voix sèche et proche. Le passage de l'un à l'autre est progressif. Le script le fait tout seul d'après la taille du visage ; forcer avec `dist` dans keep.json si la détection se trompe (plan sans visage, plan large).
- **Impact puis silence** : avant une punchline ou un mot fort, un coup sourd puis environ 250 ms de silence total, et la phrase arrive sèche et proche.
- **Bruitages réels calés à l'image** (papier, clic, notification, pas…) plutôt que des effets décoratifs. Musique coupée net sur un mot fort si ça le sert.
- **Sous-titres** : petits mots en blanc, mot clé en gros, vert citron (#C6FF3D) avec léger halo, chaque mot apparaît quand il est dit, jamais cachés par le visage.
- **Voix** : nettoyer sans manger les mots (si la retranscription perd des mots, alléger le débruitage).
- **Génération vidéo IA** (Higgsfield) : proposer d'abord images d'entrée et de sortie, attendre son accord avant de dépenser des crédits, préférer des plans courts et peu chers.
- Travailler sur une copie, jamais sur le fichier envoyé.

## 4. Ajuster

Les réglages sont en haut des fonctions de `cv_clean.py` : chaîne de voix (`build_voice`), version lointaine (`highpass=300, lowpass=2500, aecho, -12 dB`), seuil de coupe (`auto_segments`, gap=0.35 s), style ASS (`build_ass` : taille 62 / 150, position y=1250), bruitages (`whoosh`, `pop`, `hit`). Pour un effet sur mesure (chrono, carte de fin, insert motion design), écrire un script à part qui part de la sortie de clean vidéo.

## Scripts

### ~/clean-video/cv_asr.py

```python
"""Transcription mot à mot (français et autres langues) avec horaires, hors ligne.
Usage : python3 cv_asr.py entree.(mp4|wav) sortie.json
Sortie : {"words": [{"w": "Tu", "s": 1.84, "e": 2.02}, ...], "text": "..."}
"""
import json, os, subprocess, sys
import numpy as np

SR = 16000
MODEL = os.path.expanduser(os.environ.get(
    "CV_MODEL", "~/.cache/clean-video/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8"))
_rec = None


def recognizer():
    global _rec
    if _rec is None:
        import sherpa_onnx
        _rec = sherpa_onnx.OfflineRecognizer.from_transducer(
            encoder=f"{MODEL}/encoder.int8.onnx", decoder=f"{MODEL}/decoder.int8.onnx",
            joiner=f"{MODEL}/joiner.int8.onnx", tokens=f"{MODEL}/tokens.txt",
            model_type="nemo_transducer", num_threads=os.cpu_count() or 2)
    return _rec


def load_audio(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(sr),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def _decode(x):
    r = recognizer(); st = r.create_stream(); st.accept_waveform(SR, x); r.decode_stream(st)
    res = st.result; words = []
    for tok, t in zip(res.tokens, res.timestamps):
        new = tok.startswith((" ", "▁")) or not words
        tok = tok.replace("▁", " ")
        if new and tok.strip():
            words.append({"w": tok.strip(), "s": float(t), "e": float(t)})
        elif words:
            words[-1]["w"] += tok.strip() if not new else ""
            if any(ch.isalnum() for ch in tok): words[-1]["e"] = float(t)  # la ponctuation n'a pas d'horaire fiable
    # fin de mot : on prolonge tant que la voix est audible (max 0.5 s, jamais au-delà du mot suivant)
    hop = SR // 100; env = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, "same")[::hop]) + 1e-9)
    thr = np.percentile(env, 15) + 12
    for i, q in enumerate(words):
        nxt = words[i + 1]["s"] if i + 1 < len(words) else len(x) / SR
        k = int((q["e"] + 0.08) * 100); lim = int(min(nxt, q["e"] + 0.5) * 100)
        while k < min(lim, len(env)) and env[k] > thr: k += 1
        q["e"] = round(max(q["s"] + 0.08, min(k / 100, nxt)), 3); q["s"] = round(q["s"], 3)
    return words


def _cut_points(x, every=25.0):
    """Coupe les longues pistes au moment le plus calme près de chaque 25 s."""
    hop = SR // 100; e = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, "same")[::hop] + 1e-12)
    cuts, pos, n = [0], 0, len(x) / SR
    while n - pos > every + 5:
        lo, hi = int((pos + every - 4) * 100), int((pos + every + 4) * 100)
        pos = (lo + int(np.argmin(e[lo:hi]))) / 100; cuts.append(pos)
    return cuts + [n]


def transcribe(x):
    words, c = [], _cut_points(x)
    for a, b in zip(c[:-1], c[1:]):
        seg = x[int(a * SR):int(b * SR)]
        pad = np.zeros(SR // 4, np.float32)
        for q in _decode(np.concatenate([pad, seg, pad])):
            q["s"] = round(q["s"] - 0.25 + a, 3); q["e"] = round(q["e"] - 0.25 + a, 3); words.append(q)
    return words


if __name__ == "__main__":
    ws = transcribe(load_audio(sys.argv[1]))
    json.dump({"words": ws, "text": " ".join(q["w"] for q in ws)},
              open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
    print(" ".join(q["w"] for q in ws))
```

### ~/clean-video/cv_clean.py

```python
"""Clean vidéo : rush face caméra -> vidéo 9:16 propre (coupes, voix nettoyée, sous-titres animés, bruitages).
Usage :
  python3 cv_clean.py RUSH.mp4 [--keep keep.json] [--keywords "mot1,mot2"] [--music musique.mp3]
                      [--no-sfx] [--no-zoom] [--no-subs] [--color C6FF3D] [--out sortie.mp4]
keep.json (facultatif, prises choisies à la main après lecture de la transcription) :
  [{"s": 1.84, "e": 4.92, "text": "texte corrigé (facultatif)"}, ...]   # secondes dans le rush
Sans --keep : coupe automatiquement silences, hésitations (euh, hum...) et blancs de début/fin.
"""
import argparse, json, os, re, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cv_asr

W, H, FPS, SR = 1080, 1920, 30, 48000
FILLERS = {"euh", "heu", "hum", "hmm", "bah", "ben", "euhm", "mmh", "eh"}
STOP = set("le la les un une des de du et ou en au aux ce ces cet cette mon ma mes ton ta tes son sa ses "
           "nos vos leur leurs je tu il elle on nous vous ils elles que qui quoi dont pour par sur dans avec "
           "sans pas ne plus est sont c'est j'ai the a an and of to in is it you".split())
FONTS = "/usr/share/fonts/truetype/google-fonts/ofl/montserrat"


def norm(w): return re.sub(r"[^\w'’-]", "", w.lower())


def auto_segments(words, gap=0.35, pre=0.10, post=0.18):
    words = [q for q in words if norm(q["w"]) not in FILLERS]
    segs = []
    for q in words:
        if segs and q["s"] - segs[-1]["e"] < gap: segs[-1]["e"] = q["e"]; segs[-1]["w"].append(q)
        else: segs.append({"s": q["s"], "e": q["e"], "w": [q]})
    for g in segs: g["s"] = max(0.0, g["s"] - pre); g["e"] += post
    for a, b in zip(segs, segs[1:]):  # pas de chevauchement
        if a["e"] > b["s"]: a["e"] = b["s"] = (a["e"] + b["s"]) / 2
    return segs


DIST_WORDS = {"proche": 0.0, "moyen": 0.4, "loin": 0.75, "tres loin": 1.0, "très loin": 1.0}
YUNET = os.path.expanduser("~/.cache/clean-video/face_yunet.onnx")


def face_distance(src, step=0.4):
    """Distance caméra-personne dans le temps (0 = face caméra, 1 = très loin), d'après la taille du visage.
    Renvoie (horaires, distances) échantillonnés toutes les 0,4 s dans le rush."""
    import cv2
    cap = cv2.VideoCapture(src); dur = cap.get(cv2.CAP_PROP_FRAME_COUNT) / (cap.get(cv2.CAP_PROP_FPS) or 30)
    ts = np.arange(0, dur, step)
    if not os.path.exists(YUNET): return ts, np.zeros(len(ts))
    det = cv2.FaceDetectorYN.create(YUNET, "", (320, 320), 0.6); ds, prev = [], 0.0
    for t in ts:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, im = cap.read()
        if ok:
            k = 360 / im.shape[1]; im = cv2.resize(im, None, fx=k, fy=k); det.setInputSize((im.shape[1], im.shape[0]))
            _, faces = det.detect(im)
            if faces is not None:
                v = float(np.clip((0.15 - max(x[3] for x in faces) / im.shape[0]) / 0.12, 0, 1)); prev = 0.0 if v < 0.1 else v
        ds.append(prev)  # pas de visage : on garde la valeur précédente
    ds = np.array(ds)
    if len(ds) > 2: ds = np.array([np.median(ds[max(0, i - 2):i + 3]) for i in range(len(ds))])
    return ts, ds


def manual_segments(keep, words):
    segs = []
    for k in keep:
        ws = [dict(q) for q in words if q["s"] >= k["s"] - 0.05 and q["s"] < k["e"] and norm(q["w"]) not in FILLERS]
        if k.get("text"):  # texte corrigé : on garde les horaires de la reconnaissance
            toks = k["text"].split()
            if len(toks) == len(ws): [q.update(w=t) for q, t in zip(ws, toks)]
            else:
                a = ws[0]["s"] if ws else k["s"]; b = ws[-1]["e"] if ws else k["e"]; L = sum(len(t) for t in toks)
                acc, ws = 0, []
                for t in toks:
                    s = a + (b - a) * acc / L; acc += len(t); ws.append({"w": t, "s": s, "e": a + (b - a) * acc / L})
        d = k.get("dist"); d = DIST_WORDS.get(str(d).lower(), d) if d is not None else None
        segs.append({"s": k["s"], "e": k["e"], "w": ws, "dist": d})
    return segs


# ---------- audio ----------
def build_voice(src, segs, work, dmap=None):
    x = cv_asr.load_audio(src, SR); parts = []
    for g in segs:
        seg = x[int(g["s"] * SR):int(g["e"] * SR)].copy(); f = min(int(0.012 * SR), len(seg) // 2)
        if f: seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
        parts.append(seg)
    save_wav(f"{work}/voice_raw.wav", np.concatenate(parts))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{work}/voice_raw.wav", "-af",
                    "highpass=f=85,afftdn=nf=-30,equalizer=f=3500:t=q:w=1.2:g=2.5,"
                    "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3,loudnorm=I=-14:TP=-1.5:LRA=7",
                    "-ar", str(SR), f"{work}/voice_dry.wav"], check=True)
    # le son suit l'image : version « lointaine » (filtrée, écho, plus basse), mélangée selon la distance de chaque plan
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{work}/voice_dry.wav", "-af",
                    "highpass=f=300,lowpass=f=2500,aecho=0.8:0.7:60|140:0.35|0.25,volume=-12dB",
                    "-ar", str(SR), f"{work}/voice_far.wav"], check=True)
    dry, far = cv_asr.load_audio(f"{work}/voice_dry.wav", SR), cv_asr.load_audio(f"{work}/voice_far.wav", SR)
    n = min(len(dry), len(far)); d = np.zeros(n, np.float32); t = 0
    for g in segs:
        m = int((g["e"] - g["s"]) * SR)
        if g.get("dist") is not None: d[t:t + m] = g["dist"]
        elif dmap is not None: d[t:t + m] = np.interp(g["s"] + np.arange(m) / SR, *dmap)[:len(d[t:t + m])]
        t += m
    if d.max() > 0:
        r = int(0.25 * SR); d = np.convolve(np.pad(d, r, mode="edge"), np.ones(r) / r, "same")[r:-r][:n]  # transitions douces
    save_wav(f"{work}/voice.wav", (1 - d) * dry[:n] + d * far[:n])


def save_wav(path, x):
    import wave
    x = np.clip(x, -1, 1); w = wave.open(path, "w"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()


rng = np.random.default_rng(1)
def _lp(x, a):
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc += a[i] * (x[i] - acc); y[i] = acc
    return y
def whoosh(d=0.42):
    n = int(d * SR); t = np.arange(n) / SR; y = _lp(rng.standard_normal(n).astype(np.float32), 0.02 + 0.25 * np.sin(np.pi * t / d) ** 2)
    y = y - _lp(y, np.full(n, 0.01)); return y * np.sin(np.pi * (t / d) ** 0.7) ** 2 / (np.abs(y).max() + 1e-9) * 0.5
def pop(d=0.09):
    t = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * (1500 * t - 5000 * t * t)) * np.exp(-45 * t) * 0.35
def hit(d=0.45):
    t = np.arange(int(d * SR)) / SR
    return (np.sin(2 * np.pi * 55 * t) * np.exp(-9 * t) + rng.standard_normal(len(t)) * np.exp(-40 * t) * 0.3) * 0.5


def build_sfx(total, events, work):
    y = np.zeros(int(total * SR) + SR, np.float32)
    for t, kind in events:
        s = {"whoosh": whoosh, "pop": pop, "hit": hit}[kind]().astype(np.float32)
        a = max(0, int(t * SR) - (len(s) // 2 if kind == "whoosh" else 0)); y[a:a + len(s)] += s[:len(y) - a]
    save_wav(f"{work}/sfx.wav", y[:int(total * SR)] * 0.5)


# ---------- sous-titres ----------
def groups(words, maxw=4):
    out, cur = [], []
    for q in words:
        cur.append(q)
        if len(cur) >= maxw or re.search(r"[.,!?;:]$", q["w"]): out.append(cur); cur = []
    if cur: out.append(cur)
    return out


def ass_time(t): t = max(0, t); return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def build_ass(words, total, path, color, forced):
    bgr = color[4:6] + color[2:4] + color[0:2]
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: S,Montserrat,62,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,4,2,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    gs = groups(words)
    for gi, g in enumerate(gs):
        clean = [re.sub(r"[.,!?;:]+$", "", q["w"]) for q in g]
        cand = [i for i, w in enumerate(clean) if norm(w) in forced] or \
               [i for i, w in enumerate(clean) if norm(w) not in STOP and len(w) >= 4]
        k = max(cand, key=lambda i: len(clean[i])) if cand else None
        end = min(gs[gi + 1][0]["s"] if gi + 1 < len(gs) else total, g[-1]["e"] + 0.8)
        for j, q in enumerate(g):
            t0 = q["s"]; t1 = g[j + 1]["s"] if j + 1 < len(g) else end
            if t1 - t0 < 0.02: continue
            def word(i):
                vis = "" if i <= j else r"{\alpha&HFF&}"
                return vis + clean[i] + r"{\alpha&H00&}"
            before = " ".join(word(i) for i in range(len(g)) if k is None or i < k)
            after = " ".join(word(i) for i in range(len(g)) if k is not None and i > k)
            lines = [before] if before else []
            if k is not None:
                anim = r"\fscx70\fscy70\t(0,110,\fscx112\fscy112)\t(110,200,\fscx100\fscy100)" if j == k else ""
                vis = "" if k <= j else r"\alpha&HFF&"
                lines.append(r"{\fs150\b800\1c&H" + bgr + r"&\3c&H" + bgr + r"&\bord3\blur6" + anim + vis + "}" +
                             clean[k].upper() + r"{\r}")
            if after: lines.append(after)
            ev.append(f"Dialogue: 0,{ass_time(t0)},{ass_time(t1)},S,,0,0,0,,{{\\an5\\pos({W // 2},1250)}}" + r"\N".join(lines))
    open(path, "w").write(head + "\n".join(ev) + "\n")
    return [(g[0]["s"], k) for g in gs]


# ---------- vidéo ----------
def probe(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(",")
    return int(out[0]), int(out[1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("--keep"); ap.add_argument("--keywords", default="")
    ap.add_argument("--music"); ap.add_argument("--no-sfx", action="store_true"); ap.add_argument("--no-zoom", action="store_true")
    ap.add_argument("--no-subs", action="store_true"); ap.add_argument("--color", default="C6FF3D"); ap.add_argument("--out")
    ap.add_argument("--no-distance", action="store_true")
    a = ap.parse_args()
    base = os.path.splitext(os.path.basename(a.src))[0]
    out = a.out or os.path.abspath(f"{base}_clean.mp4"); work = os.path.abspath(f"cv_work_{base}"); os.makedirs(work, exist_ok=True)

    wpath = f"{work}/words.json"
    if not os.path.exists(wpath):
        ws = cv_asr.transcribe(cv_asr.load_audio(a.src))
        json.dump({"words": ws, "text": " ".join(q["w"] for q in ws)}, open(wpath, "w"), ensure_ascii=False, indent=1)
    words = json.load(open(wpath))["words"]
    for q in words: q["s"] = max(0.0, q["s"])
    segs = manual_segments(json.load(open(a.keep)), words) if a.keep else auto_segments(words)

    dmap = None if a.no_distance else face_distance(a.src)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.src],
                               capture_output=True, text=True).stdout)
    for g in segs: g["e"] = min(g["e"], dur)

    # horaires dans la vidéo finale
    t, outw, cuts = 0.0, [], []
    for g in segs:
        for q in g["w"]: outw.append({"w": q["w"], "s": t + q["s"] - g["s"], "e": t + min(q["e"], g["e"]) - g["s"]})
        t += g["e"] - g["s"]; cuts.append(t)
    total = t

    build_voice(a.src, segs, work, dmap)
    vw, vh = probe(a.src)
    fc, z = [], [1.0, 1.08]
    for i, g in enumerate(segs):
        zz = 1.0 if a.no_zoom else z[i % 2]
        cw, ch = int(W * zz) // 2 * 2, int(H * zz) // 2 * 2
        fc.append(f"[0:v]trim=start={g['s']:.3f}:end={g['e']:.3f},setpts=PTS-STARTPTS,fps={FPS},"
                  f"scale={cw}:{ch}:force_original_aspect_ratio=increase,crop={W}:{H}:(iw-{W})/2:(ih-{H})*0.4,setsar=1[v{i}]")
    fc.append("".join(f"[v{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0[vc]")
    last = "vc"
    kw = []
    if not a.no_subs:
        kw = build_ass(outw, total, f"{work}/subs.ass", a.color.strip("#").upper(),
                       {norm(k) for k in a.keywords.split(",") if k.strip()})
        fc.append(f"[vc]ass={work}/subs.ass:fontsdir={FONTS}[vs]"); last = "vs"

    events = []
    if not a.no_sfx:
        events += [(c, "whoosh") for c in cuts[:-1] if not a.no_zoom][:: 2]
        events += [(s, "pop") for s, k in kw if k is not None]
        events.append((max(0, total - 0.6), "hit"))
    build_sfx(total, events, work)

    inputs = ["-i", a.src, "-i", f"{work}/voice.wav", "-i", f"{work}/sfx.wav"]
    mix = "[1:a][2:a]amix=inputs=2:normalize=0:duration=first[vx]"
    if a.music:
        inputs += ["-stream_loop", "-1", "-i", a.music]
        mix += (f";[3:a]volume=0.18,atrim=0:{total:.3f}[m];[m][1:a]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[md]"
                ";[vx][md]amix=inputs=2:normalize=0:duration=first[vx2]"); am = "vx2"
    else: am = "vx"
    mix += f";[{am}]alimiter=limit=0.95[a]"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(fc) + ";" + mix,
                    "-map", f"[{last}]", "-map", "[a]", "-t", f"{total:.3f}", "-c:v", "libx264", "-preset", "veryfast",
                    "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", str(SR),
                    "-movflags", "+faststart", out], check=True)
    # planche de contrôle (6 images) pour vérifier avant d'envoyer
    ts = [total * f for f in (0.05, 0.22, 0.4, 0.58, 0.76, 0.94)]
    sel = "+".join(f"eq(n\\,{int(x * FPS)})" for x in ts)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", out, "-vf", f"select='{sel}',scale=240:-1,tile=6x1",
                    "-fps_mode", "passthrough", "-frames:v", "1", f"{work}/check.jpg"], check=True)
    print(json.dumps({"out": out, "duree": round(total, 2), "coupes": len(segs) - 1, "distances": [g["dist"] if g.get("dist") is not None else (round(float(np.interp((g["s"] + g["e"]) / 2, *dmap)), 2) if dmap else 0) for g in segs], "check": f"{work}/check.jpg",
                      "texte": " ".join(q["w"] for q in outw)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
```
