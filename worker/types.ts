import type { PublishedSnapshot } from "../src/types/snapshot";

export type Env = {
  DB: D1Database;
  PUBLIC_SNAPSHOT: KVNamespace;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon_key: string;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type WebsiteRow = {
  id: string;
  title: string;
  url: string;
  favicon_url: string | null;
  category_id: string;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type CategoryInput = {
  id: string;
  name: string;
  slug: string;
  icon_key: string;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type WebsiteInput = {
  id: string;
  title: string;
  url: string;
  favicon_url: string | null;
  category_id: string;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type PublishedSnapshotRecord = {
  key: "public-site:v1";
  snapshot: PublishedSnapshot;
};
