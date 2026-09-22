// Instantané local des immobilisations et localisations d'une entreprise,
// pour que le scan fonctionne même sans réseau (voir doc d'architecture,
// section "Dynamique de Synchronisation Multi-poste").
import { supabase } from "./supabase.js";

const ASSETS_KEY = "assets_cache_v1";
const LOCATIONS_KEY = "locations_cache_v1";

export async function refreshCache(companyId) {
  const [{ data: assets }, { data: locations }] = await Promise.all([
    supabase
      .from("assets")
      .select("id, qr_code_token, asset_number, designation, category_id, location_id, status")
      .eq("company_id", companyId)
      .eq("status", "ACTIVE"),
    supabase.from("locations").select("id, site_name, building, floor, room").eq("company_id", companyId),
  ]);
  if (assets) localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  if (locations) localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  return { assets: assets || [], locations: locations || [] };
}

export function getCachedAssets() {
  try {
    return JSON.parse(localStorage.getItem(ASSETS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getCachedLocations() {
  try {
    return JSON.parse(localStorage.getItem(LOCATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function findAssetByToken(token) {
  return getCachedAssets().find((a) => a.qr_code_token === token) || null;
}

export function locationLabel(location) {
  if (!location) return "";
  return [location.site_name, location.building, location.room].filter(Boolean).join(" · ");
}
