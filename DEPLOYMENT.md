# Zeabur 部署指南 🚀

## 為什麼選擇 Zeabur？

- ⚡ 超快部署速度（通常 1-2 分鐘內完成）
- 🌏 亞洲節點支援，台灣訪問速度快
- 🎯 自動檢測 Vite 專案，零配置
- 💰 免費方案足夠使用
- 🔄 自動 CI/CD，推送即部署

## 快速部署步驟

### 1️⃣ 推送程式碼到 GitHub

```bash
git add .
git commit -m "準備部署到 Zeabur"
git push origin main
```

### 2️⃣ 在 Zeabur 建立專案

1. 前往 [Zeabur Dashboard](https://zeabur.com/)
2. 使用 GitHub 帳號登入
3. 點擊 **Create New Project**
4. 選擇 **Deploy from GitHub**
5. 選擇你的 repository (`hoopstat`)

### 3️⃣ 等待自動部署

Zeabur 會自動：
- ✅ 檢測到這是 Vite 專案
- ✅ 執行 `npm install`
- ✅ 執行 `npm run build`
- ✅ 部署到全球 CDN

**大約 1-2 分鐘就完成了！** 🎉

### 4️⃣ 設定環境變數

部署完成後，點擊你的服務：

1. 進入 **Variables** 標籤
2. 添加以下環境變數：

```
VITE_SUPABASE_URL=你的Supabase專案URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名金鑰
VITE_ADMIN_PASSWORD=你的管理員密碼
```

⚠️ **重要**：
- `VITE_ADMIN_PASSWORD` 用於刪除比賽等敏感操作
- 請設定一個安全的密碼，只分享給需要管理權限的人
- 這個密碼會在刪除操作時要求輸入

3. 點擊 **Redeploy** 讓環境變數生效

### 5️⃣ 綁定自訂網域（選用）

1. 在服務頁面點擊 **Domains**
2. 點擊 **Generate Domain** 獲得免費的 `.zeabur.app` 網域
3. 或是添加你自己的網域

## 自動部署

之後每次推送到 GitHub：
```bash
git push origin main
```

Zeabur 會自動重新部署，完全不需要手動操作！

## Zeabur 免費方案

免費方案包含：
- ✅ 無限次部署
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ✅ 每月 $5 USD 免費額度
- ✅ 不會自動休眠（比 Render 好！）

## 進階設定（選用）

### 自訂建置指令

如果需要自訂建置設定，可以在專案中建立 `zbpack.json`：

```json
{
  "build_command": "npm run build",
  "install_command": "npm install",
  "start_command": "npm run preview"
}
```

不過對於這個專案，Zeabur 的自動檢測已經足夠，不需要額外設定。

## 監控與日誌

在 Zeabur Dashboard 可以：
- 📊 查看即時日誌
- 📈 監控流量和效能
- 🔧 重新部署或回滾版本

## 疑難排解

### 502 Bad Gateway 錯誤
這通常是端口配置問題。確保：
1. `package.json` 的 `start` 命令使用 `vite preview --host --port 8080`
2. 在 Zeabur 的服務設定中，Port 設定為 `8080`
3. 重新部署服務

**修正步驟**：
```bash
git add .
git commit -m "修復 Zeabur 端口配置"
git push origin main
```

### 建置失敗
1. 檢查 GitHub repo 是否有所有必要的檔案
2. 確認 `package.json` 的 dependencies 正確
3. 查看 Zeabur 的建置日誌找出錯誤

### 環境變數未生效
1. 確認變數名稱以 `VITE_` 開頭（Vite 要求）
2. 添加環境變數後記得點擊 **Redeploy**

### Supabase 連線問題
1. 檢查環境變數是否正確設定
2. 確認 Supabase 專案的 API 設定正確
3. 查看瀏覽器 Console 的錯誤訊息

## 比較：Zeabur vs Render

| 功能 | Zeabur | Render |
|------|--------|--------|
| 部署速度 | ⚡ 1-2 分鐘 | 🐢 3-5 分鐘 |
| 亞洲節點 | ✅ 支援 | ⚠️ 較少 |
| 自動休眠 | ❌ 不休眠 | ⚠️ 15分鐘無活動會休眠 |
| 設定難度 | ✨ 零配置 | 📝 需要設定 |
| 免費額度 | $5/月 | 750 小時/月 |

## 部署後測試清單

✅ 訪問網站確認能正常載入  
✅ 測試開始新比賽  
✅ 測試投籃計分功能  
✅ 測試保存比賽（確認 Supabase 連接）  
✅ 測試查看歷史記錄  
✅ 測試球員統計分析  
✅ 在手機上測試觸控操作  

## 取得你的網站網址

部署完成後，Zeabur 會提供：
- 🌐 免費的 `.zeabur.app` 網域
- 🔒 自動啟用 HTTPS
- 📱 可以直接分享給朋友使用！

---

🎉 **恭喜！你的 HoopStat 籃球計分應用已經上線了！**

有任何問題都可以查看 [Zeabur 官方文件](https://zeabur.com/docs) 📚
