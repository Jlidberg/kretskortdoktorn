# Kretskortsdoktorn

Webbplats för Kretskortsdoktorn – reparation av kretskort och styrelektronik på komponentnivå.
Drivs av Marin Service Gruppen Nordic AB, Sjöängsvägen 4, 804 29 Gävle.

Statisk webbplats: ren HTML, CSS och JavaScript utan byggsteg. Inlämningsformuläret tas emot av en liten
mottagare (`mottagare/`, Node) som mejlar ärendet med fotona bifogade.

## Filer

| Fil | Innehåll |
| --- | --- |
| `index.html` | Startsida med alla sektioner |
| `priser.html` | Priser, prio och akut |
| `lamna-in.html` | Inlämningsformulär och följesedel |
| `villkor.html` | Villkor och integritetspolicy (platshållartext) |
| `404.html` | Sida som visas när en länk är fel |
| `style.css` | All stil för alla sidor |
| `site.js` | Mobilmeny, formulär, följesedel |
| `img/` | Logga och ikoner (`logga-original.png` = full upplösning) |
| `CNAME`, `robots.txt`, `sitemap.xml` | Domän och sökmotorer |
| `mottagare/` | Tar emot `POST /api/inlamning` och mejlar via SMTP (`npm test` kör testerna) |
| `deploy/` | `docker-compose.yml` (nginx + mottagaren), `nginx.conf`, `.env.example` |

Sidhuvud och sidfot finns i varje HTML-fil. Ändras något där, ändra i alla fem filerna.

## Drift

Sidan körs i CT 103 (MGX-Platform) på destiny, `/opt/kretskortsdoktorn`. nginx visar filerna på port 8090
och skickar `/api/inlamning` till mottagaren. Traefik (CT 101) tar `kretskortsdoktorn.se` och `www` dit.
DNS i Cloudflare: `@` och `www` → destiny, orange moln, SSL/TLS **Full**.

Första gången:

```bash
cd /opt/kretskortsdoktorn/deploy
cp .env.example .env && chmod 600 .env   # fyll i SMTP_PASS (lösenordet finns i Vaultwarden)
docker compose up -d --build
```

Uppdatera efter en push:

```bash
cd /opt/kretskortsdoktorn && git pull && cd deploy && docker compose up -d --build
```

Ändringar i HTML, CSS och JS syns direkt efter `git pull`; `--build` behövs bara när `mottagare/` ändrats.
Loggen över skickade inlämningar: `docker compose logs mottagare`.

## Innan lansering

- [ ] Fyll i villkorssidan (alla gulmarkerade platshållare).
- [ ] Lägg in bilder på verkstaden och teknikern under *Om oss* (`index.html`).
- [ ] Lägg typsnitten (Inter, Archivo) på egen server i stället för Google Fonts, för GDPR.
- [ ] Ärendenumret skapas i webbläsaren (`KD-ååmmdd-nnnn`). På sikt: hämta nummer från MGX.

## Kontakt

026-12 66 66 · info@marinservice.se · [www.marinservice.se](https://www.marinservice.se)
