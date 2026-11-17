"use strict";
/* =====================================================================
   🎰 KAZINO (11 ta) — o'yin fishkalari bilan (haqiqiy pul emas)
   ===================================================================== */

/* Fishka summasini ko'rsatish: O'yin markazida fishka, Biloldropda so'm (window.CHIP_FMT) */
const chipFmt = (n) => (window.CHIP_FMT ? window.CHIP_FMT(n) : n);

/* Natija xabari: g'alaba/yutqazish */
function casMsg(el, win, bet, extra = "") {
  if (win > bet) {
    el.innerHTML = `Yutuq: <span style="color:var(--green)">+${chipFmt(win - bet)}</span> ${extra}`; haptic("ok");
    if (el.animate) el.animate([{ transform: "scale(.8)", opacity: 0 }, { transform: "scale(1.08)" }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" });
    if (win >= bet * 3) Confetti.fire(innerWidth / 2, innerHeight * 0.55, { n: win >= bet * 10 ? 140 : 60, coins: true });
  }
  else if (win === bet && win > 0) { el.innerHTML = `🤝 Qaytdi ${extra}`; }
  else { el.innerHTML = `😔 −${chipFmt(bet - win)} ${extra}`; haptic("bad"); }
  Chips.paint();
}
const SUITS = ["♠", "♥", "♦", "♣"], RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const newDeck = () => shuffle(SUITS.flatMap((s) => RANKS.map((r) => ({ r, s }))));
const cardHtml = (c, hidden) => hidden ? `<span class="pcard back">?</span>` : `<span class="pcard ${c.s === "♥" || c.s === "♦" ? "red" : ""}">${c.r}${c.s}</span>`;

/* 1) SLOT ------------------------------------------------------------ */
G.add({
  id: "slot", ico: "🎰", nm: "Slot", cat: "casino", tag: "HOT", ds: "3 ta bir xil = katta yutuq! 7️⃣7️⃣7️⃣ = ×50",
  start(stage, api) {
    const SYM = [["🍒", 30, 5], ["🍋", 25, 8], ["🍇", 20, 10], ["🔔", 12, 15], ["⭐", 8, 25], ["💎", 4, 35], ["7️⃣", 2, 50]];
    const total = SYM.reduce((a, s) => a + s[1], 0);
    const roll = () => { let r = Math.random() * total; for (const s of SYM) { if ((r -= s[1]) < 0) return s; } return SYM[0]; };
    const reels = api.el(`<div class="reel">🍒</div><div class="reel">🍋</div><div class="reel">🍇</div>`, "reels");
    const msg = api.el("Omad tilaymiz!", "msg"); const bet = api.bet();
    const btn = api.el(`<button class="btn" style="margin-top:12px;font-size:20px">🎰 AYLANTIRISH</button>`).firstChild;
    api.el(`<div class="sub center" style="margin-top:10px">${SYM.map((s) => `${s[0]}×${s[2]}`).join(" · ")}<br>Ikkita 🍒 = ×2</div>`);
    let spinning = false, alive = true;
    btn.onclick = async () => {
      if (spinning) return; const b = bet.get(); if (!Chips.take(b)) return; spinning = true; btn.disabled = true; msg.textContent = "...";
      const res = [roll(), roll(), roll()], els = [...reels.children];
      els.forEach((e) => { e.classList.remove("win"); e.classList.add("spin"); });
      for (let k = 0; k < 3; k++) {
        for (let t = 0; t < 8 + k * 5 && alive; t++) { els[k].textContent = pick(SYM)[0]; await sleep(55); }
        els[k].classList.remove("spin"); els[k].textContent = res[k][0]; haptic("medium");
        if (els[k].animate) els[k].animate([{ transform: "translateY(-14px)" }, { transform: "translateY(4px)" }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" });
      }
      let mult = 0; if (res[0][0] === res[1][0] && res[1][0] === res[2][0]) mult = res[0][2]; else if (res.filter((s) => s[0] === "🍒").length === 2) mult = 2;
      if (mult >= 5) els.forEach((e) => e.classList.add("win"));
      const win = b * mult; Chips.add(win); casMsg(msg, win, b, mult >= 25 ? "💥 JACKPOT!" : ""); bet.paint();
      spinning = false; btn.disabled = false;
    };
    return () => (alive = false);
  },
});

/* 2) RULETKA --------------------------------------------------------- */
G.add({
  id: "roulette", ico: "🎡", nm: "Ruletka", cat: "casino", tag: "HOT", ds: "Rang, juft/toq yoki aniq son. 0–36",
  start(stage, api) {
    const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const col = (n) => (n === 0 ? "#27ae60" : RED.has(n) ? "#e74c3c" : "#2d3436");
    const ball = api.el("?", "big"); Object.assign(ball.style, { width: "110px", height: "110px", borderRadius: "50%", margin: "10px auto", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card)", color: "#fff", border: "4px solid var(--gold)" });
    const msg = api.el("Tikish turini tanlang", "msg");
    const types = [["red", "🔴 Qizil ×2"], ["black", "⚫ Qora ×2"], ["even", "Juft ×2"], ["odd", "Toq ×2"], ["low", "1–18 ×2"], ["high", "19–36 ×2"], ["num", "🎯 Son ×36"]];
    const box = api.el(types.map(([k, n]) => `<button data-k="${k}" style="font-size:14px;padding:12px 4px">${n}</button>`).join(""), "opts"); box.style.gridTemplateColumns = "repeat(3,1fr)";
    const numIn = api.el(`<input class="ans" type="number" min="0" max="36" placeholder="Son (0–36)" style="margin-top:10px;display:none">`).firstChild;
    const bet = api.bet(); let busy = false, alive = true, sel = "red";
    const paintSel = () => { box.querySelectorAll("button").forEach((x) => (x.style.outline = x.dataset.k === sel ? "3px solid var(--accent)" : "")); numIn.style.display = sel === "num" ? "block" : "none"; };
    box.querySelectorAll("button").forEach((x) => (x.onclick = () => { sel = x.dataset.k; paintSel(); }));
    const spin = api.el(`<button class="btn" style="margin-top:12px;font-size:20px">🎡 AYLANTIRISH</button>`).firstChild;
    spin.onclick = async () => {
      if (busy) return; const num = +numIn.value; if (sel === "num" && (numIn.value === "" || num < 0 || num > 36)) return api.toast("0–36 oralig'ida son kiriting");
      const b = bet.get(); if (!Chips.take(b)) return; busy = true; spin.disabled = true;
      const res = rnd(0, 36);
      for (let t = 0; t < 22 && alive; t++) { const n = t === 21 ? res : rnd(0, 36); ball.textContent = n; ball.style.background = col(n); await sleep(40 + t * 9); }
      const winType = { red: RED.has(res), black: res > 0 && !RED.has(res), even: res > 0 && res % 2 === 0, odd: res % 2 === 1, low: res >= 1 && res <= 18, high: res >= 19, num: res === num }[sel];
      const win = winType ? b * (sel === "num" ? 36 : 2) : 0; Chips.add(win); casMsg(msg, win, b, `(${res})`); bet.paint(); busy = false; spin.disabled = false;
    };
    paintSel();
    return () => (alive = false);
  },
});

/* 3) 21 OCHKO -------------------------------------------------------- */
G.add({
  id: "blackjack", ico: "🃏", nm: "21 ochko", cat: "casino", tag: "HOT", ds: "21 ga yaqinroq bo'ling, lekin oshirmang. Diler 17 gacha oladi",
  start(stage, api) {
    const val = (h) => { let v = 0, a = 0; for (const c of h) { v += c.r === "A" ? 11 : ["J", "Q", "K"].includes(c.r) ? 10 : +c.r; if (c.r === "A") a++; } while (v > 21 && a--) v -= 10; return v; };
    const dl = api.el("", "center"); const dv = api.el("", "sub center");
    const pl = api.el("", "center"); pl.style.marginTop = "14px"; const pv = api.el("", "sub center");
    const msg = api.el("", "msg");
    const acts = api.el(`<button class="btn good" data-a="hit">➕ Karta</button><button class="btn bad" data-a="stand">✋ Yetarli</button><button class="btn ghost" data-a="dbl">×2</button>`, "row");
    const bet = api.bet(); const deal = api.el(`<button class="btn" style="margin-top:12px">🃏 TARQATISH</button>`).firstChild;
    let deck, P, D, b, playing = false;
    const show = (hide) => { dl.innerHTML = D.map((c, i) => cardHtml(c, hide && i === 1)).join(""); dv.textContent = `Diler: ${hide ? "?" : val(D)}`; pl.innerHTML = P.map((c) => cardHtml(c)).join(""); pv.textContent = `Siz: ${val(P)}`; };
    const setPlay = (on) => { playing = on; acts.style.display = on ? "flex" : "none"; deal.style.display = on ? "none" : "block"; };
    const finish = async () => {
      setPlay(false); show(false); const p = val(P);
      if (p <= 21) while (val(D) < 17) { D.push(deck.pop()); show(false); await sleep(450); }
      const d = val(D); let win = 0;
      if (p > 21) win = 0; else if (P.length === 2 && p === 21 && !(D.length === 2 && d === 21)) win = Math.floor(b * 2.5); else if (d > 21 || p > d) win = b * 2; else if (p === d) win = b;
      Chips.add(win); casMsg(msg, win, b, p > 21 ? "(oshib ketdi)" : `(${p} vs ${d})`); bet.paint();
    };
    acts.querySelector('[data-a="hit"]').onclick = () => { if (!playing) return; P.push(deck.pop()); haptic(); show(true); if (val(P) >= 21) finish(); };
    acts.querySelector('[data-a="stand"]').onclick = () => playing && finish();
    acts.querySelector('[data-a="dbl"]').onclick = () => { if (!playing || P.length !== 2 || !Chips.take(b)) return; b *= 2; P.push(deck.pop()); show(true); finish(); };
    deal.onclick = () => { b = bet.get(); if (!Chips.take(b)) return; deck = newDeck(); P = [deck.pop(), deck.pop()]; D = [deck.pop(), deck.pop()]; msg.textContent = ""; setPlay(true); show(true); if (val(P) === 21) finish(); };
    setPlay(false); dl.innerHTML = cardHtml(null, true) + cardHtml(null, true); pl.innerHTML = cardHtml(null, true) + cardHtml(null, true);
  },
});

/* 4) ZAR ------------------------------------------------------------- */
G.add({
  id: "dice", ico: "🎲", nm: "Zar", cat: "casino", ds: "Ikki zar yig'indisi 7 dan katta, kichik yoki aynan 7?",
  start(stage, api) {
    const F = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const view = api.el("⚀ ⚀", "big"); view.style.fontSize = "80px"; view.style.margin = "4px 0";
    const msg = api.el("Tanlang", "msg");
    const opts = api.el(`<button data-k="lo">⬇️ 2–6<br><small>×2.3</small></button><button data-k="seven">7️⃣ Aynan 7<br><small>×5</small></button><button data-k="hi">⬆️ 8–12<br><small>×2.3</small></button>`, "opts"); opts.style.gridTemplateColumns = "repeat(3,1fr)";
    const bet = api.bet(); let busy = false;
    opts.querySelectorAll("button").forEach((x) => (x.onclick = async () => {
      if (busy) return; const b = bet.get(); if (!Chips.take(b)) return; busy = true;
      const a = rnd(1, 6), c = rnd(1, 6); for (let t = 0; t < 10; t++) { view.textContent = `${pick(F)} ${pick(F)}`; await sleep(60); }
      view.textContent = `${F[a - 1]} ${F[c - 1]}`; const s = a + c, k = x.dataset.k;
      const win = (k === "lo" && s < 7) || (k === "hi" && s > 7) ? Math.floor(b * 2.3) : k === "seven" && s === 7 ? b * 5 : 0;
      Chips.add(win); casMsg(msg, win, b, `(${s})`); bet.paint(); busy = false;
    }));
  },
});

/* 5) RAKETA (CRASH) -------------------------------------------------- */
G.add({
  id: "crash", ico: "📈", nm: "Raketa", cat: "casino", tag: "HOT", ds: "Raketa uchgan sari koeffitsiyent oshadi. Portlashidan oldin oling!",
  start(stage, api) {
    const W = api.width(), H = 220; const { c, ctx } = api.canvas(W, H);
    const msg = api.el("Tikib, raketani uchiring", "msg"); const bet = api.bet();
    const btn = api.el(`<button class="btn" style="margin-top:12px;font-size:20px">🚀 UCHIRISH</button>`).firstChild;
    let state = "idle", m = 1, crashAt = 1, b = 0, pts = [], stop = null, t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H); ctx.strokeStyle = state === "boom" ? "#ff5a5f" : "#3fd27c"; ctx.lineWidth = 3; ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      const last = pts[pts.length - 1] || [10, H - 10]; ctx.font = "28px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(state === "boom" ? "💥" : "🚀", last[0], last[1]);
      ctx.fillStyle = state === "boom" ? "#ff5a5f" : "#fff"; ctx.font = "700 36px Unbounded, sans-serif"; ctx.fillText(`×${m.toFixed(2)}`, W / 2, 40);
    };
    btn.onclick = () => {
      if (state === "fly") { // pulni olish
        state = "idle"; stop && stop(); const win = Math.floor(b * m); Chips.add(win); casMsg(msg, win, b, `(×${m.toFixed(2)})`); bet.paint(); btn.textContent = "🚀 UCHIRISH"; btn.className = "btn"; return;
      }
      b = bet.get(); if (!Chips.take(b)) return;
      crashAt = Math.max(1, 0.96 / (1 - Math.random())); m = 1; t = 0; pts = []; state = "fly"; msg.textContent = "Uchmoqda..."; btn.textContent = "💰 OLISH"; btn.className = "btn good"; bet.paint();
      stop = api.loop((dt) => {
        t += dt; m = Math.pow(Math.E, 0.12 * t * (1 + t / 20));
        const x = 10 + Math.min(W - 40, t * 40), y = H - 10 - Math.min(H - 70, Math.log(m) * 70); pts.push([x, y]);
        btn.textContent = `💰 OLISH  ${chipFmt(Math.floor(b * m))}`;
        if (m >= crashAt) { m = crashAt; state = "boom"; draw(); casMsg(msg, 0, b, `(portladi ×${crashAt.toFixed(2)})`); btn.textContent = "🚀 UCHIRISH"; btn.className = "btn"; state = "idle"; return false; }
        draw();
      });
    };
    draw();
    return () => stop && stop();
  },
});

/* 6) OMAD G'ILDIRAGI ------------------------------------------------- */
G.add({
  id: "wheel", ico: "🎯", nm: "Omad g'ildiragi", cat: "casino", ds: "G'ildirakni aylantiring — ko'paytiruvchi tushadi",
  start(stage, api) {
    const SEG = [0, 1.5, 0, 2, 0.5, 0, 3, 0, 1.2, 0.5, 5, 0, 1.5, 0.2, 10, 0];
    const COL = ["#e74c3c", "#3498db", "#3fd27c", "#f1c40f", "#9b59b6", "#e67e22", "#1abc9c", "#e84393"];
    const S = Math.min(300, api.width()); const { c, ctx } = api.canvas(S, S);
    const msg = api.el("", "msg"); const bet = api.bet();
    const btn = api.el(`<button class="btn" style="margin-top:12px;font-size:20px">🎯 AYLANTIRISH</button>`).firstChild;
    let ang = 0, busy = false, stop = null; const n = SEG.length, arc = (Math.PI * 2) / n;
    const draw = () => {
      ctx.clearRect(0, 0, S, S); const r = S / 2 - 8;
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(S / 2, S / 2); ctx.arc(S / 2, S / 2, r, ang + i * arc, ang + (i + 1) * arc); ctx.fillStyle = SEG[i] === 0 ? "#2d3436" : COL[i % COL.length]; ctx.fill();
        ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(ang + (i + 0.5) * arc); ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "right"; ctx.fillText(SEG[i] === 0 ? "✗" : "×" + SEG[i], r - 10, 5); ctx.restore(); }
      ctx.fillStyle = "#f5c542"; ctx.beginPath(); ctx.moveTo(S / 2 - 12, 0); ctx.lineTo(S / 2 + 12, 0); ctx.lineTo(S / 2, 26); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(S / 2, S / 2, 16, 0, 7); ctx.fill();
    };
    btn.onclick = () => {
      if (busy) return; const b = bet.get(); if (!Chips.take(b)) return; busy = true;
      let v = 14 + Math.random() * 8;
      stop = api.loop((dt) => {
        ang += v * dt; v *= Math.pow(0.45, dt); draw();
        if (v < 0.15) {
          const top = -Math.PI / 2; let a = ((top - ang) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); const idx = Math.floor(a / arc);
          const win = Math.floor(b * SEG[idx]); Chips.add(win); casMsg(msg, win, b, `(×${SEG[idx]})`); bet.paint(); busy = false; return false;
        }
      });
    };
    draw();
    return () => stop && stop();
  },
});

/* 7) PLINKO ---------------------------------------------------------- */
G.add({
  id: "plinko", ico: "🔻", nm: "Plinko", cat: "casino", ds: "Sharni tashlang — qaysi katakka tushsa, shuncha ko'paytiriladi",
  start(stage, api) {
    const MULT = [10, 3, 1.5, 0.8, 0.4, 0.2, 0.4, 0.8, 1.5, 3, 10], ROWS = 10;
    const W = api.width(), H = 330; const { c, ctx } = api.canvas(W, H);
    const msg = api.el("", "msg"); const bet = api.bet();
    const btn = api.el(`<button class="btn" style="margin-top:12px;font-size:20px">🔻 TASHLASH</button>`).firstChild;
    let balls = [], stop = null; const gap = W / (MULT.length + 1), rowH = (H - 60) / (ROWS + 1);
    const pegX = (r, k) => W / 2 + (k - r / 2) * gap;
    const draw = () => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = "rgba(255,255,255,.55)";
      for (let r = 1; r <= ROWS; r++) for (let k = 0; k <= r; k++) { ctx.beginPath(); ctx.arc(pegX(r, k), 14 + r * rowH, 3, 0, 7); ctx.fill(); }
      MULT.forEach((m, i) => { const x = W / 2 + (i - (MULT.length - 1) / 2) * gap; ctx.fillStyle = m >= 3 ? "#e74c3c" : m >= 1 ? "#f39c12" : "#3d4466"; ctx.beginPath(); ctx.roundRect(x - gap / 2 + 2, H - 34, gap - 4, 26, 6); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText("×" + m, x, H - 17); });
      ctx.fillStyle = "#f5c542"; balls.forEach((b) => { ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, 7); ctx.fill(); });
    };
    const run = () => { if (stop) return; stop = api.loop((dt) => {
      balls.forEach((b) => {
        b.t += dt * 3.2; const row = Math.floor(b.t);
        if (row >= ROWS + 1) { if (!b.done) { b.done = true; const slot = b.path.reduce((a, x) => a + x, 0); const m = MULT[slot]; const win = Math.floor(b.bet * m); Chips.add(win); casMsg(msg, win, b.bet, `(×${m})`); bet.paint(); } return; }
        const k0 = b.path.slice(0, row).reduce((a, x) => a + x, 0), k1 = k0 + (b.path[row] || 0), f = b.t - row;
        const x0 = row === 0 ? W / 2 : pegX(row, k0), x1 = row === ROWS ? W / 2 + (k1 - (MULT.length - 1) / 2) * gap : pegX(row + 1, k1);
        b.x = x0 + (x1 - x0) * f; b.y = 14 + row * rowH + rowH * f - Math.sin(f * Math.PI) * 10;
      });
      balls = balls.filter((b) => !b.done); draw(); if (!balls.length) { stop = null; return false; }
    }); };
    btn.onclick = () => { const b = bet.get(); if (!Chips.take(b)) return; bet.paint(); balls.push({ x: W / 2, y: 0, t: 0, bet: b, path: Array.from({ length: ROWS }, () => (Math.random() < 0.5 ? 0 : 1)) }); run(); };
    draw();
    return () => stop && stop();
  },
});

/* 8) MINALAR --------------------------------------------------------- */
G.add({
  id: "mines", ico: "💣", nm: "Minalar", cat: "casino", tag: "HOT", ds: "Olmoslarni oching, minaga duch kelmang. Istalgan payt pulni oling",
  start(stage, api) {
    const N = 25; let minesN = 3, mines, opened, b = 0, playing = false;
    const seg = api.el([1, 3, 5, 10].map((k) => `<button data-m="${k}">💣 ${k}</button>`).join(""), "seg");
    const [box, cells] = makeBoard(api, N, 5, 340, 26);
    const msg = api.el("", "msg"); const bet = api.bet();
    const btn = api.el(`<button class="btn" style="margin-top:12px;font-size:18px">▶️ BOSHLASH</button>`).firstChild;
    const mult = (k) => { let m = 1; for (let i = 0; i < k; i++) m *= (N - i) / (N - minesN - i); return Math.floor(m * 0.97 * 100) / 100; };
    const paint = (reveal) => cells.forEach((c, i) => { c.textContent = opened.has(i) ? "💎" : reveal && mines.has(i) ? "💣" : ""; c.style.background = opened.has(i) ? "rgba(46,204,113,.3)" : reveal && mines.has(i) ? "rgba(255,94,108,.35)" : ""; });
    const segPaint = () => seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", +x.dataset.m === minesN));
    seg.querySelectorAll("button").forEach((x) => (x.onclick = () => { if (playing) return; minesN = +x.dataset.m; segPaint(); }));
    const cashout = () => { playing = false; const win = Math.floor(b * mult(opened.size)); Chips.add(win); casMsg(msg, win, b, `(×${mult(opened.size)})`); paint(true); bet.paint(); btn.textContent = "▶️ BOSHLASH"; btn.className = "btn"; };
    btn.onclick = () => {
      if (playing) { if (opened.size) cashout(); return; }
      b = bet.get(); if (!Chips.take(b)) return; bet.paint();
      mines = new Set(shuffle([...Array(N).keys()]).slice(0, minesN)); opened = new Set(); playing = true; paint(false);
      msg.textContent = `Keyingi: ×${mult(1)}`; btn.textContent = "💰 OLISH"; btn.className = "btn good";
    };
    cells.forEach((c, i) => (c.onclick = () => {
      if (!playing || opened.has(i)) return;
      if (mines.has(i)) { playing = false; haptic("heavy"); paint(true); c.textContent = "💥"; casMsg(msg, 0, b); btn.textContent = "▶️ BOSHLASH"; btn.className = "btn"; return; }
      opened.add(i); haptic(); paint(false);
      if (opened.size === N - minesN) return cashout();
      msg.textContent = `Hozir: ×${mult(opened.size)} → keyingi: ×${mult(opened.size + 1)}`; btn.textContent = `💰 OLISH ${chipFmt(Math.floor(b * mult(opened.size)))}`;
    }));
    opened = new Set(); mines = new Set(); segPaint(); paint(false);
  },
});

/* 9) KATTAMI-KICHIKMI (KARTA) ---------------------------------------- */
G.add({
  id: "hilo", ico: "🂠", nm: "Kattami-kichikmi", cat: "casino", ds: "Keyingi karta kattaroqmi yoki kichikroq? Har to'g'ri javob ko'paytiradi",
  start(stage, api) {
    const v = (c) => RANKS.indexOf(c.r);
    const view = api.el("", "center"); view.style.transform = "scale(1.4)"; view.style.margin = "26px 0";
    const msg = api.el("", "msg");
    const acts = api.el(`<button class="btn good" data-a="hi">⬆️ Katta</button><button class="btn bad" data-a="lo">⬇️ Kichik</button>`, "row");
    const bet = api.bet(); const btn = api.el(`<button class="btn" style="margin-top:12px">▶️ BOSHLASH</button>`).firstChild;
    let deck, cur, m = 1, b = 0, playing = false;
    const odds = (up) => { const k = v(cur); const n = up ? 12 - k : k; return n <= 0 ? 0 : Math.round((0.95 * 13 / n) * 100) / 100; };
    const ui = () => { view.innerHTML = cardHtml(cur); acts.style.display = playing ? "flex" : "none"; acts.querySelector('[data-a="hi"]').textContent = `⬆️ Katta ×${odds(true)}`; acts.querySelector('[data-a="lo"]').textContent = `⬇️ Kichik ×${odds(false)}`; btn.textContent = playing ? `💰 OLISH ${chipFmt(Math.floor(b * m))}` : "▶️ BOSHLASH"; btn.className = playing ? "btn good" : "btn"; };
    const guess = (up) => {
      if (!playing) return; const o = odds(up); if (!o) return api.toast("Bu tomonga imkon yo'q");
      const nx = deck.pop(); const ok = up ? v(nx) > v(cur) : v(nx) < v(cur); cur = nx;
      if (ok) { m *= o; haptic(); msg.textContent = `✅ ×${m.toFixed(2)}`; } else { playing = false; casMsg(msg, 0, b, "(teng yoki noto'g'ri)"); }
      if (deck.length < 5) deck = newDeck(); ui();
    };
    acts.querySelector('[data-a="hi"]').onclick = () => guess(true); acts.querySelector('[data-a="lo"]').onclick = () => guess(false);
    btn.onclick = () => {
      if (playing) { playing = false; const win = Math.floor(b * m); Chips.add(win); casMsg(msg, win, b, `(×${m.toFixed(2)})`); bet.paint(); return ui(); }
      b = bet.get(); if (!Chips.take(b)) return; bet.paint(); deck = newDeck(); cur = deck.pop(); m = 1; playing = true; msg.textContent = "Taxmin qiling"; ui();
    };
    deck = newDeck(); cur = deck.pop(); ui();
  },
});

/* 10) TANGA ---------------------------------------------------------- */
G.add({
  id: "coinflip", ico: "🪙", nm: "Tanga", cat: "casino", ds: "Gerb yoki raqam? ×1.95",
  start(stage, api) {
    const coin = api.el("🪙", "big"); coin.style.fontSize = "100px"; coin.style.transition = "transform .6s";
    const msg = api.el("Tanlang", "msg");
    const opts = api.el(`<button data-k="g">🦅 Gerb</button><button data-k="r">🔢 Raqam</button>`, "opts");
    const bet = api.bet(); let busy = false, spins = 0;
    opts.querySelectorAll("button").forEach((x) => (x.onclick = async () => {
      if (busy) return; const b = bet.get(); if (!Chips.take(b)) return; busy = true;
      const res = Math.random() < 0.5 ? "g" : "r"; spins += 5; coin.style.transform = `rotateY(${spins * 180}deg)`; await sleep(650);
      coin.textContent = res === "g" ? "🦅" : "🔢"; const win = x.dataset.k === res ? Math.floor(b * 1.95) : 0;
      Chips.add(win); casMsg(msg, win, b, res === "g" ? "(Gerb)" : "(Raqam)"); bet.paint(); busy = false;
    }));
  },
});

/* 11) LOTEREYA BILETI ------------------------------------------------ */
G.add({
  id: "scratch", ico: "🎟️", nm: "Lotereya bileti", cat: "casino", ds: "9 ta katakni oching. 3 ta bir xil belgi = yutuq",
  start(stage, api) {
    const PRZ = [["💰", 20], ["💎", 10], ["⭐", 5], ["🍀", 3], ["🍒", 2], ["🔔", 1]];
    const [box, cells] = makeBoard(api, 9, 3, 300, 40);
    const msg = api.el("", "msg"); const bet = api.bet();
    const btn = api.el(`<button class="btn" style="margin-top:12px">🎟️ BILET OLISH</button>`).firstChild;
    let ticket = null, open = 0, b = 0;
    const make = () => {
      const r = Math.random(); let win = null;
      if (r < 0.02) win = "💰"; else if (r < 0.05) win = "💎"; else if (r < 0.11) win = "⭐"; else if (r < 0.2) win = "🍀"; else if (r < 0.33) win = "🍒"; else if (r < 0.5) win = "🔔";
      const t = []; if (win) t.push(win, win, win);
      const others = PRZ.map((p) => p[0]).filter((s) => s !== win); const cnt = {};
      while (t.length < 9) { const s = pick(others); if ((cnt[s] || 0) < 2) { cnt[s] = (cnt[s] || 0) + 1; t.push(s); } }
      return { cells: shuffle(t), win };
    };
    const reset = () => cells.forEach((c) => { c.textContent = "❔"; c.style.background = "linear-gradient(135deg,#b2bec3,#636e72)"; });
    cells.forEach((c, i) => (c.onclick = () => {
      if (!ticket || c.dataset.o === "1") return; c.dataset.o = "1"; c.textContent = ticket.cells[i]; c.style.background = ""; open++; haptic();
      if (open === 9) { const m = ticket.win ? PRZ.find((p) => p[0] === ticket.win)[1] : 0; const win = b * m; Chips.add(win); casMsg(msg, win, b, ticket.win ? `(${ticket.win} ×${m})` : ""); bet.paint(); ticket = null; btn.disabled = false; }
    }));
    btn.onclick = () => { b = bet.get(); if (!Chips.take(b)) return; bet.paint(); ticket = make(); open = 0; cells.forEach((c) => (c.dataset.o = "0")); reset(); msg.textContent = "Barcha kataklarni oching!"; btn.disabled = true; };
    api.el(`<div class="sub center" style="margin-top:8px">${PRZ.map((p) => `${p[0]}×${p[1]}`).join(" · ")}</div>`);
    reset();
  },
});
