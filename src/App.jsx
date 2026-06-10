import { useState, useEffect, useRef } from 'react';

const CATEGORIES = ["Tous", "Alimentation", "Restauration", "Loisirs", "Services"];

export default function App() {
  const [commerces, setCommerces] = useState([]);
  const [categorie, setCategorie] = useState("Tous");
  const [selectionne, setSelectionne] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Chargement des données
  useEffect(() => {
    fetch('/commerces_geocodes.json')
      .then(res => res.json())
      .then(data => setCommerces(data));
  }, []);

  // Initialisation Carte
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([43.1833, 3.0000], 14);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }
  }, []);

  const filtres = categorie === "Tous" ? commerces : commerces.filter(c => c.category === categorie);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Panneau latéral */}
      <aside className="w-96 flex flex-col border-r bg-white shadow-lg z-10">
        <header className="p-5 bg-slate-950 text-white font-bold text-lg">RÉSEAU CERS</header>
        
        {/* Navigation Catégories */}
        <nav className="flex p-3 gap-2 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategorie(cat)} 
              className={`px-3 py-1 rounded-full text-xs font-semibold ${categorie === cat ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>
              {cat}
            </button>
          ))}
        </nav>

        {/* Liste */}
        <ul className="flex-1 overflow-y-auto divide-y">
          {filtres.map(c => (
            <li key={c.id} className="p-4 cursor-pointer hover:bg-slate-50" onClick={() => setSelectionne(c)}>
              <h2 className="font-bold text-sm">{c.title}</h2>
              <p className="text-xs text-slate-500">{c.address}</p>
            </li>
          ))}
        </ul>
      </aside>

      {/* Carte */}
      <main className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Détails du commerce sélectionné */}
        {selectionne && (
          <article className="absolute bottom-6 left-6 z-[1000] bg-white p-6 rounded-xl shadow-2xl w-80 border">
            <h3 className="font-bold text-lg mb-2">{selectionne.title}</h3>
            <p className="text-sm mb-4">{selectionne.description}</p>
            <div className="text-xs text-slate-600 space-y-1 mb-4">
              <p>📍 {selectionne.address}</p>
              <p>👤 {selectionne.responsable}</p>
              <p>📞 {selectionne.phone}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded text-xs" 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectionne.lat},${selectionne.lng}`)}>
                Itinéraire
              </button>
              <button className="bg-slate-200 px-4 py-2 rounded text-xs" onClick={() => setSelectionne(null)}>Fermer</button>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}