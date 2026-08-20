import { useState, useEffect } from 'react';
import CartePublic from './components/CartePublic';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import './App.css'; 

export default function App() {
  const [view, setView] = useState("map");
  const [prodacteurs, setProdacteurs] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

    const fetchData = async () => {
    try {
      // 1. On définit l'URL de l'API dynamiquement
      const API_BASE_URL = import.meta.env.VITE_API_URL || "https://cers-backend-8i3g.onrender.com";
      
      // 2. On fait l'appel fetch avec l'URL dynamique
      const res = await fetch(`${API_BASE_URL}/api/prodacteurs`);
      const data = await res.json();
      setProdacteurs(data);
    } catch (err) { 
      console.error("Erreur serveur :", err); 
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="app-main-wrapper">
      {view === "map" && (
        <div className="view-container">
          {/* Bouton flottant pour l'admin */}
          <button className="admin-access-link" onClick={() => setView("login")}>Administration</button>
          <CartePublic prodacteurs={prodacteurs} />
        </div>
      )}

      {view === "login" && (
        <Login onLoginSuccess={() => { setIsLoggedIn(true); setView("admin"); }} onBack={() => setView("map")} />
      )}

      {view === "admin" && isLoggedIn && (
        <AdminDashboard 
          prodacteurs={prodacteurs} 
          onLogout={() => { setIsLoggedIn(false); setView("map"); }} 
          onRefresh={fetchData} 
        />
      )}
    </div>
  );
}