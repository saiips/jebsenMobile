/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify',  'util/appui', 'appController', 'util/devmode', 'util/commonhelper', 'pages/common/constant',
], function (ko, $, module, amplify, ui, app, devMode, commonHelper, constant) {

    function OrderDetailService() {
        
        this.registerService = function (payload) {
            return registerServiceMessage(payload);
        };        
        
        function registerServiceMessage(payload) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetOrderLineList.P_ORG_ID;
            var P_HEADER_ID = parser.InputGetOrderLineList.P_HEADER_ID;
            
            // define the key for local storage
            var key = constant.ORDER_LINES_KEY + ":" + P_ORG_ID + ":" + P_HEADER_ID;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/orderDetail/orderDetailMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return key;
            }            

            console.log("[Amplify Request] Order Detail - " + key);
            amplify.request({
                resourceId: constant.ORDER_LINES_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            // store the last sync datetime of order detail to local storage
            ui.setLocalStorage(key + ":" + constant.ORDER_DETAIL_SYNC_DATETIME, commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());

            // store the customer list to local storage by amplify
            $.when(defer).done(function (data, textStatus, jqXHR) {
                ui.setLocalStorage(key, data);
                 ui.updateDownloadRequestCount(constant.P_ORDER_DTL_CNT, 1);
            }).fail(function() {
                ui.updateDownloadRequestCount(constant.P_ORDER_DTL_CNT, 1);
            });
            
            return key;
        };

    }

    return new OrderDetailService();
});
