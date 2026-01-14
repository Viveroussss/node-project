import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (authService.isAuthenticated()) {
			authService.getCurrentUser()
				.then(userData => {
					setUser(userData);
				})
				.catch(() => {
					authService.logout();
					setUser(null);
				})
				.finally(() => {
					setLoading(false);
				});
		} else {
			setLoading(false);
		}
	}, []);

	const login = async (email, password) => {
		const data = await authService.login(email, password);
		setUser(data.user);
		return data;
	};

	const register = async (email, password) => {
		const data = await authService.register(email, password);
		setUser(data.user);
		return data;
	};

	const logout = () => {
		authService.logout();
		setUser(null);
	};

	const value = {
		user,
		loading,
		login,
		register,
		logout,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

