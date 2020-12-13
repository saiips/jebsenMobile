/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant', 'util/commonhelper'
], function (ko, $, module, amplify, ui, devMode, app, constant, commonHelper) {

    function NewOrderService() {

        this.registerService = function (payload) {
            return registerServiceMessage(payload);
        };

        function registerServiceMessage(payload) {
            var defer = $.Deferred();


            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetPriceList.P_ORG_ID;
            var P_PRICE_LIST_ID = parser.InputGetPriceList.P_PRICE_LIST_ID_TBL.P_PRICE_LIST_ID_TBL_ITEM[0].PRICE_LIST_ID;

            // define the key for local storage
            var key = constant.STANDARD_PRICE_LIST_KEY + ":" + P_ORG_ID + ":" + P_PRICE_LIST_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/newOrder/newOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return key;
            } else {
                console.log("[Amplify Request] Price List (Customer Level) - " + key);
                amplify.request({
                    resourceId: constant.STANDARD_PRICE_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of order history to local storage
                ui.setLocalStorage(key + ":" + constant.NEW_ORDER_LIST_SYNC_DATETIME, commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());                

                // store the customer list to local storage by amplify
                $.when(defer).done(function (data, textStatus, jqXHR) {
                    ui.setLocalStorage(key, data);
                    ui.updateDownloadRequestCount(constant.P_PRICE_CNT, 1);
                }).fail(function () {
                    ui.updateDownloadRequestCount(constant.P_PRICE_CNT, 1);
                });
            }

            return key;
        };


    }

    return new NewOrderService();
});
