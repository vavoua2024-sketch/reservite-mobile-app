import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCompany } from "../contexts/CompanyContext.jsx";

export default function BackofficeLayout({ title, children }) {
  const { profile, signOut } = useAuth();
  const { companies, companyId, setCompanyId } = useCompany();

  return (
    <div className="screen backoffice">
      <header className="screen-header">
        <nav className="backoffice-nav">
          <Link to="/backoffice">Tableau de bord</Link>
          <Link to="/backoffice/assets">Immobilisations</Link>
          <Link to="/backoffice/qrcodes">QR codes</Link>
        </nav>
        <select value={companyId || ""} onChange={(e) => setCompanyId(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="muted">{profile?.full_name}</span>
        <button className="link-button" onClick={signOut}>
          Déconnexion
        </button>
      </header>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
