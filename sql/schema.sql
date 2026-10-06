-- Schema for both SQL scenarios (SQLite dialect).

DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
    transaction_id   INTEGER PRIMARY KEY,
    sender_account   TEXT    NOT NULL,
    receiver_account TEXT    NOT NULL,
    amount           NUMERIC NOT NULL CHECK (amount > 0),
    transaction_time TEXT    NOT NULL   -- ISO-8601 'YYYY-MM-DD HH:MM:SS'
);

DROP TABLE IF EXISTS ipl_scores;
CREATE TABLE ipl_scores (
    player       TEXT    NOT NULL,
    match_date   TEXT    NOT NULL,      -- ISO date 'YYYY-MM-DD'
    match_number INTEGER NOT NULL,      -- IPL 2024 match number
    runs         INTEGER NOT NULL CHECK (runs >= 0),
    PRIMARY KEY (player, match_number)
);
