import { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function Login({ onLoginSuccess, onBack }) {
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="login-screen-bg">
      <div className="login-card-container">
        <div className="login-header-block">
          <LogIn size={30} />
          <h2>Connexion Admin</h2>
        </div>
        
        <form className="login-fields-form" onSubmit={(e) => {
          e.preventDefault();
          if (identifiant === "admin" && password === "cers11") onLoginSuccess();
          else alert("Identifiants incorrects");
        }}>
          <div className="form-input-wrapper">
            <label>Identifiant</label>
            <input type="text" onChange={(e) => setIdentifiant(e.target.value)} required />
          </div>
          
          <div className="form-input-wrapper">
            <label>Mot de passe</label>
            <input type="password" onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="login-buttons-row">
            <button type="submit" className="btn-confirm">Entrer</button>
            <button type="button" onClick={onBack} className="btn-cancel">Retour</button>
          </div>
        </form>
      </div>
    </div>
  );
}