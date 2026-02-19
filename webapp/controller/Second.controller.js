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
    DateFormat
) {
    "use strict";

    return Controller.extend("my.app.controller.Second", {

        onInit: function () {
            const oModel = new JSONModel({});
            oModel.loadData("model/entries.json");
            this.getView().setModel(oModel);

            this._bDateDescending = false; // initial aufsteigend

            oModel.attachRequestCompleted(() => {
                // jedem Eintrag eine eindeutige ID zuweisen
                this._aAllEntries = oModel.getProperty("/entries").map((e, idx) => ({ ...e, __id: idx }));
                this._applySortAndFilter();
            });
        },

        onSortDate: function () {
            this._bDateDescending = !this._bDateDescending;
            this._applySortAndFilter();
        },

        onSortChange: function (oEvent) {
            const sKey = oEvent.getParameter("selectedItem").getKey();
            this._bDateDescending = (sKey === "DOWN");
            this._applySortAndFilter();
        },

        onFilterChange: function () {
            this._applySortAndFilter();
        },

        onMenuSelect: function (oEvent) {
            const selected = oEvent.getParameter("listItem").getTitle();
            switch (selected) {
                case "Dashboard": this.getOwnerComponent().getRouter().navTo("main"); break;
                case "Transaktionen": this.getOwnerComponent().getRouter().navTo("second"); break;
                case "Berichte": this.getOwnerComponent().getRouter().navTo("third"); break;
                case "Einstellungen": this.getOwnerComponent().getRouter().navTo("fourth"); break;
            }
        },

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
                    const oDateObj = oDatePicker.getDateValue();
                    const sFormattedDate = oDateObj ? DateFormat.getDateInstance({ pattern: "dd.MM.yy" }).format(oDateObj) : "";

                    const oData = {
                        date: sFormattedDate,
                        amount: oAmountInput.getValue(),
                        type: oRadioGroup.getSelectedIndex() === 0 ? "Einnahme" : "Ausgabe",
                        description: oDescriptionInput.getValue(),
                        __id: bEdit ? oContext.__id : Date.now() // eindeutige ID
                    };

                    if (bEdit) this._aAllEntries[iIndex] = oData;
                    else this._aAllEntries.push(oData);

                    this._applySortAndFilter();
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

        onAddEntry: function () { this._openEntryDialog(); },

        onEditEntry: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const sId = oContext.getProperty("__id");
            const iIndex = this._aAllEntries.findIndex(e => e.__id === sId);
            const oEntry = this._aAllEntries[iIndex];
            this._openEntryDialog(oEntry, iIndex);
        },

        onDeleteEntry: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const sId = oContext.getProperty("__id");
            const iIndex = this._aAllEntries.findIndex(e => e.__id === sId);

            this._aAllEntries.splice(iIndex, 1);
            this._applySortAndFilter();
        },

        _applySortAndFilter: function () {
            const oModel = this.getView().getModel();
            let aEntries = [...this._aAllEntries];

            const oSelect = this.byId("typeFilter");
            const sKey = oSelect ? oSelect.getSelectedKey() : "ALL";
            if (sKey === "IN") aEntries = aEntries.filter(e => e.type === "Einnahme");
            else if (sKey === "OUT") aEntries = aEntries.filter(e => e.type === "Ausgabe");

            aEntries.sort((a, b) => {
                const dA = this._parseDate(a.date);
                const dB = this._parseDate(b.date);
                return this._bDateDescending ? dB - dA : dA - dB;
            });

            oModel.setProperty("/entries", aEntries);

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
