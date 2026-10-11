/* =====================================================================
   L'EAU NOIRE — PAGE DES STOCKS
   Affiche stocks.js, signale les ruptures et stocks bas, permet de
   modifier les quantités et d'exporter un nouveau stocks.js.
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

  // Brouillon local : { id: nouvelleQuantité } — ignoré si stocks.js a été republié depuis
  let draft = store.get("stock-draft", null);
  if (!draft || draft.maj !== STOCKS.maj) draft = { maj: STOCKS.maj, qte: {} };

  const ALL = [];
  STOCKS.categories.forEach(c => c.items.forEach(it => { it._cat = c.nom; it._search = norm(it.nom + " " + c.nom); ALL.push(it); }));

  const qte = it => (draft.qte[it.id] ?? it.qte);
  const etat = it => qte(it) <= 0 ? "rupture" : qte(it) < it.seuil ? "bas" : "ok";
  const LABEL = { rupture: "Rupture", bas: "Stock bas", ok: "Disponible" };

  let cat = "Tout";
  let alertOnly = false;
  let editMode = false;

  /* ---------- Date ---------- */
  const fmtDate = d => { const x = new Date(d + "T12:00:00"); return isNaN(x) ? d : x.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); };
  $("#stock-maj").textContent = "Inventaire du " + fmtDate(STOCKS.maj) + (STOCKS.par ? " · par " + STOCKS.par : "");

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
          const q = qte(it), e = etat(it), changed = draft.qte[it.id] != null && draft.qte[it.id] !== it.qte;
          const pct = Math.min(100, Math.round(q / Math.max(1, it.seuil * 2) * 100));
          const src = "images/materiaux/" + (it.img || it.id + ".webp");
          return `<div class="stock-card ${e}${changed ? " changed" : ""}">
            <div class="stock-icon"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph'}))"></div>
            <div class="stock-info">
              <span class="stock-name">${esc(it.nom)}</span>
              <span class="chip ${e}">${LABEL[e]}</span>
              <div class="bar"><i style="width:${pct}%"></i></div>
              <span class="stock-seuil">Seuil : ${it.seuil}</span>
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
    $("#draft-bar").hidden = !Object.keys(draft.qte).some(id => draft.qte[id] !== ALL.find(i => i.id === id)?.qte);
  }

  /* ---------- Modification ---------- */
  function setQty(id, v) {
    const it = ALL.find(i => i.id === id); if (!it) return;
    v = Math.max(0, Math.round(Number(v) || 0));
    if (v === it.qte) delete draft.qte[id]; else draft.qte[id] = v;
    store.set("stock-draft", draft);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest(".qty-edit button");
    if (b) { const id = b.dataset.id; const it = ALL.find(i => i.id === id); setQty(id, qte(it) + (+b.dataset.d)); render(); }
  });
  document.addEventListener("change", e => {
    if (e.target.matches(".qty-edit input")) { setQty(e.target.dataset.id, e.target.value); render(); }
  });
  $("#t-edit").onchange = e => { editMode = e.target.checked; render(); };
  $("#t-alert").onchange = e => { alertOnly = e.target.checked; render(); };
  $("#search").addEventListener("input", render);
  $("#draft-reset").onclick = () => { draft = { maj: STOCKS.maj, qte: {} }; store.del("stock-draft"); render(); };

  /* ---------- Export du nouveau stocks.js ---------- */
  $("#draft-export").onclick = () => {
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
  };

  /* ---------- Liste de réapprovisionnement à copier ---------- */
  $("#report-copy").onclick = async () => {
    const r = ALL.filter(it => etat(it) === "rupture"), b = ALL.filter(it => etat(it) === "bas");
    const txt = [`Réapprovisionnement — Forge de l'Eau Noire (${fmtDate(STOCKS.maj)})`,
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
