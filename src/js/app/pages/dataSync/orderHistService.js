/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/appui', 'appController', 'util/devmode', 'util/commonhelper', 'pages/common/constant',   'pages/dataSync/orderDetailService'
], function (ko, $, ui, app, devMode, commonHelper, constant, orderDetailService) {

    function OrderHistService() {


        this.registerService = function (payload) {
            return registerServiceMessage(payload);
        };

        function registerServiceMessage(payload) {
            var defer = $.Deferred();

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputParameters.P_ORG_ID;
            var P_ACCOUNT_NUMBER = parser.InputParameters.P_ACCOUNT_NUMBER;
            var P_SHIP_TO_ORG_ID = parser.InputParameters.P_SHIP_TO_ORG_ID;

            // define the key for local storage
            var key = constant.ORDER_LIST_KEY + ":" + P_ORG_ID + ":" + P_ACCOUNT_NUMBER + ":" + P_SHIP_TO_ORG_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/orderHist/orderHistMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
            } else {

                console.log("[Amplify Request] Order History List - " + key);
                amplify.request({
                    resourceId: constant.ORDER_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the last sync datetime of order history to local storage
                ui.setLocalStorage(key + ":" + constant.ORDER_HISTORY_SYNC_DATETIME, commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());

                // store the customer list to local storage by amplify
                $.when(defer).done(function (data, textStatus, jqXHR) {
                    ui.setLocalStorage(key, data);
                    var respJSON = data['P_ORDER_TBL_ITEM'];
                    ui.updateDownloadRequestCount(constant.P_ORDER_CNT, 1);

                    // order detail - skip this part
                    /*
                    ko.utils.arrayForEach(respJSON, function (item) {
                        var user = app.moduleConfig.params.rootContext.userProfile;
                        var payload = JSON.stringify({
                            "InputGetOrderLineList": {
                                "HeaderInfo": {
                                    "UserID": user.username,
                                    "UserRole": user.salesRole,
                                    "CallerID": ""
                                },
                                "P_ORG_ID": user.orgUnitId,
                                "P_HEADER_ID": item.OE_HEADER_ID
                            }
                        });
                        orderDetailService.registerService(payload);
                    });*/

                }).fail(function () {
                    ui.updateDownloadRequestCount(constant.P_ORDER_CNT, 1);
                });
            }

            return key;
        };
    }

    return new OrderHistService();
});
