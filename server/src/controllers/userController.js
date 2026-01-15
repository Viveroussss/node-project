import { User } from '../config/database.js';
import { handleDatabaseError } from '../middleware/errorHandler.js';

export async function getAllUsers(req, res) {
	try {
		const users = await User.findAll({
			attributes: ['id', 'email', 'role', 'createdAt', 'updatedAt'],
			order: [['createdAt', 'DESC']]
		});
		res.json({ users });
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to get users');
	}
}

export async function updateUserRole(req, res) {
	try {
		const { userId } = req.params;
		const { role } = req.body ?? {};

		if (!role || !['admin', 'user'].includes(role)) {
			return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user"' });
		}

		const user = await User.findByPk(userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		await user.update({ role });

		const updatedUser = await User.findByPk(userId, {
			attributes: ['id', 'email', 'role', 'createdAt', 'updatedAt']
		});

		res.json({ user: updatedUser });
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to update user role');
	}
}

