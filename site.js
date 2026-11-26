{
  // Mobilmeny
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }
  // Etiketter för tabellceller på mobil
  for (const t of document.querySelectorAll('table.stack')) {
    const heads = [...t.rows[0].cells].map(c => c.textContent);
    for (const r of t.tBodies[0].rows) [...r.cells].forEach((c, i) => c.dataset.l = heads[i] || '');
  }
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Inlämningsformulär
  const form = document.getElementById('inlamning');
  if (form) {
    // Sätt adressen till er formulärtjänst/server här (t.ex. ett PHP-skript eller en formulärtjänst
    // som mejlar till verkstadens e-post). Tomt värde = visningsläge utan utskick.
    const ENDPOINT = form.dataset.endpoint || '';
    const MAX_FILES = 6, MAX_MB = 10;
    let files = [];

    const drop = document.getElementById('drop');
    const input = document.getElementById('foton');
    const thumbs = document.getElementById('thumbs');
    const fileErr = document.getElementById('fil-fel');

    const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    const render = () => {
      thumbs.innerHTML = files.map((f, i) =>
        `<figure><img src="${f.url}" alt="Foto ${i + 1}: ${esc(f.file.name)}"><button type="button" data-i="${i}" aria-label="Ta bort foto ${i + 1}">×</button></figure>`).join('');
    };
    const add = list => {
      fileErr.textContent = '';
      for (const file of list) {
        if (!file.type.startsWith('image/')) { fileErr.textContent = 'Endast bildfiler kan laddas upp.'; continue; }
        if (file.size > MAX_MB * 1048576) { fileErr.textContent = `En bild är större än ${MAX_MB} MB och hoppades över.`; continue; }
        if (files.length >= MAX_FILES) { fileErr.textContent = `Högst ${MAX_FILES} foton.`; break; }
        files.push({ file, url: URL.createObjectURL(file) });
      }
      render();
    };
    input.addEventListener('change', () => { add(input.files); input.value = ''; });
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => add(e.dataTransfer.files));
    thumbs.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const [rm] = files.splice(+b.dataset.i, 1); URL.revokeObjectURL(rm.url); render();
    });

    // Visa postinstruktion bara när "skickar med post" är valt
    const postInfo = document.getElementById('post-info');
    const platsInfo = document.getElementById('plats-info');
    const lev = () => {
      const v = form.leverans.value;
      postInfo.classList.toggle('hide', v !== 'post');
      platsInfo.classList.toggle('hide', v !== 'plats');
      form.platsadress.required = v === 'plats';
    };
    form.querySelectorAll('input[name=leverans]').forEach(r => r.addEventListener('change', lev));
    // Länk från "Beställ tekniker på plats" (#pa-plats)
    const fromHash = () => {
      if (location.hash === '#pa-plats') {
        form.querySelector('input[name=leverans][value=plats]').checked = true;
        lev();
        document.getElementById('formular').scrollIntoView();
      }
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();

    // Prioritet: pris och akutinfo följer valet
    const NIVA = { standard: ['Standard', '2 500 kr'], prio: ['Prio', '3 250 kr'], akut: ['Akut', '5 000 kr'] };
    const akutInfo = document.getElementById('akut-info');
    const prio = () => {
      const v = form.prioritet.value || 'standard';
      document.querySelectorAll('.fs-pris').forEach(el => el.textContent = NIVA[v][1]);
      akutInfo.classList.toggle('hide', v !== 'akut');
    };
    form.querySelectorAll('input[name=prioritet]').forEach(r => r.addEventListener('change', prio));
    prio();

    // Spara utkast i webbläsaren (bara för den som fyller i)
    const KEY = 'kd-utkast';
    const fields = ['namn', 'foretag', 'telefon', 'epost', 'enhetstyp', 'omrade', 'spanning', 'fabrikat', 'serienummer', 'felbeskrivning'];
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      fields.forEach(n => { if (saved[n] && form[n]) form[n].value = saved[n]; });
    } catch (e) {}
    form.addEventListener('input', () => {
      try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(fields.map(n => [n, form[n].value])))); } catch (e) {}
    });

    const caseNo = () => {
      const d = new Date(), p = n => String(n).padStart(2, '0');
      return `KD-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const errBox = document.getElementById('form-fel');
      errBox.textContent = '';
      if (!form.checkValidity()) {
        const bad = form.querySelector('input:invalid,select:invalid,textarea:invalid');
        errBox.textContent = 'Fyll i de obligatoriska fälten markerade med *.';
        bad && bad.focus();
        return;
      }
      const nr = caseNo();
      const data = new FormData(form);
      data.set('arendenummer', nr);
      // Fält som formulärtjänsten (FormSubmit/Formspree) läser: ämnesrad, svarsadress, tabell-layout
      data.set('_subject', `Ny inlämning ${nr} – Kretskortsdoktorn`);
      data.set('_replyto', form.epost.value);
      data.set('_template', 'table');
      files.forEach((f, i) => data.append('foto' + (i + 1), f.file, f.file.name));

      if (ENDPOINT) {
        const sb = form.querySelector('[type=submit]');
        sb.disabled = true; sb.textContent = 'Skickar…';
        try {
          const r = await fetch(ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error();
        } catch (err) {
          errBox.textContent = 'Det gick inte att skicka just nu. Försök igen eller ring oss.';
          sb.disabled = false; sb.textContent = 'Skicka in ärendet';
          return;
        }
      }

      try { localStorage.removeItem(KEY); } catch (e) {}
      const post = form.leverans.value === 'post';
      const niva = form.prioritet.value || 'standard';
      document.getElementById('d-niva').textContent = NIVA[niva][0];
      document.getElementById('d-akut').classList.toggle('hide', niva !== 'akut');
      prio();
      document.getElementById('d-nr').textContent = nr;
      document.querySelectorAll('.d-nr').forEach(el => el.textContent = nr);
      const plats = form.leverans.value === 'plats';
      document.getElementById('d-post').classList.toggle('hide', !post);
      document.getElementById('d-plats').classList.toggle('hide', !plats);
      document.getElementById('d-lamna').classList.toggle('hide', post || plats);
      document.getElementById('d-demo').classList.toggle('hide', !!ENDPOINT);
      // Följesedel
      const val = n => (form[n] && form[n].value) || '–';
      const sel = form.enhetstyp;
      document.getElementById('s-nr').textContent = 'Ärende ' + nr;
      ['namn', 'foretag', 'telefon', 'epost', 'omrade', 'spanning', 'fabrikat', 'serienummer', 'felbeskrivning', 'nar', 'betalning']
        .forEach(n => document.getElementById('s-' + n).textContent = val(n));
      document.getElementById('s-enhetstyp').textContent = sel.options[sel.selectedIndex].text;
      document.getElementById('s-prio').textContent = NIVA[niva][0];
      form.classList.add('hide');
      const done = document.getElementById('klart');
      document.getElementById('skriv-ut').onclick = () => {
        try { window.print(); } catch (err) { document.getElementById('print-fel').classList.remove('hide'); }
      };
      done.classList.remove('hide');
      done.focus();
      done.scrollIntoView({ block: 'start' });
    });
  }
}
