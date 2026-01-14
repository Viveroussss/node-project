import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Button from '../components/Button/@Button.jsx';
import './Auth.css';

export default function Register() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters long');
			return;
		}

		setLoading(true);

		try {
			await register(email, password);
			navigate('/logic');
		} catch (err) {
			setError(err.message || 'Registration failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1 className="auth-title">Register</h1>
				<form onSubmit={handleSubmit} className="auth-form">
					{error && <div className="error-text">{error}</div>}
					<div className="form-group">
						<label htmlFor="email">Email</label>
						<input
							id="email"
							type="email"
							className="input"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={loading}
						/>
					</div>
					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							className="input"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							disabled={loading}
							minLength={6}
						/>
					</div>
					<div className="form-group">
						<label htmlFor="confirmPassword">Confirm Password</label>
						<input
							id="confirmPassword"
							type="password"
							className="input"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							disabled={loading}
							minLength={6}
						/>
					</div>
					<Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
						{loading ? 'Registering...' : 'Register'}
					</Button>
				</form>
				<div className="auth-footer">
					Already have an account? <Link to="/login">Login</Link>
				</div>
			</div>
		</div>
	);
}

