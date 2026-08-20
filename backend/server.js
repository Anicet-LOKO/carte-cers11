import express from 'express';
import cors from 'cors';
import pg from 'pg'; // On utilise 'pg' (le module classique PostgreSQL) au lieu de sqlite3

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

// Connexion à la base de données Supabase PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Obligatoire pour sécuriser la connexion avec les serveurs de Supabase
  }
});

// ROUTE 1 : Récupérer tous les prodacteurs (GET)
app.get('/api/prodacteurs', async (req, res) => {
  try {
    // Requête classique pour récupérer la liste par ordre alphabétique
    const result = await pool.query('SELECT * FROM prodacteurs ORDER BY etablissement ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur lors de la récupération :", err);
    res.status(500).send('Erreur lors de la récupération des données');
  }
});

// ROUTE 2 : Ajouter un nouveau prodacteur (POST)
app.post('/api/prodacteurs', async (req, res) => {
  // Récupération des données envoyées par le formulaire React
  const { 
    responsable, etablissement, centre_culturel, alimentation, 
    service, bien_etre, comptoir_echange, description, 
    tel, liens, mail, cp, ville, adresse, pourquoi_cers 
  } = req.body;
  
  try {
    // Requête préparée standard avec les paramètres sécurisés $1, $2, etc.
    const queryText = `
      INSERT INTO prodacteurs (
        responsable, etablissement, centre_culturel, alimentation, 
        service, bien_etre, comptoir_echange, description, 
        tel, liens, mail, cp, ville, adresse, pourquoi_cers
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    
    // Tableau ordonné correspondant aux variables $1 à $15
    const values = [
      responsable, etablissement, centre_culturel, alimentation, 
      service, bien_etre, comptoir_echange, description, 
      tel, liens, mail, cp, ville, adresse, pourquoi_cers
    ];
    
    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows); // Renvoie l'élément inséré
  } catch (err) {
    console.error("Erreur lors de l'insertion :", err);
    res.status(500).send("Erreur lors de l'enregistrement");
  }
});

// ROUTE 3 : Modifier un prodacteur existant (PUT)
app.put('/api/prodacteurs/:id', async (req, res) => {
  const { id } = req.params; // L'identifiant dans l'URL (ex: /api/prodacteurs/2)
  const { 
    responsable, etablissement, centre_culturel, alimentation, 
    service, bien_etre, comptoir_echange, description, 
    tel, liens, mail, cp, ville, adresse, pourquoi_cers 
  } = req.body;
  
  try {
    // Requête préparée de mise à jour ciblée grâce à "WHERE id = $16"
    const queryText = `
      UPDATE prodacteurs 
      SET 
        responsable = $1, 
        etablissement = $2, 
        centre_culturel = $3, 
        alimentation = $4, 
        service = $5, 
        bien_etre = $6, 
        comptoir_echange = $7, 
        description = $8, 
        tel = $9, 
        liens = $10, 
        mail = $11, 
        cp = $12, 
        ville = $13, 
        adresse = $14, 
        pourquoi_cers = $15
      WHERE id = $16
      RETURNING *;
    `;
    
    const values = [
      responsable, etablissement, centre_culturel, alimentation, 
      service, bien_etre, comptoir_echange, description, 
      tel, liens, mail, cp, ville, adresse, pourquoi_cers,
      id // C'est notre 16ème paramètre ($16)
    ];
    
    const result = await pool.query(queryText, values);
    
    if (result.rows.length === 0) {
      return res.status(404).send("Prodacteur non trouvé");
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur lors de la modification :", err);
    res.status(500).send("Erreur lors de la modification");
  }
});

// ROUTE 4 : Supprimer un prodacteur (DELETE)
app.delete('/api/prodacteurs/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM prodacteurs WHERE id = $1', [id]);
    res.status(200).send('Membre supprimé avec succès');
  } catch (err) {
    console.error("Erreur lors de la suppression :", err);
    res.status(500).send('Erreur lors de la suppression');
  }
});

// Écoute du serveur sur le port de Render (10000) ou 5000 en local
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Back-end actif sur le port ${PORT}`);
});