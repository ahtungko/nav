import type { PublishedSnapshot } from "../../src/types/snapshot";

export const PUBLIC_SNAPSHOT_KEY = "public-site:v1";

export async function getPublishedSnapshot(kv: KVNamespace): Promise<PublishedSnapshot | null> {
  return kv.get(PUBLIC_SNAPSHOT_KEY, "json");
}

export async function putPublishedSnapshot(kv: KVNamespace, snapshot: PublishedSnapshot): Promise<void> {
  await kv.put(PUBLIC_SNAPSHOT_KEY, JSON.stringify(snapshot));
}
