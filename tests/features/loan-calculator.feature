Feature: Loan EMI Calculator
  As a customer
  I want to calculate my monthly EMI
  So that I know what I will pay for a loan

  Scenario: EMI is calculated correctly for 25 lakh at 10 percent for 10 years
    Given the user opens the loan calculator
    When the user enters the following loan details:
      | Loan Amount   | 2500000 |
      | Interest Rate | 10      |
      | Tenure        | 10      |
    And clicks Calculate
    Then the displayed EMI should match the independently calculated expected EMI
    And total interest should be displayed
    And total payment should be displayed

  Scenario Outline: EMI is correct for other loan values
    Given the user opens the loan calculator
    When the user enters loan amount <amount>, interest rate <rate> and tenure <years> years
    And clicks Calculate
    Then the displayed EMI should match the independently calculated expected EMI
    And total interest should be displayed
    And total payment should be displayed

    Examples:
      | amount  | rate | years |
      | 5000000 | 7.5  | 15    |
      | 1000000 | 12   | 5     |
      | 750000  | 8.25  | 3     |

  Scenario: Calculator rejects invalid input
    Given the user opens the loan calculator
    When the user enters loan amount 0, interest rate 10 and tenure 5 years
    And clicks Calculate
    Then an input validation error should be displayed
    And no EMI should be displayed
