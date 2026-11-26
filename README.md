# Kretskortsdoktorn

Webbplats för Kretskortsdoktorn – reparation av kretskort och styrelektronik på komponentnivå.
Drivs av Marin Service Gruppen Nordic AB, Sjöängsvägen 4, 804 29 Gävle.

Statisk webbplats: ren HTML, CSS och JavaScript. Inget byggsteg och inga beroenden.

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

Sidhuvud och sidfot finns i varje HTML-fil. Ändras något där, ändra i alla fem filerna.

## Publicera med GitHub Pages

1. Skapa ett repo på GitHub och ladda upp filerna (eller `git push`).
2. Repo → **Settings → Pages** → Source: *Deploy from a branch*, gren `main`, mapp `/ (root)`.
3. Filen `CNAME` sätter domänen till `kretskortsdoktorn.se`. Hos domänleverantören:
   - `A`-poster för `kretskortsdoktorn.se`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` för `www`: `<ditt-github-konto>.github.io`
4. Bocka i **Enforce HTTPS** när certifikatet är klart.

Kontrollera IP-adresserna mot GitHubs dokumentation för Pages innan du lägger in dem.

## Innan lansering

- [ ] **Aktivera formuläret hos FormSubmit.** Inlämningar skickas via FormSubmit till adressen i `data-endpoint`
      på `<form id="inlamning">` i `lamna-in.html` (tomt värde = visningsläge, inget skickas). Första inlämningen
      ger ett mejl "Activate Form" till mottagaren – inget levereras förrän någon klickat på det. Tills dess får
      kunden ett felmeddelande i stället för kvittensen.
- [ ] Fyll i villkorssidan (alla gulmarkerade platshållare).
- [ ] Lägg in bilder på verkstaden och teknikern under *Om oss* (`index.html`).
- [ ] Lägg typsnitten (Inter, Archivo) på egen server i stället för Google Fonts, för GDPR.
- [ ] Ärendenumret skapas i webbläsaren (`KD-ååmmdd-nnnn`). På sikt: hämta nummer från MGX.

## Kontakt

026-12 66 66 · info@marinservice.se · [marinservice.se](https://marinservice.se)
