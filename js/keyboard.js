/* =========================================================================
   KEYBOARD – on-screen keyboard, finger hints, key lookup for characters.
   ========================================================================= */
const Keyboard = (() => {
  // char -> {code, shift, finger}
  const charMap = {};
  const codeInfo = {};
  for (const row of KEY_ROWS) {
    for (const [code, normal, shifted, finger] of row) {
      codeInfo[code] = { normal, shifted, finger };
      if (!charMap[normal]) charMap[normal] = { code, shift: false, finger };
      if (!charMap[shifted]) charMap[shifted] = { code, shift: true, finger };
    }
  }
  charMap[' '] = { code: 'Space', shift: false, finger: 8 };
  codeInfo.Space = { finger: 8 };

  const shiftFor = finger => (finger <= 3 ? 'ShiftRight' : 'ShiftLeft'); // opposite hand

  /** Keystrokes needed for one character: list of {code, shift, finger, label}. */
  function strokes(ch) {
    if (charMap[ch]) return [charMap[ch]];
    const combo = DEAD_COMBOS[ch];
    if (combo) return combo.map(c => charMap[c]).filter(Boolean);
    const lower = ch.toLowerCase();
    if (lower !== ch && charMap[lower]) {
      // uppercase of a letter that sits on the number row (Š, Č…) – Shift alone gives a digit,
      // so the hint shows the base key; most people use Caps Lock or ˇ + Shift
      return [{ ...charMap[lower], shift: true }];
    }
    return [];
  }

  function label(v) {
    if (v === 'DEAD_ACUTE') return '´';
    if (v === 'DEAD_CARON') return 'ˇ';
    return v;
  }

  /** Render a keyboard into `el`. */
  function render(el) {
    const mk = (code, cls, top, bottom, finger) => {
      const k = document.createElement('div');
      k.className = 'key ' + cls + (finger !== undefined ? ' f' + finger : '');
      if (code) k.dataset.code = code;
      if (HOME_KEYS.includes(code)) k.classList.add('home');
      k.innerHTML = bottom !== undefined
        ? `<span class="sh">${top}</span><span>${bottom}</span>`
        : `<span>${top || ''}</span>`;
      return k;
    };
    const rowEl = () => { const r = document.createElement('div'); r.className = 'krow'; el.appendChild(r); return r; };
    el.innerHTML = '';
    const extras = [
      [null, ['Backspace', 'mod w2', '⌫']],
      [['Tab', 'mod w15', 'Tab'], ['Enter', 'mod w15', '↵']],
      [['CapsLock', 'mod w175', 'Caps'], ['Enter2', 'mod w125', '']],
      [['ShiftLeft', 'mod w125', '⇧'], ['ShiftRight', 'mod w275', '⇧ Shift']],
    ];
    KEY_ROWS.forEach((row, i) => {
      const r = rowEl();
      const [pre, post] = extras[i];
      if (pre) r.appendChild(mk(pre[0], pre[1], pre[2]));
      for (const [code, normal, shifted, finger] of row) {
        const letter = /^[a-záäčďéíĺľňóôŕšťúýž]$/.test(normal);
        r.appendChild(letter
          ? mk(code, '', normal.toUpperCase(), undefined, finger)
          : mk(code, '', label(shifted), label(normal), finger));
      }
      if (post) r.appendChild(mk(post[0], post[1], post[2]));
    });
    const r = rowEl();
    for (const [c, w, t] of [['ControlLeft', 'w125', 'Ctrl'], ['MetaLeft', 'w125', ''], ['AltLeft', 'w125', 'Alt']]) r.appendChild(mk(c, 'mod ' + w, t));
    r.appendChild(mk('Space', 'space f8', ''));
    for (const [c, w, t] of [['AltRight', 'w125', 'AltGr'], ['MetaRight', 'w125', ''], ['ContextMenu', 'w125', ''], ['ControlRight', 'w125', 'Ctrl']]) r.appendChild(mk(c, 'mod ' + w, t));
  }

  /** Highlight the keys for the next stroke. */
  function highlight(el, stroke) {
    el.querySelectorAll('.target').forEach(k => k.classList.remove('target'));
    if (!stroke) return;
    const k = el.querySelector(`[data-code="${stroke.code}"]`);
    if (k) k.classList.add('target');
    if (stroke.shift) {
      const s = el.querySelector(`[data-code="${shiftFor(stroke.finger)}"]`);
      if (s) s.classList.add('target');
    }
  }

  /** Flash a physical key when it is pressed. */
  function flash(el, code, wrong) {
    const k = el.querySelector(`[data-code="${code}"]`);
    if (!k) return;
    const cls = wrong ? 'hit-bad' : 'hit';
    k.classList.remove('hit', 'hit-bad');
    void k.offsetWidth; // restart animation
    k.classList.add(cls);
  }

  /** Paint error rates on a keyboard (stats heatmap). values: code -> 0..1 */
  function heat(el, values, titles) {
    el.querySelectorAll('.key').forEach(k => {
      const v = values[k.dataset.code];
      k.style.removeProperty('--heat');
      k.classList.remove('heat');
      if (v !== undefined) { k.classList.add('heat'); k.style.setProperty('--heat', v.toFixed(3)); }
      if (titles[k.dataset.code]) k.title = titles[k.dataset.code];
    });
  }

  function fingerText(stroke) {
    if (!stroke) return '';
    let t = FINGER_NAMES[stroke.finger];
    if (stroke.shift) t += ' + ' + (stroke.finger <= 3 ? 'pravý' : 'ľavý') + ' Shift';
    return t;
  }

  return { strokes, render, highlight, flash, heat, fingerText, charMap, codeInfo, label };
})();
