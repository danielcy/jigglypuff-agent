import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'jigglypuff.db');
export const db = new Database(dbPath);

export function initDatabase() {
  const createTables = [
    `CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      breed TEXT,
      age REAL,
      description TEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS llm_configs (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key TEXT NOT NULL,
      model_name TEXT NOT NULL,
      max_tokens INTEGER,
      is_default BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      media_type TEXT NOT NULL,
      url TEXT NOT NULL,
      cover_url TEXT,
      tags TEXT,
      source_platform TEXT,
      source_original_url TEXT,
      source_author TEXT,
      local_path TEXT,
      file_size INTEGER,
      description TEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS trending_videos (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover_url TEXT,
      video_url TEXT,
      views INTEGER,
      likes INTEGER,
      publish_time DATETIME,
      tags TEXT,
      description TEXT,
      added_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS hot_topics (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      description TEXT,
      related_videos INTEGER,
      trend TEXT,
      tags TEXT,
      summarized_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS creations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      pet_ids TEXT,
      material_ids TEXT,
      status TEXT NOT NULL,
      current_stage TEXT,
      content TEXT,
      plan JSON,
      chat_history JSON,
      analysis_result JSON,
      script JSON,
      shots JSON,
      products JSON,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS creation_tools (
      id TEXT PRIMARY KEY,
      tool_name TEXT NOT NULL UNIQUE,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      config JSON,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS mcp_configs (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      deploy_type TEXT NOT NULL,
      server_url TEXT NOT NULL,
      cookie TEXT,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      item_id TEXT NOT NULL,
      original_url TEXT NOT NULL,
      status TEXT NOT NULL,
      local_path TEXT,
      url TEXT,
      download_attempts INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS material_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS library_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      metadata TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER NOT NULL,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES material_categories(id)
    );`,

    `CREATE TABLE IF NOT EXISTS creation_products (
      id TEXT PRIMARY KEY,
      creation_id TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      prompt TEXT NOT NULL,
      generated_at DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creation_id) REFERENCES creations(id)
    );`
  ];

  createTables.forEach(sql => {
    db.exec(sql);
  });

  try {
    db.exec('ALTER TABLE creations ADD COLUMN chat_history JSON');
  } catch (e) {
  }

  try {
    db.exec('ALTER TABLE creations ADD COLUMN analysis_result JSON');
  } catch (e) {
  }

  try {
    db.exec('ALTER TABLE creations ADD COLUMN script JSON');
  } catch (e) {
  }

  try {
    db.exec('ALTER TABLE creations ADD COLUMN shots JSON');
  } catch (e) {
  }

  try {
    db.exec('ALTER TABLE creations ADD COLUMN products JSON');
  } catch (e) {
  }

  try {
    db.exec('ALTER TABLE pets ADD COLUMN portrait TEXT');
  } catch (e) {
  }

  console.log('Database initialized successfully');
}

export function closeDatabase() {
  db.close();
}
