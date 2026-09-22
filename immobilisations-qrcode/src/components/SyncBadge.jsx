import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { getPendingCount, syncQueue } from "../lib/offlineQueue.js";

// Indicateur discret de synchronisation : rassure l'agent que ses scans ne
// sont pas perdus, même sans réseau (voir lib/offlineQueue.js).
export default function SyncBadge() {
  const [pending, setPending] = useState(getPendingCount());
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setPending(getPendingCount());
    window.addEventListener("scan-queued", update);
    window.addEventListener("online", () => setOnline(true));
    window.addEventListener("offline", () => setOnline(false));

    const interval = setInterval(async () => {
      if (navigator.onLine && getPendingCount() > 0) {
        await syncQueue(supabase);
        setPending(getPendingCount());
      }
    }, 5000);

    return () => {
      window.removeEventListener("scan-queued", update);
      clearInterval(interval);
    };
  }, []);

  if (!online) {
    return <span className="badge badge-offline">Hors ligne · {pending} en attente</span>;
  }
  if (pending > 0) {
    return <span className="badge badge-pending">Synchronisation... {pending}</span>;
  }
  return <span className="badge badge-ok">Synchronisé</span>;
}
