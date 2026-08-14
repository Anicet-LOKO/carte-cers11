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
  const p = req.body;
  
  // Requête SQL pour mettre à jour tous les champs
  const sql = `UPDATE prodacteurs SET 
    etablissement = ?, responsable = ?, alimentation = ?, centre_culturel = ?, 
    service = ?, bien_etre = ?, comptoir_echange = ?, description = ?, 
    tel = ?, mail = ?, liens = ?, cp = ?, ville = ?, adresse = ?, 
    pourquoi_cers = ?, lat = ?, lng = ? 
    WHERE id = ?`;
  
  try {
    const result = await db.run(sql, [
      p.etablissement, p.responsable, p.alimentation, p.centre_culturel, 
      p.service, p.bien_etre, p.comptoir_echange, p.description, 
      p.tel, p.mail, p.liens, p.cp, p.ville, p.adresse, p.pourquoi_cers, p.lat, p.lng,
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Prod'acteur non trouvé." });
    }
    res.json({ message: "Mise à jour réussie dans SQLite !" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la modification : " + err.message });
  }
});

app.listen(5000, () => console.log("Back-end CERS actif sur le port 5000"));