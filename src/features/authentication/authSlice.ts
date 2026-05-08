import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import authService, {
  type AuthCredentials,
  type RegisterPayload,
} from '../../services/authService';
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
  type StoredUser,
} from './authStorage';

interface AuthState {
  user: StoredUser | null;
  loading: boolean;
  error: string | null;
}

interface ApiErrorWithMessage {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as ApiErrorWithMessage)?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const storedUser = getStoredUser();

export const loginUser = createAsyncThunk<StoredUser, AuthCredentials, { rejectValue: string }>(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      const response = await authService.login(userData);
      const user = response.data;
      setStoredUser(user);
      return user;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, 'Login failed'));
    }
  }
);

export const registerUser = createAsyncThunk<unknown, RegisterPayload, { rejectValue: string }>(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, 'Registration failed'));
    }
  }
);

const initialState: AuthState = {
  user: storedUser || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      clearStoredUser();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

