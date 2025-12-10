'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('articles');
    if (!tableDescription.workspaceId) {
      await queryInterface.addColumn('articles', 'workspaceId', {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'workspaces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('articles');
    if (tableDescription.workspaceId) {
      await queryInterface.removeColumn('articles', 'workspaceId');
    }
  }
};

