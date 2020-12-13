/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'util/commonhelper', 'pages/common/constant',
], function (ko, $, ui, devMode, commonHelper ,constant) {

    function ProfileService() {
        
        function getProfileMessage(payload) {
            var defer = $.Deferred();
            console.log("profile payload = " + payload);
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetCustomerAging.P_ORG_ID;
            var P_ACCOUNT_NUMBER = parser.InputGetCustomerAging.P_ACCOUNT_NUMBER;
            var P_SHIP_TO_SITE_USE_ID = parser.InputGetCustomerAging.P_SHIP_TO_SITE_USE_ID;
            
            // define the key for local storage
            var key = constant.PROFILE_KEY + ":" + P_ORG_ID + ":" + P_ACCOUNT_NUMBER + ":" + P_SHIP_TO_SITE_USE_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/customer/profileMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] profile - " + key);
            amplify.request({
                resourceId: constant.PROFILE_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        };
        
        this.getProfileMessage = function(payload) {
            return getProfileMessage(payload);
        };
        
        function getSalesPerformanceMessage(payload) { 
            var defer = $.Deferred();
            console.log("Sales Performance of customer payload = " + payload);
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var UserID = parser.InputGetSalesByCustomer.HeaderInfo.UserID;
            var UserRole = parser.InputGetSalesByCustomer.HeaderInfo.UserRole;
            var CallerID = parser.InputGetSalesByCustomer.HeaderInfo.CallerID;
            var P_ORG_ID = parser.InputGetSalesByCustomer.P_ORG_ID;
            var P_SHIP_TO_ORG_ID = parser.InputGetSalesByCustomer.P_SHIP_TO_ORG_ID;
            
            // define the key for local storage
            var key = constant.SALES_PERFORMANCE_BY_CUSTOMER_KEY + ":" + UserID + ":" + UserRole + ":" 
                    + CallerID + ":" + P_ORG_ID + ":" + P_SHIP_TO_ORG_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/customer/salesPerformanceMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Sales performance by customer - " + key);
            amplify.request({
                resourceId: constant.SALES_PERFORMANCE_BY_CUSTOMER_KEY,
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
            
            var key = constant.SALES_TARGET_BY_SHIP2SITE_KEY;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/performance/salesTargetMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Sales Target by ship to site id - " + key);
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

    return new ProfileService();
});
