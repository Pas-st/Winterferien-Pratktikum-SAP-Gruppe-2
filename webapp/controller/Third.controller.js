sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("my.app.controller.Third", {

        onInit: function () {
            this._loadChartJs().then(() => {
                this._injectCanvas();

                setTimeout(() => {
                    this._drawPieChart("myPieChart1", this._getChart1Data());
                    this._drawPieChart("myPieChart2", this._getChart2Data());
                }, 0);
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
                .setContent("<canvas id='myPieChart1' style='width:100%; height:250%;'></canvas>");

            this.byId("chartContainer2")
                .setContent("<canvas id='myPieChart2' style='width:100%; height:250%;'></canvas>");
        },

        // -----------------------------
        // Chart 1 Daten (mit Titel)
        // -----------------------------
        _getChart1Data: function () {
            return {
                title: "Ausgaben",
                labels: ["Personalkosten", "Material", "Miete", "Marketing", "Sonstiges"],
                values: [40, 30, 15, 10, 5]
            };
        },

        // -----------------------------
        // Chart 2 Daten (mit Titel)
        // -----------------------------
        _getChart2Data: function () {
            return {
                title: "Einnahmen",
                labels: ["Produktverkäufe", "Service", "Wartung", "Lizenzen", "Sonstiges"],
                values: [45, 25, 15, 10, 5]
            };
        },

        // -----------------------------
        // Chart zeichnen (mit Titel)
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
                        // TITEL HIER
                        title: {
                            display: true,
                            text: chartData.title,
                            font: {
                                size: 18,
                                weight: "bold"
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },

                        legend: {
                            position: "bottom",
                            labels: {
                                boxWidth: 12,
                                font: {
                                    size: 15
                                }
                            }
                        }
                    }
                }
            });
        },

        // -----------------------------
        // DEINE ORIGINALEN FUNKTIONEN
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