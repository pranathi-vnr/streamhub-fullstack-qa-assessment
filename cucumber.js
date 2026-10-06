// Cucumber configuration (TypeScript via ts-node).
// Run with: npm run test:ui
module.exports = {
  default: {
    paths: ["tests/features/**/*.feature"],
    requireModule: ["ts-node/register"],
    require: ["tests/support/**/*.ts", "tests/steps/**/*.ts"],
    format: [
      "progress-bar",
      "summary",
      "html:test-results/reports/cucumber-report.html",
      "json:test-results/reports/cucumber-report.json",
    ],
  },
};
