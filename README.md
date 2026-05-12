# 清心福全珍珠奶茶 - 個人化CPI追蹤系統

## 📌 專案簡介

這是一個為大學資訊課程設計的個人化通貨膨脹指數(CPI)追蹤應用程式。
透過記錄清心福全珍珠奶茶的價格變化，讓使用者親身體驗物價膨脹。

## 🎯 主要功能

- ✅ **價格記錄** - 記錄商品的日期、名稱、價格
- ✅ **搜尋功能** - 依據日期搜尋特定日期的記錄
- ✅ **統計分析** - 顯示最高/最低/平均價格及記錄筆數
- ✅ **清單查看** - 表格形式展示所有記錄
- ✅ **刪除功能** - 移除錯誤的記錄

## 🛠️ 技術堆棧

| 層級 | 技術 |
|------|------|
| **前端** | HTML5 + CSS3 + Vanilla JavaScript |
| **後端** | Node.js + Express.js |
| **資料庫** | SQLite3 |
| **API** | RESTful API |

## 📁 專案結構

```
tea-price-tracker/
├── app.js                 # Express 伺服器主程式
├── database.js            # SQLite 資料庫設置與操作
├── package.json           # npm 依賴配置
├── README.md              # 本檔案
├── .gitignore             # Git 忽略清單
├── public/
│   ├── index.html         # 前端主頁面
│   ├── style.css          # 樣式表
│   └── script.js          # 前端 JavaScript
└── data/
    └── prices.db          # SQLite 資料庫檔案
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動伺服器

```bash
npm start
```

### 3. 訪問應用程式

打開瀏覽器，訪問：
```
http://localhost:3000
```

## 📊 API 端點

### POST /api/prices
新增價格記錄
```json
{
  "date": "2026-05-12",
  "productName": "清心福全珍珠奶茶",
  "price": 55
}
```

### GET /api/prices
取得所有記錄

### GET /api/prices/search?date=2026-05-12
依日期搜尋記錄

### DELETE /api/prices/:id
刪除指定記錄

### GET /api/statistics
取得統計資訊(最高/最低/平均價格等)

## 💾 資料庫架構

```sql
CREATE TABLE prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  productName TEXT NOT NULL,
  price REAL NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 📝 使用說明

1. **選擇日期** - 在「記錄價格」表單中選擇日期
2. **輸入價格** - 輸入該日期清心福全珍珠奶茶的價格
3. **提交記錄** - 點擊「+ 新增記錄」按鈕
4. **查詢記錄** - 使用搜尋功能或在清單中檢視
5. **刪除記錄** - 點擊每筆記錄旁的「刪除」按鈕

## 🎨 使用者介面

### 美化特色
- 現代漸層背景設計
- 響應式網格布局
- 互動式統計卡片
- 清晰的表格展示
- 行動裝置友善

### 色彩方案
- 主色調：紫色漸層 (#667eea - #764ba2)
- 強調色：綠色(搜尋)、紅色(刪除)

## 📱 響應式設計

應用程式支援多種裝置尺寸：
- 📱 手機 (< 480px)
- 💻 平板 (480px - 768px)
- 🖥️ 桌面 (> 768px)

## ⚙️ 環境需求

- Node.js >= 12.0
- npm >= 6.0
- 現代瀏覽器 (Chrome, Firefox, Safari, Edge)

## 🔐 資料安全

- SQLite 本地存儲，無雲端上傳
- 所有資料存儲在 `data/prices.db`
- 支援記錄刪除功能

## 📚 學習重點

此專案涵蓋以下技術概念：

✓ 前端表單設計與驗證  
✓ RESTful API 設計原則  
✓ Express.js 路由管理  
✓ SQLite 資料庫操作  
✓ 非同步 JavaScript (Fetch API)  
✓ CSS 漸層與動畫效果  
✓ 響應式網頁設計  
✓ 資料統計與分析  

## 📄 授權

MIT License

---

**作者**: [您的名字]  
**班級**: [班級]  
**創建日期**: 2026年5月12日  
**最後更新**: 2026年5月12日
