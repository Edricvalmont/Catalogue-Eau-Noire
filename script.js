/* =====================================================================
   L'EAU NOIRE — FONCTIONNEMENT
   Catalogue, filtres, licences, devis. Les prix et textes se changent
   dans data.js, pas ici.
   ===================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const norm = s => (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const M = BOUTIQUE.monnaie;
  const fmt = n => n.toLocaleString("fr-FR") + " " + M;
  const LIC = (typeof LICENCES !== "undefined") ? LICENCES : { origines: {} };
  const store = {
    get(k, d) { try { const v = localStorage.getItem("eaunoire-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("eaunoire-" + k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ---------- Textes de la communauté ---------- */
  $("#brand-name").textContent = BOUTIQUE.nom;
  $("#brand-sub").textContent = BOUTIQUE.sousTitre;
  $("#hero-lead").textContent = BOUTIQUE.accroche || "";
  if (typeof COMMUNAUTE !== "undefined") {
    $("#about-title").textContent = COMMUNAUTE.titre;
    $("#about-body").innerHTML = COMMUNAUTE.paragraphes.map(p => `<p>${esc(p)}</p>`).join("");
    $("#about-devise").textContent = COMMUNAUTE.devise ? "« " + COMMUNAUTE.devise + " »" : "";
    $("#footer-devise").textContent = COMMUNAUTE.devise || "";
    $("#footer-contact").textContent = COMMUNAUTE.contact || "";
  }

  /* ---------- Préparation des données ---------- */
  CATALOGUE.forEach(g => { g.items = g.items.map(it => ({ ...it })); });
  const ITEMS = {};
  CATALOGUE.forEach(g => g.items.forEach(it => {
    it._id = slug(g.groupe) + "-" + slug(it.nom);
    it._groupe = g.groupe;
    it._search = norm([g.groupe, g.categorie, it.nom, it.mat, g.licence ? "licence " + (LIC.origines[g.licence]?.nom || "") : ""].join(" "));
    ITEMS[it._id] = it;
  }));

  let cat = "Tout";
  let licOnly = false;
  let devis = store.get("devis", []);

  /* ---------- Onglets de catégories ---------- */
  ["Tout", ...new Set(CATALOGUE.map(g => g.categorie))].forEach(c => {
    const b = document.createElement("button");
    b.className = "tab"; b.type = "button"; b.textContent = c;
    b.setAttribute("aria-pressed", c === cat);
    b.onclick = () => { cat = c; document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-pressed", x === b)); render(); };
    $("#tabs").appendChild(b);
  });

  /* ---------- Images (essaie .webp, .png, .jpg) ---------- */
  const tries = base => ["webp", "png", "jpg"].map(x => base + "." + x);
  const imgTag = (cls, list, alt) =>
    `<img class="${cls}"${cls === "apercu-img" ? "" : ' loading="lazy"'} alt="${esc(alt)}" data-tries='${JSON.stringify(list)}' data-i="0" src="${esc(list[0])}">`;
  document.addEventListener("error", e => {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.dataset.tries) return;
    const list = JSON.parse(img.dataset.tries), i = +img.dataset.i + 1;
    if (i < list.length) { img.dataset.i = i; img.src = list[i]; return; }
    if (img.classList.contains("apercu-img")) {
      const s = img.closest(".set"); img.closest(".apercu")?.remove(); s?.classList.remove("has-apercu");
    } else {
      const ph = document.createElement("div"); ph.className = "ph"; ph.title = "Image attendue : " + list[0]; img.replaceWith(ph);
    }
  }, true);

  /* ---------- Catalogue ---------- */
  function render() {
    const words = norm($("#search").value).split(/\s+/).filter(Boolean);
    let html = "";
    CATALOGUE.forEach(g => {
      if (cat !== "Tout" && g.categorie !== cat) return;
      if (licOnly && !g.licence) return;
      const items = g.items.filter(it => words.every(w => it._search.includes(w)));
      if (!items.length) return;
      const o = g.licence ? LIC.origines[g.licence] : null;
      const apercu = g.apercu === false ? "" : `<figure class="apercu">
          ${imgTag("apercu-img", g.apercu ? ["images/" + g.apercu] : tries("images/apercu-" + slug(g.groupe)), "Aperçu porté : " + g.groupe)}
          <figcaption>Aperçu porté</figcaption></figure>`;
      html += `<article class="set${apercu ? " has-apercu" : ""}" id="set-${slug(g.groupe)}">
        <div class="set-head">
          <h3>${esc(g.groupe)}</h3>
          <span class="set-cat">${esc(g.categorie)}</span>
          ${g.licence ? `<button class="lic-badge" type="button" data-lic="${esc(g.licence)}">Licence</button>` : ""}
        </div>
        ${o ? `<p class="set-note lic">Licence ${esc(o.nom)}${o.autorite ? " (" + esc(o.autorite) + ")" : ""} · fabrication ${fmt(LIC.fabrication)}</p>` : ""}
        ${g.note ? `<p class="set-note">${esc(g.note)}</p>` : ""}
        <div class="set-body">
          ${apercu}
          <div class="cards">
            ${items.map(it => `<div class="card">
              <div class="card-img">${imgTag("item-img", it.img ? ["images/" + it.img] : tries("images/" + it._id), it.nom)}</div>
              <div class="card-info">
                <span class="card-name">${esc(it.nom)}</span>
                ${it.mat ? `<span class="card-mat">${esc(it.mat)}</span>` : ""}
                <div class="card-foot">
                  <div>
                    <div class="card-price">${it.prix == null ? '<span class="na">Sur devis</span>' : fmt(it.prix)}</div>
                    ${it.mo != null ? `<div class="card-mo">Main d'œuvre : ${it.mo}</div>` : ""}
                  </div>
                  <button class="add" type="button" data-id="${it._id}" title="Ajouter au devis">+</button>
                </div>
              </div>
            </div>`).join("")}
          </div>
        </div>
      </article>`;
    });
    $("#list").innerHTML = html || '<p class="empty">Aucun objet trouvé.</p>';
  }

  /* ---------- Licences ---------- */
  function renderLicences() {
    const used = new Set(CATALOGUE.map(g => g.licence).filter(Boolean));
    const table = (titre, rows) => `<table><thead><tr><th>${esc(titre)}</th><th class="num">Par unité</th></tr></thead>
      <tbody>${rows.map(([q, p]) => `<tr><td>${esc(q)}</td><td class="num">${fmt(p)}</td></tr>`).join("")}</tbody></table>`;
    $("#lic-content").innerHTML = `
      <div class="lic-fab">
        <span>Licence de fabrication : <strong>${fmt(LIC.fabrication)}</strong></span>
        ${(LIC.regles || []).map(r => `<p>${esc(r)}</p>`).join("")}
      </div>
      <div class="lic-grid">
        ${Object.entries(LIC.origines).map(([k, o]) => `<div class="lic-card" id="lic-${k}">
          <h4>${esc(o.nom)} ${o.article ? `<small>${esc(o.article)}</small>` : ""}</h4>
          ${o.autorite ? `<p class="lic-auth">Délivrée par <b>${esc(o.autorite)}</b></p>` : ""}
          ${o.equipement ? table("Vêtements, armures, bijoux", o.equipement) : ""}
          ${o.armes ? table("Armes et carquois", o.armes) : ""}
          ${!o.equipement && !o.armes ? '<p class="na">Tarif de port non communiqué.</p>' : ""}
          ${o.supplement ? `<p class="lic-sup">${esc(o.supplement)}</p>` : ""}
          ${!used.has(k) ? '<p class="na">Aucun objet de ce type au catalogue.</p>' : ""}
        </div>`).join("")}
      </div>`;
  }

  /* ---------- Devis ---------- */
  function renderDevis() {
    const n = devis.reduce((s, l) => s + l.qty, 0);
    const total = devis.reduce((s, l) => s + (l.prix || 0) * l.qty, 0);
    const unknown = devis.some(l => l.prix == null);
    $("#devis-count").textContent = n;
    $("#devis-total").textContent = fmt(total) + (unknown ? " + sur devis" : "");
    $("#devis-body").innerHTML = devis.length ? devis.map((l, i) => `<div class="line">
        <div>${esc(l.nom)}<small>${esc(l.groupe)}</small></div>
        <div class="qty"><button type="button" data-q="${i}" data-d="-1">−</button>${l.qty}<button type="button" data-q="${i}" data-d="1">+</button></div>
        <strong>${l.prix == null ? "?" : l.prix * l.qty}</strong>
      </div>`).join("") : '<p class="empty">Votre devis est vide.<br>Ajoutez des objets avec le bouton +.</p>';
    store.set("devis", devis);
  }
  function devisText() {
    const total = devis.reduce((s, l) => s + (l.prix || 0) * l.qty, 0);
    return [
      `Devis — Forge de ${BOUTIQUE.nom}`,
      ...devis.map(l => `- ${l.qty} x ${l.nom} (${l.groupe}) : ${l.prix == null ? "sur devis" : l.prix * l.qty + " " + M}`),
      `Total : ${total} ${M}${devis.some(l => l.prix == null) ? " (+ objets sur devis)" : ""}`,
    ].join("\n");
  }
  const openDrawer = () => document.body.classList.add("drawer-open");
  const closeDrawer = () => document.body.classList.remove("drawer-open");
  $("#devis-open").onclick = openDrawer;
  $("#devis-close").onclick = closeDrawer;
  $("#drawer-shade").onclick = closeDrawer;
  $("#devis-clear").onclick = () => { devis = []; renderDevis(); };
  $("#devis-copy").onclick = async () => {
    const b = $("#devis-copy");
    try { await navigator.clipboard.writeText(devisText()); b.textContent = "Copié !"; }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = devisText(); document.body.appendChild(ta); ta.select();
      b.textContent = document.execCommand("copy") ? "Copié !" : "Échec"; ta.remove();
    }
    setTimeout(() => b.textContent = "Copier le devis", 1500);
  };

  /* ---------- Clics ---------- */
  document.addEventListener("click", e => {
    const add = e.target.closest(".add");
    if (add) {
      const it = ITEMS[add.dataset.id];
      const ex = devis.find(l => l.id === it._id);
      if (ex) ex.qty++; else devis.push({ id: it._id, nom: it.nom, groupe: it._groupe, prix: it.prix, qty: 1 });
      add.classList.remove("pulse"); void add.offsetWidth; add.classList.add("pulse");
      renderDevis(); return;
    }
    const q = e.target.closest("[data-q]");
    if (q) { const l = devis[+q.dataset.q]; l.qty += +q.dataset.d; if (l.qty <= 0) devis.splice(+q.dataset.q, 1); renderDevis(); return; }
    const badge = e.target.closest(".lic-badge");
    if (badge) {
      const card = document.getElementById("lic-" + badge.dataset.lic);
      if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.add("flash"); setTimeout(() => card.classList.remove("flash"), 1600); }
      return;
    }
    if (e.target.matches(".item-img, .apercu-img")) { $("#lightbox img").src = e.target.src; $("#lightbox").classList.add("open"); return; }
    if (e.target.closest("#lightbox")) $("#lightbox").classList.remove("open");
    if (e.target.closest(".nav-links a")) $(".nav").classList.remove("menu-open");
  });
  $("#burger").onclick = () => $(".nav").classList.toggle("menu-open");

  /* ---------- Filtres ---------- */
  $("#search").addEventListener("input", render);
  const tLic = $("#t-lic"), tMat = $("#t-mat");
  tLic.onchange = () => { licOnly = tLic.checked; render(); };
  tMat.checked = store.get("recettes", true);
  const applyMat = () => { document.body.classList.toggle("show-mat", tMat.checked); store.set("recettes", tMat.checked); };
  tMat.onchange = applyMat; applyMat();

  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement !== $("#search")) { e.preventDefault(); $("#search").focus(); $("#catalogue").scrollIntoView({ behavior: "smooth" }); }
    if (e.key === "Escape") { $("#lightbox").classList.remove("open"); closeDrawer(); }
  });

  /* ---------- Lien actif dans la navigation ---------- */
  const links = [...document.querySelectorAll(".nav-links a")];
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  ["accueil", "communaute", "catalogue", "licences"].forEach(id => obs.observe(document.getElementById(id)));

  render(); renderLicences(); renderDevis();
})();
