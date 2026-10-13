/* =========================================================================
   GAMES – Word Rain, 60s Sprint and Letter Hunt.
   Every round has a seed. A challenge link carries the seed + score, so a
   classmate plays exactly the same words and tries to beat you.
   ========================================================================= */

const GAMES = {
  rain:    { name: 'Dážď slov',   unit: 'bodov', desc: 'Slová padajú z neba. Napíš ich skôr, ako dopadnú. Máš 3 životy.' },
  sprint:  { name: 'Šprint 60 s', unit: 'úhozov/min', desc: 'Minúta naplno. Koľko úhozov za minútu dáš bez chýb?' },
  letters: { name: 'Lov písmen',  unit: 'bodov', desc: '30 písmen sa objaví na obrazovke. Stlač ich čo najrýchlejšie.' },
};

const Games = (() => {
  let stage, onKey, current = null;

  function encodeChallenge(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeChallenge(s) {
    try { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))); }
    catch (e) { return null; }
  }
  const newSeed = () => Math.floor(Math.random() * 1e9);

  /** setKeyHandler: function the app calls on keydown while a game runs */
  function init(stageEl, setKeyHandler) { stage = stageEl; onKey = setKeyHandler; }

  function stop() {
    if (current && current.cleanup) current.cleanup();
    current = null;
    onKey(null);
  }

  /** Show the intro card for a game. */
  function intro(id, seed = newSeed(), challenge = null) {
    stop();
    const g = GAMES[id];
    stage.innerHTML = `
      <div class="game-intro">
        ${PICTOS[id]}
        <h2>${g.name}</h2>
        <p class="muted">${g.desc}</p>
        ${challenge ? `<div class="challenge"><p class="label">Výzva</p><b>${escapeHtml(challenge.n)}</b> ťa vyzýva: prekonaj <b>${challenge.p}</b> ${g.unit}.</div>` : ''}
        <button class="cta big" id="g-go">${icon('play')} Štart <kbd>Enter</kbd></button>
      </div>`;
    const go = () => run(id, seed, challenge);
    stage.querySelector('#g-go').onclick = go;
    onKey(e => { if (e.key === 'Enter') { go(); return true; } return false; });
  }

  function run(id, seed, challenge) {
    stop();
    const rng = makeRng(seed);
    const finish = score => end(id, seed, challenge, score);
    current = { rain: runRain, sprint: runSprint, letters: runLetters }[id](rng, finish);
  }

  /* ---------------- results ---------------- */
  function end(id, seed, challenge, result) {
    stop();
    const g = GAMES[id];
    const rank = Store.addScore(id, result.score, { seed });
    const link = location.href.split('#')[0] + '#v=' + encodeChallenge({ g: id, s: seed, n: Store.data.player || 'Hráč', p: result.score });
    let verdict = '';
    if (challenge) {
      verdict = result.score > challenge.p
        ? `<div class="verdict win">Porazil/a si hráča ${escapeHtml(challenge.n)} (${challenge.p}).</div>`
        : result.score === challenge.p
          ? `<div class="verdict">Remíza s hráčom ${escapeHtml(challenge.n)}.</div>`
          : `<div class="verdict lose">${escapeHtml(challenge.n)} vedie (${challenge.p}). Skús to znova.</div>`;
    }
    stage.innerHTML = `
      <div class="game-intro">
        <p class="label">${g.name} — výsledok</p>
        <div class="score-big">${result.score}</div>
        <div class="score-unit">${g.unit}</div>
        <p class="muted">${result.detail || ''}</p>
        ${verdict}
        ${rank && rank <= 10 ? `<p>Si <b>${rank}.</b> v rebríčku na tomto počítači.</p>` : ''}
        <div class="row center">
          <button class="primary" id="g-again">${icon('restart')} Hrať znova</button>
          <button id="g-same">Tie isté slová</button>
          <button id="g-share" class="cta">${icon('copy')} Skopírovať výzvu</button>
        </div>
        <p class="muted small" id="g-share-msg">Pošli výzvu spolužiakom – zahrajú si presne tie isté slová.</p>
      </div>`;
    stage.querySelector('#g-again').onclick = () => run(id, newSeed(), null);
    stage.querySelector('#g-same').onclick = () => run(id, seed, challenge);
    stage.querySelector('#g-share').onclick = async () => {
      const msg = stage.querySelector('#g-share-msg');
      try { await navigator.clipboard.writeText(link); msg.textContent = 'Skopírované! Vlož odkaz spolužiakom do chatu.'; }
      catch (e) { msg.innerHTML = `Skopíruj odkaz: <input class="share-input" value="${escapeHtml(link)}" readonly>`; msg.querySelector('input').select(); }
    };
    onKey(e => { if (e.key === 'Enter') { run(id, newSeed(), null); return true; } return false; });
    App.refreshBoards && App.refreshBoards();
  }

  /* ---------------- 1) WORD RAIN ---------------- */
  function runRain(rng, finish) {
    stage.innerHTML = `
      <div class="hud"><span>Životy ${icon('heart')} <b id="r-lives">3</b></span><span>Skóre <b id="r-score">0</b></span><span>Kombo <b id="r-combo">×1</b></span><span>Úroveň <b id="r-level">1</b></span></div>
      <div class="rain" id="rain"><div class="ground"></div></div>`;
    const field = stage.querySelector('#rain');
    const $ = id => stage.querySelector(id);
    const pool = SK_WORDS.filter(w => w.length >= 2 && w.length <= 10);
    let words = [], target = null, lives = 3, score = 0, combo = 0, typedChars = 0, wrong = 0;
    let last = performance.now(), spawnIn = 0, elapsed = 0, raf, done = false;

    function spawn() {
      const level = 1 + Math.floor(elapsed / 20);
      const maxLen = Math.min(10, 4 + level);
      const options = pool.filter(w => w.length <= maxLen);
      const text = pick(options, rng);
      const el = document.createElement('div');
      el.className = 'drop';
      el.innerHTML = `<span class="done"></span><span class="rest">${escapeHtml(text)}</span>`;
      field.appendChild(el);
      const x = 4 + rng() * 78;
      el.style.left = x + '%';
      words.push({ text, el, y: -30, typed: 0, speed: 28 + level * 7 + rng() * 10 });
    }
    function paint(w) {
      w.el.firstChild.textContent = w.text.slice(0, w.typed);
      w.el.lastChild.textContent = w.text.slice(w.typed);
    }
    function remove(w, cls) {
      words = words.filter(x => x !== w);
      if (target === w) target = null;
      w.el.classList.add(cls);
      setTimeout(() => w.el.remove(), 400);
    }
    function tick(now) {
      if (done) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now; elapsed += dt;
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.75, 2.2 - elapsed / 45); }
      const h = field.clientHeight - 34;
      for (const w of words.slice()) {
        w.y += w.speed * dt;
        w.el.style.transform = `translateY(${w.y}px)`;
        if (w.y > h) {
          remove(w, 'splash'); lives--; combo = 0; Sound.error();
          field.classList.remove('hurt'); void field.offsetWidth; field.classList.add('hurt');
          if (lives <= 0) return over();
        }
      }
      $('#r-lives').textContent = lives;
      $('#r-score').textContent = score;
      $('#r-combo').textContent = '×' + (1 + Math.floor(combo / 5));
      $('#r-level').textContent = 1 + Math.floor(elapsed / 20);
      raf = requestAnimationFrame(tick);
    }
    function over() {
      done = true; cancelAnimationFrame(raf);
      const acc = typedChars + wrong ? Math.round(typedChars / (typedChars + wrong) * 1000) / 10 : 100;
      finish({ score, detail: `Čas ${Math.round(elapsed)} s · presnosť ${acc} %` });
    }
    onKey(e => {
      if (e.key.length !== 1 || done) return false;
      if (!target) {
        // lock onto the lowest word that starts with this letter
        const cands = words.filter(w => w.text[0] === e.key).sort((a, b) => b.y - a.y);
        target = cands[0] || null;
        if (target) target.el.classList.add('locked');
      }
      if (target && target.text[target.typed] === e.key) {
        target.typed++; typedChars++; paint(target); Sound.key();
        if (target.typed === target.text.length) {
          combo++;
          score += target.text.length * 10 * (1 + Math.floor(combo / 5));
          Sound.pop();
          remove(target, 'boom');
        }
      } else {
        wrong++; combo = 0; Sound.error();
        if (target) { target.el.classList.remove('shake'); void target.el.offsetWidth; target.el.classList.add('shake'); }
      }
      return true;
    });
    raf = requestAnimationFrame(t => { last = t; tick(t); });
    return { cleanup() { done = true; cancelAnimationFrame(raf); } };
  }

  /* ---------------- 2) SPRINT 60 s ---------------- */
  function runSprint(rng, finish) {
    stage.innerHTML = `
      <div class="hud"><span>Zostáva <b id="s-time">60</b> s</span><span>Úhozy/min <b id="s-cpm">0</b></span><span>Presnosť <b id="s-acc">100</b>%</span></div>
      <div class="text sprint-text" id="s-text"></div>
      <p class="hint muted">Časomiera sa spustí prvým úderom. Pri chybe musíš stlačiť správnu klávesu.</p>`;
    const sentences = shuffle(SK_SENTENCES, rng);
    const extra = shuffle(SK_WORDS, rng).slice(0, 120).join(' ');
    const text = sentences.join(' ') + ' ' + extra;
    let timer, ended = false;
    const session = new TypingSession({
      text, textEl: stage.querySelector('#s-text'), getMode: () => 'stop',
      onProgress: s => {
        stage.querySelector('#s-acc').textContent = s.acc;
        if (s.sec > 0 && !timer) timer = setInterval(tickTime, 100);
      },
      onFinish: () => stopAt(),
    });
    function tickTime() {
      const sec = (performance.now() - session.start) / 1000;
      stage.querySelector('#s-time').textContent = Math.max(0, Math.ceil(60 - sec));
      stage.querySelector('#s-cpm').textContent = Math.round(session.pos / Math.max(sec, 1) * 60);
      if (sec >= 60) stopAt();
    }
    function stopAt() {
      if (ended) return; ended = true;
      clearInterval(timer);
      const sec = Math.min(60, (performance.now() - session.start) / 1000);
      const cpm = Math.round(session.pos / sec * 60);
      const acc = session.presses ? Math.round((session.presses - session.wrong) / session.presses * 1000) / 10 : 100;
      session.finished = true;
      finish({ score: cpm, detail: `${session.pos} znakov · ${session.wrong} chýb · presnosť ${acc} %` });
    }
    onKey(e => session.handleKey(e));
    return { cleanup() { ended = true; clearInterval(timer); } };
  }

  /* ---------------- 3) LETTER HUNT ---------------- */
  function runLetters(rng, finish) {
    const TOTAL = 30;
    const alphabet = 'asdfghjklqwertzuiopyxcvbnm'.split('').concat(['á', 'é', 'í', 'š', 'č', 'ž', 'ý', 'ô', 'ľ', 'ť']);
    const seq = Array.from({ length: TOTAL }, () => ({ ch: pick(alphabet, rng), x: 8 + rng() * 80, y: 10 + rng() * 65 }));
    stage.innerHTML = `
      <div class="hud"><span>Písmeno <b id="l-n">0</b>/${TOTAL}</span><span>Skóre <b id="l-score">0</b></span><span>Reakcia <b id="l-ms">—</b> ms</span></div>
      <div class="hunt" id="hunt"><div class="countdown">3</div></div>`;
    const field = stage.querySelector('#hunt');
    let i = -1, shown = 0, score = 0, totalMs = 0, misses = 0, started = false, waiting = false, timeouts = [];

    function next() {
      i++;
      if (i >= TOTAL) {
        return finish({ score, detail: `Priemerná reakcia ${Math.round(totalMs / TOTAL)} ms · ${misses} chýb` });
      }
      field.innerHTML = '';
      const el = document.createElement('div');
      el.className = 'target-letter';
      el.textContent = seq[i].ch;
      el.style.left = seq[i].x + '%'; el.style.top = seq[i].y + '%';
      field.appendChild(el);
      shown = performance.now();
    }
    // countdown 3-2-1
    [2, 1].forEach((n, k) => timeouts.push(setTimeout(() => { field.firstChild.textContent = n; }, (k + 1) * 700)));
    timeouts.push(setTimeout(() => { started = true; next(); }, 2100));

    onKey(e => {
      if (!started || waiting || e.key.length !== 1 || i >= TOTAL) return true;
      const cur = seq[i];
      if (e.key === cur.ch) {
        waiting = true;
        const ms = performance.now() - shown;
        totalMs += ms;
        score += Math.max(10, Math.round((1500 - ms) / 10));
        stage.querySelector('#l-ms').textContent = Math.round(ms);
        stage.querySelector('#l-score').textContent = score;
        stage.querySelector('#l-n').textContent = i + 1;
        const el = field.querySelector('.target-letter'); if (el) el.classList.add('boom');
        Sound.pop();
        timeouts.push(setTimeout(() => { waiting = false; next(); }, 120));
      } else {
        misses++; score = Math.max(0, score - 20); Sound.error();
        const el = field.querySelector('.target-letter');
        if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
        stage.querySelector('#l-score').textContent = score;
      }
      return true;
    });
    return { cleanup() { timeouts.forEach(clearTimeout); } };
  }

  return { init, intro, stop, decodeChallenge };
})();
