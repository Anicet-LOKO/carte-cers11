import { useState, useEffect, useRef, useMemo } from 'react';
import { User, Phone, Mail, MapPin, Navigation, Search, Tag } from 'lucide-react';
import './App.css'; 

export default function App() {
  const [commerces, setCommerces] = useState([]);
  const [selection, setSelection] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [catActive, setCatActive] = useState("Tous");

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  // Chargement des données et Init Carte [4, 5]
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
      } catch (e) { console.error("Erreur JSON", e); }
    };
    init();
  }, []);

  // 1. GÉNÉRATION DYNAMIQUE DES CATÉGORIES
  const categoriesDynamiques = useMemo(() => {
    const toutesLesCats = commerces.map(c => c.category).filter(Boolean);
    const uniques = [...new Set(toutesLesCats)];
    return ["Tous", ...uniques.sort()];
  }, [commerces]);

  // 2. FILTRAGE ET TRI PAR VILLE
  const filtres = useMemo(() => {
    return (commerces || []).filter(c => {
      const matchSearch = [c.title, c.city, c.manager].some(v => 
        v?.toLowerCase().includes(recherche.toLowerCase().trim())
      );
      const matchCat = catActive === "Tous" || c.category === catActive;
      return matchSearch && matchCat;
    }).sort((a, b) => a.city.localeCompare(b.city));
  }, [commerces, recherche, catActive]);

  // 3. MISE À JOUR TOOLTIP ET MARQUEURS
  useEffect(() => {
    if (!mapInstance.current) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    filtres.forEach((c) => {
      if (c.lat && c.lng) {
        const marker = window.L.marker([c.lat, c.lng]).addTo(mapInstance.current);
        marker.bindTooltip(`
          <div class="map-tooltip">
            <strong>${c.title}</strong><br/>
            <span> ${c.address}<br/>${c.city}</span>
          </div>`, { sticky: true, direction: 'top' });
        marker.on('click', () => { setSelection(c); mapInstance.current.setView([c.lat, c.lng], 16); });
        markersRef.current[c.id] = marker;
      }
    });
  }, [filtres]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <header className="sidebar-header">
          <div className="header-overlay" />
          <div className="header-content">
            <h1>Réseau CERS</h1>
            <p>Monnaie locale citoyenne</p>
          </div>
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
                <div className="summary-row"><MapPin size={14} className="icon-blue" /><p><b>Établissement :</b> {c.title}</p></div>
                <div className="summary-row"><User size={14} className="icon-blue" /><p><b>Gérant :</b> {c.manager}</p></div>
                <div className="summary-row"><Tag size={14} className="icon-blue" /><p><b>Ville :</b> <span className="city-label">{c.city}</span></p></div>
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
            <h2>{selection.title}</h2>
            <div className="detail-info">
              <div className="info-row"><User size={14} className="icon-blue" /><p><b>Gérant :</b> {selection.manager}</p></div>
              <div className="info-row"><Phone size={14} className="icon-blue" /><p><b>Tél :</b> {selection.phone}</p></div>
              <div className="info-row"><Mail size={14} className="icon-blue" /><p><b>Email :</b> {selection.email}</p></div>
              <div className="info-row"><MapPin size={14} className="icon-blue" /><p><b>Adresse :</b> {selection.address}, {selection.cp} {selection.city}</p></div>
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