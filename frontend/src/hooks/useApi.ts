import { useState, useCallback } from 'react';

const API_URL = 'http://localhost:3003/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  });

  const request = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...getHeaders(), ...options.headers },
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = (endpoint: string) => request(endpoint);
  const post = (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  const patch = (endpoint: string, body?: any) => request(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  const del = (endpoint: string) => request(endpoint, { method: 'DELETE' });

  return { get, post, patch, del, loading, error };
}
