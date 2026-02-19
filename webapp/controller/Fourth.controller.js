sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("my.app.controller.NotFound", {

        onMenuSelect: function (oEvent) {
            const sTitle = oEvent.getParameter("listItem").getTitle();
            const oRouter = this.getOwnerComponent().getRouter();

            if (sTitle === "Dashboard") {
                oRouter.navTo("RouteMain");
            } else if (sTitle === "Berichte") {
                oRouter.navTo("RouteThird");
            } else if (sTitle === "Einstellungen") {
                oRouter.navTo("RouteSettings");
            }
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
                case "Bericht":
                    this.getOwnerComponent().getRouter().navTo("third");
                    break;
                case "Einstellungen":
                    this.getOwnerComponent().getRouter().navTo("fourth");
                    break;
            }
        }

    });
});
