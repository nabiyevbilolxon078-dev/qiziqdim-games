"use strict";
/* =====================================================================
   BILOLDROP — CS2 keys simulyatori (real pul yo'q).
   Narxlar: Skinport bozor narxlari, so'mga Markaziy bank kursida.
   ===================================================================== */
let D = null, VARIANTS = [], CASES = [], cleanup = null;
const page = $("page");
const SVGS = {
  up: '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M32 52V14M18 28l14-14 14 14"/><path d="M14 56h36" opacity=".5"/></svg>',
  contract: '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4" stroke-linejoin="round"><rect x="14" y="8" width="36" height="48" rx="5"/><path d="M22 22h20M22 32h20M22 42h12" stroke-linecap="round"/></svg>',
  roulette: '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4"><circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="7"/><path d="M32 10v15M32 39v15M10 32h15M39 32h15"/></svg>',
  ladder: '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4" stroke-linecap="round"><path d="M20 6v52M44 6v52M20 16h24M20 28h24M20 40h24M20 52h24"/></svg>',
  crash: '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 54C24 52 38 42 50 14"/><path d="M40 14h10v10"/></svg>',
  wheel: '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4"><circle cx="32" cy="34" r="22"/><path d="M32 34L32 12M32 34l19 11M32 34L13 45"/><path d="M26 4h12l-6 8z" fill="#eef1f7"/></svg>',
  tower: '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4" stroke-linejoin="round"><path d="M18 58V22h28v36M14 22h36M22 22V12h6v5h8v-5h6v10"/><path d="M28 58V46h8v12"/></svg>',
  sapper: '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4" stroke-linecap="round"><circle cx="32" cy="36" r="16"/><path d="M32 8v8M32 56v4M8 36h4M52 36h4M15 19l5 5M49 19l-5 5"/><circle cx="26" cy="31" r="3" fill="#eef1f7"/></svg>',
};

/* ---------- Statistika, vazifalar, boss, VIP, pass ---------- */
const today = () => new Date().toISOString().slice(0, 10);
const S = {
  get() { return Object.assign({ spent: 0, ret: 0, cbSpent: 0, cbRet: 0, xp: 0, claimed: [], best: null, opened: 0 }, store("bd_stats") || {}); },
  save(s) { store("bd_stats", s); },
  spend(usd) { const s = this.get(); s.spent += usd; s.cbSpent += usd; s.xp += Math.round(usd * 20); this.save(s); Tasks.ev("spend", usd); Boss.dmg(usd); },
  ret(usd) { const s = this.get(); s.ret += usd; s.cbRet += usd; this.save(s); },
  drop(d) { const s = this.get(); if (!s.best || d.v > s.best.v) s.best = d; this.save(s); },
};
const pay = (usd) => { if (!CS.pay(usd)) return false; S.spend(usd); return true; };
const win = (usd) => { if (usd > 0) { CS.credit(usd); S.ret(usd); } };
const Tasks = {
  LIST: [
    { k: "case", n: 5, t: "5 ta keys oching", r: 0.5 },
    { k: "upgrade", n: 2, t: "2 marta apgreyd qiling", r: 0.4 },
    { k: "crash", n: 3, t: "Crashda 3 marta o'ynang", r: 0.3 },
    { k: "roulette", n: 5, t: "Ruletkada 5 marta tiking", r: 0.3 },
    { k: "contract", n: 1, t: "1 ta kontrakt tuzing", r: 0.4 },
    { k: "tower", n: 3, t: "Minorada 3 marta o'ynang", r: 0.3 },
    { k: "spend", n: 10, t: "Jami $10 sarflang", r: 1 },
  ],
  today() { let t = store("bd_tasks"); if (!t || t.d !== today()) t = { d: today(), c: {}, got: [] }; return t; },
  ev(k, n = 1) { const t = this.today(); t.c[k] = (t.c[k] || 0) + n; store("bd_tasks", t); },
};
const BOSSES = [["🐉", "Ajdar"], ["👹", "Dev"], ["🦂", "Chayon"], ["🐺", "Kulrang bo'ri"], ["🦅", "Qora burgut"], ["🐗", "Yovvoyi to'ng'iz"], ["🧌", "Alp"]];
const Boss = {
  HP: 25,
  today() { let b = store("bd_boss"); if (!b || b.d !== today()) b = { d: today(), dmg: 0, claimed: false }; return b; },
  dmg(usd) { const b = this.today(); b.dmg += usd; store("bd_boss", b); },
  who() { return BOSSES[Math.floor(Date.now() / 864e5) % BOSSES.length]; },
};
const VIP = [["Yangi", 0, 0], ["Bronza", 20, 2], ["Kumush", 100, 3], ["Oltin", 400, 5], ["Platina", 1500, 7], ["Olmos", 5000, 10]];
const vipOf = (spent) => { let k = 0; VIP.forEach((v, i) => spent >= v[1] && (k = i)); return k; };
const passReward = (L) => +(0.25 + L * 0.1 * (L % 5 === 0 ? 3 : 1)).toFixed(2);

/* ---------- Biloldrop keyslari (haqiqiy skinlardan) ---------- */
const isKnife = (i) => { const n = D.skins[i][0]; return n.startsWith("★") && !/Gloves|Wraps/.test(n); };
const isGlove = (i) => /Gloves|Wraps/.test(D.skins[i][0]);
const nameStarts = (p) => (v) => D.skins[v.i][0].startsWith(p);
const DEF = [
  { id: "free", n: "Kunlik bepul", p: 0, ev: 0.12, cc: "#c4ff3d", pick: (v) => v.v >= 0.03 && v.v <= 1.5 },
  { id: "start", n: "Boshlang'ich", p: 0.6, cc: "#7ee0ff", pick: (v) => v.v <= 8 },
  { id: "firuza", n: "Firuza", p: 2, cc: "#2fd4c7", pick: (v) => v.v >= 0.05 && v.v <= 45 },
  { id: "deagle", n: "Cho'l burguti", p: 3.5, cc: "#d9b26f", pick: nameStarts("Desert Eagle |"), tag: "YANGI" },
  { id: "ak", n: "AK ustasi", p: 5, cc: "#ff8a3d", pick: nameStarts("AK-47 |"), tag: "HOT" },
  { id: "m4", n: "M4 sahrosi", p: 6, cc: "#e6c07b", pick: (v) => /^M4A(4|1-S) \|/.test(D.skins[v.i][0]) },
  { id: "awp", n: "AWP ovchisi", p: 9, cc: "#5ad17a", pick: nameStarts("AWP |"), tag: "HOT" },
  { id: "tashkent", n: "Tungi Toshkent", p: 12, cc: "#8b6cff", pick: (v) => v.v >= 0.1 && v.v <= 300 && !isKnife(v.i) },
  { id: "samarqand", n: "Oltin Samarqand", p: 25, cc: "#ffc542", pick: (v) => v.v >= 0.5 && v.v <= 900 },
  { id: "knife", n: "Pichoq ovi", p: 45, cc: "#ff4d5e", pick: (v) => (isKnife(v.i) ? v.v <= 1500 : v.v >= 0.5 && v.v <= 20), tag: "★" },
  { id: "gloves", n: "Qo'lqoplar", p: 60, cc: "#e05cff", pick: (v) => (isGlove(v.i) ? v.v <= 2500 : v.v >= 1 && v.v <= 25), tag: "★" },
  { id: "million", n: "Millioner", p: 150, cc: "#ffffff", pick: (v) => v.v >= 8 },
];
/* Narxlar bo'yicha log-tekis tanlov: arzondan qimmatgacha 14 xil skin */
function spread(cand, n) {
  if (!cand.length) return [];
  const lo = Math.log(cand[0].v), hi = Math.log(cand[cand.length - 1].v), out = [], seen = new Set();
  for (let k = 0; k < n; k++) {
    const t = Math.exp(lo + ((hi - lo) * k) / Math.max(1, n - 1));
    let a = 0, b = cand.length - 1; while (a < b) { const m = (a + b) >> 1; cand[m].v < t ? (a = m + 1) : (b = m); }
    for (let d = 0; d < cand.length; d++) { for (const j of [a - d, a + d]) { if (j >= 0 && j < cand.length && !seen.has(cand[j].i)) { seen.add(cand[j].i); out.push(cand[j]); d = cand.length; break; } } }
  }
  return out.sort((x, y) => y.v - x.v);
}
/* Og'irliklar: w = narx^(-a). a ni o'rtacha qaytim (EV) maqsadga teng bo'lguncha topamiz */
function solve(items, target) {
  const f = (a) => { let s = 0, sw = 0; for (const it of items) { const w = Math.pow(it.v, -a); s += it.v * w; sw += w; } return s / sw; };
  let lo = 0, hi = 8; if (f(0) <= target) return items.map(() => 1);
  for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; f(m) > target ? (lo = m) : (hi = m); }
  return items.map((it) => Math.pow(it.v, -hi));
}
function customDrop(it) {
  const s = D.skins[it.i], multi = s[3].length > 1, band = [[0, .07], [.07, .15], [.15, .38], [.38, .45], [.45, 1]][Math.max(0, it.w)];
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), i: it.i, w: it.w, st: false, f: multi ? +(band[0] + Math.random() * (band[1] - band[0])).toFixed(4) : null, v: it.v };
}
/* Keys yasash: tanlangan variantlardan 14 xil skin, o'rtacha qaytim narxning 82% i */
function makeCase(def) {
  const items = spread(VARIANTS.filter(def.pick), def.size || 14);
  if (items.length < 6) return null;
  const lo = items[items.length - 1].v;
  const price = def.p ?? +Math.max(lo * 1.3, Math.exp(items.reduce((a, it) => a + Math.log(it.v), 0) / items.length) * 1.4).toFixed(2);
  const w = solve(items, def.ev ?? price * 0.82), tw = w.reduce((a, b) => a + b, 0);
  return { type: "custom", grp: def.grp || "top", id: def.id, n: def.n, price, cc: def.cc, tag: def.tag, items, w, tw,
    art: items.slice(0, 3).map((it) => CS.img(D.skins[it.i][2], 256)),
    gen() { let r = Math.random() * tw; for (let k = 0; k < items.length; k++) if ((r -= w[k]) < 0) return customDrop(items[k]); return customDrop(items[items.length - 1]); } };
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const PALETTE = ["#ff4d5e", "#8b6cff", "#2fd4c7", "#ffc542", "#3fd27c", "#ff8a3d", "#7ee0ff", "#e05cff", "#c4ff3d", "#d9b26f"];
function buildCases() {
  const defs = DEF.map((d) => ({ ...d }));
  const nameOf = (v) => D.skins[v.i][0];
  // 1) Har bir qurol uchun to'plam
  const byWeapon = {};
  VARIANTS.forEach((v) => { const n = nameOf(v); if (n.startsWith("★") || !n.includes(" | ")) return; const w = n.split(" | ")[0]; (byWeapon[w] ||= new Set()).add(v.i); });
  Object.entries(byWeapon).filter(([, s]) => s.size >= 8).sort((a, b) => b[1].size - a[1].size).forEach(([w], k) =>
    defs.push({ id: "w-" + slug(w), n: `${w} to'plami`, grp: "weapon", cc: PALETTE[k % PALETTE.length], pick: (v) => nameOf(v).startsWith(w + " | ") }));
  // 2) Har bir pichoq turi: pichoqlar + arzonroq to'ldiruvchilar
  const knifeTypes = [...new Set(VARIANTS.filter((v) => isKnife(v.i)).map((v) => nameOf(v).split(" | ")[0]))];
  knifeTypes.forEach((t, k) => {
    const kv = VARIANTS.filter((v) => isKnife(v.i) && nameOf(v).split(" | ")[0] === t); if (kv.length < 3) return;
    const cheap = kv[0].v, top = kv[kv.length - 1].v;
    defs.push({ id: "k-" + slug(t), n: `${t.replace("★ ", "")} ovi`, grp: "knife", tag: "★", cc: PALETTE[(k + 3) % PALETTE.length], p: +(cheap * 0.45).toFixed(2), size: 16,
      pick: (v) => (isKnife(v.i) ? nameOf(v).split(" | ")[0] === t && v.v <= Math.min(top, cheap * 40) : v.v >= cheap * 0.02 && v.v <= cheap * 0.4) });
  });
  // 3) Qo'lqop turlari
  const gloveTypes = [...new Set(VARIANTS.filter((v) => isGlove(v.i)).map((v) => nameOf(v).split(" | ")[0]))];
  gloveTypes.forEach((t, k) => {
    const gv = VARIANTS.filter((v) => isGlove(v.i) && nameOf(v).split(" | ")[0] === t); if (gv.length < 3) return;
    const cheap = gv[0].v;
    defs.push({ id: "g-" + slug(t), n: t.replace("★ ", ""), grp: "glove", tag: "★", cc: PALETTE[(k + 6) % PALETTE.length], p: +(cheap * 0.45).toFixed(2), size: 16,
      pick: (v) => (isGlove(v.i) ? nameOf(v).split(" | ")[0] === t && v.v <= cheap * 40 : v.v >= cheap * 0.02 && v.v <= cheap * 0.4) });
  });
  // 4) Mashhur uslublar (bo'yoq nomi bo'yicha)
  ["Doppler", "Gamma Doppler", "Fade", "Marble Fade", "Tiger Tooth", "Slaughter", "Crimson Web", "Case Hardened", "Asiimov", "Hyper Beast", "Neo-Noir", "Printstream", "Redline", "Vulcan", "Bloodsport", "The Emperor", "Fire Serpent", "Wild Lotus", "Kill Confirmed", "Fever Dream", "Mecha Industries", "Ultraviolet", "Damascus Steel", "Safari Mesh"].forEach((st, k) =>
    defs.push({ id: "s-" + slug(st), n: `${st} uslubi`, grp: "style", cc: PALETTE[(k + 1) % PALETTE.length], pick: (v) => (nameOf(v).split(" | ")[1] || "").split(" (")[0] === st }));
  // 5) Narx bo'yicha (so'mda)
  [1000, 3000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000].forEach((s, k) => {
    const usd = s / RATE;
    defs.push({ id: "t-" + s, n: `${s >= 1e6 ? s / 1e6 + " mln" : s.toLocaleString("ru-RU")} so'mlik`, grp: "tier", cc: PALETTE[(k + 4) % PALETTE.length], p: +usd.toFixed(2), pick: (v) => v.v >= usd * 0.04 && v.v <= usd * 25 });
  });
  // 6) Noyoblik bo'yicha
  [[2, "Ko'k harbiy", "#4b69ff"], [3, "Binafsha cheklangan", "#8847ff"], [4, "Pushti maxfiy", "#d32ce6"], [5, "Qizil yashirin", "#eb4b4b"]].forEach(([r, n, cc]) =>
    defs.push({ id: "r-" + r, n, grp: "style", cc, pick: (v) => D.skins[v.i][1] === r }));
  const seen = new Set();
  const custom = defs.map(makeCase).filter((c) => c && !seen.has(c.id) && seen.add(c.id));
  const official = D.cases.map((c, k) => ({ type: "official", grp: "official", id: "o" + k, n: c.n, price: CS.cost(c), cc: "#8b6cff", src: c, art: [CS.img(c.img, 360)], gen: () => CS.roll(c) }));
  return custom.concat(official);
}

/* ---------- Jonli tushumlar (botlar simulyatsiyasi + sizning tushumlaringiz) ---------- */
const BOTS = ["Sardor_07", "jasur.uz", "Dilshod", "Aziz2009", "bekzod_cs", "Shaxzod", "Otabek", "Javohir", "Ulugbek", "Islom_x", "Muhammadali", "Behruz", "Nodir", "Asadbek"];
function liveAdd(d, who) {
  const s = D.skins[d.i], el = document.createElement("div"); el.className = "lv"; el.style.setProperty("--rc", CS.RC[s[1]]);
  const n = s[0].split(" | ");
  el.innerHTML = `<div class="u ${who === "Siz" ? "me" : ""}">${who}</div><img src="${CS.img(s[2], 128)}" alt=""><div class="n">${n[1] || n[0]}</div>`;
  const live = $("live"); live.prepend(el); while (live.children.length > 14) live.lastChild.remove();
}
function liveTick() {
  const c = Math.random() < 0.6 ? pick(CASES.slice(1, 12)) : pick(CASES.slice(12));
  let d = c.gen(); for (let k = 0; k < 2 && D.skins[d.i][1] < 3; k++) d = c.gen(); // qiziqroq tushumlar ko'proq ko'rinsin
  liveAdd(d, "🤖 " + pick(BOTS));
}

/* ---------- Umumiy UI yordamchilari ---------- */
function el(html, cls = "", parent = page) { const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; parent.appendChild(d); return d; }
function backBtn(label, fn) { const b = el(`<button class="btn ghost" style="padding:10px;margin-bottom:10px">← ${label}</button>`).firstChild; b.onclick = fn; return b; }
function betPanel(key = "bd_bet") {
  let v = store(key) || 5000; // so'mda
  const box = el(`<div class="l"><button data-a="-">−</button><input inputmode="numeric"><button data-a="+">+</button></div><div class="q"><button data-q="1000">1 000</button><button data-q="10000">10 000</button><button data-q="half">½</button><button data-q="x2">×2</button></div>`, "bet");
  const inp = box.querySelector("input");
  const paint = () => { v = Math.max(1000, Math.round(v / 100) * 100); store(key, v); inp.value = v.toLocaleString("ru-RU"); };
  inp.onchange = () => { v = +inp.value.replace(/\D/g, "") || 1000; paint(); };
  box.querySelectorAll("button").forEach((b) => (b.onclick = () => { haptic(); const a = b.dataset.a, q = b.dataset.q; const st = v < 10000 ? 1000 : v < 100000 ? 5000 : 50000; if (a === "+") v += st; else if (a === "-") v -= st; else if (q === "half") v /= 2; else if (q === "x2") v *= 2; else v = +q; paint(); }));
  paint();
  return { usd: () => v / RATE, som: () => v, box };
}
const done = (anim, ms) => Promise.race([anim.finished.catch(() => {}), sleep(ms + 400)]);
function sheet(html) { $("sheetBody").innerHTML = html; $("sheet").classList.add("on"); return $("sheetBody"); }
$("sheet").onclick = (e) => { if (e.target.id === "sheet") $("sheet").classList.remove("on"); };
const closeSheet = () => $("sheet").classList.remove("on");

/* ---------- Navigatsiya ---------- */
const PAGES = {};
let cur = "cases";
function go(name, arg) {
  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  cur = name; closeSheet();
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", name.startsWith(b.dataset.p)));
  page.innerHTML = ""; page.classList.remove("enter"); void page.offsetWidth; page.classList.add("enter"); window.scrollTo(0, 0);
  cleanup = PAGES[name](arg) || null;
  Chips.paint();
}
document.querySelectorAll("nav button").forEach((b) => (b.onclick = () => { haptic(); go(b.dataset.p); }));
$("topup").onclick = () => {
  const ts = store("chips_ts") || 0;
  if (CS.bal() >= 3) return toast(`Bepul to'ldirish balans ${som(3)} dan kam bo'lganda ishlaydi`);
  if (Date.now() - ts < 600000) return toast("Bepul to'ldirish 10 daqiqada bir marta");
  store("chips_ts", Date.now()); Chips.add(1000); Confetti.fire(50); toast(`+${som(10)}`);
};

/* =====================================================================
   KEYSLAR
   ===================================================================== */
function caseCard(c, k) {
  const free = c.id === "free";
  const art = c.type === "custom"
    ? `${c.art[1] ? `<img class="b2" loading="lazy" src="${c.art[1]}" alt="">` : ""}${c.art[2] ? `<img class="b3" loading="lazy" src="${c.art[2]}" alt="">` : ""}<img class="b1" loading="lazy" src="${c.art[0]}" alt="">`
    : `<img loading="lazy" src="${c.art[0]}" alt="">`;
  return `<div class="case" data-c="${c.id}" style="--cc:${c.cc};--i:${Math.min(k, 14)}">${c.tag ? `<span class="tag">${c.tag}</span>` : ""}<div class="art">${art}</div><div class="cn">${c.n}</div><div class="cp ${free ? "free" : ""}">${free ? "Bepul" : som(c.price)}</div></div>`;
}
const GROUPS = [["top", "Mashhur"], ["knife", "Pichoqlar"], ["glove", "Qo'lqoplar"], ["weapon", "Qurollar"], ["style", "Uslublar"], ["tier", "Narx bo'yicha"], ["official", "Rasmiy CS2"]];
PAGES.cases = () => {
  const free = CASES.find((c) => c.id === "free");
  el(`<h2>Keyslar <small style="font:700 13px var(--font);color:var(--faint)">${CASES.length} ta</small></h2>`);
  // Bepul keys — ixcham banner
  const fb = el(`<div class="free-b" style="--cc:${free.cc}"><img src="${free.art[0]}" alt=""><div><b>Kunlik bepul keys</b><span id="freeT"></span></div><button class="btn" style="width:auto;padding:10px 16px">Ochish</button></div>`);
  fb.onclick = () => go("casepage", "free");
  const left = Math.max(0, (store("bd_free_ts") || 0) + 864e5 - Date.now());
  $("freeT").textContent = left ? `Keyingisi ${Math.ceil(left / 36e5)} soatdan keyin` : "Hozir ochish mumkin!";
  const q = el(`<input class="inp" placeholder="Keys qidirish: AK, Karambit, Doppler...">`).firstChild;
  let g = store("bd_grp") || "all";
  const chips = el([["all", "Hammasi"], ...GROUPS].map(([k, n]) => `<button data-g="${k}">${n}</button>`).join(""), "chips");
  chips.style.marginTop = "10px";
  const body = el("");
  const draw = () => {
    chips.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.g === g));
    const s = q.value.trim().toLowerCase(), f = (c) => c.id !== "free" && (!s || c.n.toLowerCase().includes(s));
    body.innerHTML = GROUPS.filter(([k]) => g === "all" || g === k).map(([k, n]) => {
      const list = CASES.filter((c) => c.grp === k && f(c)); if (!list.length) return "";
      return `<h3>${n} <small>${list.length} ta</small></h3><div class="cases">${list.map(caseCard).join("")}</div>`;
    }).join("") || `<div class="sub center" style="padding:30px 0">Hech narsa topilmadi</div>`;
    body.querySelectorAll(".case").forEach((x) => (x.onclick = () => { haptic(); go("casepage", x.dataset.c); }));
  };
  chips.querySelectorAll("button").forEach((b) => (b.onclick = () => { g = b.dataset.g; store("bd_grp", g); haptic(); draw(); }));
  q.oninput = draw; draw();
};
PAGES.casepage = (id) => {
  const c = CASES.find((x) => x.id === id); let n = 1, busy = false, alive = true;
  const free = c.id === "free";
  backBtn("Keyslar", () => go("cases"));
  el(`<div class="art"><img src="${c.type === "custom" ? c.art[0] : c.art[0]}" alt=""></div><h2 style="margin:6px 0 2px">${c.n}</h2><div class="sub">${c.type === "custom" ? `${c.items.length} xil skin · o'rtacha qaytim ~${Math.round((c.items.reduce((a, it, k) => a + it.v * c.w[k], 0) / c.tw / Math.max(c.price, 0.01)) * 100)}%` : `${c.src.i.length} ta skin${c.src.r.length ? ` + ${c.src.r.length} ta ★ noyob buyum` : ""}`}</div>`, "hero").style.setProperty("--cc", c.cc);
  const cnt = free ? null : el([1, 2, 3, 5].map((k) => `<button data-n="${k}" class="${k === 1 ? "on" : ""}">×${k}</button>`).join(""), "cnt");
  const goB = el(`<button class="btn"></button>`).firstChild;
  const strips = el(""), res = el("");
  const freeLeft = () => Math.max(0, (store("bd_free_ts") || 0) + 864e5 - Date.now());
  const paintGo = () => {
    if (free) { const l = freeLeft(); goB.disabled = l > 0 || busy; goB.textContent = l > 0 ? `Keyingi bepul keys: ${Math.ceil(l / 36e5)} soatdan keyin` : "Bepul ochish"; }
    else goB.textContent = `Ochish · ${som(c.price * n)}`;
  };
  if (cnt) cnt.querySelectorAll("button").forEach((b) => (b.onclick = () => { if (busy) return; n = +b.dataset.n; cnt.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); paintGo(); }));
  paintGo();
  el(`<h3>Ichida nimalar bor</h3>`);
  if (c.type === "custom") {
    el(c.items.map((it, k) => CS.tile({ ...it, st: false }).replace('<div class="w">', `<span class="ch">${((c.w[k] / c.tw) * 100).toFixed(c.w[k] / c.tw < 0.01 ? 2 : 1)}%</span><div class="w">`)).join(""), "skins");
  } else {
    const mm = (i) => { const s = D.skins[i], a = s[3].concat(s[4]).filter((x) => x > 0); return [Math.min(...a), Math.max(...a)]; };
    const items = c.src.i.slice().sort((a, b) => D.skins[b][1] - D.skins[a][1]);
    const rare = c.src.r.length ? `<div class="sk" style="--rc:${CS.RC[7]}"><img loading="lazy" src="${CS.img(D.skins[c.src.r[0]][2], 160)}" alt=""><div class="w">★ ${c.src.r.length} xil</div><div class="f">Noyob maxsus buyum</div><div class="pr">${som(Math.min(...c.src.r.map((i) => mm(i)[0])))}+</div></div>` : "";
    el(rare + items.map((i) => { const [lo, hi] = mm(i); return CS.tile({ i, w: -1, st: false, v: lo }).replace(/<div class="pr">.*?<\/div>/, `<div class="pr">${som(lo)} – ${som(hi)}</div>`); }).join(""), "skins");
  }
  goB.onclick = async () => {
    if (busy) return;
    if (free) { if (freeLeft() > 0) return; store("bd_free_ts", Date.now()); }
    else if (!pay(c.price * n)) return;
    busy = true; paintGo(); goB.disabled = true; res.innerHTML = "";
    const drops = Array.from({ length: free ? 1 : n }, () => c.gen());
    CS.inv.add(drops); drops.forEach((d) => { S.ret(d.v); S.drop(d); }); Tasks.ev("case", drops.length);
    strips.innerHTML = drops.map(() => "<div></div>").join("");
    strips.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
    await Promise.all(drops.map((d, k) => CS.spinStrip(strips.children[k], c.gen, d, 5600 + k * 350)));
    if (!alive) return;
    drops.forEach((d) => liveAdd(d, "Siz"));
    const sum = drops.reduce((a, d) => a + d.v, 0), best = Math.max(...drops.map((d) => D.skins[d.i][1]));
    haptic(sum >= c.price * n ? "ok" : "medium"); if (best >= 5 || (c.price && sum >= c.price * n * 3)) Confetti.fire(best === 7 ? 160 : 90);
    res.innerHTML = `<div class="msg">${best === 7 ? "★ NOYOB BUYUM! ★ " : ""}Tushdi: <span style="color:var(--lime)">${som(sum)}</span></div><div class="skins">${drops.map((d) => CS.tile(d)).join("")}</div><div class="row"><button class="btn ghost" data-a="keep">Inventarga</button><button class="btn green" data-a="sell">Sotish · ${som(sum)}</button></div>`;
    res.querySelector('[data-a="sell"]').onclick = () => { CS.inv.remove(drops.map((d) => d.id)); CS.credit(sum); toast(`+${som(sum)}`); res.innerHTML = ""; strips.innerHTML = ""; };
    res.querySelector('[data-a="keep"]').onclick = () => { toast("Inventarga qo'shildi"); res.innerHTML = ""; strips.innerHTML = ""; };
    busy = false; goB.disabled = false; paintGo();
  };
  return () => (alive = false);
};

/* =====================================================================
   TERMINAL — istalgan skinni tanlab, imkoniyatni o'zingiz belgilaysiz
   ===================================================================== */
function skinPicker(parent, { min = 0, onPick, filterSel = true } = {}) {
  const FILT = [["all", "Hammasi"], ["knife", "Pichoqlar"], ["glove", "Qo'lqoplar"], ["AK-47 |", "AK-47"], ["AWP |", "AWP"], ["M4A", "M4"], ["Desert Eagle |", "Deagle"]];
  let f = "all";
  const chips = filterSel ? el(FILT.map(([k, n]) => `<button data-f="${k}" class="${k === "all" ? "on" : ""}">${n}</button>`).join(""), "chips", parent) : null;
  const q = el(`<input class="inp" placeholder="Qidirish: Karambit, Asiimov..." style="margin-bottom:8px">`, "", parent).firstChild;
  const sortSeg = el(`<button data-s="up" class="on">Arzonidan</button><button data-s="down">Qimmatidan</button>`, "seg", parent);
  const grid = el("", "skins", parent); let sort = "up", list = [];
  const draw = () => {
    const s = q.value.trim().toLowerCase();
    list = VARIANTS.filter((v) => v.v >= min && (f === "all" || (f === "knife" ? isKnife(v.i) : f === "glove" ? isGlove(v.i) : D.skins[v.i][0].startsWith(f))) && (!s || D.skins[v.i][0].toLowerCase().includes(s)));
    if (sort === "down") list = list.slice().reverse();
    list = list.slice(0, 45);
    grid.innerHTML = list.map((v, k) => CS.tile({ ...v, id: "p" + k })).join("") || `<div class="sub" style="grid-column:1/-1">Hech narsa topilmadi</div>`;
    grid.querySelectorAll(".sk").forEach((x, k) => (x.onclick = () => { haptic(); grid.querySelectorAll(".sk").forEach((y) => y.classList.remove("sel")); x.classList.add("sel"); onPick(list[k]); }));
  };
  if (chips) chips.querySelectorAll("button").forEach((b) => (b.onclick = () => { f = b.dataset.f; chips.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); draw(); }));
  sortSeg.querySelectorAll("button").forEach((b) => (b.onclick = () => { sort = b.dataset.s; sortSeg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); draw(); }));
  q.oninput = draw; draw();
  return { redraw: (m) => { min = m; draw(); } };
}
PAGES.terminal = () => {
  el(`<h2>Terminal</h2><p class="sub">Istalgan skinni tanlang va olish imkoniyatini o'zingiz belgilang. Imkoniyat qancha katta bo'lsa — narx shuncha yuqori.</p>`);
  let alive = true;
  skinPicker(page, { min: 0.3, onPick: (v) => {
    let ch = 0.3, busy = false;
    const b = sheet(`<div class="skins" style="grid-template-columns:1fr;max-width:200px;margin:0 auto">${CS.tile({ ...v, id: "x" })}</div>
      <div class="msg" id="tCh"></div><input type="range" class="slider" id="tSl" min="1" max="80" value="30">
      <div class="tbar"><div class="z" id="tZ"></div><div class="p" id="tP"></div></div>
      <button class="btn" id="tGo"></button><div class="msg" id="tRes"></div>`);
    const paint = () => { $("tCh").innerHTML = `Imkoniyat: <span style="color:var(--lime)">${Math.round(ch * 100)}%</span>`; $("tZ").style.width = ch * 100 + "%"; $("tGo").textContent = `Urinish · ${som(v.v * ch * 1.07)}`; };
    $("tSl").oninput = (e) => { if (busy) return; ch = e.target.value / 100; paint(); };
    $("tGo").onclick = async () => {
      if (busy || !pay(v.v * ch * 1.07)) return; busy = true; $("tGo").disabled = true; Tasks.ev("terminal");
      const ok = Math.random() < ch, x = ok ? Math.random() * ch : ch + Math.random() * (1 - ch), P = $("tP");
      const an = P.animate ? P.animate([{ left: "0%" }, { left: "100%" }, { left: "0%" }, { left: x * 100 + "%" }], { duration: REDUCED ? 300 : 2600, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" }) : null;
      if (an) await done(an, 2600); P.style.left = x * 100 + "%";
      if (!alive) return;
      if (ok) { const d = customDrop(v); CS.inv.add([d]); S.ret(d.v); S.drop(d); liveAdd(d, "Siz"); Confetti.fire(100); haptic("ok"); $("tRes").innerHTML = `<span style="color:var(--green)">Yutdingiz! Skin inventarda</span>`; }
      else { haptic("bad"); shakeEl($("sheetBody")); $("tRes").innerHTML = `<span style="color:var(--red)">Omad kelmadi</span>`; }
      busy = false; $("tGo").disabled = false;
    };
    paint();
  } });
  return () => (alive = false);
};

/* =====================================================================
   O'YINLAR
   ===================================================================== */
const GAMES = [
  ["battle", "Keys jangi", "Botlarga qarshi keys ochish — eng qimmati hammasini oladi", "#ff4d5e"],
  ["upgrade", "Apgreyd", "Skin yoki balansni qimmatroq skinga", "#8b6cff"],
  ["contract", "Kontrakt", "3–10 skindan bitta yangi skin", "#2fd4c7"],
  ["roulette", "Ruletka", "Rangni tanlang: ×2, ×3, ×5, ×50", "#ff4d5e"],
  ["ladder", "Narvon", "Har pog'onada ko'paytma o'sadi", "#ff8a3d"],
  ["crash", "Crash", "Grafik qulashidan oldin oling", "#3fd27c"],
  ["wheel", "G'ildirak", "Xavf darajasini tanlang", "#ffc542"],
  ["tower", "Minora", "Bombasiz kataklarni tanlab yuqoriga", "#7ee0ff"],
  ["sapper", "Saper", "Minalardan qoching, olmos yig'ing", "#e05cff"],
];
PAGES.games = () => {
  el(`<h2>O'yinlar</h2>`);
  const g = el(GAMES.map(([k, n, d, c], i) => `<div class="gm" data-g="${k}" style="--gc:${c};--i:${i}"><div class="t">${n}</div><div class="d">${d}</div>${SVGS[k === "upgrade" ? "up" : k]}</div>`).join(""), "games");
  g.querySelectorAll(".gm").forEach((x) => (x.onclick = () => { haptic(); go("games/" + x.dataset.g); }));
  el(`<h3>Kazino <small>${G.list.length} ta</small></h3>`);
  const COLS = ["#ff4d5e", "#8b6cff", "#3fd27c", "#ffc542", "#2fd4c7", "#ff8a3d"];
  const k2 = el(G.list.map((x, i) => `<div class="gm cas" data-k="${x.id}" style="--gc:${COLS[i % COLS.length]};--i:${i}"><div class="t">${x.nm}</div><div class="d">${x.ds}</div><span class="e">${x.ico}</span></div>`).join(""), "games");
  k2.querySelectorAll(".gm").forEach((x) => (x.onclick = () => { haptic(); go("casino", x.dataset.k); }));
};

/* --- Kazino o'yinlari (casino.js) uchun muhit: summalar so'mda, ichida fishka (1 = $0.01) --- */
function makeBoard(api, n, cols, maxW = 360, fs = 24) {
  const b = api.el(Array.from({ length: n }, (_, i) => `<button class="cell" data-i="${i}" style="font-size:${fs}px"></button>`).join(""), "board");
  b.style.gridTemplateColumns = `repeat(${cols},1fr)`; b.style.maxWidth = maxW + "px";
  return [b, [...b.children]];
}
function casinoApi(stage) {
  const toChips = (s) => Math.max(1, Math.round((s / RATE) * 100));
  return {
    score() {}, haptic, toast, rnd, pick, shuffle, sleep, clamp, best: () => false, end() {},
    width: () => Math.min(stage.clientWidth || 340, 480),
    el(html, cls = "") { const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; stage.appendChild(d); return d; },
    canvas(w, h) { const c = document.createElement("canvas"), dpr = devicePixelRatio || 1; c.width = w * dpr; c.height = h * dpr; c.style.width = w + "px"; c.style.height = h + "px"; const ctx = c.getContext("2d"); ctx.scale(dpr, dpr); stage.appendChild(c); return { c, ctx }; },
    loop(fn) { let raf = 0, last = performance.now(), on = true; const f = (now) => { if (!on) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; if (fn(dt) === false) { on = false; return; } raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(raf); }; },
    pointer(c, cb) { const h = (e) => { const r = c.getBoundingClientRect(); cb(e.clientX - r.left, e.clientY - r.top, e.type); }; c.addEventListener("pointerdown", h); c.addEventListener("pointermove", (e) => (e.buttons || e.pointerType === "touch") && h(e)); },
    keys() { return () => {}; },
    confetti: (o) => Confetti.fire((o && o.n) || 80), shake: () => shakeEl(stage), flash() {}, float: floatText,
    particles: () => ({ burst() {}, text() {}, ring() {}, step() {} }),
    bet(parent, onChange) {
      let v = store("bd_kbet") || toChips(5000);
      const d = document.createElement("div"); d.className = "bet";
      d.innerHTML = `<div class="l"><button data-a="-">−</button><input readonly><button data-a="+">+</button></div><div class="q"><button data-q="1000">1 000</button><button data-q="10000">10 000</button><button data-q="half">½</button><button data-q="x2">×2</button></div>`;
      (parent || stage).appendChild(d);
      const paint = () => { v = clamp(Math.round(v), toChips(1000), Math.max(toChips(1000), Chips.get())); store("bd_kbet", v); d.querySelector("input").value = som(v / 100); onChange && onChange(v); };
      d.querySelectorAll("button").forEach((b) => (b.onclick = () => { haptic(); const a = b.dataset.a, q = b.dataset.q, st = v < toChips(10000) ? toChips(1000) : v < toChips(100000) ? toChips(5000) : toChips(50000); if (a === "+") v += st; else if (a === "-") v -= st; else if (q === "half") v /= 2; else if (q === "x2") v *= 2; else v = toChips(+q); paint(); }));
      paint();
      return { get: () => v, paint };
    },
  };
}
PAGES.casino = (id) => {
  const g = G.list.find((x) => x.id === id);
  backBtn("O'yinlar", () => go("games"));
  el(`<h2 style="margin-top:0">${g.ico} ${g.nm}</h2><p class="sub">${g.ds}</p>`);
  const stage = el(""); stage.style.position = "relative";
  // Kazinodagi tikish va yutuqlar Pass, Boss, VIP va vazifalarga ham hisoblanadi
  const take = Chips.take, add = Chips.add;
  Chips.take = function (n) { const ok = take.call(this, n); if (ok) S.spend(n / 100); return ok; };
  Chips.add = function (n) { if (n > 0) S.ret(n / 100); return add.call(this, n); };
  let stop = null;
  try { stop = g.start(stage, casinoApi(stage)); } catch (e) { console.error(e); toast("Xatolik: " + e.message); }
  return () => { Chips.take = take; Chips.add = add; if (stop) stop(); };
};
SVGS.battle = '<svg viewBox="0 0 64 64" fill="none" stroke="#eef1f7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10l26 26M10 10h8M10 10v8M54 10L28 36M54 10h-8M54 10v8M22 40l-8 8M42 40l8 8M16 46l-6 6M48 46l6 6"/></svg>';

/* --- Keys jangi --- */
PAGES["games/battle"] = () => {
  gameHead("battle");
  let ci = store("bd_bt_case") || "ak", players = 2, rounds = 1, alive = true;
  const setup = () => {
    [...page.children].slice(2).forEach((x) => x.remove());
    const c = () => CASES.find((x) => x.id === ci) || CASES[1];
    const sel = el(`<select class="inp" style="margin-bottom:10px">${CASES.filter((x) => x.id !== "free").map((x) => `<option value="${x.id}" ${x.id === ci ? "selected" : ""}>${x.n} — ${som(x.price)}</option>`).join("")}</select>`).firstChild;
    const art = el("", "hero");
    el(`<h3 style="margin-top:6px">O'yinchilar</h3>`);
    const ps = el(`<button data-p="2">1 vs 1</button><button data-p="3">1 vs 1 vs 1</button><button data-p="4">1 vs 3</button>`, "seg");
    el(`<h3 style="margin-top:6px">Raundlar</h3>`);
    const rs = el(`<button data-r="1">1</button><button data-r="2">2</button><button data-r="3">3</button><button data-r="5">5</button>`, "seg");
    const goB = el(`<button class="btn" style="margin-top:6px"></button>`).firstChild;
    const paint = () => {
      art.innerHTML = `<div class="art" style="height:130px"><img src="${c().art[0]}" alt=""></div>`;
      ps.querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.p === players));
      rs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.r === rounds));
      goB.textContent = `Jangni boshlash · ${som(c().price * rounds)}`;
    };
    sel.onchange = () => { ci = sel.value; store("bd_bt_case", ci); paint(); };
    ps.querySelectorAll("button").forEach((b) => (b.onclick = () => { players = +b.dataset.p; paint(); }));
    rs.querySelectorAll("button").forEach((b) => (b.onclick = () => { rounds = +b.dataset.r; paint(); }));
    goB.onclick = () => { if (pay(c().price * rounds)) fight(c()); };
    paint();
  };
  const fight = async (c) => {
    [...page.children].slice(2).forEach((x) => x.remove()); window.scrollTo(0, 0); Tasks.ev("case", rounds);
    const names = ["Siz", ...shuffle(BOTS).slice(0, players - 1).map((n) => "🤖 " + n)];
    const info = el(`${c.n} · ${rounds} raund`, "msg");
    const cols = el(names.map((n) => `<div class="bt-col"><div class="who">${n}</div><div class="sum">0 so'm</div><div class="sp"></div><div class="bt-got"></div></div>`).join(""), "bt-cols");
    cols.style.gridTemplateColumns = `repeat(${players},1fr)`;
    const els = [...cols.children], sums = names.map(() => 0), got = names.map(() => []);
    for (let r = 0; r < rounds && alive; r++) {
      info.textContent = `${r + 1}-raund / ${rounds}`;
      const drops = names.map(() => c.gen());
      await Promise.all(drops.map((d, k) => CS.spinV(els[k].querySelector(".sp"), c.gen, d)));
      if (!alive) return;
      drops.forEach((d, k) => { sums[k] += d.v; got[k].push(d); els[k].querySelector(".sum").textContent = som(sums[k]); els[k].querySelector(".bt-got").insertAdjacentHTML("beforeend", `<img src="${CS.img(D.skins[d.i][2], 96)}" style="--rc:${CS.RC[D.skins[d.i][1]]}" alt="">`); if (k === 0) liveAdd(d, "Siz"); });
      haptic("medium"); await sleep(600);
    }
    if (!alive) return;
    const top = Math.max(...sums), w = pick(sums.map((s, k) => (s === top ? k : -1)).filter((k) => k >= 0));
    els[w].classList.add("win");
    const all = got.flat(), total = all.reduce((a, d) => a + d.v, 0);
    if (w === 0) { CS.inv.add(all); S.ret(total); all.forEach((d) => S.drop(d)); Confetti.fire(140); haptic("ok"); } else haptic("bad");
    const box = el(`<div class="msg">${w === 0 ? `Siz yutdingiz! ${all.length} ta skin (${som(total)}) inventarda` : `${names[w]} yutdi (${som(top)})`}</div><div class="row"><button class="btn ghost" data-a="new">Sozlamalar</button><button class="btn" data-a="again">Yana · ${som(c.price * rounds)}</button></div>`);
    box.querySelector('[data-a="new"]').onclick = setup;
    box.querySelector('[data-a="again"]').onclick = () => { if (pay(c.price * rounds)) fight(c); };
    box.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
  };
  setup();
  return () => (alive = false);
};

const gameHead = (k) => { backBtn("O'yinlar", () => go("games")); const g = GAMES.find((x) => x[0] === k); el(`<h2 style="margin-top:0">${g[1]}</h2>`); };

/* --- Apgreyd --- */
PAGES["games/upgrade"] = () => {
  gameHead("upgrade");
  let mode = "skin", picked = new Set(), target = null, spinning = false, deg = 0, alive = true;
  const R = 86, C = 2 * Math.PI * R;
  const modeSeg = el(`<button data-m="skin" class="on">Skinlardan</button><button data-m="bal">Balansdan</button>`, "seg");
  const slots = el(`<div class="slot" id="uFrom"></div><div style="font-size:20px">→</div><div class="slot" id="uTo">Maqsad skin</div>`, "slots");
  el(`<svg class="r" viewBox="0 0 200 200"><circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--panel-2)" stroke-width="16"/><circle id="uArc" cx="100" cy="100" r="${R}" fill="none" stroke="var(--lime)" stroke-width="16" stroke-dasharray="0 ${C}" stroke-linecap="round" style="transition:stroke-dasharray .4s var(--ease)"/></svg><div class="arrow" id="uArrow"><i></i></div><div class="pc"><div><span id="uPc">0%</span><small>imkoniyat</small></div></div>`, "up-ring");
  const balBox = el("");
  let bp = null;
  const goB = el(`<button class="btn" disabled>Apgreyd</button>`).firstChild;
  const mineH = el(`<h3>Sizning skinlaringiz</h3>`), mine = el("", "skins");
  el(`<h3>Maqsad skin</h3>`);
  const tp = el("");
  const value = () => (mode === "bal" ? (bp ? bp.usd() : 0) : CS.inv.get().filter((d) => picked.has(d.id)).reduce((a, d) => a + d.v, 0));
  const chance = () => (target && value() ? clamp((value() / target.v) * 0.92, 0, 0.8) : 0);
  const paint = () => {
    const v = value();
    $("uFrom").innerHTML = v ? `<div><div style="font:700 17px var(--display);color:var(--lime)">${som(v)}</div><div class="sub" style="margin:4px 0 0">${mode === "bal" ? "balansdan" : picked.size + " ta skin"}</div></div>` : mode === "bal" ? "Summani kiriting" : "Skin tanlang";
    $("uTo").innerHTML = target ? CS.tile({ ...target, id: "t" }) : "Maqsad skin";
    const ch = chance(); $("uPc").textContent = Math.round(ch * 100) + "%"; $("uArc").setAttribute("stroke-dasharray", `${ch * C} ${C}`);
    goB.disabled = !(ch > 0) || spinning;
    mineH.style.display = mine.style.display = mode === "skin" ? "" : "none";
    if (mode === "skin") {
      const items = CS.inv.get().sort((a, b) => b.v - a.v);
      mine.innerHTML = items.length ? items.map((d) => CS.tile(d)).join("") : `<div class="sub" style="grid-column:1/-1">Inventar bo'sh — keys oching yoki "Balansdan" rejimini tanlang</div>`;
      mine.querySelectorAll(".sk").forEach((x) => { x.classList.toggle("sel", picked.has(x.dataset.id)); x.onclick = () => { if (spinning) return; picked.has(x.dataset.id) ? picked.delete(x.dataset.id) : picked.add(x.dataset.id); haptic(); paint(); picker.redraw(Math.max(0.05, value() * 1.1)); }; });
    }
  };
  const setMode = (m) => {
    mode = m; picked = new Set(); modeSeg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
    balBox.innerHTML = ""; bp = null;
    if (m === "bal") { const tmp = document.createElement("div"); balBox.appendChild(tmp); bp = betPanel("bd_upbet"); tmp.replaceWith(bp.box); bp.box.querySelectorAll("input,button").forEach((x) => x.addEventListener("click", () => setTimeout(() => { paint(); picker.redraw(Math.max(0.05, value() * 1.1)); }))); bp.box.querySelector("input").addEventListener("change", () => { paint(); picker.redraw(Math.max(0.05, value() * 1.1)); }); }
    paint(); picker.redraw(Math.max(0.05, value() * 1.1));
  };
  modeSeg.querySelectorAll("button").forEach((b) => (b.onclick = () => !spinning && setMode(b.dataset.m)));
  const picker = skinPicker(tp, { min: 0.05, onPick: (v) => { if (spinning) return; target = v; paint(); }, filterSel: true });
  goB.onclick = async () => {
    const ch = chance(); if (!ch || spinning) return;
    const val = value();
    if (mode === "bal") { if (!pay(val)) return; } else { CS.inv.remove([...picked]); S.spend(val); }
    spinning = true; goB.disabled = true; Tasks.ev("upgrade");
    const ok = Math.random() < ch, land = ok ? Math.random() * ch * 360 : ch * 360 + Math.random() * (360 - ch * 360);
    const from = deg; deg = from + 360 * 4 + (((land - (from % 360)) % 360) + 360) % 360;
    const a = $("uArrow");
    if (a.animate && !REDUCED) { const an = a.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${deg}deg)` }], { duration: 3800, easing: "cubic-bezier(.12,.7,.1,1)", fill: "forwards" }); await done(an, 3800); an.finish(); } else a.style.transform = `rotate(${deg}deg)`;
    if (!alive) return;
    picked = new Set();
    if (ok) { const d = customDrop(target); CS.inv.add([d]); S.ret(d.v); S.drop(d); liveAdd(d, "Siz"); Confetti.fire(120); haptic("ok"); toast("Apgreyd muvaffaqiyatli!"); }
    else { haptic("bad"); shakeEl($("uFrom")); toast("Omad kelmadi"); }
    target = null; spinning = false; paint();
  };
  setMode("skin");
  return () => (alive = false);
};

/* --- Kontrakt --- */
PAGES["games/contract"] = () => {
  gameHead("contract");
  el(`<p class="sub">3 dan 10 tagacha skin tanlang. Natija — umumiy qiymatning 0.25× dan 4× gacha bo'lgan yangi skin.</p>`);
  let picked = new Set(), busy = false, alive = true;
  const info = el("", "card"); const goB = el(`<button class="btn" disabled>Kontrakt tuzish</button>`).firstChild; const res = el("");
  el(`<h3>Sizning skinlaringiz</h3>`); const grid = el("", "skins");
  const paint = () => {
    const items = CS.inv.get().sort((a, b) => b.v - a.v), sel = items.filter((d) => picked.has(d.id)), T = sel.reduce((a, d) => a + d.v, 0);
    info.innerHTML = `<div style="display:flex;justify-content:space-between"><span>Tanlangan: <b>${sel.length}/10</b></span><span style="color:var(--lime);font:700 15px var(--display)">${som(T)}</span></div><div class="sub" style="margin:6px 0 0">Mumkin natija: ${som(T * 0.25)} — ${som(T * 4)}</div>`;
    goB.disabled = busy || sel.length < 3;
    grid.innerHTML = items.length ? items.map((d) => CS.tile(d)).join("") : `<div class="sub" style="grid-column:1/-1">Inventar bo'sh — avval keys oching</div>`;
    grid.querySelectorAll(".sk").forEach((x) => { x.classList.toggle("sel", picked.has(x.dataset.id)); x.onclick = () => { if (busy) return; if (picked.has(x.dataset.id)) picked.delete(x.dataset.id); else if (picked.size < 10) picked.add(x.dataset.id); haptic(); paint(); }; });
  };
  goB.onclick = async () => {
    const sel = CS.inv.get().filter((d) => picked.has(d.id)); if (sel.length < 3 || busy) return; busy = true;
    const T = sel.reduce((a, d) => a + d.v, 0);
    const r = Math.random() < 0.8 ? 0.25 + Math.random() * 0.75 : Math.exp(Math.random() * Math.log(4));
    let a = 0, b = VARIANTS.length - 1; while (a < b) { const m = (a + b) >> 1; VARIANTS[m].v < T * r ? (a = m + 1) : (b = m); }
    const pool = VARIANTS.slice(Math.max(0, a - 4), a + 4), v = pick(pool);
    CS.inv.remove(sel.map((d) => d.id)); S.spend(T); Tasks.ev("contract");
    res.innerHTML = `<div class="skins">${sel.map((d) => CS.tile(d)).join("")}</div>`;
    const tiles = [...res.querySelectorAll(".sk")];
    if (!REDUCED) await Promise.all(tiles.map((t, k) => t.animate ? done(t.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.2) rotate(30deg)", opacity: 0 }], { duration: 650, delay: k * 70, fill: "forwards", easing: "cubic-bezier(.5,0,.75,0)" }), 650 + k * 70) : 0));
    if (!alive) return;
    const d = customDrop(v); CS.inv.add([d]); S.ret(d.v); S.drop(d); liveAdd(d, "Siz");
    res.innerHTML = `<div class="msg">${d.v >= T ? "Foydali kontrakt!" : "Kontrakt natijasi"} · <span style="color:var(--lime)">${som(d.v)}</span></div><div class="skins win-sk" style="grid-template-columns:1fr;max-width:200px;margin:0 auto">${CS.tile(d)}</div>`;
    if (d.v >= T * 1.5) Confetti.fire(100); haptic(d.v >= T ? "ok" : "medium");
    picked = new Set(); busy = false; paint();
  };
  paint();
  return () => (alive = false);
};

/* --- Ruletka --- */
PAGES["games/roulette"] = () => {
  gameHead("roulette");
  const COL = { g: ["#3a4054", 2, "Kulrang"], b: ["#3b82f6", 3, "Ko'k"], v: ["#8b6cff", 5, "Binafsha"], o: ["#ffc542", 50, "Oltin"] };
  const wheel = shuffle([...Array(24).fill("g"), ...Array(16).fill("b"), ...Array(9).fill("v"), "o"]);
  const hist = el("", "chips"); const strip = el(`<div class="rtrack"></div><div class="marker"></div>`, "rstrip");
  const track = strip.querySelector(".rtrack");
  let sel = "g", busy = false, alive = true, off = 0;
  const cells = []; for (let k = 0; k < 4; k++) cells.push(...wheel);
  track.innerHTML = cells.map((c) => `<span style="background:${COL[c][0]};color:${c === "o" ? "#3a2500" : "#fff"}">×${COL[c][1]}</span>`).join("");
  const opts = el(Object.entries(COL).map(([k, [c, m, n]]) => `<button data-c="${k}" style="background:${c};color:${k === "o" ? "#3a2500" : "#fff"}">${n}<small>×${m}</small></button>`).join(""), "ropts");
  const bp = betPanel(); const goB = el(`<button class="btn">Tikish</button>`).firstChild; const msg = el("", "msg");
  const paintSel = () => opts.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.c === sel));
  opts.querySelectorAll("button").forEach((b) => (b.onclick = () => { sel = b.dataset.c; haptic(); paintSel(); }));
  const H = store("bd_rhist") || []; const paintH = () => (hist.innerHTML = H.slice(-12).reverse().map((c) => `<button style="background:${COL[c][0]};color:#fff;border:0">×${COL[c][1]}</button>`).join(""));
  goB.onclick = async () => {
    if (busy) return; const b = bp.usd(); if (!pay(b)) return; busy = true; goB.disabled = true; Tasks.ev("roulette");
    const idx = rnd(0, 49), res = wheel[idx], step = 60, W = strip.clientWidth;
    const target = (100 + idx) * step + 27 - W / 2 + (Math.random() - 0.5) * 36;
    const an = track.animate ? track.animate([{ transform: `translateX(${-off}px)` }, { transform: `translateX(${-target}px)` }], { duration: REDUCED ? 300 : 4200, easing: "cubic-bezier(.1,.75,.1,1)", fill: "forwards" }) : null;
    if (an) await done(an, 4200);
    if (!alive) return;
    off = target - 100 * step + 0; // keyingi aylanish uchun boshlang'ich holat
    if (an) { an.cancel(); } track.style.transform = `translateX(${-off}px)`;
    H.push(res); store("bd_rhist", H.slice(-30)); paintH();
    if (res === sel) { const p = b * COL[res][1]; win(p); msg.innerHTML = `<span style="color:var(--green)">+${som(p)}</span>`; haptic("ok"); if (res !== "g") Confetti.fire(res === "o" ? 160 : 60); }
    else { msg.innerHTML = `<span style="color:var(--red)">Tushdi: ${COL[res][2]} ×${COL[res][1]}</span>`; haptic("bad"); }
    busy = false; goB.disabled = false;
  };
  paintSel(); paintH();
  return () => (alive = false);
};

/* --- Narvon --- */
PAGES["games/ladder"] = () => {
  gameHead("ladder");
  const STEPS = 10, MODES = { e: [3, 1, "Oson"], m: [2, 1, "O'rta"], h: [3, 2, "Qiyin"] }; // [yo'llar, sinadiganlar]
  let mode = "m", playing = false, step = 0, b = 0, alive = true;
  const seg = el(Object.entries(MODES).map(([k, v]) => `<button data-m="${k}">${v[2]}</button>`).join(""), "seg");
  const mult = (n) => { const [w, bad] = MODES[mode]; return +Math.pow(0.97 * w / (w - bad), n).toFixed(2); };
  const box = el("", "floors"); const msg = el("", "msg"); const bp = betPanel(); const goB = el(`<button class="btn">Boshlash</button>`).firstChild;
  let rows = [];
  const build = () => {
    const [w] = MODES[mode];
    box.innerHTML = Array.from({ length: STEPS }, (_, k) => `<div class="floor" style="--n:${w}" data-k="${k}"><div class="m">×${mult(k + 1)}</div>${Array.from({ length: w }, (_, j) => `<button class="cell" data-j="${j}">🪜</button>`).join("")}</div>`).join("");
    rows = [...box.children]; rows.forEach((r, k) => r.querySelectorAll(".cell").forEach((c) => (c.onclick = () => pickCell(k, +c.dataset.j, c))));
    paint();
  };
  const paint = () => { rows.forEach((r, k) => r.classList.toggle("act", playing && k === step)); seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.m === mode)); goB.textContent = playing ? (step ? `Olish · ${som(b * mult(step))}` : "O'yin davom etmoqda") : "Boshlash"; goB.className = playing && step ? "btn green" : "btn"; };
  const pickCell = (k, j, c) => {
    if (!playing || k !== step) return;
    const [w, bad] = MODES[mode], bads = shuffle([...Array(w).keys()]).slice(0, bad);
    const cells = rows[k].querySelectorAll(".cell");
    if (bads.includes(j)) { c.classList.add("bad"); c.textContent = "💥"; bads.forEach((x) => x !== j && (cells[x].textContent = "💥")); playing = false; haptic("bad"); shakeEl(box); msg.innerHTML = `<span style="color:var(--red)">Narvon sindi!</span>`; paint(); return; }
    c.classList.add("ok"); c.textContent = "🧗"; cells.forEach((x, q) => q !== j && (x.textContent = bads.includes(q) ? "💥" : "", x.classList.add("dim"))); haptic();
    step++; msg.textContent = `×${mult(step)}`;
    if (step === STEPS) cash(); else paint();
  };
  const cash = () => { if (!playing || !step) return; playing = false; const p = b * mult(step); win(p); msg.innerHTML = `<span style="color:var(--green)">+${som(p)}</span>`; haptic("ok"); if (mult(step) >= 5) Confetti.fire(80); paint(); };
  goB.onclick = () => { if (playing) return cash(); b = bp.usd(); if (!pay(b)) return; playing = true; step = 0; msg.textContent = "Pastdan boshlang"; build(); paint(); };
  seg.querySelectorAll("button").forEach((x) => (x.onclick = () => { if (playing) return; mode = x.dataset.m; build(); }));
  build();
  return () => (alive = false);
};

/* --- Crash --- */
PAGES["games/crash"] = () => {
  gameHead("crash");
  const W = Math.min(page.clientWidth, 560), H = 230, c = document.createElement("canvas"), dpr = devicePixelRatio || 1;
  c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; page.appendChild(c); const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
  const hist = el("", "chips"); const bp = betPanel(); const goB = el(`<button class="btn">Boshlash</button>`).firstChild; const msg = el("", "msg");
  let state = "idle", m = 1, crashAt = 1, b = 0, t = 0, pts = [], raf = 0, last = 0, alive = true;
  const H2 = store("bd_chist") || []; const paintH = () => (hist.innerHTML = H2.slice(-10).reverse().map((x) => `<button style="color:${x >= 2 ? "var(--green)" : "var(--red)"}">×${x.toFixed(2)}</button>`).join(""));
  const draw = () => {
    ctx.clearRect(0, 0, W, H); ctx.strokeStyle = "rgba(238,241,247,.06)"; for (let y = 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (pts.length) { const g = ctx.createLinearGradient(0, H, 0, 0); g.addColorStop(0, "rgba(196,255,61,0)"); g.addColorStop(1, state === "boom" ? "rgba(255,77,94,.35)" : "rgba(196,255,61,.3)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(pts[0][0], H); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(pts[pts.length - 1][0], H); ctx.fill();
      ctx.strokeStyle = state === "boom" ? "#ff4d5e" : "#c4ff3d"; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    ctx.fillStyle = state === "boom" ? "#ff4d5e" : "#eef1f7"; ctx.font = "700 38px Unbounded, sans-serif"; ctx.textAlign = "center"; ctx.fillText(`×${m.toFixed(2)}`, W / 2, 60);
  };
  const loop = (now) => {
    if (!alive || state !== "fly") return; const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; m = Math.exp(0.12 * t * (1 + t / 20));
    pts.push([12 + Math.min(W - 30, t * 38), H - 12 - Math.min(H - 80, Math.log(m) * 75)]);
    if (m >= crashAt) { m = crashAt; state = "boom"; draw(); H2.push(crashAt); store("bd_chist", H2.slice(-30)); paintH(); msg.innerHTML = `<span style="color:var(--red)">Qulab tushdi ×${crashAt.toFixed(2)}</span>`; haptic("bad"); shakeEl(c); goB.textContent = "Boshlash"; goB.className = "btn"; state = "idle"; return; }
    goB.textContent = `Olish · ${som(b * m)}`; draw(); raf = requestAnimationFrame(loop);
  };
  goB.onclick = () => {
    if (state === "fly") { state = "idle"; cancelAnimationFrame(raf); const p = b * m; win(p); H2.push(crashAt); store("bd_chist", H2.slice(-30)); paintH(); msg.innerHTML = `<span style="color:var(--green)">+${som(p)} (×${m.toFixed(2)})</span>`; haptic("ok"); if (m >= 5) Confetti.fire(80); goB.textContent = "Boshlash"; goB.className = "btn"; draw(); return; }
    b = bp.usd(); if (!pay(b)) return; Tasks.ev("crash");
    crashAt = Math.max(1, 0.96 / (1 - Math.random())); m = 1; t = 0; pts = []; state = "fly"; msg.textContent = ""; goB.className = "btn green"; last = performance.now(); raf = requestAnimationFrame(loop);
  };
  draw(); paintH();
  return () => { alive = false; cancelAnimationFrame(raf); };
};

/* --- G'ildirak --- */
PAGES["games/wheel"] = () => {
  gameHead("wheel");
  const SETS = { low: ["Past", [...Array(8).fill(1.2), ...Array(6).fill(1.5), ...Array(6).fill(0)]], mid: ["O'rta", [...Array(12).fill(0), 1.5, 1.5, 1.5, 2, 2, 3, 3, 5]], high: ["Yuqori", [...Array(19).fill(0), 19]] };
  let risk = "mid", segs, ang = 0, busy = false, raf = 0, alive = true;
  const seg = el(Object.entries(SETS).map(([k, v]) => `<button data-r="${k}">${v[0]}</button>`).join(""), "seg");
  const S2 = Math.min(page.clientWidth, 300), c = document.createElement("canvas"), dpr = devicePixelRatio || 1; c.width = S2 * dpr; c.height = S2 * dpr; c.style.width = c.style.height = S2 + "px"; c.style.background = "none"; page.appendChild(c); const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
  const bp = betPanel(); const goB = el(`<button class="btn">Aylantirish</button>`).firstChild; const msg = el("", "msg");
  const colOf = (x) => (x === 0 ? "#252a3a" : x < 1.6 ? "#3b82f6" : x < 2.5 ? "#8b6cff" : x < 4 ? "#ff8a3d" : x < 10 ? "#ffc542" : "#c4ff3d");
  const draw = () => {
    const r = S2 / 2 - 6, n = segs.length, a = (Math.PI * 2) / n; ctx.clearRect(0, 0, S2, S2);
    for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(S2 / 2, S2 / 2); ctx.arc(S2 / 2, S2 / 2, r, ang + i * a, ang + (i + 1) * a); ctx.fillStyle = colOf(segs[i]); ctx.fill(); ctx.strokeStyle = "#0b0d12"; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = "#0b0d12"; ctx.beginPath(); ctx.arc(S2 / 2, S2 / 2, r * 0.62, 0, 7); ctx.fill();
    ctx.fillStyle = "#eef1f7"; ctx.beginPath(); ctx.moveTo(S2 / 2 - 11, 0); ctx.lineTo(S2 / 2 + 11, 0); ctx.lineTo(S2 / 2, 22); ctx.fill();
    ctx.font = "700 13px Manrope"; ctx.textAlign = "center"; ctx.fillStyle = "#959cb3"; [...new Set(segs)].sort((x, y) => x - y).forEach((x, k, arr) => { ctx.fillStyle = colOf(x); ctx.fillText(`×${x}`, S2 / 2 + (k - (arr.length - 1) / 2) * 34, S2 / 2 + 5); });
  };
  const setRisk = (k) => { risk = k; segs = shuffle(SETS[k][1]); seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.r === k)); draw(); };
  seg.querySelectorAll("button").forEach((x) => (x.onclick = () => !busy && setRisk(x.dataset.r)));
  goB.onclick = () => {
    if (busy) return; const b = bp.usd(); if (!pay(b)) return; busy = true; goB.disabled = true;
    let v = 12 + Math.random() * 8, last = performance.now();
    const loop = (now) => {
      if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; ang += v * dt; v *= Math.pow(REDUCED ? 0.01 : 0.42, dt); draw();
      if (v > 0.12) { raf = requestAnimationFrame(loop); return; }
      const n = segs.length, a = (Math.PI * 2) / n, top = -Math.PI / 2, k = Math.floor((((top - ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / a), x = segs[k];
      const p = b * x; win(p); msg.innerHTML = x ? `<span style="color:var(--green)">×${x} · +${som(p)}</span>` : `<span style="color:var(--red)">×0</span>`; haptic(x >= 1 ? "ok" : "bad"); if (x >= 5) Confetti.fire(x >= 10 ? 160 : 80);
      busy = false; goB.disabled = false;
    };
    raf = requestAnimationFrame(loop);
  };
  setRisk("mid");
  return () => { alive = false; cancelAnimationFrame(raf); };
};

/* --- Minora --- */
PAGES["games/tower"] = () => {
  gameHead("tower");
  const FL = 8, COLS = 4, MODES = { e: [1, "Oson"], m: [2, "O'rta"], h: [3, "Qiyin"] };
  let mode = "e", playing = false, fl = 0, b = 0, bombs = [];
  const seg = el(Object.entries(MODES).map(([k, v]) => `<button data-m="${k}">${v[1]}</button>`).join(""), "seg");
  const mult = (n) => +Math.pow((0.97 * COLS) / (COLS - MODES[mode][0]), n).toFixed(2);
  const box = el("", "floors"); const msg = el("", "msg"); const bp = betPanel(); const goB = el(`<button class="btn">Boshlash</button>`).firstChild;
  let rows = [];
  const build = () => {
    box.innerHTML = Array.from({ length: FL }, (_, k) => `<div class="floor" style="--n:${COLS}"><div class="m">×${mult(k + 1)}</div>${Array.from({ length: COLS }, (_, j) => `<button class="cell" data-j="${j}"></button>`).join("")}</div>`).join("");
    rows = [...box.children]; rows.forEach((r, k) => r.querySelectorAll(".cell").forEach((c) => (c.onclick = () => tap(k, +c.dataset.j, c)))); paint();
  };
  const paint = () => { rows.forEach((r, k) => r.classList.toggle("act", playing && k === fl)); seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.m === mode)); goB.textContent = playing ? (fl ? `Olish · ${som(b * mult(fl))}` : "Birinchi qavatni tanlang") : "Boshlash"; goB.className = playing && fl ? "btn green" : "btn"; };
  const reveal = () => rows.forEach((r, k) => r.querySelectorAll(".cell").forEach((c, j) => { if (!c.textContent) c.textContent = bombs[k].includes(j) ? "💣" : "💎"; }));
  const tap = (k, j, c) => {
    if (!playing || k !== fl) return;
    if (bombs[k].includes(j)) { c.classList.add("bad"); c.textContent = "💥"; playing = false; haptic("bad"); shakeEl(box); reveal(); msg.innerHTML = `<span style="color:var(--red)">Bomba!</span>`; paint(); return; }
    c.classList.add("ok"); c.textContent = "💎"; haptic(); fl++; msg.textContent = `×${mult(fl)}`;
    if (fl === FL) cash(); else paint();
  };
  const cash = () => { if (!playing || !fl) return; playing = false; const p = b * mult(fl); win(p); reveal(); msg.innerHTML = `<span style="color:var(--green)">+${som(p)}</span>`; haptic("ok"); if (mult(fl) >= 5) Confetti.fire(90); paint(); };
  goB.onclick = () => { if (playing) return cash(); b = bp.usd(); if (!pay(b)) return; Tasks.ev("tower"); bombs = Array.from({ length: FL }, () => shuffle([0, 1, 2, 3]).slice(0, MODES[mode][0])); playing = true; fl = 0; msg.textContent = ""; build(); };
  seg.querySelectorAll("button").forEach((x) => (x.onclick = () => { if (playing) return; mode = x.dataset.m; build(); }));
  build();
};

/* --- Saper --- */
PAGES["games/sapper"] = () => {
  gameHead("sapper");
  const N = 25; let mines = 3, set = new Set(), open = new Set(), b = 0, playing = false;
  const seg = el([3, 5, 10, 20].map((k) => `<button data-m="${k}">💣 ${k}</button>`).join(""), "seg");
  const grid = el(Array.from({ length: N }, (_, i) => `<button class="cell" data-i="${i}"></button>`).join(""), "cells"); grid.style.gridTemplateColumns = "repeat(5,1fr)"; grid.style.maxWidth = "360px";
  const msg = el("", "msg"); const bp = betPanel(); const goB = el(`<button class="btn">Boshlash</button>`).firstChild;
  const mult = (k) => { let m = 1; for (let i = 0; i < k; i++) m *= (N - i) / (N - mines - i); return Math.floor(m * 0.97 * 100) / 100; };
  const cells = [...grid.children];
  const paint = (rev) => { cells.forEach((c, i) => { c.className = "cell" + (open.has(i) ? " ok" : rev && set.has(i) ? " bad" : ""); c.textContent = open.has(i) ? "💎" : rev && set.has(i) ? "💣" : ""; }); seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", +x.dataset.m === mines)); goB.textContent = playing ? (open.size ? `Olish · ${som(b * mult(open.size))}` : `Katak oching · keyingisi ×${mult(1)}`) : "Boshlash"; goB.className = playing && open.size ? "btn green" : "btn"; };
  const cash = () => { playing = false; const p = b * mult(open.size); win(p); msg.innerHTML = `<span style="color:var(--green)">+${som(p)} (×${mult(open.size)})</span>`; haptic("ok"); if (mult(open.size) >= 5) Confetti.fire(80); paint(true); };
  cells.forEach((c, i) => (c.onclick = () => {
    if (!playing || open.has(i)) return;
    if (set.has(i)) { playing = false; haptic("bad"); shakeEl(grid); paint(true); c.textContent = "💥"; msg.innerHTML = `<span style="color:var(--red)">Mina!</span>`; return; }
    open.add(i); haptic(); if (open.size === N - mines) return cash(); msg.textContent = `×${mult(open.size)} → keyingisi ×${mult(open.size + 1)}`; paint();
  }));
  seg.querySelectorAll("button").forEach((x) => (x.onclick = () => { if (playing) return; mines = +x.dataset.m; paint(); }));
  goB.onclick = () => { if (playing) { if (open.size) cash(); return; } b = bp.usd(); if (!pay(b)) return; set = new Set(shuffle([...Array(N).keys()]).slice(0, mines)); open = new Set(); playing = true; msg.textContent = ""; paint(); };
  paint();
};

/* =====================================================================
   BONUSLAR: Pass, Vazifalar, VIP, Boss jangi
   ===================================================================== */
PAGES.bonus = (tab = "pass") => {
  el(`<h2>Bonuslar</h2>`);
  const seg = el(`<button data-t="pass">Pass</button><button data-t="tasks">Vazifalar</button><button data-t="vip">VIP</button><button data-t="boss">Boss</button>`, "seg");
  const body = el("");
  seg.querySelectorAll("button").forEach((b) => { b.classList.toggle("on", b.dataset.t === tab); b.onclick = () => go("bonus", b.dataset.t); });
  const s = S.get();
  if (tab === "pass") {
    const L = Math.min(30, Math.floor(s.xp / 100)), into = s.xp % 100;
    body.innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font:700 18px var(--display)">${L}-daraja</b><span class="sub" style="margin:0">${s.xp} XP</span></div><div class="prog"><i style="width:${L >= 30 ? 100 : into}%"></i></div><div class="sub" style="margin:0">Har sarflangan ${som(1)} = 20 XP. Har 100 XP — yangi daraja va mukofot. Har 5-daraja ×3.</div></div>
      <div class="lvls">${Array.from({ length: 30 }, (_, k) => { const lv = k + 1, got = s.claimed.includes(lv), can = lv <= L && !got; return `<div class="lvl ${got ? "got" : can ? "can" : ""}" data-l="${lv}"><b>${lv}</b>${got ? "✓" : som(passReward(lv)).replace(" so'm", "")}</div>`; }).join("")}</div>`;
    body.querySelectorAll(".lvl.can").forEach((x) => (x.onclick = () => { const lv = +x.dataset.l, st = S.get(); if (st.claimed.includes(lv)) return; st.claimed.push(lv); S.save(st); CS.credit(passReward(lv)); Confetti.fire(50); toast(`+${som(passReward(lv))}`); go("bonus", "pass"); }));
  }
  if (tab === "tasks") {
    const t = Tasks.today();
    body.innerHTML = `<p class="sub">Har kuni yangilanadi. Bajaring va mukofotni oling.</p>` + Tasks.LIST.map((x) => { const c = Math.min(x.n, x.k === "spend" ? Math.floor(t.c[x.k] || 0) : t.c[x.k] || 0), ok = c >= x.n, got = t.got.includes(x.k); return `<div class="card task"><div class="tx">${x.k === "spend" ? `Jami ${som(10)} sarflang` : x.t}<div>${c}/${x.n} · mukofot ${som(x.r)}</div><div class="prog"><i style="width:${(c / x.n) * 100}%"></i></div></div><button class="btn ${got ? "ghost" : ""}" data-k="${x.k}" ${ok && !got ? "" : "disabled"}>${got ? "Olindi" : "Olish"}</button></div>`; }).join("");
    body.querySelectorAll("button[data-k]").forEach((b) => (b.onclick = () => { const tt = Tasks.today(), x = Tasks.LIST.find((y) => y.k === b.dataset.k); if (tt.got.includes(x.k)) return; tt.got.push(x.k); store("bd_tasks", tt); CS.credit(x.r); Confetti.fire(40); toast(`+${som(x.r)}`); go("bonus", "tasks"); }));
  }
  if (tab === "vip") {
    const k = vipOf(s.spent), nx = VIP[k + 1], cb = Math.max(0, s.cbSpent - s.cbRet) * VIP[k][2] / 100;
    body.innerHTML = `<div class="card center"><div class="sub" style="margin:0">Sizning darajangiz</div><div style="font:800 26px var(--display);color:var(--lime);margin:6px 0">${VIP[k][0]}</div><div class="sub">Keshbek: ${VIP[k][2]}% (yutqazishlardan qaytim)</div>${nx ? `<div class="prog"><i style="width:${Math.min(100, ((s.spent - VIP[k][1]) / (nx[1] - VIP[k][1])) * 100)}%"></i></div><div class="sub" style="margin:0">${nx[0]} gacha: ${som(nx[1] - s.spent)} sarflash kerak</div>` : ""}</div>
      <div class="card task"><div class="tx">Keshbek<div>Oxirgi olishdan beri sof yutqazish: ${som(Math.max(0, s.cbSpent - s.cbRet))}</div></div><button class="btn" id="cbB" ${cb >= 0.01 ? "" : "disabled"}>${som(cb)}</button></div>
      ${VIP.map((v, i) => `<div class="card task" style="${i === k ? "box-shadow:inset 0 0 0 2px var(--lime)" : ""}"><div class="tx">${v[0]}<div>${som(v[1])} dan · keshbek ${v[2]}%</div></div></div>`).join("")}`;
    const cbB = $("cbB"); if (cbB) cbB.onclick = () => { const st = S.get(); const amt = Math.max(0, st.cbSpent - st.cbRet) * VIP[k][2] / 100; if (amt < 0.01) return; st.cbSpent = 0; st.cbRet = 0; S.save(st); CS.credit(amt); Confetti.fire(60); toast(`Keshbek +${som(amt)}`); go("bonus", "vip"); };
  }
  if (tab === "boss") {
    const bo = Boss.today(), [ico, name] = Boss.who(), hp = Math.max(0, Boss.HP - bo.dmg), dead = hp <= 0;
    body.innerHTML = `<div class="card center"><div class="sub" style="margin:0">Bugungi boss</div><div style="font:700 20px var(--display);margin:4px 0">${name}</div><div class="boss" id="bossI">${dead ? "💀" : ico}</div><div class="hp"><i style="width:${(hp / Boss.HP) * 100}%"></i></div><div class="sub" style="margin:8px 0 0">${dead ? "Boss mag'lub etildi!" : `Jon: ${som(hp)} / ${som(Boss.HP)}. Har sarflangan so'm bossga zarba beradi — keys oching va o'ynang.`}</div></div>
      <button class="btn ${dead && !bo.claimed ? "" : "ghost"}" id="bossB" ${dead && !bo.claimed ? "" : "disabled"}>${bo.claimed ? "Mukofot olindi — ertaga yangi boss" : dead ? "Boss sandig'ini ochish" : "Boss hali tirik"}</button><div id="bossR"></div>`;
    if (!dead && !REDUCED) { const bi = $("bossI"); bi.onclick = () => { bi.classList.remove("hit"); void bi.offsetWidth; bi.classList.add("hit"); haptic(); }; }
    const bb = $("bossB"); bb.onclick = async () => {
      const b2 = Boss.today(); if (b2.claimed || Boss.HP - b2.dmg > 0) return; b2.claimed = true; store("bd_boss", b2);
      const c = CASES.find((x) => x.id === "tashkent"), d = c.gen(); CS.inv.add([d]); S.drop(d);
      const r = $("bossR"); r.innerHTML = "<div></div>"; await CS.spinStrip(r.firstChild, c.gen, d, 4200); liveAdd(d, "Siz"); Confetti.fire(140);
      r.insertAdjacentHTML("beforeend", `<div class="msg">Boss sandig'idan: <span style="color:var(--lime)">${som(d.v)}</span> — inventarda</div>`); bb.disabled = true; bb.textContent = "Mukofot olindi";
    };
  }
};

/* =====================================================================
   INVENTAR
   ===================================================================== */
PAGES.inv = () => {
  el(`<h2>Inventar</h2>`);
  const head = el("", "card"), sort = el(`<button data-s="v" class="on">Qimmat</button><button data-s="t">Yangi</button>`, "seg"), grid = el("", "skins");
  let by = "v";
  const paint = () => {
    const items = CS.inv.get(), total = items.reduce((a, d) => a + d.v, 0), s = S.get();
    items.sort((a, b) => (by === "v" ? b.v - a.v : b.id.localeCompare(a.id)));
    head.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div class="sub" style="margin:0">${items.length} ta skin</div><div style="font:700 20px var(--display);color:var(--lime)">${som(total)}</div></div><button class="btn green" style="width:auto;padding:11px 14px" ${items.length ? "" : "disabled"}>Hammasini sotish</button></div>
      <div class="sub" style="margin:10px 0 0">Jami sarflangan: ${som(s.spent)} · Eng qimmat tushum: ${s.best ? som(s.best.v) : "—"}</div>`;
    head.querySelector("button").onclick = () => { if (!items.length) return; CS.inv.set([]); CS.credit(total); toast(`+${som(total)}`); Confetti.fire(50); paint(); };
    grid.innerHTML = items.length ? items.map((d) => CS.tile(d, `<button class="sell">Sotish</button>`)).join("") : `<div class="sub" style="grid-column:1/-1;text-align:center;padding:30px 0">Inventar bo'sh. Keyslarni oching!</div>`;
    grid.querySelectorAll(".sk").forEach((x) => (x.querySelector(".sell").onclick = () => { const d = items.find((y) => y.id === x.dataset.id); CS.inv.remove([d.id]); CS.credit(d.v); floatText(x, "+" + som(d.v)); haptic(); paint(); }));
  };
  sort.querySelectorAll("button").forEach((b) => (b.onclick = () => { by = b.dataset.s; sort.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); paint(); }));
  paint();
};

/* ---------- Ishga tushirish ---------- */
page.innerHTML = `<div class="loader"><i></i>Skinlar va narxlar yuklanmoqda...</div>`;
CS.load().then((data) => {
  D = data; RATE = data.uzs || RATE; CS.setMoney(som);
  data.skins.forEach((s, i) => s[3].forEach((v, w) => v > 0 && VARIANTS.push({ i, w: s[3].length > 1 ? w : -1, st: false, v })));
  VARIANTS.sort((a, b) => a.v - b.v);
  CASES = buildCases();
  for (let k = 0; k < 10; k++) liveTick();
  setInterval(() => !document.hidden && liveTick(), 2600);
  const start = new URLSearchParams(location.search).get("p");
  go(PAGES[start] ? start : "cases");
}).catch(() => (page.innerHTML = `<div class="loader">Ma'lumot yuklanmadi. Internetni tekshirib, qayta oching.</div>`));
