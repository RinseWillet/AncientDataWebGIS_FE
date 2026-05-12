import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { registerUser } from './authSlice';
import authService from '../../services/authService';

vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('authSlice register contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('adds USER role when register payload omits role', async () => {
    vi.mocked(authService.register).mockResolvedValue({ data: {} } as never);

    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    await store.dispatch(registerUser({ username: 'alice', password: 'secret' }));

    expect(authService.register).toHaveBeenCalledWith({
      username: 'alice',
      password: 'secret',
      role: 'USER',
    });
  });
});

