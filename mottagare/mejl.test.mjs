import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byggMejl } from './mejl.mjs';

const grund = () => { const f = new FormData(); f.set('namn', 'Anna'); f.set('telefon', '070'); f.set('felbeskrivning', 'Död'); f.set('arendenummer', 'KD-261126-1234'); return f; };

test('bygger mejl med fält och bild', async () => {
  const f = grund(); f.set('epost', 'anna@exempel.se'); f.set('prioritet', 'akut');
  f.append('foto1', new File([new Uint8Array(10)], 'kort.jpg', { type: 'image/jpeg' }));
  const { mejl } = await byggMejl(f);
  assert.match(mejl.subject, /KD-261126-1234.*AKUT/);
  assert.equal(mejl.replyTo.address, 'anna@exempel.se');
  assert.equal(mejl.attachments.length, 1);
  assert.match(mejl.text, /Felbeskrivning: Död/);
});
test('honeypot ger spam', async () => { const f = grund(); f.set('_honey', 'x'); assert.equal((await byggMejl(f)).spam, true); });
test('kräver namn, telefon, felbeskrivning', async () => { const f = grund(); f.delete('telefon'); assert.ok((await byggMejl(f)).fel); });
test('stoppar fel filtyp', async () => { const f = grund(); f.append('foto1', new File(['x'], 'a.exe', { type: 'application/octet-stream' })); assert.ok((await byggMejl(f)).fel); });
test('escapar html', async () => { const f = grund(); f.set('felbeskrivning', '<script>'); const { mejl } = await byggMejl(f); assert.ok(!mejl.html.includes('<script>')); });
test('ogiltigt ärendenummer tas bort', async () => { const f = grund(); f.set('arendenummer', 'hack'); assert.match((await byggMejl(f)).mejl.subject, /utan nummer/); });
