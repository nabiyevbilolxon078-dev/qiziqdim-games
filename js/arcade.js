"use strict";
/* =====================================================================
   🕹 ARKADA O'YINLARI (14 ta)
   ===================================================================== */

/* Kanvas o'lchami: ekran kengligi va balandligiga moslashadi */
function arenaSize(api, ratio = 1.35) {
  const W = api.width();
  const H = Math.max(320, Math.min(Math.round(W * ratio), window.innerHeight - 130));
  return [W, H];
}
const hint = (api, text) => api.el(text, "sub center").style.marginTop = "10px";

/* 1) ILON ------------------------------------------------------------ */
G.add({
  id: "snake", ico: "🐍", nm: "Ilon", cat: "arcade", max: 300, ds: "Olmalarni yeng, devor va dumga urilmang",
  start(stage, api) {
    const N = 18, size = Math.floor(api.width() / N) * N, cell = size / N;
    const { c, ctx } = api.canvas(size, size);
    const pad = api.el(`<span></span><button data-d="0,-1">▲</button><span></span><button data-d="-1,0">◀</button><button data-d="0,1">▼</button><button data-d="1,0">▶</button>`, "dpad");
    let snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }], dir = { x: 1, y: 0 }, queue = [], food, score = 0, speed = 150, timer;
    const placeFood = () => { do food = { x: rnd(0, N - 1), y: rnd(0, N - 1) }; while (snake.some((s) => s.x === food.x && s.y === food.y)); };
    const turn = (x, y) => { const l = queue.length ? queue[queue.length - 1] : dir; if ((l.x === -x && l.y === -y) || (l.x === x && l.y === y)) return; if (queue.length < 3) queue.push({ x, y }); };
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "rgba(127,127,127,.07)";
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if ((i + j) % 2) ctx.fillRect(i * cell, j * cell, cell, cell);
      ctx.font = `${cell * 0.9}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🍎", food.x * cell + cell / 2, food.y * cell + cell / 2 + 1);
      snake.forEach((s, i) => { ctx.fillStyle = i === 0 ? "#2ecc71" : `hsl(145,60%,${45 - Math.min(i, 20)}%)`; ctx.beginPath(); ctx.roundRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2, cell * 0.3); ctx.fill(); });
    };
    const step = () => {
      if (queue.length) dir = queue.shift();
      const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some((s) => s.x === h.x && s.y === h.y)) {
        clearInterval(timer); const rec = api.best(score);
        return api.end({ icon: "🐍", title: rec && score ? "Yangi rekord!" : "O'yin tugadi", text: `Olmalar: <b>${score}</b>`, coins: score * 5 });
      }
      snake.unshift(h);
      if (h.x === food.x && h.y === food.y) { score++; api.score(`🍎 ${score}`); haptic(); placeFood(); speed = Math.max(70, 150 - score * 3); clearInterval(timer); timer = setInterval(step, speed); }
      else snake.pop();
      draw();
    };
    pad.querySelectorAll("button").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); haptic(); turn(...b.dataset.d.split(",").map(Number)); }));
    let sx = 0, sy = 0;
    c.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    c.addEventListener("touchmove", (e) => { const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return; Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy)); sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    const unk = api.keys({ ArrowUp: () => turn(0, -1), ArrowDown: () => turn(0, 1), ArrowLeft: () => turn(-1, 0), ArrowRight: () => turn(1, 0) });
    placeFood(); api.score("🍎 0"); draw(); timer = setInterval(step, speed);
    return () => { clearInterval(timer); unk(); };
  },
});

/* 2) KOSMIK QOCHISH -------------------------------------------------- */
G.add({
  id: "dodge", ico: "🚀", nm: "Kosmik qochish", cat: "arcade", max: 300, ds: "Barmoq bilan suring: asteroidlardan qoching, ⭐ yig'ing",
  start(stage, api) {
    const [W, H] = arenaSize(api);
    const { c, ctx } = api.canvas(W, H);
    const ship = { x: W / 2, y: H - 46, r: 16 }; let rocks = [], stars = [], bg = [], t = 0, score = 0, bonus = 0, tx = W / 2, keys = {};
    for (let i = 0; i < 50; i++) bg.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.6 + 0.3 });
    api.pointer(c, (x) => (tx = clamp(x, ship.r, W - ship.r)));
    const kd = (e) => (keys[e.key] = e.type === "keydown"); document.addEventListener("keydown", kd); document.addEventListener("keyup", kd);
    const stop = api.loop((dt) => {
      t += dt;
      if (keys.ArrowLeft) tx -= 420 * dt; if (keys.ArrowRight) tx += 420 * dt; tx = clamp(tx, ship.r, W - ship.r);
      ship.x += (tx - ship.x) * Math.min(1, dt * 14);
      const lv = 1 + t / 12;
      if (Math.random() < dt * (1.3 + lv * 0.9)) { const r = 12 + Math.random() * 18; rocks.push({ x: Math.random() * W, y: -r, r, v: (110 + Math.random() * 90) * lv, a: 0, va: Math.random() * 3 - 1.5 }); }
      if (Math.random() < dt * 0.6) stars.push({ x: rnd(20, W - 20), y: -12, v: 140 });
      rocks.forEach((r) => { r.y += r.v * dt; r.a += r.va * dt; }); stars.forEach((s) => (s.y += s.v * dt));
      rocks = rocks.filter((r) => r.y < H + 40); stars = stars.filter((s) => s.y < H + 20 && !s.got);
      for (const s of stars) if (Math.hypot(s.x - ship.x, s.y - ship.y) < ship.r + 12) { s.got = true; bonus += 50; haptic(); }
      score = Math.floor(t * 10) + bonus; api.score(`⭐ ${score}`);
      for (const r of rocks) if (Math.hypot(r.x - ship.x, r.y - ship.y) < r.r * 0.8 + ship.r * 0.7) {
        haptic("heavy"); const rec = api.best(score);
        api.end({ icon: "💥", title: rec ? "Yangi rekord!" : "Kema urildi!", text: `Ochko: <b>${score}</b>`, coins: score / 3 });
        return false;
      }
      ctx.fillStyle = "#070a18"; ctx.fillRect(0, 0, W, H);
      bg.forEach((b) => { b.y += b.s * 40 * dt * lv; if (b.y > H) { b.y = 0; b.x = Math.random() * W; } ctx.fillStyle = `rgba(255,255,255,${0.25 + b.s / 3})`; ctx.fillRect(b.x, b.y, b.s, b.s); });
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "22px serif";
      stars.forEach((s) => ctx.fillText("⭐", s.x, s.y));
      rocks.forEach((r) => { ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.a); ctx.fillStyle = "#8d6e63"; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, rr = r.r * (0.8 + ((i * 37) % 5) / 20); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); ctx.restore(); });
      ctx.save(); ctx.translate(ship.x, ship.y);
      ctx.fillStyle = `rgba(255,${150 + Math.random() * 80},60,.9)`; ctx.beginPath(); ctx.moveTo(-7, 14); ctx.lineTo(0, 22 + Math.random() * 10); ctx.lineTo(7, 14); ctx.fill();
      ctx.fillStyle = "#e0e6ff"; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(15, 16); ctx.lineTo(0, 9); ctx.lineTo(-15, 16); ctx.fill();
      ctx.fillStyle = "#4fc3ff"; ctx.beginPath(); ctx.arc(0, -3, 5, 0, 7); ctx.fill(); ctx.restore();
    });
    return () => { stop(); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", kd); };
  },
});

/* 3) G'ISHT SINDIRISH ------------------------------------------------ */
G.add({
  id: "bricks", ico: "🧱", nm: "G'isht sindirish", cat: "arcade", max: 300, tag: "YANGI", ds: "Raketkani suring, to'p bilan g'ishtlarni sindiring",
  start(stage, api) {
    const [W, H] = arenaSize(api);
    const { c, ctx } = api.canvas(W, H);
    const COLS = 7, ROWS = 6, bw = (W - 16) / COLS, bh = 18;
    const pad = { x: W / 2, w: 80, y: H - 26 };
    let ball, bricks, lives = 3, score = 0, level = 1, launched = false;
    const build = () => { bricks = []; for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) bricks.push({ x: 8 + k * bw, y: 40 + r * (bh + 6), alive: true, hp: r < level - 1 ? 2 : 1, col: `hsl(${r * 45},75%,58%)` }); };
    const reset = () => { launched = false; ball = { x: pad.x, y: pad.y - 12, vx: 0, vy: 0, r: 7 }; };
    api.pointer(c, (x, y, type) => { pad.x = clamp(x, pad.w / 2, W - pad.w / 2); if (type === "pointerdown" && !launched) { launched = true; const sp = 300 + level * 30; ball.vx = sp * 0.5 * (Math.random() < 0.5 ? -1 : 1); ball.vy = -sp; } });
    build(); reset();
    const upd = () => api.score(`❤️${lives} · ${score}`); upd();
    const stop = api.loop((dt) => {
      if (!launched) { ball.x = pad.x; ball.y = pad.y - 12; }
      else {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < ball.r || ball.x > W - ball.r) { ball.vx *= -1; ball.x = clamp(ball.x, ball.r, W - ball.r); }
        if (ball.y < ball.r) { ball.vy = Math.abs(ball.vy); }
        if (ball.y > pad.y - ball.r && ball.y < pad.y + 10 && Math.abs(ball.x - pad.x) < pad.w / 2 + ball.r && ball.vy > 0) {
          const sp = Math.hypot(ball.vx, ball.vy), off = (ball.x - pad.x) / (pad.w / 2);
          ball.vx = sp * off * 0.8; ball.vy = -Math.sqrt(Math.max(sp * sp - ball.vx * ball.vx, sp * sp * 0.3)); haptic();
        }
        for (const b of bricks) {
          if (!b.alive) continue;
          if (ball.x > b.x && ball.x < b.x + bw - 4 && ball.y - ball.r < b.y + bh && ball.y + ball.r > b.y) {
            ball.vy *= -1; b.hp--; if (b.hp <= 0) { b.alive = false; score += 10; } upd(); haptic(); break;
          }
        }
        if (ball.y > H + 20) { lives--; upd(); haptic("bad"); if (lives <= 0) { api.best(score); api.end({ icon: "🧱", title: "O'yin tugadi", text: `Ochko: <b>${score}</b> · Daraja: ${level}`, coins: score / 4 }); return false; } reset(); }
        if (bricks.every((b) => !b.alive)) { level++; score += 50; build(); reset(); api.toast(`🎉 ${level}-daraja!`); }
      }
      ctx.clearRect(0, 0, W, H);
      bricks.forEach((b) => { if (!b.alive) return; ctx.fillStyle = b.col; ctx.globalAlpha = b.hp > 1 ? 1 : 0.85; ctx.beginPath(); ctx.roundRect(b.x, b.y, bw - 4, bh, 4); ctx.fill(); });
      ctx.globalAlpha = 1; ctx.fillStyle = "#6c5ce7"; ctx.beginPath(); ctx.roundRect(pad.x - pad.w / 2, pad.y, pad.w, 10, 5); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
      if (!launched) { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "15px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Boshlash uchun bosing", W / 2, H / 2 + 60); }
    });
    return stop;
  },
});

/* 4) PING-PONG ------------------------------------------------------- */
G.add({
  id: "pong", ico: "🏓", nm: "Ping-pong", cat: "arcade", max: 120, tag: "YANGI", ds: "Botga qarshi — 5 ochkogacha",
  start(stage, api) {
    const [W, H] = arenaSize(api);
    const { c, ctx } = api.canvas(W, H);
    const me = { x: W / 2, w: 80 }, bot = { x: W / 2, w: 80 };
    let ball, sMe = 0, sBot = 0, wait = 1;
    const serve = (dir) => { ball = { x: W / 2, y: H / 2, vx: rnd(-120, 120), vy: 260 * dir, r: 8 }; wait = 0.8; };
    api.pointer(c, (x) => (me.x = clamp(x, me.w / 2, W - me.w / 2)));
    serve(1); api.score("0 : 0");
    const stop = api.loop((dt) => {
      if (wait > 0) wait -= dt;
      else {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
        const botSpeed = 230 + (sMe - sBot) * 20;
        bot.x += clamp(ball.x - bot.x, -botSpeed * dt, botSpeed * dt);
        const hit = (p, y, dir) => { if (Math.abs(ball.y - y) < 12 && Math.abs(ball.x - p.x) < p.w / 2 + ball.r && Math.sign(ball.vy) === dir) { ball.vy = -ball.vy * 1.06; ball.vx += (ball.x - p.x) * 5; haptic(); } };
        hit(me, H - 24, 1); hit(bot, 24, -1);
        if (ball.y > H + 20) { sBot++; haptic("bad"); serve(-1); }
        if (ball.y < -20) { sMe++; haptic("ok"); serve(1); }
        api.score(`${sMe} : ${sBot}`);
        if (sMe >= 5 || sBot >= 5) { const w = sMe > sBot; api.end({ icon: w ? "🏆" : "🤖", title: w ? "Siz yutdingiz!" : "Bot yutdi", text: `Hisob: <b>${sMe} : ${sBot}</b>`, coins: w ? 60 + sMe * 10 : sMe * 8 }); return false; }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(127,127,127,.3)"; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#ff5e6c"; ctx.beginPath(); ctx.roundRect(bot.x - bot.w / 2, 14, bot.w, 10, 5); ctx.fill();
      ctx.fillStyle = "#4fc3ff"; ctx.beginPath(); ctx.roundRect(me.x - me.w / 2, H - 24, me.w, 10, 5); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
    });
    return stop;
  },
});

/* 5) SAKROVCHI ------------------------------------------------------- */
G.add({
  id: "jumper", ico: "🐸", nm: "Sakrovchi", cat: "arcade", max: 300, tag: "YANGI", ds: "Platformalarda yuqoriga sakrang — chap/o'ngga suring",
  start(stage, api) {
    const [W, H] = arenaSize(api);
    const { c, ctx } = api.canvas(W, H);
    const P = { x: W / 2, y: H - 80, vx: 0, vy: -520 }; let plats = [], camY = 0, best = 0, tx = W / 2;
    for (let i = 0; i < 9; i++) plats.push({ x: rnd(10, W - 80), y: H - 30 - i * (H / 8), w: 70, move: 0 });
    plats[0].x = W / 2 - 35;
    api.pointer(c, (x) => (tx = x));
    const unk = api.keys({ ArrowLeft: () => (tx = P.x - 60), ArrowRight: () => (tx = P.x + 60) });
    const stop = api.loop((dt) => {
      P.vx = (tx - P.x) * 6; P.x += P.vx * dt; P.vy += 1100 * dt; P.y += P.vy * dt;
      if (P.x < -15) P.x = W + 15; if (P.x > W + 15) P.x = -15;
      if (P.vy > 0) for (const p of plats) if (P.x > p.x - 10 && P.x < p.x + p.w + 10 && P.y + 14 > p.y && P.y + 14 < p.y + 16) { P.vy = -560; haptic(); }
      plats.forEach((p) => { if (p.move) { p.x += p.move * dt; if (p.x < 0 || p.x > W - p.w) p.move *= -1; } });
      if (P.y < H * 0.4) { const d = H * 0.4 - P.y; P.y += d; camY += d; plats.forEach((p) => (p.y += d)); }
      best = Math.max(best, Math.floor(camY / 10)); api.score(`⬆️ ${best}`);
      plats = plats.filter((p) => p.y < H + 20);
      while (plats.length < 9) { const top = Math.min(...plats.map((p) => p.y)); const gap = 60 + Math.min(60, camY / 200); plats.push({ x: rnd(0, W - 70), y: top - gap, w: Math.max(45, 70 - camY / 500), move: Math.random() < Math.min(0.4, camY / 8000) ? 80 : 0 }); }
      if (P.y > H + 30) { const rec = api.best(best); api.end({ icon: "🐸", title: rec ? "Yangi rekord!" : "Yiqildingiz!", text: `Balandlik: <b>${best}</b>`, coins: best / 6 }); return false; }
      ctx.clearRect(0, 0, W, H);
      plats.forEach((p) => { ctx.fillStyle = p.move ? "#4fc3ff" : "#2ecc71"; ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 10, 5); ctx.fill(); });
      ctx.font = "28px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🐸", P.x, P.y);
    });
    return () => { stop(); unk(); };
  },
});

/* 6) YUGURUVCHI ------------------------------------------------------ */
G.add({
  id: "runner", ico: "🏃", nm: "Yuguruvchi", cat: "arcade", max: 300, tag: "YANGI", ds: "Ekranni bosib to'siqlardan sakrang (ikki marta sakrash mumkin)",
  start(stage, api) {
    const W = api.width(), H = 260, GY = H - 40;
    const { c, ctx } = api.canvas(W, H);
    const P = { x: 60, y: GY, vy: 0, jumps: 0 }; let obs = [], t = 0, dist = 0, speed = 260, next = 1;
    const jump = () => { if (P.jumps < 2) { P.vy = -520; P.jumps++; haptic(); } };
    c.addEventListener("pointerdown", jump); const unk = api.keys({ " ": jump, ArrowUp: jump });
    const stop = api.loop((dt) => {
      t += dt; speed = 260 + t * 9; dist += speed * dt;
      P.vy += 1500 * dt; P.y += P.vy * dt; if (P.y >= GY) { P.y = GY; P.vy = 0; P.jumps = 0; }
      next -= dt; if (next <= 0) { const air = Math.random() < 0.25 && t > 10; obs.push({ x: W + 20, w: air ? 30 : rnd(18, 34), h: air ? 20 : rnd(26, 46), air, e: air ? "🦅" : pick(["🌵", "🪨", "📦"]) }); next = rnd(70, 140) / 100 * (300 / speed) * 1.4; }
      obs.forEach((o) => (o.x -= speed * dt)); obs = obs.filter((o) => o.x > -50);
      const score = Math.floor(dist / 20); api.score(`🏃 ${score}`);
      for (const o of obs) { const oy = o.air ? GY - 70 : GY - o.h; if (P.x + 12 > o.x && P.x - 12 < o.x + o.w && P.y > oy && P.y - 34 < (o.air ? oy + o.h : GY)) { haptic("heavy"); const rec = api.best(score); api.end({ icon: "💥", title: rec ? "Yangi rekord!" : "Urildingiz!", text: `Masofa: <b>${score}</b>`, coins: score / 4 }); return false; } }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(127,127,127,.35)"; ctx.fillRect(0, GY, W, 2);
      ctx.font = "30px serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      obs.forEach((o) => { ctx.font = `${o.air ? 28 : o.h}px serif`; ctx.fillText(o.e, o.x + o.w / 2, o.air ? GY - 50 : GY + 4); });
      ctx.font = "34px serif"; ctx.save(); ctx.translate(P.x, P.y + 2); ctx.scale(-1, 1); ctx.fillText("🏃", 0, 0); ctx.restore();
    });
    return () => { stop(); unk(); };
  },
});

/* 7) SAVATGA TUT ----------------------------------------------------- */
G.add({
  id: "catch", ico: "🧺", nm: "Savatga tut", cat: "arcade", max: 200, tag: "YANGI", ds: "Mevalarni tuting, 💣 dan qoching. 3 ta meva tushib ketsa — tamom",
  start(stage, api) {
    const [W, H] = arenaSize(api);
    const { c, ctx } = api.canvas(W, H);
    let bx = W / 2, items = [], score = 0, miss = 0, t = 0;
    api.pointer(c, (x) => (bx = clamp(x, 30, W - 30)));
    const upd = () => api.score(`🍎 ${score} · ❌ ${miss}/3`); upd();
    const stop = api.loop((dt) => {
      t += dt;
      if (Math.random() < dt * (1 + t / 15)) { const bomb = Math.random() < 0.18 + t / 300; items.push({ x: rnd(20, W - 20), y: -20, v: 150 + t * 6 + Math.random() * 60, e: bomb ? "💣" : pick(["🍎", "🍐", "🍊", "🍓", "🍌", "🍉"]), bomb }); }
      for (const it of items) {
        it.y += it.v * dt;
        if (!it.done && it.y > H - 50 && it.y < H - 20 && Math.abs(it.x - bx) < 36) {
          it.done = true;
          if (it.bomb) { haptic("heavy"); api.end({ icon: "💣", title: "Bomba!", text: `Tutilgan mevalar: <b>${score}</b>`, coins: score * 2 }); return false; }
          score++; haptic(); upd();
        }
        if (!it.done && it.y > H + 10) { it.done = true; if (!it.bomb) { miss++; upd(); haptic("bad"); if (miss >= 3) { api.best(score); api.end({ icon: "🧺", title: "O'yin tugadi", text: `Tutilgan mevalar: <b>${score}</b>`, coins: score * 2 }); return false; } } }
      }
      items = items.filter((i) => !i.done);
      ctx.clearRect(0, 0, W, H); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "30px serif"; items.forEach((i) => ctx.fillText(i.e, i.x, i.y));
      ctx.font = "46px serif"; ctx.fillText("🧺", bx, H - 32);
    });
    return stop;
  },
});

/* 8) KOSMIK OTISHMA -------------------------------------------------- */
G.add({
  id: "shooter", ico: "👾", nm: "Kosmik otishma", cat: "arcade", max: 300, tag: "YANGI", ds: "Kema o'zi otadi — suring va dushmanlarni yo'q qiling",
  start(stage, api) {
    const [W, H] = arenaSize(api);
    const { c, ctx } = api.canvas(W, H);
    let sx = W / 2, bullets = [], foes = [], t = 0, cd = 0, score = 0, lives = 3;
    api.pointer(c, (x) => (sx = clamp(x, 20, W - 20)));
    const upd = () => api.score(`❤️${lives} · ${score}`); upd();
    const stop = api.loop((dt) => {
      t += dt; cd -= dt;
      if (cd <= 0) { bullets.push({ x: sx, y: H - 50 }); cd = 0.22; }
      if (Math.random() < dt * (0.9 + t / 20)) foes.push({ x: rnd(20, W - 20), y: -20, v: 60 + t * 2.5 + Math.random() * 40, hp: Math.random() < 0.2 ? 3 : 1, e: "" });
      bullets.forEach((b) => (b.y -= 520 * dt)); foes.forEach((f) => { f.y += f.v * dt; f.x += Math.sin((t + f.v) * 2) * 30 * dt; });
      for (const f of foes) for (const b of bullets) if (!b.hit && f.hp > 0 && Math.abs(b.x - f.x) < 18 && Math.abs(b.y - f.y) < 18) { b.hit = true; f.hp--; if (f.hp <= 0) { score += 10; upd(); } }
      for (const f of foes) if (f.hp > 0 && (f.y > H - 30 || (Math.abs(f.x - sx) < 24 && Math.abs(f.y - (H - 40)) < 24))) { f.hp = 0; lives--; upd(); haptic("bad"); if (lives <= 0) { const rec = api.best(score); api.end({ icon: "👾", title: rec ? "Yangi rekord!" : "Kema yo'q qilindi", text: `Ochko: <b>${score}</b>`, coins: score / 4 }); return false; } }
      bullets = bullets.filter((b) => !b.hit && b.y > -10); foes = foes.filter((f) => f.hp > 0 && f.y < H + 30);
      ctx.fillStyle = "#070a18"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffd166"; bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 8, 4, 12));
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "28px serif";
      foes.forEach((f) => ctx.fillText(f.hp > 1 ? "👹" : "👾", f.x, f.y));
      ctx.font = "34px serif"; ctx.fillText("🚀", sx, H - 40);
    });
    return stop;
  },
});

/* 9) SHAR PORTLAT ---------------------------------------------------- */
G.add({
  id: "balloons", ico: "🎈", nm: "Shar portlat", cat: "arcade", max: 150, tag: "YANGI", ds: "30 soniyada iloji boricha ko'p sharni portlating. 💣 ni bosmang!",
  start(stage, api) {
    const [W, H] = arenaSize(api);
    const { c, ctx } = api.canvas(W, H);
    let bs = [], score = 0, left = 30, pops = [];
    c.addEventListener("pointerdown", (e) => {
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (let i = bs.length - 1; i >= 0; i--) { const b = bs[i]; if (Math.hypot(b.x - x, b.y - y) < b.r + 6) { bs.splice(i, 1); pops.push({ x: b.x, y: b.y, t: 0.3 }); if (b.bomb) { score = Math.max(0, score - 5); haptic("bad"); api.toast("💣 −5"); } else { score += b.gold ? 5 : 1; haptic(); } break; } }
    });
    const stop = api.loop((dt) => {
      left -= dt;
      if (Math.random() < dt * 3.2) { const bomb = Math.random() < 0.15, gold = !bomb && Math.random() < 0.08; bs.push({ x: rnd(25, W - 25), y: H + 30, r: rnd(20, 28), v: rnd(70, 150) + (30 - left) * 3, bomb, gold, col: `hsl(${rnd(0, 360)},80%,60%)` }); }
      bs.forEach((b) => (b.y -= b.v * dt)); bs = bs.filter((b) => b.y > -40); pops.forEach((p) => (p.t -= dt)); pops = pops.filter((p) => p.t > 0);
      api.score(`🎈 ${score} · ⏱ ${Math.ceil(Math.max(0, left))}`);
      if (left <= 0) { const rec = api.best(score); api.end({ icon: "🎈", title: rec ? "Yangi rekord!" : "Vaqt tugadi!", text: `Portlatilgan sharlar: <b>${score}</b>`, coins: score * 2 }); return false; }
      ctx.clearRect(0, 0, W, H); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      bs.forEach((b) => {
        if (b.bomb) { ctx.font = `${b.r * 1.8}px serif`; ctx.fillText("💣", b.x, b.y); return; }
        ctx.strokeStyle = "rgba(200,200,200,.5)"; ctx.beginPath(); ctx.moveTo(b.x, b.y + b.r); ctx.lineTo(b.x, b.y + b.r + 18); ctx.stroke();
        ctx.fillStyle = b.gold ? "#f5c542" : b.col; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * 0.85, b.r, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.2, 0, 7); ctx.fill();
      });
      ctx.font = "26px serif"; pops.forEach((p) => ctx.fillText("💥", p.x, p.y));
    });
    return stop;
  },
});

/* 10) KO'RSICHQON URISH ---------------------------------------------- */
G.add({
  id: "mole", ico: "🐹", nm: "Ko'rsichqon urish", cat: "arcade", max: 150, tag: "YANGI", ds: "Chiqqan 🐹 ni tez bosing! 🐰 ni bosmang. 30 soniya",
  start(stage, api) {
    const box = api.el(Array.from({ length: 9 }, (_, i) => `<button class="cell" data-i="${i}" style="font-size:40px">🕳️</button>`).join(""), "board");
    box.style.gridTemplateColumns = "repeat(3,1fr)"; box.style.maxWidth = "340px";
    const cells = [...box.children]; let score = 0, left = 30, active = {}, timers = [];
    const show = () => {
      const free = cells.filter((_, i) => !active[i]); if (!free.length) return;
      const el = pick(free), i = +el.dataset.i, bunny = Math.random() < 0.2;
      active[i] = bunny ? "b" : "m"; el.textContent = bunny ? "🐰" : "🐹";
      const life = Math.max(450, 1100 - (30 - left) * 22);
      timers.push(setTimeout(() => { if (active[i]) { delete active[i]; el.textContent = "🕳️"; } }, life));
    };
    cells.forEach((el) => el.addEventListener("pointerdown", () => {
      const i = +el.dataset.i; if (!active[i]) return;
      if (active[i] === "m") { score++; haptic(); el.textContent = "💫"; } else { score = Math.max(0, score - 3); haptic("bad"); el.textContent = "😢"; }
      delete active[i]; setTimeout(() => { if (!active[i]) el.textContent = "🕳️"; }, 250);
    }));
    const spawn = setInterval(() => { show(); if (left < 18) show(); }, 650);
    const tick = setInterval(() => { left -= 0.1; api.score(`🐹 ${score} · ⏱ ${Math.ceil(left)}`); if (left <= 0) { clearInterval(spawn); clearInterval(tick); const rec = api.best(score); api.end({ icon: "🐹", title: rec ? "Yangi rekord!" : "Vaqt tugadi!", text: `Urilgan ko'rsichqonlar: <b>${score}</b>`, coins: score * 3 }); } }, 100);
    return () => { clearInterval(spawn); clearInterval(tick); timers.forEach(clearTimeout); };
  },
});

/* 11) MINORA QUR ----------------------------------------------------- */
G.add({
  id: "stack", ico: "🏗️", nm: "Minora qur", cat: "arcade", max: 200, tag: "YANGI", ds: "Blok ustida bo'lganda bosing — chetga chiqqan qism kesiladi",
  start(stage, api) {
    const [W, H] = arenaSize(api, 1.3);
    const { c, ctx } = api.canvas(W, H);
    const BH = 24; let stack = [{ x: W / 2 - 70, w: 140 }], cur, dir = 1, speed = 140, score = 0, falling = [], over = false;
    const spawn = () => { const top = stack[stack.length - 1]; cur = { x: dir > 0 ? -top.w : W, w: top.w }; };
    const drop = () => {
      if (over) return;
      const top = stack[stack.length - 1]; const l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
      if (r - l <= 0) { over = true; haptic("heavy"); const rec = api.best(score); api.end({ icon: "🏗️", title: rec ? "Yangi rekord!" : "Minora qulab tushdi!", text: `Qavatlar: <b>${score}</b>`, coins: score * 4 }); return; }
      if (Math.abs(cur.x - top.x) < 4) { cur.x = top.x; haptic("ok"); } else { haptic(); falling.push({ x: cur.x < top.x ? cur.x : r, w: cur.w - (r - l), y: 0, v: 0 }); }
      stack.push({ x: Math.abs(cur.x - top.x) < 4 ? top.x : l, w: Math.abs(cur.x - top.x) < 4 ? top.w : r - l }); score++; api.score(`🏗️ ${score}`);
      dir *= -1; speed = Math.min(420, speed + 9); spawn();
    };
    c.addEventListener("pointerdown", drop); const unk = api.keys({ " ": drop });
    spawn(); api.score("🏗️ 0");
    const stop = api.loop((dt) => {
      if (over) return false;
      cur.x += dir * speed * dt; if (cur.x > W) dir = -1; if (cur.x + cur.w < 0) dir = 1;
      falling.forEach((f) => { f.v += 900 * dt; f.y += f.v * dt; }); falling = falling.filter((f) => f.y < H);
      ctx.clearRect(0, 0, W, H);
      const off = Math.max(0, stack.length * BH - H * 0.6);
      stack.forEach((s, i) => { ctx.fillStyle = `hsl(${(i * 18) % 360},70%,58%)`; ctx.fillRect(s.x, H - (i + 1) * BH + off, s.w, BH - 2); });
      const y = H - (stack.length + 1) * BH + off;
      ctx.fillStyle = `hsl(${(stack.length * 18) % 360},70%,58%)`; ctx.fillRect(cur.x, y, cur.w, BH - 2);
      ctx.globalAlpha = 0.5; falling.forEach((f) => ctx.fillRect(f.x, y + BH + f.y, f.w, BH - 2)); ctx.globalAlpha = 1;
    });
    return () => { stop(); unk(); };
  },
});

/* 12) NISHON --------------------------------------------------------- */
G.add({
  id: "target", ico: "🎯", nm: "Nishon", cat: "arcade", max: 150, tag: "YANGI", ds: "Nishonlar kichrayib yo'qolmasdan oldin bosing. 3 ta o'tkazib yuborsangiz — tamom",
  start(stage, api) {
    const [W, H] = arenaSize(api, 1.2);
    const { c, ctx } = api.canvas(W, H);
    let ts = [], score = 0, miss = 0, t = 0, next = 0;
    const upd = () => api.score(`🎯 ${score} · ❌ ${miss}/3`); upd();
    c.addEventListener("pointerdown", (e) => {
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (let i = ts.length - 1; i >= 0; i--) { const tt = ts[i], rad = tt.R * (1 - tt.age / tt.life); if (Math.hypot(tt.x - x, tt.y - y) < rad + 4) { ts.splice(i, 1); score++; haptic(); upd(); return; } }
    });
    const stop = api.loop((dt) => {
      t += dt; next -= dt;
      if (next <= 0) { ts.push({ x: rnd(35, W - 35), y: rnd(35, H - 35), R: 32, age: 0, life: Math.max(0.9, 2.4 - t / 25) }); next = Math.max(0.35, 0.9 - t / 60); }
      for (const tt of ts) { tt.age += dt; if (tt.age >= tt.life) { tt.gone = true; miss++; haptic("bad"); upd(); } }
      ts = ts.filter((tt) => !tt.gone);
      if (miss >= 3) { const rec = api.best(score); api.end({ icon: "🎯", title: rec ? "Yangi rekord!" : "O'yin tugadi", text: `Urilgan nishonlar: <b>${score}</b>`, coins: score * 3 }); return false; }
      ctx.clearRect(0, 0, W, H);
      ts.forEach((tt) => { const rad = tt.R * (1 - tt.age / tt.life); [["#ff5e6c", 1], ["#fff", 0.66], ["#ff5e6c", 0.33]].forEach(([col, k]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tt.x, tt.y, Math.max(0, rad * k), 0, 7); ctx.fill(); }); });
    });
    return stop;
  },
});

/* 13) POYGA ---------------------------------------------------------- */
G.add({
  id: "racer", ico: "🏎️", nm: "Poyga", cat: "arcade", max: 300, tag: "YANGI", ds: "Ekranning chap/o'ng tomonini bosib yo'lak almashtiring",
  start(stage, api) {
    const [W, H] = arenaSize(api);
    const { c, ctx } = api.canvas(W, H);
    const LANES = 3, lw = W / LANES; let lane = 1, x = lw * 1.5, cars = [], t = 0, dist = 0, off = 0, next = 0.5;
    const move = (d) => { lane = clamp(lane + d, 0, LANES - 1); haptic(); };
    c.addEventListener("pointerdown", (e) => { const r = c.getBoundingClientRect(); move(e.clientX - r.left < W / 2 ? -1 : 1); });
    const unk = api.keys({ ArrowLeft: () => move(-1), ArrowRight: () => move(1) });
    const stop = api.loop((dt) => {
      t += dt; const sp = 300 + t * 12; dist += sp * dt; off = (off + sp * dt) % 40;
      x += (lw * (lane + 0.5) - x) * Math.min(1, dt * 14);
      next -= dt;
      if (next <= 0) { const ls = shuffle([0, 1, 2]).slice(0, Math.random() < Math.min(0.5, t / 40) ? 2 : 1); ls.forEach((l) => cars.push({ l, y: -60, e: pick(["🚙", "🚕", "🚌", "🚓", "🚚"]) })); next = Math.max(0.45, 1.1 - t / 50); }
      cars.forEach((cc) => (cc.y += sp * 0.6 * dt)); cars = cars.filter((cc) => cc.y < H + 60);
      const score = Math.floor(dist / 30); api.score(`🏁 ${score}`);
      for (const cc of cars) if (Math.abs(lw * (cc.l + 0.5) - x) < lw * 0.45 && Math.abs(cc.y - (H - 60)) < 46) { haptic("heavy"); const rec = api.best(score); api.end({ icon: "💥", title: rec ? "Yangi rekord!" : "Avariya!", text: `Masofa: <b>${score}</b>`, coins: score / 4 }); return false; }
      ctx.fillStyle = "#2d3436"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,.6)"; for (let l = 1; l < LANES; l++) for (let y = -40 + off; y < H; y += 40) ctx.fillRect(l * lw - 2, y, 4, 22);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "40px serif";
      cars.forEach((cc) => { ctx.save(); ctx.translate(lw * (cc.l + 0.5), cc.y); ctx.rotate(Math.PI / 2); ctx.fillText(cc.e, 0, 0); ctx.restore(); });
      ctx.save(); ctx.translate(x, H - 60); ctx.rotate(-Math.PI / 2); ctx.fillText("🏎️", 0, 0); ctx.restore();
    });
    return () => { stop(); unk(); };
  },
});

/* 14) LABIRINT ------------------------------------------------------- */
G.add({
  id: "maze", ico: "🌀", nm: "Labirint", cat: "arcade", max: 150, tag: "YANGI", ds: "🏁 ga yeting. 3 ta labirint, tez bo'lsangiz ko'proq tanga",
  start(stage, api) {
    const S = api.width(); const { c, ctx } = api.canvas(S, S);
    const pad = api.el(`<span></span><button data-d="0,-1">▲</button><span></span><button data-d="-1,0">◀</button><button data-d="0,1">▼</button><button data-d="1,0">▶</button>`, "dpad");
    let level = 0, N, walls, P, t0 = Date.now();
    const SIZES = [8, 11, 14];
    const gen = (n) => { // DFS bilan labirint: walls[y][x] = {t,r,b,l}
      const w = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ t: 1, r: 1, b: 1, l: 1 }))), seen = new Set(["0,0"]), st = [[0, 0]];
      while (st.length) {
        const [x, y] = st[st.length - 1];
        const nb = [[0, -1, "t", "b"], [1, 0, "r", "l"], [0, 1, "b", "t"], [-1, 0, "l", "r"]].filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen.has(nx + "," + ny); });
        if (!nb.length) { st.pop(); continue; }
        const [dx, dy, a, b] = pick(nb); w[y][x][a] = 0; w[y + dy][x + dx][b] = 0; seen.add(x + dx + "," + (y + dy)); st.push([x + dx, y + dy]);
      }
      return w;
    };
    const start = () => { N = SIZES[level]; walls = gen(N); P = { x: 0, y: 0 }; draw(); api.score(`🌀 ${level + 1}/3`); };
    const draw = () => {
      const cs = S / N; ctx.clearRect(0, 0, S, S); ctx.strokeStyle = "#a29bfe"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const w = walls[y][x], X = x * cs, Y = y * cs; ctx.beginPath(); if (w.t) { ctx.moveTo(X, Y); ctx.lineTo(X + cs, Y); } if (w.l) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + cs); } if (w.r && x === N - 1) { ctx.moveTo(X + cs, Y); ctx.lineTo(X + cs, Y + cs); } if (w.b && y === N - 1) { ctx.moveTo(X, Y + cs); ctx.lineTo(X + cs, Y + cs); } if (w.r && x < N - 1) { ctx.moveTo(X + cs, Y); ctx.lineTo(X + cs, Y + cs); } if (w.b && y < N - 1) { ctx.moveTo(X, Y + cs); ctx.lineTo(X + cs, Y + cs); } ctx.stroke(); }
      ctx.font = `${cs * 0.7}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🏁", (N - 0.5) * cs, (N - 0.5) * cs); ctx.fillText("🟣", (P.x + 0.5) * cs, (P.y + 0.5) * cs);
    };
    const move = (dx, dy) => {
      const w = walls[P.y][P.x], k = dx === 1 ? "r" : dx === -1 ? "l" : dy === 1 ? "b" : "t";
      if (w[k]) return haptic("bad");
      P.x += dx; P.y += dy; haptic(); draw();
      if (P.x === N - 1 && P.y === N - 1) {
        level++; haptic("ok");
        if (level >= 3) { const sec = Math.round((Date.now() - t0) / 1000); const rec = api.best(sec, true); api.end({ icon: "🌀", title: rec ? "Yangi rekord!" : "Barcha labirintlar o'tildi!", text: `Vaqt: <b>${sec} s</b>`, coins: Math.max(30, 150 - sec) }); }
        else { api.toast(`✅ ${level}/3 o'tildi!`); start(); }
      }
    };
    pad.querySelectorAll("button").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); move(...b.dataset.d.split(",").map(Number)); }));
    let sx = 0, sy = 0;
    c.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    c.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; Math.abs(dx) > Math.abs(dy) ? move(Math.sign(dx), 0) : move(0, Math.sign(dy)); });
    const unk = api.keys({ ArrowUp: () => move(0, -1), ArrowDown: () => move(0, 1), ArrowLeft: () => move(-1, 0), ArrowRight: () => move(1, 0) });
    start();
    return unk;
  },
});
