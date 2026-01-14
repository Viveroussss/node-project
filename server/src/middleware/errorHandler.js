export function handleDatabaseError(err, res, defaultMessage) {
	console.error('Database error:', err);
	
	if (err.name === 'SequelizeConnectionError' || 
		err.name === 'SequelizeConnectionRefusedError' ||
		err.message?.includes('ECONNREFUSED') ||
		err.original?.code === 'ECONNREFUSED') {
		return res.status(503).json({ 
			error: 'Database not available. Please ensure PostgreSQL is running and the database "articles_db" exists.',
			details: 'See DATABASE_SETUP.md for setup instructions'
		});
	}
	
	if (err.name === 'SequelizeDatabaseError' && 
		(err.message?.includes('relation') && err.message?.includes('does not exist') ||
		 err.message?.includes('table') && err.message?.includes('does not exist'))) {
		return res.status(503).json({ 
			error: 'Database table missing. Please run migrations: cd server && npm run db:migrate',
			details: 'The users table needs to be created. See DATABASE_SETUP.md for instructions'
		});
	}
	
	console.error('Full error details:', {
		name: err.name,
		message: err.message,
		original: err.original?.message
	});
	
	res.status(500).json({ error: defaultMessage, details: err.message });
}


