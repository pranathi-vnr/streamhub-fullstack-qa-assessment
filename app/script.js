/* Loan & EMI Dashboard - plain JavaScript + Chart.js (served locally, no CDN). */
(function () {
  "use strict";

  var loans = [];
  var charts = {};

  // ---------- helpers ----------
  function calculateEmi(principal, annualRatePercent, years) {
    var n = Math.round(years * 12);
    var r = annualRatePercent / 12 / 100;
    if (r === 0) {
      return principal / n;
    }
    var factor = Math.pow(1 + r, n);
    return (principal * r * factor) / (factor - 1);
  }

  function loanTotals(loan) {
    var n = Math.round(loan.tenureYears * 12);
    var emi = calculateEmi(loan.amount, loan.rate, loan.tenureYears);
    var totalPayment = emi * n;
    return { emi: emi, totalPayment: totalPayment, interest: totalPayment - loan.amount };
  }

  var money = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  var moneyWhole = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  function byTestId(id) {
    return document.querySelector('[data-testid="' + id + '"]');
  }

  function setText(id, text) {
    byTestId(id).textContent = text;
  }

  function drawChart(key, canvasId, config) {
    if (charts[key]) {
      charts[key].destroy();
    }
    charts[key] = new Chart(document.getElementById(canvasId), config);
  }

  var PALETTE = ["#1d4ed8", "#0d9488", "#d97706", "#7c3aed", "#dc2626", "#475569"];

  // ---------- tabs ----------
  function initTabs() {
    var tabs = document.querySelectorAll('[role="tab"]');
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          var selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
        });
        // Charts drawn while hidden need a resize once their panel is visible.
        Object.keys(charts).forEach(function (k) {
          charts[k].resize();
        });
      });
    });
  }

  // ---------- dashboard ----------
  function renderDashboard() {
    var totalAmount = 0;
    var totalInterest = 0;
    var customers = {};
    var byType = {};

    loans.forEach(function (loan) {
      totalAmount += loan.amount;
      totalInterest += loanTotals(loan).interest;
      customers[loan.customer] = true;
      byType[loan.type] = (byType[loan.type] || 0) + loan.amount;
    });

    setText("kpi-total-loans-value", String(loans.length));
    setText("kpi-total-amount-value", moneyWhole.format(totalAmount));
    setText("kpi-average-amount-value", moneyWhole.format(totalAmount / loans.length));
    setText("kpi-total-interest-value", moneyWhole.format(totalInterest));
    setText("kpi-customers-value", String(Object.keys(customers).length));

    drawChart("dashboard", "dashboard-chart", {
      type: "doughnut",
      data: {
        labels: Object.keys(byType),
        datasets: [{ label: "Loan amount (₹)", data: Object.values(byType), backgroundColor: PALETTE }],
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: "right" } } },
    });
  }

  // ---------- calculator ----------
  function initCalculator() {
    var form = document.getElementById("calculator-form");
    var errorEl = document.getElementById("calculator-error");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var principal = parseFloat(document.getElementById("loan-amount").value);
      var rate = parseFloat(document.getElementById("interest-rate").value);
      var years = parseFloat(document.getElementById("loan-tenure").value);

      if (!(principal > 0) || !(rate >= 0) || !(years > 0)) {
        errorEl.textContent = "Please enter a loan amount > 0, an interest rate >= 0 and a tenure > 0.";
        errorEl.hidden = false;
        setText("emi-output", "–");
        setText("total-interest-output", "–");
        setText("total-payment-output", "–");
        return;
      }

      errorEl.hidden = true;
      var emi = calculateEmi(principal, rate, years);
      var n = Math.round(years * 12);
      var totalPayment = emi * n;
      var totalInterest = totalPayment - principal;

      setText("emi-output", money.format(emi));
      setText("total-interest-output", money.format(totalInterest));
      setText("total-payment-output", money.format(totalPayment));

      drawChart("calculator", "calculator-chart", {
        type: "doughnut",
        data: {
          labels: ["Principal", "Interest"],
          datasets: [{ data: [principal, totalInterest], backgroundColor: ["#1d4ed8", "#d97706"] }],
        },
        options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { position: "right" } } },
      });
    });
  }

  // ---------- report ----------
  function fillSelect(id, values) {
    var select = document.getElementById(id);
    values.forEach(function (v) {
      var option = document.createElement("option");
      option.value = v;
      option.textContent = v;
      select.appendChild(option);
    });
  }

  function unique(field) {
    var seen = {};
    loans.forEach(function (l) {
      seen[l[field]] = true;
    });
    return Object.keys(seen).sort();
  }

  function filteredLoans() {
    var type = document.getElementById("filter-type").value;
    var status = document.getElementById("filter-status").value;
    var name = document.getElementById("filter-customer").value.trim().toLowerCase();
    return loans.filter(function (l) {
      return (
        (type === "All" || l.type === type) &&
        (status === "All" || l.status === status) &&
        (name === "" || l.customer.toLowerCase().indexOf(name) !== -1)
      );
    });
  }

  function renderReport() {
    var rows = filteredLoans();
    var body = byTestId("loan-table-body");
    body.innerHTML = "";

    rows.forEach(function (loan) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-testid", "loan-row");
      tr.setAttribute("data-loan-id", loan.id);
      var cells = [
        loan.id,
        loan.customer,
        loan.type,
        moneyWhole.format(loan.amount),
        String(loan.rate),
        String(loan.tenureYears),
        moneyWhole.format(loanTotals(loan).emi),
        loan.status,
      ];
      cells.forEach(function (text) {
        var td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });

    setText("report-count", "Showing " + rows.length + (rows.length === 1 ? " loan" : " loans"));
    document.getElementById("empty-message").hidden = rows.length !== 0;

    drawChart("report", "report-chart", {
      type: "bar",
      data: {
        labels: rows.map(function (l) {
          return l.id;
        }),
        datasets: [
          {
            label: "Loan amount (₹)",
            data: rows.map(function (l) {
              return l.amount;
            }),
            backgroundColor: "#1d4ed8",
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } } },
    });
  }

  function initReport() {
    fillSelect("filter-type", unique("type"));
    fillSelect("filter-status", unique("status"));
    ["filter-type", "filter-status"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", renderReport);
    });
    document.getElementById("filter-customer").addEventListener("input", renderReport);
    renderReport();
  }

  // ---------- start ----------
  initTabs();
  initCalculator();

  fetch("data/loans.json")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not load loans.json (" + response.status + ")");
      }
      return response.json();
    })
    .then(function (data) {
      loans = data;
      renderDashboard();
      initReport();
    })
    .catch(function (err) {
      document.querySelector("main").insertAdjacentHTML(
        "afterbegin",
        '<p class="error" role="alert" data-testid="load-error">' + err.message + "</p>"
      );
    });
})();
