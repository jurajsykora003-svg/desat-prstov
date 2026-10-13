/* =========================================================================
   DATA: Slovak QWERTZ keyboard, lessons, word list.
   Lessons: when we have the words from the book, put them in `words`
   for each lesson. If `words` is empty, the exercise is generated
   automatically from the keys learned so far.
   ========================================================================= */

// Fingers: 0 L pinky, 1 L ring, 2 L middle, 3 L index, 4 R index, 5 R middle, 6 R ring, 7 R pinky, 8 thumb
const FINGER_NAMES = [
  'ľavý malíček', 'ľavý prstenník', 'ľavý prostredník', 'ľavý ukazovák',
  'pravý ukazovák', 'pravý prostredník', 'pravý prstenník', 'pravý malíček', 'palec',
];

// Each key: [code (physical position), normal, with Shift, finger]
// 'DEAD_ACUTE' / 'DEAD_CARON' mark dead keys (´ and ˇ).
const KEY_ROWS = [
  [
    ['Backquote', ';', '°', 0], ['Digit1', '+', '1', 0], ['Digit2', 'ľ', '2', 1], ['Digit3', 'š', '3', 2],
    ['Digit4', 'č', '4', 3], ['Digit5', 'ť', '5', 3], ['Digit6', 'ž', '6', 4], ['Digit7', 'ý', '7', 4],
    ['Digit8', 'á', '8', 5], ['Digit9', 'í', '9', 6], ['Digit0', 'é', '0', 7], ['Minus', '=', '%', 7],
    ['Equal', 'DEAD_ACUTE', 'DEAD_CARON', 7],
  ],
  [
    ['KeyQ', 'q', 'Q', 0], ['KeyW', 'w', 'W', 1], ['KeyE', 'e', 'E', 2], ['KeyR', 'r', 'R', 3],
    ['KeyT', 't', 'T', 3], ['KeyY', 'z', 'Z', 4], ['KeyU', 'u', 'U', 4], ['KeyI', 'i', 'I', 5],
    ['KeyO', 'o', 'O', 6], ['KeyP', 'p', 'P', 7], ['BracketLeft', 'ú', '/', 7], ['BracketRight', 'ä', '(', 7],
  ],
  [
    ['KeyA', 'a', 'A', 0], ['KeyS', 's', 'S', 1], ['KeyD', 'd', 'D', 2], ['KeyF', 'f', 'F', 3],
    ['KeyG', 'g', 'G', 3], ['KeyH', 'h', 'H', 4], ['KeyJ', 'j', 'J', 4], ['KeyK', 'k', 'K', 5],
    ['KeyL', 'l', 'L', 6], ['Semicolon', 'ô', '"', 7], ['Quote', '§', '!', 7], ['Backslash', 'ň', ')', 7],
  ],
  [
    ['IntlBackslash', '&', '*', 0], ['KeyZ', 'y', 'Y', 0], ['KeyX', 'x', 'X', 1], ['KeyC', 'c', 'C', 2],
    ['KeyV', 'v', 'V', 3], ['KeyB', 'b', 'B', 3], ['KeyN', 'n', 'N', 4], ['KeyM', 'm', 'M', 4],
    ['Comma', ',', '?', 5], ['Period', '.', ':', 6], ['Slash', '-', '_', 7],
  ],
];

const HOME_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];

// Letters typed with a dead key: ´ (acute) and ˇ (caron, Shift + ´ key)
const DEAD_COMBOS = {
  'ó': ['DEAD_ACUTE', 'o'], 'ĺ': ['DEAD_ACUTE', 'l'], 'ŕ': ['DEAD_ACUTE', 'r'],
  'ď': ['DEAD_CARON', 'd'], 'ň': null, // ň has its own key
  'Á': ['DEAD_ACUTE', 'A'], 'É': ['DEAD_ACUTE', 'E'], 'Í': ['DEAD_ACUTE', 'I'], 'Ó': ['DEAD_ACUTE', 'O'],
  'Ú': ['DEAD_ACUTE', 'U'], 'Ý': ['DEAD_ACUTE', 'Y'], 'Ĺ': ['DEAD_ACUTE', 'L'], 'Ŕ': ['DEAD_ACUTE', 'R'],
  'Č': ['DEAD_CARON', 'C'], 'Ď': ['DEAD_CARON', 'D'], 'Ľ': ['DEAD_CARON', 'L'], 'Ň': ['DEAD_CARON', 'N'],
  'Š': ['DEAD_CARON', 'S'], 'Ť': ['DEAD_CARON', 'T'], 'Ž': ['DEAD_CARON', 'Z'],
};

/* -------------------------------------------------------------------------
   LESSONS – same order and numbering as the textbook
   (Administratíva a korešpondencia pre 1. ročník OA), lessons 1–66.
   The exercises themselves are our own, generated from the keys.

   n     = lesson number in the textbook
   keys  = new keys introduced in the lesson (letters, marks, digits)
   type  = what kind of lesson (default: new keys)
           review   – practise everything learned so far
           text     – text practice (mixed words; the book's text can be
                      loaded with "Načítať z fotky" in Opakovanie)
           capsL / capsR – capitals with left / right Shift
           capsLock – Caps Lock
           en / de  – English / German words
           caron / acute – capitals and letters via dead keys ˇ and ´
           roman    – Roman numerals
   show  = what to show on the lesson card instead of the keys
   words = optional fixed text for the lesson (empty = generated)
   ------------------------------------------------------------------------- */
const LESSONS = [
  { n: 1, title: 'd, f, j, k', keys: 'dfjk' },
  { n: 2, title: 'a, ô', keys: 'aô' },
  { n: 3, title: 's, l', keys: 'sl' },
  { n: 4, title: 'Precvičovanie učiva', type: 'review' },
  { n: 5, title: 'e, čiarka', keys: 'e,' },
  { n: 6, title: 'w, x, o', keys: 'wxo' },
  { n: 7, title: 't, n', keys: 'tn' },
  { n: 8, title: 'Precvičovanie učiva', type: 'review' },
  { n: 9, title: 'c, i', keys: 'ci' },
  { n: 10, title: 'q, y, p', keys: 'qyp' },
  { n: 11, title: 'r, m', keys: 'rm' },
  { n: 12, title: 'Precvičovanie učiva', type: 'review' },
  { n: 13, title: 'u', keys: 'u' },
  { n: 14, title: 'v', keys: 'v' },
  { n: 15, title: 'z', keys: 'z' },
  { n: 16, title: 'b', keys: 'b' },
  { n: 17, title: 'Precvičovanie učiva', type: 'review' },
  { n: 18, title: 'Spojovník, pomlčka', keys: '-' },
  { n: 19, title: 'h', keys: 'h' },
  { n: 20, title: 'g', keys: 'g' },
  { n: 21, title: 'ú', keys: 'ú' },
  { n: 22, title: 'Precvičovanie učiva', type: 'review' },
  { n: 23, title: 'Veľké písmená – ľavý preraďovač', type: 'capsL', show: 'ľavý Shift' },
  { n: 24, title: 'Bodka', keys: '.' },
  { n: 25, title: 'Veľké písmená – pravý preraďovač', type: 'capsR', show: 'pravý Shift' },
  { n: 26, title: 'Zámka preraďovača', type: 'capsLock', show: 'Caps Lock' },
  { n: 27, title: 'Precvičovanie učiva', type: 'review' },
  { n: 28, title: 'Nácvik textu', type: 'text' },
  { n: 29, title: 'Nácvik písania po anglicky', type: 'en', show: 'English' },
  { n: 30, title: 'Nácvik písania po nemecky', type: 'de', show: 'Deutsch' },
  { n: 31, title: 'ý', keys: 'ý' },
  { n: 32, title: 'ť', keys: 'ť' },
  { n: 33, title: 'á', keys: 'á' },
  { n: 34, title: 'č', keys: 'č' },
  { n: 35, title: 'í', keys: 'í' },
  { n: 36, title: 'Precvičovanie učiva', type: 'review' },
  { n: 37, title: 'š', keys: 'š' },
  { n: 38, title: 'é', keys: 'é' },
  { n: 39, title: 'ľ', keys: 'ľ' },
  { n: 40, title: 'ž', keys: 'ž' },
  { n: 41, title: 'ä, ň', keys: 'äň' },
  { n: 42, title: 'Precvičovanie učiva', type: 'review' },
  { n: 43, title: 'Mäkčeň', keys: 'ď', type: 'caron', show: 'ˇ ď Č Š Ž' },
  { n: 44, title: 'Dĺžeň', keys: 'óĺŕ', type: 'acute', show: '´ ó ĺ ŕ Á' },
  { n: 45, title: 'Nácvik textu', type: 'text' },
  { n: 46, title: 'Precvičovanie (znaky v cudzích jazykoch)', type: 'review' },
  { n: 47, title: 'Precvičovanie písania po anglicky', type: 'en', show: 'English' },
  { n: 48, title: 'Precvičovanie písania po nemecky', type: 'de', show: 'Deutsch' },
  { n: 49, title: 'Nácvik textu', type: 'text' },
  { n: 50, title: 'Otáznik, výkričník', keys: '?!' },
  { n: 51, title: 'Dvojbodka, bodkočiarka', keys: ':;' },
  { n: 52, title: 'Úvodzovky, znamienko opakovania', keys: '"' },
  { n: 53, title: 'Zátvorky, lomka', keys: '()/' },
  { n: 54, title: 'Precvičovanie učiva', type: 'review' },
  { n: 55, title: 'Podčiarkovacie znamienko', keys: '_' },
  { n: 56, title: 'Precvičovanie učiva', type: 'review' },
  { n: 57, title: 'Číslice 5, 8, paragraf', keys: '58§' },
  { n: 58, title: 'Číslice 4, 9, percento', keys: '49%' },
  { n: 59, title: 'Číslice 3, 0', keys: '30' },
  { n: 60, title: 'Číslica 1, matematické značky, stupeň', keys: '1+=°' },
  { n: 61, title: 'Číslice 6, 7, zlomky, palce', keys: '67' },
  { n: 62, title: 'Číslica 2, dátum a čas', keys: '2' },
  { n: 63, title: 'Precvičovanie (indexy, mocniny)', type: 'review' },
  { n: 64, title: 'Precvičovanie učiva', type: 'review' },
  { n: 65, title: 'Rímske číslice', type: 'roman', show: 'I V X L C D M' },
  { n: 66, title: 'Precvičovanie učiva', type: 'review' },
];

/* English and German words for lessons 29, 30, 47, 48 (our own lists). */
const EN_WORDS = `the and you that was for are with his they this have from one had word but not what all were when your can
said there use each which she how their will other about out many then them these some her would make like him into time
has look two more write see number way could people than first water been call who now find long down day did get come
made may part company business office letter market price money bank account order customer manager meeting report product
service sale sales invoice payment contract team work job plan goal email phone today tomorrow week month year good new big
small best open close send buy sell pay help school student teacher book page keyboard computer finger fast slow home family
friend city street house car train travel hotel coffee water lunch dinner please thank thanks sorry yes hello dear sir madam
regards sincerely offer delivery stock goods quality cost profit loss budget meeting partner client deal`.split(/\s+/);

const DE_WORDS = `und der die das ist nicht ein eine ich du er sie wir ihr mit auf von zu den dem des im in an aus bei nach wie was
wer wo wann warum ja nein gut neu alt klein schnell langsam heute morgen gestern immer nie oft machen haben sein gehen kommen
sehen sagen geben nehmen schreiben lesen lernen kaufen verkaufen zahlen senden helfen spielen wohnen leben arbeiten mutig
eigen bitte danke hallo sehr viel wenig mehr hier dort jetzt dann noch schon auch aber oder denn weil wenn dass später
erklären`.split(/\s+/);
/* German nouns are written with a capital letter. */
const DE_NOUNS = `Firma Arbeit Geld Bank Konto Preis Markt Kunde Chef Team Plan Ziel Brief Termin Vertrag Rechnung Zahlung Ware Lager
Angebot Auftrag Bestellung Lieferung Haus Stadt Land Schule Lehrer Buch Seite Wort Satz Text Zeit Tag Woche Monat Jahr Abend
Nacht Wasser Kaffee Tee Brot Essen Mann Frau Kind Freund Freundin Leben Weg Hand Kopf Name Problem Frage Antwort Stärke Länder
Männer Gebäude`.split(/\s+/);

// The Slovak word list (SK_WORDS) lives in js/words.js.

// Texts for the "Sprint" game (sentences)
const SK_SENTENCES = [
  'Obchodná akadémia pripravuje študentov na prácu v kancelárii.',
  'Každý deň trénujem písanie všetkými desiatimi prstami.',
  'Firma poslala zákazníkovi faktúru aj dodací list.',
  'Na porade sme sa dohodli na novom termíne dodávky.',
  'Rýchle písanie bez chýb je dôležitá zručnosť.',
  'Pozrite sa na obrazovku, nie na klávesnicu.',
  'Ráno pijem čaj a večer čítam zaujímavú knihu.',
  'Odberateľ žiada zľavu z ceny tovaru.',
  'Sekretariát riaditeľa vybavuje poštu a telefonáty.',
  'V zime padá sneh a na horách sa lyžuje.',
];
