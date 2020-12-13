/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'util/commonhelper', 'pages/common/constant',
], function (ko, $, ui, devMode, commonHelper ,constant) {

    function PerformanceService() {

        function getSalesPerformanceMessage(payload) { 
            var defer = $.Deferred();
            console.log("Sales Performance of sales rep payload = " + payload);
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var UserID = parser.InputGetSalesBySalesRep.HeaderInfo.UserID;
            var UserRole = parser.InputGetSalesBySalesRep.HeaderInfo.UserRole;
            var CallerID = parser.InputGetSalesBySalesRep.HeaderInfo.CallerID;
            var P_ORG_ID = parser.InputGetSalesBySalesRep.P_ORG_ID;
            var P_SALESREP_ID = parser.InputGetSalesBySalesRep.P_SALESREP_ID;
            
            // define the key for local storage
            var key = constant.SALES_PERFORMANCE_BY_SALESREP_KEY + ":" + UserID + ":" + UserRole + ":" 
                    + CallerID + ":" + P_ORG_ID + ":" + P_SALESREP_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/performance/performanceMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Sales performance by sales rep - " + key);
            amplify.request({
                resourceId: constant.SALES_PERFORMANCE_BY_SALESREP_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        };
        
        this.getSalesPerformanceMessage = function(payload) {
            return getSalesPerformanceMessage(payload);
        };
        
        
        function getSalesTargetMessage(payload) {
            var defer = $.Deferred();
            console.log("Sales Target Payload = " + payload);
            
            var key = constant.SALES_TARGET_BY_SALESREP_KEY;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/performance/salesTargetMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Sales Target by sales rep - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        }
        
        this.getSalesTargetMessage = function(payload) {
            return getSalesTargetMessage(payload);
        };
    }

    return new PerformanceService();
});