'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attachments')",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (!tableExists[0].exists) {
      await queryInterface.createTable('attachments', {
        id: {
          type: Sequelize.STRING,
          allowNull: false,
          primaryKey: true
        },
        articleId: {
          type: Sequelize.STRING,
          allowNull: false
        },
        filename: {
          type: Sequelize.STRING,
          allowNull: false
        },
        originalName: {
          type: Sequelize.STRING,
          allowNull: true
        },
        mimetype: {
          type: Sequelize.STRING,
          allowNull: true
        },
        size: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        path: {
          type: Sequelize.STRING,
          allowNull: false
        },
        uploadedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW')
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW')
        }
      });

      const indexExists = await queryInterface.sequelize.query(
        "SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'attachments_article_id')",
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (!indexExists[0].exists) {
        await queryInterface.addIndex('attachments', ['articleId']);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attachments');
  }
};
