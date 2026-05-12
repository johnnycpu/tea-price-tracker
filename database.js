const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

// 確定資料庫路徑
let dbPath;

if (process.env.NODE_ENV === 'production' || process.env.WEBSITE_INSTANCE_ID) {
  // Azure App Service 環境 - 使用系統臨時目錄
  const tempDir = os.tmpdir();
  const appDir = path.join(tempDir, 'tea-price-tracker');
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  dbPath = path.join(appDir, 'prices.db');
  console.log(`☁️ Azure 環境 - 資料庫位置: ${dbPath}`);
} else {
  // 本地開發環境
  const dbDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'prices.db');
  console.log(`💻 本地環境 - 資料庫位置: ${dbPath}`);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 資料庫連接失敗:', err);
  } else {
    console.log('✅ 資料庫連接成功');
  }
});

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
