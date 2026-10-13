/* =========================================================================
   APP – navigation, views, practice screen.
   ========================================================================= */
const App = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  let keyHandler = null;     // current receiver of keystrokes (practice or game)
  let session = null;
  let practiceCtx = null;    // what we are practising (for "again" / "next lesson")
  let returnView = 'lessons';

  /* ---------------- navigation ---------------- */
  function show(view) {
    if (view !== 'games') Games.stop();
    if (view !== 'practice') { session = null; keyHandler = null; }
    $$('.view').forEach(v => (v.hidden = v.id !== 'view-' + view));
    $$('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    document.body.dataset.view = view;
    ({ home: renderHome, lessons: renderLessons, words: renderWords, review: renderReview, games: renderGames, stats: () => Stats.render($('#view-stats')) }[view] || (() => {}))();
    window.scrollTo(0, 0);
  }

  /* ---------------- header controls ---------------- */
  function renderMode() {
    $$('.seg [data-mode]').forEach(b => {
      const on = b.dataset.mode === Store.data.settings.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    $('#sound').innerHTML = icon(Store.data.settings.sound ? 'volume' : 'volume-off');
    $('#sound').title = Store.data.settings.sound ? 'Vypnúť zvuk' : 'Zapnúť zvuk';
    $('#theme').innerHTML = icon(isDark() ? 'sun' : 'moon');
    $('#player').innerHTML = `${icon('user')}<span>${escapeHtml(Store.data.player || 'Zadaj meno')}</span>`;
  }
  function setMode(mode) {
    Store.data.settings.mode = mode;
    Store.save(); renderMode();
    if (session) session.update();
  }
  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };
  function toggleTheme() {
    const t = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    Store.data.settings.theme = t; Store.save(); renderMode();
  }

  function askName(then) {
    const dlg = $('#name-dialog');
    const input = $('#name-input');
    input.value = Store.data.player;
    dlg.showModal();
    input.focus();
    $('#name-form').onsubmit = e => {
      e.preventDefault();
      const v = input.value.trim().slice(0, 20);
      if (!v) return;
      Store.data.player = v; Store.save(); renderMode(); dlg.close();
      then && then();
    };
  }

  /* ---------------- HOME ---------------- */
  function nextLessonIndex() {
    const i = LESSONS.findIndex((_, k) => !Store.data.lessonBest[k]);
    return i === -1 ? LESSONS.length - 1 : i;
  }
  function renderHome() {
    const s = Stats.summary();
    const n = nextLessonIndex();
    const name = Store.data.player;
    $('#home-greet').textContent = name ? `Ahoj, ${name}` : 'Trenažér písania všetkými desiatimi';
    $('#home-next').innerHTML = `Ďalej: <b>Lekcia ${LESSONS[n].n}</b> — ${escapeHtml(LESSONS[n].title)}`;
    $('#home-next-btn').onclick = () => startLesson(n);
    $('#home-tiles').innerHTML = figures([
      ['Séria', s.streak, daysWord(s.streak) + ' v rade'],
      ['Najlepšie', s.best, 'úhozov/min'],
      ['Presnosť', s.count ? s.avgAcc + '%' : '—', 'posledných 10'],
      ['Lekcie', `${s.lessonsDone}/${LESSONS.length}`, 'dokončené'],
    ]);
    const missed = Exercises.missedWords().length;
    const weak = Exercises.weakKeys(4);
    $('#home-review').innerHTML = missed || weak.length
      ? `<p>Máš <b>${missed}</b> slov na zopakovanie${weak.length ? ` a slabé klávesy ${weak.map(k => `<kbd>${escapeHtml(k.ch)}</kbd>`).join(' ')}` : ''}.</p>
         <button class="primary" data-go="review">Zopakovať chyby ${icon('arrow-right')}</button>`
      : '<p class="muted">Zatiaľ nemáš čo opakovať. Keď spravíš chyby, nájdeš ich tu.</p>';
    bindGo($('#home-review'));
  }

  /* ---------------- LESSONS ---------------- */
  // "ý" over "ý" says nothing – letter-only lessons get a descriptive card title
  const cardTitle = l => (l.keys && l.title === [...l.keys].join(', ') ? (l.keys.length > 1 ? 'Nové písmená' : 'Nové písmeno') : l.title);
  function renderLessons() {
    const next = nextLessonIndex();
    $('#lesson-grid').innerHTML = LESSONS.map((l, i) => {
      const best = Store.data.lessonBest[i];
      const keys = l.show || (l.keys ? [...l.keys].join(' ') : 'všetko doteraz');
      return `<button class="lesson ${best ? 'done' : ''} ${i === next ? 'next' : ''}" data-i="${i}">
        <span class="n"><span>${String(l.n).padStart(2, '0')}</span>${i === next ? '<span class="tag acc">Ďalšia</span>' : ''}</span>
        <span class="t">${escapeHtml(cardTitle(l))}</span>
        <span class="keys">${escapeHtml(keys)}</span>
        <span class="best">${best ? `${icon('check')} ${best.cpm} úhozov/min · ${best.acc}%` : ''}</span>
      </button>`;
    }).join('');
    $$('#lesson-grid .lesson').forEach(b => (b.onclick = () => startLesson(+b.dataset.i)));
  }
  function startLesson(i) {
    startPractice({ kind: 'lesson', ref: i, title: `Lekcia ${LESSONS[i].n}: ${LESSONS[i].title}`, make: () => Exercises.lessonText(i) }, 'lessons');
  }

  /* ---------------- WORDS ---------------- */
  const wordLines = () => Store.data.settings.wordLines || 3;
  function setLines(n) {
    Store.data.settings.wordLines = Math.max(1, Math.min(50, Math.round(n) || 3));
    Store.save(); renderLinesBar();
  }
  function renderLinesBar() {
    const n = wordLines();
    const preset = [1, 3, 5, 10].includes(n);
    $$('[data-lines]').forEach(b => { const on = +b.dataset.lines === n; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const input = $('#lines-custom');
    if (document.activeElement !== input) input.value = preset ? '' : n;
    input.classList.toggle('on', !preset);
  }
  function renderWords() {
    renderLinesBar();
    const best = {};
    for (const h of Store.data.history) if (h.kind === 'words' && (!best[h.ref] || h.cpm > best[h.ref].cpm)) best[h.ref] = h;
    $('#words-grid').innerHTML = LESSONS.map((l, i) => {
      const { words } = Exercises.wordPool(i);
      const real = words.length >= 6;
      const sample = Exercises.wordsText(i, 1).split(' ').slice(0, 7).join(' ');
      const b = best[i];
      return `<button class="lesson ${b ? 'done' : ''}" data-i="${i}">
        <span class="n"><span>${String(l.n).padStart(2, '0')}</span><span>${real ? words.length + ' slov' : ''}</span></span>
        <span class="t">${escapeHtml(cardTitle(l))}</span>
        <span class="sample">${escapeHtml(sample)}</span>
        <span class="best">${b ? `${icon('check')} ${b.cpm} úhozov/min · ${b.acc}%` : ''}</span>
      </button>`;
    }).join('');
    $$('#words-grid .lesson').forEach(b => (b.onclick = () => startWords(+b.dataset.i)));
  }
  function startWords(i) {
    const n = wordLines();
    startPractice({
      kind: 'words', ref: i, title: `Slová ${LESSONS[i].n}: ${LESSONS[i].title} · ${n} ${n === 1 ? 'riadok' : n <= 4 ? 'riadky' : 'riadkov'}`,
      make: () => Exercises.wordsText(i, wordLines()),
    }, 'words');
  }

  /* ---------------- REVIEW ---------------- */
  function renderReview() {
    const missed = Exercises.missedWords();
    $('#rev-missed-info').innerHTML = missed.length
      ? `<b>${missed.length}</b> slov, napr. <i>${missed.slice(0, 6).map(escapeHtml).join(', ')}</i>`
      : 'Zatiaľ žiadne chybné slová.';
    $('#rev-missed').disabled = !missed.length;
    const weak = Exercises.weakKeys();
    $('#rev-weak-info').innerHTML = weak.length
      ? weak.map(k => `<span class="chip"><b>${escapeHtml(k.ch)}</b><span>${Math.round(k.rate * 100)}%</span></span>`).join('')
      : '<p class="muted">Potrebujeme viac údajov – napíš pár cvičení.</p>';
    $('#rev-weak').disabled = !weak.length;
    renderLists();
  }

  function renderLists(selectId) {
    const sel = $('#saved-lists');
    const lists = Store.data.customLists;
    sel.innerHTML = '<option value="">— Nový zoznam —</option>' + lists.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
    if (selectId) sel.value = selectId;
  }
  function loadList() {
    const l = Store.data.customLists.find(x => x.id === $('#saved-lists').value);
    $('#list-name').value = l ? l.name : '';
    $('#custom-text').value = l ? l.text : '';
  }
  function saveList() {
    const name = $('#list-name').value.trim() || 'Môj zoznam';
    const text = $('#custom-text').value.trim();
    if (!text) return;
    let l = Store.data.customLists.find(x => x.id === $('#saved-lists').value);
    if (l) { l.name = name; l.text = text; }
    else { l = { id: 'l' + Date.now(), name, text }; Store.data.customLists.push(l); }
    Store.save(); renderLists(l.id);
  }
  function deleteList() {
    const id = $('#saved-lists').value;
    if (!id) return;
    const l = Store.data.customLists.find(x => x.id === id);
    if (!confirm(`Vymazať zoznam „${l.name}“?`)) return;
    Store.data.customLists = Store.data.customLists.filter(x => x.id !== id);
    Store.save(); renderLists(); loadList();
  }
  async function readPhotos(files) {
    if (!files.length) return;
    const btn = $('#ocr-btn'), box = $('#ocr-status'), msg = $('#ocr-msg'), bar = $('#ocr-bar');
    btn.disabled = true;
    box.hidden = false; box.className = 'ocr-status';
    const status = (text, f) => { msg.textContent = text; bar.style.width = Math.round(f * 100) + '%'; };
    try {
      const text = await Ocr.read(files, status);
      if (!text) throw new Error('empty');
      const area = $('#custom-text');
      area.value = (area.value.trim() ? area.value.trim() + '\n' : '') + text;
      box.classList.add('done');
      msg.textContent = 'Hotovo. Skontroluj text (opravy, čísla cvičení) a klikni Uložiť.';
      area.focus();
    } catch (err) {
      box.classList.add('error');
      msg.textContent = err.message === 'lib'
        ? 'Rozpoznávanie sa nepodarilo načítať. Prvýkrát treba internet.'
        : 'Na fotke sa nepodarilo nájsť text. Skús ostrejšiu fotku, odfotenú zhora a bez tieňa.';
    } finally {
      btn.disabled = false;
    }
  }

  function startCustom() {
    const text = $('#custom-text').value;
    if (!text.trim()) { $('#custom-text').focus(); return; }
    const opts = { shuffle: $('#opt-shuffle').checked, repeat: Math.max(1, +$('#opt-repeat').value || 1), max: Math.max(5, +$('#opt-max').value || 60) };
    const name = $('#list-name').value.trim() || 'Vlastný text';
    startPractice({ kind: 'custom', ref: name, title: name, make: () => Exercises.customText(text, opts) }, 'review');
  }

  /* ---------------- GAMES ---------------- */
  function renderGames() {
    $('#game-cards').innerHTML = Object.entries(GAMES).map(([id, g], i) => `
      <button class="game-card" data-game="${id}">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>${PICTOS[id]}
        <span class="t">${g.name}</span><span class="muted">${g.desc}</span>
      </button>`).join('');
    $$('#game-cards .game-card').forEach(b => (b.onclick = () => openGame(b.dataset.game)));
    refreshBoards();
  }
  function openGame(id, seed, challenge) {
    const go = () => {
      $('#game-stage').hidden = false;
      $('#game-stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
      Games.intro(id, seed, challenge);
    };
    Store.data.player ? go() : askName(go);
  }
  function refreshBoards() {
    const me = Store.data.player;
    $('#boards').innerHTML = Object.entries(GAMES).map(([id, g]) => {
      const list = (Store.data.boards[id] || []).slice(0, 10);
      return `<div class="board"><h3>${g.name}</h3>${list.length
        ? `<ol>${list.map(e => `<li class="${e.name === me ? 'me' : ''}"><span>${escapeHtml(e.name)}</span><b>${e.score}</b></li>`).join('')}</ol>`
        : '<p class="empty-board">Zatiaľ nikto. Buď prvý.</p>'}</div>`;
    }).join('');
  }

  /* ---------------- PRACTICE ---------------- */
  function startPractice(ctx, from) {
    practiceCtx = ctx;
    returnView = from || returnView;
    const text = ctx.make();
    show('practice');
    $('#ex-title').textContent = ctx.title;
    $('#result').hidden = true;
    $('#layout-warn').hidden = true;
    $('#practice-area').classList.remove('dim');
    if (!text) { $('#text').innerHTML = '<p class="muted">Nie je čo písať.</p>'; return; }
    session = new TypingSession({
      text,
      textEl: $('#text'), kbEl: $('#keyboard'), hintEl: $('#hint'),
      getMode: () => Store.data.settings.mode,
      onProgress: live,
      onFinish: finished,
      onLayoutWarn: () => ($('#layout-warn').hidden = false),
    });
    keyHandler = e => {
      if (e.key === 'Escape') { startPractice(practiceCtx); return true; }
      if (session.finished) {
        if (e.key === 'Enter') { startPractice(practiceCtx); return true; }
        return false;
      }
      return session.handleKey(e);
    };
  }

  let timer = null;
  function live(s) {
    $('#live-time').textContent = Stats.fmtTime(s.sec);
    $('#live-cpm').textContent = s.cpm;
    $('#live-acc').textContent = s.acc;
    $('#live-err').textContent = s.errors;
    $('#progress').style.width = (s.progress * 100).toFixed(1) + '%';
    clearInterval(timer);
    if (s.sec > 0 && session && !session.finished) timer = setInterval(() => session && !session.finished && live(session.liveStats()), 500);
  }

  function finished(r) {
    clearInterval(timer);
    const ctx = practiceCtx;
    const prevBest = ctx.kind === 'lesson' ? Store.data.lessonBest[ctx.ref] : null;
    // only real words go to review – not drill groups like "fjfj"
    const generated = (ctx.kind === 'lesson' || ctx.kind === 'words') && !(LESSONS[ctx.ref].words || []).length;
    const known = generated && new Set([...SK_WORDS, ...EN_WORDS, ...DE_WORDS, ...DE_NOUNS.map(w => w.toLowerCase())]);
    const realWord = w => /^\p{L}{2,}$/u.test(w) && !/^(.)\1+$/.test(w) && (!generated || known.has(w));
    r.missedWords = r.missedWords.filter(realWord);
    r.cleanWords = r.cleanWords.filter(realWord);
    Store.addResult({ ...r, kind: ctx.kind, title: ctx.title, ref: ctx.ref });
    const grade = r.acc >= 98 ? 'Výborne.' : r.acc >= 95 ? 'Veľmi dobre.' : r.acc >= 90 ? 'Dobre — ešte trocha presnosti.' : 'Spomaľ a sústreď sa na presnosť.';
    const newBest = ctx.kind === 'lesson' && prevBest && r.cpm > prevBest.cpm;
    const wrongKeys = Object.entries(r.keyStats).filter(([, s]) => s.err).sort((a, b) => b[1].err - a[1].err).slice(0, 8);
    const hasNext = (ctx.kind === 'lesson' || ctx.kind === 'words') && ctx.ref < LESSONS.length - 1;
    $('#result').innerHTML = `
      <p class="label">Výsledok ${newBest ? '<span class="tag acc">Nový rekord</span>' : ''}</p>
      <h2>${grade}</h2>
      <div class="nums">
        <div><span>Úhozy/min</span><b>${r.cpm}</b></div>
        <div><span>Slová/min</span><b>${r.wpm}</b></div>
        <div><span>Presnosť</span><b>${r.acc}%</b></div>
        <div><span>Chyby</span><b>${r.errors}</b></div>
        <div><span>Čas</span><b>${Stats.fmtTime(r.duration)}</b></div>
      </div>
      ${wrongKeys.length ? `<div class="chips"><span class="detail">Chyby na:</span> ${wrongKeys.map(([ch, s]) => `<span class="chip"><b>${escapeHtml(ch === ' ' ? '␣' : ch)}</b><span>${s.err}×</span></span>`).join(' ')}</div>` : ''}
      ${r.missedWords.length ? `<p class="detail">Slová s chybou sa uložili do Opakovania: ${r.missedWords.slice(0, 10).map(escapeHtml).join(', ')}</p>` : ''}
      <div class="row">
        ${hasNext ? `<button id="r-next" class="cta">Ďalšia lekcia ${icon('arrow-right')}</button>` : ''}
        <button id="r-again" class="${hasNext ? '' : 'primary'}">${icon('restart')} Znova <kbd>Enter</kbd></button>
        ${r.missedWords.length ? '<button id="r-review">Precvičiť chybné slová</button>' : ''}
        <button id="r-back" class="ghost">Späť</button>
      </div>`;
    $('#result').hidden = false;
    $('#practice-area').classList.add('dim');
    $('#r-again').onclick = () => startPractice(practiceCtx);
    $('#r-back').onclick = () => show(returnView);
    if (hasNext) $('#r-next').onclick = () => (ctx.kind === 'words' ? startWords : startLesson)(ctx.ref + 1);
    if ($('#r-review')) $('#r-review').onclick = () => startPractice(reviewMissedCtx(), 'review');
  }

  const reviewMissedCtx = () => ({ kind: 'review', ref: 'missed', title: 'Opakovanie: chybné slová', make: () => Exercises.reviewMissedText() });
  const reviewWeakCtx = () => ({ kind: 'review', ref: 'weak', title: 'Opakovanie: slabé klávesy', make: () => Exercises.reviewWeakKeysText() });

  /* ---------------- wiring ---------------- */
  function bindGo(root) {
    $$('[data-go]', root).forEach(b => (b.onclick = () => show(b.dataset.go)));
  }

  function init() {
    Keyboard.render($('#keyboard'));
    Keyboard.render($('#heat-kb'));
    Games.init($('#game-stage'), h => (keyHandler = h));

    $$('#nav button').forEach(b => (b.onclick = () => show(b.dataset.view)));
    $('#logo').onclick = () => show('home');
    bindGo(document);
    hydrateIcons();
    $$('.seg [data-mode]').forEach(b => (b.onclick = e => { setMode(b.dataset.mode); e.currentTarget.blur(); }));
    $('#theme').onclick = e => { toggleTheme(); e.currentTarget.blur(); };
    $('#sound').onclick = e => { Store.data.settings.sound = !Store.data.settings.sound; Store.save(); renderMode(); e.currentTarget.blur(); };
    $('#player').onclick = () => askName(() => { if (document.body.dataset.view === 'games') refreshBoards(); if (document.body.dataset.view === 'home') renderHome(); });
    $('#back').onclick = () => show(returnView);
    $('#restart').onclick = e => { startPractice(practiceCtx); e.currentTarget.blur(); };

    $('#rev-missed').onclick = () => startPractice(reviewMissedCtx(), 'review');
    $('#rev-weak').onclick = () => startPractice(reviewWeakCtx(), 'review');
    $('#saved-lists').onchange = loadList;
    $('#save-list').onclick = saveList;
    $('#delete-list').onclick = deleteList;
    $('#start-custom').onclick = startCustom;
    $$('[data-lines]').forEach(b => (b.onclick = e => { setLines(+b.dataset.lines); e.currentTarget.blur(); }));
    $('#lines-custom').onchange = e => { if (e.target.value) setLines(+e.target.value); };
    $('#ocr-btn').onclick = () => $('#ocr-file').click();
    $('#ocr-file').onchange = e => { readPhotos([...e.target.files]); e.target.value = ''; };

    $('#export').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' }));
      a.download = `desat-prstov-${(Store.data.player || 'zaloha').replace(/\s+/g, '-')}.json`;
      a.click();
    };
    $('#import').onclick = () => $('#import-file').click();
    $('#import-file').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { Store.importJSON(await f.text()); renderMode(); Stats.render($('#view-stats')); alert('Údaje sa načítali.'); }
      catch (err) { alert('Tento súbor sa nedá načítať.'); }
      e.target.value = '';
    };
    $('#clear-stats').onclick = () => {
      if (confirm('Naozaj vymazať všetky štatistiky? Zoznamy slov a meno ostanú.')) { Store.reset(); Stats.render($('#view-stats')); }
    };

    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || $('#name-dialog').open) return;
      if (!keyHandler) return;
      if (keyHandler(e)) e.preventDefault();
    });

    renderMode();

    // opened from a challenge link?
    const m = location.hash.match(/#v=([\w-]+)/);
    if (m) {
      const c = Games.decodeChallenge(m[1]);
      history.replaceState(null, '', location.pathname + location.search);
      if (c && GAMES[c.g]) { show('games'); openGame(c.g, c.s, c); return; }
    }
    show('home');
  }

  return { init, refreshBoards };
})();

document.addEventListener('DOMContentLoaded', App.init);
