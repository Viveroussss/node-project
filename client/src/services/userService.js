const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3001');
import { authService } from './authService.js';

export const userService = {
	async getAllUsers() {
		const response = await fetch(`${API_BASE_URL}/api/users`, {
			headers: {
				'Authorization': `Bearer ${authService.getToken()}`,
			},
		});

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				authService.removeToken();
				throw new Error('Access denied');
			}
			const error = await response.json().catch(() => ({ error: 'Failed to get users' }));
			throw new Error(error.error || 'Failed to get users');
		}

		const data = await response.json();
		return data.users;
	},

	async updateUserRole(userId, role) {
		const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${authService.getToken()}`,
			},
			body: JSON.stringify({ role }),
		});

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				authService.removeToken();
				throw new Error('Access denied');
			}
			const error = await response.json().catch(() => ({ error: 'Failed to update user role' }));
			throw new Error(error.error || 'Failed to update user role');
		}

		const data = await response.json();
		return data.user;
	},
};

