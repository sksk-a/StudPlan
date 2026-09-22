import { createContext, useContext, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const logout = () => {
    sessionStorage.removeItem('planner-token');
    setUser(null);
    setError('');
  };
  async function restore() {
    setLoading(true);
    setError('');
    try {
      if (sessionStorage.getItem('planner-token')) setUser((await api.get('/auth/me')).data);
    } catch (e) {
      if (e.response?.status !== 401) setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    restore();
    window.addEventListener('planner-unauthorized', logout);
    return () => window.removeEventListener('planner-unauthorized', logout);
  }, []);
  async function authenticate(mode, form) {
    const { data } = await api.post(`/auth/${mode}`, form);
    sessionStorage.setItem('planner-token', data.token);
    setUser(data.user);
    setError('');
  }
  return (
    <AuthContext.Provider value={{ user, loading, error, restore, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
