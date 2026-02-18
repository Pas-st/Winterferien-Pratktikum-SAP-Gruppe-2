sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("my.app.controller.Main", {

        onInit: function () {
            this._loadChartJs().then(() => {
                this._injectCanvas();
                this._setTableModel();
                this._drawLineChart();
            });
        },

        // -----------------------------
        // Chart.js laden
        // -----------------------------
        _loadChartJs: function () {
            return new Promise((resolve) => {
                if (window.Chart) {
                    resolve();
                    return;
                }

                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/chart.js";
                script.onload = resolve;
                document.head.appendChild(script);
            });
        },

        // -----------------------------
        // Canvas einfügen
        // -----------------------------
        _injectCanvas: function () {
            this.byId("chartContainer")
                .setContent("<canvas id='monthlyChart' style='width:100%; height:400px;'></canvas>");
        },

        // -----------------------------
        // Monatsdaten generieren
        // -----------------------------
        _getMonthData: function () {
            const days = new Date().getDate();
            const labels = [];
            const income = [];
            const expense = [];
            const profit = [];

            for (let i = 1; i <= days; i++) {
                labels.push(i.toString());

                const inc = Math.floor(Math.random() * 5000);
                const exp = Math.floor(Math.random() * 4000);

                income.push(inc);
                expense.push(exp);
                profit.push(inc - exp);
            }

            return { labels, income, expense, profit };
        },

        // -----------------------------
        // Linienchart zeichnen
        // -----------------------------
        _drawLineChart: function () {
            const data = this._getMonthData();
            const ctx = document.getElementById("monthlyChart");

            new Chart(ctx, {
                type: "line",
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: "Einnahmen",
                            data: data.income,
                            borderColor: "#2196F3",
                            backgroundColor: "#2196F3",
                            tension: 0.3,
                            pointRadius: 5
                        },
                        {
                            label: "Ausgaben",
                            data: data.expense,
                            borderColor: "#F44336",
                            backgroundColor: "#F44336",
                            tension: 0.3,
                            pointRadius: 5
                        },
                        {
                            label: "Gewinn",
                            data: data.profit,
                            borderColor: "#4CAF50",
                            backgroundColor: "#4CAF50",
                            borderDash: [5, 5],
                            tension: 0.3,
                            pointRadius: 5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        tooltip: {
                            enabled: true
                        },
                        legend: {
                            position: "bottom"
                        }
                    },

                    interaction: {
                        mode: "nearest",
                        intersect: false
                    },

                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },

        // -----------------------------
        // Tabelle Daten (letzte 30 Tage)
        // -----------------------------
        _setTableModel: function () {
            const transactions = [];

            for (let i = 0; i < 30; i++) {
                transactions.push({
                    date: `2026-02-${i + 1}`,
                    text: "Buchung",
                    amount: (Math.random() * 1000).toFixed(2) + " €"
                });
            }

            const model = new JSONModel({ transactions });
            this.getView().setModel(model);
        },

        // -----------------------------
        // Menü Navigation
        // -----------------------------
        onMenuSelect: function (oEvent) {
            const selected = oEvent.getParameter("listItem").getTitle();
            const oRouter = this.getOwnerComponent().getRouter();

            if (selected === "Dashboard") oRouter.navTo("main");
            if (selected === "Transaktionen") oRouter.navTo("second");
            if (selected === "Berichte") oRouter.navTo("third");
        }
    });
});
