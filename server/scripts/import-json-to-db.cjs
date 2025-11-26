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

  const attachmentsRoot = path.join(__dirname, '..', '..', 'attachments_storage');
  if (!fs.existsSync(attachmentsRoot)) fs.mkdirSync(attachmentsRoot, { recursive: true });

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const obj = JSON.parse(raw);
      const existing = await Article.findByPk(obj.id);
      if (existing) {
        console.log(`Skipping ${obj.id} - already in DB`);
      } else {
        await Article.create({ id: obj.id, title: obj.title, content: obj.content, createdAt: obj.createdAt, updatedAt: obj.updatedAt || obj.createdAt });
        console.log(`Imported ${obj.id}`);
      }

      if (Array.isArray(obj.attachments) && obj.attachments.length > 0) {
        for (const att of obj.attachments) {
          try {
            const src = path.join(__dirname, '..', 'attachments', att.filename);
            const dest = path.join(attachmentsRoot, att.filename);
            if (fs.existsSync(src)) {
              fs.renameSync(src, dest);
            } else if (!fs.existsSync(dest)) {
              console.warn(`Attachment file not found for ${att.filename}, skipping move.`);
            }

            const attachmentsModel = require(path.join(__dirname, '..', 'models', 'index.cjs')).Attachment;
            await attachmentsModel.create({
              id: att.id,
              articleId: obj.id,
              filename: att.filename,
              originalName: att.originalName,
              mimetype: att.mimetype,
              size: att.size,
              path: `attachments_storage/${att.filename}`,
              uploadedAt: att.uploadedAt || new Date().toISOString()
            });
            console.log(`Imported attachment ${att.id} for ${obj.id}`);
          } catch (err) {
            console.error('Failed to import attachment', att && att.filename, err.message);
          }
        }
      }
    } catch (err) {
      console.error('Failed to import', file, err.message);
    }
  }
  console.log('Import finished');
  process.exit(0);
}

importAll();
