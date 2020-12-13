/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'appController', 'util/appui', 'util/devmode', 'util/commonhelper', 'pages/common/constant'
], function (ko, $, module, amplify, app, ui, devMode, commonHelper, constant) {

    function OrderDetailService() {
        
        function getOrderDetailMessage(payload, refresh) {
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
                return $.when(defer);
            }            
            
            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Order Detail - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Order Detail - " + key);
                amplify.request({
                    resourceId: constant.ORDER_LINES_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of order detail to local storage
                ui.setLocalStorage(key + ":" + constant.ORDER_DETAIL_SYNC_DATETIME, 
                    commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());

                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }
            return $.when(defer);
        };
        
        
        function getDataSyncMessage() {
            var defer = $.Deferred();

            var data = app.moduleConfig.params.rootContext.savedOrderLine;
            
            defer.resolve(data, {status: 200});

            return $.when(defer);
        };
        

        this.getOrderDetailMessage = function (payload) {
            return getOrderDetailMessage(payload);
        };
        
        this.refreshOrderDetailMessage = function (payload) {
            return getOrderDetailMessage(payload, true);
        };
        
        this.getDataSyncMessage = function() {
            return getDataSyncMessage();
        };
    }

    return new OrderDetailService();
});
