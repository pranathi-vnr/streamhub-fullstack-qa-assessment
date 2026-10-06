Feature: Loan Report
  As a loan officer
  I want to filter the loan report
  So that I can analyse a subset of loans in a table and a chart

  Scenario: Report shows all loans with a valid chart
    Given the loan report is opened
    Then the report table should list all loans from the data file
    And the report chart should be visible
    And the report chart should contain valid non-zero data

  Scenario Outline: Filtering by loan type updates the table and the chart
    Given the loan report is opened
    When I filter the report by loan type "<type>"
    Then the report table should only show "<type>" loans
    And the report chart should have one bar for each listed loan
    And the report chart should contain valid non-zero data

    Examples:
      | type      |
      | Home      |
      | Car       |
      | Education |
      | Personal  |

  Scenario: Combining status and customer filters
    Given the loan report is opened
    When I filter the report by status "Active"
    And I search the report for customer "Rahul"
    Then the report table should show the loans matching status "Active" and customer "Rahul"

  Scenario: Filters with no matching loans show an empty state
    Given the loan report is opened
    When I search the report for customer "Nobody Here"
    Then the report table should show no loans
    And an empty-results message should be displayed
