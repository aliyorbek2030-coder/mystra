import { createContext, useContext, useState } from 'react';
import { S } from './storage';

const Ctx = createContext(null);

export const useAuth = () => useContext(Ctx);

import { API_URL } from './config';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('mys_token');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers, 
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      data.detail ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => S.get('session'));

  const login = async (username, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem('mys_token', data.token);
      S.set('session', data.user);
      setUser(data.user);

      return null;
    } catch (error) {
      return error.message || 'Login yoki parol noto‘g‘ri.';
    }
  };

  const logout = () => {
    localStorage.removeItem('mys_token');
    localStorage.removeItem('mys_session');
    S.set('session', null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}