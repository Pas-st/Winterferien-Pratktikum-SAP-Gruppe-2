sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("my.app.controller.Main", {

        onInit: function () {
            // CSS (Untergrund entfernen, keine Scrollbars, Card/Legende) injizieren
            this._ensureStyles();

            // Daten
            this._data = {
                labels:  ["KW01","KW02","KW03","KW04","KW05","KW06","KW07","KW08"],
                income:  [18500, 0, 22200, 15800, 20500, 0, 24800, 0],
                expense: [ 7000,8350, 3000, 2550, 2400,7480,11100,2400],
                profit:  [11500,-8350,19200,13250,18100,-7480,13700,-2400]
            };

            // KPI + Canvas HTML
            this._injectContent();

            // Nach Rendering zeichnen
            const oHtml = this.byId("chartContainer");
            oHtml.addEventDelegate({
                onAfterRendering: () => {
                    this._resizeCanvasToFit();
                    this._drawChart();
                    this._attachCanvasEvents();
                }
            });

            // Resize -> neu berechnen & zeichnen
            this._onResize = () => {
                this._resizeCanvasToFit();
                this._drawChart();
            };
            window.addEventListener("resize", this._onResize);
        },

        onExit: function () {
            if (this._onResize) {
                window.removeEventListener("resize", this._onResize);
            }
        },

        // ---------- Styles: Keine Scrollbars + Untergrund weg + Card/Legende ----------
        _ensureStyles: function () {
            if (document.getElementById("chartInlineStyles")) return;

            const css = `
                /* ==== KEINE SCROLLBARS GLOBAL ==== */
                html, body {
                    height: 100%;
                    overflow: hidden; /* keine Browser-Scrollbars */
                }
                /* SplitContainer Detail komplett ohne Scrollen/Hintergrund */
                .sapMSplitContainerDetail, 
                .sapMSplitContainerDetail .sapUiBodyBG,
                .sapMSplitContainerDetail .sapUiGlobalBackgroundColor {
                    background: transparent !important;
                    overflow: hidden; /* keine inneren Scrollbars */
                }
                /* Page-Hintergründe & Scrolling deaktivieren */
                .noUnderlay.sapMPage,
                .noUnderlay .sapMPageBgStandard,
                .noUnderlay .sapMPageBgTransparent {
                    background: transparent !important;
                }
                .noScroll.sapMPage {
                    overflow: hidden !important;
                }
                /* Inneres Content-Grid der Page ohne Scrollen */
                .noScroll .sapMPageEnableScrolling,
                .noScroll .sapMPageEnableScrolling > section {
                    overflow: hidden !important;
                    height: 100%;
                }

                /* ======= Card (weißer Kasten mit Schatten + runde Ecken) ======= */
                .chartCard {
                    background:#fff;
                    border-radius:12px;
                    box-shadow:0 6px 16px rgba(0,0,0,0.06);
                    padding:20px;
                    /* verhindert, dass äußere Abstände Scrollen erzwingen */
                    box-sizing: border-box;
                }

                /* ======= KPI-Reihe ======= */
                .kpiRow {
                    display:flex;
                    gap:16px;
                    margin-bottom:16px; /* etwas kleiner für Platz */
                    flex-wrap: wrap;
                }
                .smallKpi {
                    flex:1;
                    min-width:220px;
                    padding:16px 12px;
                    text-align:center;
                    box-sizing:border-box;
                    background:#fff;
                    border-radius:12px;
                    box-shadow:0 6px 16px rgba(0,0,0,0.06);
                }
                .kpiLabel { font-size:14px; color:#616161; margin-bottom:8px; font-weight:500; }
                .kpiValue { font-size:36px; font-weight:700; line-height:1; margin:0; }
                .smallKpi.income .kpiValue  { color:#1565C0; }
                .smallKpi.expense .kpiValue { color:#C62828; }
                .smallKpi.profit .kpiValue  { color:#2E7D32; }

                /* ======= Legende (unter dem Chart) ======= */
                .legend-bar {
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    gap:16px;
                    margin-top:8px;
                }
                .legend-item{ display:flex; align-items:center; gap:6px; }
                .legend-line{
                    display:inline-block;
                    width:28px;
                    height:0;
                    border-top:3px solid;
                    vertical-align:middle;
                }
                .legend-line.legend-blue  { border-color:#1565C0; }
                .legend-line.legend-red   { border-color:#C62828; }
                .legend-line.legend-green { border-color:#2E7D32; }
                .legend-line.dashed{ border-top-style:dashed; }

                /* Tooltip (Canvas) */
                .chart-tooltip{
                    position:absolute;
                    background:#333;
                    color:#fff;
                    padding:8px 12px;
                    border-radius:4px;
                    font-size:12px;
                    pointer-events:none;
                    display:none;
                    z-index:1000;
                    white-space:nowrap;
                }
            `;
            const style = document.createElement("style");
            style.id = "chartInlineStyles";
            style.textContent = css;
            document.head.appendChild(style);
        },

        // ---------- KPI + Canvas + Legende einsetzen ----------
        _injectContent: function () {
            if (!this._data) return;

            const sum = arr => arr.reduce((a, b) => a + b, 0);
            const totals = {
                income:  sum(this._data.income),
                expense: sum(this._data.expense),
                profit:  sum(this._data.profit)
            };
            const fmt = n => n.toLocaleString("de-DE") + " €";

            const kpiHtml = `
                <div class="kpiRow">
                    <div class="smallKpi income">
                        <div class="kpiLabel">Gesamteinnahmen</div>
                        <div class="kpiValue">${fmt(101800)}</div>
                    </div>
                    <div class="smallKpi expense">
                        <div class="kpiLabel">Gesamtausgaben</div>
                        <div class="kpiValue">${fmt(45180)}</div>
                    </div>
                    <div class="smallKpi profit">
                        <div class="kpiLabel">Gesamtgewinn</div>
                        <div class="kpiValue">${fmt(56620)}</div>
                    </div>
                </div>
            `;

            const chartHtml = `
                <div class="chartArea" style="position:relative;">
                    <!-- Canvas-Höhe wird dynamisch per JS gesetzt, hier nur Mindesthöhe -->
                    <canvas id="lineCanvas" style="width:100%; display:block; height: 280px;"></canvas>
                    <div id="chartTooltip" class="chart-tooltip"></div>

                    <!-- Legende unter dem Chart -->
                    <div class="legend-bar">
                        <div class="legend-item">
                            <span class="legend-line legend-blue"></span><span>Einnahmen</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-line legend-red"></span><span>Ausgaben</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-line legend-green dashed"></span><span>Gewinn</span>
                        </div>
                    </div>
                </div>
            `;

            this.byId("chartContainer").setContent(kpiHtml + chartHtml);
        },

        // ---------- Canvas-Höhe so setzen, dass nichts scrollt ----------
        _resizeCanvasToFit: function () {
            const pageEl = this.byId("chartPage")?.getDomRef();
            const panelEl = this.byId("chartPanel")?.getDomRef();
            const canvas = document.getElementById("lineCanvas");
            if (!pageEl || !panelEl || !canvas) return;

            // Verfügbare Höhe: Page-Höhe (Inhalt) – vertikale Außenabstände
            const viewportH = pageEl.clientHeight; // sichtbare Höhe der Detail-Page
            // Höhe der KPI-Reihe (falls vorhanden)
            const kpiRow = panelEl.querySelector(".kpiRow");
            const kpiH = kpiRow ? kpiRow.getBoundingClientRect().height : 0;

            // Legende-Höhe (unter dem Chart)
            const legend = panelEl.querySelector(".legend-bar");
            const legendH = legend ? legend.getBoundingClientRect().height : 0;

            // Innenabstände (Card Padding)
            const cardStyle = window.getComputedStyle(panelEl);
            const padTop = parseFloat(cardStyle.paddingTop || "16");
            const padBottom = parseFloat(cardStyle.paddingBottom || "16");

            // Sicherheitsabstand (z. B. Page Content Padding)
            const safe = 24;

            // Berechne die Chart-Höhe, clamp zwischen 180 und 480 Pixel
            const reserved = kpiH + legendH + padTop + padBottom + safe;
            const target = Math.max(180, Math.min(480, viewportH - reserved));

            // Setze die CSS-Höhe (in CSS-Pixeln), _drawChart verwendet diese dann
            canvas.style.height = target + "px";
        },

        // ---------- Chart zeichnen (Canvas) ----------
        _drawChart: function () {
            const canvas = document.getElementById("lineCanvas");
            if (!canvas || !this._data) return;

            // Canvas-Breite/Höhe aus CSS (nach _resizeCanvasToFit) übernehmen + HiDPI
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = Math.max(100, canvas.clientWidth || 600);
            const cssHeight = Math.max(100, canvas.clientHeight || 280);
            canvas.width = Math.floor(cssWidth * dpr);
            canvas.height = Math.floor(cssHeight * dpr);
            const ctx = canvas.getContext("2d");
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const { labels, income, expense, profit } = this._data;

            const padding = { top: 10, right: 16, bottom: 28, left: 48 };
            const width  = cssWidth - padding.left - padding.right;
            const height = cssHeight - padding.top - padding.bottom;

            const allVals = income.concat(expense, profit);
            const minVal = Math.min.apply(null, allVals);
            const maxVal = Math.max.apply(null, allVals);
            const yMin = minVal > 0 ? 0 : Math.floor(minVal * 1.1);
            const yMax = Math.ceil(maxVal * 1.1);

            const xStep = labels.length > 1 ? width / (labels.length - 1) : 0;
            const xAt = (i) => padding.left + i * xStep;
            const yScale = (v) => {
                const t = (v - yMin) / (yMax - yMin);
                return padding.top + (1 - t) * height;
            };

            // Hintergrund der Card ist weiß; Canvas selbst auch weiß
            ctx.clearRect(0, 0, cssWidth, cssHeight);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, cssWidth, cssHeight);

            // Grid + y-Labels
            ctx.font = "12px sans-serif";
            ctx.textBaseline = "middle";
            const ticks = 5;
            for (let t = 0; t <= ticks; t++) {
                const val = yMin + (t * (yMax - yMin) / ticks);
                const y = yScale(val);
                ctx.strokeStyle = "#eeeeee";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(padding.left + width, y);
                ctx.stroke();

                ctx.fillStyle = "#616161";
                const txt = Math.round(val).toString();
                ctx.textAlign = "right";
                ctx.fillText(txt, padding.left - 8, y);
            }

            // Achsen
            ctx.strokeStyle = "#9e9e9e";
            ctx.lineWidth = 1;
            // y-Achse
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, padding.top + height);
            ctx.stroke();
            // x-Achse
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top + height);
            ctx.lineTo(padding.left + width, padding.top + height);
            ctx.stroke();

            // X-Labels
            ctx.fillStyle = "#616161";
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            for (let i = 0; i < labels.length; i++) {
                const x = xAt(i);
                ctx.fillText(labels[i], x, padding.top + height + 16);
            }

            // Linien
            const drawLine = (data, color, dash) => {
                ctx.save();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash(dash || []);
                ctx.beginPath();
                for (let i = 0; i < data.length; i++) {
                    const x = xAt(i);
                    const y = yScale(data[i]);
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.restore();
            };

            drawLine(income,  "#1565C0");
            drawLine(expense, "#C62828");
            drawLine(profit,  "#2E7D32", [6,4]);

            // Tooltip-Daten
            this._chartData = { labels, income, expense, profit, xAt, yScale, padding, cssWidth, cssHeight, xStep };
        },

        // ---------- Tooltip-Events ----------
        _attachCanvasEvents: function () {
            const canvas = document.getElementById("lineCanvas");
            const tooltip = document.getElementById("chartTooltip");
            if (!canvas || !tooltip) return;

            const self = this;
            const pointRadius = 6;

            canvas.addEventListener("mousemove", function (e) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const d = self._chartData;
                if (!d) return;

                const testPoint = (x, y) =>
                    Math.abs(mouseX - x) < pointRadius && Math.abs(mouseY - y) < pointRadius;

                let foundText = null;

                for (let i = 0; i < d.labels.length; i++) {
                    const x = d.xAt(i);
                    if (testPoint(x, d.yScale(d.income[i])))  { foundText = "Einnahmen: " + d.income[i];  break; }
                    if (testPoint(x, d.yScale(d.expense[i]))) { foundText = "Ausgaben: " + d.expense[i]; break; }
                    if (testPoint(x, d.yScale(d.profit[i])))  { foundText = "Gewinn: "   + d.profit[i];  break; }
                }

                if (foundText) {
                    tooltip.textContent = foundText;
                    tooltip.style.display = "block";
                    tooltip.style.left = (mouseX + 10) + "px";
                    tooltip.style.top  = (mouseY - 30) + "px";
                } else {
                    tooltip.style.display = "none";
                }
            });

            canvas.addEventListener("mouseleave", () => {
                tooltip.style.display = "none";
            });
        },

        // Navigation
        onMenuSelect: function (oEvent) {
            const sTitle = oEvent.getParameter("listItem").getTitle();
            const oRouter = this.getOwnerComponent().getRouter();

            if (sTitle === "Dashboard")     { oRouter.navTo("main"); }
            if (sTitle === "Transaktionen") { oRouter.navTo("second"); }
            if (sTitle === "Berichte")      { oRouter.navTo("third"); }
        }
    });
});
