import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api';
import type { User } from '@lurelog/shared';
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: unknown;
  refresh: () => Promise<unknown>;
}>({ user: null, loading: true, error: null, refresh: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        return await api.me();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
    staleTime: 60000,
  });
  return (
    <AuthContext.Provider
      value={{
        user: query.data ?? null,
        loading: query.isLoading,
        error: query.error,
        refresh: () => client.invalidateQueries({ queryKey: ['session'] }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
