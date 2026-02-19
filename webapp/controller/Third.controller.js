sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("my.app.controller.Third", {

        onInit: function () {

            // CSS für Summenbox hinzufügen
            this._addSummaryBoxStyles();

            // JSON laden
            const oModel = new JSONModel();
            oModel.loadData("model/entries.json");

            // Wenn JSON geladen ist → Charts + Summen aufbauen
            oModel.attachRequestCompleted(() => {
                this._entries = oModel.getData().entries;

                // Gesamtsummen berechnen
                const totalAusgaben = this._getTotal("Ausgabe");
                const totalEinnahmen = this._getTotal("Einnahme");

                // Wöchentliche Summen berechnen
                const weeklyAusgaben = this._getWeeklyTotal("Ausgabe");
                const weeklyEinnahmen = this._getWeeklyTotal("Einnahme");

                // Felder setzen
                this.byId("txtTotalAusgaben").setText("Ausgaben: " + totalAusgaben + " €");
                this.byId("txtTotalEinnahmen").setText("Einnahmen: " + totalEinnahmen + " €");

                this.byId("txtWeeklyAusgaben").setText("Wöchentliche Ausgaben: " + weeklyAusgaben + " €");
                this.byId("txtWeeklyEinnahmen").setText("Wöchentliche Einnahmen: " + weeklyEinnahmen + " €");

                // Box-Styling anwenden
                this.byId("txtTotalAusgaben").addStyleClass("summaryOuterBox");
                this.byId("txtTotalEinnahmen").addStyleClass("summaryOuterBox");

                this._loadChartJs().then(() => {
                    this._injectCanvas();

                    setTimeout(() => {
                        this._drawPieChart("myPieChart1", this._getChart1Data());
                        this._drawPieChart("myPieChart2", this._getChart2Data());
                    }, 0);
                });
            });
        },

        // -----------------------------
        // CSS für Summenbox
        // -----------------------------
        _addSummaryBoxStyles: function () {
            const style = document.createElement("style");
            style.innerHTML = `
                .summaryOuterBox {
                    background: #f7f7f7;
                    border-radius: 14px;
                    padding: 15px 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.12);
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    display: inline-block;
                    width: 100%;
                }
            `;
            document.head.appendChild(style);
        },

        // -----------------------------
        // Kalenderwoche berechnen (ISO 8601)
        // -----------------------------
        _getISOWeek: function (dateString) {
            const date = new Date(dateString);
            const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = temp.getUTCDay() || 7;
            temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
            return Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
        },

        // -----------------------------
        // Wöchentliche Summen berechnen
        // -----------------------------
        _getWeeklyTotal: function (type) {

    // alle Einträge des Typs
    const entries = this._entries.filter(e => e.type === type);

    if (entries.length === 0) return 0;

    // letzte Woche bestimmen, in der dieser Typ vorkommt
    const lastEntry = entries[entries.length - 1];
    const lastWeek = this._getISOWeek(lastEntry.date);

    // Summe dieser Woche berechnen
    return entries
        .filter(e => this._getISOWeek(e.date) === lastWeek)
        .reduce((sum, e) => sum + Number(e.amount), 0);
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
            this.byId("chartContainer1")
                .setContent("<canvas id='myPieChart1' style='width:100%; height:350%;'></canvas>");

            this.byId("chartContainer2")
                .setContent("<canvas id='myPieChart2' style='width:100%; height:350%;'></canvas>");
        },

        // -----------------------------
        // ABSOLUTWERTE berechnen
        // -----------------------------
        _getTotal: function (type) {
            return this._entries
                .filter(e => e.type === type)
                .reduce((sum, e) => sum + Number(e.amount), 0);
        },

        // -----------------------------
        // Prozentwerte berechnen + gleiche Beschreibungen kombinieren
        // -----------------------------
        _calculatePercentages: function (type) {

            const filtered = this._entries.filter(e => e.type === type);

            const combined = {};

            filtered.forEach(e => {
                const desc = e.description;
                const amount = Number(e.amount);

                if (!combined[desc]) {
                    combined[desc] = 0;
                }

                combined[desc] += amount;
            });

            const total = Object.values(combined).reduce((sum, v) => sum + v, 0);

            return Object.keys(combined).map(desc => ({
                label: desc,
                value: Math.round((combined[desc] / total) * 100)
            }));
        },

        // -----------------------------
        // Chart 1 Daten (Ausgaben)
        // -----------------------------
        _getChart1Data: function () {
            const data = this._calculatePercentages("Ausgabe");

            return {
                title: "Ausgaben",
                labels: data.map(d => d.label),
                values: data.map(d => d.value)
            };
        },

        // -----------------------------
        // Chart 2 Daten (Einnahmen)
        // -----------------------------
        _getChart2Data: function () {
            const data = this._calculatePercentages("Einnahme");

            return {
                title: "Einnahmen",
                labels: data.map(d => d.label),
                values: data.map(d => d.value)
            };
        },

        // -----------------------------
        // Chart zeichnen
        // -----------------------------
        _drawPieChart: function (canvasId, chartData) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            new Chart(canvas, {
                type: "pie",
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        data: chartData.values,
                        backgroundColor: [
                            "#4CAF50",
                            "#2196F3",
                            "#FFC107",
                            "#FF5722",
                            "#9C27B0"
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        title: {
                            display: true,
                            text: chartData.title,
                            font: {
                                size: 18,
                                weight: "bold"
                            },
                            padding: {
                                top: 50,
                                bottom: 20
                            }
                        },

                        legend: {
                            position: "bottom",
                            labels: {
                                boxWidth: 12,
                                font: { size: 15 }
                            }
                        }
                    }
                }
            });
        },

        // -----------------------------
        // Navigation
        // -----------------------------
        onGoSecond: function () {
            this.getOwnerComponent().getRouter().navTo("second");
        },

        onGoThird: function () {
            this.getOwnerComponent().getRouter().navTo("third");
        },

        onMenuSelect: function (oEvent) {
            const selected = oEvent.getParameter("listItem").getTitle();

            switch (selected) {
                case "Dashboard":
                    this.getOwnerComponent().getRouter().navTo("main");
                    break;
                case "Transaktionen":
                    this.getOwnerComponent().getRouter().navTo("second");
                    break;
                case "Berichte":
                    this.getOwnerComponent().getRouter().navTo("third");
                    break;
            }
        }

    });
});