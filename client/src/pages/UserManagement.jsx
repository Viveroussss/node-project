import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService.js';
import Button from '../components/Button/@Button.jsx';
import './UserManagement.css';

export default function UserManagement() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [updating, setUpdating] = useState({});
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!user) return;
		
		if (user.role !== 'admin') {
			navigate('/logic');
			return;
		}

		loadUsers();
	}, [user, navigate]);

	async function loadUsers() {
		setLoading(true);
		setError('');
		try {
			const usersList = await userService.getAllUsers();
			setUsers(usersList);
		} catch (err) {
			setError(err.message || 'Failed to load users');
			if (err.message === 'Access denied') {
				logout();
				navigate('/login');
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleRoleChange(userId, newRole) {
		if (!confirm(`Change user role to ${newRole}?`)) return;

		setUpdating(prev => ({ ...prev, [userId]: true }));
		try {
			const updatedUser = await userService.updateUserRole(userId, newRole);
			setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
		} catch (err) {
			alert(err.message || 'Failed to update user role');
			if (err.message === 'Access denied') {
				logout();
				navigate('/login');
			}
		} finally {
			setUpdating(prev => ({ ...prev, [userId]: false }));
		}
	}

	if (!user || user.role !== 'admin') {
		return null;
	}

	return (
		<div className="user-management">
			<div className="user-management-header">
				<h1>User Management</h1>
				<Button onClick={() => navigate('/logic')}>Back to Articles</Button>
			</div>

			{loading ? (
				<div className="loading">Loading users...</div>
			) : error ? (
				<div className="error">{error}</div>
			) : (
				<div className="users-table-container">
					<table className="users-table">
						<thead>
							<tr>
								<th>Email</th>
								<th>Role</th>
								<th>Created</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{users.map(u => (
								<tr key={u.id}>
									<td>{u.email}</td>
									<td>
										<span className={`role-badge role-${u.role}`}>
											{u.role}
										</span>
									</td>
									<td>{new Date(u.createdAt).toLocaleDateString()}</td>
									<td>
										{u.role === 'admin' ? (
											<Button
												onClick={() => handleRoleChange(u.id, 'user')}
												disabled={updating[u.id]}
												variant="compact"
											>
												{updating[u.id] ? 'Updating...' : 'Make User'}
											</Button>
										) : (
											<Button
												onClick={() => handleRoleChange(u.id, 'admin')}
												disabled={updating[u.id]}
												variant="compact"
											>
												{updating[u.id] ? 'Updating...' : 'Make Admin'}
											</Button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

