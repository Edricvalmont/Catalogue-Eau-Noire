/* =====================================================================
   L'EAU NOIRE — SERVEUR DES STOCKS (Google Apps Script)
   ---------------------------------------------------------------------
   Ce code ne va PAS sur GitHub : il se colle dans l'éditeur Apps Script
   d'une feuille Google (Extensions > Apps Script). Voir LISEZMOI.txt,
   section « Stocks en direct ».

   La feuille contient deux onglets créés automatiquement :
     Stocks     : id | quantité | nom          (l'état actuel)
     Historique : date | forgeron | matériau | ancienne | nouvelle
   ===================================================================== */

// Mot de passe à donner aux forgerons autorisés à modifier les stocks.
const MOT_DE_PASSE = "change-moi";

// Lecture : renvoie les quantités actuelles (ouvert à tous, lecture seule).
function doGet() {
  return json(lire());
}

// Écriture : enregistre les quantités modifiées (mot de passe requis).
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json({ erreur: "Requête invalide." }); }
  if (d.motDePasse !== MOT_DE_PASSE) return json({ erreur: "Mot de passe incorrect." });

  const verrou = LockService.getScriptLock();
  verrou.waitLock(15000);   // évite que deux forgerons écrivent en même temps
  try {
    const feuilleStocks = feuille("Stocks");
    const historique = feuille("Historique");
    const valeurs = feuilleStocks.getDataRange().getValues();
    const ligneDe = {};
    for (let i = 1; i < valeurs.length; i++) if (valeurs[i][0]) ligneDe[valeurs[i][0]] = i + 1;

    const maintenant = new Date();
    const forgeron = String(d.nom || "").slice(0, 60);
    const changements = d.changements || {};

    Object.keys(changements).forEach(id => {
      const c = changements[id];
      const q = Math.max(0, Math.round(Number(c.qte) || 0));
      let ancienne = 0;
      if (ligneDe[id]) {
        ancienne = Number(feuilleStocks.getRange(ligneDe[id], 2).getValue()) || 0;
        feuilleStocks.getRange(ligneDe[id], 2, 1, 2).setValues([[q, c.nom || id]]);
      } else {
        feuilleStocks.appendRow([id, q, c.nom || id]);
        ligneDe[id] = feuilleStocks.getLastRow();
      }
      if (ancienne !== q) historique.appendRow([maintenant, forgeron, c.nom || id, ancienne, q]);
    });

    const props = PropertiesService.getScriptProperties();
    props.setProperty("maj", maintenant.toISOString());
    props.setProperty("par", forgeron);
  } finally {
    verrou.releaseLock();
  }
  return json(lire());
}

function lire() {
  const v = feuille("Stocks").getDataRange().getValues();
  const qte = {};
  for (let i = 1; i < v.length; i++) if (v[i][0]) qte[v[i][0]] = Number(v[i][1]) || 0;
  const props = PropertiesService.getScriptProperties();
  return { qte: qte, maj: props.getProperty("maj") || "", par: props.getProperty("par") || "" };
}

function feuille(nom) {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  let f = classeur.getSheetByName(nom);
  if (!f) {
    f = classeur.insertSheet(nom);
    f.appendRow(nom === "Stocks" ? ["id", "quantité", "nom"] : ["date", "forgeron", "matériau", "ancienne", "nouvelle"]);
    f.setFrozenRows(1);
  }
  return f;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
