export type Website = {
  id: string;
  title: string;
  url: string;
  faviconUrl?: string | null;
  categoryId: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};
