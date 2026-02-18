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
    "sap/ui/model/json/JSONModel"
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
    JSONModel
) {
    "use strict";

    return Controller.extend("my.app.controller.Second", {

        onInit: function () {
            this.getView().setModel(new JSONModel({
                entries: []
            }));
        },

        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        },

        // =========================
        // ADD / EDIT DIALOG
        // =========================
        _openEntryDialog: function (oContext, iIndex) {
            const oView = this.getView();
            const bEdit = !!oContext;

            const oDatePicker = new DatePicker({
                value: bEdit ? oContext.date : ""
            });

            const oAmountInput = new Input({
                type: "Number",
                value: bEdit ? oContext.amount : ""
            });

            const oDescriptionInput = new Input({
                value: bEdit ? oContext.description : ""
            });

            const oRadioGroup = new RadioButtonGroup({
                selectedIndex: bEdit
                    ? (oContext.type === "Einnahme" ? 0 : 1)
                    : -1,
                buttons: [
                    new RadioButton({ text: "Einnahme" }),
                    new RadioButton({ text: "Ausgabe" })
                ]
            });

            const oSaveButton = new Button({
                text: "Speichern",
                enabled: false,
                type: "Emphasized",
                press: () => {
                    const oModel = oView.getModel();
                    const aEntries = oModel.getProperty("/entries");

                    const oData = {
                        date: oDatePicker.getValue(),
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
                    oDialog.close();
                }
            });

            const validate = () => {
                const bValid =
                    oDatePicker.getValue() &&
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

            const oDialog = new Dialog({
                title: bEdit ? "Eintrag bearbeiten" : "Eintrag hinzufügen",
                content: new VerticalLayout({
                    content: [
                        new Label({ text: "Datum" }),
                        oDatePicker,
                        new Label({ text: "Betrag" }),
                        oAmountInput,
                        new Label({ text: "Beschreibung" }),
                        oDescriptionInput,
                        new Label({ text: "Typ" }),
                        oRadioGroup
                    ]
                }),
                beginButton: oSaveButton,
                endButton: new Button({
                    text: "Abbrechen",
                    press: () => oDialog.close()
                })
            });

            oDialog.open();
        },

        // =========================
        // BUTTON HANDLER
        // =========================
        onAddEntry: function () {
            this._openEntryDialog();
        },

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
        }
    });
});
