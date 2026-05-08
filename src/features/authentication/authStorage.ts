const USER_STORAGE_KEY = 'user';

export interface StoredUser {
  token?: string | null;
  roles?: unknown;
  username?: string;
  [key: string]: unknown;
}

const parseStoredUser = (rawValue: string | null): StoredUser | null => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredUser;
  } catch {
    return null;
  }
};

export const getStoredUser = (): StoredUser | null => parseStoredUser(localStorage.getItem(USER_STORAGE_KEY));

export const setStoredUser = (user: StoredUser): void => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredUser = (): void => {
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getAuthToken = (): string | null => {
  return getStoredUser()?.token ?? null;
};


