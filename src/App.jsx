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

  useEffect(() => {
    fetch('/commerces_geocodes.json').then(r => r.json()).then(setCommerces);
    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([43.18, 3.0], 12);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }
  }, []);

  const filtres = useMemo(() => {
    return commerces.filter(c => 
      (categorie === "Tous" || c.category === categorie) &&
      (c.title.toLowerCase().includes(recherche.toLowerCase()))
    );
  }, [commerces, categorie, recherche]);

  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    filtres.forEach(c => {
      const m = window.L.marker([c.lat, c.lng]).addTo(mapInstance.current).on('click', () => setSelection(c));
      markersRef.current.push(m);
    });
  }, [filtres]);

  return (
    /* CORRECTION : flex-col par défaut (mobile), md:flex-row sur ordi */
    <div className="flex flex-col md:flex-row h-screen w-full font-sans overflow-hidden bg-white">
      
      {/* --- BARRE LATÉRALE / LISTE --- */}
      {/* h-1/2 sur mobile pour laisser de la place à la carte, h-full sur ordi */}
      <aside className="w-full md:w-80 h-1/2 md:h-full flex flex-col border-r shadow-lg z-20 bg-white">
        
        <header 
          className="relative p-6 md:p-10 text-white text-center font-bold bg-cover bg-center shrink-0"
          style={{ backgroundImage: "url('/monnaie_CERS.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10">
            <h1 className="tracking-widest text-lg md:text-xl">RÉSEAU CERS</h1>
            <p className="text-[8px] md:text-[9px] uppercase opacity-80">Monnaie locale citoyenne</p>
          </div>
        </header>
        
        <div className="p-4 space-y-3 shrink-0 bg-white">
          <input 
            className="w-full p-2 bg-gray-100 rounded text-sm outline-none border focus:border-blue-400" 
            placeholder="Rechercher..." 
            onChange={e => setRecherche(e.target.value)} 
          />
          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategorie(cat)} 
                className={`px-3 py-1 rounded-full border whitespace-nowrap ${categorie === cat ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y bg-white">
          {filtres.map(c => (
            <li key={c.id} onClick={() => { setSelection(c); mapInstance.current.setView([c.lat, c.lng], 15); }} 
              className={`p-4 cursor-pointer hover:bg-blue-50 ${selection?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
              <h3 className="font-bold text-xs md:text-sm uppercase">{c.title}</h3>
              <p className="text-[10px] text-gray-400">📍 {c.address}</p>
            </li>
          ))}
        </ul>
      </aside>

      {/* --- ZONE CARTE --- */}
      <main className="flex-1 relative h-1/2 md:h-full">
        <div ref={mapRef} className="h-full w-full z-0" />
        
        {/* Résumé adapté : centré sur mobile, en bas à gauche sur ordi */}
        {selection && (
          <article className="absolute bottom-4 left-4 right-4 md:right-auto z- bg-white p-5 rounded-2xl shadow-2xl md:w-80 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-black text-lg leading-tight">{selection.title}</h2>
              <button onClick={() => setSelection(null)} className="text-gray-400 text-xl">&times;</button>
            </div>
            <p className="text-[11px] text-gray-500 mb-4 line-clamp-2">📍 {selection.address}</p>
            
            <button 
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition"
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selection.lat},${selection.lng}`)}
            >
              ITINÉRAIRE
            </button>
          </article>
        )}
      </main>
    </div>
  );
}