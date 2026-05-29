import apiClient from '../api/config';
import type { MediaAsset } from '../types/media';

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
};

export default MediaService;
