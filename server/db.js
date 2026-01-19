const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "data.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    quantity1 TEXT,
    item1 TEXT,
    description1 TEXT,
    quantity2 TEXT,
    item2 TEXT,
    description2 TEXT,
    ingameUser TEXT,
    discordUser TEXT,
    createdAt TEXT NOT NULL,
    creatorId TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_trades_createdAt ON trades(createdAt DESC);
`);

const cols = db
  .prepare("PRAGMA table_info(trades)")
  .all()
  .map((c) => c.name);
if (!cols.includes("description1")) {
  db.exec("ALTER TABLE trades ADD COLUMN description1 TEXT");
}
if (!cols.includes("description2")) {
  db.exec("ALTER TABLE trades ADD COLUMN description2 TEXT");
}

const insertTradeStmt = db.prepare(`
  INSERT INTO trades (
    id, type, quantity1, item1, description1, quantity2, item2, description2, ingameUser, discordUser, createdAt, creatorId
  ) VALUES (
    @id, @type, @quantity1, @item1, @description1, @quantity2, @item2, @description2, @ingameUser, @discordUser, @createdAt, @creatorId
  )
`);

const getAllTradesStmt = db.prepare(`
  SELECT * FROM trades ORDER BY createdAt DESC
`);

const getTradeByIdStmt = db.prepare(`
  SELECT * FROM trades WHERE id = ?
`);

const deleteTradeByIdStmt = db.prepare(`
  DELETE FROM trades WHERE id = ?
`);

function getTrades() {
  return getAllTradesStmt.all();
}

function getTradeById(id) {
  return getTradeByIdStmt.get(id);
}

function createTrade(trade) {
  insertTradeStmt.run(trade);
  return trade;
}

function deleteTrade(id) {
  return deleteTradeByIdStmt.run(id);
}

module.exports = {
  getTrades,
  getTradeById,
  createTrade,
  deleteTrade,
};
