/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'pages/common/constant', 'util/devmode', 'util/appui', 'util/commonhelper'
], function (ko, $, module, amplify ,constant, devMode, ui, commonHelper) {

    function QuotationService() {
        
        function getQuotationHistMessage(payload, refresh) {
            var defer = $.Deferred();
            console.log("Quotation List payload : " + ko.toJS(payload));
            
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetQuotation.P_ORG_ID;
            var P_SHIP_TO_ORG_ID = parser.InputGetQuotation.P_SHIP_TO_ORG_ID;
            
            // define the key for local storage
            var key = constant.QUOTATION_LIST_KEY + ":" + P_ORG_ID + ":" + P_SHIP_TO_ORG_ID ;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/quotation/quotationMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Quotation List - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Quotation List - " + key);
                amplify.request({
                    resourceId: constant.QUOTATION_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of customer list to local storage
                ui.setLocalStorage(key + ":" + constant.QUOTATION_LIST_SYNC_DATETIME, commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());                

                // store the quotation list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }
            return $.when(defer);
        };
        
        this.getQuotationHistMessage = function(payload) {
            return getQuotationHistMessage(payload, false);
        };
        
        this.refreshQuotationHistMessage = function(payload) {
            return getQuotationHistMessage(payload, true);
        };        
        
        function getQuotationItemMessage(payload) {
            var defer = $.Deferred();
            console.log("Quotation Line payload : " + ko.toJS(payload));
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetQuotationLines.P_ORG_ID;
            var P_HEADER_ID = parser.InputGetQuotationLines.P_HEADER_ID;
            
            // define the key for local storage
            var key = constant.QUOTATION_DETAIL_KEY + ":" + P_ORG_ID + ":" + P_HEADER_ID ;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/quotation/quotationLineMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] Quotation Line - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Quotation Line - " + key);
                amplify.request({
                    resourceId: constant.QUOTATION_DETAIL_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the quotation line to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }
            return $.when(defer);
        };
        
        this.getQuotationItemMessage = function (payload) {
            return getQuotationItemMessage(payload);
        };

    }

    return new QuotationService();
});
