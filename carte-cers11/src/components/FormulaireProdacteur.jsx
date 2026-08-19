import { useState, useEffect } from 'react';
import { Save, XCircle, Search } from 'lucide-react';
import.meta.env.VITE_API_URL
/**
 * COMPOSANT FORMULAIRE DE GESTION DES PROD'ACTEURS
 * Ce formulaire gère l'ajout et la modification avec géocodage et 
 * récupération automatique des communes via l'API nationale.
 */
export default function FormulaireProdacteur({ target, onSuccess, onCancel }) {
  
  // --- 1. INITIALISATION DES DONNÉES (STRUCTURE EXCEL) ---
  const [formData, setFormData] = useState({
    etablissement: "", responsable: "", alimentation: "Non", centre_culturel: "Non",
    service: "Non", bien_etre: "Non", comptoir_echange: "Non", description: "",
    tel: "", liens: "", mail: "", cp: "", ville: "", adresse: "", pourquoi_cers: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 2. CHARGEMENT DES DONNÉES EN MODE MODIFICATION ---
  useEffect(() => {
    if (target) setFormData(target);
  }, [target]);

  // --- 3. RÉCUPÉRATION AUTOMATIQUE DE LA VILLE (API GOUV) ---
  // Dès que le CP fait 5 chiffres, on cherche la ville correspondante
  // 1. Nouvel état pour les suggestions de villes
const [villesPossibles, setVillesPossibles] = useState([]);

// 2. useEffect mis à jour pour gérer la multiplicité
useEffect(() => {
  const chercherVilles = async () => {
    // On déclenche la recherche à 5 chiffres
    if (formData.cp && /^\d{5}$/.test(formData.cp)) {
      try {
        // On enlève "limit=1" pour avoir tous les résultats du CP
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${formData.cp}&type=municipality`);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const liste = data.features.map(f => f.properties.city);
          
          if (liste.length === 1) {
            // Si une seule ville, on l'assigne direct
            setFormData(prev => ({ ...prev, ville: liste }));
            setVillesPossibles([]);
          } else {
            // Si plusieurs, on stocke la liste pour proposer le choix
            setVillesPossibles(liste);
            setFormData(prev => ({ ...prev, ville: "" })); // On vide pour forcer le choix
          }
        }
      } catch (err) { console.error("Erreur API :", err); }
    }
  };
  chercherVilles();
}, [formData.cp]);

// 3. Fonction pour sélectionner la ville dans la liste
const choisirVille = (nomVille) => {
  setFormData(prev => ({ ...prev, ville: nomVille }));
  setVillesPossibles([]);
};

  // --- 4. GESTION DES SAISIES CLASSIQUES ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 5. VALIDATION ET ENVOI AVEC GÉOCODAGE (NOMINATIM) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic client-side validation to avoid premature submit
    if (!formData.etablissement || !formData.etablissement.trim()) {
      alert("Le champ 'Établissement' est requis.");
      return;
    }
    if (!/^[0-9]{5}$/.test(formData.cp)) {
      alert("Veuillez saisir un code postal valide à 5 chiffres.");
      return;
    }
    if (!formData.ville || !formData.ville.trim()) {
      alert("Ville introuvable : vérifiez le code postal ou saisissez la ville.");
      return;
    }
    const fullAddr = `${formData.adresse}, ${formData.cp} ${formData.ville}, France`.replace(/(^[\s,]+|[\s,]+$)/g, '');
    const fallbackAddr = `${formData.cp} ${formData.ville}, France`.trim();
    const cityOnlyAddr = `${formData.ville}, France`.trim();

    const geocode = async (query) => {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    };

    try {
      setIsSubmitting(true);
      let result = null;
      if (fullAddr) result = await geocode(fullAddr);
      if (!result && fallbackAddr && fallbackAddr !== fullAddr) result = await geocode(fallbackAddr);
      if (!result && cityOnlyAddr && cityOnlyAddr !== fallbackAddr) result = await geocode(cityOnlyAddr);

      const coords = result
        ? { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
        : { lat: null, lng: null };

      if (!coords.lat || !coords.lng) {
        console.warn('Géocodage échoué pour :', fullAddr, fallbackAddr, cityOnlyAddr);
      }

      // On définit l'URL de base dynamiquement pour render
      const API_BASE_URL = import.meta.env.VITE_API_URL || "https://cers-backend-8i3g.onrender.com";

      try {
        // 2. On construit l'url finale en utilisant les littéraux de gabarits (backticks)
        const url = target 
          ? `${API_BASE_URL}/api/prodacteurs/${target.id}` 
          : `${API_BASE_URL}/api/prodacteurs`;

        const res = await fetch(url, {
          method: target ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, ...coords })
        });

        if (res.ok) {
          try { await res.json(); } catch (e) { console.error(e); }
          alert('Enregistrement effectué.');
          if (typeof onSuccess === 'function') onSuccess();
        } else {
          let text = '';
          try { text = await res.text(); } catch (error) { console.error(error); }
          alert(`Erreur lors de l'enregistrement (${res.status}): ${text}`);
          console.error('Enregistrement failed', res.status, text);
        }
      } catch (err) {
        console.error("Erreur soumission :", err);
        alert('Erreur réseau lors de l envoi : ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Erreur géocodage :", err);
      alert('Erreur lors du géocodage : ' + err.message);
      setIsSubmitting(false);
    }
  };

    // Gestion de la touche "Entrée" pour éviter la soumission involontaire
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && e.target && e.target.tagName !== 'TEXTAREA') e.preventDefault();
    };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="form-admin-cers"
    >
      <header>
        <h2>{target ? "Modification" : "Nouveau Prod'acteur"}</h2>
      </header>

      {/* BLOC PRINCIPAL : IDENTITÉ ET LOCALISATION */}
      <section className="form-grid">
        <article className="form-column">
          <label>Établissement / Commerce</label>
          <input name="etablissement" value={formData.etablissement} onChange={handleChange} required />
          
          <label>Responsable</label>
          <input name="responsable" value={formData.responsable} onChange={handleChange} />
          
          <label>Adresse (N° et Rue)</label>
          <input name="adresse" value={formData.adresse} onChange={handleChange} />
          
          <div className="postal-row">
            <input name="cp" placeholder="Code Postal" value={formData.cp} onChange={handleChange} maxLength="5" />
            <div className="ville-select-container">
              <input
                name="ville"
                value={formData.ville}
                readOnly
                className={villesPossibles.length > 0 ? "field-warning" : "readonly-input"}
                placeholder={villesPossibles.length > 0 ? "Choisissez ci-dessous..." : "Ville"}
              />
              {villesPossibles.length > 1 && (
                <ul className="suggestions-villes">
                  {villesPossibles.map((v, index) => (
                    <li key={index} onClick={() => choisirVille(v)}>{v}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <small>La ville est détectée automatiquement via le code postal.</small>
        </article>

        {/* BLOC CATÉGORIES : GESTION DES FILTRES DE LA CARTE [9] */}
        <article className="form-column categories-box">
          <label>Catégories du réseau</label>
          {["alimentation", "centre_culturel", "service", "bien_etre", "comptoir_echange"].map(cat => (
            <div key={cat} className="select-row">
              <span>{cat.replace("_", " ")}</span>
              <select name={cat} value={formData[cat]} onChange={handleChange}>
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>
          ))}
        </article>
      </section>

      {/* BLOC DÉTAILS : CONTENU DES POPUPS ET ENGAGEMENT */}
      <section className="form-full-width">
        <label>Description de l'activité</label>
        <textarea name="description" value={formData.description} onChange={handleChange} />
        
        <label>Pourquoi le CERS ? (Engagement)</label>
        <textarea name="pourquoi_cers" value={formData.pourquoi_cers} onChange={handleChange} />
      </section>

      {/* FOOTER : COORDONNÉES DE CONTACT */}
      <footer className="form-contact-row">
        <input name="tel" placeholder="Téléphone" value={formData.tel} onChange={handleChange} />
        <input name="mail" placeholder="Email" value={formData.mail} onChange={handleChange} />
        <input name="liens" placeholder="Lien (Site / Facebook)" value={formData.liens} onChange={handleChange} />
      </footer>

      <nav className="form-actions">
        <button type="submit" className="btn-save" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement...' : <><Save size={18}/> Enregistrer</>}</button>
        <button type="button" onClick={onCancel} className="btn-cancel"><XCircle size={18}/> Annuler</button>
      </nav>
    </form>
  );
}