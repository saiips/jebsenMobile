/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant'
], function (ko, $, amplify, ui, devMode, app, constant) {

    function ShipmentMethodService() {


        this.registerService = function () {
            return registerServiceMessage();
        };

        this.getData = function (key) {
            return ui.getLocalStorage(key);
        };

        function getPayload() {
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
        
            var payload = JSON.stringify({
                "InputGetShippingMethod": {
                    "HeaderInfo": {
                        "UserID": userName,
                        "UserRole": salesRole,
                        "CallerID": ""
                    }
                }
            });
            return payload;
        }

        function registerServiceMessage() {
            var defer = $.Deferred();

            // get the default payload
            var payload = getPayload();

            // define the key for local storage
            var key = constant.P_SHIPMENT_METHOD_KEY;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/stockInquiry/shipmentMethodMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
            } else {

                console.log("[Amplify Request] Shipment Method  - " + key);
                amplify.request({
                    resourceId: constant.P_SHIPMENT_METHOD_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the price list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                    ui.updateDownloadRequestCount(constant.P_SHIPMENT_METHOD_CNT, 1);
                }).fail(function () {
                    ui.updateDownloadRequestCount(constant.P_SHIPMENT_METHOD_CNT, 1);
                });
            }
        } 
        
    }

    return new ShipmentMethodService();
});
