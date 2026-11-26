// Tar emot inlämningsformuläret (POST /api/inlamning) och mejlar det via SMTP.
// Inställningar i miljön: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO.
import http from 'node:http';
import nodemailer from 'nodemailer';
import { byggMejl, MAX_FILER, MAX_BYTE } from './mejl.mjs';

const env = k => { const v = process.env[k]; if (!v) { console.error(`Saknar ${k} i miljön`); process.exit(1); } return v; };
const PORT = Number(process.env.PORT || 3000);
const MAIL_FROM = env('MAIL_FROM'), MAIL_TO = env('MAIL_TO');
const smtp = nodemailer.createTransport({
  host: env('SMTP_HOST'), port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465, requireTLS: true,
  auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
});
const MAX_KROPP = MAX_FILER * MAX_BYTE + 2 * 1024 * 1024;

// Enkel spärr: högst 5 inlämningar per IP och 10 minuter.
const senaste = new Map();
const forManga = ip => {
  const nu = Date.now(), lista = (senaste.get(ip) || []).filter(t => nu - t < 600_000);
  lista.push(nu); senaste.set(ip, lista);
  if (senaste.size > 5000) senaste.clear();
  return lista.length > 5;
};

const svara = (res, kod, obj) => { res.writeHead(kod, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/inlamning/halsa') return svara(res, 200, { ok: true });
  if (req.url !== '/api/inlamning' || req.method !== 'POST') return svara(res, 404, { success: 'false', message: 'Finns inte' });
  const ip = String(req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.socket.remoteAddress);
  if (forManga(ip)) return svara(res, 429, { success: 'false', message: 'För många inlämningar – ring oss i stället.' });
  if (Number(req.headers['content-length'] || 0) > MAX_KROPP) return svara(res, 413, { success: 'false', message: 'För stora bilder.' });
  try {
    const delar = []; let storlek = 0;
    for await (const d of req) { storlek += d.length; if (storlek > MAX_KROPP) return svara(res, 413, { success: 'false', message: 'För stora bilder.' }); delar.push(d); }
    const fd = await new Request('http://x/', { method: 'POST', headers: { 'content-type': req.headers['content-type'] || '' }, body: Buffer.concat(delar) }).formData();
    const r = await byggMejl(fd);
    if (r.spam) return svara(res, 200, { success: 'true' });
    if (r.fel) return svara(res, 400, { success: 'false', message: r.fel });
    await smtp.sendMail({ from: MAIL_FROM, to: MAIL_TO, ...r.mejl });
    console.log(new Date().toISOString(), 'skickad', r.mejl.subject, `${r.mejl.attachments.length} foton`);
    svara(res, 200, { success: 'true' });
  } catch (e) {
    console.error(new Date().toISOString(), 'fel', e?.message);
    svara(res, 500, { success: 'false', message: 'Det gick inte att skicka.' });
  }
}).listen(PORT, () => console.log(`Mottagaren lyssnar på ${PORT}, mejlar till ${MAIL_TO}`));
