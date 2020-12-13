/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'util/commonhelper', 'pages/common/constant',
], function (ko, $, ui, devMode, commonHelper ,constant) {

    function OrderSummaryService() {
        
        function getOrderListMessage(payload, refresh) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputParameters.P_ORG_ID;
            var P_SALESREP_ID = parser.InputParameters.P_SALESREP_ID;
            
            // define the key for local storage
            var key = constant.DAILY_ORDER_SUMMARY_KEY + ":" + P_ORG_ID + ":" + P_SALESREP_ID;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/orderHist/orderHistMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Daily Order Summary - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Daily Order Summary - " + key);
                amplify.request({
                    resourceId: constant.DAILY_ORDER_SUMMARY_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of daily order summary to local storage
                ui.setLocalStorage(key + ":" + constant.DAILY_ORDER_SYNC_DATETIME,
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
        
    }

    return new OrderSummaryService();
});
