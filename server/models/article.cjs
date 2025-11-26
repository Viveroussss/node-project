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
    }
  }, {
    tableName: 'articles',
    timestamps: true
  });

  Article.associate = (models) => {
    Article.hasMany(models.Attachment, { foreignKey: 'articleId' });
  };

  return Article;
};
