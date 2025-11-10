import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 > Date.now()) {
                        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                        const res = await api.get('/auth/me');
                        setUser(res.data);
                    } else {
                        logout();
                    }
                } catch (e) {
                    logout();
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, [token]); // Runs on initial load and whenever the token changes

    const login = async (newToken) => {
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            setToken(newToken);
        } catch (error) {
            console.error("Failed to fetch user on login", error);
            logout(); // Clear out if it fails
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, token }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
