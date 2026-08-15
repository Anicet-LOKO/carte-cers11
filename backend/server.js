const express = require('express');
const cors = require('cors');
const setupDb = require('./database'); // On importe notre configurateur

const app = express();
app.use(cors());
app.use(express.json());

let db;

// Connexion asynchrone à la base au démarrage du serveur
setupDb().then(database => {
  db = database;
  console.log("Serveur connecté à la base SQLite.");
});

// --- ROUTES API CRUD PERSISTANTES ---

// 1. LIRE (GET) : On va chercher dans la table SQL
app.get('/api/prodacteurs', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM prodacteurs');
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. CRÉER (POST) : On insère une nouvelle ligne SQL
app.post('/api/prodacteurs', async (req, res) => {
  const p = req.body; // Récupère les données envoyées par le formulaire React
  
  // Requête SQL avec les 17 champs correspondant à ton fichier Excel
  const sql = `INSERT INTO prodacteurs 
    (etablissement, responsable, alimentation, centre_culturel, service, bien_etre, comptoir_echange, description, tel, mail, liens, cp, ville, adresse, pourquoi_cers, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  try {
    // Vérification de doublon logique : même établissement + même CP
    // on considère doublon si mail, tel et adresse sont tous identiques
    const existe = await db.get('SELECT * FROM prodacteurs WHERE etablissement = ? AND cp = ?', p.etablissement, p.cp);
    if (existe) {
      const sameMail = (existe.mail || '') === (p.mail || '');
      const sameTel = (existe.tel || '') === (p.tel || '');
      const sameAddr = (existe.adresse || '') === (p.adresse || '');
      if (sameMail && sameTel && sameAddr) {
        return res.status(400).json({ error: "Doublon détecté : cet établissement avec les mêmes coordonnées existe déjà." });
      }
    }
    // Exécution de l'insertion avec les paramètres
    await db.run(sql, [
      p.etablissement, p.responsable, p.alimentation, p.centre_culturel, 
      p.service, p.bien_etre, p.comptoir_echange, p.description, 
      p.tel, p.mail, p.liens, p.cp, p.ville, p.adresse, p.pourquoi_cers, p.lat, p.lng
    ]);

    // Code 201 : Ressource créée avec succès
    res.status(201).json({ message: "Prod'acteur ajouté avec succès dans le fichier .db !" });

  } catch (err) {
    // --- SÉCURITÉ : GESTION DES DOUBLONS ---
    // Si SQLite renvoie une erreur de contrainte UNIQUE (Nom + Adresse + CP)
    if (err.message.includes("UNIQUE constraint failed")) {
      console.warn("Tentative d'ajout d'un doublon :", p.etablissement);
      return res.status(400).json({ 
        error: "Cet établissement est déjà enregistré à cette adresse dans le réseau CERS." 
      });
    }

    // Gestion des autres erreurs techniques (Code 500)
    console.error("Erreur SQL lors du POST :", err.message);
    res.status(500).json({ error: "Une erreur interne est survenue lors de l'enregistrement." });
  }
});

// 3. SUPPRIMER (DELETE) : On retire de la base par l'ID
app.delete('/api/prodacteurs/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM prodacteurs WHERE id = ?', req.params.id);
    res.json({ message: "Supprimé de la base SQLite." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
// 4. MODIFIER (PUT) - On met à jour une ligne existante par l'ID
app.put('/api/prodacteurs/:id', async (req, res) => {
  const { id } = req.params;
  const idNum = parseInt(id, 10);
  const p = req.body;
  console.log(`PUT /api/prodacteurs/${idNum} payload:`, p);
  
  // Requête SQL pour mettre à jour tous les champs
  const sql = `UPDATE prodacteurs SET 
    etablissement = ?, responsable = ?, alimentation = ?, centre_culturel = ?, 
    service = ?, bien_etre = ?, comptoir_echange = ?, description = ?, 
    tel = ?, mail = ?, liens = ?, cp = ?, ville = ?, adresse = ?, 
    pourquoi_cers = ?, lat = ?, lng = ? 
    WHERE id = ?`;
  
  try {
    // Vérification de doublon logique lors de la modification :
    // chercher un autre enregistrement avec même etablissement+cp
    const autre = await db.get('SELECT * FROM prodacteurs WHERE etablissement = ? AND cp = ? AND id != ?', p.etablissement, p.cp, idNum);
    if (autre) {
      const sameMail = (autre.mail || '') === (p.mail || '');
      const sameTel = (autre.tel || '') === (p.tel || '');
      const sameAddr = (autre.adresse || '') === (p.adresse || '');
      if (sameMail && sameTel && sameAddr) {
        return res.status(400).json({ error: "Doublon détecté : une autre fiche identique existe déjà." });
      }
    }
    const result = await db.run(sql, [
      p.etablissement, p.responsable, p.alimentation, p.centre_culturel, 
      p.service, p.bien_etre, p.comptoir_echange, p.description, 
      p.tel, p.mail, p.liens, p.cp, p.ville, p.adresse, p.pourquoi_cers, p.lat, p.lng,
      idNum
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Prod'acteur non trouvé." });
    }
    // Récupérer et renvoyer l'enregistrement mis à jour pour confirmation
    const updated = await db.get('SELECT * FROM prodacteurs WHERE id = ?', idNum);
    res.json({ message: "Mise à jour réussie dans SQLite !", donnee: updated });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la modification : " + err.message });
  }
});

app.listen(5000, () => console.log("Back-end CERS actif sur le port 5000"));