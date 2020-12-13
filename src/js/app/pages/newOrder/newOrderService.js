/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant', 'util/commonhelper'
], function(ko, $, module, amplify, ui, devMode, app, constant, commonHelper) {

    function NewOrderService() {
        
        function getPriceListMessage(payload, refresh) {
            var defer = $.Deferred();

            var priceListId = ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.selCustomerProfile.priceListId);

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
                return $.when(defer);
            }

            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Price List - " + key);
                defer.resolve(data, {status: 200});
            } else {
                console.log("[Amplify Request] Price List - " + key);
                amplify.request({
                    resourceId: constant.STANDARD_PRICE_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of order history to local storage
                ui.setLocalStorage(key + ":" + constant.NEW_ORDER_LIST_SYNC_DATETIME, 
                    commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());                

                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }
            return $.when(defer);
        };
        

        this.getPriceListMessage = function (payload) {
            return getPriceListMessage(payload, false);
        };          
        
        this.refreshPriceListMessage = function (payload) {
            return getPriceListMessage(payload, true);
        };        
        
        function getTopItemListMessage(payload, refresh) {
            var defer = $.Deferred();

            console.log("getTopItemListMessage Payload = " + ko.toJS(payload));

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetTop10PriceList.P_ORG_ID;
            var P_SHIP_TO_ORG_ID =  parser.InputGetTop10PriceList.P_SHIP_TO_ORG_ID;            
            var P_PRICE_LIST_ID = parser.InputGetTop10PriceList.P_PRICE_LIST_ID;


            // define the key for local storage
            var key = constant.TOP_ITEM_LIST_KEY + ":" + P_ORG_ID + ":" + P_SHIP_TO_ORG_ID + ":" + P_PRICE_LIST_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/newOrder/newOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Top Item List - " + key);
                defer.resolve(data, {status: 200});
            } else {
                console.log("[Amplify Request] Top Item List - " + key);
                amplify.request({
                    resourceId: constant.TOP_ITEM_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of order history to local storage
                ui.setLocalStorage(key + ":" + constant.TOP_ITEM_LIST_SYNC_DATATIME, 
                    commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());                

                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }
            return $.when(defer);
        };        
        
        this.getTopItemListMessage = function(payload) {
            return getTopItemListMessage(payload, false);
        };
        
        this.refreshTopItemListMessage = function(payload) {
            return getTopItemListMessage(payload, true);
        };
        
        
    }

    return new NewOrderService();
});
