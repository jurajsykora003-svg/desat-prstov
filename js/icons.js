/* =========================================================================
   ICONS – small SVG set (paths from Lucide, ISC licence) + game pictograms.
   Usage in HTML: <i data-icon="copy"></i>   In JS: icon('copy')
   ========================================================================= */
const ICON_PATHS = {
  'volume': '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
  'volume-off': '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  'copy': '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  'restart': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  'alert': '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'heart': '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'play': '<path d="m6 3 14 9-14 9V3Z"/>',
  'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>',
};

function icon(name, cls = '') {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

/* Geometric pictograms for the games (Swiss-poster style). */
const PICTOS = {
  rain: `<svg viewBox="0 0 64 64" class="picto" aria-hidden="true">
    <rect x="10" y="6" width="4" height="22" fill="currentColor"/><rect x="24" y="6" width="4" height="34" fill="currentColor"/>
    <rect x="38" y="6" width="4" height="14" fill="currentColor"/><rect x="50" y="6" width="4" height="26" fill="currentColor"/>
    <rect x="20" y="46" width="12" height="12" class="acc"/><rect x="4" y="60" width="56" height="2" fill="currentColor"/></svg>`,
  sprint: `<svg viewBox="0 0 64 64" class="picto" aria-hidden="true">
    <rect x="4" y="14" width="22" height="6" fill="currentColor"/><rect x="4" y="29" width="34" height="6" fill="currentColor"/>
    <rect x="4" y="44" width="14" height="6" fill="currentColor"/><path d="M44 12 60 32 44 52Z" class="acc"/></svg>`,
  letters: `<svg viewBox="0 0 64 64" class="picto" aria-hidden="true">
    <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="4"/>
    <circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" stroke-width="4"/>
    <circle cx="32" cy="32" r="6" class="acc"/></svg>`,
};

function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });
}
