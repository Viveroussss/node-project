'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('articles');
    if (!tableDescription.userId) {
      await queryInterface.addColumn('articles', 'userId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('articles');
    if (tableDescription.userId) {
      await queryInterface.removeColumn('articles', 'userId');
    }
  }
};

