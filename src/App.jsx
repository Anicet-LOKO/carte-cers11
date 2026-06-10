import { useState, useEffect, useRef, useMemo } from 'react';

const CATEGORIES = ["Tous", "Alimentation", "Loisirs", "Restauration", "Services"];

export default function App() {
  const [commerces, setCommerces] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("Tous");
  const [selection, setSelection] = useState(null);
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // 1. Chargement des données et de la carte
  useEffect(() => {
    fetch('/commerces_geocodes.json').then(r => r.json()).then(setCommerces);

    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([43.18, 3.0], 12);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }
  }, []);

  // 2. Filtrage simple (Recherche + Catégorie)
  const filtres = useMemo(() => {
    return commerces.filter(c => 
      (categorie === "Tous" || c.category === categorie) &&
      (c.title.toLowerCase().includes(recherche.toLowerCase()))
    );
  }, [commerces, categorie, recherche]);

  // 3. Gestion des marqueurs sur la carte
  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    filtres.forEach(c => {
      const m = window.L.marker([c.lat, c.lng]).addTo(mapInstance.current).on('click', () => setSelection(c));
      markersRef.current.push(m);
    });
  }, [filtres]);

  return (
    <div className="flex h-screen w-full font-sans overflow-hidden">
      {/* --- BARRE LATÉRALE --- */}
      <aside className="w-80 flex flex-col border-r shadow-lg z-20 bg-white">
        
        {/* Header avec image des billets CERS */}
        <header 
          className="relative p-10 text-white text-center font-bold bg-cover bg-center"
          style={{ backgroundImage: "url('/monnaie_CERS.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/50"></div> {/* Voile pour lisibilité */}
          <div className="relative z-10">
            <h1 className="tracking-widest text-xl">RÉSEAU CERS</h1>
            <h2 className="text-[9px] uppercase opacity-80">Monnaie locale complémentaire citoyenne</h2>
          </div>
        </header>
        
        {/* Recherche et Filtres */}
        <div className="p-4 space-y-3">
          <input 
            className="w-full p-2 bg-gray-100 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400" 
            placeholder="Rechercher..." 
            onChange={e => setRecherche(e.target.value)} 
          />
          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategorie(cat)} 
                className={`px-3 py-1 rounded-full border transition ${categorie === cat ? 'bg-slate-900 text-white' : 'hover:bg-gray-100'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des commerces */}
        <ul className="flex-1 overflow-y-auto divide-y">
          {filtres.map(c => (
            <li key={c.id} onClick={() => { setSelection(c); mapInstance.current.setView([c.lat, c.lng], 15); }} 
              className={`p-4 cursor-pointer hover:bg-blue-50 ${selection?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
              <h3 className="font-bold text-sm uppercase">{c.title}</h3>
              <p className="text-[10px] text-gray-400"> {c.address}</p>
            </li>
          ))}
        </ul>
      </aside>

      {/* --- ZONE CARTE ET RÉSUMÉ --- */}
      <main className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full z-0" />
        
        {/* Fiche de résumé (Devant la carte grâce au z-index élevé) */}
        {selection && (
          <article className="absolute bottom-6 left-6 z- bg-white p-6 rounded-2xl shadow-2xl w-80 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="font-black text-xl mb-1">{selection.title}</h2>
            <p className="text-xs text-gray-500 italic mb-4">"{selection.description || 'Commerce de proximité'}"</p>
            
            <div className="text-[11px] text-gray-600 space-y-1 mb-6">
              <p>{selection.address}</p>
              <p><b>Responsable :</b> {selection.responsable}</p>
              {selection.phone && <p> <b>Tél :</b> {selection.phone}</p>}
            </div>

            <div className="flex gap-2">
              <button 
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selection.lat},${selection.lng}`)}
              >
                Itinéraire
              </button>
              <button onClick={() => setSelection(null)} className="px-4 bg-gray-100 rounded-xl text-xs font-bold text-gray-400">Fermer</button>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}