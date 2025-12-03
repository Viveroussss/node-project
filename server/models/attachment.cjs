'use strict';

module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define('Attachment', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    articleId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: true
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'attachments',
    timestamps: true
  });

  Attachment.associate = (models) => {
    Attachment.belongsTo(models.Article, { foreignKey: 'articleId', targetKey: 'id' });
  };

  return Attachment;
};
