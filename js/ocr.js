/* =========================================================================
   OCR – reads text from a photo, right in the browser (Tesseract.js).
   The photo never leaves the computer. The first use downloads the
   Slovak language data (a few MB); the browser caches it afterwards.
   ========================================================================= */
const Ocr = (() => {
  const LIB = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  let loading = null;

  function loadLib() {
    if (window.Tesseract) return Promise.resolve();
    return loading || (loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = LIB;
      s.onload = resolve;
      s.onerror = () => { loading = null; reject(new Error('lib')); };
      document.head.appendChild(s);
    }));
  }

  /** Phone photos are huge – shrink them, OCR is faster and just as accurate. */
  async function prepare(file, max = 2200) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c;
  }

  /** Tidy OCR output: join words split by hyphen at line end, drop stray symbols. */
  function clean(text) {
    return text
      .replace(/(\p{L})-[ \t]*\n[ \t]*(\p{L})/gu, '$1$2')
      .replace(/[|_~<>{}\[\]©®•·»«]/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  /**
   * files: image Files/Blobs. onStatus(text, fraction 0..1)
   * Returns the recognised text of all photos.
   */
  async function read(files, onStatus) {
    onStatus('Pripravujem rozpoznávanie textu…', 0);
    await loadLib();
    let page = 0;
    const worker = await Tesseract.createWorker('slk', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          onStatus(`Rozpoznávam text${files.length > 1 ? ` (fotka ${page + 1}/${files.length})` : ''}…`, (page + m.progress) / files.length);
        } else if (/loading|initializ/.test(m.status)) {
          onStatus('Sťahujem slovenčinu (len prvýkrát)…', 0);
        }
      },
    });
    const out = [];
    try {
      for (page = 0; page < files.length; page++) {
        const { data } = await worker.recognize(await prepare(files[page]));
        out.push(clean(data.text));
      }
    } finally {
      await worker.terminate();
    }
    return out.filter(Boolean).join('\n');
  }

  return { read, clean };
})();
