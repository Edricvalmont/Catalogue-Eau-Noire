/* =====================================================================
   L'EAU NOIRE — PAGE DES STOCKS
   Deux modes :
   - EN DIRECT (STOCKS_EN_LIGNE renseigné dans stocks.js) : les quantités
     sont lues et enregistrées dans une feuille Google partagée. Les
     forgerons modifient directement sur le site avec un mot de passe.
   - FICHIER (STOCKS_EN_LIGNE vide) : la page lit stocks.js ; les
     modifications s'exportent dans un nouveau stocks.js à publier.
   ===================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const norm = s => (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("eaunoire-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("eaunoire-" + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem("eaunoire-" + k); } catch (e) {} },
  };

  const API = (typeof STOCKS_EN_LIGNE === "string" && STOCKS_EN_LIGNE.trim()) || "";
  const ONLINE = !!API;

  /* ---------- Données ---------- */
  const ALL = [];
  STOCKS.categories.forEach(c => c.items.forEach(it => { it._cat = c.nom; it._search = norm(it.nom + " " + c.nom); ALL.push(it); }));
  const byId = Object.fromEntries(ALL.map(it => [it.id, it]));

  // Quantités « officielles » : feuille Google en direct, sinon stocks.js
  let serveur = null;            // { qte: {...}, maj, par }
  let etatConnexion = ONLINE ? "chargement" : "fichier";
  const base = it => (serveur && serveur.qte[it.id] != null ? serveur.qte[it.id] : it.qte);

  // Brouillon local des modifications non enregistrées
  const draftKey = ONLINE ? "online" : STOCKS.maj;
  let draft = store.get("stock-draft", null);
  if (!draft || draft.maj !== draftKey) draft = { maj: draftKey, qte: {} };
  const qte = it => (draft.qte[it.id] ?? base(it));
  const changedIds = () => Object.keys(draft.qte).filter(id => byId[id] && draft.qte[id] !== base(byId[id]));

  const etat = it => qte(it) <= 0 ? "rupture" : qte(it) < it.seuil ? "bas" : "ok";
  const LABEL = { rupture: "Rupture", bas: "Stock bas", ok: "Disponible" };

  let cat = "Tout", alertOnly = false, editMode = false, saving = false, message = "";

  /* ---------- Dates ---------- */
  const fmtDate = d => { const x = new Date(/T/.test(d) ? d : d + "T12:00:00"); return isNaN(x) ? d : x.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); };
  const fmtDateHeure = d => { const x = new Date(d); return isNaN(x) ? d : x.toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); };
  function renderStatus() {
    let t;
    if (etatConnexion === "chargement") t = "Connexion aux stocks en direct…";
    else if (etatConnexion === "direct") t = "● En direct" + (serveur.maj ? " · modifié le " + fmtDateHeure(serveur.maj) : "") + (serveur.par ? " par " + serveur.par : "");
    else if (etatConnexion === "erreur") t = "Stocks en direct injoignables : affichage du dernier inventaire publié (" + fmtDate(STOCKS.maj) + ")";
    else t = "Inventaire du " + fmtDate(STOCKS.maj) + (STOCKS.par ? " · par " + STOCKS.par : "");
    $("#stock-maj").textContent = t;
    $("#stock-maj").classList.toggle("live", etatConnexion === "direct");
  }

  /* ---------- Onglets ---------- */
  ["Tout", ...STOCKS.categories.map(c => c.nom)].forEach(c => {
    const b = document.createElement("button");
    b.className = "tab"; b.type = "button"; b.textContent = c;
    b.setAttribute("aria-pressed", c === cat);
    b.onclick = () => { cat = c; document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-pressed", x === b)); render(); };
    $("#tabs").appendChild(b);
  });

  /* ---------- Résumé ---------- */
  function renderSummary() {
    const n = { rupture: 0, bas: 0, ok: 0 };
    ALL.forEach(it => n[etat(it)]++);
    $("#stock-summary").innerHTML = `
      <div class="sum"><strong>${ALL.length}</strong><span>matériaux suivis</span></div>
      <div class="sum ok"><strong>${n.ok}</strong><span>disponibles</span></div>
      <div class="sum bas"><strong>${n.bas}</strong><span>stocks bas</span></div>
      <div class="sum rupture"><strong>${n.rupture}</strong><span>en rupture</span></div>`;
  }

  /* ---------- Bandeau des modifications ---------- */
  function renderDraftBar() {
    const n = changedIds().length;
    const bar = $("#draft-bar");
    bar.hidden = !n && !message;
    if (bar.hidden) return;
    if (!n) { bar.innerHTML = `<p class="draft-ok">${esc(message)}</p>`; return; }
    if (ONLINE && etatConnexion === "direct") {
      bar.innerHTML = `
        <p><strong>${n} modification${n > 1 ? "s" : ""} à enregistrer.</strong> Elles seront visibles par tous dès l'enregistrement.
          ${message ? `<span class="draft-err">${esc(message)}</span>` : ""}</p>
        <div class="draft-form">
          <input id="f-nom" type="text" placeholder="Votre nom" value="${esc(store.get("nom", ""))}" autocomplete="nickname">
          <input id="f-mdp" type="password" placeholder="Mot de passe" value="${esc(store.get("mdp", ""))}" autocomplete="current-password">
          <button class="btn-ghost" id="draft-reset" type="button">Annuler</button>
          <button class="btn" id="draft-save" type="button" ${saving ? "disabled" : ""}>${saving ? "Enregistrement…" : "Enregistrer"}</button>
        </div>`;
    } else {
      bar.innerHTML = `
        <p><strong>${n} modification${n > 1 ? "s" : ""} non publiée${n > 1 ? "s" : ""}.</strong> Elles ne sont enregistrées que dans ce navigateur. Exportez <code>stocks.js</code> puis publiez-le pour que tout le monde les voie.</p>
        <div class="draft-actions">
          <button class="btn-ghost" id="draft-reset" type="button">Annuler</button>
          <button class="btn" id="draft-export" type="button">Exporter stocks.js</button>
        </div>`;
    }
  }

  /* ---------- Liste ---------- */
  function render() {
    const words = norm($("#search").value).split(/\s+/).filter(Boolean);
    let html = "";
    STOCKS.categories.forEach(c => {
      if (cat !== "Tout" && c.nom !== cat) return;
      const items = c.items.filter(it => words.every(w => it._search.includes(w)) && (!alertOnly || etat(it) !== "ok"));
      if (!items.length) return;
      html += `<div class="stock-cat"><h3>${esc(c.nom)} <small>${items.length}</small></h3><div class="stock-grid">
        ${items.map(it => {
          const q = qte(it), e = etat(it), changed = draft.qte[it.id] != null && draft.qte[it.id] !== base(it);
          const pct = Math.min(100, Math.round(q / Math.max(1, it.seuil * 2) * 100));
          const src = "images/materiaux/" + (it.img || it.id + ".webp");
          return `<div class="stock-card ${e}${changed ? " changed" : ""}">
            <div class="stock-icon"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph'}))"></div>
            <div class="stock-info">
              <span class="stock-name">${esc(it.nom)}</span>
              <span class="chip ${e}">${LABEL[e]}</span>
              <div class="bar"><i style="width:${pct}%"></i></div>
              <span class="stock-seuil">Seuil : ${it.seuil}${changed ? ` · avant : ${base(it)}` : ""}</span>
            </div>
            <div class="stock-qty">
              ${editMode ? `<div class="qty-edit">
                  <button type="button" data-id="${it.id}" data-d="-1" aria-label="Retirer">−</button>
                  <input type="number" min="0" inputmode="numeric" value="${q}" data-id="${it.id}" aria-label="Quantité de ${esc(it.nom)}">
                  <button type="button" data-id="${it.id}" data-d="1" aria-label="Ajouter">+</button>
                </div>` : `<strong>${q}</strong><small>en stock</small>`}
            </div>
          </div>`;
        }).join("")}
      </div></div>`;
    });
    $("#stock-list").classList.toggle("editing", editMode);
    $("#stock-list").innerHTML = html || '<p class="empty">Aucun matériau ne correspond.</p>';
    renderSummary();
    renderDraftBar();
    renderStatus();
  }

  /* ---------- Modification ---------- */
  function setQty(id, v) {
    const it = byId[id]; if (!it) return;
    v = Math.max(0, Math.round(Number(v) || 0));
    if (v === base(it)) delete draft.qte[id]; else draft.qte[id] = v;
    message = "";
    store.set("stock-draft", draft);
  }
  function resetDraft() { draft = { maj: draftKey, qte: {} }; store.del("stock-draft"); message = ""; render(); }

  document.addEventListener("click", e => {
    const b = e.target.closest(".qty-edit button");
    if (b) { setQty(b.dataset.id, qte(byId[b.dataset.id]) + (+b.dataset.d)); render(); return; }
    if (e.target.closest("#draft-reset")) { resetDraft(); return; }
    if (e.target.closest("#draft-export")) { exporter(); return; }
    if (e.target.closest("#draft-save")) { enregistrer(); return; }
  });
  document.addEventListener("change", e => {
    if (e.target.matches(".qty-edit input")) { setQty(e.target.dataset.id, e.target.value); render(); }
    if (e.target.id === "f-nom") store.set("nom", e.target.value.trim());
    if (e.target.id === "f-mdp") store.set("mdp", e.target.value);
  });
  $("#t-edit").onchange = e => { editMode = e.target.checked; render(); };
  $("#t-alert").onchange = e => { alertOnly = e.target.checked; render(); };
  $("#search").addEventListener("input", render);

  /* ---------- Mode EN DIRECT : lecture et enregistrement ---------- */
  async function charger() {
    try {
      const r = await fetch(API + (API.includes("?") ? "&" : "?") + "t=" + Date.now());
      const d = await r.json();
      if (!d || typeof d.qte !== "object") throw new Error("Réponse inattendue");
      serveur = d; etatConnexion = "direct";
    } catch (err) {
      if (!serveur) etatConnexion = "erreur";
    }
    // Retire du brouillon ce qui correspond déjà aux quantités officielles
    Object.keys(draft.qte).forEach(id => { if (byId[id] && draft.qte[id] === base(byId[id])) delete draft.qte[id]; });
    render();
  }

  async function enregistrer() {
    const nom = ($("#f-nom")?.value || "").trim(), mdp = $("#f-mdp")?.value || "";
    if (!nom) { message = "Indiquez votre nom (il apparaît dans l'historique)."; render(); $("#f-nom")?.focus(); return; }
    if (!mdp) { message = "Indiquez le mot de passe de la forge."; render(); $("#f-mdp")?.focus(); return; }
    store.set("nom", nom); store.set("mdp", mdp);
    const changements = {};
    changedIds().forEach(id => changements[id] = { qte: draft.qte[id], nom: byId[id].nom });
    saving = true; message = ""; render();
    try {
      // Envoi en texte brut : évite le blocage CORS des scripts Google
      const r = await fetch(API, { method: "POST", body: JSON.stringify({ motDePasse: mdp, nom, changements }) });
      const d = await r.json();
      if (d.erreur) {
        message = d.erreur;
        if (/mot de passe/i.test(d.erreur)) store.del("mdp");
      } else {
        serveur = d; etatConnexion = "direct";
        draft = { maj: draftKey, qte: {} }; store.del("stock-draft");
        message = "Stocks enregistrés. Merci " + nom + " !";
        setTimeout(() => { if (message.startsWith("Stocks enregistrés")) { message = ""; render(); } }, 4000);
      }
    } catch (err) {
      message = "Impossible de joindre les stocks en direct. Vos modifications sont conservées, réessayez.";
    }
    saving = false; render();
  }

  if (ONLINE) {
    charger();
    // Rafraîchit quand on revient sur l'onglet et toutes les 20 s (si on ne modifie rien)
    document.addEventListener("visibilitychange", () => { if (!document.hidden && !changedIds().length) charger(); });
    setInterval(() => { if (!document.hidden && !changedIds().length && !saving) charger(); }, 20000);
  }

  /* ---------- Mode FICHIER : export d'un nouveau stocks.js ---------- */
  function exporter() {
    const today = new Date().toISOString().slice(0, 10);
    const pad = (s, n) => s + " ".repeat(Math.max(1, n - s.length));
    const body = STOCKS.categories.map(c => `    { nom: ${JSON.stringify(c.nom)}, items: [\n` +
      c.items.map(it => `      { id: ${pad(JSON.stringify(it.id) + ",", 38)}nom: ${pad(JSON.stringify(it.nom) + ",", 38)}qte: ${qte(it)}, seuil: ${it.seuil}${it.img ? ", img: " + JSON.stringify(it.img) : ""} },`).join("\n") +
      `\n    ]},`).join("\n");
    const file = `/* =====================================================================
   STOCKS DE LA FORGE DE L'EAU NOIRE
   ---------------------------------------------------------------------
   qte   : quantité en stock
   seuil : en dessous de ce nombre, le matériau passe en « stock bas »
           (à 0 il est « en rupture »)
   img   : (optionnel) autre image que images/materiaux/<id>.webp

   Méthode la plus simple : sur la page Stocks, activez « Modifier »,
   ajustez les quantités puis cliquez « Exporter stocks.js ». Remplacez
   ce fichier par celui téléchargé et publiez (git add / commit / push).
   ===================================================================== */

/* Adresse de la feuille Google partagée (voir LISEZMOI.txt, « Stocks en direct »).
   Laisse "" pour fonctionner sans : la page lit alors simplement ce fichier. */
const STOCKS_EN_LIGNE = ${JSON.stringify(API)};

const STOCKS = {
  maj: "${today}",   // date de la dernière mise à jour (AAAA-MM-JJ)
  par: ${JSON.stringify(STOCKS.par || "")},             // (optionnel) qui a fait l'inventaire
  categories: [
${body}
  ],
};
`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([file], { type: "text/javascript" }));
    a.download = "stocks.js"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- Liste de réapprovisionnement à copier ---------- */
  $("#report-copy").onclick = async () => {
    const r = ALL.filter(it => etat(it) === "rupture"), b = ALL.filter(it => etat(it) === "bas");
    const date = serveur && serveur.maj ? fmtDate(serveur.maj) : fmtDate(STOCKS.maj);
    const txt = [`Réapprovisionnement — Forge de l'Eau Noire (${date})`,
      r.length ? "En rupture :\n" + r.map(it => `- ${it.nom} (objectif ${it.seuil})`).join("\n") : "",
      b.length ? "Stock bas :\n" + b.map(it => `- ${it.nom} : ${qte(it)} / ${it.seuil}`).join("\n") : "",
      !r.length && !b.length ? "Tous les stocks sont au-dessus de leur seuil." : ""].filter(Boolean).join("\n\n");
    const btn = $("#report-copy"), old = btn.textContent;
    try { await navigator.clipboard.writeText(txt); btn.textContent = "Copié !"; }
    catch (e) { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); btn.textContent = document.execCommand("copy") ? "Copié !" : "Échec"; ta.remove(); }
    setTimeout(() => btn.textContent = old, 1600);
  };

  /* ---------- Divers ---------- */
  $("#burger").onclick = () => $(".nav").classList.toggle("menu-open");
  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); $("#search").focus(); }
  });

  render();
})();
