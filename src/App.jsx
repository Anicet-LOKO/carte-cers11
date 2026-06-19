import { useState, useEffect, useRef, useMemo } from 'react';
import { User, Phone, Mail, MapPin, Navigation, Search, Info, ExternalLink } from 'lucide-react';
import './App.css'; 

export default function App() {
  const [commerces, setCommerces] = useState([]);
  const [selection, setSelection] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [catActive, setCatActive] = useState("Tous");
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    const init = async () => {
      if (!window.L) { setTimeout(init, 100); return; }
      if (!mapInstance.current && mapRef.current) {
        mapInstance.current = window.L.map(mapRef.current).setView([43.18, 3.0], 11);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(mapInstance.current);
      }
      try {
        const res = await fetch('/commerces-ordonnes.json');
        const data = await res.json();
        setCommerces(data);
      } catch (e) { console.error("Erreur chargement JSON", e); }
    };
    init();
  }, []);

  const categoriesDynamiques = useMemo(() => {
    const uniques = [...new Set(commerces.map(c => c.categorie).filter(Boolean))];
    return ["Tous", "Comptoirs d'échange", ...uniques.sort()];
  }, [commerces]);

  const filtres = useMemo(() => {
    return (commerces || []).filter(c => {
      const matchSearch = [c.etablissement, c.ville, c.responsable].some(v => 
        v?.toLowerCase().includes(recherche.toLowerCase().trim())
      );
      let matchCat = catActive === "Tous" || 
                    (catActive === "Comptoirs d'échange" ? c.comptoir === "Oui" : c.categorie === catActive);
      return matchSearch && matchCat;
    }).sort((a, b) => a.ville.localeCompare(b.ville));
  }, [commerces, recherche, catActive]);

  // survol des marqueurs avec tooltip et clic pour sélectionner
  useEffect(() => {
    if (!mapInstance.current) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    filtres.forEach((c) => {
      if (c.lat && c.lng) {
        const marker = window.L.marker([c.lat, c.lng]).addTo(mapInstance.current);
        
        // Ajout d'un tooltip avec le nom de l'établissement et l'adresse de la ville)
        marker.bindTooltip(`<strong>${c.etablissement}</strong><br/>${c.adresse} - ${c.ville}`, { 
          direction: 'top', 
          sticky: true 
        });

        marker.on('click', () => { 
          setSelection(c); 
          mapInstance.current.setView([c.lat, c.lng], 16); 
        });
        markersRef.current[c.id] = marker;
      }
    });
  }, [filtres]);

  // Fonction utilitaire pour garantir que le lien est cliquable
  const formatUrl = (url) => {
    if (!url || url === "nan") return null;
    return url.startsWith('http') ? url : `https://${url}`;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <header className="sidebar-header">
          <div className="header-overlay" />
          <div className="header-content"><h1>Réseau CERS</h1><p>Monnaie Locale Communautaire Citoyenne</p></div>
        </header>

        <section className="filters-section">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Rechercher..." onChange={e => setRecherche(e.target.value)} />
          </div>
          <nav className="categories-nav">
            {categoriesDynamiques.map(cat => (
              <button key={cat} onClick={() => setCatActive(cat)}
                className={`cat-btn ${catActive === cat ? 'active' : ''}`}>{cat}</button>
            ))}
          </nav>
        </section>

        <ul className="merchants-list">
          {filtres.map(c => (
            <li key={c.id} onClick={() => { setSelection(c); mapInstance.current?.setView([c.lat, c.lng], 16); }}
                className={`merchant-item ${selection?.id === c.id ? 'selected' : ''}`}>
              <div className="merchant-summary">
                <p className="title-text"><b>Établissement :</b> {c.etablissement}</p>
                <div className="summary-row"><User size={14} className="icon-blue" /><p><b>Prod'Acteur :</b> {c.responsable}</p></div>
                <div className="summary-row"><Info size={14} className="icon-blue" /><p><b>Pourquoi le CERS :</b> <span className="text-italic">{c.pourquoi_cers || "Engagement local"}</span></p></div>
                
                {/* Lien vers le site web */}
                {formatUrl(c.liens) && (
                  <div className="summary-row"><ExternalLink size={14} className="icon-blue" />
                    <a href={formatUrl(c.liens)} target="_blank" rel="noreferrer" className="merchant-link" onClick={e => e.stopPropagation()}>
                      Visiter le site
                    </a>
                  </div>
                )}
                
                <div className="summary-row"><MapPin size={14} className="icon-blue" /><p><b>Ville :</b> <span className="city-label">{c.ville}</span></p></div>
              </div>
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
            <div className="detail-info">
              <div className="info-row"><User size={14} className="icon-blue" /><p><b>Prod'Acteur :</b> {selection.responsable}</p></div>
              <div className="info-row"><Phone size={14} className="icon-blue" /><p><b>Tél :</b> {selection.tel}</p></div>
              <div className="info-row"><Mail size={14} className="icon-blue" /><p><b>Email :</b> {selection.mail}</p></div>
              <div className="info-row"><MapPin size={14} className="icon-blue" /><p><b>Adresse :</b> {selection.adresse}, {selection.cp} {selection.ville}</p></div>
              <div className="info-row"><Info size={14} className="icon-blue" /><p><b>Pourquoi le CERS :</b> <span className="text-italic">{selection.pourquoi_cers || "Engagement local"}</span></p></div>
            </div>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selection.lat},${selection.lng}`)} className="route-btn">
              <Navigation size={14} /> Itinéraire
            </button>
          </article>
        )}
      </main>
    </div>
  );
}