# Assignment5 - Vue SFC Rewrite (Detached Project)

這個資料夾為獨立的 Vite + Vue3 專案副本，用來把原專案的「作業4 通貨膨脹」前端改寫為 Vue SFC，不會更動原始 repo 的任何檔案。

快速啟動：

```bash
cd assignment5-vue
npm install
npm run dev
```

部署到 GitHub Pages（步驟）：
1. 在 GitHub 上建立新 repository（例如 `your-username/assignment5-vue`）。
2. 本地初始化並推送：

```bash
cd assignment5-vue
git init
git add .
git commit -m "Init assignment5-vue"
git branch -M main
git remote add origin https://github.com/your-username/assignment5-vue.git
git push -u origin main
```

3. GitHub Actions workflow (`.github/workflows/pages.yml`) 會在 `main` branch push 時自動執行並部署到 Pages。若需要，請至 GitHub Repo → Settings → Pages，確認 Source 設為 `gh-pages` 或 GitHub Actions 自動建立的設定。

## 元件介紹

這個專案把首頁拆成幾個獨立的 Vue 元件，重點放在「元件化」而不是外觀相似度。

- `App.vue`：整個應用的入口，負責掛載主功能元件。
- `InflationTracker.vue`：主容器元件，負責管理資料、API 呼叫與事件處理。
- `AppHeader.vue`：頁首元件，顯示專案標題與副標。
- `PriceFormSection.vue`：新增價格的表單元件。
- `SearchSection.vue`：日期查詢元件。
- `ScraperSection.vue`：爬蟲功能元件，包含爬取與爬取後儲存按鈕。
- `StatisticsSection.vue`：統計資訊元件。
- `PriceTable.vue`：價格列表元件，負責顯示資料與刪除操作。

## 怎麼用元件構成網站

網站的結構是由上到下串接各個功能元件：

1. `App.vue` 只負責載入 `InflationTracker.vue`。
2. `InflationTracker.vue` 作為主容器，集中管理 `form`、`searchDate`、`prices`、`stats` 與爬蟲訊息。
3. 主容器把資料與事件傳給子元件，例如：
	- `PriceFormSection` 送出表單時，觸發新增資料。
	- `SearchSection` 修改搜尋日期後，可執行查詢或重設。
	- `ScraperSection` 觸發爬取與儲存。
	- `StatisticsSection` 顯示統計數字。
	- `PriceTable` 顯示清單並可刪除單筆資料。
4. 這樣的分工讓每個元件只負責自己的畫面與互動，主容器專心處理資料流與 API。

如果要在 Notion 繳交報告，可以直接寫成「我把網站拆成頁首、表單、搜尋、爬蟲、統計、表格六個元件，並由 `InflationTracker.vue` 統一管理資料與事件，最後由 `App.vue` 掛載整個頁面。」
