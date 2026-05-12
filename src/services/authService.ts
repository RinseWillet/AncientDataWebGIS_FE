import type { AxiosResponse } from 'axios';
import apiClient from '../api/config';
import type { StoredUser } from '../features/authentication/authStorage';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

type AuthServiceContract = {
  login: (credentials: AuthCredentials) => Promise<AxiosResponse<StoredUser>>;
  register: (userData: RegisterPayload) => Promise<AxiosResponse<unknown>>;
};

const AuthService: AuthServiceContract = {
  async login(credentials) {
    console.log('logging in');
    return await apiClient.post<StoredUser>('/auth/login', credentials);
  },

  async register(userData) {
    console.log('registering');
    return await apiClient.post('/auth/register', userData);
  },
};

export default AuthService;

