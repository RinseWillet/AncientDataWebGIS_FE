import apiClient from '../api/config';
import type { MediaAsset } from '../types/media';

export interface MediaUploadParams {
  file: File;
  targetType: 'ROAD' | 'SITE';
  targetId: string | number;
  caption?: string;
  author?: string;
  source?: string;
  license?: string;
  dateTaken?: string;
  isCover?: boolean;
}

export interface MediaUpdateParams {
  caption?: string;
  author?: string;
  source?: string;
  license?: string;
  dateTaken?: string;
  isCover?: boolean;
  visibilityStatus?: string;
}

const MediaService = {
  async findByTarget(
    targetType: 'ROAD' | 'SITE',
    targetId: string | number
  ): Promise<MediaAsset[]> {
    const response = await apiClient.get<MediaAsset[]>('/media', {
      params: { targetType, targetId },
    });
    return response.data;
  },

  async findByTargetAdmin(
    targetType: 'ROAD' | 'SITE',
    targetId: string | number
  ): Promise<MediaAsset[]> {
    const response = await apiClient.get<MediaAsset[]>('/media/admin', {
      params: { targetType, targetId },
    });
    return response.data;
  },

  async upload(params: MediaUploadParams): Promise<MediaAsset> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('targetType', params.targetType);
    formData.append('targetId', String(params.targetId));
    if (params.caption) formData.append('caption', params.caption);
    if (params.author) formData.append('author', params.author);
    if (params.source) formData.append('source', params.source);
    if (params.license) formData.append('license', params.license);
    if (params.dateTaken) formData.append('dateTaken', params.dateTaken);
    if (params.isCover) formData.append('isCover', 'true');

    const response = await apiClient.post<MediaAsset>('/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateMetadata(
    id: number,
    params: MediaUpdateParams
  ): Promise<MediaAsset> {
    const searchParams = new URLSearchParams();
    if (params.caption !== undefined) searchParams.append('caption', params.caption);
    if (params.author !== undefined) searchParams.append('author', params.author);
    if (params.source !== undefined) searchParams.append('source', params.source);
    if (params.license !== undefined) searchParams.append('license', params.license);
    if (params.dateTaken !== undefined) searchParams.append('dateTaken', params.dateTaken);
    if (params.isCover !== undefined) searchParams.append('isCover', String(params.isCover));
    if (params.visibilityStatus !== undefined)
      searchParams.append('visibilityStatus', params.visibilityStatus);

    const response = await apiClient.patch<MediaAsset>(
      `/media/${id}?${searchParams.toString()}`
    );
    return response.data;
  },

  async deleteMedia(id: number): Promise<void> {
    await apiClient.delete(`/media/${id}`);
  },
};

export default MediaService;
