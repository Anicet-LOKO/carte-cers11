import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CONFIGURATION DE LA BASE DE DONNÉES SQLITE
 * Ce script crée le fichier prodacteurs.db s'il n'existe pas.
 */
async function setupDb() {
  const db = await open({
    filename: join(__dirname, 'prodacteurs.db'),
    driver: sqlite3.Database
  });

  // Création de la table "prodacteurs"
  await db.exec(`
    CREATE TABLE IF NOT EXISTS prodacteurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      etablissement TEXT NOT NULL,
      responsable TEXT,
      alimentation TEXT,
      centre_culturel TEXT,
      service TEXT,
      bien_etre TEXT,
      comptoir_echange TEXT,
      description TEXT,
      tel TEXT,
      mail TEXT,
      liens TEXT,
      cp TEXT,
      ville TEXT,
      adresse TEXT,
      pourquoi_cers TEXT,
      lat REAL,
      lng REAL
    )
  `);

  console.log("Table 'prodacteurs' prête.");
  return db;
}

export default setupDb;