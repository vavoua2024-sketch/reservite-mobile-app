import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import BackofficeLayout from "../../components/BackofficeLayout.jsx";

// Le moteur de rapprochement : compare le fichier théorique (assets) aux
// scans terrain d'une campagne pour classer chaque bien en conforme /
// déplacé / manquant, plus les scans "inconnus" (QR non reconnu = surplus).
export default function CampaignResults() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [rows, setRows] = useState({ conforme: [], deplace: [], manquant: [], inconnu: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [campaignId]);

  async function loadResults() {
    setLoading(true);
    const { data: camp } = await supabase
      .from("inventory_campaigns")
      .select("id, title, company_id, companies(name)")
      .eq("id", campaignId)
      .single();
    setCampaign(camp);
    if (!camp) {
      setLoading(false);
      return;
    }

    const [{ data: assets }, { data: scans }] = await Promise.all([
      supabase
        .from("assets")
        .select("id, designation, asset_number, location_id, locations(site_name, room)")
        .eq("company_id", camp.company_id)
        .eq("status", "ACTIVE"),
      supabase
        .from("inventory_scans")
        .select("id, asset_id, scanned_at, condition_found, actual_location_id, unknown_qr_token, note, locations:actual_location_id(site_name, room)")
        .eq("campaign_id", campaignId)
        .order("scanned_at", { ascending: false }),
    ]);

    const latestScanByAsset = new Map();
    for (const scan of scans || []) {
      if (scan.asset_id && !latestScanByAsset.has(scan.asset_id)) {
        latestScanByAsset.set(scan.asset_id, scan); // déjà trié par scanned_at desc
      }
    }

    const conforme = [];
    const deplace = [];
    const manquant = [];

    for (const asset of assets || []) {
      const scan = latestScanByAsset.get(asset.id);
      if (!scan) {
        manquant.push(asset);
      } else if (scan.actual_location_id === asset.location_id) {
        conforme.push({ ...asset, scan });
      } else {
        deplace.push({ ...asset, scan });
      }
    }

    const inconnu = (scans || []).filter((s) => !s.asset_id && s.unknown_qr_token);

    setRows({ conforme, deplace, manquant, inconnu });
    setLoading(false);
  }

  function exportCsv() {
    const lines = [["Statut", "Désignation", "N° inventaire", "Localisation constatée"].join(";")];
    for (const a of rows.conforme) lines.push(["Conforme", a.designation, a.asset_number || "", locLabel(a.locations)].join(";"));
    for (const a of rows.deplace) lines.push(["Déplacé", a.designation, a.asset_number || "", locLabel(a.scan.locations)].join(";"));
    for (const a of rows.manquant) lines.push(["Manquant", a.designation, a.asset_number || "", ""].join(";"));
    for (const s of rows.inconnu) lines.push(["Inconnu/Surplus", s.unknown_qr_token, "", ""].join(";"));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resultats-${campaign?.title || campaignId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <BackofficeLayout title="Résultats de campagne">Chargement...</BackofficeLayout>;
  }

  return (
    <BackofficeLayout title={`Résultats — ${campaign?.title || ""}`}>
        <p className="muted">{campaign?.companies?.name}</p>

        <div className="kpi-row">
          <div className="kpi kpi-ok"><strong>{rows.conforme.length}</strong><span>Conformes</span></div>
          <div className="kpi kpi-move"><strong>{rows.deplace.length}</strong><span>Déplacés</span></div>
          <div className="kpi kpi-missing"><strong>{rows.manquant.length}</strong><span>Manquants</span></div>
          <div className="kpi kpi-unknown"><strong>{rows.inconnu.length}</strong><span>Inconnus/Surplus</span></div>
        </div>

        <button className="btn btn-secondary" onClick={exportCsv}>Exporter en CSV</button>

        {rows.manquant.length > 0 && (
          <Section title="⚠️ Manquants — nécessite une décision">
            {rows.manquant.map((a) => (
              <li key={a.id}>{a.designation} ({a.asset_number || a.id.slice(0, 8)})</li>
            ))}
          </Section>
        )}

        {rows.deplace.length > 0 && (
          <Section title="📍 Déplacés">
            {rows.deplace.map((a) => (
              <li key={a.id}>
                {a.designation} — {locLabel(a.locations)} → {locLabel(a.scan.locations)}
              </li>
            ))}
          </Section>
        )}

        {rows.inconnu.length > 0 && (
          <Section title="❓ Inconnus / surplus — à créer ou rejeter">
            {rows.inconnu.map((s) => (
              <li key={s.id}>QR : {s.unknown_qr_token} {s.note && `— ${s.note}`}</li>
            ))}
          </Section>
        )}

        <Section title="✅ Conformes">
          {rows.conforme.map((a) => (
            <li key={a.id}>{a.designation}</li>
          ))}
        </Section>
      </BackofficeLayout>
  );
}

function locLabel(loc) {
  if (!loc) return "—";
  return [loc.site_name, loc.room].filter(Boolean).join(" · ");
}

function Section({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <ul>{children}</ul>
    </section>
  );
}
