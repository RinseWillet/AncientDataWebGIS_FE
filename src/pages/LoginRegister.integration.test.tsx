import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../features/authentication/authSlice';
import LoginRegister from './LoginRegister';
import apiClient from '../api/config';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/config', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('LoginRegister integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('submits login credentials and stores authenticated user', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        token: 'jwt-token',
        roles: ['USER'],
      },
    } as never);

    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginRegister />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'alice', name: 'username' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret', name: 'password' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        username: 'alice',
        password: 'secret',
      });
    });

    await waitFor(() => {
      expect(localStorage.getItem('user')).toContain('jwt-token');
    });
  });
});

