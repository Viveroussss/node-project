import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Button from '../components/Button/@Button.jsx';
import './Auth.css';

export default function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await login(email, password);
			navigate('/logic');
		} catch (err) {
			setError(err.message || 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1 className="auth-title">Login</h1>
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
					<Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
						{loading ? 'Logging in...' : 'Login'}
					</Button>
				</form>
				<div className="auth-footer">
					Don't have an account? <Link to="/register">Register</Link>
				</div>
			</div>
		</div>
	);
}

