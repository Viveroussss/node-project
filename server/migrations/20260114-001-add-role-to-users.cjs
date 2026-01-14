'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    if (!tableDescription.role) {
      // Create ENUM type if it doesn't exist
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_users_role" AS ENUM ('admin', 'user');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      await queryInterface.addColumn('users', 'role', {
        type: Sequelize.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user'
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.role) {
      await queryInterface.removeColumn('users', 'role');
      // Drop ENUM type
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    }
  }
};

