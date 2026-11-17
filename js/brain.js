"use strict";
/* =====================================================================
   🧠 AQL VA ⚡ TEZLIK O'YINLARI (18 ta)
   ===================================================================== */

/* Umumiy savol-javob dvigateli.
   mode "count": total ta savol; mode "time": seconds soniya ichida iloji boricha ko'p
   gen() → { q: html, opts: [...], ans: to'g'ri variant } */
function quizRun(api, { mode = "count", total = 10, seconds = 30, gen, per = 10, icon = "🧠", penalty = 0, qSize = 34 }) {
  const bar = api.el("<i></i>", "bar");
  const q = api.el("", "big"); q.style.fontSize = qSize + "px"; q.style.minHeight = "70px";
  const opts = api.el("", "opts");
  const msg = api.el("", "msg");
  let n = 0, ok = 0, lock = false, left = seconds, cur, tick, streak = 0;
  const finish = () => {
    clearInterval(tick); lock = true;
    const rec = api.best(ok);
    api.end({ icon, title: rec && ok ? "Yangi rekord!" : mode === "time" ? "Vaqt tugadi!" : "Tugadi!", text: `To'g'ri javoblar: <b>${ok}${mode === "count" ? " / " + total : ""}</b>`, coins: ok * per });
  };
  const next = () => {
    if (mode === "count" && n >= total) return finish();
    cur = gen(n); n++;
    q.innerHTML = cur.q;
    opts.style.gridTemplateColumns = cur.opts.length === 2 ? "1fr 1fr" : cur.opts.length === 3 ? "repeat(3,1fr)" : "1fr 1fr";
    opts.innerHTML = cur.opts.map((o, i) => `<button data-i="${i}" ${cur.style ? `style="${cur.style}"` : ""}>${o}</button>`).join("");
    opts.querySelectorAll("button").forEach((b) => (b.onclick = () => pickAns(b)));
    if (mode === "count") { bar.firstChild.style.width = (n / total) * 100 + "%"; api.score(`✅ ${ok} · ${n}/${total}`); }
    lock = false;
  };
  const pickAns = (b) => {
    if (lock) return; lock = true;
    const right = cur.opts[+b.dataset.i] === cur.ans;
    b.classList.add(right ? "ok" : "no");
    if (right) { ok++; streak++; haptic(); msg.textContent = streak >= 3 ? `🔥 ${streak} ketma-ket!` : ""; }
    else { streak = 0; haptic("bad"); left -= penalty; msg.textContent = penalty ? `❌ −${penalty} s` : "❌"; [...opts.children].find((x) => cur.opts[+x.dataset.i] === cur.ans)?.classList.add("ok"); }
    if (mode === "time") api.score(`✅ ${ok}`);
    setTimeout(next, right ? 250 : 800);
  };
  if (mode === "time") tick = setInterval(() => { left -= 0.1; bar.firstChild.style.width = Math.max(0, (left / seconds) * 100) + "%"; if (left <= 0) finish(); }, 100);
  next();
  return () => clearInterval(tick);
}
const optsWith = (ans, wrong, k = 4) => shuffle([ans, ...shuffle(wrong.filter((w) => w !== ans)).slice(0, k - 1)]);

/* 1) MATEMATIKA POYGASI --------------------------------------------- */
G.add({
  id: "math", ico: "➕", nm: "Matematika poygasi", cat: "brain", max: 300, ds: "30 soniyada iloji boricha ko'p misol. Xato = −2 soniya",
  start(stage, api) {
    let sc = 0;
    return quizRun(api, { mode: "time", seconds: 30, per: 8, icon: "🧮", penalty: 2, gen: () => {
      const lv = Math.min(4, 1 + Math.floor(sc++ / 5)); const op = pick(lv === 1 ? ["+", "−"] : lv === 2 ? ["+", "−", "×"] : ["+", "−", "×", "÷"]);
      let a, b, ans;
      if (op === "+") { a = rnd(2, 40 * lv); b = rnd(2, 40 * lv); ans = a + b; } else if (op === "−") { a = rnd(5, 20 * lv); b = rnd(1, a); ans = a - b; } else if (op === "×") { a = rnd(2, 3 + lv * 2); b = rnd(2, 9); ans = a * b; } else { b = rnd(2, 9); ans = rnd(2, 3 + lv * 2); a = b * ans; }
      const set = new Set([ans]); while (set.size < 4) { const d = ans + rnd(-10, 10); if (d >= 0) set.add(d); }
      return { q: `${a} ${op} ${b} = ?`, opts: shuffle([...set]), ans };
    } });
  },
});

/* 2) TO'G'RI YOKI NOTO'G'RI ----------------------------------------- */
G.add({
  id: "truefalse", ico: "✔️", nm: "To'g'rimi?", cat: "speed", max: 200, tag: "YANGI", ds: "Misol to'g'rimi? 30 soniya. Xato = −3 soniya",
  start(stage, api) {
    return quizRun(api, { mode: "time", seconds: 30, per: 6, icon: "✔️", penalty: 3, gen: () => {
      const a = rnd(2, 20), b = rnd(2, 20), op = pick(["+", "×", "−"]); const real = op === "+" ? a + b : op === "×" ? a * b : a - b;
      const truth = Math.random() < 0.5, shown = truth ? real : real + pick([-2, -1, 1, 2, 10, -10]);
      return { q: `${a} ${op} ${b} = ${shown}`, opts: ["✅ Ha", "❌ Yo'q"], ans: truth ? "✅ Ha" : "❌ Yo'q" };
    } });
  },
});

/* 3) KATTA-KICHIK ---------------------------------------------------- */
G.add({
  id: "bigger", ico: "⚖️", nm: "Qaysi katta?", cat: "speed", max: 200, tag: "YANGI", ds: "Kattaroq sonni bosing. 30 soniya",
  start(stage, api) {
    let n = 0;
    return quizRun(api, { mode: "time", seconds: 30, per: 5, icon: "⚖️", penalty: 2, gen: () => {
      const lv = 1 + Math.floor(n++ / 6); let a, b;
      if (lv < 3) { a = rnd(1, 99 * lv); b = rnd(1, 99 * lv); } else { const x = rnd(2, 12), y = rnd(2, 12), z = rnd(2, 12), w = rnd(2, 12); a = `${x}×${y}`; b = `${z}×${w}`; }
      const va = typeof a === "number" ? a : eval(a.replace("×", "*")), vb = typeof b === "number" ? b : eval(b.replace("×", "*"));
      if (va === vb) return { q: "Qaysi katta?", opts: [String(a), String(b) + " "], ans: String(a) };
      return { q: "Qaysi katta?", opts: [String(a), String(b)], ans: String(va > vb ? a : b), style: "font-size:26px;padding:26px 8px" };
    } });
  },
});

/* 4) VIKTORINA ------------------------------------------------------- */
const QUIZ = [["O'zbekistonning poytaxti?", "Toshkent", ["Samarqand", "Buxoro", "Xiva"]], ["Bir yilda nechta oy bor?", "12", ["10", "11", "13"]], ["Eng katta okean?", "Tinch", ["Atlantika", "Hind", "Shimoliy Muz"]], ["Amir Temur qayerda tug'ilgan?", "Shahrisabz", ["Samarqand", "Buxoro", "Termiz"]], ["Eng katta sayyora?", "Yupiter", ["Saturn", "Yer", "Mars"]], ["‘Alpomish’ qanday asar?", "Doston", ["Roman", "She'r", "Ertak"]], ["Suvning formulasi?", "H₂O", ["CO₂", "O₂", "NaCl"]], ["Eng tez quruqlik hayvoni?", "Gepard", ["Sher", "Ot", "Bo'ri"]], ["Navoiy qaysi asrda yashagan?", "XV", ["XIII", "XIV", "XVI"]], ["O'zbekiston mustaqilligi yili?", "1991", ["1990", "1992", "1989"]], ["Eng baland cho'qqi?", "Everest", ["Elbrus", "K2", "Kilimanjaro"]], ["Katta odamda nechta suyak bor?", "206", ["186", "226", "306"]], ["‘Boburnoma’ muallifi?", "Bobur", ["Navoiy", "Ulug'bek", "Ibn Sino"]], ["‘Qizil sayyora’ qaysi?", "Mars", ["Venera", "Yupiter", "Merkuriy"]], ["1 kilobayt necha bayt?", "1024", ["1000", "512", "2048"]], ["Shaxmat taxtasida nechta katak?", "64", ["32", "48", "100"]], ["Ulug'bek rasadxonasi qayerda?", "Samarqand", ["Buxoro", "Toshkent", "Qo'qon"]], ["Al-Xorazmiy qaysi fan asoschisi?", "Algebra", ["Kimyo", "Tibbiyot", "Tarix"]], ["Kamalakda nechta rang bor?", "7", ["5", "6", "8"]], ["Suv necha gradusda qaynaydi?", "100°C", ["90°C", "110°C", "120°C"]], ["Eng kichik tub son?", "2", ["0", "1", "3"]], ["Ibn Sinoning mashhur asari?", "Tib qonunlari", ["Xamsa", "Qutadg'u bilig", "Devon"]], ["Qaysi biri sutemizuvchi?", "Delfin", ["Akula", "Timsoh", "Pingvin"]], ["Yer Quyosh atrofini qancha vaqtda aylanadi?", "1 yil", ["1 oy", "1 kun", "10 yil"]], ["Eng katta materik?", "Yevroosiyo", ["Afrika", "Amerika", "Avstraliya"]], ["Yurak nechta kameradan iborat?", "4", ["2", "3", "5"]], ["Oyga birinchi qadam qo'ygan inson?", "Armstrong", ["Gagarin", "Aldrin", "Kollinz"]], ["Fotosintez qayerda boradi?", "Barg", ["Ildiz", "Gul", "Urug'"]], ["Eng uzun daryo (O'zbekiston)?", "Amudaryo", ["Sirdaryo", "Zarafshon", "Chirchiq"]], ["Bir soatda necha soniya bor?", "3600", ["360", "6000", "1000"]]];
G.add({
  id: "quiz", ico: "❓", nm: "Viktorina", cat: "brain", max: 150, tag: "YANGI", ds: "10 ta savol — bilimingizni sinang",
  start(stage, api) { const qs = shuffle(QUIZ); return quizRun(api, { total: 10, per: 15, icon: "❓", qSize: 22, gen: (i) => ({ q: qs[i][0], opts: shuffle([qs[i][1], ...qs[i][2]]), ans: qs[i][1] }) }); },
});

/* 5) BAYROQNI TOP ---------------------------------------------------- */
const COUNTRIES = [["🇺🇿", "O'zbekiston", "Toshkent"], ["🇰🇿", "Qozog'iston", "Astana"], ["🇰🇬", "Qirg'iziston", "Bishkek"], ["🇹🇯", "Tojikiston", "Dushanbe"], ["🇹🇲", "Turkmaniston", "Ashxobod"], ["🇹🇷", "Turkiya", "Anqara"], ["🇷🇺", "Rossiya", "Moskva"], ["🇺🇸", "AQSh", "Vashington"], ["🇬🇧", "Britaniya", "London"], ["🇫🇷", "Fransiya", "Parij"], ["🇩🇪", "Germaniya", "Berlin"], ["🇮🇹", "Italiya", "Rim"], ["🇪🇸", "Ispaniya", "Madrid"], ["🇯🇵", "Yaponiya", "Tokio"], ["🇨🇳", "Xitoy", "Pekin"], ["🇰🇷", "Janubiy Koreya", "Seul"], ["🇮🇳", "Hindiston", "Dehli"], ["🇧🇷", "Braziliya", "Braziliya"], ["🇪🇬", "Misr", "Qohira"], ["🇸🇦", "Saudiya Arabistoni", "Ar-Riyod"], ["🇦🇪", "BAA", "Abu-Dabi"], ["🇨🇦", "Kanada", "Ottava"], ["🇦🇺", "Avstraliya", "Kanberra"], ["🇦🇿", "Ozarbayjon", "Boku"], ["🇵🇰", "Pokiston", "Islomobod"], ["🇦🇫", "Afg'oniston", "Kobul"], ["🇮🇷", "Eron", "Tehron"], ["🇺🇦", "Ukraina", "Kiyev"], ["🇦🇷", "Argentina", "Buenos-Ayres"], ["🇲🇽", "Meksika", "Mexiko"]];
G.add({
  id: "flags", ico: "🚩", nm: "Bayroqni top", cat: "brain", max: 150, tag: "YANGI", ds: "Bayroq qaysi davlatniki? 10 ta savol",
  start(stage, api) { const qs = shuffle(COUNTRIES); return quizRun(api, { total: 10, per: 15, icon: "🚩", qSize: 80, gen: (i) => ({ q: qs[i][0], opts: optsWith(qs[i][1], COUNTRIES.map((c) => c[1])), ans: qs[i][1], style: "font-size:15px" }) }); },
});

/* 6) POYTAXTLAR ------------------------------------------------------ */
G.add({
  id: "capitals", ico: "🏛️", nm: "Poytaxtlar", cat: "brain", max: 150, tag: "YANGI", ds: "Davlat poytaxtini toping. 10 ta savol",
  start(stage, api) { const qs = shuffle(COUNTRIES); return quizRun(api, { total: 10, per: 15, icon: "🏛️", qSize: 24, gen: (i) => ({ q: `${qs[i][0]} ${qs[i][1]}`, opts: optsWith(qs[i][2], COUNTRIES.map((c) => c[2])), ans: qs[i][2], style: "font-size:15px" }) }); },
});

/* 7) EMOJI TOPISHMOQ ------------------------------------------------- */
const EMOJI_RIDDLES = [["🌧️🌈", "Kamalak"], ["🐝🍯", "Asal"], ["🌙⭐", "Tun"], ["❄️⛄", "Qish"], ["☀️🏖️", "Yoz"], ["🍂🌧️", "Kuz"], ["🌸🌱", "Bahor"], ["🎂🎉", "Tug'ilgan kun"], ["⚽🥅", "Gol"], ["📚✏️", "Dars"], ["🍞🔥", "Non"], ["👨‍🍳🍲", "Oshpaz"], ["🚀🌕", "Kosmos"], ["🐄🥛", "Sut"], ["🌊🐟", "Dengiz"], ["🦷🪥", "Tish yuvish"], ["🎵🎤", "Qo'shiq"], ["📷🤳", "Selfi"], ["⏰😴", "Uyg'onish"], ["🔥🚒", "O't o'chiruvchi"], ["🏥💉", "Shifoxona"], ["✈️🧳", "Sayohat"], ["🌳🍎", "Bog'"], ["💍👰", "To'y"]];
G.add({
  id: "emoji", ico: "🤔", nm: "Emoji topishmoq", cat: "brain", max: 150, tag: "YANGI", ds: "Emojilar nimani bildiradi? 10 ta savol",
  start(stage, api) { const qs = shuffle(EMOJI_RIDDLES); return quizRun(api, { total: 10, per: 15, icon: "🤔", qSize: 60, gen: (i) => ({ q: qs[i][0], opts: optsWith(qs[i][1], EMOJI_RIDDLES.map((c) => c[1])), ans: qs[i][1], style: "font-size:16px" }) }); },
});

/* 8) RANG ALDOVI ----------------------------------------------------- */
G.add({
  id: "stroop", ico: "🎨", nm: "Rang aldovi", cat: "speed", max: 200, tag: "YANGI", ds: "So'z qaysi RANGDA yozilgan? (so'zning ma'nosiga qaramang) 30 soniya",
  start(stage, api) {
    const C = [["QIZIL", "#e74c3c"], ["YASHIL", "#2ecc71"], ["KO'K", "#3498db"], ["SARIQ", "#f1c40f"], ["PUSHTI", "#e84393"]];
    return quizRun(api, { mode: "time", seconds: 30, per: 6, icon: "🎨", penalty: 2, gen: () => {
      const w = pick(C), col = pick(C.filter((c) => c !== w));
      return { q: `<span style="color:${col[1]};font-size:46px">${w[0]}</span>`, opts: optsWith(col[0], C.map((c) => c[0])), ans: col[0], style: "font-size:15px" };
    } });
  },
});

/* 9) BOSHQASINI TOP -------------------------------------------------- */
G.add({
  id: "oddone", ico: "🔍", nm: "Boshqasini top", cat: "speed", max: 200, tag: "YANGI", ds: "Boshqalardan farq qiladigan emojini toping. 30 soniya",
  start(stage, api) {
    const PAIRS = [["😀", "😃"], ["🐶", "🐱"], ["🍏", "🍎"], ["⭐", "🌟"], ["🌑", "🌚"], ["😐", "😑"], ["🔵", "🟣"], ["🙂", "🙃"], ["🐻", "🐼"], ["🌕", "🌝"], ["❤️", "🧡"], ["🍋", "🍌"], ["⚽", "🏀"], ["😺", "😸"]];
    const bar = api.el("<i></i>", "bar"); const box = api.el("", "board"); box.style.maxWidth = "380px";
    let score = 0, left = 30;
    const round = () => {
      const n = Math.min(7, 3 + Math.floor(score / 3)), [a, b] = shuffle(pick(PAIRS)), odd = rnd(0, n * n - 1);
      box.style.gridTemplateColumns = `repeat(${n},1fr)`;
      box.innerHTML = Array.from({ length: n * n }, (_, i) => `<button class="cell" data-i="${i}" style="font-size:${Math.max(16, 40 - n * 3)}px">${i === odd ? b : a}</button>`).join("");
      box.querySelectorAll("button").forEach((c) => (c.onclick = () => { if (+c.dataset.i === odd) { score++; haptic(); round(); } else { left -= 2; haptic("bad"); } api.score(`🔍 ${score}`); }));
    };
    const tick = setInterval(() => { left -= 0.1; bar.firstChild.style.width = Math.max(0, (left / 30) * 100) + "%"; if (left <= 0) { clearInterval(tick); const rec = api.best(score); api.end({ icon: "🔍", title: rec ? "Yangi rekord!" : "Vaqt tugadi!", text: `Topilganlar: <b>${score}</b>`, coins: score * 8 }); } }, 100);
    round(); api.score("🔍 0");
    return () => clearInterval(tick);
  },
});

/* 10) RANG OVCHISI --------------------------------------------------- */
G.add({
  id: "colorhunt", ico: "🟪", nm: "Rang ovchisi", cat: "speed", max: 200, tag: "YANGI", ds: "Boshqalardan sal farq qiladigan katakni toping. 30 soniya",
  start(stage, api) {
    const bar = api.el("<i></i>", "bar"); const box = api.el("", "board"); box.style.maxWidth = "380px";
    let score = 0, left = 30;
    const round = () => {
      const n = Math.min(8, 2 + Math.floor(score / 2)), odd = rnd(0, n * n - 1), h = rnd(0, 359), s = rnd(50, 80), l = rnd(40, 60), d = Math.max(4, 22 - score);
      box.style.gridTemplateColumns = `repeat(${n},1fr)`;
      box.innerHTML = Array.from({ length: n * n }, (_, i) => `<button class="cell" data-i="${i}" style="background:hsl(${h},${s}%,${i === odd ? l + d : l}%)"></button>`).join("");
      box.querySelectorAll("button").forEach((c) => (c.onclick = () => { if (+c.dataset.i === odd) { score++; haptic(); round(); } else { left -= 2; haptic("bad"); } api.score(`🟪 ${score}`); }));
    };
    const tick = setInterval(() => { left -= 0.1; bar.firstChild.style.width = Math.max(0, (left / 30) * 100) + "%"; if (left <= 0) { clearInterval(tick); const rec = api.best(score); api.end({ icon: "🟪", title: rec ? "Yangi rekord!" : "Vaqt tugadi!", text: `Daraja: <b>${score}</b>`, coins: score * 7 }); } }, 100);
    round(); api.score("🟪 0");
    return () => clearInterval(tick);
  },
});

/* 11) SO'Z YASASH (ANAGRAMMA) ---------------------------------------- */
G.add({
  id: "anagram", ico: "🔀", nm: "So'z yasash", cat: "brain", max: 150, tag: "YANGI", ds: "Aralashgan harflardan so'z tuzing. 8 ta so'z",
  start(stage, api) {
    const words = shuffle(UZ_WORDS).slice(0, 8); let i = 0, ok = 0, built = [], letters;
    const hintEl = api.el("", "sub center"); const ans = api.el("", "big"); ans.style.fontSize = "28px"; ans.style.letterSpacing = "4px"; ans.style.minHeight = "48px";
    const box = api.el("", "board"); box.style.maxWidth = "400px";
    const ctr = api.el(`<button class="btn ghost" data-a="undo">↩️ Ortga</button><button class="btn ghost" data-a="skip">⏭ O'tkazish</button>`, "row");
    const load = () => {
      if (i >= words.length) { const rec = api.best(ok); return api.end({ icon: "🔀", title: rec ? "Yangi rekord!" : "Tugadi!", text: `Topilgan so'zlar: <b>${ok} / ${words.length}</b>`, coins: ok * 18 }); }
      const w = words[i][0]; let sh; do sh = shuffle([...w]); while (sh.join("") === w && w.length > 2);
      letters = sh.map((c, k) => ({ c, k, used: false })); built = []; hintEl.textContent = `💡 ${words[i][1]} (${i + 1}/${words.length})`; render(); api.score(`✅ ${ok}`);
    };
    const render = () => {
      ans.textContent = built.map((k) => letters[k].c).join("") || "…";
      box.style.gridTemplateColumns = `repeat(${Math.min(letters.length, 6)},1fr)`;
      box.innerHTML = letters.map((L, k) => `<button class="cell" data-k="${k}" style="font-size:22px;${L.used ? "opacity:.2" : ""}">${L.c}</button>`).join("");
      box.querySelectorAll("button").forEach((b) => (b.onclick = () => { const L = letters[+b.dataset.k]; if (L.used) return; L.used = true; built.push(L.k); haptic(); render(); check(); }));
    };
    const check = () => { if (built.length !== letters.length) return; const w = built.map((k) => letters[k].c).join(""); if (w === words[i][0]) { ok++; haptic("ok"); api.toast("✅ To'g'ri!"); i++; setTimeout(load, 400); } else { haptic("bad"); api.toast("❌ Qayta urinib ko'ring"); letters.forEach((L) => (L.used = false)); built = []; setTimeout(render, 300); } };
    ctr.querySelector('[data-a="undo"]').onclick = () => { const k = built.pop(); if (k != null) { letters[k].used = false; render(); } };
    ctr.querySelector('[data-a="skip"]').onclick = () => { api.toast(`So'z: ${words[i][0]}`); i++; load(); };
    load();
  },
});

/* 12) SON TOPISH ----------------------------------------------------- */
G.add({
  id: "guess", ico: "🔮", nm: "Son topish", cat: "brain", max: 150, tag: "YANGI", unit: " urinish", ds: "1 dan 100 gacha o'ylangan sonni 8 urinishda toping",
  start(stage, api) {
    const secret = rnd(1, 100); let tries = 0, lo = 1, hi = 100;
    const info = api.el("1 — 100", "big"); const msg = api.el("Sonni kiriting", "msg");
    const inp = api.el(`<input class="ans" type="number" inputmode="numeric" placeholder="?">`).firstChild;
    const go = api.el(`<button class="btn">Tekshirish</button>`).firstChild; go.parentElement.style.marginTop = "10px";
    const check = () => {
      const v = +inp.value; if (!v || v < 1 || v > 100) return api.toast("1 dan 100 gacha son kiriting"); tries++; inp.value = ""; api.score(`🔮 ${tries}/8`);
      if (v === secret) { const rec = api.best(tries, true); return api.end({ icon: "🔮", title: rec ? "Yangi rekord!" : "Topdingiz!", text: `Son: <b>${secret}</b> · ${tries} urinish`, coins: 170 - tries * 20 }); }
      if (v < secret) lo = Math.max(lo, v + 1); else hi = Math.min(hi, v - 1);
      const d = Math.abs(v - secret); msg.textContent = `${v < secret ? "⬆️ Kattaroq" : "⬇️ Kichikroq"} · ${d <= 3 ? "🔥 Juda issiq!" : d <= 10 ? "♨️ Issiq" : "❄️ Sovuq"}`; info.textContent = `${lo} — ${hi}`; haptic();
      if (tries >= 8) api.end({ icon: "😔", title: "Urinishlar tugadi", text: `Son: <b>${secret}</b> edi`, coins: 0 });
    };
    go.onclick = check; inp.onkeydown = (e) => e.key === "Enter" && check(); api.score("🔮 0/8");
  },
});

/* 13) STAKAN O'YINI -------------------------------------------------- */
G.add({
  id: "cups", ico: "🥤", nm: "Stakan o'yini", cat: "brain", max: 120, tag: "YANGI", ds: "Shar qaysi stakan ostida? Aralashtirishni kuzating. 5 raund",
  start(stage, api) {
    const area = api.el("", ""); area.style.position = "relative"; area.style.height = "160px"; area.style.margin = "30px 0";
    const msg = api.el("", "msg"); const go = api.el(`<button class="btn">▶️ Boshlash</button>`).firstChild;
    const W = api.width(), slots = [W * 0.17, W * 0.5, W * 0.83];
    let pos = [0, 1, 2], ball = 1, round = 0, ok = 0, busy = true, alive = true;
    area.innerHTML = [0, 1, 2].map((i) => `<div data-c="${i}" style="position:absolute;top:30px;left:0;font-size:64px;transition:transform .25s,top .25s;cursor:pointer;transform:translateX(${slots[i] - 32}px)">🥤</div>`).join("") + `<div id="ball" style="position:absolute;top:110px;font-size:30px;transition:transform .25s">🔴</div>`;
    const cups = [...area.querySelectorAll("[data-c]")], ballEl = area.querySelector("#ball");
    const place = () => { cups.forEach((c, i) => (c.style.transform = `translateX(${slots[pos[i]] - 32}px)`)); ballEl.style.transform = `translateX(${slots[pos[ball]] - 15}px)`; };
    const lift = (i, up) => (cups[i].style.top = up ? "-20px" : "30px");
    const play = async () => {
      busy = true; go.style.display = "none"; round++; api.score(`🥤 ${ok}/${round - 1}`); msg.textContent = "👀 Shar shu yerda...";
      ballEl.style.opacity = 1; lift(ball, true); await sleep(900); lift(ball, false); await sleep(350); ballEl.style.opacity = 0;
      const n = 5 + round * 2, sp = Math.max(130, 330 - round * 40);
      for (let k = 0; k < n && alive; k++) { const a = rnd(0, 2); let b = rnd(0, 2); if (a === b) b = (b + 1) % 3; const ia = pos.indexOf(a), ib = pos.indexOf(b); [pos[ia], pos[ib]] = [pos[ib], pos[ia]]; cups.forEach((c) => (c.style.transition = `transform ${sp}ms`)); place(); await sleep(sp + 30); }
      msg.textContent = "Qaysi stakan?"; busy = false;
    };
    cups.forEach((c, i) => (c.onclick = async () => {
      if (busy) return; busy = true; lift(i, true); ballEl.style.opacity = 1; lift(ball, true);
      if (i === ball) { ok++; haptic("ok"); msg.textContent = "✅ To'g'ri!"; } else { haptic("bad"); msg.textContent = "❌ Noto'g'ri"; }
      await sleep(1100); lift(i, false); lift(ball, false);
      if (round >= 5) { return api.end({ icon: "🥤", title: ok >= 4 ? "Zo'r ko'z!" : "Tugadi", text: `To'g'ri: <b>${ok} / 5</b>`, coins: ok * 24 }); }
      play();
    }));
    place(); ballEl.style.opacity = 0; go.onclick = play; msg.textContent = "Tayyormisiz?";
    return () => (alive = false);
  },
});

/* 14) RAQAM XOTIRASI ------------------------------------------------- */
G.add({
  id: "numbermem", ico: "🔢", nm: "Raqam xotirasi", cat: "brain", max: 150, tag: "YANGI", unit: " xona", ds: "Ko'rsatilgan sonni eslab qoling va yozing. Har safar uzunroq",
  start(stage, api) {
    let len = 3, alive = true; const show = api.el("", "big"); show.style.letterSpacing = "6px"; const msg = api.el("", "msg");
    const inp = api.el(`<input class="ans" type="tel" inputmode="numeric" placeholder="Javob">`).firstChild;
    const go = api.el(`<button class="btn">Tekshirish</button>`).firstChild; go.parentElement.style.marginTop = "10px";
    let num = "", phase = "show";
    const round = async () => {
      phase = "show"; num = Array.from({ length: len }, () => rnd(0, 9)).join(""); if (num[0] === "0") num = "1" + num.slice(1);
      show.textContent = num; inp.style.visibility = go.style.visibility = "hidden"; msg.textContent = "👀 Eslab qoling!"; api.score(`🔢 ${len - 3}`);
      await sleep(900 + len * 450); if (!alive) return;
      show.textContent = "?".repeat(len); inp.value = ""; inp.style.visibility = go.style.visibility = "visible"; inp.focus(); msg.textContent = "Endi yozing"; phase = "input";
    };
    const check = () => {
      if (phase !== "input") return;
      if (inp.value.trim() === num) { haptic("ok"); len++; round(); }
      else { const s = len - 3; const rec = api.best(len - 1); api.end({ icon: "🔢", title: rec ? "Yangi rekord!" : "Xato!", text: `To'g'ri javob: <b>${num}</b><br>Eslab qolingan: <b>${len - 1} xona</b>`, coins: s * 20 }); phase = "end"; }
    };
    go.onclick = check; inp.onkeydown = (e) => e.key === "Enter" && check();
    round();
    return () => (alive = false);
  },
});

/* 15) TEZ YOZISH ----------------------------------------------------- */
G.add({
  id: "typing", ico: "⌨️", nm: "Tez yozish", cat: "speed", max: 200, tag: "YANGI", ds: "Ko'rsatilgan so'zni tez yozing. 40 soniya",
  start(stage, api) {
    const W = UZ_WORDS.map((w) => w[0].toLowerCase()).concat(["salom", "do'st", "kitob", "maktab", "ona", "vatan", "bahor", "ilm", "baxt", "tinchlik", "mehnat", "oila"]);
    const bar = api.el("<i></i>", "bar"); const show = api.el("", "big"); const inp = api.el(`<input class="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="shu yerga yozing">`).firstChild;
    let cur = pick(W), ok = 0, chars = 0, left = 40;
    show.textContent = cur; inp.focus();
    inp.oninput = () => { const v = inp.value.trim().toLowerCase(); inp.style.borderColor = cur.startsWith(v) ? "var(--accent)" : "var(--bad)"; if (v === cur) { ok++; chars += cur.length; haptic(); cur = pick(W); show.textContent = cur; inp.value = ""; api.score(`⌨️ ${ok}`); } };
    const tick = setInterval(() => { left -= 0.1; bar.firstChild.style.width = Math.max(0, (left / 40) * 100) + "%"; if (left <= 0) { clearInterval(tick); inp.blur(); const cpm = Math.round(chars * 1.5); const rec = api.best(ok); api.end({ icon: "⌨️", title: rec ? "Yangi rekord!" : "Vaqt tugadi!", text: `So'zlar: <b>${ok}</b><br>Tezlik: ~${cpm} belgi/daqiqa`, coins: ok * 10 }); } }, 100);
    api.score("⌨️ 0");
    return () => clearInterval(tick);
  },
});

/* 16) REAKSIYA ------------------------------------------------------- */
G.add({
  id: "reaction", ico: "⚡", nm: "Reaksiya", cat: "speed", max: 100, unit: " ms", ds: "Ekran yashil bo'lishi bilan bosing. 5 urinish",
  start(stage, api) {
    const box = api.el("Boshlash uchun bosing", "");
    Object.assign(box.style, { height: "52vh", minHeight: "280px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "800", textAlign: "center", padding: "20px", background: "var(--card)", cursor: "pointer" });
    const list = api.el("", "msg"); let state = "idle", times = [], start = 0, to;
    const set = (bg, txt, col = "#fff") => { box.style.background = bg; box.style.color = col; box.innerHTML = txt; };
    const wait = () => { state = "wait"; set("#c0392b", "Kuting..."); to = setTimeout(() => { state = "go"; set("#2ecc71", "BOSING!"); start = performance.now(); haptic("medium"); }, 1200 + Math.random() * 2800); };
    box.addEventListener("pointerdown", () => {
      if (state === "idle" || state === "show") return wait();
      if (state === "wait") { clearTimeout(to); state = "show"; set("#ffc048", "Juda erta! 😅<br><small>Qayta bosing</small>", "#222"); haptic("bad"); return; }
      if (state === "go") {
        const ms = Math.round(performance.now() - start); times.push(ms); list.textContent = times.map((x) => x + " ms").join(" · "); api.score(`${times.length}/5`);
        if (times.length >= 5) { state = "end"; const avg = Math.round(times.reduce((a, b) => a + b) / 5); const rec = api.best(avg, true);
          return api.end({ icon: "⚡", title: rec ? "Yangi rekord!" : avg < 280 ? "Juda tez!" : "Yaxshi", text: `O'rtacha: <b>${avg} ms</b>`, coins: avg < 230 ? 100 : avg < 280 ? 70 : avg < 350 ? 45 : 20 }); }
        state = "show"; set("var(--card)", `${ms} ms<br><small>Keyingisi uchun bosing</small>`, "var(--text)");
      }
    });
    api.score("0/5");
    return () => clearTimeout(to);
  },
});

/* 17) TEZ BARMOQ ----------------------------------------------------- */
G.add({
  id: "tapper", ico: "👆", nm: "Tez barmoq", cat: "speed", max: 120, tag: "YANGI", ds: "10 soniyada tugmani iloji boricha ko'p bosing!",
  start(stage, api) {
    const bar = api.el("<i></i>", "bar"); const big = api.el("0", "big"); big.style.fontSize = "64px";
    const btn = api.el(`<button class="btn" style="height:200px;font-size:30px;border-radius:50%;width:200px;display:block;margin:0 auto">👆 BOS!</button>`).firstChild;
    let n = 0, left = 10, started = false, tick;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault(); if (left <= 0) return;
      if (!started) { started = true; tick = setInterval(() => { left -= 0.05; bar.firstChild.style.width = Math.max(0, left * 10) + "%"; if (left <= 0) { clearInterval(tick); const rec = api.best(n); api.end({ icon: "👆", title: rec ? "Yangi rekord!" : "Vaqt tugadi!", text: `Bosishlar: <b>${n}</b> (${(n / 10).toFixed(1)}/s)`, coins: n * 1.2 }); } }, 50); }
      n++; big.textContent = n; haptic(); btn.style.transform = `scale(${0.94 + Math.random() * 0.04})`; setTimeout(() => (btn.style.transform = ""), 60);
    });
    return () => clearInterval(tick);
  },
});

/* 18) TOSH-QAYCHI-QOG'OZ --------------------------------------------- */
G.add({
  id: "rps", ico: "✊", nm: "Tosh-qaychi-qog'oz", cat: "brain", max: 80, tag: "YANGI", ds: "Botga qarshi — 3 g'alabagacha",
  start(stage, api) {
    const N = { r: "✊", s: "✌️", p: "✋" }, BEAT = { r: "s", s: "p", p: "r" }; let me = 0, bot = 0, hist = [];
    const view = api.el("❔ vs ❔", "big"); view.style.fontSize = "56px"; const msg = api.el("Tanlang!", "msg");
    const opts = api.el(Object.entries(N).map(([k, e]) => `<button data-k="${k}" style="font-size:40px">${e}</button>`).join(""), "opts"); opts.style.gridTemplateColumns = "repeat(3,1fr)";
    opts.querySelectorAll("button").forEach((b) => (b.onclick = () => {
      if (me >= 3 || bot >= 3) return;
      const k = b.dataset.k; // bot foydalanuvchining sevimli tanlovini kuzatadi
      const fav = hist.length > 2 ? ["r", "s", "p"].sort((a, c) => hist.filter((x) => x === c).length - hist.filter((x) => x === a).length)[0] : null;
      const bk = fav && Math.random() < 0.4 ? Object.keys(BEAT).find((x) => BEAT[x] === fav) : pick(["r", "s", "p"]); hist.push(k);
      view.textContent = `${N[k]} vs ${N[bk]}`;
      if (k === bk) msg.textContent = "🤝 Durang"; else if (BEAT[k] === bk) { me++; msg.textContent = "✅ Raund sizniki!"; haptic("ok"); } else { bot++; msg.textContent = "🤖 Raund botniki"; haptic("bad"); }
      api.score(`${me} : ${bot}`);
      if (me >= 3 || bot >= 3) setTimeout(() => api.end({ icon: me >= 3 ? "🏆" : "🤖", title: me >= 3 ? "Siz yutdingiz!" : "Bot yutdi", text: `Hisob: <b>${me} : ${bot}</b>`, coins: me >= 3 ? 80 : me * 10 }), 600);
    }));
    api.score("0 : 0");
  },
});
