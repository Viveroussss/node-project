const { nanoid } = require('nanoid');
const db = require('../models/index.cjs');
const { Workspace } = db;

async function seedWorkspaces() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    const defaultWorkspaces = [
      { id: nanoid(12), name: 'Personal', description: 'Personal articles and notes' },
      { id: nanoid(12), name: 'Work', description: 'Work-related articles' },
      { id: nanoid(12), name: 'Projects', description: 'Project documentation' }
    ];

    for (const ws of defaultWorkspaces) {
      const [workspace, created] = await Workspace.findOrCreate({
        where: { name: ws.name },
        defaults: ws
      });
      if (created) {
        console.log(`Created workspace: ${workspace.name}`);
      } else {
        console.log(`Workspace already exists: ${workspace.name}`);
      }
    }

    console.log('Workspace seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding workspaces:', error);
    process.exit(1);
  }
}

seedWorkspaces();




