/* =========================================================================
   STATS – summary figures, progress charts, key heatmap, history.
   ========================================================================= */

/** Row of big numbers: [[label, value, unit], …] */
function figures(items) {
  return items.map(([l, v, u]) => `<div class="figure"><div class="figure-label">${l}</div><div class="figure-value">${v}</div><div class="figure-unit">${u}</div></div>`).join('');
}
const daysWord = n => (n === 1 ? 'deň' : n >= 2 && n <= 4 ? 'dni' : 'dní');

const Stats = (() => {
  const dayKey = t => new Date(t).toLocaleDateString('sk-SK');
  const fmtTime = sec => {
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = Math.round(sec % 60);
    return h ? `${h} h ${m} min` : m ? `${m} min ${s} s` : `${s} s`;
  };
  const avg = arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  function streak(history) {
    const days = new Set(history.map(h => dayKey(h.t)));
    let n = 0;
    const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // today not practised yet still keeps yesterday's streak
    while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function summary() {
    const h = Store.data.history.filter(x => x.kind !== 'game');
    const last10 = h.slice(-10);
    return {
      count: h.length,
      time: h.reduce((a, x) => a + (x.dur || 0), 0),
      chars: h.reduce((a, x) => a + (x.chars || 0), 0),
      best: h.reduce((a, x) => Math.max(a, x.cpm), 0),
      avgCpm: Math.round(avg(last10.map(x => x.cpm))),
      avgAcc: Math.round(avg(last10.map(x => x.acc)) * 10) / 10,
      streak: streak(Store.data.history),
      lessonsDone: Object.keys(Store.data.lessonBest).length,
    };
  }

  /* ---------- line chart (one measure per chart, hover tooltip) ---------- */
  function lineChart(el, points, { unit, color, min = 0, max }) {
    if (points.length < 2) {
      el.innerHTML = '<p class="muted empty">Graf sa zobrazí po dvoch cvičeniach.</p>';
      return;
    }
    const W = 440, H = 230, L = 40, R = 12, T = 14, B = 26;
    const vals = points.map(p => p.v);
    // round the axis to friendly steps (1, 2, 2.5, 5 × 10ⁿ)
    const nice = raw => { const m = 10 ** Math.floor(Math.log10(raw || 1)); return [1, 2, 2.5, 5, 10].map(k => k * m).find(s => s >= raw); };
    let lo, hi;
    if (max !== undefined) { const step = nice((max - Math.min(min, ...vals)) / 4); hi = max; lo = Math.max(0, max - 4 * step); }
    else { lo = min; const step = nice(Math.max(10, Math.max(...vals) * 1.1 - lo) / 4); hi = lo + 4 * step; }
    const x = i => L + (W - L - R) * (points.length === 1 ? 0.5 : i / (points.length - 1));
    const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => lo + (hi - lo) * f);
    const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const area = `${path}L${x(points.length - 1)},${y(lo)}L${x(0)},${y(lo)}Z`;
    // colours go through style="" so CSS variables (light/dark theme) work
    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="chart" role="img">
        ${ticks.map((t, k) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" class="${k ? 'gl' : 'base'}"/><text x="${L - 6}" y="${y(t) + 4}" class="axis" text-anchor="end">${Math.round(t)}</text>`).join('')}
        <path d="${area}" style="fill:${color};fill-opacity:.08"/>
        <path d="${path}" fill="none" style="stroke:${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${points.length <= 40 ? points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="4" style="fill:${color}" class="dot"/>`).join('') : ''}
        <line class="cross" y1="${T}" y2="${H - B}" x1="0" x2="0" style="display:none"/>
        <circle class="focus" r="5.5" style="fill:${color};display:none"/>
        <rect x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent" class="hit"/>
      </svg>
      <div class="tip" hidden></div>`;
    const svg = el.querySelector('svg'), tip = el.querySelector('.tip');
    const cross = svg.querySelector('.cross'), focus = svg.querySelector('.focus');
    const move = ev => {
      const r = svg.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width * W;
      const i = Math.max(0, Math.min(points.length - 1, Math.round((px - L) / (W - L - R) * (points.length - 1))));
      const p = points[i];
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.style.display = '';
      focus.setAttribute('cx', x(i)); focus.setAttribute('cy', y(p.v)); focus.style.display = '';
      tip.hidden = false;
      tip.innerHTML = `<b>${p.v} ${unit}</b><br><span>${escapeHtml(p.label)}</span>`;
      const left = x(i) / W * r.width;
      tip.style.left = Math.min(Math.max(left, 70), r.width - 70) + 'px';
      tip.style.top = (y(p.v) / H * r.height - 12) + 'px';
    };
    const leave = () => { tip.hidden = true; cross.style.display = 'none'; focus.style.display = 'none'; };
    const hit = svg.querySelector('.hit');
    hit.addEventListener('mousemove', move);
    hit.addEventListener('mouseleave', leave);
  }

  /* ---------- per key: errors and speed, mapped to physical keys ---------- */
  function perCode() {
    const by = {};
    for (const [ch, s] of Object.entries(Store.data.keyStats)) {
      const st = Keyboard.strokes(ch);
      const code = st.length ? st[st.length - 1].code : null;
      if (!code) continue;
      const b = by[code] || (by[code] = { n: 0, err: 0, ms: 0, msN: 0, chars: [] });
      b.n += s.n; b.err += s.err; b.ms += s.ms; b.msN += s.msN; b.chars.push(ch === ' ' ? '␣' : ch);
    }
    return by;
  }

  function render(root) {
    const s = summary();
    root.querySelector('#stat-cards').innerHTML = figures([
      ['Najlepšie', s.best, 'úhozov/min'],
      ['Priemer', s.avgCpm, 'úhozov/min · posl. 10'],
      ['Presnosť', s.count ? s.avgAcc + '%' : '—', 'posledných 10'],
      ['Séria', s.streak, daysWord(s.streak) + ' v rade'],
      ['Cvičenia', s.count, 'spolu'],
      ['Čas písania', fmtTime(s.time), 'spolu'],
      ['Znaky', s.chars.toLocaleString('sk-SK'), 'napísané'],
      ['Lekcie', `${s.lessonsDone}/${LESSONS.length}`, 'dokončené'],
    ]);

    const hist = Store.data.history.filter(x => x.kind !== 'game').slice(-60);
    const label = x => `${new Date(x.t).toLocaleString('sk-SK', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${x.title}`;
    lineChart(root.querySelector('#chart-speed'), hist.map(x => ({ v: x.cpm, label: label(x) })), { unit: 'úhozov/min', color: 'var(--accent)' });
    lineChart(root.querySelector('#chart-acc'), hist.map(x => ({ v: x.acc, label: label(x) })),
      { unit: '%', color: 'var(--ink)', min: 100, max: 100 });

    // heatmap
    const by = perCode();
    const vals = {}, titles = {};
    for (const [code, b] of Object.entries(by)) {
      if (b.n < 3) continue;
      const rate = b.err / b.n;
      vals[code] = Math.min(1, rate / 0.2); // 20 % errors or more = full colour
      titles[code] = `${b.chars.join(' ')} — ${Math.round(rate * 1000) / 10} % chýb, ${b.msN ? Math.round(b.ms / b.msN) + ' ms' : '–'} (${b.n}×)`;
    }
    Keyboard.heat(root.querySelector('#heat-kb'), vals, titles);

    // weakest + slowest keys
    const weak = Exercises.weakKeys(8);
    root.querySelector('#weak-keys').innerHTML = weak.length
      ? weak.map(k => `<div class="chip"><b>${escapeHtml(k.ch === ' ' ? '␣' : k.ch)}</b><span>${Math.round(k.rate * 1000) / 10} %</span></div>`).join('')
      : '<p class="muted">Zatiaľ žiadne – pokračuj v písaní.</p>';
    const slow = Object.entries(Store.data.keyStats)
      .filter(([ch, x]) => x.msN >= 5 && ch !== ' ')
      .map(([ch, x]) => ({ ch, ms: x.ms / x.msN })).sort((a, b) => b.ms - a.ms).slice(0, 8);
    root.querySelector('#slow-keys').innerHTML = slow.length
      ? slow.map(k => `<div class="chip"><b>${escapeHtml(k.ch)}</b><span>${Math.round(k.ms)} ms</span></div>`).join('')
      : '<p class="muted">Zatiaľ žiadne – pokračuj v písaní.</p>';

    const missed = Object.entries(Store.data.wordMiss).sort((a, b) => b[1] - a[1]).slice(0, 24);
    root.querySelector('#missed-words').innerHTML = missed.length
      ? missed.map(([w, n]) => `<div class="chip"><b>${escapeHtml(w)}</b><span>${n}×</span></div>`).join('')
      : '<p class="muted">Žiadne chybné slová.</p>';

    const rows = Store.data.history.slice(-40).reverse();
    root.querySelector('#history tbody').innerHTML = rows.length ? rows.map(x => `
      <tr><td>${new Date(x.t).toLocaleString('sk-SK', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
      <td>${escapeHtml(x.title)}</td><td class="num">${x.cpm}</td><td class="num">${x.wpm}</td><td class="num">${x.acc} %</td><td class="num">${x.err}</td><td class="num">${fmtTime(x.dur || 0)}</td></tr>`).join('')
      : '<tr><td colspan="7" class="muted">Zatiaľ žiadne cvičenia.</td></tr>';
  }

  return { render, summary, fmtTime };
})();
