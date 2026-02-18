sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("my.app.controller.Second", {

        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }

    });
});
