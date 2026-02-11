# Supabase 資料庫設定指南

## 1. 建立 Supabase 專案
1. 前往 https://supabase.com
2. 註冊/登入帳號
3. 建立新專案

## 2. 建立資料表

在 SQL Editor 中執行以下 SQL：

```sql
-- 比賽記錄表
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  team_a_name TEXT NOT NULL,
  team_b_name TEXT NOT NULL,
  team_a_score INTEGER DEFAULT 0,
  team_b_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 球員統計表
CREATE TABLE player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  team TEXT NOT NULL,
  two_point_made INTEGER DEFAULT 0,
  two_point_attempted INTEGER DEFAULT 0,
  three_point_made INTEGER DEFAULT 0,
  three_point_attempted INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  offensive_rebounds INTEGER DEFAULT 0,
  defensive_rebounds INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_games_date ON games(date DESC);
CREATE INDEX idx_player_stats_game_id ON player_stats(game_id);
CREATE INDEX idx_player_stats_player_name ON player_stats(player_name);

-- 啟用 Row Level Security (可選，提升安全性)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- 允許匿名讀取和寫入 (開發用，生產環境請調整)
CREATE POLICY "Enable read access for all users" ON games FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON player_stats FOR INSERT WITH CHECK (true);
```

## 3. 取得 API 金鑰

1. 前往 Project Settings > API
2. 複製 `Project URL` 和 `anon public` key
3. 在專案根目錄建立 `.env` 檔案：

```env
VITE_SUPABASE_URL=你的專案URL
VITE_SUPABASE_ANON_KEY=你的anon_key
```

## 4. 重新啟動開發伺服器

```bash
npm run dev
```

完成！現在應用程式可以將比賽數據儲存到 Supabase 了。
