import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

// L'inscription crée automatiquement le cabinet et le profil "responsable"
// de l'utilisateur (voir le trigger handle_new_user côté base de données) —
// pas d'étape d'administration manuelle nécessaire.
export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [cabinetName, setCabinetName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, cabinet_name: cabinetName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/backoffice");
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="brand-mark brand-mark-lg">IQ</span>
        <h1>Crée ton cabinet</h1>
        <p className="muted">Ton compte, ton cabinet et ton profil responsable en un clic.</p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Votre nom
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Aya Koffi" />
          </label>
          <label>
            Nom du cabinet
            <input
              value={cabinetName}
              onChange={(e) => setCabinetName(e.target.value)}
              required
              placeholder="Cabinet Koffi & Associés"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="toi@cabinet.com"
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              placeholder="8 caractères minimum"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <Link to="/login" className="auth-switch">
          Déjà un cabinet ? <strong>Se connecter</strong>
        </Link>
      </div>
    </div>
  );
}
