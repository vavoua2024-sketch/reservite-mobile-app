import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCompany } from "../contexts/CompanyContext.jsx";

export default function BackofficeLayout({ title, children }) {
  const { profile, session, signOut } = useAuth();
  const { companies, companyId, setCompanyId, setCompanies } = useCompany();
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsPlatformAdmin(!!data));
  }, [session]);

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

  const navClass = ({ isActive }) => `side-link${isActive ? " active" : ""}`;

  const initials = (profile?.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">IQ</span>
          <span className="brand-name">Inventaire</span>
        </div>

        <nav className="side-nav">
          <NavLink to="/backoffice" end className={navClass}>
            Tableau de bord
          </NavLink>
          <NavLink to="/backoffice/assets" className={navClass}>
            Immobilisations
          </NavLink>
          <NavLink to="/backoffice/locations" className={navClass}>
            Localisations
          </NavLink>
          <NavLink to="/backoffice/qrcodes" className={navClass}>
            QR codes
          </NavLink>
          {isPlatformAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `side-link side-link-admin${isActive ? " active" : ""}`}>
              Super admin
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{initials}</span>
            <span className="user-name">{profile?.full_name}</span>
          </div>
          <button className="btn btn-ghost btn-block" onClick={signOut}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">Cabinet</p>
            <h1>{title}</h1>
          </div>

          <div className="header-actions">
            {companies.length > 0 && (
              <select
                className="select-company"
                value={companyId || ""}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <button className="btn btn-secondary" onClick={() => setAddingCompany((v) => !v)}>
              + Client
            </button>
          </div>
        </header>

        {addingCompany && (
          <form onSubmit={handleAddCompany} className="inline-form">
            <input
              placeholder="Nom du nouveau dossier client"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              Créer
            </button>
          </form>
        )}

        {companies.length === 0 && !addingCompany && (
          <div className="empty-state">
            <p>Aucun dossier client pour l'instant.</p>
            <button className="btn btn-primary" onClick={() => setAddingCompany(true)}>
              + Créer le premier
            </button>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
