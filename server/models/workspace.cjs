'use strict';

module.exports = (sequelize, DataTypes) => {
  const Workspace = sequelize.define('Workspace', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'workspaces',
    timestamps: true
  });

  Workspace.associate = (models) => {
    Workspace.hasMany(models.Article, { foreignKey: 'workspaceId' });
  };

  return Workspace;
};

