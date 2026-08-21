import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

// Connexion à la base de données Supabase PostgreSQL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL est absente. Configurez la chaîne de connexion PostgreSQL avant de démarrer le backend.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // Obligatoire pour sécuriser la connexion avec Supabase
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Erreur de connexion PostgreSQL :', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

// =========================================================================
// ROUTE 1 : Récupérer tous les prodacteurs (GET)
// =========================================================================
app.get('/api/prodacteurs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prodacteurs ORDER BY etablissement ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur lors de la récupération :", {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    res.status(500).send('Erreur lors de la récupération des données');
  }
});

// =========================================================================
// ROUTE 2 : Ajouter un nouveau prodacteur (POST)
// =========================================================================
app.post('/api/prodacteurs', async (req, res) => {
  const { 
    responsable, etablissement, centre_culturel, alimentation, 
    service, bien_etre, comptoir_echange, description, 
    tel, liens, mail, cp, ville, adresse, pourquoi_cers,
    lat, lng // On destructure les coordonnées envoyées par React
  } = req.body;
  
  try {
    const queryText = `
      INSERT INTO prodacteurs (
        responsable, etablissement, centre_culturel, alimentation, 
        service, bien_etre, comptoir_echange, description, 
        tel, liens, mail, cp, ville, adresse, pourquoi_cers,
        lat, lng
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `;
    
    const values = [
      responsable !== undefined ? responsable : null,
      etablissement !== undefined ? etablissement : null,
      centre_culturel !== undefined ? centre_culturel : 'Non',
      alimentation !== undefined ? alimentation : 'Non',
      service !== undefined ? service : 'Non',
      bien_etre !== undefined ? bien_etre : 'Non',
      comptoir_echange !== undefined ? comptoir_echange : 'Non',
      description !== undefined ? description : null,
      tel !== undefined ? tel : null,
      liens !== undefined ? liens : null,
      mail !== undefined ? mail : null,
      cp !== undefined ? cp : null,
      ville !== undefined ? ville : null,
      adresse !== undefined ? adresse : null,
      pourquoi_cers !== undefined ? pourquoi_cers : null,
      lat !== undefined && lat !== null ? parseFloat(lat) : null, // On s'assure que c'est un nombre décimal pour Postgres
      lng !== undefined && lng !== null ? parseFloat(lng) : null
    ];
    
    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows);
  } catch (err) {
    console.error("Erreur SQL lors de l'insertion :", {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    res.status(500).send("Erreur lors de l'enregistrement");
  }
});

// =========================================================================
// ROUTE 3 : Modifier un prodacteur existant (PUT)
// =========================================================================
app.put('/api/prodacteurs/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    responsable, etablissement, centre_culturel, alimentation, 
    service, bien_etre, comptoir_echange, description, 
    tel, liens, mail, cp, ville, adresse, pourquoi_cers,
    lat, lng
  } = req.body;
  
  try {
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
        pourquoi_cers = $15,
        lat = $16,
        lng = $17
      WHERE id = $18
      RETURNING *;
    `;
    
    const values = [
      responsable !== undefined ? responsable : null,
      etablissement !== undefined ? etablissement : null,
      centre_culturel !== undefined ? centre_culturel : 'Non',
      alimentation !== undefined ? alimentation : 'Non',
      service !== undefined ? service : 'Non',
      bien_etre !== undefined ? bien_etre : 'Non',
      comptoir_echange !== undefined ? comptoir_echange : 'Non',
      description !== undefined ? description : null,
      tel !== undefined ? tel : null,
      liens !== undefined ? liens : null,
      mail !== undefined ? mail : null,
      cp !== undefined ? cp : null,
      ville !== undefined ? ville : null,
      adresse !== undefined ? adresse : null,
      pourquoi_cers !== undefined ? pourquoi_cers : null,
      lat !== undefined && lat !== null ? parseFloat(lat) : null,
      lng !== undefined && lng !== null ? parseFloat(lng) : null,
      id
    ];
    
    const result = await pool.query(queryText, values);
    
    if (result.rows.length === 0) {
      return res.status(404).send("Prodacteur non trouvé");
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur SQL lors de la modification :", err);
    res.status(500).send("Erreur lors de la modification");
  }
});

// =========================================================================
// ROUTE 4 : Supprimer un prodacteur (DELETE)
// =========================================================================
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Back-end actif sur le port ${PORT}`);
});