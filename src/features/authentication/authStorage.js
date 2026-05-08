const USER_STORAGE_KEY = 'user';

const parseStoredUser = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

export const getStoredUser = () => parseStoredUser(localStorage.getItem(USER_STORAGE_KEY));

export const setStoredUser = (user) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getAuthToken = () => {
  return getStoredUser()?.token ?? null;
};

