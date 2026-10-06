-- Sample data (SQLite dialect). Run schema.sql first.

------------------------------------------------------------------
-- Scenario 1: transactions
------------------------------------------------------------------
INSERT INTO transactions (transaction_id, sender_account, receiver_account, amount, transaction_time) VALUES
-- VALID round trip: A -> B 1000, B -> A 950 (5% lower) 2 hours later
(1,  'ACC-A', 'ACC-B', 1000.00, '2024-03-01 10:00:00'),
(2,  'ACC-B', 'ACC-A',  950.00, '2024-03-01 12:00:00'),
-- VALID round trip: exactly on the 10% boundary (500 vs 550) and 23h59m later
(3,  'ACC-C', 'ACC-D',  500.00, '2024-03-02 09:00:00'),
(4,  'ACC-D', 'ACC-C',  550.00, '2024-03-03 08:59:00'),
-- NO MATCH: return amount too different (5000 vs 2000)
(5,  'ACC-E', 'ACC-F', 5000.00, '2024-03-04 10:00:00'),
(6,  'ACC-F', 'ACC-E', 2000.00, '2024-03-04 11:00:00'),
-- NO MATCH: similar amount but returned after more than 24 hours (30h)
(7,  'ACC-G', 'ACC-H', 1200.00, '2024-03-05 08:00:00'),
(8,  'ACC-H', 'ACC-G', 1200.00, '2024-03-06 14:00:00'),
-- NO MATCH: one-way transfer, nothing comes back
(9,  'ACC-I', 'ACC-J',  750.00, '2024-03-07 10:00:00'),
-- NO MATCH: similar amount and quick, but sent to a DIFFERENT account (not B -> A)
(10, 'ACC-K', 'ACC-L',  800.00, '2024-03-08 10:00:00'),
(11, 'ACC-M', 'ACC-K',  790.00, '2024-03-08 11:00:00');

------------------------------------------------------------------
-- Scenario 2: IPL 2024 style data (illustrative sample, not real scorecards)
-- One row per match in which the player batted. A row with runs < 30 breaks a streak.
------------------------------------------------------------------
INSERT INTO ipl_scores (player, match_date, match_number, runs) VALUES
-- Virat Kohli: 4 consecutive 30+ (matches 6,10,15,19) -> streak starts 2024-03-25
('Virat Kohli',   '2024-03-22',  1, 21),
('Virat Kohli',   '2024-03-25',  6, 77),
('Virat Kohli',   '2024-03-29', 10, 83),
('Virat Kohli',   '2024-04-02', 15, 42),
('Virat Kohli',   '2024-04-06', 19, 51),
('Virat Kohli',   '2024-04-11', 25, 12),
-- Rohit Sharma: only 2 consecutive 30+ -> must NOT appear
('Rohit Sharma',  '2024-03-24',  5, 49),
('Rohit Sharma',  '2024-03-27',  8, 38),
('Rohit Sharma',  '2024-04-01', 14,  4),
('Rohit Sharma',  '2024-04-07', 20, 105),
-- Sanju Samson: 3 consecutive 30+ exactly, streak starts 2024-03-24
('Sanju Samson',  '2024-03-24',  4, 82),
('Sanju Samson',  '2024-03-28',  9, 38),
('Sanju Samson',  '2024-04-02', 13, 30),
('Sanju Samson',  '2024-04-06', 18,  9),
-- KL Rahul: 29 runs in the middle match breaks the streak -> must NOT appear (30 is the cut-off)
('KL Rahul',      '2024-03-24',  3, 58),
('KL Rahul',      '2024-03-30', 11, 29),
('KL Rahul',      '2024-04-02', 12, 44),
('KL Rahul',      '2024-04-07', 16, 61),
-- Shubman Gill: two separate streaks; the first has 3 matches, the second only 2
('Shubman Gill',  '2024-03-24',  2, 35),
('Shubman Gill',  '2024-03-31', 12, 31),
('Shubman Gill',  '2024-04-05', 17, 36),
('Shubman Gill',  '2024-04-09', 22,  0),
('Shubman Gill',  '2024-04-13', 26, 45),
('Shubman Gill',  '2024-04-17', 30, 52),
-- Travis Head: a low score first, then 3 consecutive 30+ -> streak starts 2024-04-05 (not the first match)
('Travis Head',   '2024-03-27',  7, 11),
('Travis Head',   '2024-04-05', 16, 62),
('Travis Head',   '2024-04-09', 21, 89),
('Travis Head',   '2024-04-15', 28, 102);
