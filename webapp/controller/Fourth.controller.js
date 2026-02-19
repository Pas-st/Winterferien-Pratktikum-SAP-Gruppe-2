sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("my.app.controller.NotFound", {

        //Navigation über das Menü
        onMenuSelect: function (oEvent) {
            const selected = oEvent.getParameter("listItem").getTitle();
            switch (selected) {
                case "Dashboard": this.getOwnerComponent().getRouter().navTo("main"); break;
                case "Transaktionen": this.getOwnerComponent().getRouter().navTo("second"); break;
                case "Berichte": this.getOwnerComponent().getRouter().navTo("third"); break;
                case "Einstellungen": this.getOwnerComponent().getRouter().navTo("fourth"); break;
            }
        },
    });
});
