-- 遷移腳本：為現有的 player_stats 表格添加缺失的欄位
-- 在 Supabase SQL Editor 中執行此腳本

-- 添加 total_points 欄位（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'player_stats' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN total_points INTEGER DEFAULT 0;
  END IF;
END $$;

-- 添加 fouls 欄位（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'player_stats' AND column_name = 'fouls'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN fouls INTEGER DEFAULT 0;
  END IF;
END $$;

-- 更新現有記錄的 total_points（根據已有的投籃數據計算）
UPDATE player_stats 
SET total_points = (two_point_made * 2) + (three_point_made * 3)
WHERE total_points = 0 OR total_points IS NULL;

-- 驗證更新
SELECT 
  player_name,
  two_point_made,
  three_point_made,
  total_points,
  fouls
FROM player_stats
ORDER BY created_at DESC
LIMIT 10;
