export const selectAuthState = (state) => state.auth;

export const selectAuthUser = (state) => selectAuthState(state).user;

export const selectIsAdmin = (state) => {
  const roles = selectAuthUser(state)?.roles;

  if (!Array.isArray(roles)) {
    return false;
  }

  return roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');
};

