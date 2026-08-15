import { useState, useEffect, useRef, useMemo } from 'react';
import { User, Phone, Mail, MapPin, Navigation, Search, Info, ExternalLink, PlusCircle, X } from 'lucide-react';
import FormulaireProdacteur from './FormulaireProdacteur';
import '../App.css';

export default function App() {
  // --- SECTION 1 : ÉTATS (STATE) ---
  const [prodacteurs, setProdacteurs] = useState([]); // Source unique : le serveur Node.js
  const [selection, setSelection] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [catActive, setCatActive] = useState("Tous");
  const [sousCatActive, setSousCatActive] = useState("Toutes");
  const [showAdmin, setShowAdmin] = useState(false); // Pour masquer/afficher le formulaire

  // --- SECTION 2 : RÉFÉRENCES (DOM ET MAP) ---
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  // --- SECTION 3 : RÉCUPÉRATION DES DONNÉES (API) ---
  // On définit fetchData en dehors pour pouvoir la réutiliser après un ajout
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/prodacteurs');
      if (!response.ok) throw new Error("Erreur lors de la récupération");
      const data = await response.json();
      setProdacteurs(data);
      console.log("Données chargées depuis le Back-end :", data);
    } catch (error) {
      console.error("Erreur Backend :", error);
    }
  };

  // Initialisation de la carte et premier chargement
  useEffect(() => {
    if (!window.L) return;
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([43.18, 3.0], 11);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance.current);
    }
    fetchData();
  }, []);

  // --- SECTION 4 : LOGIQUE DE FILTRAGE ---
  const mainCategories = ["Tous", "Alimentation", "Centre Culturel", "Service", "Bien-Etre", "Comptoir d'Echange"];

  const formatLien = (u) => (u && u !== "nan") ? (u.startsWith('http') ? u : `https://${u}`) : null;

  const sousCategories = useMemo(() => {
    if (catActive === "Tous") return [];
    const key = catActive.toLowerCase().replace(" ", "_").replace("d'e", "e").replace(/[ -\s]/g, "_");
    const descList = prodacteurs
      .filter(c => c[key] === "Oui")
      .map(c => c.description)
      .filter(d => d && d !== "nan");
    return ["Toutes", ...new Set(descList)].sort();
  }, [prodacteurs, catActive]);

  useEffect(() => { setSousCatActive("Toutes"); }, [catActive]);

  const filtres = useMemo(() => {
    return (prodacteurs || []).filter(c => {
      const searchTxt = recherche.toLowerCase().trim();
      const matchSearch = [c.etablissement, c.ville, c.responsable, c.description, c.adresse, c.mail, c.tel, c.cp].some(v => 
        v?.toLowerCase().includes(searchTxt)
      );
      
      const key = catActive.toLowerCase().replace(" ", "_").replace("d'e", "e").replace(/[ -\s]/g, "_");
      const matchCat = catActive === "Tous" || c[key] === "Oui";
      const matchSousCat = sousCatActive === "Toutes" || c.description === sousCatActive;

      return matchSearch && matchCat && matchSousCat;
    }).sort((a, b) => a.ville.localeCompare(b.ville));
  }, [prodacteurs, recherche, catActive, sousCatActive]);

  // --- SECTION 5 : GESTION DES MARQUEURS ---
  useEffect(() => {
    if (!mapInstance.current) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    filtres.forEach((c) => {
      if (c.lat && c.lng) {
        const marker = window.L.marker([c.lat, c.lng]).addTo(mapInstance.current);
        marker.bindTooltip(`<b>${c.etablissement}</b></br>${c.responsable}</br>${c.adresse} ${c.cp} ${c.ville}</br>`, { direction: 'top', sticky: true });
        marker.on('click', () => { setSelection(c); mapInstance.current.setView([c.lat, c.lng], 16); });
        markersRef.current[c.id] = marker;
      }
    });
  }, [filtres]);

  // --- SECTION 6 : RENDU (JSX) ---
  return (
    <div className="app-container">
      <aside className="sidebar">
        <header className="sidebar-header">
          <div className="header-overlay" />
          <section className="header-content">
            <h1>Réseau CERS</h1>
            <p>Monnaie Locale Complémentaire Citoyenne</p> 
          </section>
        </header>

        <section className="filters-section">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Rechercher..." onChange={e => setRecherche(e.target.value)} />
          </div>
          
          <nav className="main-nav">
            {mainCategories.map(cat => (
              <button key={cat} onClick={() => setCatActive(cat)} 
                      className={`cat-btn ${catActive === cat ? 'active' : ''}`}>{cat}</button>
            ))}
          </nav>

          {sousCategories.length > 0 && (
            <nav className="sub-nav">
              {sousCategories.map(sc => (
                <button key={sc} onClick={() => setSousCatActive(sc)} 
                        className={`sub-btn ${sousCatActive === sc ? 'active' : ''}`}>{sc}</button>
              ))}
            </nav>
          )}
        </section>

        <ul className="merchants-list">
          {filtres.map(c => (
            <li key={c.id} onClick={() => { setSelection(c); mapInstance.current?.setView([c.lat, c.lng], 16); }}
                className={`merchant-item ${selection?.id === c.id ? 'selected' : ''}`}>
              <article className="merchant-summary">
                <p className="title-text"><b>{c.etablissement}</b></p>
                <p className="summary-row"><Info size={14} className="icon-blue" /> <b>{c.description}</b></p>
                <p className="summary-row"><User size={14} className="icon-blue" /> <b>Prod'Acteur :</b> {c.responsable}</p>
                <p className="summary-row pourquoi-text">
                  <b>Engagement :</b> <i>{(c.pourquoi_cers && c.pourquoi_cers !== "nan") ? c.pourquoi_cers : "Soutien à l'économie locale"}</i>
                </p>
                {formatLien(c.liens) && (
                  <p className="summary-row">
                    <ExternalLink size={14} className="icon-blue" />
                    <a href={formatLien(c.liens)} target="_blank" rel="noreferrer" className="merchant-link" onClick={e => e.stopPropagation()}>+ d'informations</a>
                  </p>
                )}
                <p className="summary-row"><MapPin size={14} className="icon-blue" /> <span className="city-label">{c.ville}</span></p>
              </article>
            </li>
          ))}
        </ul>
      </aside>

      <main className="map-area">
        <div ref={mapRef} className="leaflet-map" />
        {selection && (
          <article className="detail-card">
            <button className="close-btn" onClick={() => setSelection(null)}>&times;</button>
            <h2>{selection.etablissement}</h2>
            <section className="detail-info">
              <p><User size={14} className="icon-blue" /> <b>Prod'Acteur :</b> {selection.responsable}</p>
              <p><Phone size={14} className="icon-blue" /> <b>Tél :</b> {selection.tel}</p>
              <p><Mail size={14} className="icon-blue" /> <b>Email :</b> {selection.mail}</p>
              <p><MapPin size={14} className="icon-blue" /> <b>Adresse :</b> {selection.adresse}, {selection.cp} {selection.ville}</p>
            </section>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selection.lat},${selection.lng}`)} className="route-btn">
              <Navigation size={14} /> Itinéraire
            </button>
          </article>
        )}
      </main>
    </div>
  );
}