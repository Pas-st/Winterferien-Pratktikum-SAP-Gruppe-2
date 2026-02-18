sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("my.app.controller.Second", {

        onGoSecond: function () {
            this.getOwnerComponent().getRouter().navTo("second");
        },

        onGoThird: function () {
            this.getOwnerComponent().getRouter().navTo("third");
        },

        // Menü-Auswahl wie in Page 1
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