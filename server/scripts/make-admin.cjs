const path = require('path');
const db = require(path.join(__dirname, '..', 'models', 'index.cjs'));

async function makeAdmin() {
  try {
    const { sequelize, User } = db;
    await sequelize.authenticate();
    console.log('Database connection established');

    const email = process.argv[2];

    if (!email) {
      console.log('\nUsage: node scripts/make-admin.cjs <email>');
      console.log('\nExample: node scripts/make-admin.cjs user@example.com\n');
      
      const users = await User.findAll({
        attributes: ['id', 'email', 'role'],
        order: [['createdAt', 'ASC']]
      });
      
      if (users.length === 0) {
        console.log('No users found in database.');
        console.log('Please register a user first through the application.');
      } else {
        console.log('\nExisting users:');
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (${user.role})`);
        });
        console.log('\nTo make a user admin, run:');
        console.log(`  node scripts/make-admin.cjs <email>`);
      }
      
      await sequelize.close();
      process.exit(0);
    }

    const user = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (!user) {
      console.error(`\nError: User with email "${email}" not found.`);
      console.log('\nAvailable users:');
      const allUsers = await User.findAll({
        attributes: ['email', 'role'],
        order: [['createdAt', 'ASC']]
      });
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
      await sequelize.close();
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`\nUser "${user.email}" is already an admin.`);
      await sequelize.close();
      process.exit(0);
    }

    await user.update({ role: 'admin' });
    console.log(`\n✓ Successfully made "${user.email}" an admin.`);
    console.log('\nThe user can now:');
    console.log('  - Access the User Management page');
    console.log('  - Edit any article');
    console.log('  - Manage user roles');
    console.log('\nNote: The user may need to log out and log back in for changes to take effect.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    console.error(error);
    process.exit(1);
  }
}

makeAdmin();

