'use strict';

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    articleId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Anonymous'
    }
  }, {
    tableName: 'comments',
    timestamps: true
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.Article, { foreignKey: 'articleId', targetKey: 'id' });
  };

  return Comment;
};

