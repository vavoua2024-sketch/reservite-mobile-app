import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { useCompany } from "../../contexts/CompanyContext.jsx";
import BackofficeLayout from "../../components/BackofficeLayout.jsx";

export default function Dashboard() {
  const { companyId, companies } = useCompany();
  const [assetCount, setAssetCount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const companyName = companies.find((c) => c.id === companyId)?.name;

  useEffect(() => {
    if (!companyId) return;
    loadData();
  }, [companyId]);

  async function loadData() {
    const [{ count }, { data: camps }] = await Promise.all([
      supabase
        .from("assets")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "ACTIVE"),
      supabase
        .from("inventory_campaigns")
        .select("id, title, start_date, status")
        .eq("company_id", companyId)
        .order("start_date", { ascending: false }),
    ]);
    setAssetCount(count ?? 0);
    setCampaigns(camps || []);
  }

  async function createCampaign(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    await supabase.from("inventory_campaigns").insert({
      company_id: companyId,
      title: newTitle,
      start_date: new Date().toISOString().slice(0, 10),
      status: "IN_PROGRESS",
    });
    setNewTitle("");
    setCreating(false);
    loadData();
  }

  return (
    <BackofficeLayout title="Tableau de bord">
      <div className="kpi-row">
        <div className="kpi">
          <strong>{assetCount ?? "—"}</strong>
          <span>immobilisations actives</span>
        </div>
        <div className="kpi">
          <strong>{campaigns.filter((c) => c.status === "IN_PROGRESS").length}</strong>
          <span>campagne(s) en cours</span>
        </div>
      </div>

      <section className="card">
        <h2>Nouvelle campagne d'inventaire</h2>
        <form onSubmit={createCampaign} className="inline-form">
          <input
            placeholder="Ex : Inventaire annuel 2026"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={creating}>
            Créer et démarrer
          </button>
        </form>
      </section>

      <section>
        <h2>Campagnes</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Début</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="cell-strong">{c.title}</td>
                  <td>{c.start_date}</td>
                  <td>{c.status}</td>
                  <td className="row-actions">
                    {c.status === "IN_PROGRESS" && (
                      <Link
                        to={`/scan/${c.id}`}
                        state={{ companyId, companyName }}
                        className="link-button"
                      >
                        Scanner
                      </Link>
                    )}
                    <Link to={`/backoffice/campaigns/${c.id}/results`} className="link-button">
                      Résultats
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </BackofficeLayout>
  );
}
