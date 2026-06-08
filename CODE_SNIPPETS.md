# 🍵 清心福全珍珠奶茶 CPI 價格追蹤系統 - 關鍵程式碼片段

---

## 📱 **前端程式碼 (Frontend - script.js)**

### 片段 1：表單提交 & API 呼叫

```javascript
// 使用相對 URL，適用於本地和雲端環境
const API_BASE = window.location.origin;

// 表單提交
document.getElementById('priceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const productName = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('price').value);

    try {
        const response = await fetch(`${API_BASE}/api/prices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date, productName, price })
        });

        if (response.ok) {
            alert('✅ 記錄已新增！');
            document.getElementById('priceForm').reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').value = today;
            loadAllPrices();        // 重新載入列表
            loadStatistics();       // 更新統計資料
        } else {
            alert('❌ 新增失敗');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ 無法連接伺服器');
    }
});
```

**📌 說明：**
- 使用 `window.location.origin` 動態取得當前域名，支援本地（`http://localhost:3000`）和雲端（Azure URL）
- `fetch()` 發送 POST 請求到後端 `/api/prices` endpoint
- 表單驗證：確保日期、商品名稱、價格都已填寫
- 成功後重新整理列表和統計資料

---

### 片段 2：動態載入資料 & 表格渲染

```javascript
// 載入所有價格
async function loadAllPrices() {
    try {
        const response = await fetch(`${API_BASE}/api/prices`);
        const prices = await response.json();

        const tableBody = document.getElementById('priceTableBody');
        
        if (prices.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="empty-message">暫無記錄，請新增</td></tr>';
            return;
        }

        tableBody.innerHTML = prices.map(price => `
            <tr>
                <td>${formatDate(price.date)}</td>
                <td>${price.productName}</td>
                <td>NT$ ${price.price.toFixed(2)}</td>
                <td>
                    <button class="btn btn-delete" onclick="deletePrice(${price.id})">刪除</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}
```

**📌 說明：**
- 異步 GET 請求取得所有價格資料
- 使用 `.map()` 和模板字串動態生成表格列 (TR)
- 每列包含：日期、商品名、價格、刪除按鈕
- 空資料時顯示提示訊息

---

## 🖥️ **後端程式碼 (Backend - app.js)**

### 片段 3：Express 伺服器設定 & 中介軟體

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware 設定
app.use(cors());                           // 啟用跨域請求
app.use(bodyParser.json());                // 解析 JSON 請求體

// 靜態檔案 - 使用絕對路徑確保在 Azure 環境中正常運作
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

console.log(`📁 靜態檔案位置: ${publicPath}`);

// 主頁
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

**📌 說明：**
- `cors()` 允許前端跨域呼叫 API
- `bodyParser.json()` 自動解析 JSON 請求
- `express.static()` 提供 HTML/CSS/JS 等靜態檔案
- 使用 `path.join(__dirname, 'public')` 確保相對路徑正確

---

### 片段 4：新增價格 API Endpoint

```javascript
// API: 新增價格記錄
app.post('/api/prices', (req, res) => {
  const { date, productName, price } = req.body;
  
  if (!date || !productName || price === undefined) {
    return res.status(400).json({ error: '缺少必要欄位' });
  }

  db.addPrice(date, productName, price, (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, date, productName, price });
  });
});
```

**📌 說明：**
- POST endpoint：接收前端表單資料
- 參數驗證：檢查必要欄位是否存在
- 調用 `db.addPrice()` 儲存到資料庫
- 成功返回 `201 Created` 和新增的記錄 ID

---

### 片段 5：搜尋與刪除 API

```javascript
// API: 依日期搜尋
app.get('/api/prices/search', (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: '缺少日期參數' });
  }

  db.searchByDate(date, (err, prices) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(prices);
  });
});

// API: 刪除記錄
app.delete('/api/prices/:id', (req, res) => {
  const { id } = req.params;
  
  db.deletePrice(id, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});
```

**📌 說明：**
- GET `/api/prices/search?date=YYYY-MM-DD`：查詢特定日期的記錄
- DELETE `/api/prices/:id`：刪除指定 ID 的記錄
- RESTful 設計：使用 HTTP 方法表達操作意圖

---

## 💾 **資料庫操作 (Database - database.js)**

### 片段 6：資料庫初始化 & 環境配置

```javascript
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
```

**📌 說明：**
- **環境偵測**：檢查 `process.env.WEBSITE_INSTANCE_ID` 判斷是否在 Azure 環境
- **本地路徑**：`data/prices.db`（易於版本控制）
- **Azure 路徑**：`/tmp/tea-price-tracker/prices.db`（暫時存儲區，避免檔案系統限制）
- **表格結構**：
  - `id`：主鍵，自動遞增
  - `date`：記錄日期 (YYYY-MM-DD)
  - `productName`：商品名稱
  - `price`：價格（浮點數）
  - `createdAt`：建立時間戳記

---

### 片段 7：CRUD 操作

```javascript
// 新增價格
function addPrice(date, productName, price, callback) {
  db.run(
    `INSERT INTO prices (date, productName, price) VALUES (?, ?, ?)`,
    [date, productName, price],
    function(err) {
      if (err) return callback(err);
      callback(null, this.lastID);  // 返回新增記錄的 ID
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
```

**📌 說明：**
- **參數化查詢**：使用 `?` 佔位符防止 SQL 注入攻擊
- **Callback 模式**：Node.js 傳統異步處理方式
- `this.lastID`：插入後自動返回新記錄的 ID
- `db.all()`：返回所有符合的列；`db.run()`：執行 INSERT/UPDATE/DELETE

---

### 片段 8：統計計算

```javascript
// 統計資訊
function getStatistics(callback) {
  db.all(
    `
    SELECT 
      MIN(price) as minPrice,
      MAX(price) as maxPrice,
      AVG(price) as avgPrice,
      COUNT(*) as totalCount
    FROM prices
    `,
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || {});
    }
  );
}
```

**📌 說明：**
- SQL 聚合函數：`MIN()`、`MAX()`、`AVG()`、`COUNT()`
- 返回單一列資料（統計結果）
- 用於前端顯示 4 張統計卡片

---

## 🔄 **完整資料流**

```
┌─────────────────┐
│  使用者在前端    │
│  填寫表單        │
└────────┬────────┘
         │ 點擊「新增記錄」
         ▼
┌─────────────────────────────────────┐
│ script.js:                          │
│ 1. 讀取表單值 (date, name, price)   │
│ 2. fetch(API_BASE/api/prices, ...)  │
└────────┬────────────────────────────┘
         │ POST 請求
         ▼
┌──────────────────────────────────────┐
│ app.js: POST /api/prices             │
│ 1. 驗證參數                          │
│ 2. 調用 db.addPrice(...)            │
└────────┬─────────────────────────────┘
         │ 回傳 id
         ▼
┌──────────────────────────────────────┐
│ database.js: addPrice()              │
│ 1. INSERT INTO prices (...)         │
│ 2. 返回 lastID                       │
└────────┬─────────────────────────────┘
         │ 新增成功
         ▼
┌──────────────────────────────────────┐
│ app.js: 返回 201 Created + 記錄資料   │
└────────┬─────────────────────────────┘
         │ JSON 回應
         ▼
┌──────────────────────────────────────┐
│ script.js:                           │
│ 1. 顯示成功訊息                      │
│ 2. 重新載入 loadAllPrices()         │
│ 3. 重新載入 loadStatistics()         │
│ 4. 更新表格和統計卡片               │
└──────────────────────────────────────┘
```

---

## 🎯 **技術特點總結**

| 層級 | 特點 | 關鍵檔案 |
|------|------|---------|
| **前端** | 異步 Fetch API、動態 DOM 操作、表單驗證 | `script.js`, `style.css` |
| **後端** | Express RESTful API、中介軟體配置、錯誤處理 | `app.js` |
| **資料庫** | SQLite、環境偵測、參數化查詢、CRUD 操作 | `database.js` |

---

**✅ 適用於 Azure 和本地開發環境！** 🚀

