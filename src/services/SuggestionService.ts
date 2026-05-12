import apiClient from '../api/config';

export interface SuggestionCreateRequest {
  targetType: 'ROAD' | 'SITE' | 'GENERAL';
  targetId?: number | null;
  summary: string;
  details: string;
  imageUrl?: string | null;
}

export interface SuggestionResponse {
  id: number;
  targetType: 'ROAD' | 'SITE' | 'GENERAL';
  targetId: number | null;
  summary: string;
  details: string;
  imageUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitterUsername: string;
}

const SuggestionService = {
  async submitSuggestion(payload: SuggestionCreateRequest) {
    return await apiClient.post<SuggestionResponse>('/suggestions', payload);
  },
};

export default SuggestionService;

