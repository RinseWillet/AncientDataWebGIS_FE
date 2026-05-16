import axios from 'axios';
import { DashboardSummary } from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const DASHBOARD_ENDPOINT = '/api/dashboard/summary';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const response = await axios.get<DashboardSummary>(
        `${API_BASE_URL}${DASHBOARD_ENDPOINT}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

