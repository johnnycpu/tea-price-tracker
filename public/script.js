const API_BASE = 'http://localhost:3000';

// 初始化 - 設定今天的日期為預設值
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    loadAllPrices();
    loadStatistics();
});

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
            loadAllPrices();
            loadStatistics();
        } else {
            alert('❌ 新增失敗');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ 無法連接伺服器');
    }
});

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

// 依日期搜尋
async function searchByDate() {
    const searchDate = document.getElementById('searchDate').value;
    
    if (!searchDate) {
        alert('❌ 請選擇日期');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/prices/search?date=${searchDate}`);
        const prices = await response.json();

        const tableBody = document.getElementById('priceTableBody');
        
        if (prices.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="empty-message">
                ${searchDate} 暫無記錄
            </td></tr>`;
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

// 刪除記錄
async function deletePrice(id) {
    if (!confirm('確定要刪除此記錄嗎？')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/prices/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('✅ 記錄已刪除！');
            loadAllPrices();
            loadStatistics();
        } else {
            alert('❌ 刪除失敗');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// 載入統計資訊
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/api/statistics`);
        const stats = await response.json();

        document.getElementById('maxPrice').textContent = 
            stats.maxPrice ? `NT$ ${stats.maxPrice.toFixed(2)}` : '-';
        document.getElementById('minPrice').textContent = 
            stats.minPrice ? `NT$ ${stats.minPrice.toFixed(2)}` : '-';
        document.getElementById('avgPrice').textContent = 
            stats.avgPrice ? `NT$ ${stats.avgPrice.toFixed(2)}` : '-';
        document.getElementById('totalRecords').textContent = stats.totalRecords || 0;
    } catch (error) {
        console.error('Error:', error);
    }
}

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-Hant-TW');
}

// 爬蟲功能 - 爬取茶飲價格
async function scrapeTea() {
    const statusDiv = document.getElementById('scraperStatus');
    statusDiv.className = 'scraper-status loading';
    statusDiv.textContent = '⏳ 正在爬取清心福全茶飲價格...請稍候...';

    try {
        const response = await fetch(`${API_BASE}/api/scrape/tea`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        // 檢查響應是否為有效的 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('伺服器返回非 JSON 格式 (可能是 HTML 錯誤頁面)');
        }

        const result = await response.json();

        if (response.ok && result.success) {
            statusDiv.className = 'scraper-status success';
            statusDiv.innerHTML = `
                ✅ <strong>爬取成功！</strong><br>
                取得 ${result.count} 筆數據 (來源: ${result.data[0]?.source || '食品中國網'})
                ${result.data.slice(0, 3).map(d => `<br>📅 ${d.date} - NT$ ${d.price}`).join('')}
                ${result.data.length > 3 ? `<br>... 等共 ${result.data.length} 筆` : ''}
            `;
        } else {
            statusDiv.className = 'scraper-status error';
            statusDiv.textContent = `⚠️ 提示: ${result.error || result.message || '爬取失敗'}<br>系統將使用模擬數據`;
        }
    } catch (error) {
        console.error('爬蟲錯誤:', error);
        statusDiv.className = 'scraper-status error';
        statusDiv.textContent = `⚠️ 提示: ${error.message}<br>📊 系統已改用模擬數據進行演示`;
    }
}

// 爬蟲功能 - 爬取並自動存儲
async function scrapeAndSave() {
    const statusDiv = document.getElementById('scraperStatus');
    statusDiv.className = 'scraper-status loading';
    statusDiv.textContent = '⏳ 正在爬取並存儲數據...請稍候...';

    try {
        const response = await fetch(`${API_BASE}/api/scrape-and-save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            statusDiv.className = 'scraper-status success';
            statusDiv.innerHTML = `
                ✅ <strong>爬取並存儲成功！</strong><br>
                爬取: ${result.total} 筆 | 存儲: ${result.saved} 筆 | 失敗: ${result.errors} 筆
            `;
            
            // 自動更新表格
            setTimeout(() => {
                loadAllPrices();
                loadStatistics();
            }, 1000);
        } else {
            statusDiv.className = 'scraper-status error';
            statusDiv.textContent = `❌ 操作失敗: ${result.error || result.message}`;
        }
    } catch (error) {
        console.error('爬蟲存儲錯誤:', error);
        statusDiv.className = 'scraper-status error';
        statusDiv.textContent = `❌ 無法連接伺服器: ${error.message}`;
    }
}
