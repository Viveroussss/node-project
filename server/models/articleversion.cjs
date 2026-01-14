'use strict';

module.exports = (sequelize, DataTypes) => {
  const ArticleVersion = sequelize.define('ArticleVersion', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    articleId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'article_versions',
    timestamps: true
  });

  ArticleVersion.associate = (models) => {
    ArticleVersion.belongsTo(models.Article, { foreignKey: 'articleId', targetKey: 'id', onDelete: 'CASCADE' });
  };

  return ArticleVersion;
};


