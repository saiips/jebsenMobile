/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant', 'util/commonhelper'
], function(ko, $, amplify, ui, devMode, app, constant, commonHelper) {

    function AdminService() {
        
        this.registerWineSalesPerson = function() {
            return registerSalesPersonServiceMessage(constant.ORG_UNIT_ID_WINE);
        };        
     
        this.registerBeerSalesPerson = function() {
            return registerSalesPersonServiceMessage(constant.ORG_UNIT_ID_BEER);
        };                

        
        function getSalesRepListPayload(orgUnitId) {
            var payload;
            var user = app.moduleConfig.params.rootContext.userProfile;
            payload = JSON.stringify({
                "InputGetSalesERPName": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },
                    "P_ORG_ID": orgUnitId
                }
            });
            return payload;
        }
        
        function registerSalesPersonServiceMessage(orgUnitId) {
            var defer = $.Deferred();
            
            var key = constant.SALES_REP_LIST_KEY + ":" + orgUnitId;
            
            var payload = getSalesRepListPayload(orgUnitId);
            
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/salesRepListMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }         
            

            console.log("[Amplify Request] Sales Rep List - " + key);
            amplify.request({
                resourceId: constant.SALES_REP_LIST_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            // store the customer list to local storage by amplify
            $.when(defer).done(function (d, textStatus, jqXHR) {
                ui.setLocalStorage(key, d);
            });

            return $.when(defer);
        }        
    }

    return new AdminService();
});
