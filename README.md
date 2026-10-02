# 老公欠揍計數器 — 雙計數更新

保留原本的單畫面、六種 SVG 表情、BONK 動畫、粒子、Combo、響應式與觸控操作。原生 HTML / CSS / JavaScript，無執行期依賴、帳號、追蹤或 AI API。

## 啟動

在專案目錄執行 `python -m http.server 8000`，開啟 http://localhost:8000 。ES modules 與離線快取須透過 HTTP（localhost）或部署至 HTTPS，不能直接雙擊 HTML。

Developer Panel：http://localhost:8000/?dev=true 。提供指定 Session／Alert／Lifetime 數值、觸發事件與獨立重設。一般網址不建立面板。

## 遊戲邏輯

每次 BONK 同時增加 `sessionHits`、`alertHits`、`lifetimeHits`，立即儲存。

- Session 到 30：顯示 RAGE RELEASED。舒服一點了只清除 Session；還沒則保留並進入 OVER BONK MODE，進度滿格、文字顯示實際 BONKS。
- Alert 到 100：優先顯示 HUSBAND ALERT。與 30 同時達標時只開一個 Modal，處理後再接續 Rage 選擇。
- 先不要：保存 `alertAcknowledged`，Alert 不清除，可继续累積；首頁顯示 100+ 與通知老公。刷新不重彈已確認的事件。
- 開啟 LINE／Web Share／複製不代表送達。玩家自行確認已完成分享後，Alert 歸零，`alertCount` 加一；Session >=30 時再詢問是否繼續。
- 明確選擇「這次算了，重新累積」並確認，也能清除 Alert，但不增加分享次数。
- Session 重設、分享與 Alert 重設都不減少 Lifetime；最高 Session 與 Lifetime／Husband Alerts 在設定的 Statistics 顯示。
- Lifetime 達 300／500／1000，非阻擋提示各出現一次，已解鎖紀錄存檔。

`alertCount` 遵循本次需求「分享完成後 +1」，代表已確認完成的警告分享，開啟或暫存警告不加一。遷移保留舊版數值；舊版曾以達標次數計算，歷史紀錄無法再分辨是否分享。

## GameState / Migration

儲存 key：`husbandBonk_v2`。

```js
{
  schemaVersion: 2,
  sessionHits: 17,
  alertHits: 73,
  lifetimeHits: 273,
  alertCount: 2,
  highestSessionHits: 57,
  sessionAcknowledged: false,
  alertAcknowledged: false,
  alertMessageIndex: null,
  sharePending: false,
  unlockedAchievements: [],
  lastHitAt: null,
  settings: { reduceMotion: false }
}
```

首次無 v2 時讀取 `husbandBonk_v1`，保留舊 key 原文。`totalHits` 轉成 `alertHits = min(totalHits, 100)`、`sessionHits = min(totalHits, 30)`；Lifetime 保留原值且不低於舊 totalHits，警告次數、最後點擊時間與減少動態設定保留。舊版沒有最高 Session 歷史，從遷移的 Session 開始記錄；既有已達標 Lifetime 成就標記為解鎖，避免首次升級連續彈出。

新版本的 Session／Alert 可超過 30／100，保存實際次數；UI 進度條始終 clamp，已確認事件不再自動彈出。舊 totalHits >100 的超出部分保留在 Lifetime。無效欄位安全正規化，儲存失敗顯示提示。

## 分享

LINE 按鈕使用官方 `https://line.me/R/share?text=...`，由玩家選收件人及送出。無法開啟時 fallback 至 Web Share，再 fallback 至複製／可選取的文字。取消或離線不清除計數；離線可先複製，稍後自行送出。分享完成確認會持久化並避免重複加算。

瀏覽器無法確認 LINE 的實際送達；Web Share 的 promise resolve 在不同平台也不代表訊息送達，因此三種方式皆使用玩家的明確完成確認。

參考：
- https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

## 離線

新增小型 service worker，首次完整成功載入並完成快取後，核心遊戲可離線刷新。只快取自己的核心檔案，LINE 仍需要網路。無持續動畫、背景 polling 或遊戲 API。更新使用 network-first；production build 依檔案內容自動更新 service-worker cache 版本。

已提供 PWA manifest 與手機安裝圖示；部署與安裝說明請見 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 驗證

詳見 `tests/RESULTS.md`。`tests/run_browser.py` 只使用 Python 標準庫與已安裝 Chrome，在獨立 profile 與 8001 測試伺服器執行，攔截分享、不傳送訊息；結束時停止自行啟動的程序。

