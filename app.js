const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { scrapeTeaPrice, scrapeEggPrice } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 靜態檔案 - 使用絕對路徑確保在 Azure 環境中正常運作
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

console.log(`📁 靜態檔案位置: ${publicPath}`);

// Routes

// 主頁
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// API: 取得所有價格記錄
app.get('/api/prices', (req, res) => {
  db.getAllPrices((err, prices) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(prices);
  });
});

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

// API: 統計資訊
app.get('/api/statistics', (req, res) => {
  db.getStatistics((err, stats) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(stats);
  });
});

// API: 爬蟲 - 爬取清心福全茶飲價格
app.post('/api/scrape/tea', async (req, res) => {
  try {
    console.log('📡 開始爬取清心福全茶飲價格...');
    const priceData = await scrapeTeaPrice();
    
    if (!priceData || priceData.length === 0) {
      return res.json({ 
        success: false,
        error: '無法爬取網站數據',
        message: '食品中國網可能已更新結構或網絡不可用。已切換為模擬數據。',
        count: 0,
        data: []
      });
    }
    
    res.json({
      success: true,
      count: priceData.length,
      data: priceData,
      message: `成功爬取 ${priceData.length} 筆清心福全茶飲價格`
    });
    
  } catch (error) {
    console.error('爬蟲錯誤:', error.message);
    res.json({ 
      success: false,
      error: '爬蟲執行失敗',
      message: error.message,
      count: 0,
      data: []
    });
  }
});

// API: 爬蟲 - 爬取蛋價資料
app.post('/api/scrape/egg', async (req, res) => {
  try {
    console.log('📡 開始爬取蛋價資料...');
    const eggData = await scrapeEggPrice();
    
    if (!eggData || eggData.length === 0) {
      return res.status(404).json({ 
        error: '無法爬取蛋價數據',
        message: '網站可能已變更結構'
      });
    }
    
    res.json({
      success: true,
      count: eggData.length,
      data: eggData,
      message: `成功爬取 ${eggData.length} 筆蛋價資料`
    });
    
  } catch (error) {
    console.error('蛋價爬蟲錯誤:', error);
    res.status(500).json({ 
      error: '蛋價爬蟲執行失敗',
      message: error.message
    });
  }
});

// API: 爬蟲後自動存入資料庫
app.post('/api/scrape-and-save', async (req, res) => {
  try {
    console.log('📡 開始爬取並存儲...');
    const priceData = await scrapeTeaPrice();
    
    if (!priceData || priceData.length === 0) {
      return res.json({ 
        success: false,
        error: '無法爬取數據',
        total: 0,
        saved: 0,
        errors: 0
      });
    }
    
    // 批量存入資料庫
    let saved = 0;
    let errors = 0;
    
    return new Promise((resolve) => {
      let completed = 0;
      
      priceData.forEach((item) => {
        db.addPrice(item.date, item.productName, item.price, (err) => {
          if (err) {
            errors++;
            console.error('存儲失敗:', err);
          } else {
            saved++;
          }
          
          completed++;
          
          if (completed === priceData.length) {
            res.json({
              success: saved > 0,
              total: priceData.length,
              saved: saved,
              errors: errors,
              message: `爬取 ${priceData.length} 筆，成功存儲 ${saved} 筆`
            });
            resolve();
          }
        });
      });
    });
    
  } catch (error) {
    console.error('爬蟲存儲錯誤:', error);
    res.json({ 
      success: false,
      error: '爬蟲執行失敗',
      message: error.message,
      total: 0,
      saved: 0,
      errors: 1
    });
  }
});

// API: 爬蟲診斷端點
app.get('/api/scraper-test', async (req, res) => {
  try {
    console.log('🔍 開始爬蟲診斷...');
    const priceData = await scrapeTeaPrice();
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      dataCount: priceData ? priceData.length : 0,
      sampleData: priceData ? priceData.slice(0, 3) : [],
      message: priceData && priceData.length > 0 ? '✅ 爬蟲運作正常' : '⚠️ 返回模擬數據'
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行於 http://localhost:${PORT}`);
  console.log(`清心福全珍珠奶茶個人化CPI追蹤系統已啟動`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
});
