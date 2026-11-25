// Moteur d'animations au défilement, chargé sur tout le site.
// - Révélations : éléments [data-reveal] (et sélecteurs courants) apparaissent quand ils entrent à l'écran.
// - Progression : éléments [data-scrub] reçoivent --p (0 → 1) selon leur position, à chaque image.
// - Vidéos [data-autoplay] : chargées et lues seulement quand elles sont visibles, en pause sinon.
// - Compteurs [data-count] et barre de progression de lecture.
// Tout est désactivé si l'utilisateur préfère réduire les animations.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
root.classList.add(reduce ? "rm" : "motion");

// ---------- Révélations ----------
const AUTO_REVEAL = [
  ".section .head", ".sg__card", ".why__item", ".of__plan", ".case", ".fq__item", ".st__problem",
  ".st__group", ".rl__item", ".ab__value", ".md", ".zn__block", ".cf__inner", ".tm__item",
].join(",");

function setupReveal() {
  const els = new Set<HTMLElement>([
    ...document.querySelectorAll<HTMLElement>("[data-reveal]"),
    ...document.querySelectorAll<HTMLElement>(AUTO_REVEAL),
  ]);
  // Décalage en cascade entre éléments frères
  els.forEach((el) => {
    if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "");
    const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => els.has(c as HTMLElement)) : [];
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", `${Math.min(i, 6) * 80}ms`);
  });
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

// ---------- Vidéos à lecture automatique ----------
function setupVideos() {
  const vids = [...document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]")];
  const load = (v: HTMLVideoElement) => {
    if (v.dataset.src && !v.src) { v.src = v.dataset.src; v.load(); }
  };
  if (reduce) return; // affiches seulement
  if (!("IntersectionObserver" in window)) { vids.forEach((v) => { load(v); v.play().catch(() => {}); }); return; }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) { load(v); v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    }),
    { rootMargin: "200px 0px", threshold: 0.01 }
  );
  vids.forEach((v) => { v.muted = true; v.playsInline = true; io.observe(v); });
}

// ---------- Compteurs ----------
function setupCounters() {
  const els = document.querySelectorAll<HTMLElement>("[data-count]");
  if (!els.length) return;
  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduce || !target) { el.textContent = `${target}${suffix}`; return; }
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { run(e.target as HTMLElement); io.unobserve(e.target); }
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

// ---------- Progression liée au défilement ----------
// data-scrub="through" : 0 quand l'élément entre par le bas, 1 quand il sort par le haut.
// data-scrub="pin"     : 0 → 1 pendant que la section « collante » défile (hauteur - écran).
// data-scrub="leave"   : 0 en haut de page, 1 quand l'élément a quitté l'écran par le haut.
function setupScrub() {
  const els = [...document.querySelectorAll<HTMLElement>("[data-scrub]")];
  const bar = document.querySelector<HTMLElement>("[data-progress-bar]");
  if (reduce) { els.forEach((el) => el.style.setProperty("--p", el.dataset.scrub === "pin" ? "1" : "0.5")); return; }
  let vh = innerHeight;
  let ticking = false;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const update = () => {
    ticking = false;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const mode = el.dataset.scrub;
      let p: number;
      if (mode === "pin") p = clamp(-r.top / Math.max(1, r.height - vh));
      else if (mode === "leave") p = clamp(-r.top / Math.max(1, r.height));
      else p = clamp((vh - r.top) / (vh + r.height));
      el.style.setProperty("--p", p.toFixed(4));
      // Mots révélés un par un
      if (el.dataset.words !== undefined) {
        const words = el.querySelectorAll<HTMLElement>(".w");
        const n = words.length;
        const lit = clamp((p - 0.18) / 0.42) * n;
        words.forEach((w, i) => w.classList.toggle("on", i < lit));
      }
    }
    if (bar) {
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max) : 0})`;
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { vh = innerHeight; onScroll(); });
  update();
}

// Découpe en mots des textes [data-words]
document.querySelectorAll<HTMLElement>("[data-words] [data-split]").forEach((el) => {
  el.innerHTML = el.textContent!.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
});

// ---------- Titres cinétiques (mots avec flou de mouvement) ----------
function setupKinetic() {
  const heads = document.querySelectorAll<HTMLElement>("main h1, main h2");
  heads.forEach((h) => {
    if (h.closest("[data-words], .sx, .adm, dialog") || h.dataset.noKinetic !== undefined) return;
    let i = 0;
    const walk = (node: Node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = (n.textContent || "").split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const sp = document.createElement("span");
            sp.className = "kw";
            sp.style.setProperty("--i", String(i++));
            sp.textContent = part;
            frag.appendChild(sp);
          });
          n.parentNode!.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !(n as HTMLElement).classList.contains("kw")) walk(n);
      });
    };
    walk(h);
    h.classList.add("kin");
  });
  if (reduce || !("IntersectionObserver" in window)) { heads.forEach((h) => h.classList.add("kin-in")); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("kin-in"); io.unobserve(e.target); }
  }), { threshold: 0.2 });
  document.querySelectorAll(".kin").forEach((h) => io.observe(h));
}

// ---------- Boutons magnétiques (souris uniquement) ----------
function setupMagnetic() {
  if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll<HTMLElement>(".btn:not(.btn--wide)").forEach((b) => {
    if (b.closest("form")) return;
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty("--mx", `${((e.clientX - r.left) / r.width - 0.5) * 10}px`);
      b.style.setProperty("--my", `${((e.clientY - r.top) / r.height - 0.5) * 8}px`);
    });
    b.addEventListener("pointerleave", () => { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
  });
}

setupKinetic();
setupMagnetic();
setupReveal();
setupVideos();
setupCounters();
setupScrub();

export {};
