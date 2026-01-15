import * as authService from '../services/authService.js';
import { handleDatabaseError } from '../middleware/errorHandler.js';

export async function register(req, res) {
	try {
		const { email, password } = req.body ?? {};

		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: 'Password must be at least 6 characters long' });
		}

		const result = await authService.registerUser({ email, password });
		res.status(201).json(result);
	} catch (err) {
		if (err.message === 'User with this email already exists') {
			return res.status(409).json({ error: err.message });
		}
		handleDatabaseError(err, res, 'Failed to register user');
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body ?? {};

		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		const result = await authService.loginUser({ email, password });
		res.json(result);
	} catch (err) {
		if (err.message === 'Invalid email or password') {
			return res.status(401).json({ error: err.message });
		}
		handleDatabaseError(err, res, 'Failed to login');
	}
}

export async function getCurrentUser(req, res) {
	try {
		const user = await authService.getUserById(req.user.userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		const userData = user.toJSON ? user.toJSON() : user;
		if (!userData.role) {
			userData.role = 'user';
		}
		res.json({ user: userData });
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to get user');
	}
}

