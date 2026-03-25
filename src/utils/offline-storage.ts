import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "nogiet-offline";
const DB_VERSION = 1;

interface NogietDB {
  facilities: { key: string; value: any };
  emissions: { key: string; value: any };
  alerts: { key: string; value: any };
  pendingSubmissions: { key: string; value: any; indexes: { "by-status": string } };
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("facilities")) {
          db.createObjectStore("facilities", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("emissions")) {
          db.createObjectStore("emissions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("alerts")) {
          db.createObjectStore("alerts", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("pendingSubmissions")) {
          const store = db.createObjectStore("pendingSubmissions", { keyPath: "id", autoIncrement: true });
          store.createIndex("by-status", "status");
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheFacilities(facilities: any[]) {
  const db = await getDb();
  const tx = db.transaction("facilities", "readwrite");
  await tx.store.clear();
  for (const f of facilities) {
    await tx.store.put(f);
  }
  await tx.done;
}

export async function getCachedFacilities(): Promise<any[]> {
  const db = await getDb();
  return db.getAll("facilities");
}

export async function cacheEmissions(key: string, data: any) {
  const db = await getDb();
  await db.put("emissions", { id: key, data, cachedAt: Date.now() });
}

export async function getCachedEmissions(key: string): Promise<any | null> {
  const db = await getDb();
  const entry = await db.get("emissions", key);
  if (!entry) return null;
  const age = Date.now() - entry.cachedAt;
  if (age > 24 * 60 * 60 * 1000) return null;
  return entry.data;
}

export async function cacheAlerts(alerts: any[]) {
  const db = await getDb();
  const tx = db.transaction("alerts", "readwrite");
  await tx.store.clear();
  for (const a of alerts) {
    await tx.store.put(a);
  }
  await tx.done;
}

export async function getCachedAlerts(): Promise<any[]> {
  const db = await getDb();
  return db.getAll("alerts");
}

export async function queuePendingSubmission(submission: any) {
  const db = await getDb();
  await db.add("pendingSubmissions", { ...submission, status: "pending", queuedAt: Date.now() });
}

export async function getPendingSubmissions(): Promise<any[]> {
  const db = await getDb();
  return db.getAllFromIndex("pendingSubmissions", "by-status", "pending");
}

export async function markSubmissionSynced(id: number) {
  const db = await getDb();
  const entry = await db.get("pendingSubmissions", id);
  if (entry) {
    entry.status = "synced";
    await db.put("pendingSubmissions", entry);
  }
}

export function isOffline(): boolean {
  return !navigator.onLine;
}
