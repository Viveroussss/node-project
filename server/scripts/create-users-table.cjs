const path = require('path');
const db = require(path.join(__dirname, '..', 'models', 'index.cjs'));

async function createUsersTable() {
  try {
    const { sequelize } = db;
    await sequelize.authenticate();
    console.log('Database connection established');

    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (results[0].exists) {
      console.log('Users table already exists');
      process.exit(0);
    }

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Users table created successfully');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating users table:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createUsersTable();

