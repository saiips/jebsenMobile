/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant', 'util/commonhelper'
], function (ko, $, amplify, ui, devMode, app, constant, commonHelper) {

    function DeliveryDetailService() {

        this.registerService = function (payload) {
            return registerServiceMessage(payload);
        };

        function registerServiceMessage(payload) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var UserID = parser.InputGetShipmentDetails.HeaderInfo.UserID;
            var UserRole = parser.InputGetShipmentDetails.HeaderInfo.UserRole;
            var CallerID = parser.InputGetShipmentDetails.HeaderInfo.CallerID;
            var P_ORG_ID = parser.InputGetShipmentDetails.P_ORG_ID;
            var P_DELIVERY_NUM = parser.InputGetShipmentDetails.P_DELIVERY_NUM;

            // define the key for local storage
            var key = constant.DELIVERY_DETAIL_KEY + ":" + UserID + ":" + UserRole + ":"
                    + CallerID + ":" + P_ORG_ID + ":" + P_DELIVERY_NUM;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/delivery/deliveryDetailMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return key;
            } else {

                console.log("[Amplify Request] Delivery Detail - " + key);
                amplify.request({
                    resourceId: constant.DELIVERY_DETAIL_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the delivery detail to local storage by amplify
                $.when(defer).done(function (data, textStatus, jqXHR) {
                    ui.setLocalStorage(key, data);
                    ui.updateDownloadRequestCount(constant.P_DELIVERY_DTL_CNT, 1);
                }).fail(function () {
                    ui.updateDownloadRequestCount(constant.P_DELIVERY_DTL_CNT, 1);
                });

            }

            return key;
        }

    }

    return new DeliveryDetailService();
});
