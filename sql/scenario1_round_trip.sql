-- Scenario 1: quick round-trip transfers (SQLite dialect)
--
-- Find pairs where account A sends money to account B AND account B sends a SIMILAR amount
-- back to account A, with the two transactions at most 24 hours apart.
--
-- Rules used:
--   * Opposite direction : t2.sender = t1.receiver AND t2.receiver = t1.sender
--   * Order              : t2 happens AFTER t1 (so each pair is reported once, outgoing -> return)
--   * Similar amount     : |t1.amount - t2.amount| <= 10% of the outgoing amount (t1.amount)
--   * 24-hour window     : 0 < time(t2) - time(t1) <= 24 hours (julianday difference <= 1 day)
SELECT
    t1.transaction_id                                                    AS outgoing_tx,
    t2.transaction_id                                                    AS return_tx,
    t1.sender_account                                                    AS account_a,
    t1.receiver_account                                                  AS account_b,
    t1.amount                                                            AS outgoing_amount,
    t2.amount                                                            AS return_amount,
    ROUND(ABS(t1.amount - t2.amount) * 100.0 / t1.amount, 2)             AS pct_difference,
    ROUND((julianday(t2.transaction_time) - julianday(t1.transaction_time)) * 24, 2) AS hours_between,
    t1.transaction_time                                                  AS outgoing_time,
    t2.transaction_time                                                  AS return_time
FROM transactions AS t1
JOIN transactions AS t2
  ON  t2.sender_account   = t1.receiver_account
  AND t2.receiver_account = t1.sender_account
  AND t2.transaction_time > t1.transaction_time
  -- small epsilon (1e-9 day) so exactly-24h pairs are not lost to floating point rounding
  AND julianday(t2.transaction_time) - julianday(t1.transaction_time) <= 1.0 + 1e-9
  AND ABS(t1.amount - t2.amount) <= 0.10 * t1.amount + 1e-9
ORDER BY t1.transaction_time;
