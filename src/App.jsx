import { useState, useEffect, useRef, useMemo } from 'react';
import { User, Phone, Mail, MapPin, Navigation, Search } from 'lucide-react';

const CATEGORIES = ["Tous", "Alimentation", "Loisirs", "Restauration", "Services", "Santé/Beauté"];

export default function App() {
  const [commerces, setCommerces] = useState([]);
  const [selection, setSelection] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [catActive, setCatActive] = useState("Tous");

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  // Initialisation de Leaflet et chargement des donnéees
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

  // Filtrage et Tri par ville
  const filtres = useMemo(() => {
    let result = (commerces || []).filter(c => {
      const matchSearch = [c.title, c.city, c.manager].some(v => v?.toLowerCase().includes(recherche.toLowerCase()));
      const matchCat = catActive === "Tous" || c.category?.toLowerCase().includes(catActive.toLowerCase().substring(0, 3));
      return matchSearch && matchCat;
    });
    return result.sort((a, b) => a.city.localeCompare(b.city));
  }, [commerces, recherche, catActive]);

  // Gestion des marqueurs sur la carte
  useEffect(() => {
    if (!mapInstance.current) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    filtres.forEach((c) => {
      if (c.lat && c.lng) {
        const marker = window.L.marker([c.lat, c.lng]).addTo(mapInstance.current);
        marker.bindTooltip(`<b>${c.title}</b><br/>${c.city}`, { sticky: true });
        marker.on('click', () => {
          setSelection(c);
          mapInstance.current.setView([c.lat, c.lng], 16);
        });
        markersRef.current[c.id] = marker;
      }
    });
  }, [filtres]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden font-sans">
      {/* BARRE LATÉRALE */}
      <aside className="w-full md:w-96 flex flex-col border-r shadow-2xl z-20 bg-white h-2/5 md:h-full">
        <header className="relative h-48 shrink-0 overflow-hidden bg-slate-100">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/monnaie_CERS.jpg')" }} />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-6 text-center">
            <h1 className="text-3xl font-black uppercase tracking-[0.2em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">Réseau CERS</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest drop-shadow-md">Monnaie locale citoyenne</p>
          </div>
        </header>

        <div className="p-4 border-b space-y-4 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" 
                   placeholder="Rechercher..." onChange={e => setRecherche(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatActive(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
                  catActive === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}>{cat}</button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtres.map(c => (
            <li key={c.id} onClick={() => { setSelection(c); mapInstance.current?.setView([c.lat, c.lng], 16); }}
                className={`p-5 cursor-pointer hover:bg-slate-50 transition-all ${selection?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[11px] uppercase text-slate-800">{c.title}</h3>
                <span className="text-[8px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-black uppercase">{c.city}</span>
              </div>
              <div className="flex items-center text-slate-400">
                <User size={12} className="mr-1.5" />
                <p className="text-[10px] italic">{c.manager}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* ZONE CARTE */}
      <main className="flex-1 relative h-3/5 md:h-full">
        <div ref={mapRef} className="h-full w-full z-0" />
        {selection && (
          <article className="absolute bottom-6 left-6 right-6 md:right-auto z-30 bg-white p-6 rounded-3xl shadow-2xl md:w-80 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-black text-slate-900 uppercase mb-4">{selection.title}</h2>
            <div className="text-[11px] space-y-3 border-t pt-4 text-slate-600 mb-6">
              <div className="flex items-center"><User size={14} className="mr-3 text-blue-500" /><p><b>Gérant :</b> {selection.manager}</p></div>
              <div className="flex items-center"><Phone size={14} className="mr-3 text-blue-500" /><p><b>Tél :</b> {selection.phone}</p></div>
              <div className="flex items-center"><Mail size={14} className="mr-3 text-blue-500" /><p><b>Email :</b> {selection.email}</p></div>
              <div className="flex items-start"><MapPin size={14} className="mr-3 mt-0.5 text-blue-500" /><p><b>Adresse :</b> {selection.address}, {selection.cp} {selection.city}</p></div>
            </div>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selection.lat},${selection.lng}`)}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
              <Navigation size={14} /> Itinéraire
            </button>
          </article>
        )}
      </main>
    </div>
  );
}