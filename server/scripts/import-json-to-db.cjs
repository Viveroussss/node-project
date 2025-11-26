'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const models = require(path.join(__dirname, '..', 'models', 'index.cjs'));
const { Article, sequelize } = models;

async function importAll() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('No data directory found, nothing to import.');
    return;
  }
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} files to import`);
  try {
    await sequelize.authenticate();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const obj = JSON.parse(raw);
      const existing = await Article.findByPk(obj.id);
      if (existing) {
        console.log(`Skipping ${obj.id} - already in DB`);
        continue;
      }
      await Article.create({ id: obj.id, title: obj.title, content: obj.content, createdAt: obj.createdAt, updatedAt: obj.updatedAt || obj.createdAt });
      console.log(`Imported ${obj.id}`);
    } catch (err) {
      console.error('Failed to import', file, err.message);
    }
  }
  console.log('Import finished');
  process.exit(0);
}

importAll();
