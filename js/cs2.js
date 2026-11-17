"use strict";
/* =====================================================================
   🔫 CS2: keyslar, keys jangi, apgreyd, inventar
   Haqiqiy keyslar, skinlar va bozor narxlari (data/cs2.json — tools/build_cs2.py).
   Balans: kazino fishkalari, 100 🎰 = $1. Bu simulyator — real pul yo'q.
   ===================================================================== */
const CS = (() => {
  let data = null, loading = null;
  const RC = ["#b0c3d9", "#5e98d9", "#4b69ff", "#8847ff", "#d32ce6", "#eb4b4b", "#e4ae39", "#e4ae39"];
  const WN = ["FN", "MW", "FT", "WW", "BS"];
  const WBAND = [[0, 0.07], [0.07, 0.15], [0.15, 0.38], [0.38, 0.45], [0.45, 1]];
  const WW = [0.03, 0.24, 0.33, 0.24, 0.16];
  const ODDS = { 2: 0.7992, 3: 0.1598, 4: 0.032, 5: 0.0064, 7: 0.0026 }; // CS2 rasmiy ehtimollari
  const load = () => (data ? Promise.resolve(data) : (loading ||= fetch("data/cs2.json").then((r) => r.json()).then((d) => (data = d))));
  const img = (path, size = 256) => (path ? `${data.imgPrefix}${path}/${size}fx${size}f` : "");
  const usd = (v) => "$" + (v >= 1000 ? Math.round(v).toLocaleString("en-US") : v.toFixed(2));
  let money = usd; // Biloldrop so'mda ko'rsatadi (setMoney)
  const cost = (c) => Math.round((c.p + c.k) * 100) / 100;
  const bal = () => Chips.get() / 100;
  const pay = (v) => Chips.take(Math.round(v * 100));
  const credit = (v) => Chips.add(Math.round(v * 100));
  const wpick = (items, weights) => { let r = Math.random() * weights.reduce((a, b) => a + b, 0); for (let k = 0; k < items.length; k++) if ((r -= weights[k]) < 0) return items[k]; return items[items.length - 1]; };

  /* Skindan bitta tushum (eskirish, StatTrak, float, narx) */
  function makeDrop(i) {
    const s = data.skins[i], multi = s[3].length > 1;
    let w = 0;
    if (multi) { const ok = [0, 1, 2, 3, 4].filter((k) => s[3][k] > 0 || s[4][k] > 0); w = wpick(ok, ok.map((k) => WW[k])); }
    const st = s[4][w] > 0 && Math.random() < 0.1;
    const v = (st ? s[4][w] : s[3][w]) || s[3][w] || s[4][w];
    const f = multi ? +(WBAND[w][0] + Math.random() * (WBAND[w][1] - WBAND[w][0])).toFixed(4) : null;
    return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), i, w: multi ? w : -1, st, f, v };
  }
  /* Keysdan tasodifiy skin: avval noyoblik, keyin skin */
  function roll(c) {
    const pools = {};
    for (const i of c.i) (pools[data.skins[i][1]] ||= []).push(i);
    if (c.r.length) pools[7] = c.r;
    const rs = Object.keys(pools).map(Number);
    return makeDrop(pick(pools[wpick(rs, rs.map((r) => ODDS[r] ?? 0.05))]));
  }
  const parts = (d) => { const n = data.skins[d.i][0]; const k = n.indexOf(" | "); return k < 0 ? [n.replace("★ ", "★ "), "Oddiy"] : [n.slice(0, k), n.slice(k + 3)]; };
  const label = (d) => { const [a, b] = parts(d); return `${d.st ? "StatTrak™ " : ""}${a} | ${b}${d.w >= 0 ? ` (${WN[d.w]})` : ""}`; };
  function tile(d, extra = "") {
    const s = data.skins[d.i], [a, b] = parts(d);
    return `<div class="sk" data-id="${d.id || ""}" style="--rc:${RC[s[1]]}">${d.st ? '<span class="st">ST™</span>' : ""}<img loading="lazy" src="${img(s[2], 160)}" alt=""><div class="w">${a}${d.w >= 0 ? " · " + WN[d.w] : ""}</div><div class="f">${b}</div><div class="pr">${money(d.v)}</div>${extra}</div>`;
  }
  /* Inventar (brauzer xotirasida) */
  const inv = { get: () => store("cs2inv") || [], set: (a) => store("cs2inv", a), add(ds) { this.set(this.get().concat(ds)); }, remove(ids) { const s = new Set(ids); this.set(this.get().filter((d) => !s.has(d.id))); } };

  /* Gorizontal tasma: g'olib skin markazdagi chiziq ostida to'xtaydi */
  async function spinStrip(box, c, win, ms = 5600) {
    const gen = typeof c === "function" ? c : () => roll(c), N = 54, at = 46, fill = Array.from({ length: N }, (_, k) => (k === at ? win : gen()));
    box.innerHTML = `<div class="strip"><div class="track">${fill.map((d) => tile(d)).join("")}</div><div class="marker"></div></div>`;
    const track = box.querySelector(".track"), W = box.querySelector(".strip").clientWidth, step = 104 + 8;
    const target = 8 + at * step + 52 - W / 2 + (Math.random() - 0.5) * 80;
    if (REDUCED) ms = 400;
    if (!track.animate) { track.style.transform = `translateX(${-target}px)`; return; }
    const anim = track.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-target}px)` }], { duration: ms, easing: "cubic-bezier(.08,.72,.1,1)", fill: "forwards" });
    let last = 0, on = true; // har bir skin o'tganda tebranish
    const tick = () => { if (!on) return; const m = new DOMMatrix(getComputedStyle(track).transform); const k = Math.floor((-m.m41 + W / 2) / step); if (k !== last) { last = k; haptic("light"); } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    await done(anim, ms); on = false; anim.finish && anim.finish();
    const wt = track.children[at]; wt.classList.add("win-sk");
  }
  /* Vertikal tasma (keys jangi uchun) */
  async function spinV(box, c, win, ms = 4200) {
    const gen = typeof c === "function" ? c : () => roll(c), N = 30, at = 26, fill = Array.from({ length: N }, (_, k) => (k === at ? win : gen()));
    box.innerHTML = `<div class="vstrip"><div class="vtrack">${fill.map((d) => tile(d)).join("")}</div><div class="hline"></div></div>`;
    const track = box.querySelector(".vtrack"), H = 128, step = 118 + 6, target = at * step + 59 - H / 2 + (Math.random() - 0.5) * 50;
    if (REDUCED) ms = 400;
    if (!track.animate) { track.style.transform = `translateY(${-target}px)`; return; }
    const anim = track.animate([{ transform: "translateY(0)" }, { transform: `translateY(${-target}px)` }], { duration: ms, easing: "cubic-bezier(.08,.72,.1,1)", fill: "forwards" });
    await done(anim, ms); anim.finish && anim.finish();
  }
  /* Animatsiya tugashini kutish — kadrlar to'xtab qolsa ham (ilova fonda) taymer bilan davom etadi */
  const done = (anim, ms) => Promise.race([anim.finished.catch(() => {}), sleep(ms + 400)]);
  const loader = (stage) => { const l = document.createElement("div"); l.className = "loader"; l.innerHTML = "<i></i>Skinlar va narxlar yuklanmoqda..."; stage.appendChild(l); return l; };
  const freeBtn = (stage, api, after) => {
    const b = api.el(`<button class="btn ghost" style="margin-bottom:10px">Bepul $10 olish</button>`).firstChild;
    const paint = () => { const ts = store("chips_ts") || 0; b.style.display = bal() < 3 && Date.now() - ts > 600000 ? "block" : "none"; };
    b.onclick = () => { store("chips_ts", Date.now()); Chips.add(1000); api.confetti({ n: 50, coins: true }); paint(); after && after(); };
    paint(); return paint;
  };
  return { setMoney: (f) => (money = f), done, load, img, usd, cost, bal, pay, credit, roll, makeDrop, label, tile, inv, spinStrip, spinV, loader, freeBtn, RC, WN, get data() { return data; } };
})();

/* 0) BILOLDROP — alohida bo'lim (biloldrop.html) --------------------- */
G.add({
  id: "biloldrop", ico: "💠", nm: "Biloldrop", cat: "cs2", tag: "HOT", ds: "Keyslar, keys jangi, apgreyd, kontrakt, terminal va bonuslar — hammasi bitta joyda",
  start(stage) { stage.innerHTML = '<div class="loader"><i></i>Biloldrop ochilmoqda...</div>'; location.href = "biloldrop.html"; },
});

