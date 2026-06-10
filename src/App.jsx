import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function App() {
  const [commerces, setCommerces] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [selected, setSelected] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef([]);

  const categories = useMemo(
    () => ["Tous", ...Array.from(new Set(commerces.map((c) => c.category)))],
    [commerces]
  );

  const filtered = useMemo(() => {
    let result = commerces;

    if (category !== "Tous") {
      result = result.filter((c) => c.category === category);
    }

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, category, commerces]);

  const formatCategory = (cat) =>
    cat === 'Tous'
      ? 'Tous'
      : cat
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

  // Chargement des donnees du fichier JSON geocode
  useEffect(() => {
    let url = '/commerces_geocodes.json';

    // Resolution securisee pour eviter les erreurs d'environnements sandbox
    if (window.location.origin && window.location.origin !== 'null' && !window.location.protocol.startsWith('blob')) {
      url = window.location.origin + '/commerces_geocodes.json';
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Fichier JSON introuvable");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCommerces(data);
        }
      })
      .catch(err => {
        console.error("Erreur de chargement du fichier JSON :", err);
      });
  }, []);

  // Initialisation de la carte Leaflet (OpenStreetMap)
  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [43.1833, 3.0000],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    mapInstance.current = map;
  }, []);

  // Synchronisation des marqueurs sur la carte
  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstance.current) return;

    markers.current.forEach(m => m.remove());
    markers.current = [];

    filtered.forEach(c => {
      const marker = L.marker([c.lat, c.lng])
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <b style="font-size: 13px; color: #1e293b;">${c.title}</b><br/>
            <span style="color: #64748b; font-size: 11px;">${c.category}</span>
          </div>
        `);

      marker.on('click', () => setSelected(c));
      markers.current.push(marker);
    });

    if (filtered.length > 0) {
      const group = new L.featureGroup(markers.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [filtered]);

  const selectAndZoom = (c) => {
    setSelected(c);
    if (mapInstance.current) {
      mapInstance.current.setView([c.lat, c.lng], 16);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 text-gray-800 overflow-hidden font-sans">
      
      {/* Panneau lateral */}
      <div className="w-full md:w-96 flex flex-col bg-white border-r border-gray-200 z-10 shadow-lg h-[40vh] md:h-full shrink-0">
        
        <div className="p-4 border-b border-gray-100 bg-slate-900 text-white">
          <h1 className="text-sm font-bold tracking-tight uppercase">Reseau CERS</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Monnaie locale complementaire citoyenne</p>
        </div>

        <div className="p-3 border-b border-gray-100 space-y-2">
          <input
            type="text"
            placeholder="Rechercher un commerce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-slate-500"
          />

          <div className="flex gap-1 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                  category === cat ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {formatCategory(cat)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center">Aucun resultat</p>
          ) : (
            filtered.map(c => (
              <div
                key={c.id}
                onClick={() => selectAndZoom(c)}
                className={`p-3 cursor-pointer transition-colors text-left ${
                  selected?.id === c.id ? 'bg-slate-50 border-l-4 border-slate-800' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold text-xs text-gray-900">{c.title}</h2>
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase font-bold">{c.category}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Adresse : {c.address}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Carte */}
      <div className="flex-1 relative h-full">
        <div ref={mapRef} className="w-full h-full z-0"></div>

        {/* Fiche details */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-white rounded shadow-xl z-50 border border-gray-100 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{selected.category}</span>
                <h3 className="text-xs font-bold text-gray-900 mt-0.5">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">Fermer</button>
            </div>

            <p className="text-xs text-gray-600 font-light mb-3">{selected.description || 'Aucune description disponible.'}</p>

            <div className="text-[10px] text-gray-500 space-y-1 pt-2 border-t border-gray-100">
              <p>Adresse : {selected.address}</p>
              {selected.phone && <p>Tél : {selected.phone}</p>}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}