import { useState, useEffect, useRef } from 'react';

// Constantes pour les catégories et couleurs associées
const CATEGORIES = ["Tous", "Alimentation", "Restauration", "Loisirs", "Services"];
const COULEURS_CATEGORIES = {
  Alimentation: '#10b981',
  Restauration: '#f97316',
  Loisirs: '#6366f1',
  Services: '#06b6d4',
  Defaut: '#64748b'
};

export default function App() {
  // --- ÉTATS ---
  const [listeCommerces, setListeCommerces] = useState([]);
  const [commercesFiltres, setCommercesFiltres] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [categorieChoisie, setCategorieChoisie] = useState("Tous");
  const [selectionne, setSelectionne] = useState(null);

  // --- RÉFÉRENCES CARTE ---
  const refCarte = useRef(null);
  const instanceCarte = useRef(null);
  const marqueurs = useRef([]);

  // Chargement des données au démarrage
  useEffect(() => {
    const url = `${window.location.origin}/commerces_geocodes.json`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setListeCommerces(data);
          setCommercesFiltres(data);
        }
      })
      .catch(err => console.error("Erreur chargement :", err));
  }, []);

  // Initialisation de la carte Leaflet
  useEffect(() => {
    if (!window.L || instanceCarte.current) return;

    const carte = window.L.map(refCarte.current, {
      center: [43.1833, 3.0000],
      zoom: 14,
      zoomControl: false
    });

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap & CARTO'
    }).addTo(carte);

    window.L.control.zoom({ position: 'topright' }).addTo(carte);
    instanceCarte.current = carte;
  }, []);

  // Logique de filtrage par recherche et catégorie
  useEffect(() => {
    const terme = recherche.toLowerCase().trim();
    const resultat = listeCommerces.filter(c => {
      const matchCat = categorieChoisie === "Tous" || c.category === categorieChoisie;
      const matchSearch = !terme || 
        c.title.toLowerCase().includes(terme) || 
        c.address.toLowerCase().includes(terme);
      return matchCat && matchSearch;
    });
    setCommercesFiltres(resultat);
  }, [recherche, categorieChoisie, listeCommerces]);

  // Mise à jour des marqueurs sur la carte
  useEffect(() => {
    const L = window.L;
    if (!L || !instanceCarte.current) return;

    marqueurs.current.forEach(m => m.remove());
    marqueurs.current = [];

    commercesFiltres.forEach(c => {
      const couleur = COULEURS_CATEGORIES[c.category] || COULEURS_CATEGORIES.Defaut;
      const icone = L.divIcon({
        className: 'custom-svg-marker',
        html: `<svg width="28" height="35" viewBox="0 0 28 35" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 21 14 21s14-10.5 14-21c0-7.732-6.268-14-14-14z" fill="${couleur}"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`,
        iconSize: [28, 35],
        iconAnchor: [14, 35]
      });

      const marqueur = L.marker([c.lat, c.lng], { icon: icone })
        .addTo(instanceCarte.current)
        .on('click', () => setSelectionne(c));
      
      marqueurs.current.push(marqueur);
    });
  }, [commercesFiltres]);

  // --- FONCTION DE SÉLECTION ---
  const gererSelection = (commerce) => {
    setSelectionne(commerce);
    if (instanceCarte.current) {
      instanceCarte.current.setView([commerce.lat, commerce.lng], 16);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* Panneau latéral */}
      <aside className="w-full md:w-96 flex flex-col bg-white border-r border-slate-200 z-10 shadow-lg h-[40vh] md:h-full">
        <header className="p-4 bg-slate-950 text-white">
          <h1 className="text-sm font-bold tracking-wider">RÉSEAU CERS</h1>
        </header>

        <section className="p-3 border-b border-slate-100 space-y-2">
          <input
            type="search"
            placeholder="Rechercher..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full px-3 py-1.5 border rounded text-xs"
          />
          <nav className="flex gap-1 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategorieChoisie(cat)}
                className={`px-3 py-1 rounded text-xs ${categorieChoisie === cat ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </section>

        /* Liste des commerces */
        <section className="flex-1 overflow-y-auto">
          {commercesFiltres.map(c => (
            <div key={c.id} onClick={() => gererSelection(c)} className="p-4 cursor-pointer border-b hover:bg-slate-50">
              <h2 className="font-bold text-xs">{c.title}</h2>
              <p className="text-[10px] text-slate-500">{c.address}</p>
            </div>
          ))}
        </section>
      </aside>

      /* Zone Carte */
      <main className="flex-1 relative">
        <div ref={refCarte} className="w-full h-full"></div>
        {selectionne && (
          <article className="absolute bottom-4 left-4 right-4 md:w-80 bg-white p-4 rounded shadow-2xl z-50">
            <h3 className="font-bold text-sm">{selectionne.title}</h3>
            <p className="text-xs text-slate-600 mt-2">{selectionne.description}</p>
            <button onClick={() => setSelectionne(null)} className="mt-4 text-[10px] text-red-500">Fermer</button>
          </article>
        )}
      </main>
    </div>
  );
}