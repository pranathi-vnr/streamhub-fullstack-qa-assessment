Feature: Dashboard
  As a loan officer
  I want a dashboard with summarised portfolio data and a chart
  So that I can understand the loan portfolio at a glance

  Scenario: Dashboard loads with summary values and chart
    Given the application is launched
    When I navigate to the dashboard
    Then the dashboard should be displayed
    And the summary values should be visible
    And the dashboard chart should be visible

  Scenario: Dashboard summary values match the underlying loan data
    Given the application is launched
    When I navigate to the dashboard
    Then the summary values should match the loan data file

  Scenario: Dashboard chart contains valid non-zero data
    Given the application is launched
    When I navigate to the dashboard
    Then the dashboard chart should be visible
    And the dashboard chart should contain valid non-zero data
