/* =========================================================================
   TYPING ENGINE – used by lessons, review and custom text.
   mode 'stop': a wrong key does not move on, you must press the right one.
   mode 'flow': you keep going, the mistake stays marked (Backspace fixes).
   ========================================================================= */

const Sound = (() => {
  let ctx;
  function beep(freq, dur, type = 'sine', vol = 0.04) {
    if (!Store.data.settings.sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) {}
  }
  return {
    key: () => beep(900, 0.03, 'triangle', 0.02),
    error: () => beep(160, 0.15, 'square', 0.04),
    done: () => { beep(660, 0.12); setTimeout(() => beep(880, 0.12), 110); setTimeout(() => beep(1320, 0.2), 220); },
    pop: () => beep(1200, 0.06, 'triangle', 0.03),
  };
})();

class TypingSession {
  /**
   * opts: { text, textEl, kbEl, hintEl, getMode, onProgress(stats), onFinish(result), onLayoutWarn() }
   */
  constructor(opts) {
    this.o = opts;
    this.text = opts.text.replace(/\s+/g, ' ').trim();
    this.reset();
  }

  reset() {
    const t = this.text;
    this.pos = 0;
    this.state = new Array(t.length).fill(0); // 0 todo, 1 ok, 2 wrong (flow), 3 ok-after-mistake (stop)
    this.presses = 0;
    this.wrong = 0;
    this.start = 0;
    this.lastTime = 0;
    this.deadStep = 0;
    this.finished = false;
    this.layoutHits = 0;
    this.keyStats = {};
    // word index for every character
    this.wordAt = [];
    this.words = t.split(' ');
    let w = 0;
    for (let i = 0; i < t.length; i++) { this.wordAt.push(t[i] === ' ' ? -1 : w); if (t[i] === ' ') w++; }
    this.wordErr = new Set();
    this.renderText();
    this.update();
  }

  renderText() {
    const el = this.o.textEl;
    el.innerHTML = '<div class="lines"></div>';
    const lines = el.firstChild;
    // group characters by word so lines only wrap between words
    let html = '', word = '';
    for (let i = 0; i < this.text.length; i++) {
      const ch = this.text[i];
      const span = `<span class="c" data-i="${i}">${ch === ' ' ? ' ' : escapeHtml(ch)}</span>`;
      if (ch === ' ') { html += `<span class="w">${word}</span>${span}`; word = ''; }
      else word += span;
    }
    html += `<span class="w">${word}</span>`;
    lines.innerHTML = html;
    this.spans = lines.querySelectorAll('.c');
  }

  stroke() {
    const ch = this.text[this.pos];
    if (ch === undefined) return null;
    const s = Keyboard.strokes(ch);
    return s[Math.min(this.deadStep, s.length - 1)] || null;
  }

  update() {
    const { spans } = this;
    spans.forEach((s, i) => {
      s.className = 'c ' + (i === this.pos ? 'cur' : ['todo', 'ok', 'bad', 'fixed'][this.state[i]]);
    });
    const cur = spans[this.pos];
    if (cur) {
      // keep the current line as the 2nd visible line
      const lines = this.o.textEl.firstChild;
      const lh = cur.offsetHeight || 40;
      const y = Math.max(0, cur.offsetTop - lh * 1.1);
      lines.style.transform = `translateY(${-y}px)`;
    }
    const stroke = this.stroke();
    if (this.o.kbEl) Keyboard.highlight(this.o.kbEl, this.finished ? null : stroke);
    if (this.o.hintEl) {
      const ch = this.text[this.pos];
      let hint = '';
      if (ch !== undefined) {
        const all = Keyboard.strokes(ch);
        const name = ch === ' ' ? 'medzerník' : `„${ch}“`;
        hint = `Ďalej: <b>${escapeHtml(name)}</b> — ${Keyboard.fingerText(stroke)}`;
        if (all.length > 1) hint += this.deadStep ? ' <span class="tag">teraz písmeno</span>' : ` <span class="tag acc">najprv ${Keyboard.label(all[0].shift ? 'DEAD_CARON' : 'DEAD_ACUTE')}</span>`;
      }
      this.o.hintEl.innerHTML = hint;
    }
    this.o.onProgress && this.o.onProgress(this.liveStats());
  }

  liveStats() {
    const sec = this.start ? ((this.finished ? this.endTime : performance.now()) - this.start) / 1000 : 0;
    const okChars = this.state.filter(s => s === 1 || s === 3).length;
    const cpm = sec > (this.finished ? 0 : 1) ? Math.round(okChars / sec * 60) : 0;
    const acc = this.presses ? Math.round((this.presses - this.wrong) / this.presses * 1000) / 10 : 100;
    return { sec, cpm, wpm: Math.round(cpm / 5), acc, errors: this.wrong, progress: this.pos / this.text.length };
  }

  statFor(ch) {
    return this.keyStats[ch] || (this.keyStats[ch] = { n: 0, err: 0, ms: 0, msN: 0 });
  }

  /** Call with a keydown event. Returns true if the key was used. */
  handleKey(e) {
    if (this.finished) return false;
    if ((e.ctrlKey && !e.altKey) || e.metaKey) return false;
    const mode = this.o.getMode();
    if (this.o.kbEl && e.code) Keyboard.flash(this.o.kbEl, e.code === 'IntlBackslash' ? e.code : e.code, false);

    if (e.key === 'Dead') { this.deadStep = 1; this.update(); return true; }
    if (e.key === 'Backspace') {
      if (mode === 'flow' && this.pos > 0) {
        this.pos--;
        this.state[this.pos] = 0;
        this.update();
      }
      return true;
    }
    if (e.key.length !== 1) return false; // Shift, Tab, arrows…

    const expected = this.text[this.pos];
    const now = performance.now();
    if (!this.start) { this.start = now; this.lastTime = now; }
    this.deadStep = 0;
    this.presses++;
    const st = this.statFor(expected);
    const typed = e.key;

    if (typed === expected) {
      st.n++;
      const dt = now - this.lastTime;
      if (this.pos > 0 && dt < 3000) { st.ms += dt; st.msN++; }
      this.lastTime = now;
      this.state[this.pos] = this.state[this.pos] === 2 ? 3 : (this.mistakeHere ? 3 : 1);
      this.mistakeHere = false;
      this.pos++;
      Sound.key();
    } else {
      this.wrong++;
      st.n++; st.err++;
      if (this.wordAt[this.pos] >= 0) this.wordErr.add(this.wordAt[this.pos]);
      if (this.o.kbEl) Keyboard.flash(this.o.kbEl, e.code, true);
      Sound.error();
      this.checkLayout(e, expected);
      if (mode === 'flow') {
        this.state[this.pos] = 2;
        this.lastTime = now;
        this.pos++;
      } else {
        this.mistakeHere = true;
        const cur = this.spans[this.pos];
        cur.classList.remove('shake'); void cur.offsetWidth; cur.classList.add('shake');
        this.o.textEl.classList.remove('err-flash'); void this.o.textEl.offsetWidth; this.o.textEl.classList.add('err-flash');
      }
    }

    if (this.pos >= this.text.length) return this.finish(), true;
    this.update();
    if (mode === 'stop' && this.mistakeHere) this.spans[this.pos].classList.add('err');
    return true;
  }

  /** Detects when the computer is set to an English layout instead of Slovak. */
  checkLayout(e, expected) {
    const s = Keyboard.charMap[expected];
    if (s && s.code === e.code && /[ľščťžýáíéúäňô]/.test(expected) && /[0-9\[\];'\\]/.test(e.key)) {
      if (++this.layoutHits >= 2 && this.o.onLayoutWarn) this.o.onLayoutWarn();
    }
  }

  finish() {
    this.finished = true;
    this.endTime = performance.now();
    this.update();
    const live = this.liveStats();
    const missedWords = [], cleanWords = [];
    this.words.forEach((w, i) => {
      const clean = w.toLowerCase().replace(/[.,!?;:()"„“]/g, '');
      if (clean.length < 2) return;
      (this.wordErr.has(i) ? missedWords : cleanWords).push(clean);
    });
    Sound.done();
    this.o.onFinish({
      cpm: live.cpm, wpm: live.wpm, acc: live.acc, errors: this.wrong,
      duration: Math.round(live.sec), chars: this.text.length,
      keyStats: this.keyStats, missedWords, cleanWords,
    });
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
