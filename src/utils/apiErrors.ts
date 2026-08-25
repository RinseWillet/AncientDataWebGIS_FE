interface ApiErrorWithMessage {
  response?: { data?: { message?: string } };
  message?: string;
}

/** Prefers the backend's error message, falls back to the client-side error message, then to `fallback`. */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  const e = error as ApiErrorWithMessage;
  return e?.response?.data?.message || e?.message || fallback;
};
