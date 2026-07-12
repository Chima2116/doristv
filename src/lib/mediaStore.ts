"use client";

// blob: object URLs die with the page — they were never meant to survive a refresh. To make
// an uploaded film's actual video/poster/backdrop/trailer files persist across reloads, the
// raw Blobs go here (IndexedDB, which — unlike localStorage — can hold large binary data)
// keyed by a stable string; a fresh object URL is minted from the stored Blob on each load.

const DB_NAME = "doris-media";
const STORE_NAME = "blobs";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB unavailable")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadBlob(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBlob(key: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Re-keys a blob (draft-scoped -> film-id-scoped once a draft publishes). No-op if the
 * source key was never saved (e.g. an optional asset like the trailer was skipped). */
export async function moveBlob(fromKey: string, toKey: string): Promise<void> {
  const blob = await loadBlob(fromKey);
  if (!blob) return;
  await saveBlob(toKey, blob);
  await deleteBlob(fromKey);
}

export const draftAssetKey = (draftId: string, asset: string) => `draft:${draftId}:${asset}`;
export const filmAssetKey = (filmId: number, asset: string) => `film:${filmId}:${asset}`;
