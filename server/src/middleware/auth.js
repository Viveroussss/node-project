import { verifyToken } from '../services/authService.js';

export function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

	if (!token) {
		return res.status(401).json({ error: 'Access token required' });
	}

	try {
		const decoded = verifyToken(token);
		req.user = decoded;
		next();
	} catch (err) {
		return res.status(403).json({ error: 'Invalid or expired token' });
	}
}

