import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../contexts/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { enqueueScan } from "../lib/offlineQueue.js";
import {
  refreshCache,
  findAssetByToken,
  getCachedLocations,
  locationLabel,
} from "../lib/assetsCache.js";
import SyncBadge from "../components/SyncBadge.jsx";

const SCANNER_ID = "qr-reader";

export default function Scan() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const routeState = useLocation().state;
  const { profile } = useAuth();

  const scannerRef = useRef(null);
  const [mode, setMode] = useState("scanning"); // scanning | found | unknown | moving | problem
  const [asset, setAsset] = useState(null);
  const [unknownToken, setUnknownToken] = useState(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [note, setNote] = useState("");
  const [companyName] = useState(routeState?.companyName);

  useEffect(() => {
    // Le dossier client (companyId) vient normalement de la carte cliquée
    // sur l'écran des campagnes. Si l'agent arrive directement sur cette
    // page (ex: rafraîchissement), on retrouve companyId via la campagne —
    // ça nécessite une connexion pour cette fois-là.
    async function loadCompanyAndCache() {
      let companyId = routeState?.companyId;
      if (!companyId && navigator.onLine) {
        const { data } = await supabase
          .from("inventory_campaigns")
          .select("company_id")
          .eq("id", campaignId)
          .single();
        companyId = data?.company_id;
      }
      if (companyId) await refreshCache(companyId);
    }
    loadCompanyAndCache();
  }, [campaignId, routeState]);

  useEffect(() => {
    if (mode !== "scanning") return;

    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;
    let cancelled = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          if (cancelled) return;
          handleDecoded(decodedText);
        },
        () => {} // erreurs de frame ignorées, normal pendant la visée
      )
      .catch(() => {});

    return () => {
      cancelled = true;
      scanner.stop().catch(() => {});
      scanner.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleDecoded(token) {
    scannerRef.current?.pause(true);
    const found = findAssetByToken(token);
    if (found) {
      setAsset(found);
      setMode("found");
    } else {
      setUnknownToken(token);
      setMode("unknown");
    }
  }

  function recordScan(extra) {
    enqueueScan({
      campaign_id: campaignId,
      asset_id: asset?.id ?? null,
      scanned_by_user_id: profile.id,
      scanned_at: new Date().toISOString(),
      unknown_qr_token: asset ? null : unknownToken,
      ...extra,
    });
    window.dispatchEvent(new Event("scan-queued"));
    setScannedCount((n) => n + 1);
    resetToScanning();
  }

  function resetToScanning() {
    setAsset(null);
    setUnknownToken(null);
    setNote("");
    setMode("scanning");
  }

  function handleConforme() {
    recordScan({ condition_found: "GOOD", actual_location_id: asset.location_id });
  }

  function handleDeplace(newLocationId) {
    recordScan({ condition_found: "GOOD", actual_location_id: newLocationId });
  }

  function handleProbleme() {
    recordScan({
      condition_found: "DAMAGED",
      actual_location_id: asset.location_id,
      note: note || null,
    });
  }

  function handleSignalerSurplus() {
    recordScan({ condition_found: "UNKNOWN", note: "Bien non reconnu — à créer côté backoffice" });
  }

  return (
    <div className="screen scan-screen">
      <header className="screen-header">
        <button className="link-button" onClick={() => navigate("/")}>
          ← Campagnes
        </button>
        <span className="muted">
          {companyName ? `${companyName} · ` : ""}
          {scannedCount} scanné(s) cette session
        </span>
        <SyncBadge />
      </header>

      {mode === "scanning" && (
        <div className="scanner-wrap">
          <div id={SCANNER_ID} />
          <p className="muted center">Visez le QR code collé sur le bien</p>
        </div>
      )}

      {mode === "found" && asset && (
        <AssetSheet
          asset={asset}
          onConforme={handleConforme}
          onDeplace={() => setMode("moving")}
          onProbleme={() => setMode("problem")}
          onAnnuler={resetToScanning}
        />
      )}

      {mode === "moving" && (
        <LocationPicker
          onSelect={handleDeplace}
          onCancel={() => setMode("found")}
        />
      )}

      {mode === "problem" && (
        <div className="card">
          <h2>Signaler un problème</h2>
          <p>{asset.designation}</p>
          <textarea
            placeholder="Ex : écran cassé, à réformer..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="actions">
            <button onClick={handleProbleme}>Valider</button>
            <button className="secondary" onClick={() => setMode("found")}>
              Retour
            </button>
          </div>
        </div>
      )}

      {mode === "unknown" && (
        <div className="card">
          <h2>Bien non reconnu</h2>
          <p className="muted">
            Ce QR code ne correspond à aucune fiche enregistrée. Il sera signalé au
            responsable du cabinet pour création de la fiche.
          </p>
          <div className="actions">
            <button onClick={handleSignalerSurplus}>Signaler ce bien</button>
            <button className="secondary" onClick={resetToScanning}>
              Ignorer et continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetSheet({ asset, onConforme, onDeplace, onProbleme, onAnnuler }) {
  return (
    <div className="card asset-sheet">
      <h2>{asset.designation}</h2>
      <p className="muted">Réf. {asset.asset_number || asset.id}</p>
      <p>Emplacement attendu : {locationLabel(getCachedLocations().find((l) => l.id === asset.location_id))}</p>

      <div className="actions actions-stack">
        <button className="btn-ok" onClick={onConforme}>
          ✅ Conforme
        </button>
        <button className="btn-move" onClick={onDeplace}>
          📍 Déplacé
        </button>
        <button className="btn-warn" onClick={onProbleme}>
          ⚠️ Problème
        </button>
      </div>
      <button className="link-button" onClick={onAnnuler}>
        Annuler
      </button>
    </div>
  );
}

function LocationPicker({ onSelect, onCancel }) {
  const locations = getCachedLocations();
  return (
    <div className="card">
      <h2>Nouvelle localisation</h2>
      <ul className="location-list">
        {locations.map((l) => (
          <li key={l.id}>
            <button onClick={() => onSelect(l.id)}>{locationLabel(l)}</button>
          </li>
        ))}
      </ul>
      <button className="link-button" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}
