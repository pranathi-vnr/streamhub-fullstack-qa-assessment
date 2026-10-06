# AI Self-Healing for Broken Locators

This document describes how an AI-assisted "self-healing" step could repair brittle Playwright locators in this
framework, and which safeguards stop it from making things worse. It is a **design**, not a running system:
no AI service is called anywhere in this repository.

## The intentionally broken examples

`tests/self-healing/broken-locators.spec.ts` contains **5 deliberately wrong locators**, each marked
`// INTENTIONALLY BROKEN LOCATOR FOR AI SELF-HEALING EXERCISE` and left unfixed:

| # | Broken locator | What is really in the DOM | Failure type |
|---|----------------|---------------------------|--------------|
| 1 | `getByTestId("wrong-calculator-button")` | `<button data-testid="calculate-button">Calculate</button>` | wrong test id |
| 2 | `getByLabel("Principal Amount")` | `<label for="loan-amount">Loan Amount (₹)</label>` | renamed label |
| 3 | `locator("div.results > span:nth-child(3)")` | `<dd data-testid="emi-output">` inside a `<dl>` | brittle positional CSS |
| 4 | `getByRole("link", { name: "Reports" })` | `<button role="tab">Loan Report</button>` | wrong role and name |
| 5 | `getByText("Number of Active Accounts")` | `<h3>Number of Customers</h3>` | stale text |

They live in a separate folder with its own config, so the real suites never run them.
Run the demo (all 5 are expected to fail):

```
npm run test:self-healing-demo
```

## 1. How a locator failure is detected

* Playwright throws a `TimeoutError` ("waiting for locator(...)") when an element is not found.
* A Cucumber `After` hook (or a Playwright fixture) checks whether the error is a **locator-not-found** error rather
  than an assertion failure or an application error. Assertion failures (wrong EMI value) must never be "healed" -
  that would hide a real bug.
* Distinguishing signals: the message contains `waiting for` + `locator`, the page loaded with HTTP 200, and there are
  no console errors or failed network requests.

## 2. What information is captured

At the moment of failure, collect:

* the failing locator expression, the file/line and the step text (intent, e.g. "click Calculate");
* page URL and page title;
* a **trimmed DOM snippet**: the closest stable container (form, `main`, `tabpanel`) with scripts and styles removed;
* the **accessibility tree** (`page.accessibility.snapshot()` / ARIA snapshot), which is compact and role/name based;
* a list of interactive elements near the intended target (role, accessible name, test id, label text);
* a screenshot, and the last known passing locator from version control history (if any);
* a human description of the expected element (from the step text or a comment).

Nothing sensitive is sent: values typed into inputs, cookies and tokens are stripped before the snapshot leaves the machine.

## 3. How the AI is prompted

> Here is the failed locator, current DOM snippet, expected element description, and nearby accessible elements.
> Suggest 3 resilient Playwright locators. Prefer role, label, text, or test-id. Do not suggest XPath unless necessary.
> Return JSON only: `[{ "locator": "...", "strategy": "role|label|text|testid|css", "reason": "..." }]`.
> Only use elements that appear in the snippet below. If none match, return an empty list.

The prompt is filled with the data from section 2. Output is requested as strict JSON so it can be parsed and validated by code.

## 4. How candidate locators are generated

The model returns up to three candidates, ordered by the framework's preference list:

1. `getByRole(role, { name })`
2. `getByLabel(...)`
3. `getByTestId(...)`
4. `getByText(...)`
5. CSS (only if nothing above works), never `nth-child` chains and never long XPath

For failing locator #1 a good candidate list would be `getByRole("button", { name: "Calculate" })`,
`getByTestId("calculate-button")`, `getByText("Calculate")`.

## 5. How candidates are validated (against the live DOM)

AI output is treated as **untrusted suggestions**. Each candidate is run in the real page:

1. **Parse/whitelist** - the string must be a single call to an allowed Playwright locator method; anything else is dropped.
2. **Count check** - `await page.locator(candidate).count()` must be **exactly 1** (0 = hallucination, >1 = ambiguous).
3. **Visibility/enabled** - the element must be visible, and enabled if the step needs to click or type.
4. **Semantic check** - role, accessible name or text of the matched element must be consistent with the expected description.
5. **Behavioural check** - re-run the failed step with the candidate; the step's own assertion must then pass.

## 6. How AI hallucinations are prevented

* The prompt forbids inventing elements and supplies the only allowed facts (DOM snippet and accessibility tree).
* Every candidate must exist in the live DOM with a unique match, so invented test ids or labels are rejected automatically.
* JSON-only output with a fixed schema; free text is ignored.
* The model never edits files directly - a script applies a change only after validation.
* Healing is limited to locator-not-found failures; the step's assertions stay untouched and keep protecting correctness.

## 7. Deciding whether to apply the fix automatically

| Condition | Action |
|-----------|--------|
| Exactly one candidate passes all 5 checks, uses role/label/test-id, and the step passes | Apply in a **branch / pull request** with a diff, never straight to the main branch |
| Candidate passes but uses text or CSS, or several candidates tie | Report as "suggested fix" for a human to review |
| No candidate passes | Fail the test normally and attach the failure data |
| The matched element's role or name changed a lot compared with the original | Treat it as a possible product change; require human approval |

A human always reviews the pull request. Every healing event is logged (old locator, new locator, reason, run id) so
repeated healing of the same locator is visible and flags a real problem (for example a missing `data-testid`).

## Optional proof of concept

A runnable POC is intentionally not included: the exercise asks for the broken locators and the explanation, and a
trustworthy POC needs a model API key and extra infrastructure. The validation logic in section 5 can be prototyped
without any AI call by passing hand-written candidates to the same checks.
