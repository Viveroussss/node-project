'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('articles', 'id', {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('articles', 'id', {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true
    });
  }
};
