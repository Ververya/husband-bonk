# Production deployment — GitHub Pages

已於 2026-10-02 完成正式部署。遊戲：https://ververya.github.io/husband-bonk/ 。Repository：https://github.com/Ververya/husband-bonk 。GitHub Pages 使用 workflow 部署，https_enforced=true，不依賴本機電腦。原先 localhost／私人 LAN 網址只用於本機預覽。正式 HTTPS 首頁與所有資產已通過 HTTP 200 檢查；Chrome 手機尺寸、存檔重新整理、service worker scope、本站請求與離線重新整理遊玩皆已通過。iPhone Safari 實機仍待使用者測試。

專案是原生 HTML/CSS/ES modules；GitHub Pages 可直接託管，玩家不需要 Python、Node、帳號或後端。沒有新增 framework，也沒有修改玩法或遊戲畫面。

## 部署

1. 在 GitHub 建立 public repository，例如 husband-bonk。使用 public repository 可讓一般免費帳號使用 Pages。
2. 在此目錄執行下列命令；USERNAME 請換成自己的 GitHub 帳號。GitHub 的登入只用於你上傳程式，玩家不需登入。

```powershell
git init -b main
git add .
git commit -m "Prepare static game for GitHub Pages"
git remote add origin https://github.com/USERNAME/husband-bonk.git
git push -u origin main
```

3. Repository → Settings → Pages → Build and deployment → Source 選 GitHub Actions。
4. Actions → Deploy game to GitHub Pages → Run workflow，選 main。首次 push 若早於 Pages 設定而失敗，設定後重新執行即可。
5. Workflow 成功後，在 Settings → Pages 的 Visit site 或 Actions 的 github-pages deployment 取得網址：`https://USERNAME.github.io/husband-bonk/`。這是網址格式範例；本專案實際網址為 https://ververya.github.io/husband-bonk/ 。請分享含專案名稱及結尾斜線的 HTTPS 網址。
6. Settings → Pages → Enforce HTTPS 確認已啟用。此後由 GitHub 託管，不需本機開機。後續 push main 自動更新。

官方說明：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
HTTPS：https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

## Production build 與路徑

`python scripts/build_site.py` 產生 dist，只複製 index、CSS、JS、固定對話資料、圖示、manifest 與 service worker。部署不包含本機伺服器、README、tests、.venv 或瀏覽器 profile。GitHub Actions 使用同一 build，不需要你先提交 dist。

manifest 的 id/start_url/scope 都是 `./`；圖示使用相對路徑。既有 CSS／JS／imports 也為相對路徑，無本機 filesystem 或本機 API。service-worker.js 在遊戲目錄註冊，預設 scope 是該目錄；快取名稱包含 scope，production build 再加入檔案內容 hash，自動更新快取版本。

單頁遊戲沒有前端路由。重新整理 `/husband-bonk/`、`/husband-bonk/index.html` 或 `?dev=true` 不需伺服器 rewrite；任意不存在的路徑仍會 404，勿分享虛構的子頁網址。

## 手機驗收

- 先關閉你的電腦；iPhone 關閉 Wi-Fi，以行動網路在 Safari 開公開 HTTPS 網址。Android 同樣用 Chrome 測試。
- BONK 幾次，重新整理、關閉頁面再開啟，確認紀錄保留。全程不需要玩家登入。
- iPhone Safari → 分享（或更多 → 分享）→ 加入主畫面；若有「以網頁 App 開啟」選項請開啟 → 加入。從主畫面啟動並再次測試保存。
- Android Chrome → 選單 → 加入主畫面／安裝應用程式。
- 首次連網完整載入、service worker 快取完成後，再開飛航模式測試主畫面啟動／重新整理與 BONK。LINE 分享仍需網路。
- 這個 Windows 環境無法直接驗證真實 iPhone Safari；Chrome 手機尺寸模擬不等同 Safari 實機測試。

Apple 說明：https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

## 保存紀錄與 AI Token

保留原 storage.js 與 husbandBonk_v2 key。localStorage 屬於各裝置／瀏覽器／origin：舊 localhost／LAN 紀錄不會自動搬到新 HTTPS 網址，各手機也不會互相同步；Safari 與主畫面 App 的儲存是否共用應在實機確認。勿使用私密瀏覽測保存；清除網站資料會刪除紀錄。

遊戲 Runtime 僅讀取本站靜態資產；對話和警告是 data/*.js 固定資料，計數在手機本機運算並保存，沒有 AI SDK、AI API、API key 或後端。唯一外部功能是玩家主動按 LINE 分享時開啟 line.me。因此玩家遊玩不消耗 OpenAI／Claude／Gemini AI Token。

可用 Chrome DevTools Network：清空紀錄，重新整理並連續 BONK，確認請求只有本站 HTML/CSS/JS/圖示/manifest，沒有 AI API 域名。快取時可能顯示 ServiceWorker。飛航模式仍可 BONK 也能佐證核心遊戲無需外部 API；不把部署 Actions 的 GitHub 身分 token 與 AI Token 混為一談。

## 本機驗證

`python tests/deployment_browser.py` 使用已安裝的 Windows Chrome，以獨立 profile 驗證 production 根目錄與 /husband-bonk/ 子目錄、manifest／PNG、service worker scope、localStorage 重新整理、本站資產請求及停止伺服器後離線遊玩。結果在 tests/deployment-results.json。

