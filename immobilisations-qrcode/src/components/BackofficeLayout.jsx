import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCompany } from "../contexts/CompanyContext.jsx";

export default function BackofficeLayout({ title, children }) {
  const { profile, signOut } = useAuth();
  const { companies, companyId, setCompanyId, setCompanies } = useCompany();
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  async function handleAddCompany(e) {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const { data, error } = await supabase
      .from("companies")
      .insert({ cabinet_id: profile.cabinet_id, name: newCompanyName })
      .select()
      .single();
    if (!error && data) {
      setCompanies((prev) => [...prev, data]);
      setCompanyId(data.id);
      setNewCompanyName("");
      setAddingCompany(false);
    }
  }

  return (
    <div className="screen backoffice">
      <header className="screen-header">
        <nav className="backoffice-nav">
          <Link to="/backoffice">Tableau de bord</Link>
          <Link to="/backoffice/assets">Immobilisations</Link>
          <Link to="/backoffice/locations">Localisations</Link>
          <Link to="/backoffice/qrcodes">QR codes</Link>
        </nav>

        {companies.length > 0 && (
          <select value={companyId || ""} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <button className="link-button" onClick={() => setAddingCompany((v) => !v)}>
          + Client
        </button>

        <span className="muted">{profile?.full_name}</span>
        <button className="link-button" onClick={signOut}>
          Déconnexion
        </button>
      </header>

      {addingCompany && (
        <form onSubmit={handleAddCompany} className="form form-inline">
          <input
            placeholder="Nom du nouveau dossier client"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            autoFocus
          />
          <button type="submit">Créer</button>
        </form>
      )}

      <h1>{title}</h1>

      {companies.length === 0 && !addingCompany && (
        <p className="muted">
          Aucun dossier client pour l'instant — clique sur « + Client » pour créer le premier.
        </p>
      )}

      {children}
    </div>
  );
}
