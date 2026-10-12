/* =====================================================================
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
const STOCKS_EN_LIGNE = "https://script.google.com/macros/s/AKfycbwZKThlajZswQFDtlLN1ree_nrSDyv_VTB1_kS4Qrk_NBC56r-hz5XdgmRr-qKrOGTr8w/exec";

const STOCKS = {
  maj: "2026-10-11",   // date de la dernière mise à jour (AAAA-MM-JJ)
  par: "",             // (optionnel) qui a fait l'inventaire
  categories: [
    { nom: "Minerais", items: [
      { id: "minerai-de-fer",                      nom: "Minerai de fer",                      qte: 0, seuil: 500 },
      { id: "minerai-d-argent",                    nom: "Minerai d'argent",                    qte: 0, seuil: 60 },
      { id: "minerai-d-or",                        nom: "Minerai d'or",                        qte: 0, seuil: 60 },
      { id: "minerai-de-corindon",                 nom: "Minerai de corindon",                 qte: 0, seuil: 500 },
      { id: "minerai-d-orichalque",                nom: "Minerai d'orichalque",                qte: 0, seuil: 0 },
      { id: "minerai-de-vif-argent",               nom: "Minerai de vif-argent",               qte: 0, seuil: 72 },
      { id: "minerai-de-malachite",                nom: "Minerai de malachite",                qte: 0, seuil: 60 },
      { id: "minerai-de-pierre-de-lune",           nom: "Minerai de pierre de lune",           qte: 0, seuil: 72 },
      { id: "minerai-d-ebonite",                   nom: "Minerai d'ébonite",                   qte: 0, seuil: 0 },
      { id: "stalhrim",                            nom: "Stalhrim",                            qte: 0, seuil: 0 },
    ]},
    { nom: "Lingots", items: [
      { id: "lingot-de-fer",                       nom: "Lingot de fer",                       qte: 0, seuil: 90 },
      { id: "lingot-d-acier",                      nom: "Lingot d'acier",                      qte: 0, seuil: 300 },
      { id: "lingot-d-argent",                     nom: "Lingot d'argent",                     qte: 0, seuil: 10 },
      { id: "lingot-d-or",                         nom: "Lingot d'or",                         qte: 0, seuil: 10 },
      { id: "corindon-raffine",                    nom: "Corindon raffiné",                    qte: 0, seuil: 30 },
      { id: "lingot-d-orichalque",                 nom: "Lingot d'orichalque",                 qte: 0, seuil: 4 },
      { id: "lingot-de-vif-argent",                nom: "Lingot de vif-argent",                qte: 0, seuil: 12 },
      { id: "lingot-de-metal-dwemer",              nom: "Lingot de métal dwemer",              qte: 0, seuil: 0 },
      { id: "lingot-d-ebonite",                    nom: "Lingot d'ébonite",                    qte: 0, seuil: 0 },
      { id: "malachite-raffinee",                  nom: "Malachite raffinée",                  qte: 0, seuil: 12 },
      { id: "pierre-de-lune-raffinee",             nom: "Pierre de lune raffinée",             qte: 0, seuil: 12 },
    ]},
    { nom: "Ferraille dwemer", items: [
      { id: "ferraille-dwemer",                    nom: "Ferraille dwemer",                    qte: 0, seuil: 0 },
      { id: "rouage-dwemer",                       nom: "Rouage dwemer",                       qte: 0, seuil: 0 },
      { id: "engrenage-dwemer",                    nom: "Engrenage dwemer",                    qte: 0, seuil: 0 },
      { id: "gyroscope-dwemer",                    nom: "Gyroscope dwemer",                    qte: 0, seuil: 0 },
      { id: "levier-dwemer",                       nom: "Levier dwemer",                       qte: 0, seuil: 0 },
      { id: "petit-levier-dwemer",                 nom: "Petit levier dwemer",                 qte: 0, seuil: 0 },
    ]},
    { nom: "Cuirs et peaux", items: [
      { id: "cuir",                                nom: "Cuir",                                qte: 0, seuil: 200 },
      { id: "bandes-de-cuir",                      nom: "Bandes de cuir",                      qte: 0, seuil: 80 },
      { id: "peau-de-vache",                       nom: "Peau de vache",                       qte: 0, seuil: 0 },
      { id: "peau-de-chevre",                      nom: "Peau de chèvre",                      qte: 0, seuil: 0 },
      { id: "peau-de-cerf",                        nom: "Peau de cerf",                        qte: 0, seuil: 0 },
      { id: "peau-de-chevreuil",                   nom: "Peau de chevreuil",                   qte: 0, seuil: 0, img: "peau-de-cerf.webp" },
      { id: "fourrure-de-loup",                    nom: "Fourrure de loup",                    qte: 0, seuil: 10 },
      { id: "fourrure-de-loup-des-glaces",         nom: "Fourrure de loup des glaces",         qte: 0, seuil: 0 },
      { id: "fourrure-d-ours",                     nom: "Fourrure d'ours",                     qte: 0, seuil: 10 },
      { id: "fourrure-d-ours-des-cavernes",        nom: "Fourrure d'ours des cavernes",        qte: 0, seuil: 0 },
      { id: "fourrure-d-ours-des-neiges",          nom: "Fourrure d'ours des neiges",          qte: 0, seuil: 10 },
      { id: "fourrure-de-tigre-a-dents-de-sabre",  nom: "Fourrure de smilodont",               qte: 0, seuil: 10 },
      { id: "fourrure-de-tigre-des-neiges",        nom: "Fourrure de smilodont des neiges",    qte: 0, seuil: 10 },
      { id: "fourrure-de-renard",                  nom: "Fourrure de renard",                  qte: 0, seuil: 0 },
      { id: "cuir-de-netch",                       nom: "Cuir de netch",                       qte: 0, seuil: 10 },
      { id: "morceau-de-lin",                      nom: "Morceau de lin",                      qte: 0, seuil: 40 },
    ]},
    { nom: "Combustibles et matériaux rares", items: [
      { id: "bois-de-chauffage",                   nom: "Bois",                                qte: 0, seuil: 10000 },
      { id: "charbon",                             nom: "Charbon",                             qte: 0, seuil: 1000 },
      { id: "charbon-pauvre",                      nom: "Charbon pauvre",                      qte: 0, seuil: 400, img: "charbon.webp" },
      { id: "briquette-de-charbon",                nom: "Briquette de charbon",                qte: 0, seuil: 200, img: "charbon.webp" },
      { id: "coke",                                nom: "Coke",                                qte: 0, seuil: 60, img: "charbon.webp" },
      { id: "chitine-de-chaurus",                  nom: "Chitine de chaurus",                  qte: 0, seuil: 10 },
      { id: "plaque-de-chitine",                   nom: "Plaque de chitine",                   qte: 0, seuil: 10 },
    ]},
  ],
};
