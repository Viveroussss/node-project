import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export default function AdminRoute({ children }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<div>Loading...</div>
			</div>
		);
	}

	if (!user || user.role !== 'admin') {
		return <Navigate to="/logic" replace />;
	}

	return <ProtectedRoute>{children}</ProtectedRoute>;
}

