import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "../../lib/supabase.js";
import { useCompany } from "../../contexts/CompanyContext.jsx";
import BackofficeLayout from "../../components/BackofficeLayout.jsx";

export default function GenerateQr() {
  const { companyId } = useCompany();
  const [assets, setAssets] = useState([]);
  const [images, setImages] = useState({});

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("assets")
      .select("id, designation, asset_number, qr_code_token")
      .eq("company_id", companyId)
      .eq("status", "ACTIVE")
      .order("designation")
      .then(async ({ data }) => {
        setAssets(data || []);
        const entries = await Promise.all(
          (data || []).map(async (a) => [a.id, await QRCode.toDataURL(a.qr_code_token, { margin: 1, width: 180 })])
        );
        setImages(Object.fromEntries(entries));
      });
  }, [companyId]);

  return (
    <BackofficeLayout title="Étiquettes QR code">
      <div className="no-print">
        <p className="muted">
          {assets.length} étiquette(s) à imprimer et coller sur les biens correspondants.
        </p>
        <button onClick={() => window.print()}>Imprimer</button>
      </div>

      <div className="qr-grid">
        {assets.map((a) => (
          <div className="qr-tag" key={a.id}>
            {images[a.id] && <img src={images[a.id]} alt={`QR ${a.designation}`} />}
            <strong>{a.designation}</strong>
            <span>{a.asset_number || a.id.slice(0, 8)}</span>
          </div>
        ))}
      </div>
    </BackofficeLayout>
  );
}
