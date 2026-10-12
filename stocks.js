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
      { id: "minerai-de-fer",                      nom: "Minerai de fer",                      qte: 0, seuil: 20 },
      { id: "minerai-d-argent",                    nom: "Minerai d'argent",                    qte: 0, seuil: 10 },
      { id: "minerai-d-or",                        nom: "Minerai d'or",                        qte: 0, seuil: 10 },
      { id: "minerai-de-corindon",                 nom: "Minerai de corindon",                 qte: 0, seuil: 15 },
      { id: "minerai-d-orichalque",                nom: "Minerai d'orichalque",                qte: 0, seuil: 10 },
      { id: "minerai-de-vif-argent",               nom: "Minerai de vif-argent",               qte: 0, seuil: 10 },
      { id: "minerai-de-malachite",                nom: "Minerai de malachite",                qte: 0, seuil: 10 },
      { id: "minerai-de-pierre-de-lune",           nom: "Minerai de pierre de lune",           qte: 0, seuil: 10 },
      { id: "minerai-d-ebonite",                   nom: "Minerai d'ébonite",                   qte: 0, seuil: 10 },
      { id: "stalhrim",                            nom: "Stalhrim",                            qte: 0, seuil: 5 },
    ]},
    { nom: "Lingots", items: [
      { id: "lingot-de-fer",                       nom: "Lingot de fer",                       qte: 0, seuil: 40 },
      { id: "lingot-d-acier",                      nom: "Lingot d'acier",                      qte: 0, seuil: 30 },
      { id: "lingot-d-argent",                     nom: "Lingot d'argent",                     qte: 0, seuil: 10 },
      { id: "lingot-d-or",                         nom: "Lingot d'or",                         qte: 0, seuil: 10 },
      { id: "corindon-raffine",                    nom: "Corindon raffiné",                    qte: 0, seuil: 15 },
      { id: "lingot-d-orichalque",                 nom: "Lingot d'orichalque",                 qte: 0, seuil: 15 },
      { id: "lingot-de-vif-argent",                nom: "Lingot de vif-argent",                qte: 0, seuil: 10 },
      { id: "lingot-de-metal-dwemer",              nom: "Lingot de métal dwemer",              qte: 0, seuil: 15 },
      { id: "lingot-d-ebonite",                    nom: "Lingot d'ébonite",                    qte: 0, seuil: 10 },
      { id: "malachite-raffinee",                  nom: "Malachite raffinée",                  qte: 0, seuil: 10 },
      { id: "pierre-de-lune-raffinee",             nom: "Pierre de lune raffinée",             qte: 0, seuil: 15 },
    ]},
    { nom: "Ferraille dwemer", items: [
      { id: "ferraille-dwemer",                    nom: "Ferraille dwemer",                    qte: 0, seuil: 10 },
      { id: "rouage-dwemer",                       nom: "Rouage dwemer",                       qte: 0, seuil: 5 },
      { id: "engrenage-dwemer",                    nom: "Engrenage dwemer",                    qte: 0, seuil: 5 },
      { id: "gyroscope-dwemer",                    nom: "Gyroscope dwemer",                    qte: 0, seuil: 5 },
      { id: "levier-dwemer",                       nom: "Levier dwemer",                       qte: 0, seuil: 5 },
      { id: "petit-levier-dwemer",                 nom: "Petit levier dwemer",                 qte: 0, seuil: 5 },
    ]},
    { nom: "Cuirs et peaux", items: [
      { id: "cuir",                                nom: "Cuir",                                qte: 0, seuil: 20 },
      { id: "bandes-de-cuir",                      nom: "Bandes de cuir",                      qte: 0, seuil: 40 },
      { id: "peau-de-vache",                       nom: "Peau de vache",                       qte: 0, seuil: 5 },
      { id: "peau-de-chevre",                      nom: "Peau de chèvre",                      qte: 0, seuil: 5 },
      { id: "peau-de-cerf",                        nom: "Peau de cerf",                        qte: 0, seuil: 5 },
      { id: "peau-de-chevreuil",                   nom: "Peau de chevreuil",                   qte: 0, seuil: 5, img: "peau-de-cerf.webp" },
      { id: "fourrure-de-loup",                    nom: "Fourrure de loup",                    qte: 0, seuil: 5 },
      { id: "fourrure-de-loup-des-glaces",         nom: "Fourrure de loup des glaces",         qte: 0, seuil: 3 },
      { id: "fourrure-d-ours",                     nom: "Fourrure d'ours",                     qte: 0, seuil: 3 },
      { id: "fourrure-d-ours-des-cavernes",        nom: "Fourrure d'ours des cavernes",        qte: 0, seuil: 3 },
      { id: "fourrure-d-ours-des-neiges",          nom: "Fourrure d'ours des neiges",          qte: 0, seuil: 3 },
      { id: "fourrure-de-tigre-a-dents-de-sabre",  nom: "Fourrure de tigre à dents de sabre",  qte: 0, seuil: 3 },
      { id: "fourrure-de-tigre-des-neiges",        nom: "Fourrure de tigre des neiges",        qte: 0, seuil: 3 },
      { id: "fourrure-de-renard",                  nom: "Fourrure de renard",                  qte: 0, seuil: 3 },
      { id: "cuir-de-netch",                       nom: "Cuir de netch",                       qte: 0, seuil: 5 },
      { id: "morceau-de-lin",                      nom: "Morceau de lin",                      qte: 0, seuil: 10 },
    ]},
    { nom: "Combustibles et matériaux rares", items: [
      { id: "bois-de-chauffage",                   nom: "Bois de chauffage",                   qte: 0, seuil: 20 },
      { id: "charbon",                             nom: "Charbon",                             qte: 0, seuil: 20 },
      { id: "charbon-pauvre",                      nom: "Charbon pauvre",                      qte: 0, seuil: 20, img: "charbon.webp" },
      { id: "briquette-de-charbon",                nom: "Briquette de charbon",                qte: 0, seuil: 20, img: "charbon.webp" },
      { id: "coke",                                nom: "Coke",                                qte: 0, seuil: 10, img: "charbon.webp" },
      { id: "chitine-de-chaurus",                  nom: "Chitine de chaurus",                  qte: 0, seuil: 5 },
      { id: "plaque-de-chitine",                   nom: "Plaque de chitine",                   qte: 0, seuil: 5 },
    ]},
  ],
};
