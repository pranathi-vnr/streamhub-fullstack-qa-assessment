// Runs the SQL scenarios against an in-memory SQLite database (sql.js, pure JS - no native build needed),
// prints the real query output, saves it under sql/screenshots/ and checks the expected results.
// Usage: npm run test:sql
const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const sqlDir = path.join(__dirname, "..", "sql");
const outDir = path.join(sqlDir, "screenshots");
const read = (f) => fs.readFileSync(path.join(sqlDir, f), "utf-8");

function toTable(result) {
  if (!result) return "(0 rows)\n";
  const { columns, values } = result;
  const rows = values.map((r) => r.map((v) => (v === null ? "NULL" : String(v))));
  const widths = columns.map((c, i) => Math.max(c.length, ...rows.map((r) => r[i].length)));
  const line = (cells) => "| " + cells.map((c, i) => c.padEnd(widths[i])).join(" | ") + " |";
  const sep = "+-" + widths.map((w) => "-".repeat(w)).join("-+-") + "-+";
  return [sep, line(columns), sep, ...rows.map(line), sep, `(${rows.length} rows)`].join("\n") + "\n";
}

function toObjects(result) {
  if (!result) return [];
  return result.values.map((v) => Object.fromEntries(result.columns.map((c, i) => [c, v[i]])));
}

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(read("schema.sql"));
  db.run(read("sample_data.sql"));
  fs.mkdirSync(outDir, { recursive: true });

  const checks = [];
  const check = (name, ok, detail) => checks.push({ name, ok, detail });

  // ---- Scenario 1 ----
  const r1 = db.exec(read("scenario1_round_trip.sql"))[0];
  const out1 = toTable(r1);
  fs.writeFileSync(path.join(outDir, "scenario1_round_trip_output.txt"), "-- Output of sql/scenario1_round_trip.sql\n" + out1);
  console.log("\n=== Scenario 1: round-trip transfers ===\n" + out1);

  const pairs = toObjects(r1).map((r) => `${r.outgoing_tx}->${r.return_tx}`);
  check("S1 finds exactly the two valid round trips (1->2, 3->4)", JSON.stringify(pairs) === JSON.stringify(["1->2", "3->4"]), pairs.join(", "));

  // ---- Scenario 2 ----
  const r2 = db.exec(read("scenario2_ipl_streak.sql"))[0];
  const out2 = toTable(r2);
  fs.writeFileSync(path.join(outDir, "scenario2_ipl_streak_output.txt"), "-- Output of sql/scenario2_ipl_streak.sql\n" + out2);
  console.log("=== Scenario 2: 30+ run streaks ===\n" + out2);

  const streaks = toObjects(r2).map((r) => `${r.player}@${r.streak_start_date}x${r.matches_in_streak}`);
  const expected = [
    "Sanju Samson@2024-03-24x3",
    "Shubman Gill@2024-03-24x3",
    "Travis Head@2024-04-05x3",
    "Virat Kohli@2024-03-25x4",
  ];
  check("S2 finds the four expected streaks (and not Rohit Sharma / KL Rahul)", JSON.stringify(streaks) === JSON.stringify(expected), streaks.join(", "));

  // ---- Summary ----
  let failed = 0;
  console.log("=== SQL checks ===");
  for (const c of checks) {
    if (!c.ok) failed++;
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.ok ? "" : "  -> got: " + c.detail}`);
  }
  const summary = checks.map((c) => `${c.ok ? "PASS" : "FAIL"}  ${c.name}`).join("\n") + "\n";
  fs.writeFileSync(path.join(outDir, "sql_checks_summary.txt"), summary);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
