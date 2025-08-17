import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./orderhub.sqlite');

if (process.argv.includes('--init')) {
  const schema = fs.readFileSync('./schema.sql', 'utf8');
  db.exec(schema);
  console.log('DB initialized.');
  process.exit(0);
}

export default db;
