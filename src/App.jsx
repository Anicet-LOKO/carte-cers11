import { useState, useEffect, useRef } from 'react';

const CATEGORIES = ["Tous", "Alimentation", "Restauration", "Loisirs", "Services"];

const CATEGORY_COLORS = {
  Alimentation: '#10b981', // Vert émeraude
  Restauration: '#f97316', // Orange
  Loisirs: '#6366f1',      // Indigo
  Services: '#06b6d4',      // Cyan
  Default: '#64748b'       // Ardoise
};

export default function App() {
  const [commerces, setCommerces] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [selected, setSelected] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    const url = `${window.location.origin}/commerces_geocodes.json`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Fichier de donnees JSON absent.");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCommerces(data);
          setFiltered(data);
        }
      })
      .catch(err => console.error("Erreur de chargement des commerces:", err));
  }, []);

  useEffect(() => {
    if (!window.L || mapInstance.current) return;

    const map = window.L.map(mapRef.current, {
      center: [43.1833, 3.0000],
      zoom: 14,
      zoomControl: false
    });

    const isRetina = window.L.Browser.retina;
    const tileUrl = isRetina
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

    window.L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    window.L.control.zoom({ position: 'topright' }).addTo(map);
    mapInstance.current = map;
  }, []);

  useEffect(() => {
    const query = search.toLowerCase().trim();
    const result = commerces.filter(c => {
      const matchCat = category === "Tous" || c.category === category;
      const matchSearch = !query || 
        c.title.toLowerCase().includes(query) || 
        c.address.toLowerCase().includes(query) ||
        (c.responsable && c.responsable.toLowerCase().includes(query));
      return matchCat && matchSearch;
    });
    setFiltered(result);
  }, [search, category, commerces]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstance.current) return;

    markers.current.forEach(m => m.remove());
    markers.current = [];

    filtered.forEach(c => {
      const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Default;

      const customIcon = L.divIcon({
        className: 'custom-svg-marker',
        html: `
          <svg width="28" height="35" viewBox="0 0 28 35" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 21 14 21s14-10.5 14-21c0-7.732-6.268-14-14-14z" fill="${color}"/>
            <circle cx="14" cy="14" r="5" fill="white"/>
          </svg>
        `,
        iconSize: [28, 35],
        iconAnchor: [14, 35],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([c.lat, c.lng], { icon: customIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <section style="font-family: inherit; font-size: 11px; color: #334155; min-width: 150px;">
            <h4 style="font-weight: 700; font-size: 13px; color: #1e293b; margin: 0 0 4px 0;">${c.title}</h4>
            <span style="background-color: ${color}; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase;">${c.category}</span>
            <p style="margin: 8px 0 0 0; color: #64748b;">📍 ${c.address.split(',')[0]}</p>
          </section>
        `);

      marker.on('click', () => setSelected(c));
      markers.current.push(marker);
    });

    if (filtered.length > 0) {
      const group = new L.featureGroup(markers.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.20));
    }
  }, [filtered]);

  const selectAndZoom = (c) => {
    setSelected(c);
    if (mapInstance.current) {
      mapInstance.current.setView([c.lat, c.lng], 16);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* Panneau latéral informatif et filtres */}
      <aside className="w-full md:w-96 flex flex-col bg-white border-r border-slate-200 z-10 shadow-lg h-[40vh] md:h-full shrink-0">
        
        <header className="p-4 bg-slate-950 text-white">
          <h1 className="text-sm font-bold tracking-wider uppercase">Réseau CERS</h1>
          <p className="text-[11px] text-slate-400 mt-0.5 font-light">Monnaie locale complémentaire citoyenne</p>
        </header>

        <section className="p-3 border-b border-slate-100 space-y-2.5" aria-label="Filtres de recherche">
          <input
            type="search"
            placeholder="Rechercher un commerce, gérant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-slate-500 transition-colors"
          />

          <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  category === cat ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </section>

        {/* Liste dynamique des commerces partenaires */}
        <section className="flex-1 overflow-y-auto" aria-label="Liste des partenaires">
          {filtered.length === 0 ? (
            <p className="p-6 text-xs text-slate-400 text-center font-light">Aucun partenaire trouvé</p>
          ) : (
            <ul className="divide-y divide-slate-100 m-0 p-0">
              {filtered.map(c => (
                <li
                  key={c.id}
                  onClick={() => selectAndZoom(c)}
                  className={`p-4 cursor-pointer list-none transition-all text-left border-l-4 ${
                    selected?.id === c.id ? 'bg-slate-50 border-slate-900' : 'border-transparent hover:bg-slate-50/50'
                  }`}
                >
                  <header className="flex justify-between items-start gap-2">
                    <h2 className="font-bold text-xs text-slate-900 tracking-tight leading-snug">{c.title}</h2>
                    <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase font-bold tracking-wide shrink-0">{c.category}</span>
                  </header>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">📍 {c.address}</p>
                  {c.responsable && <p className="text-[10px] text-slate-400 font-light mt-0.5">Responsable : {c.responsable}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      {/* Zone Cartographique & Fiche Détails d'un Commerce */}
      <main className="flex-1 relative h-full">
        <div ref={mapRef} className="w-full h-full z-0"></div>

        {selected && (
          <article className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-white rounded shadow-2xl z-50 border border-slate-100 p-4 transition-all duration-300">
            <header className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{selected.category}</span>
                <h3 className="text-xs font-bold text-slate-900 mt-0.5 leading-tight">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 bg-slate-50 rounded">Fermer</button>
            </header>

            <section className="text-xs text-slate-600 font-light leading-relaxed mb-3">
              <p>{selected.description || 'Aucune description disponible.'}</p>
            </section>

            <footer className="text-[10px] text-slate-500 space-y-1 pt-2.5 border-t border-slate-100 font-light">
              <p><strong>Adresse :</strong> {selected.address}</p>
              {selected.responsable && <p><strong>Responsable :</strong> {selected.responsable}</p>}
              {selected.phone && <p><strong>Tél :</strong> {selected.phone}</p>}
              {selected.email && <p><strong>Email :</strong> <a href={`mailto:${selected.email}`} className="text-slate-600 underline">{selected.email}</a></p>}
            </footer>
          </article>
        )}
      </main>

    </div>
  );
}