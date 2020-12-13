/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'util/commonhelper', 'pages/common/constant',
], function (ko, $, ui, devMode, commonHelper ,constant) {

    function OrderSummaryService() {
        
        function getOrderListMessage(payload, refresh) {
            var defer = $.Deferred();
            
            // define the key for local storage
            var key = constant.FAILED_ORDER_LIST_KEY;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/reInitateOrder/reInitateOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Re-Initiate Order List - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Re-Initiate Order List - " + key);
                amplify.request({
                    resourceId: key,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of re-initiate order list to local storage
                ui.setLocalStorage(key + ":" + constant.RE_INITIATE_ORDER_SYNC_DATETIME,
                    commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());  

                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }
            
            return $.when(defer);
        };
        
        this.getOrderListMessage = function(payload) {
            return getOrderListMessage(payload);
        };     
        
        this.refreshOrderListMessage = function(payload) {
            return getOrderListMessage(payload, true);
        };  
        
        function cancelFailedOrderMessage(payload) {
            var defer = $.Deferred();
            
            // define the key for local storage
            var key = constant.CANCEL_FAILED_ORDER_KEY;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/reInitateOrder/cancelFailedOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Cancel Failed Order - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);            
        }
        
        this.cancelFailedOrderMessage = function(payload) {
            return cancelFailedOrderMessage(payload);
        };
        
        function reInitiateFailedOrderMessage(payload) {
            var defer = $.Deferred();
            
            // define the key for local storage
            var key = constant.RE_INITIATE_ORDER_KEY;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/reInitateOrder/cancelFailedOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Re-Initate Failed Order - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);               
        }
        
        this.reInitiateFailedOrderMessage = function(payload) {
            return reInitiateFailedOrderMessage(payload);
        };
        
    }

    return new OrderSummaryService();
});
