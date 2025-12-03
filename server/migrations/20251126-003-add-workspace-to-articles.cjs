'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('articles', 'workspaceId');
  }
};

