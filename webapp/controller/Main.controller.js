sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("my.app.controller.Main", {

        onGoSecond: function () {
            this.getOwnerComponent().getRouter().navTo("second");
        },

        onGoThird: function () {
            this.getOwnerComponent().getRouter().navTo("third");
        }

    });
});
