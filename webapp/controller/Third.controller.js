sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("my.app.controller.Third", {

        onInit: function () {

            // JSON laden
            const oModel = new JSONModel();
            oModel.loadData("model/entries.json");

            // Wenn JSON geladen ist → Charts aufbauen
            oModel.attachRequestCompleted(() => {
                this._entries = oModel.getData().entries;

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
        // Prozentwerte berechnen
        // -----------------------------
        _calculatePercentages: function (type) {

            const filtered = this._entries.filter(e => e.type === type);

            const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

            return filtered.map(e => ({
                label: e.description,
                value: Math.round((Number(e.amount) / total) * 100)
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
                                top: 150,
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