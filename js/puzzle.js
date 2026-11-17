"use strict";
/* =====================================================================
   🧩 BOSHQOTIRMA VA STOL O'YINLARI (13 ta)
   ===================================================================== */

/* Katakli taxta yasash */
function makeBoard(api, n, cols, maxW = 360, fs = 24) {
  const b = api.el(Array.from({ length: n }, (_, i) => `<button class="cell" data-i="${i}" style="font-size:${fs}px"></button>`).join(""), "board");
  b.style.gridTemplateColumns = `repeat(${cols},1fr)`; b.style.maxWidth = maxW + "px";
  return [b, [...b.children]];
}

/* 1) XOTIRA ---------------------------------------------------------- */
G.add({
  id: "memory", ico: "🧠", nm: "Xotira", cat: "puzzle", max: 150, unit: " yurish", ds: "Juft kartalarni toping",
  start(stage, api) {
    const pool = shuffle(["🍉", "🍇", "🍒", "🥝", "🍍", "🥥", "🌶️", "🍋", "🍑", "🥕", "🍄", "🌽"]).slice(0, 8);
    const deck = shuffle([...pool, ...pool]);
    const box = api.el(deck.map((e, i) => `<div class="mc" data-i="${i}"><div class="f">?</div><div class="b">${e}</div></div>`).join(""), "mem");
    let open = [], moves = 0, done = 0, lock = false; const t0 = Date.now();
    const upd = () => api.score(`👣 ${moves} · ⏱ ${Math.floor((Date.now() - t0) / 1000)}s`);
    const tick = setInterval(upd, 500); upd();
    box.querySelectorAll(".mc").forEach((card) => (card.onclick = () => {
      if (lock || card.classList.contains("open") || card.classList.contains("done")) return;
      card.classList.add("open"); haptic(); open.push(card); if (open.length < 2) return;
      moves++; lock = true; upd(); const [a, b] = open;
      if (deck[a.dataset.i] === deck[b.dataset.i]) setTimeout(() => {
        a.classList.add("done"); b.classList.add("done"); open = []; lock = false; done++; haptic("ok");
        if (done === 8) { clearInterval(tick); const rec = api.best(moves, true); api.end({ icon: "🧠", title: rec ? "Yangi rekord!" : "Barakalla!", text: `Yurishlar: <b>${moves}</b>`, coins: 150 - (moves - 8) * 5 }); }
      }, 300);
      else setTimeout(() => { a.classList.remove("open"); b.classList.remove("open"); open = []; lock = false; }, 750);
    }));
    return () => clearInterval(tick);
  },
});

/* 2) X-O ------------------------------------------------------------- */
const XO_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function xoWinner(b) { for (const l of XO_LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { w: b[l[0]], l }; return b.every(Boolean) ? { w: "draw", l: [] } : null; }
function xoMinimax(b, me) {
  const r = xoWinner(b); if (r) return { s: r.w === "O" ? 10 : r.w === "X" ? -10 : 0 };
  let best = { s: me === "O" ? -99 : 99, i: -1 };
  b.forEach((v, i) => { if (v) return; b[i] = me; const s = xoMinimax(b, me === "O" ? "X" : "O").s; b[i] = ""; if (me === "O" ? s > best.s : s < best.s) best = { s, i }; });
  return best;
}
G.add({
  id: "xo", ico: "❌", nm: "X-O", cat: "puzzle", max: 80, ds: "Botni yeng! Oson: +30, Qiyin: +80",
  start(stage, api) {
    let diff = store("xo_diff") || "easy", b, over, timer;
    const seg = api.el(`<button data-d="easy">😊 Oson</button><button data-d="hard">😈 Qiyin</button>`, "seg");
    const msg = api.el("", "msg");
    const [box, cells] = makeBoard(api, 9, 3, 330, 46);
    const render = (hl = []) => cells.forEach((c, i) => { c.textContent = b[i] === "X" ? "✕" : b[i] === "O" ? "○" : ""; c.style.color = b[i] === "X" ? "#2fd4c7" : "#ff5a5f"; c.style.background = hl.includes(i) ? "rgba(46,204,113,.3)" : ""; });
    const reset = () => { b = Array(9).fill(""); over = false; clearTimeout(timer); msg.textContent = "Siz ✕ bilan o'ynaysiz"; render(); seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.d === diff)); };
    const finish = (r) => { over = true; render(r.l); const s = r.w === "X" ? 2 : r.w === "draw" ? 1 : 0;
      setTimeout(() => api.end({ icon: s === 2 ? "🎉" : s === 1 ? "🤝" : "🤖", title: s === 2 ? "Siz yutdingiz!" : s === 1 ? "Durang!" : "Bot yutdi", text: `Daraja: <b>${diff === "hard" ? "Qiyin" : "Oson"}</b>`, coins: s === 2 ? (diff === "hard" ? 80 : 30) : s === 1 ? 10 : 0 }), 500); };
    cells.forEach((c, i) => (c.onclick = () => {
      if (over || b[i]) return; b[i] = "X"; haptic(); render(); const r = xoWinner(b); if (r) return finish(r);
      msg.textContent = "🤖 O'ylayapti..."; over = true;
      timer = setTimeout(() => { over = false; const e = b.map((v, k) => (v ? -1 : k)).filter((k) => k >= 0); b[diff === "easy" && Math.random() < 0.55 ? pick(e) : xoMinimax(b.slice(), "O").i] = "O"; render(); msg.textContent = "Sizning navbatingiz"; const r2 = xoWinner(b); if (r2) finish(r2); }, 350);
    }));
    seg.querySelectorAll("button").forEach((x) => (x.onclick = () => { diff = x.dataset.d; store("xo_diff", diff); reset(); }));
    reset();
    return () => clearTimeout(timer);
  },
});

/* 3) 15 TOPISHMOQ ---------------------------------------------------- */
G.add({
  id: "slide", ico: "🔢", nm: "15 topishmoq", cat: "puzzle", max: 200, tag: "YANGI", unit: " yurish", ds: "Raqamlarni 1 dan 15 gacha tartiblang. Bo'sh joy yonidagi katakni bosing",
  start(stage, api) {
    const N = 4; let a = [...Array(15).keys()].map((x) => x + 1).concat(0), moves = 0;
    let e = 15; for (let k = 0; k < 300; k++) { const nb = [e - 1, e + 1, e - N, e + N].filter((j) => j >= 0 && j < 16 && !(Math.abs(j - e) === 1 && Math.floor(j / N) !== Math.floor(e / N))); const j = pick(nb); [a[e], a[j]] = [a[j], a[e]]; e = j; }
    const [box, cells] = makeBoard(api, 16, 4, 340, 26);
    const render = () => cells.forEach((c, i) => { c.textContent = a[i] || ""; c.style.background = a[i] ? (a[i] === i + 1 ? "rgba(46,204,113,.25)" : "") : "transparent"; });
    cells.forEach((c, i) => (c.onclick = () => {
      const z = a.indexOf(0); if (!((Math.abs(i - z) === 1 && Math.floor(i / N) === Math.floor(z / N)) || Math.abs(i - z) === N)) return;
      [a[i], a[z]] = [a[z], a[i]]; moves++; haptic(); render(); api.score(`👣 ${moves}`);
      if (a.slice(0, 15).every((v, k) => v === k + 1)) { const rec = api.best(moves, true); api.end({ icon: "🔢", title: rec ? "Yangi rekord!" : "Yechildi!", text: `Yurishlar: <b>${moves}</b>`, coins: Math.max(40, 200 - moves / 2) }); }
    }));
    render(); api.score("👣 0");
  },
});

/* 4) SUDOKU ---------------------------------------------------------- */
G.add({
  id: "sudoku", ico: "9️⃣", nm: "Sudoku", cat: "puzzle", max: 200, tag: "YANGI", ds: "Har qator, ustun va 3×3 blokda 1–9 bir martadan bo'lsin",
  start(stage, api) {
    const full = Array(81).fill(0);
    const ok = (g, i, v) => { const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3); for (let k = 0; k < 9; k++) if (g[r * 9 + k] === v || g[k * 9 + c] === v || g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === v) return false; return true; };
    const fill = (g, i = 0) => { if (i === 81) return true; for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) if (ok(g, i, v)) { g[i] = v; if (fill(g, i + 1)) return true; g[i] = 0; } return false; };
    fill(full);
    let diff = store("sud_diff") || 40;
    const seg = api.el(`<button data-d="34">Oson</button><button data-d="44">O'rta</button><button data-d="52">Qiyin</button>`, "seg");
    const holder = api.el(""); const pad = api.el(""); let grid, givens, sel = -1, mistakes = 0;
    const build = () => {
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", +x.dataset.d === diff));
      grid = full.slice(); shuffle([...Array(81).keys()]).slice(0, diff).forEach((i) => (grid[i] = 0)); givens = grid.map(Boolean); sel = -1; mistakes = 0;
      holder.innerHTML = `<div class="board" style="grid-template-columns:repeat(9,1fr);gap:2px;max-width:420px">${grid.map((v, i) => `<button class="cell" data-i="${i}" style="font-size:17px;border-radius:4px;${(Math.floor(i / 9) % 3 === 2 && i < 72) ? "margin-bottom:3px;" : ""}${(i % 9) % 3 === 2 && i % 9 < 8 ? "margin-right:3px;" : ""}"></button>`).join("")}</div>`;
      pad.innerHTML = `<div class="board" style="grid-template-columns:repeat(9,1fr);gap:4px;max-width:420px">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => `<button class="cell" data-v="${v}" style="font-size:18px;background:var(--firuza);color:var(--firuza-ink)">${v}</button>`).join("")}</div>`;
      holder.querySelectorAll("[data-i]").forEach((c) => (c.onclick = () => { sel = +c.dataset.i; paint(); }));
      pad.querySelectorAll("[data-v]").forEach((c) => (c.onclick = () => put(+c.dataset.v)));
      paint();
    };
    const paint = () => holder.querySelectorAll("[data-i]").forEach((c, i) => {
      c.textContent = grid[i] || ""; const same = sel >= 0 && (Math.floor(i / 9) === Math.floor(sel / 9) || i % 9 === sel % 9);
      c.style.background = i === sel ? "var(--accent)" : sel >= 0 && grid[sel] && grid[i] === grid[sel] ? "rgba(47,212,199,.3)" : same ? "rgba(127,127,127,.18)" : "";
      c.style.color = givens[i] ? "var(--text)" : "#2fd4c7"; c.style.fontWeight = givens[i] ? "800" : "600";
      api.score(`❌ ${mistakes}/3`);
    });
    const put = (v) => {
      if (sel < 0 || givens[sel]) return;
      if (full[sel] !== v) { mistakes++; haptic("bad"); api.toast("❌ Noto'g'ri"); paint(); if (mistakes >= 3) api.end({ icon: "9️⃣", title: "3 ta xato", text: "Qaytadan urinib ko'ring!", coins: 0 }); return; }
      grid[sel] = v; givens[sel] = true; haptic(); paint();
      if (grid.every((x, i) => x === full[i])) api.end({ icon: "9️⃣", title: "Sudoku yechildi!", text: `Xatolar: ${mistakes}`, coins: diff * 4 - mistakes * 20 });
    };
    seg.querySelectorAll("button").forEach((x) => (x.onclick = () => { diff = +x.dataset.d; store("sud_diff", diff); build(); }));
    build();
  },
});

/* 5) TO'RT QATOR ----------------------------------------------------- */
G.add({
  id: "four", ico: "🔴", nm: "To'rt qator", cat: "puzzle", max: 100, tag: "YANGI", ds: "Ustunni tanlab tosh tashlang. 4 ta ketma-ket qo'ygan yutadi",
  start(stage, api) {
    const R = 6, C = 7; let b = Array(R * C).fill(0), over = false;
    const msg = api.el("Siz 🔴, bot 🟡", "msg");
    const [box, cells] = makeBoard(api, R * C, C, 380, 28);
    const render = (win = []) => cells.forEach((c, i) => { c.textContent = b[i] === 1 ? "🔴" : b[i] === 2 ? "🟡" : ""; c.style.background = win.includes(i) ? "rgba(46,204,113,.35)" : ""; });
    const drop = (g, col, p) => { for (let r = R - 1; r >= 0; r--) if (!g[r * C + col]) { g[r * C + col] = p; return r * C + col; } return -1; };
    const win = (g, p) => { const d = [[0, 1], [1, 0], [1, 1], [1, -1]]; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const [dr, dc] of d) { const L = []; for (let k = 0; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= R || cc < 0 || cc >= C || g[rr * C + cc] !== p) break; L.push(rr * C + cc); } if (L.length === 4) return L; } return null; };
    const score = (g) => { let s = 0; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { let a = 0, h = 0; for (let k = 0; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= R || cc < 0 || cc >= C) { a = -9; break; } const v = g[rr * C + cc]; if (v === 2) a++; else if (v === 1) h++; } if (a >= 0) { if (h === 0) s += [0, 1, 5, 50, 1000][a]; if (a === 0) s -= [0, 1, 6, 60, 1000][h]; } } return s; };
    const mm = (g, depth, me) => {
      if (win(g, 2)) return 100000 + depth; if (win(g, 1)) return -100000 - depth; if (depth === 0 || g.every(Boolean)) return score(g);
      let best = me === 2 ? -Infinity : Infinity;
      for (const c of [3, 2, 4, 1, 5, 0, 6]) { const i = drop(g, c, me); if (i < 0) continue; const v = mm(g, depth - 1, me === 2 ? 1 : 2); g[i] = 0; best = me === 2 ? Math.max(best, v) : Math.min(best, v); }
      return best;
    };
    const botMove = () => { let best = -Infinity, bc = 3; for (const c of [3, 2, 4, 1, 5, 0, 6]) { const g = b.slice(); if (drop(g, c, 2) < 0) continue; const v = mm(g, 3, 1) + Math.random(); if (v > best) { best = v; bc = c; } } drop(b, bc, 2); };
    const check = () => { const w1 = win(b, 1), w2 = win(b, 2); if (w1 || w2 || b.every(Boolean)) { over = true; render(w1 || w2 || []); setTimeout(() => api.end(w1 ? { icon: "🎉", title: "Siz yutdingiz!", coins: 100 } : w2 ? { icon: "🤖", title: "Bot yutdi", coins: 0 } : { icon: "🤝", title: "Durang!", coins: 20 }), 600); return true; } return false; };
    cells.forEach((c, i) => (c.onclick = () => {
      if (over) return; if (drop(b, i % C, 1) < 0) return; haptic(); render(); if (check()) return;
      over = true; msg.textContent = "🤖 O'ylayapti..."; setTimeout(() => { botMove(); over = false; render(); msg.textContent = "Siz 🔴, bot 🟡"; check(); }, 250);
    }));
    render();
  },
});

/* 6) BESHTALIK (GOMOKU) ---------------------------------------------- */
G.add({
  id: "gomoku", ico: "⚫", nm: "Beshtalik", cat: "puzzle", max: 120, tag: "YANGI", ds: "10×10 taxtada 5 ta tosh ketma-ket qo'ying. Botga qarshi",
  start(stage, api) {
    const N = 10; let b = Array(N * N).fill(0), over = false;
    const [box, cells] = makeBoard(api, N * N, N, 420, 18); box.style.gap = "3px";
    const render = (w = []) => cells.forEach((c, i) => { c.textContent = b[i] === 1 ? "⚫" : b[i] === 2 ? "⚪" : ""; c.style.background = w.includes(i) ? "rgba(46,204,113,.4)" : ""; c.style.borderRadius = "6px"; });
    const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const line = (i, p) => { const r = Math.floor(i / N), c = i % N; for (const [dr, dc] of DIRS) { const L = [i]; for (const s of [1, -1]) for (let k = 1; k < 5; k++) { const rr = r + dr * k * s, cc = c + dc * k * s; if (rr < 0 || rr >= N || cc < 0 || cc >= N || b[rr * N + cc] !== p) break; L.push(rr * N + cc); } if (L.length >= 5) return L; } return null; };
    const val = (i, p) => { const r = Math.floor(i / N), c = i % N; let s = 0; for (const [dr, dc] of DIRS) { let cnt = 1, open = 0; for (const sg of [1, -1]) { let k = 1; for (; k < 5; k++) { const rr = r + dr * k * sg, cc = c + dc * k * sg; if (rr < 0 || rr >= N || cc < 0 || cc >= N) break; const v = b[rr * N + cc]; if (v === p) cnt++; else { if (v === 0) open++; break; } } } s += [0, 1, 10, 100, 2000, 100000][Math.min(cnt, 5)] * (open === 2 ? 2 : open === 1 ? 1 : cnt >= 5 ? 1 : 0.1); } return s; };
    const botMove = () => { let best = -1, bi = -1; b.forEach((v, i) => { if (v) return; const s = val(i, 2) * 1.1 + val(i, 1) + Math.random(); if (s > best) { best = s; bi = i; } }); return bi; };
    cells.forEach((c, i) => (c.onclick = () => {
      if (over || b[i]) return; b[i] = 1; haptic(); render(); let w = line(i, 1);
      if (w) { over = true; render(w); return setTimeout(() => api.end({ icon: "🎉", title: "Siz yutdingiz!", coins: 120 }), 500); }
      const j = botMove(); if (j < 0) { over = true; return api.end({ icon: "🤝", title: "Durang!", coins: 20 }); }
      b[j] = 2; render(); w = line(j, 2); if (w) { over = true; render(w); setTimeout(() => api.end({ icon: "🤖", title: "Bot yutdi", coins: 0 }), 500); }
    }));
    b[N * 4 + 4] = 2; render();
  },
});

/* 7) GUGURT CHO'PLARI (NIM) ------------------------------------------ */
G.add({
  id: "nim", ico: "🔥", nm: "Gugurt cho'plari", cat: "puzzle", max: 60, tag: "YANGI", ds: "Navbatma-navbat 1–3 ta cho'p oling. Oxirgi cho'pni olgan YUTQAZADI",
  start(stage, api) {
    let n = rnd(15, 21), turn = "me";
    const view = api.el("", "big"); view.style.fontSize = "26px"; view.style.lineHeight = "1.6";
    const msg = api.el("", "msg");
    const opts = api.el(`<button data-k="1">1 ta</button><button data-k="2">2 ta</button><button data-k="3">3 ta</button>`, "opts"); opts.style.gridTemplateColumns = "repeat(3,1fr)";
    const render = () => { view.textContent = "🥢".repeat(n); api.score(`🥢 ${n}`); };
    const take = (k, who) => { n -= k; render(); if (n <= 0) { const w = who === "bot"; api.end({ icon: w ? "🎉" : "🤖", title: w ? "Siz yutdingiz!" : "Bot yutdi", text: w ? "Oxirgi cho'pni bot oldi" : "Oxirgi cho'pni siz oldingiz", coins: w ? 60 : 0 }); return true; } return false; };
    opts.querySelectorAll("button").forEach((btn) => (btn.onclick = () => {
      const k = +btn.dataset.k; if (turn !== "me" || k > n) return; haptic(); if (take(k, "me")) return;
      turn = "bot"; msg.textContent = "🤖 O'ylayapti...";
      setTimeout(() => { let m = (n - 1) % 4; if (m === 0 || Math.random() < 0.25) m = rnd(1, Math.min(3, n)); msg.textContent = `🤖 Bot ${m} ta oldi`; if (!take(m, "bot")) turn = "me"; }, 700);
    }));
    render(); msg.textContent = "Siz boshlaysiz";
  },
});

/* 8) XANOY MINORASI -------------------------------------------------- */
G.add({
  id: "hanoi", ico: "🗼", nm: "Xanoy minorasi", cat: "puzzle", max: 120, tag: "YANGI", unit: " yurish", ds: "Barcha disklarni o'ng ustunga o'tkazing. Katta disk kichigi ustiga qo'yilmaydi",
  start(stage, api) {
    const D = 5; let pegs = [[5, 4, 3, 2, 1], [], []], sel = -1, moves = 0;
    const box = api.el("", "row"); box.style.alignItems = "flex-end";
    const render = () => {
      box.innerHTML = pegs.map((p, k) => `<div data-p="${k}" style="background:var(--card);border-radius:12px;height:210px;display:flex;flex-direction:column-reverse;align-items:center;padding:8px 0;gap:4px;cursor:pointer;${sel === k ? "outline:3px solid var(--accent)" : ""}">${p.map((d) => `<div style="height:22px;width:${20 + d * 15}%;border-radius:8px;background:hsl(${d * 60},70%,58%)"></div>`).join("")}</div>`).join("");
      box.querySelectorAll("[data-p]").forEach((el) => (el.onclick = () => click(+el.dataset.p)));
      api.score(`👣 ${moves} (min ${2 ** D - 1})`);
    };
    const click = (k) => {
      if (sel < 0) { if (pegs[k].length) { sel = k; haptic(); } }
      else { const d = pegs[sel][pegs[sel].length - 1], top = pegs[k][pegs[k].length - 1]; if (k !== sel && (!top || top > d)) { pegs[k].push(pegs[sel].pop()); moves++; haptic(); } else if (k !== sel) haptic("bad"); sel = -1; }
      render();
      if (pegs[2].length === D) { const rec = api.best(moves, true); api.end({ icon: "🗼", title: rec ? "Yangi rekord!" : "Minora ko'chirildi!", text: `Yurishlar: <b>${moves}</b> (eng kami ${2 ** D - 1})`, coins: Math.max(30, 120 - (moves - 31) * 3) }); }
    };
    render();
  },
});

/* 9) RAQAMLAR JADVALI ------------------------------------------------ */
G.add({
  id: "schulte", ico: "🔟", nm: "Raqamlar jadvali", cat: "puzzle", max: 120, tag: "YANGI", unit: " s", ds: "1 dan 25 gacha raqamlarni tartib bilan tez bosing",
  start(stage, api) {
    const nums = shuffle([...Array(25).keys()].map((x) => x + 1)); let next = 1, t0 = 0, tick;
    const [box, cells] = makeBoard(api, 25, 5, 360, 22);
    cells.forEach((c, i) => { c.textContent = nums[i]; c.onclick = () => {
      if (+c.textContent !== next) { haptic("bad"); return; }
      if (next === 1) { t0 = Date.now(); tick = setInterval(() => api.score(`⏱ ${((Date.now() - t0) / 1000).toFixed(1)} · ➡️ ${next}`), 100); }
      c.style.background = "rgba(46,204,113,.3)"; haptic(); next++;
      if (next > 25) { clearInterval(tick); const s = +((Date.now() - t0) / 1000).toFixed(1); const rec = api.best(s, true); api.end({ icon: "🔟", title: rec ? "Yangi rekord!" : "Tayyor!", text: `Vaqt: <b>${s} s</b>`, coins: Math.max(20, 150 - s * 3) }); }
    }; });
    api.score("➡️ 1");
    return () => clearInterval(tick);
  },
});

/* 10) RANG KETMA-KETLIGI --------------------------------------------- */
G.add({
  id: "simon", ico: "🚦", nm: "Rang ketma-ketligi", cat: "puzzle", max: 150, tag: "YANGI", unit: " qadam", ds: "Yonadigan ranglar ketma-ketligini eslab, qaytaring",
  start(stage, api) {
    const COLS = ["#e74c3c", "#3fd27c", "#3498db", "#f1c40f"]; let seq = [], pos = 0, busy = true, alive = true;
    const msg = api.el("Tayyorlaning...", "msg");
    const [box, cells] = makeBoard(api, 4, 2, 320, 20);
    cells.forEach((c, i) => { c.style.background = COLS[i]; c.style.opacity = 0.45; });
    const flash = async (i, ms = 380) => { cells[i].style.opacity = 1; haptic(); await sleep(ms); cells[i].style.opacity = 0.45; await sleep(140); };
    const play = async () => { busy = true; msg.textContent = "👀 Kuzating..."; seq.push(rnd(0, 3)); await sleep(500); for (const i of seq) { if (!alive) return; await flash(i, Math.max(220, 420 - seq.length * 15)); } pos = 0; busy = false; msg.textContent = "Endi siz!"; api.score(`🚦 ${seq.length - 1}`); };
    cells.forEach((c, i) => (c.onclick = async () => {
      if (busy) return; flash(i, 180);
      if (i !== seq[pos]) { busy = true; const s = seq.length - 1; const rec = api.best(s); return api.end({ icon: "🚦", title: rec ? "Yangi rekord!" : "Xato!", text: `Eslab qolingan qadamlar: <b>${s}</b>`, coins: s * 10 }); }
      pos++; if (pos === seq.length) { busy = true; msg.textContent = "✅ To'g'ri!"; await sleep(600); play(); }
    }));
    play();
    return () => (alive = false);
  },
});

/* 11) SUV SARALASH --------------------------------------------------- */
G.add({
  id: "water", ico: "🧪", nm: "Suv saralash", cat: "puzzle", max: 150, tag: "YANGI", ds: "Har bir idishda faqat bitta rang qolsin. Usti bir xil rangga quyiladi",
  start(stage, api) {
    const COL = ["#e74c3c", "#3fd27c", "#3498db", "#f1c40f", "#9b59b6"]; const K = 5, CAP = 4;
    let tubes, sel = -1, moves = 0;
    const deal = () => { // tasodifiy, lekin yechiladigan holat: yechilgan holatdan teskari yurishlar
      tubes = COL.slice(0, K).map((c) => Array(CAP).fill(c)).concat([[], []]);
      for (let s = 0; s < 400; s++) { const a = rnd(0, tubes.length - 1), b = rnd(0, tubes.length - 1); if (a === b || !tubes[a].length || tubes[b].length >= CAP) continue; tubes[b].push(tubes[a].pop()); }
      if (tubes.every((t) => !t.length || (t.length === CAP && t.every((x) => x === t[0])))) deal();
    };
    const box = api.el("", "row"); box.style.flexWrap = "wrap"; box.style.justifyContent = "center";
    const render = () => {
      box.innerHTML = tubes.map((t, k) => `<div data-t="${k}" style="flex:0 0 52px;height:${CAP * 34 + 14}px;border:3px solid ${sel === k ? "var(--accent)" : "rgba(170,179,214,.35)"};border-top:0;border-radius:0 0 22px 22px;display:flex;flex-direction:column-reverse;padding:4px;gap:2px;cursor:pointer;${sel === k ? "transform:translateY(-10px)" : ""}">${t.map((c) => `<div style="height:32px;border-radius:6px;background:${c}"></div>`).join("")}</div>`).join("");
      box.querySelectorAll("[data-t]").forEach((el) => (el.onclick = () => click(+el.dataset.t)));
      api.score(`👣 ${moves}`);
    };
    const click = (k) => {
      if (sel < 0) { if (tubes[k].length) sel = k; return render(); }
      const a = tubes[sel], b = tubes[k];
      if (k !== sel && b.length < CAP && (!b.length || b[b.length - 1] === a[a.length - 1])) { const c = a[a.length - 1]; while (a.length && a[a.length - 1] === c && b.length < CAP) b.push(a.pop()); moves++; haptic(); } else if (k !== sel) haptic("bad");
      sel = -1; render();
      if (tubes.every((t) => !t.length || (t.length === CAP && t.every((x) => x === t[0])))) api.end({ icon: "🧪", title: "Saralandi!", text: `Yurishlar: <b>${moves}</b>`, coins: Math.max(40, 150 - moves * 2) });
    };
    deal(); render();
  },
});

/* 12) SO'Z TOPISH (DOR) ---------------------------------------------- */
const UZ_WORDS = [["KITOB", "Bilim manbai"], ["MAKTAB", "O'quvchilar joyi"], ["OSMON", "Tepamizda, ko'k"], ["DARYO", "Oqar katta suv"], ["QALAM", "U bilan yozamiz"], ["KOMPYUTER", "Dasturchi quroli"], ["TELEFON", "Cho'ntakdagi aloqa"], ["SAMARQAND", "Registon shahri"], ["BUXORO", "Minorai Kalon shahri"], ["TOSHKENT", "Poytaxt"], ["TARVUZ", "Katta yashil meva"], ["QOVUN", "Shirin sariq meva"], ["SHAMOL", "Ko'rinmas, daraxtni tebratadi"], ["YULDUZ", "Kechasi miltillaydi"], ["KAPALAK", "Rangli qanotli"], ["BURGUT", "Qushlar shohi"], ["ARSLON", "Hayvonlar shohi"], ["FUTBOL", "Ommabop sport"], ["MASHINA", "To'rt g'ildirakli"], ["SAMOLYOT", "Osmonda uchadi"], ["KUTUBXONA", "Kitoblar uyi"], ["SHOKOLAD", "Jigarrang shirinlik"], ["MUZQAYMOQ", "Sovuq shirinlik"], ["KAMALAK", "Yetti rang"], ["TOSHBAQA", "Uyini ko'tarib yuradi"], ["OLMA", "Qizil yoki yashil meva"], ["QUYOSH", "Kunduzi charaqlaydi"], ["MUSIQA", "Quloq bilan tinglanadi"], ["DENGIZ", "Sho'r katta suv"], ["SHAXMAT", "Shoh va farzin o'yini"]];
G.add({
  id: "hangman", ico: "🔤", nm: "So'z topish", cat: "puzzle", max: 120, tag: "YANGI", ds: "Harflarni tanlab so'zni toping. 6 ta xato huquqi",
  start(stage, api) {
    const [word, hintTxt] = pick(UZ_WORDS); const got = new Set(), bad = new Set();
    const view = api.el("", "big"); view.style.letterSpacing = "6px"; view.style.fontSize = "30px";
    api.el(`💡 ${hintTxt}`, "sub center");
    const lives = api.el("", "msg");
    const AB = "ABCDEFGHIJKLMNOPQRSTUVXYZ";
    const [box, cells] = makeBoard(api, AB.length, 7, 420, 18);
    const render = () => { view.textContent = [...word].map((c) => (got.has(c) ? c : "_")).join(""); lives.textContent = "❤️".repeat(6 - bad.size) + "🖤".repeat(bad.size); };
    cells.forEach((c, i) => { c.textContent = AB[i]; c.onclick = () => {
      const L = AB[i]; if (got.has(L) || bad.has(L)) return;
      if (word.includes(L)) { got.add(L); c.style.background = "rgba(46,204,113,.4)"; haptic(); } else { bad.add(L); c.style.background = "rgba(255,94,108,.4)"; haptic("bad"); }
      render();
      if ([...word].every((x) => got.has(x))) api.end({ icon: "🎉", title: "Topdingiz!", text: `So'z: <b>${word}</b>`, coins: 40 + (6 - bad.size) * 13 });
      else if (bad.size >= 6) api.end({ icon: "💀", title: "Yutqazdingiz", text: `So'z: <b>${word}</b> edi`, coins: 0 });
    }; });
    render();
  },
});

/* 13) DENGIZ JANGI --------------------------------------------------- */
G.add({
  id: "sea", ico: "🚢", nm: "Dengiz jangi", cat: "puzzle", max: 150, tag: "YANGI", ds: "Botning 8×8 maydonidagi kemalarni toping. Bot ham sizni otadi!",
  start(stage, api) {
    const N = 8, SHIPS = [4, 3, 3, 2, 2];
    const place = () => { const g = Array(N * N).fill(0); for (const L of SHIPS) { for (let tries = 0; tries < 500; tries++) { const h = Math.random() < 0.5, r = rnd(0, h ? N - 1 : N - L), c = rnd(0, h ? N - L : N - 1), idx = [...Array(L).keys()].map((k) => (h ? r * N + c + k : (r + k) * N + c)); const near = idx.some((i) => { const rr = Math.floor(i / N), cc = i % N; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r2 = rr + dr, c2 = cc + dc; if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N && g[r2 * N + c2]) return true; } return false; }); if (!near) { idx.forEach((i) => (g[i] = 1)); break; } } } return g; };
    const enemy = place(), mine = place(), eShot = Array(N * N).fill(0), mShot = Array(N * N).fill(0);
    const total = SHIPS.reduce((a, b) => a + b, 0); let myHits = 0, botHits = 0, shots = 0, busy = false, botTargets = [];
    api.el("🎯 Botning maydoni", "sub center");
    const [eb, ec] = makeBoard(api, N * N, N, 360, 18); eb.style.gap = "3px";
    api.el("🛡 Sizning maydoningiz", "sub center").style.marginTop = "10px";
    const [mb, mc] = makeBoard(api, N * N, N, 240, 12); mb.style.gap = "2px";
    const render = () => {
      ec.forEach((c, i) => { c.textContent = eShot[i] ? (enemy[i] ? "💥" : "·") : ""; c.style.borderRadius = "5px"; });
      mc.forEach((c, i) => { c.textContent = mShot[i] ? (mine[i] ? "💥" : "·") : mine[i] ? "🟦" : ""; c.style.borderRadius = "4px"; });
      api.score(`💥 ${myHits}/${total} · 🛡 ${total - botHits}`);
    };
    const botFire = () => {
      let i; while (botTargets.length && mShot[botTargets[botTargets.length - 1]]) botTargets.pop();
      i = botTargets.length ? botTargets.pop() : pick([...Array(N * N).keys()].filter((k) => !mShot[k]));
      mShot[i] = 1; if (mine[i]) { botHits++; const r = Math.floor(i / N), c = i % N; [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dr, dc]) => { const r2 = r + dr, c2 = c + dc; if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N && !mShot[r2 * N + c2]) botTargets.push(r2 * N + c2); }); }
      render(); if (botHits >= total) api.end({ icon: "🤖", title: "Bot yutdi", text: `Siz ${myHits}/${total} urdingiz`, coins: myHits * 3 });
    };
    ec.forEach((c, i) => (c.onclick = () => {
      if (busy || eShot[i]) return; eShot[i] = 1; shots++;
      if (enemy[i]) { myHits++; haptic("ok"); } else haptic();
      render(); if (myHits >= total) return api.end({ icon: "🚢", title: "Siz yutdingiz!", text: `Otishlar: <b>${shots}</b>`, coins: Math.max(60, 150 - (shots - total) * 2) });
      if (!enemy[i]) { busy = true; setTimeout(() => { botFire(); busy = false; }, 400); }
    }));
    render();
  },
});
