const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3001');

const TOKEN_KEY = 'auth_token';

export const authService = {
	getToken() {
		return localStorage.getItem(TOKEN_KEY);
	},

	setToken(token) {
		localStorage.setItem(TOKEN_KEY, token);
	},

	removeToken() {
		localStorage.removeItem(TOKEN_KEY);
	},

	isAuthenticated() {
		return !!this.getToken();
	},

	async register(email, password) {
		const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Registration failed' }));
			throw new Error(error.error || 'Registration failed');
		}

		const data = await response.json();
		this.setToken(data.token);
		return data;
	},

	async login(email, password) {
		const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Login failed' }));
			throw new Error(error.error || 'Login failed');
		}

		const data = await response.json();
		this.setToken(data.token);
		return data;
	},

	logout() {
		this.removeToken();
	},

	async getCurrentUser() {
		const token = this.getToken();
		if (!token) {
			throw new Error('Not authenticated');
		}

		const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				this.removeToken();
				throw new Error('Session expired');
			}
			throw new Error('Failed to get user');
		}

		const data = await response.json();
		return data.user;
	},

	getAuthHeader() {
		const token = this.getToken();
		return token ? { 'Authorization': `Bearer ${token}` } : {};
	},
};

