import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import SyncBadge from "../components/SyncBadge.jsx";
import SpaceSwitcher from "../components/SpaceSwitcher.jsx";

export default function CampaignSelect() {
  const { profile, session, signOut } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Un cabinet gère plusieurs dossiers clients : on affiche les campagnes
    // de TOUS les clients du cabinet, avec le nom du client sur chaque carte.
    supabase
      .from("inventory_campaigns")
      .select("id, title, start_date, end_date, status, company_id, companies(name)")
      .eq("status", "IN_PROGRESS")
      .order("start_date", { ascending: false })
      .then(({ data }) => {
        setCampaigns(data || []);
        setLoading(false);
      });
  }, [profile]);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsPlatformAdmin(!!data));
  }, [session]);

  return (
    <div className="screen">
      <SpaceSwitcher current="scan" isPlatformAdmin={isPlatformAdmin} />
      <header className="screen-header">
        <div>
          <h1>Campagnes en cours</h1>
          {profile && <p className="muted">{profile.full_name}</p>}
        </div>
        <SyncBadge />
      </header>

      {loading && <p>Chargement...</p>}
      {!loading && campaigns.length === 0 && (
        <p className="muted">Aucune campagne d'inventaire en cours pour le moment.</p>
      )}

      <ul className="campaign-list">
        {campaigns.map((c) => (
          <li key={c.id}>
            <Link
              to={`/scan/${c.id}`}
              state={{ companyId: c.company_id, companyName: c.companies?.name }}
              className="campaign-card"
            >
              <strong>{c.title}</strong>
              <span className="muted">{c.companies?.name} · depuis le {c.start_date}</span>
            </Link>
          </li>
        ))}
      </ul>

      <button className="link-button" onClick={signOut}>
        Se déconnecter
      </button>
    </div>
  );
}
