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
    "sap/ui/model/Sorter",
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
    Sorter,
    DateFormat
) {
    "use strict";

    return Controller.extend("my.app.controller.Second", {

        onInit: function () {
            const oModel = new JSONModel({});
            oModel.loadData("model/entries.json");
            this.getView().setModel(oModel);

            // Sortierrichtung Datum initial
            this._bDateDescending = false;
        },

        // =========================
        // Datum sortieren
        // =========================
        onSortDate: function () {
            const oTable = this.byId("entryTable");
            const oBinding = oTable.getBinding("items");

            // Richtung umschalten
            this._bDateDescending = !this._bDateDescending;

            // dd.MM.yy → Date für Sortierung
            const oSorter = new Sorter("date", this._bDateDescending, false, function(sDate) {
                if (!sDate) return new Date(0);
                const aParts = sDate.split(".");
                return new Date(+("20"+aParts[2]), aParts[1]-1, +aParts[0]);
            });

            oBinding.sort(oSorter);

            // Caret im Header anzeigen
            const oColumn = this.byId("dateColumn");
            if (oColumn) {
                oColumn.setSortIndicator(this._bDateDescending ? "Descending" : "Ascending");
            }
        },

        // =========================
        // Filter
        // =========================
        onFilterChange: function (oEvent) {
            const sKey = oEvent.getSource().getSelectedKey();
            const oTable = this.byId("entryTable");
            const oBinding = oTable.getBinding("items");

            let aFilters = [];

            if (sKey === "IN") {
                aFilters.push(new Filter("type", FilterOperator.EQ, "Einnahme"));
            } else if (sKey === "OUT") {
                aFilters.push(new Filter("type", FilterOperator.EQ, "Ausgabe"));
            }

            oBinding.filter(aFilters);
        },

        // =========================
        // Menü-Auswahl
        // =========================
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
        },

        // =========================
        // Dialog (Add/Edit)
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

            // Dialog erstellen
            const oDialog = new Dialog({
                title: bEdit ? "Eintrag bearbeiten" : "Eintrag hinzufügen",
                content: new VerticalLayout({
                    content: [
                        new Label({ text: "Datum" }),
                        oDatePicker,
                        new Label({ text: "Betrag (€)" }),
                        oAmountInput,
                        new Label({ text: "Beschreibung" }),
                        oDescriptionInput,
                        new Label({ text: "Typ" }),
                        oRadioGroup
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

                    if (bEdit) {
                        aEntries[iIndex] = oData;
                    } else {
                        aEntries.push(oData);
                    }

                    oModel.setProperty("/entries", aEntries);

                    // Filter neu anwenden
                    const oSelect = this.byId("typeFilter");
                    if (oSelect) {
                        this.onFilterChange({ getSource: () => oSelect });
                    }

                    oDialog.close();
                }
            });

            const oCancelButton = new Button({
                text: "Abbrechen",
                press: () => oDialog.close()
            });

            oDialog.setBeginButton(oSaveButton);
            oDialog.setEndButton(oCancelButton);

            // Validierung
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
        // Button Handler
        // =========================
        onAddEntry: function () { this._openEntryDialog(); },

        onEditEntry: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getParent();
            const oTable = this.byId("entryTable");
            const iIndex = oTable.indexOfItem(oItem);
            const oEntry = this.getView().getModel().getProperty("/entries")[iIndex];
            this._openEntryDialog(oEntry, iIndex);
        },

        onDeleteEntry: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getParent();
            const oTable = this.byId("entryTable");
            const iIndex = oTable.indexOfItem(oItem);

            const oModel = this.getView().getModel();
            const aEntries = oModel.getProperty("/entries");
            aEntries.splice(iIndex, 1);
            oModel.setProperty("/entries", aEntries);

            // Filter nach Löschen neu anwenden
            const oSelect = this.byId("typeFilter");
            if (oSelect) {
                this.onFilterChange({ getSource: () => oSelect });
            }
        }

    });
});
