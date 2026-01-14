import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export async function registerUser({ email, password }) {
	const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
	if (existingUser) {
		throw new Error('User with this email already exists');
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = await User.create({
		email: email.toLowerCase().trim(),
		password: hashedPassword
	});

	const token = jwt.sign(
		{ userId: user.id, email: user.email },
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN }
	);

	return { user: { id: user.id, email: user.email }, token };
}

export async function loginUser({ email, password }) {
	const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
	if (!user) {
		throw new Error('Invalid email or password');
	}

	const isValidPassword = await bcrypt.compare(password, user.password);
	if (!isValidPassword) {
		throw new Error('Invalid email or password');
	}

	const token = jwt.sign(
		{ userId: user.id, email: user.email },
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN }
	);

	return { user: { id: user.id, email: user.email }, token };
}

export function verifyToken(token) {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (err) {
		throw new Error('Invalid or expired token');
	}
}

export async function getUserById(userId) {
	return User.findByPk(userId, {
		attributes: ['id', 'email', 'createdAt', 'updatedAt']
	});
}

