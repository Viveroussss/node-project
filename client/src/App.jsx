import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Logic from './pages/Logic.jsx';
import UserManagement from './pages/UserManagement.jsx';

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route
						path="/logic"
						element={
							<ProtectedRoute>
								<Logic />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/users"
						element={
							<AdminRoute>
								<UserManagement />
							</AdminRoute>
						}
					/>
					<Route path="/" element={<Navigate to="/logic" replace />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
