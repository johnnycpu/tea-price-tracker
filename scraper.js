const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 爬蟲模塊 - 抓取清心福全茶飲價格
 * 資料來源：食品中國網 (https://www.foodchina.com.tw/)
 */

// 爬蟲配置
const SCRAPER_CONFIG = {
  // 清心福全珍珠奶茶資料頁面
  targetUrl: 'https://www.foodchina.com.tw/model/marketing/listnew.aspx?PID=6',
  
  // 雞蛋價格資料頁面（作為備用示例）
  eggUrl: 'https://www.foodchina.com.tw/model/marketing/listnew.aspx?PID=6',
  
  // 用戶代理
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

/**
 * 生成模擬數據 - 當爬蟲失敗時使用
 * @returns {Array} 模擬的價格資料
 */
function generateMockData() {
  const today = new Date();
  const mockData = [];
  
  // 生成過去14天的模擬價格
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // 模擬價格在45-60之間浮動
    const basePrice = 50;
    const variation = Math.sin(i / 3) * 5;
    const randomFluctuation = (Math.random() - 0.5) * 3;
    const price = parseFloat((basePrice + variation + randomFluctuation).toFixed(2));
    
    mockData.push({
      date: dateStr,
      productName: '清心福全珍珠奶茶',
      price: Math.max(45, Math.min(60, price)),
      source: '模擬數據 (爬蟲備用)'
    });
  }
  
  console.log(`📊 生成 ${mockData.length} 筆模擬數據供演示使用`);
  return mockData;
}

/**
 * 爬取清心福全茶飲價格
 * @returns {Promise<Array>} 價格資料陣列
 */
async function scrapeTeaPrice() {
  try {
    console.log('🕷️  開始爬取清心福全茶飲價格...');
    
    // 獲取網頁
    const response = await axios.get(SCRAPER_CONFIG.targetUrl, {
      headers: {
        'User-Agent': SCRAPER_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9',
        'Referer': 'https://www.foodchina.com.tw/'
      },
      timeout: 10000,
      validateStatus: function (status) {
        // 接受所有狀態碼
        return true;
      }
    });
    
    console.log('📡 HTTP狀態碼:', response.status);
    
    if (response.status !== 200) {
      console.warn(`⚠️  網站返回狀態碼 ${response.status}`);
      return generateMockData();
    }
    
    const html = response.data;
    
    // 檢查是否為有效HTML
    if (!html || typeof html !== 'string') {
      console.warn('⚠️  返回無效的HTML');
      return generateMockData();
    }
    
    if (html.includes('<!DOCTYPE') || html.includes('<html')) {
      console.log('✅ 獲取到有效HTML');
    } else {
      console.warn('⚠️  返回內容可能不是HTML');
      return generateMockData();
    }
    
    const $ = cheerio.load(html);
    
    // 儲存價格資料的陣列
    const priceData = [];
    
    // 嘗試多種表格選擇器
    const selectors = [
      'table#ctl00_ctl00_cpl_MainContent_cpl_BasicMainContent_ctl00_T_54_51',
      'table[id*="MainContent"]',
      'table.ctl00_T_54_51',
      'table tbody tr'
    ];
    
    let table = null;
    for (const selector of selectors) {
      table = $(selector);
      if (table.length > 0) {
        console.log(`✅ 找到表格: ${selector}`);
        break;
      }
    }
    
    if (!table || table.length === 0) {
      console.warn('⚠️  無法找到目標表格，使用生成的模擬數據...');
      return generateMockData();
    }
    
    // 遍歷表格行
    table.find('tbody tr, tr').each((index, element) => {
      try {
        const $row = $(element);
        const cells = $row.find('td');
        
        if (cells.length < 3) return;
        
        // 提取各欄位 - 更靈活的選擇方式
        let priceText = '';
        let date = '';
        
        cells.each((i, cell) => {
          const text = $(cell).text().trim();
          
          // 嘗試找價格（數字）
          const priceMatch = text.match(/\d+(\.\d+)?/);
          if (priceMatch && !priceText) {
            priceText = text;
          }
          
          // 嘗試找日期
          if (text.match(/\d{4}-\d{2}-\d{2}/) || text.match(/\d{1,2}\/\d{1,2}/)) {
            date = text;
          }
        });
        
        // 解析價格
        const priceMatch = priceText.match(/\d+(\.\d+)?/);
        const price = priceMatch ? parseFloat(priceMatch[0]) : null;
        
        if (price && price > 0 && price < 1000) {
          priceData.push({
            date: date || new Date().toISOString().split('T')[0],
            productName: '清心福全珍珠奶茶',
            price: price,
            source: '食品中國網'
          });
        }
      } catch (rowError) {
        console.warn('⚠️  解析行數據失敗:', rowError.message);
      }
    });
    
    if (priceData.length === 0) {
      console.warn('⚠️  表格解析無結果，使用生成的模擬數據...');
      return generateMockData();
    }
    
    console.log(`✅ 成功爬取 ${priceData.length} 筆價格資料`);
    return priceData;
    
  } catch (error) {
    console.error('❌ 爬蟲錯誤:', error.message);
    console.log('📊 自動使用模擬數據...');
    return generateMockData();
  }
}

/**
 * 備用方案 - 提取表格所有可見資料
 */
function extractFallbackData($, priceData) {
  try {
    console.log('📊 使用備用解析方案...');
    
    // 嘗試找到任何包含價格的表格
    const allTables = $('table');
    let foundData = false;
    
    allTables.each((tableIndex, table) => {
      $(table).find('tbody tr').each((rowIndex, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 2) {
          // 提取所有單元格文本
          const rowData = [];
          cells.each((cellIndex, cell) => {
            const text = $(cell).text().trim();
            if (text) rowData.push(text);
          });
          
          // 嘗試找到數字（可能的價格）
          const lastCell = $(cells[cells.length - 1]).text().trim();
          const priceMatch = lastCell.match(/\d+(\.\d+)?/);
          
          if (priceMatch && rowData.length > 0) {
            priceData.push({
              date: new Date().toISOString().split('T')[0],
              productName: '清心福全珍珠奶茶',
              price: parseFloat(priceMatch[0]),
              source: '網頁爬取'
            });
            foundData = true;
          }
        }
      });
    });
    
    if (foundData) {
      console.log(`✅ 備用方案成功提取 ${priceData.length} 筆資料`);
    }
    
    return priceData;
    
  } catch (error) {
    console.error('❌ 備用方案失敗:', error.message);
    return priceData;
  }
}

/**
 * 爬取雞蛋價格（作為示例備用功能）
 */
async function scrapeEggPrice() {
  try {
    console.log('🕷️  開始爬取蛋價資料...');
    
    const response = await axios.get(SCRAPER_CONFIG.eggUrl, {
      headers: {
        'User-Agent': SCRAPER_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://www.foodchina.com.tw/'
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (response.status !== 200) {
      console.warn(`⚠️  無法獲取蛋價數據，使用模擬數據`);
      return generateMockEggData();
    }
    
    const $ = cheerio.load(response.data);
    const prices = [];
    
    // 解析蛋價表格
    $('table tbody tr, table tr').each((index, element) => {
      try {
        const $row = $(element);
        const cells = $row.find('td');
        
        if (cells.length >= 2) {
          cells.each((i, cell) => {
            const text = $(cell).text().trim();
            const priceMatch = text.match(/\d+(\.\d+)?/);
            
            if (priceMatch) {
              const price = parseFloat(priceMatch[0]);
              if (price > 0 && price < 50) {
                prices.push({
                  date: new Date().toISOString().split('T')[0],
                  productName: '雞蛋',
                  price: price,
                  source: '食品中國網'
                });
              }
            }
          });
        }
      } catch (e) {
        console.warn('⚠️  解析蛋價行失敗');
      }
    });
    
    if (prices.length === 0) {
      return generateMockEggData();
    }
    
    console.log(`✅ 爬取蛋價成功: ${prices.length} 筆`);
    return prices;
    
  } catch (error) {
    console.error('❌ 蛋價爬蟲失敗:', error.message);
    return generateMockEggData();
  }
}

/**
 * 生成模擬蛋價數據
 */
function generateMockEggData() {
  const today = new Date();
  const mockData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const basePrice = 30;
    const variation = Math.sin(i / 2) * 3;
    const randomFluctuation = (Math.random() - 0.5) * 2;
    const price = parseFloat((basePrice + variation + randomFluctuation).toFixed(2));
    
    mockData.push({
      date: dateStr,
      productName: '雞蛋',
      price: Math.max(25, Math.min(35, price)),
      source: '模擬數據'
    });
  }
  
  return mockData;
}

/**
 * 測試爬蟲功能
 */
async function testScraper() {
  console.log('\n=== 爬蟲功能測試 ===\n');
  
  const teaData = await scrapeTeaPrice();
  console.log('茶飲資料:', teaData);
  
  const eggData = await scrapeEggPrice();
  console.log('蛋價資料:', eggData);
}

// 如果直接執行此模塊
if (require.main === module) {
  testScraper();
}

module.exports = {
  scrapeTeaPrice,
  scrapeEggPrice,
  generateMockData,
  generateMockEggData,
  SCRAPER_CONFIG
};
