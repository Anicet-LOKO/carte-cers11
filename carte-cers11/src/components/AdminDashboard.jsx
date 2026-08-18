import { useState } from 'react';
import { Trash2, Edit, PlusCircle, LogOut, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import FormulaireProdacteur from './FormulaireProdacteur';
import.meta.env.VITE_API_URL

/**
 * COMPOSANT PRINCIPAL DE L'ADMINISTRATION
 * Gère la liste des membres et le basculement vers le formulaire.
 */
export default function AdminDashboard({ prodacteurs, onLogout, onRefresh }) {
  
  // --- 1. GESTION DE L'ÉTAT (STATE) ---
  // viewMode : contrôle si on voit la "liste" ou le "formulaire"
  const [viewMode, setViewMode] = useState("liste");
  // editingItem : stocke les données du commerçant à modifier (null si c'est un ajout)
  const [editingItem, setEditingItem] = useState(null);

  // --- 2. LOGIQUE DES ACTIONS ---
  
  // Prépare le formulaire pour une modification
  const handleEdit = (prodacteur) => {
    setEditingItem(prodacteur);
    setViewMode("formulaire");
  };

  // Prépare le formulaire pour une nouvelle inscription
  const handleAddNew = () => {
    setEditingItem(null); // On vide le "target" pour avoir un formulaire vierge
    setViewMode("formulaire");
  };

  // Supprime un membre via l'API
  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement ce membre ?")) {
      await fetch(`http://localhost:5000/api/prodacteurs/${id}`, { method: 'DELETE' });
      onRefresh(); // On demande à App.jsx de recharger les données
    }
  };

  // --- 3. RENDU DE L'INTERFACE (SÉMANTIQUE HTML5) ---
  return (
    <main className="admin-layout">
      {/* EN-TÊTE DU DASHBOARD */}
      <header className="admin-header">
        <section>
          <h1>Réseau CERS</h1>
          <p>{prodacteurs.length} Prod'acteurs référencés</p>
        </section>
        <nav className="header-controls">
          {viewMode === "liste" ? (
            <button onClick={handleAddNew} className="btn-add">
              <PlusCircle size={18} /> Nouveau Prod'acteur
            </button>
          ) : (
            <button onClick={() => setViewMode("liste")} className="btn-back">
              <ArrowLeft size={18} /> Retour
            </button>
          )}
          <button onClick={onLogout} className="btn-logout">
            <LogOut size={18} /> Quitter
          </button>
        </nav>
      </header>

      {/* AFFICHAGE CONDITIONNEL : FORMULAIRE OU TABLEAU */}
      {viewMode === "formulaire" ? (
        <FormulaireProdacteur 
          target={editingItem} 
          onSuccess={() => { onRefresh(); setViewMode("liste"); }} 
          onCancel={() => setViewMode("liste")}
        />
      ) : (
        <section className="table-responsive">
          <table className="admin-table-full">
            <thead>
              <tr>
                <th>Établissement</th>
                <th>Responsable</th>
                <th>Ville</th>
                <th>Engagement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prodacteurs.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.etablissement}</strong></td>
                  <td>{p.responsable}</td>
                  <td>{p.ville}</td>
                  <td>
                    {/* Utilisation d'icônes Lucide pour le statut de l'engagement */}
                    {p.pourquoi_cers && p.pourquoi_cers !== "nan" 
                      ? <CheckCircle size={16} color="green" /> 
                      : <AlertTriangle size={16} color="orange" />}
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => handleEdit(p)} className="edit-icon"><Edit size={18}/></button>
                    <button onClick={() => handleDelete(p.id)} className="delete-icon"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}