'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on app start
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                // Store tokens
                localStorage.setItem('access_token', data.session.access_token);
                localStorage.setItem('refresh_token', data.session.refresh_token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const register = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                // Store tokens if session is provided
                if (data.session) {
                    localStorage.setItem('access_token', data.session.access_token);
                    localStorage.setItem('refresh_token', data.session.refresh_token);
                    setUser(data.user);
                }
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                    credentials: 'include',
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
        }
    };

    const refreshUser = async () => {
        await checkAuth();
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}