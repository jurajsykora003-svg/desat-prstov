/* =========================================================================
   EXERCISES – builds the text to type for lessons, review and custom lists.
   ========================================================================= */

/** Seeded random generator, so a challenge link gives everyone the same words. */
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];
function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const isLetter = c => /\p{L}/u.test(c);
const PUNCT = ',.-?!:;"()/_';

function roman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

const Exercises = {
  /** All keys known after finishing lesson i. */
  knownKeys(i) {
    let s = '';
    for (let k = 0; k <= i; k++) s += LESSONS[k].keys || '';
    return s;
  },

  /** What the student can type after lesson i. */
  features(i) {
    const ls = LESSONS.slice(0, i + 1);
    const keys = this.knownKeys(i);
    const has = t => ls.some(l => l.type === t);
    return {
      letters: new Set([...keys].filter(isLetter)),
      marks: new Set([...keys].filter(c => !isLetter(c))),
      capsL: has('capsL'), capsR: has('capsR'), capsLock: has('capsLock'),
      caron: has('caron'), acute: has('acute'),
    };
  },

  /** w with a capital first letter if the needed Shift / dead key is already learned, else null. */
  capital(w, f) {
    const c = w[0];
    const up = c.toUpperCase() + w.slice(1);
    if (/[a-z]/.test(c)) {
      // right-hand letters use the LEFT Shift, left-hand letters the RIGHT Shift
      return (Keyboard.charMap[c].finger >= 4 ? f.capsL : f.capsR) ? up : null;
    }
    if ('čšžťľňď'.includes(c)) return f.caron ? up : null;
    if ('áéíóúý'.includes(c)) return f.acute ? up : null;
    return null;
  },

  /** Lekcie: a short drill of the new keys, then lines of words. */
  lessonText(i) {
    const L = LESSONS[i];
    if (L.words && L.words.length) return L.words.join(' ');
    const f = this.features(i);
    const fresh = [...(L.keys || '')].filter(c => isLetter(c) || /\d/.test(c));
    const known = [...f.letters];
    const drill = [];
    if (fresh.length && (L.type || 'keys') === 'keys') {
      for (const c of fresh) drill.push(c.repeat(3));
      for (let n = 0; n < 4; n++) drill.push(Array.from({ length: 3 }, () => pick(fresh)).join(''));
      if (fresh.some(isLetter)) {
        for (let n = 0; n < 6; n++) {
          const len = 3 + Math.floor(Math.random() * 3);
          drill.push(shuffle(Array.from({ length: len }, (_, k) => (k % 2 === 0 ? pick(fresh) : pick(known)))).join(''));
        }
      }
    }
    const body = this.wordsText(i, drill.length ? 3 : 4);
    return drill.length ? drill.join(' ') + ' ' + body : body;
  },

  /** Words for lesson i (only letters known so far). withNew = words using the lesson's new letters. */
  wordPool(i) {
    const L = LESSONS[i], f = this.features(i);
    const fits = w => w.length >= 2 && [...w.toLowerCase()].every(c => f.letters.has(c));
    let words;
    if (L.type === 'en') words = EN_WORDS.filter(fits);
    else if (L.type === 'de') words = DE_WORDS.filter(fits).concat(DE_NOUNS.filter(w => fits(w) && this.capital(w.toLowerCase(), f)));
    else words = SK_WORDS.filter(fits);
    const fresh = [...(L.keys || '')].filter(isLetter);
    const withNew = fresh.length ? words.filter(w => fresh.some(c => w.includes(c))) : [];
    return { words, withNew };
  },

  /** Returns a function that produces the next token (word, number, …) for lesson i. */
  generator(i) {
    const L = LESSONS[i], type = L.type || 'keys', f = this.features(i);
    const { words, withNew } = this.wordPool(i);
    const known = [...f.letters];
    const freshLetters = [...(L.keys || '')].filter(isLetter);
    const freshMarks = [...(L.keys || '')].filter(c => !isLetter(c));
    const freshPunct = freshMarks.filter(c => PUNCT.includes(c));
    const oldPunct = [...f.marks].filter(c => PUNCT.includes(c) && !freshPunct.includes(c));
    const digits = [...f.marks].filter(c => /\d/.test(c));
    const freshNum = freshMarks.filter(c => !PUNCT.includes(c) || ['+', '='].includes(c));
    const groups = words.length < 6;
    const recent = [];
    let capNext = false;
    const R = Math.random;

    const word = () => {
      if (groups && (!words.length || R() < 0.6)) {
        const len = 2 + Math.floor(R() * 4);
        return Array.from({ length: len }, (_, k) => (k % 2 === 0 && freshLetters.length ? pick(freshLetters) : pick(known))).join('');
      }
      // prefer words with the new letters – less often when there are only a few of them
      const pNew = withNew.length ? Math.min(0.7, withNew.length / 20) : 0;
      let w;
      for (let t = 0; t < 8; t++) {
        w = R() < pNew ? pick(withNew) : pick(words);
        if (!recent.includes(w)) break;
      }
      recent.push(w); if (recent.length > 6) recent.shift();
      return w;
    };
    const fromList = (list, map) => (list.length ? map(pick(list)) : word());

    // numbers made only of digits already learned (with at least one new digit when there is one)
    const freshDigits = freshMarks.filter(c => /\d/.test(c));
    const num = (min = 1, max = 4) => {
      const len = min + Math.floor(R() * (max - min + 1));
      const d = Array.from({ length: len }, () => pick(digits));
      if (freshDigits.length) d[Math.floor(R() * len)] = pick(freshDigits);
      if (d.length > 1 && d[0] === '0') d[0] = pick(digits.filter(x => x !== '0')) || '1';
      return d.join('');
    };
    const sum = () => {
      const a = +num(1, 2), b = +num(1, 2);
      const c = String(a + b);
      return [...c].every(x => digits.includes(x)) ? `${a} + ${b} = ${c}` : `${a} + ${b}`;
    };
    const numberToken = () => {
      if (L.n === 62) {
        const p = n => String(n).padStart(2, '0');
        return R() < 0.5
          ? `${1 + Math.floor(R() * 28)}. ${1 + Math.floor(R() * 12)}. ${2020 + Math.floor(R() * 8)}`
          : `${p(6 + Math.floor(R() * 14))}.${p(Math.floor(R() * 12) * 5)} h`;
      }
      if (L.n === 61) return R() < 0.4 ? `${num(1, 1)}/${num(1, 2)}` : R() < 0.5 ? `${num(1, 2)}"` : num();
      const m = pick(freshNum.length ? freshNum : digits);
      if (m === '§') return '§ ' + num(1, 3);
      if (m === '%') return num(1, 2) + ' %';
      if (m === '°') return num(1, 2) + ' °C';
      if (m === '+' || m === '=') return sum();
      return num();
    };

    const decorate = (w, m) => {
      switch (m) {
        case ',': return w + ',';
        case '.': capNext = true; return w + '.';
        case '?': case '!': capNext = true; return w + m;
        case ':': case ';': return w + m;
        case '-': return R() < 0.5 ? w + '-' + word() : '- ' + w;
        case '"': return '"' + w + '"';
        case '(': case ')': return '(' + w + ')';
        case '/': return w + '/' + word();
        case '_': return w + '_' + word();
        default: return w;
      }
    };

    const specialWord = () => {
      switch (type) {
        case 'capsL': return R() < 0.6 ? fromList(words.filter(w => /^[a-z]/.test(w) && Keyboard.charMap[w[0]].finger >= 4), w => this.capital(w, f)) : word();
        case 'capsR': return R() < 0.6 ? fromList(words.filter(w => /^[a-z]/.test(w) && Keyboard.charMap[w[0]].finger <= 3), w => this.capital(w, f)) : word();
        case 'capsLock': return R() < 0.4 ? fromList(words.filter(w => /^[a-z]+$/.test(w) && w.length > 2), w => w.toUpperCase()) : word();
        case 'caron':
          if (R() < 0.35 && withNew.length) return pick(withNew);
          return R() < 0.5 ? fromList(words.filter(w => 'čšžťľň'.includes(w[0])), w => this.capital(w, f)) : word();
        case 'acute':
          if (R() < 0.35 && withNew.length) return pick(withNew);
          return R() < 0.5 ? fromList(words.filter(w => 'áéíúý'.includes(w[0])), w => this.capital(w, f)) : word();
        default: {
          const w = word();
          // in later Slovak lessons, sometimes a capital letter (not in English/German – wrong there)
          if (type !== 'en' && type !== 'de' && (f.capsL || f.capsR) && R() < 0.12) return this.capital(w, f) || w;
          return w;
        }
      }
    };

    return () => {
      if (type === 'roman' && R() < 0.7) return roman(1 + Math.floor(R() * (R() < 0.6 ? 40 : 2100)));
      if (freshNum.length && R() < 0.55) return numberToken();
      if (digits.length && R() < 0.08) return numberToken();
      let t = specialWord();
      if (capNext) { t = this.capital(t, f) || t; capNext = false; }
      if (freshPunct.length && R() < 0.4) t = decorate(t, pick(freshPunct));
      else if (oldPunct.length && R() < 0.12) t = decorate(t, pick(oldPunct));
      return t;
    };
  },

  /** Text of `lines` lines (≈ 60 characters each) for lesson i. */
  wordsText(i, lines) {
    const LINE_LEN = 60;
    const next = this.generator(i);
    const out = [];
    for (let l = 0; l < lines; l++) {
      const line = [];
      let len = 0;
      for (let guard = 0; guard < 100; guard++) {
        const t = next();
        if (line.length && len + 1 + t.length > LINE_LEN) break;
        line.push(t); len += (line.length > 1 ? 1 : 0) + t.length;
      }
      out.push(line.join(' '));
    }
    return out.join(' ');
  },

  /** Words you made mistakes in, most-missed first. */
  missedWords(limit = 40) {
    return Object.entries(Store.data.wordMiss).sort((a, b) => b[1] - a[1]).slice(0, limit).map(e => e[0]);
  },

  /** Characters with the worst error rate (needs a few tries to count). */
  weakKeys(limit = 6) {
    return Object.entries(Store.data.keyStats)
      .filter(([ch, s]) => s.n >= 5 && ch !== ' ')
      .map(([ch, s]) => ({ ch, rate: s.err / s.n, n: s.n, ms: s.msN ? s.ms / s.msN : 0 }))
      .filter(k => k.rate > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, limit);
  },

  reviewMissedText() {
    const words = this.missedWords();
    if (!words.length) return '';
    let list = [];
    while (list.length < 36) list = list.concat(shuffle(words));
    return list.slice(0, 36).join(' ');
  },

  reviewWeakKeysText() {
    const weak = this.weakKeys().map(k => k.ch.toLowerCase());
    if (!weak.length) return '';
    const words = SK_WORDS.filter(w => weak.some(c => w.includes(c)));
    const out = [];
    for (const c of weak) out.push(c.repeat(3), (c + pick(['a', 'o', 'e'])).repeat(2));
    out.push(...shuffle(words).slice(0, 30));
    return out.join(' ');
  },

  customText(text, { shuffle: mix, repeat, max }) {
    let words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (!words.length) return '';
    let list = [];
    for (let r = 0; r < repeat; r++) list = list.concat(mix ? shuffle(words) : words);
    return list.slice(0, max).join(' ');
  },
};
