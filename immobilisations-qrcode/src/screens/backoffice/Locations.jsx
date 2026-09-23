import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { useCompany } from "../../contexts/CompanyContext.jsx";
import BackofficeLayout from "../../components/BackofficeLayout.jsx";

const emptyForm = { site_name: "", building: "", room: "" };

export default function Locations() {
  const { companyId } = useCompany();
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!companyId) return;
    load();
  }, [companyId]);

  async function load() {
    const { data } = await supabase
      .from("locations")
      .select("id, site_name, building, floor, room")
      .eq("company_id", companyId)
      .order("site_name");
    setLocations(data || []);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.site_name.trim() || !form.room.trim()) return;
    await supabase.from("locations").insert({ company_id: companyId, ...form });
    setForm(emptyForm);
    load();
  }

  return (
    <BackofficeLayout title="Localisations">
      <form onSubmit={handleCreate} className="form card">
        <label>
          Site
          <input
            value={form.site_name}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            placeholder="Ex : Siège Abidjan"
            required
          />
        </label>
        <label>
          Bâtiment (optionnel)
          <input
            value={form.building}
            onChange={(e) => setForm({ ...form, building: e.target.value })}
          />
        </label>
        <label>
          Bureau / pièce
          <input
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            placeholder="Ex : Bureau comptabilité"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary">Ajouter</button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <tbody>
            {locations.map((l) => (
              <tr key={l.id}>
                <td>{[l.site_name, l.building, l.room].filter(Boolean).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BackofficeLayout>
  );
}
