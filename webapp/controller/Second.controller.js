sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/DatePicker",
    "sap/m/Input",
    "sap/m/RadioButtonGroup",
    "sap/m/RadioButton",
    "sap/m/Label",
    "sap/ui/layout/VerticalLayout",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat"
], function (
    Controller,
    Dialog,
    Button,
    DatePicker,
    Input,
    RadioButtonGroup,
    RadioButton,
    Label,
    VerticalLayout,
    JSONModel,
    Filter,
    FilterOperator,
    DateFormat
) {
    "use strict";

    return Controller.extend("my.app.controller.Second", {

        onInit: function () {
            const oModel = new JSONModel({});
            oModel.loadData("model/entries.json");
            this.getView().setModel(oModel);

            this._bDateDescending = false; // initial aufsteigend
        },

        // =========================
        // Datum sortieren (Header Click)
        // =========================
        onSortDate: function () {
            this._bDateDescending = !this._bDateDescending;
            this._animateSortEntries();
        },

        // =========================
        // Filter ändern
        // =========================
        onFilterChange: function () {
            this._animateSortEntries();
        },

        // =========================
        // Menü Auswahl
        // =========================
        onMenuSelect: function (oEvent) {
            const selected = oEvent.getParameter("listItem").getTitle();
            switch (selected) {
                case "Dashboard": this.getOwnerComponent().getRouter().navTo("main"); break;
                case "Transaktionen": this.getOwnerComponent().getRouter().navTo("second"); break;
                case "Berichte": this.getOwnerComponent().getRouter().navTo("third"); break;
            }
        },

        // =========================
        // Add / Edit Dialog
        // =========================
        _openEntryDialog: function (oContext, iIndex) {
            const oView = this.getView();
            const bEdit = !!oContext;

            let oDateValue = null;
            if (bEdit && oContext.date) {
                const aParts = oContext.date.split(".");
                oDateValue = new Date(+("20"+aParts[2]), aParts[1]-1, +aParts[0]);
            }

            const oDatePicker = new DatePicker({ dateValue: oDateValue });
            const oAmountInput = new Input({ type: "Number", value: bEdit ? oContext.amount : "" });
            const oDescriptionInput = new Input({ value: bEdit ? oContext.description : "" });
            const oRadioGroup = new RadioButtonGroup({
                selectedIndex: bEdit ? (oContext.type === "Einnahme" ? 0 : 1) : -1,
                buttons: [ new RadioButton({ text: "Einnahme" }), new RadioButton({ text: "Ausgabe" }) ]
            });

            const oDialog = new Dialog({
                title: bEdit ? "Eintrag bearbeiten" : "Eintrag hinzufügen",
                content: new VerticalLayout({
                    content: [
                        new Label({ text: "Datum" }), oDatePicker,
                        new Label({ text: "Betrag (€)" }), oAmountInput,
                        new Label({ text: "Beschreibung" }), oDescriptionInput,
                        new Label({ text: "Typ" }), oRadioGroup
                    ]
                })
            });

            const oSaveButton = new Button({
                text: "Speichern",
                enabled: false,
                type: "Emphasized",
                press: () => {
                    const oModel = oView.getModel();
                    const aEntries = oModel.getProperty("/entries");

                    const oDateObj = oDatePicker.getDateValue();
                    const oDateFormat = DateFormat.getDateInstance({ pattern: "dd.MM.yy" });
                    const sFormattedDate = oDateObj ? oDateFormat.format(oDateObj) : "";

                    const oData = {
                        date: sFormattedDate,
                        amount: oAmountInput.getValue(),
                        type: oRadioGroup.getSelectedIndex() === 0 ? "Einnahme" : "Ausgabe",
                        description: oDescriptionInput.getValue()
                    };

                    if (bEdit) aEntries[iIndex] = oData;
                    else aEntries.push(oData);

                    oModel.setProperty("/entries", aEntries);

                    // Tabelle animiert sortieren + Filter anwenden
                    this._animateSortEntries();

                    oDialog.close();
                }
            });

            oDialog.setBeginButton(oSaveButton);
            oDialog.setEndButton(new Button({ text: "Abbrechen", press: () => oDialog.close() }));

            const validate = () => {
                const bValid =
                    oDatePicker.getDateValue() &&
                    oAmountInput.getValue() &&
                    oDescriptionInput.getValue() &&
                    oRadioGroup.getSelectedIndex() !== -1;
                oSaveButton.setEnabled(!!bValid);
            };

            oDatePicker.attachChange(validate);
            oAmountInput.attachLiveChange(validate);
            oDescriptionInput.attachLiveChange(validate);
            oRadioGroup.attachSelect(validate);
            validate();

            oDialog.open();
        },

        // =========================
        // Delete Handler
        // =========================
        onDeleteEntry: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getParent();
            const oTable = this.byId("entryTable");
            const iIndex = oTable.indexOfItem(oItem);

            const oModel = this.getView().getModel();
            const aEntries = oModel.getProperty("/entries");
            aEntries.splice(iIndex, 1);
            oModel.setProperty("/entries", aEntries);

            this._animateSortEntries();
        },

        onAddEntry: function () { this._openEntryDialog(); },
        onEditEntry: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getParent();
            const oTable = this.byId("entryTable");
            const iIndex = oTable.indexOfItem(oItem);
            const oEntry = this.getView().getModel().getProperty("/entries")[iIndex];
            this._openEntryDialog(oEntry, iIndex);
        },

        // =========================
        // Animierte Sortierung + Filter
        // =========================
        _animateSortEntries: function (iStepDelay = 1) {
            const oModel = this.getView().getModel();
            let aEntries = [...oModel.getProperty("/entries")];

            // 1️⃣ Filter anwenden
            const oSelect = this.byId("typeFilter");
            let sKey = "ALL";
            if (oSelect) sKey = oSelect.getSelectedKey();
            if (sKey === "IN") aEntries = aEntries.filter(e => e.type === "Einnahme");
            else if (sKey === "OUT") aEntries = aEntries.filter(e => e.type === "Ausgabe");

            // 2️⃣ Sortieren animiert
            let aSorted = [];
            let i = 0;
            const step = () => {
                if (i >= aEntries.length) return;

                const current = aEntries[i];
                let inserted = false;
                for (let j = 0; j < aSorted.length; j++) {
                    const dateCurrent = this._parseDate(current.date);
                    const dateSorted = this._parseDate(aSorted[j].date);
                    if ((this._bDateDescending && dateCurrent > dateSorted) ||
                        (!this._bDateDescending && dateCurrent < dateSorted)) {
                        aSorted.splice(j, 0, current);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) aSorted.push(current);

                oModel.setProperty("/entries", [...aSorted, ...aEntries.slice(i+1)]);

                i++;
                setTimeout(step, iStepDelay);
            };
            step();

            // 3️⃣ Caret setzen
            const oColumn = this.byId("dateColumn");
            if (oColumn) oColumn.setSortIndicator(this._bDateDescending ? "Descending" : "Ascending");
        },

        _parseDate: function (sDate) {
            if (!sDate) return new Date(0);
            const a = sDate.split(".");
            return new Date(+("20"+a[2]), a[1]-1, +a[0]);
        }

    });
});
