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

  // 1. Chargement des données et initialisation de la carte
  useEffect(() => {
    fetch('/commerces_geocodes.json').then(r => r.json()).then(setCommerces);

    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([43.18, 3.0], 12);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }
  }, []);

  // 2. Filtrage dynamique
  const filtres = useMemo(() => {
    return commerces.filter(c => 
      (categorie === "Tous" || c.category === categorie) &&
      (c.title.toLowerCase().includes(recherche.toLowerCase()))
    );
  }, [commerces, categorie, recherche]);

  // 3. Mise à jour des marqueurs
  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    filtres.forEach(c => {
      const m = window.L.marker([c.lat, c.lng]).addTo(mapInstance.current).on('click', () => setSelection(c));
      markersRef.current.push(m);
    });
  }, [filtres]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full font-sans overflow-hidden bg-white">
      
      {/* --- PANNEAU LATÉRAL --- */}
      <aside className="w-full md:w-96 h-1/2 md:h-full flex flex-col border-r shadow-lg z-20 bg-white">
        
        {/* Header avec l'image des billets CERS */}
        <header 
          className="relative p-6 md:p-10 text-white text-center font-bold bg-cover bg-center shrink-0"
          style={{ backgroundImage: "url('/monnaie_CERS.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10">
            <h1 className="tracking-widest text-lg md:text-xl uppercase">Réseau CERS</h1>
            <p className="text-[8px] md:text-[9px] uppercase opacity-80">Monnaie locale citoyenne du Narbonnais</p>
          </div>
        </header>
        
        <div className="p-4 space-y-3 shrink-0 bg-white border-b">
          <input 
            className="w-full p-2.5 bg-gray-100 rounded-lg text-sm outline-none border focus:border-blue-400 transition-all" 
            placeholder="Rechercher un commerce..." 
            onChange={e => setRecherche(e.target.value)} 
          />
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategorie(cat)} 
                className={`px-4 py-1.5 rounded-full border text-[10px] font-bold whitespace-nowrap transition-colors
                  ${categorie === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des commerçants */}
        <ul className="flex-1 overflow-y-auto divide-y bg-white">
          {filtres.map(c => (
            <li key={c.id} onClick={() => { setSelection(c); mapInstance.current.setView([c.lat, c.lng], 15); }} 
              className={`p-5 cursor-pointer hover:bg-blue-50 transition-colors ${selection?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-xs md:text-sm uppercase text-slate-800">{c.title}</h3>
                <span className="text-[8px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 font-bold uppercase">{c.category}</span>
              </div>
              <p className="text-[10px] text-gray-400 flex items-center gap-1"> {c.address}</p>
              <p className="text-[10px] text-gray-400 mt-1 italic">Responsable : {c.responsable}</p>
            </li>
          ))}
        </ul>
      </aside>

      {/* --- ZONE CARTE ET FICHE RÉSUMÉ --- */}
      <main className="flex-1 relative h-1/2 md:h-full">
        <div ref={mapRef} className="h-full w-full z-0" />
        
        {/* Fiche Résumé complète */}
        {selection && (
          <article className="absolute bottom-4 left-4 right-4 md:right-auto z- bg-white p-6 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] md:w-80 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{selection.category}</span>
              <button onClick={() => setSelection(null)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">&times;</button>
            </div>
            
            <h2 className="font-black text-xl mb-1 text-slate-900 leading-tight">{selection.title}</h2>
            <p className="text-xs text-gray-400 italic mb-5">"{selection.description || 'Commerce de proximité engagé'}"</p>
            
            <div className="text-[11px] text-gray-600 space-y-2 mb-6 border-t pt-4">
              <p className="flex items-start gap-2">
                <span className="text-blue-500"></span> <b>Adresse :</b> {selection.address}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-blue-500"></span> <b>Responsable :</b> {selection.responsable}
              </p>
              {selection.phone && (
                <p className="flex items-center gap-2">
                  <span className="text-blue-500"></span> <b>Tél :</b> {selection.phone}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selection.lat},${selection.lng}`)}
              >
                ITINÉRAIRE
              </button>
              <button onClick={() => setSelection(null)} className="px-5 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-400 uppercase"></button>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}