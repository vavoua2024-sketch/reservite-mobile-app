import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { useCompany } from "../../contexts/CompanyContext.jsx";
import BackofficeLayout from "../../components/BackofficeLayout.jsx";

const emptyForm = {
  designation: "",
  category_id: "",
  location_id: "",
  asset_number: "",
};

export default function AssetsList() {
  const { companyId } = useCompany();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    loadAssets();
    supabase.from("categories").select("id, name, syscohada_account").order("syscohada_account").then(({ data }) => setCategories(data || []));
    supabase.from("locations").select("id, site_name, building, room").eq("company_id", companyId).then(({ data }) => setLocations(data || []));
  }, [companyId]);

  async function loadAssets() {
    const { data } = await supabase
      .from("assets")
      .select("id, designation, asset_number, status, qr_code_token, categories(name, syscohada_account), locations(site_name, room)")
      .eq("company_id", companyId)
      .order("designation");
    setAssets(data || []);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.designation.trim()) return;
    await supabase.from("assets").insert({
      company_id: companyId,
      designation: form.designation,
      category_id: form.category_id || null,
      location_id: form.location_id || null,
      asset_number: form.asset_number || null,
      qr_code_token: crypto.randomUUID(),
    });
    setForm(emptyForm);
    setShowForm(false);
    loadAssets();
  }

  return (
    <BackofficeLayout title="Immobilisations">
      <button onClick={() => setShowForm((v) => !v)}>
        {showForm ? "Annuler" : "+ Ajouter une immobilisation"}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="form card">
          <label>
            Désignation
            <input
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              required
            />
          </label>
          <label>
            Numéro d'inventaire
            <input
              value={form.asset_number}
              onChange={(e) => setForm({ ...form, asset_number: e.target.value })}
            />
          </label>
          <label>
            Catégorie SYSCOHADA
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.syscohada_account} — {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Localisation
            <select
              value={form.location_id}
              onChange={(e) => setForm({ ...form, location_id: e.target.value })}
            >
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {[l.site_name, l.building, l.room].filter(Boolean).join(" · ")}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Enregistrer</button>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Désignation</th>
            <th>N° inventaire</th>
            <th>Compte SYSCOHADA</th>
            <th>Localisation</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id}>
              <td>{a.designation}</td>
              <td>{a.asset_number || "—"}</td>
              <td>{a.categories ? `${a.categories.syscohada_account} — ${a.categories.name}` : "—"}</td>
              <td>{a.locations ? [a.locations.site_name, a.locations.room].filter(Boolean).join(" · ") : "—"}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </BackofficeLayout>
  );
}
