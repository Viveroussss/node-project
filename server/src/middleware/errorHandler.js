export function handleDatabaseError(err, res, defaultMessage) {
	console.error('Database error:', err);
	if (err.name === 'SequelizeConnectionError' || err.message?.includes('ECONNREFUSED')) {
		return res.status(503).json({ 
			error: 'Database not available. Please ensure PostgreSQL is running and migrations have been executed.',
			details: 'See DATABASE_SETUP.md for setup instructions'
		});
	}
	res.status(500).json({ error: defaultMessage });
}

