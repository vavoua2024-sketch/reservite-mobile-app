// File d'attente locale des scans, pour fonctionner sans réseau pendant une
// campagne. Chaque scan est ajouté ici immédiatement (l'agent ne dépend
// jamais de la connexion), puis synchronisé vers Supabase dès qu'elle revient.
const STORAGE_KEY = "scan_queue_v1";

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueScan(scan) {
  const queue = readQueue();
  queue.push({ ...scan, localId: crypto.randomUUID(), synced: false });
  writeQueue(queue);
}

export function getQueue() {
  return readQueue();
}

export function getPendingCount() {
  return readQueue().filter((s) => !s.synced).length;
}

export function markSynced(localId) {
  const queue = readQueue().map((s) =>
    s.localId === localId ? { ...s, synced: true } : s
  );
  writeQueue(queue);
}

export function clearSynced() {
  writeQueue(readQueue().filter((s) => !s.synced));
}

export async function syncQueue(supabase) {
  const queue = readQueue();
  const pending = queue.filter((s) => !s.synced);
  const results = { ok: 0, failed: 0 };

  for (const scan of pending) {
    const { localId, synced, ...payload } = scan;
    const { error } = await supabase.from("inventory_scans").insert(payload);
    if (error) {
      results.failed += 1;
    } else {
      markSynced(localId);
      results.ok += 1;
    }
  }

  clearSynced();
  return results;
}
