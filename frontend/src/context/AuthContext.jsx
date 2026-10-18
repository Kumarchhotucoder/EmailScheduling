import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('auth_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token is invalid/expired
          setUser(null);
          setToken(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    }

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { user: loggedInUser, token: authToken } = res.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    const { user: registeredUser, token: authToken } = res.data;
    setUser(registeredUser);
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(registeredUser));
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
