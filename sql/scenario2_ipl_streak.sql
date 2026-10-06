-- Scenario 2: players with 30+ runs in at least 3 CONSECUTIVE matches (IPL 2024 sample, SQLite)
--
-- "Consecutive" = consecutive matches in which the player batted, ordered by match_number
-- (a row below 30 breaks the streak). This is the classic "gaps and islands" problem.
--
-- Approach with window functions:
--   1. is_30 flags each innings: 1 if runs >= 30 else 0.
--   2. ROW_NUMBER() over ALL of a player's matches   -> rn_all
--      ROW_NUMBER() over only the 30+ matches        -> rn_30   (partitioned by player AND flag)
--   3. For consecutive 30+ matches both counters grow by 1, so (rn_all - rn_30) stays CONSTANT.
--      That constant is the "island id" (grp). A new streak starts whenever a low score appears.
--   4. Group by (player, grp) for 30+ rows, keep islands with COUNT(*) >= 3,
--      and report MIN(match_date) as the date the streak commenced.
WITH flagged AS (
    SELECT
        player,
        match_date,
        match_number,
        runs,
        CASE WHEN runs >= 30 THEN 1 ELSE 0 END AS is_30
    FROM ipl_scores
),
numbered AS (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY player          ORDER BY match_number) AS rn_all,
        ROW_NUMBER() OVER (PARTITION BY player, is_30   ORDER BY match_number) AS rn_30
    FROM flagged
),
islands AS (
    SELECT
        player,
        match_date,
        match_number,
        runs,
        rn_all - rn_30 AS grp
    FROM numbered
    WHERE is_30 = 1
)
SELECT
    player,
    MIN(match_date) AS streak_start_date,
    MAX(match_date) AS streak_end_date,
    COUNT(*)        AS matches_in_streak
FROM islands
GROUP BY player, grp
HAVING COUNT(*) >= 3
ORDER BY player, streak_start_date;
