/* =====================================================================
   STOCKS DE LA FORGE DE L'EAU NOIRE
   ---------------------------------------------------------------------
   qte   : quantité en stock
   seuil : en dessous de ce nombre, le matériau passe en « stock bas »
           (à 0 il est « en rupture »)
   img   : (optionnel) autre image que images/materiaux/<id>.webp
   info  : (optionnel) texte affiché sous le nom (recette, rendement…)

   Méthode la plus simple : sur la page Stocks, activez « Modifier »,
   ajustez les quantités puis cliquez « Exporter stocks.js ». Remplacez
   ce fichier par celui téléchargé et publiez (git add / commit / push).
   ===================================================================== */

/* Adresse de la feuille Google partagée (voir LISEZMOI.txt, « Stocks en direct »).
   Laisse "" pour fonctionner sans : la page lit alors simplement ce fichier. */
const STOCKS_EN_LIGNE = "https://script.google.com/macros/s/AKfycbwZKThlajZswQFDtlLN1ree_nrSDyv_VTB1_kS4Qrk_NBC56r-hz5XdgmRr-qKrOGTr8w/exec";

const STOCKS = {
  maj: "2026-10-11",   // date de la dernière mise à jour (AAAA-MM-JJ)
  par: "",             // (optionnel) qui a fait l'inventaire
  categories: [
    { nom: "Lingots", items: [
      { id: "lingot-de-fer",                       nom: "Lingot de fer",                       qte: 0, seuil: 90, info: "6 minerai de fer, 6 charbon pauvre" },
      { id: "lingot-d-acier",                      nom: "Lingot d'acier",                      qte: 0, seuil: 300, info: "3 corindon brut, 3 minerai de fer, 6 charbon" },
      { id: "lingot-d-argent",                     nom: "Lingot d'argent",                     qte: 0, seuil: 10, info: "6 minerai d'argent, 6 charbon" },
      { id: "lingot-d-or",                         nom: "Lingot d'or",                         qte: 0, seuil: 10, info: "6 minerai d'or, 6 charbon" },
      { id: "corindon-raffine",                    nom: "Corindon raffiné",                    qte: 0, seuil: 30, info: "8 corindon brut, 8 charbon pauvre" },
      { id: "lingot-d-orichalque",                 nom: "Lingot d'orichalque",                 qte: 0, seuil: 4, info: "6 minerai d'orichalque, 6 briquette de charbon" },
      { id: "lingot-de-vif-argent",                nom: "Lingot de vif-argent",                qte: 0, seuil: 12, info: "6 minerai de vif-argent, 6 coke" },
      { id: "lingot-de-metal-dwemer",              nom: "Lingot de métal dwemer",              qte: 0, seuil: 0, info: "Voir fonte" },
      { id: "lingot-d-ebonite",                    nom: "Ébonite raffinée",                    qte: 0, seuil: 0, info: "2 ébonite brute, 2 coke" },
      { id: "malachite-raffinee",                  nom: "Malachite raffinée",                  qte: 0, seuil: 12, info: "6 malachite brute, 6 coke" },
      { id: "pierre-de-lune-raffinee",             nom: "Pierre de lune raffinée",             qte: 0, seuil: 12, info: "6 pierre de lune brute, 6 briquette de charbon" },
    ]},
    { nom: "Fonte dwemer", items: [
      { id: "metal-dwemer-solide",                 nom: "Métal dwemer solide",                 qte: 0, seuil: 0, info: "Fond en 5 lingots de métal dwemer" },
      { id: "petite-plaque-dwemer",                nom: "Petite plaque dwemer",                qte: 0, seuil: 0, info: "Fond en 3 lingots de métal dwemer" },
      { id: "etai-dwemer",                         nom: "Étai dwemer",                         qte: 0, seuil: 0, info: "Fond en 3 lingots de métal dwemer" },
      { id: "grande-plaque-dwemer",                nom: "Grande plaque dwemer",                qte: 0, seuil: 0, info: "Fond en 3 lingots de métal dwemer" },
      { id: "ferraille-dwemer-tordue",             nom: "Ferraille dwemer tordue",             qte: 0, seuil: 0, info: "Fond en 3 lingots de métal dwemer" },
      { id: "etai-dwemer-decoratif",               nom: "Étai dwemer décoratif",               qte: 0, seuil: 0, info: "Fond en 2 lingots de métal dwemer" },
    ]},
    { nom: "Ferraille dwemer", items: [
      { id: "ferraille-dwemer",                    nom: "Ferraille dwemer",                    qte: 0, seuil: 0 },
      { id: "rouage-dwemer",                       nom: "Rouage dwemer",                       qte: 0, seuil: 0 },
      { id: "engrenage-dwemer",                    nom: "Engrenage dwemer",                    qte: 0, seuil: 0 },
      { id: "gyroscope-dwemer",                    nom: "Gyroscope dwemer",                    qte: 0, seuil: 0 },
      { id: "levier-dwemer",                       nom: "Levier dwemer",                       qte: 0, seuil: 0 },
      { id: "petit-levier-dwemer",                 nom: "Petit levier dwemer",                 qte: 0, seuil: 0 },
    ]},
    { nom: "Bois et matériaux rares", items: [
      { id: "bois-de-chauffage",                   nom: "Bois",                                qte: 0, seuil: 10000 },
      { id: "chitine-de-chaurus",                  nom: "Chitine de chaurus",                  qte: 0, seuil: 10 },
      { id: "plaque-de-chitine",                   nom: "Plaque de chitine",                   qte: 0, seuil: 10 },
      { id: "cuir-de-netch",                       nom: "Cuir de netch",                       qte: 0, seuil: 10 },
      { id: "morceau-de-lin",                      nom: "Morceau de lin",                      qte: 0, seuil: 40 },
    ]},
  ],
};
