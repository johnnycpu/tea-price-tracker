const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'prices.db');
const db = new sqlite3.Database(dbPath);

// 初始化資料庫
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      productName TEXT NOT NULL,
      price REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// 新增價格
function addPrice(date, productName, price, callback) {
  db.run(
    `INSERT INTO prices (date, productName, price) VALUES (?, ?, ?)`,
    [date, productName, price],
    function(err) {
      if (err) return callback(err);
      callback(null, this.lastID);
    }
  );
}

// 取得所有價格
function getAllPrices(callback) {
  db.all(
    `SELECT * FROM prices ORDER BY date DESC, createdAt DESC`,
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows || []);
    }
  );
}

// 依日期搜尋
function searchByDate(date, callback) {
  db.all(
    `SELECT * FROM prices WHERE date = ? ORDER BY createdAt DESC`,
    [date],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows || []);
    }
  );
}

// 刪除記錄
function deletePrice(id, callback) {
  db.run(
    `DELETE FROM prices WHERE id = ?`,
    [id],
    (err) => {
      if (err) return callback(err);
      callback(null);
    }
  );
}

// 統計資訊
function getStatistics(callback) {
  db.all(
    `
    SELECT 
      COUNT(*) as totalRecords,
      MIN(price) as minPrice,
      MAX(price) as maxPrice,
      AVG(price) as avgPrice,
      COUNT(DISTINCT date) as distinctDates
    FROM prices
    `,
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || {});
    }
  );
}

module.exports = {
  addPrice,
  getAllPrices,
  searchByDate,
  deletePrice,
  getStatistics
};
