/* =========================================================================
   STORE – everything is saved in the browser (localStorage).
   ========================================================================= */
const Store = (() => {
  const KEY = 'desatprstov.v1';
  const blank = () => ({
    player: '',
    settings: { mode: 'stop', sound: true },
    history: [],        // {t, kind, title, ref, cpm, wpm, acc, err, dur, chars}
    keyStats: {},       // char -> {n, err, ms, msN}
    wordMiss: {},       // word -> number of mistakes
    lessonBest: {},     // lesson index -> {cpm, acc}
    boards: {},         // game -> [{name, score, t}]
    customLists: [],    // {id, name, text}
  });

  let data = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* storage disabled – app still works, just without saving */ }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

  return {
    get data() { return data; },
    save,
    reset() { const keep = { player: data.player, settings: data.settings, customLists: data.customLists }; data = Object.assign(blank(), keep); save(); },
    exportJSON() { return JSON.stringify(data, null, 1); },
    importJSON(text) { data = Object.assign(blank(), JSON.parse(text)); save(); },

    /** Record one finished exercise (typing result from Typing engine). */
    addResult(r) {
      data.history.push({
        t: Date.now(), kind: r.kind, title: r.title, ref: r.ref,
        cpm: r.cpm, wpm: r.wpm, acc: r.acc, err: r.errors, dur: r.duration, chars: r.chars,
      });
      if (data.history.length > 1000) data.history.shift();
      for (const [ch, s] of Object.entries(r.keyStats)) {
        const k = data.keyStats[ch] || (data.keyStats[ch] = { n: 0, err: 0, ms: 0, msN: 0 });
        k.n += s.n; k.err += s.err; k.ms += s.ms; k.msN += s.msN;
      }
      for (const w of r.missedWords) data.wordMiss[w] = (data.wordMiss[w] || 0) + 1;
      for (const w of r.cleanWords) {
        // a word typed cleanly lowers its "missed" count, so review lists shrink as you improve
        if (data.wordMiss[w]) { data.wordMiss[w]--; if (!data.wordMiss[w]) delete data.wordMiss[w]; }
      }
      if (r.kind === 'lesson') {
        const b = data.lessonBest[r.ref];
        if (!b || r.cpm > b.cpm) data.lessonBest[r.ref] = { cpm: r.cpm, acc: r.acc };
      }
      save();
    },

    addScore(game, score, extra = {}) {
      const list = data.boards[game] || (data.boards[game] = []);
      list.push({ name: data.player || 'Hráč', score, t: Date.now(), ...extra });
      list.sort((a, b) => b.score - a.score);
      data.boards[game] = list.slice(0, 20);
      save();
      return data.boards[game].findIndex(e => e.score === score) + 1;
    },
  };
})();
