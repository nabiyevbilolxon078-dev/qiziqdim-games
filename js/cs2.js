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
    return `<div class="sk" data-id="${d.id || ""}" style="--rc:${RC[s[1]]}">${d.st ? '<span class="st">ST™</span>' : ""}<img loading="lazy" src="${img(s[2], 160)}" alt=""><div class="w">${a}${d.w >= 0 ? " · " + WN[d.w] : ""}</div><div class="f">${b}</div><div class="pr">${usd(d.v)}</div>${extra}</div>`;
  }
  /* Inventar (brauzer xotirasida) */
  const inv = { get: () => store("cs2inv") || [], set: (a) => store("cs2inv", a), add(ds) { this.set(this.get().concat(ds)); }, remove(ids) { const s = new Set(ids); this.set(this.get().filter((d) => !s.has(d.id))); } };

  /* Gorizontal tasma: g'olib skin markazdagi chiziq ostida to'xtaydi */
  async function spinStrip(box, c, win, ms = 5600) {
    const N = 54, at = 46, fill = Array.from({ length: N }, (_, k) => (k === at ? win : roll(c)));
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
    const N = 30, at = 26, fill = Array.from({ length: N }, (_, k) => (k === at ? win : roll(c)));
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
  return { done, load, img, usd, cost, bal, pay, credit, roll, makeDrop, label, tile, inv, spinStrip, spinV, loader, freeBtn, RC, WN, get data() { return data; } };
})();

/* 1) KEYSLAR ---------------------------------------------------------- */
G.add({
  id: "cs_cases", ico: "📦", nm: "CS2 keyslar", cat: "cs2", tag: "HOT", ds: "Haqiqiy CS2 keyslari va bozor narxlari",
  start(stage, api) {
    let alive = true;
    const l = CS.loader(stage);
    CS.load().then((data) => {
      if (!alive) return; l.remove();
      const list = () => {
        stage.innerHTML = "";
        const paintFree = CS.freeBtn(stage, api);
        const search = api.el(`<input class="ans" placeholder="Keys qidirish" style="font:600 15px var(--font);text-align:left;padding:12px 14px;margin-bottom:10px">`).firstChild;
        const grid = api.el("", "cases");
        const draw = () => {
          const q = search.value.trim().toLowerCase();
          grid.innerHTML = data.cases.map((c, k) => (q && !c.n.toLowerCase().includes(q) ? "" : `<div class="case" data-k="${k}" style="--i:${Math.min(k, 12)}"><img loading="lazy" src="${CS.img(c.img)}" alt=""><div class="cn">${c.n}</div><div class="cp">${CS.usd(CS.cost(c))}</div></div>`)).join("");
          grid.querySelectorAll(".case").forEach((el) => (el.onclick = () => { haptic(); detail(data.cases[+el.dataset.k]); }));
        };
        search.oninput = draw; draw(); paintFree();
        api.el(`Narxlar: ${data.src}, ${data.updated}. Keys narxiga kalit ($${data.cases[0].k}) qo'shilgan.`, "cs-note");
      };
      const detail = (c) => {
        stage.innerHTML = ""; window.scrollTo(0, 0);
        let n = 1;
        const back = api.el(`<button class="btn ghost" style="padding:10px;margin-bottom:8px">← Barcha keyslar</button>`).firstChild; back.onclick = list;
        api.el(`<img src="${CS.img(c.img, 360)}" alt=""><h3>${c.n}</h3><div class="sub">${c.i.length} ta skin${c.r.length ? ` + ${c.r.length} ta ★ noyob buyum` : ""}</div>`, "case-hero");
        const cnt = api.el([1, 2, 3, 5].map((k) => `<button data-n="${k}" class="${k === 1 ? "on" : ""}">×${k}</button>`).join(""), "cnt");
        const go = api.el(`<button class="btn gold" style="font-size:17px"></button>`).firstChild;
        const strips = api.el(""), res = api.el("");
        const paintGo = () => (go.textContent = `Ochish · ${CS.usd(CS.cost(c) * n)}`);
        cnt.querySelectorAll("button").forEach((b) => (b.onclick = () => { n = +b.dataset.n; cnt.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); paintGo(); }));
        paintGo();
        api.el("Ichida nimalar bor", "sec-title");
        const items = c.i.map((i) => ({ i, r: data.skins[i][1] })).sort((a, b) => b.r - a.r);
        const minMax = (i) => { const s = data.skins[i], all = s[3].concat(s[4]).filter((x) => x > 0); return [Math.min(...all), Math.max(...all)]; };
        const rareTile = c.r.length ? `<div class="sk" style="--rc:${CS.RC[7]}"><img loading="lazy" src="${CS.img(data.skins[c.r[0]][2], 160)}" alt=""><div class="w">★ ${c.r.length} xil</div><div class="f">Noyob maxsus buyum</div><div class="pr">${CS.usd(Math.min(...c.r.map((i) => minMax(i)[0])))}+</div></div>` : "";
        api.el(rareTile + items.map(({ i }) => { const [lo, hi] = minMax(i); return CS.tile({ i, w: -1, st: false, v: lo }).replace(/<div class="pr">.*?<\/div>/, `<div class="pr">${CS.usd(lo)} – ${CS.usd(hi)}</div>`); }).join(""), "skins");
        let busy = false;
        go.onclick = async () => {
          if (busy) return; const total = CS.cost(c) * n;
          if (!CS.pay(total)) return; busy = true; go.disabled = true; cnt.style.pointerEvents = "none"; res.innerHTML = "";
          const drops = Array.from({ length: n }, () => CS.roll(c));
          CS.inv.add(drops); // darhol inventarga — sahifadan chiqsa ham yo'qolmaydi
          strips.innerHTML = drops.map(() => "<div></div>").join("");
          await Promise.all(drops.map((d, k) => CS.spinStrip(strips.children[k], c, d, 5600 + k * 350)));
          if (!alive) return;
          const sum = drops.reduce((a, d) => a + d.v, 0), best = drops.reduce((a, d) => (d.v > a.v ? d : a));
          const rarity = data.skins[best.i][1];
          haptic(sum >= total ? "ok" : "medium");
          if (rarity >= 5 || sum >= total * 3) api.confetti({ n: rarity === 7 ? 160 : 80, coins: true });
          res.innerHTML = `<div class="msg">${rarity === 7 ? "★ NOYOB BUYUM! ★" : sum >= total ? "Foydada!" : "Tushdi:"} <span style="color:var(--green)">${CS.usd(sum)}</span></div>`
            + `<div class="skins">${drops.map((d) => CS.tile(d)).join("")}</div>`
            + `<div class="row"><button class="btn ghost" data-a="keep">Inventarga</button><button class="btn good" data-a="sell">Sotish ${CS.usd(sum)}</button></div>`;
          res.querySelector('[data-a="sell"]').onclick = () => { CS.inv.remove(drops.map((d) => d.id)); CS.credit(sum); api.toast(`+${CS.usd(sum)}`); res.innerHTML = ""; strips.innerHTML = ""; };
          res.querySelector('[data-a="keep"]').onclick = () => { api.toast("Inventarga qo'shildi"); res.innerHTML = ""; strips.innerHTML = ""; };
          res.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
          busy = false; go.disabled = false; cnt.style.pointerEvents = "";
        };
      };
      list();
    }).catch(() => { l.innerHTML = "Ma'lumot yuklanmadi. Internetni tekshirib, qayta oching."; });
    return () => (alive = false);
  },
});

/* 2) KEYS JANGI ------------------------------------------------------- */
G.add({
  id: "cs_battle", ico: "⚔️", nm: "Keys jangi", cat: "cs2", tag: "HOT", ds: "Botlarga qarshi bir xil keyslarni oching — eng qimmatini olgan hammasini yutadi",
  start(stage, api) {
    let alive = true;
    const l = CS.loader(stage);
    CS.load().then((data) => {
      if (!alive) return; l.remove();
      let ci = 0, players = 2, rounds = 1;
      const setup = () => {
        stage.innerHTML = ""; CS.freeBtn(stage, api, setup);
        const sel = api.el(`<select class="ans" style="font:700 15px var(--font);text-align:left;padding:12px">${data.cases.map((c, k) => `<option value="${k}" ${k === ci ? "selected" : ""}>${c.n} — ${CS.usd(CS.cost(c))}</option>`).join("")}</select>`).firstChild;
        const pimg = api.el("", "case-hero");
        api.el("O'yinchilar", "sec-title");
        const ps = api.el(`<button data-p="2">1 vs 1</button><button data-p="3">1 vs 1 vs 1</button><button data-p="4">1 vs 3</button>`, "seg");
        api.el("Raundlar (keyslar soni)", "sec-title");
        const rs = api.el(`<button data-r="1">1</button><button data-r="2">2</button><button data-r="3">3</button>`, "seg");
        const go = api.el(`<button class="btn gold" style="margin-top:14px;font-size:17px"></button>`).firstChild;
        const paint = () => {
          const c = data.cases[ci]; pimg.innerHTML = `<img src="${CS.img(c.img, 300)}" alt="" style="width:44%">`;
          ps.querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.p === players));
          rs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.r === rounds));
          go.textContent = `Jangni boshlash · ${CS.usd(CS.cost(c) * rounds)}`;
        };
        sel.onchange = () => { ci = +sel.value; paint(); };
        ps.querySelectorAll("button").forEach((b) => (b.onclick = () => { players = +b.dataset.p; paint(); }));
        rs.querySelectorAll("button").forEach((b) => (b.onclick = () => { rounds = +b.dataset.r; paint(); }));
        go.onclick = () => { const c = data.cases[ci]; if (CS.pay(CS.cost(c) * rounds)) fight(c); };
        paint();
      };
      const fight = async (c) => {
        stage.innerHTML = ""; window.scrollTo(0, 0);
        const names = ["Siz", ...shuffle(["Jasur", "Dilshod", "Sardor", "Aziz", "Bekzod", "Shahzod", "Otabek", "Javohir"]).slice(0, players - 1).map((n) => "🤖 " + n)];
        const info = api.el(`${c.n} · ${rounds} raund`, "msg");
        const cols = api.el(names.map((n) => `<div class="bt-col"><div class="who">${n}</div><div class="sum">$0.00</div><div class="sp"></div><div class="bt-got"></div></div>`).join(""), "bt-cols");
        cols.style.gridTemplateColumns = `repeat(${players},1fr)`;
        const els = [...cols.children], sums = names.map(() => 0), got = names.map(() => []);
        for (let r = 0; r < rounds && alive; r++) {
          info.textContent = `${r + 1}-raund / ${rounds}`;
          const drops = names.map(() => CS.roll(c));
          await Promise.all(drops.map((d, k) => CS.spinV(els[k].querySelector(".sp"), c, d)));
          if (!alive) return;
          drops.forEach((d, k) => { sums[k] += d.v; got[k].push(d); els[k].querySelector(".sum").textContent = CS.usd(sums[k]); els[k].querySelector(".bt-got").insertAdjacentHTML("beforeend", `<img src="${CS.img(data.skins[d.i][2], 96)}" style="--rc:${CS.RC[data.skins[d.i][1]]}" alt="">`); api.float(els[k].querySelector(".sum"), "+" + CS.usd(d.v), "#3fd27c"); });
          haptic("medium"); await sleep(700);
        }
        if (!alive) return;
        const top = Math.max(...sums), winners = sums.map((s, k) => (s === top ? k : -1)).filter((k) => k >= 0), w = pick(winners);
        els[w].classList.add("win");
        const all = got.flat(), total = all.reduce((a, d) => a + d.v, 0);
        if (w === 0) { CS.inv.add(all); api.confetti({ n: 140, coins: true }); haptic("ok"); }
        else haptic("bad");
        const box = api.el(`<div class="msg">${w === 0 ? `🏆 Siz yutdingiz! ${all.length} ta skin (${CS.usd(total)}) inventarda` : `${names[w]} yutdi (${CS.usd(top)})`}</div><div class="row"><button class="btn ghost" data-a="new">Boshqa sozlama</button><button class="btn gold" data-a="again">Yana · ${CS.usd(CS.cost(c) * rounds)}</button></div>`);
        box.querySelector('[data-a="new"]').onclick = setup;
        box.querySelector('[data-a="again"]').onclick = () => { if (CS.pay(CS.cost(c) * rounds)) fight(c); };
        box.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
      };
      setup();
    }).catch(() => { l.innerHTML = "Ma'lumot yuklanmadi. Internetni tekshirib, qayta oching."; });
    return () => (alive = false);
  },
});

/* 3) APGREYD ---------------------------------------------------------- */
G.add({
  id: "cs_upgrade", ico: "⬆️", nm: "Apgreyd", cat: "cs2", tag: "HOT", ds: "Skin(lar)ingizni qimmatroq skinga almashtirishga urinib ko'ring",
  start(stage, api) {
    let alive = true, variants = null;
    const l = CS.loader(stage);
    CS.load().then((data) => {
      if (!alive) return; l.remove();
      // Barcha skin + eskirish variantlari, narx bo'yicha (StatTraksiz)
      variants = []; data.skins.forEach((s, i) => s[3].forEach((v, w) => v > 0 && variants.push({ i, w: s[3].length > 1 ? w : -1, st: false, v })));
      variants.sort((a, b) => a.v - b.v);
      let picked = new Set(), target = null, spinning = false, deg = 0;
      const R = 92, C = 2 * Math.PI * R;
      const slots = api.el(`<div class="up-slot" id="upFrom">Inventardan skin tanlang</div><div style="font-size:22px">→</div><div class="up-slot" id="upTo">Maqsad skinni tanlang</div>`, "up-slots");
      const ring = api.el(`<svg viewBox="0 0 210 210"><circle cx="105" cy="105" r="${R}" fill="none" stroke="var(--surface)" stroke-width="16"/><circle id="upArc" cx="105" cy="105" r="${R}" fill="none" stroke="var(--green)" stroke-width="16" stroke-dasharray="0 ${C}" stroke-linecap="round" style="transition:stroke-dasharray .4s var(--ease)"/></svg><div class="arrow" id="upArrow"><i></i></div><div class="pc" id="upPc">0%</div>`, "up-ring");
      const go = api.el(`<button class="btn gold" disabled>Apgreyd</button>`).firstChild;
      api.el("Sizning skinlaringiz", "sec-title");
      const mine = api.el("", "skins");
      api.el("Maqsad skin", "sec-title");
      const q = api.el(`<input class="ans" placeholder="Qidirish: AK-47, Karambit..." style="font:600 15px var(--font);text-align:left;padding:12px 14px;margin-bottom:8px">`).firstChild;
      const targets = api.el("", "skins");
      const value = () => CS.inv.get().filter((d) => picked.has(d.id)).reduce((a, d) => a + d.v, 0);
      const chance = () => (target && value() ? clamp((value() / target.v) * 0.92, 0, 0.8) : 0);
      const paint = () => {
        const items = CS.inv.get().sort((a, b) => b.v - a.v);
        mine.innerHTML = items.length ? items.map((d) => CS.tile(d)).join("") : `<div class="sub" style="grid-column:1/-1">Inventar bo'sh — avval keys oching</div>`;
        mine.querySelectorAll(".sk").forEach((el) => { el.classList.toggle("sel", picked.has(el.dataset.id)); el.onclick = () => { if (spinning) return; picked.has(el.dataset.id) ? picked.delete(el.dataset.id) : picked.add(el.dataset.id); haptic(); paint(); }; });
        const v = value();
        $("upFrom").innerHTML = v ? `<div><div style="font:700 20px var(--display);color:var(--green)">${CS.usd(v)}</div><div class="sub" style="margin:4px 0 0">${picked.size} ta skin</div></div>` : "Inventardan skin tanlang";
        $("upTo").innerHTML = target ? CS.tile(target) : "Maqsad skinni tanlang";
        const ch = chance(); $("upPc").textContent = Math.round(ch * 100) + "%";
        $("upArc").setAttribute("stroke-dasharray", `${ch * C} ${C}`);
        go.disabled = !(ch > 0) || spinning;
        // maqsadlar: qiymatdan qimmatroq, qidiruv bo'yicha
        const s = q.value.trim().toLowerCase(), min = Math.max(0.05, v * 1.1);
        const list = variants.filter((t) => t.v >= min && (!s || data.skins[t.i][0].toLowerCase().includes(s))).slice(0, 30);
        targets.innerHTML = list.map((t, k) => CS.tile({ ...t, id: "t" + k })).join("") || `<div class="sub" style="grid-column:1/-1">Mos skin topilmadi</div>`;
        targets.querySelectorAll(".sk").forEach((el, k) => { el.classList.toggle("sel", target && list[k].i === target.i && list[k].w === target.w); el.onclick = () => { if (spinning) return; target = list[k]; haptic(); paint(); }; });
      };
      q.oninput = paint;
      go.onclick = async () => {
        const ch = chance(); if (!ch || spinning) return; spinning = true; go.disabled = true;
        const win = Math.random() < ch, land = win ? Math.random() * ch * 360 : ch * 360 + Math.random() * (360 - ch * 360);
        const from = deg; deg = from + 360 * 4 + (((land - (from % 360)) % 360) + 360) % 360;
        const arrow = $("upArrow");
        if (arrow.animate && !REDUCED) { const an = arrow.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${deg}deg)` }], { duration: 3800, easing: "cubic-bezier(.12,.7,.1,1)", fill: "forwards" }); await CS.done(an, 3800); an.finish(); }
        else arrow.style.transform = `rotate(${deg}deg)`;
        if (!alive) return;
        const used = [...picked]; CS.inv.remove(used); picked = new Set();
        if (win) { const d = CS.makeDrop(target.i); Object.assign(d, { w: target.w, st: false, v: target.v }); CS.inv.add([d]); api.confetti({ n: 120, coins: true }); haptic("ok"); api.toast(`Apgreyd muvaffaqiyatli: ${CS.label(d)}`, 3000); }
        else { haptic("bad"); api.shake(8); api.toast("Omad kelmadi — skin(lar) yo'qoldi", 2600); }
        target = null; spinning = false; paint();
      };
      paint();
    }).catch(() => { l.innerHTML = "Ma'lumot yuklanmadi. Internetni tekshirib, qayta oching."; });
    return () => (alive = false);
  },
});

/* 4) INVENTAR --------------------------------------------------------- */
G.add({
  id: "cs_inventory", ico: "🎒", nm: "Inventar", cat: "cs2", ds: "Yutgan skinlaringiz. Haqiqiy bozor narxida soting",
  start(stage, api) {
    let alive = true;
    const l = CS.loader(stage);
    CS.load().then(() => {
      if (!alive) return; l.remove();
      const head = api.el("", "cs-top"), sort = api.el(`<button data-s="v">Qimmat</button><button data-s="t">Yangi</button>`, "seg"), grid = api.el("", "skins");
      let by = "v";
      const paint = () => {
        const items = CS.inv.get(); const total = items.reduce((a, d) => a + d.v, 0);
        items.sort((a, b) => (by === "v" ? b.v - a.v : b.id.localeCompare(a.id)));
        head.innerHTML = `<div><div class="sub" style="margin:0">${items.length} ta skin</div><div style="font:700 22px var(--display);color:var(--green)">${CS.usd(total)}</div></div><button class="btn good" style="width:auto;padding:11px 14px" ${items.length ? "" : "disabled"}>Hammasini sotish</button>`;
        head.querySelector("button").onclick = () => { if (!items.length) return; CS.inv.set([]); CS.credit(total); api.toast(`+${CS.usd(total)}`); api.confetti({ n: 60, coins: true }); paint(); };
        sort.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.s === by));
        grid.innerHTML = items.length ? items.map((d) => CS.tile(d, `<button class="sell">Sotish</button>`)).join("") : `<div class="sub" style="grid-column:1/-1;text-align:center;padding:30px 0">Inventar bo'sh. CS2 keyslarni oching!</div>`;
        grid.querySelectorAll(".sk").forEach((el) => (el.querySelector(".sell").onclick = () => { const d = items.find((x) => x.id === el.dataset.id); CS.inv.remove([d.id]); CS.credit(d.v); api.float(el, "+" + CS.usd(d.v), "#3fd27c"); haptic(); paint(); }));
      };
      sort.querySelectorAll("button").forEach((b) => (b.onclick = () => { by = b.dataset.s; paint(); }));
      paint();
    }).catch(() => { l.innerHTML = "Ma'lumot yuklanmadi. Internetni tekshirib, qayta oching."; });
    return () => (alive = false);
  },
});
