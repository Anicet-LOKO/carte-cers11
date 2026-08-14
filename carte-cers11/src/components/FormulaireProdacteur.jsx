import { useState, useEffect } from 'react';
import { Save, XCircle, Search } from 'lucide-react';

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
  useEffect(() => {
    const fetchVille = async () => {
      // On ne lance la recherche que si on a exactement 5 chiffres
      if (formData.cp && /^\d{5}$/.test(formData.cp)) {
        try {
          const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${formData.cp}&type=municipality&limit=1`);
          const data = await res.json();

          // L'API renvoie un tableau `features` -> prendre le premier élément
          if (data && data.features && data.features.length > 0) {
            const feat = data.features[0];
            const villeDetectee = (feat.properties && (feat.properties.city || feat.properties.label)) || "";
            if (villeDetectee) setFormData(prev => ({ ...prev, ville: villeDetectee }));
          }
        } catch (err) {
          console.error("Erreur lors de la détection de la ville :", err);
        }
      } else if (formData.cp && formData.cp.length < 5) {
        // Si le CP devient incomplet, on vide le champ ville
        setFormData(prev => ({ ...prev, ville: "" }));
      }
    };
    fetchVille();
  }, [formData.cp]);

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

      const url = target ? `http://localhost:5000/api/prodacteurs/${target.id}` : 'http://localhost:5000/api/prodacteurs';
      const res = await fetch(url, {
        method: target ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...coords })
      });

      if (res.ok) {
        try { await res.json(); } catch (_) {}
        alert('Enregistrement effectué.');
        if (typeof onSuccess === 'function') onSuccess();
      } else {
        let text = '';
        try { text = await res.text(); } catch (_) {}
        alert(`Erreur lors de l'enregistrement (${res.status}): ${text}`);
        console.error('Enregistrement failed', res.status, text);
      }
    } catch (err) {
      console.error("Erreur soumission :", err);
      alert('Erreur réseau lors de l envoi : ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
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
          
          <div className="row-inline">
            <input name="cp" placeholder="Code Postal" value={formData.cp} onChange={handleChange} maxLength="5" />
            <input name="ville" placeholder="Ville" value={formData.ville} readOnly className="readonly-input" />
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