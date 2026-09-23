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
    <div className="screen screen-center">
      <h1>Créer votre cabinet</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Votre nom
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Nom du cabinet
          <input value={cabinetName} onChange={(e) => setCabinetName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      <Link to="/login" className="link-button">
        J'ai déjà un compte
      </Link>
    </div>
  );
}
