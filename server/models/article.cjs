'use strict';

module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    workspaceId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'articles',
    timestamps: true
  });

  Article.associate = (models) => {
    Article.hasMany(models.Attachment, { foreignKey: 'articleId' });
    Article.hasMany(models.Comment, { foreignKey: 'articleId' });
    Article.hasMany(models.ArticleVersion, { foreignKey: 'articleId', onDelete: 'CASCADE' });
    Article.belongsTo(models.Workspace, { foreignKey: 'workspaceId', targetKey: 'id' });
  };

  return Article;
};
