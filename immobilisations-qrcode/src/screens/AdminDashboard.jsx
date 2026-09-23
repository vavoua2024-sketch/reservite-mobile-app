import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function AdminDashboard() {
  const { session, profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("cabinets")
      .select("id, name, created_at, companies(count), profiles(count)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCabinets(data || []);
        setLoading(false);
      });
  }, [isAdmin]);

  if (isAdmin === false) return <Navigate to="/backoffice" replace />;
  if (isAdmin === null) return <div className="screen screen-center">Vérification des droits...</div>;

  return (
    <div className="screen admin">
      <header className="page-header">
        <div>
          <p className="eyebrow">Super admin</p>
          <h1>Tous les cabinets</h1>
        </div>
        <div className="header-actions">
          <span className="pill">{profile?.full_name}</span>
          <Link to="/backoffice" className="btn btn-ghost">
            Retour au backoffice
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="muted">Chargement...</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Cabinet</th>
                <th>Créé le</th>
                <th>Dossiers clients</th>
                <th>Membres</th>
              </tr>
            </thead>
            <tbody>
              {cabinets.map((c) => (
                <tr key={c.id}>
                  <td className="cell-strong">{c.name}</td>
                  <td>{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                  <td>{c.companies?.[0]?.count ?? 0}</td>
                  <td>{c.profiles?.[0]?.count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cabinets.length === 0 && <p className="muted">Aucun cabinet inscrit pour l'instant.</p>}
        </div>
      )}
    </div>
  );
}
