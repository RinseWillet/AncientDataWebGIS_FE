import type { StoredUser } from './authStorage';

import type { RootState } from '../../app/store';

type AuthState = RootState['auth'];

export const selectAuthState = (state: RootState): AuthState => state.auth;

export const selectAuthUser = (state: RootState): StoredUser | null => selectAuthState(state).user;

export const selectIsAdmin = (state: RootState): boolean => {
  const roles = selectAuthUser(state)?.roles;

  if (!Array.isArray(roles)) {
    return false;
  }

  return roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');
};

