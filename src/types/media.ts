export interface MediaAsset {
  id: number;
  targetType: 'ROAD' | 'SITE';
  targetId: number;
  fullUrl: string;
  caption: string | null;
  author: string | null;
  source: string | null;
  license: string | null;
  dateTaken: string | null;
  isCover: boolean;
  visibilityStatus: string;
  createdAt: string;
  updatedAt: string;
}

