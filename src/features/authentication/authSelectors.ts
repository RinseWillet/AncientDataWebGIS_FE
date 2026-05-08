import type { StoredUser } from './authStorage';

interface AuthState {
  user: StoredUser | null;
  loading?: boolean;
  error?: unknown;
}

interface RootState {
  auth: AuthState;
}

export const selectAuthState = (state: RootState): AuthState => state.auth;

export const selectAuthUser = (state: RootState): StoredUser | null => selectAuthState(state).user;

export const selectIsAdmin = (state: RootState): boolean => {
  const roles = selectAuthUser(state)?.roles;

  if (!Array.isArray(roles)) {
    return false;
  }

  return roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');
};

