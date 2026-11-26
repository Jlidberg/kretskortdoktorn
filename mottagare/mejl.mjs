// Bygger mejlet av en inlämning. Ren funktion – testas i mejl.test.mjs.

export const FALT = [
  ['arendenummer', 'Ärendenummer'],
  ['prioritet', 'Prioritet'],
  ['namn', 'Namn'],
  ['foretag', 'Företag och org.nr'],
  ['telefon', 'Telefon'],
  ['epost', 'E-post'],
  ['enhetstyp', 'Typ av enhet'],
  ['fabrikat', 'Fabrikat och modell'],
  ['serienummer', 'Serienummer'],
  ['spanning', 'Matningsspänning'],
  ['omrade', 'Var sitter enheten'],
  ['felbeskrivning', 'Felbeskrivning'],
  ['nar', 'När uppstod felet'],
  ['leverans', 'Leverans'],
  ['platsjobb', 'Jobb på plats'],
  ['platsadress', 'Adress för jobb på plats'],
  ['betalning', 'Betalning'],
  ['villkor', 'Godkänt villkoren'],
];

export const MAX_FILER = 6;
export const MAX_BYTE = 10 * 1024 * 1024;
const BILDTYPER = /^image\/(jpeg|png|webp|heic|heif|gif)$/;

const ren = (v, max = 4000) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);
const escHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okEpost = s => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s);
const okNr = s => /^KD-\d{6}-\d{4}$/.test(s);

/** Tar emot FormData och returnerar { fel } eller { mejl } (utan from/to). */
export async function byggMejl(fd) {
  if (ren(fd.get('_honey'))) return { spam: true };
  const v = Object.fromEntries(FALT.map(([k]) => [k, ren(fd.get(k))]));
  if (!v.namn || !v.telefon || !v.felbeskrivning) return { fel: 'Namn, telefon och felbeskrivning måste fyllas i.' };
  if (v.epost && !okEpost(v.epost)) return { fel: 'E-postadressen ser inte rätt ut.' };
  if (!okNr(v.arendenummer)) v.arendenummer = '';

  const bilagor = [];
  for (const [k, f] of fd.entries()) {
    if (!/^foto\d+$/.test(k) || typeof f === 'string') continue;
    if (bilagor.length >= MAX_FILER) return { fel: `Högst ${MAX_FILER} foton.` };
    if (f.size > MAX_BYTE) return { fel: 'En bild är större än 10 MB.' };
    if (!BILDTYPER.test(f.type)) return { fel: 'Bara bilder kan bifogas.' };
    bilagor.push({ filename: ren(f.name, 120).replace(/[^\w.\- åäöÅÄÖ]/g, '_') || `${k}.jpg`, content: Buffer.from(await f.arrayBuffer()), contentType: f.type });
  }

  const rader = FALT.filter(([k]) => v[k]);
  const nr = v.arendenummer || 'utan nummer';
  return {
    mejl: {
      subject: `Ny inlämning ${nr} – Kretskortsdoktorn${v.prioritet === 'akut' ? ' (AKUT)' : ''}`,
      replyTo: v.epost && okEpost(v.epost) ? { name: v.namn, address: v.epost } : undefined,
      text: rader.map(([k, l]) => `${l}: ${v[k]}`).join('\n') + `\n\nFoton: ${bilagor.length}\n`,
      html: `<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${
        rader.map(([k, l]) => `<tr><th align="left" valign="top" style="border-bottom:1px solid #ddd">${l}</th><td style="border-bottom:1px solid #ddd;white-space:pre-wrap">${escHtml(v[k])}</td></tr>`).join('')
      }</table><p style="font-family:sans-serif">Foton: ${bilagor.length}</p>`,
      attachments: bilagor,
    },
  };
}
