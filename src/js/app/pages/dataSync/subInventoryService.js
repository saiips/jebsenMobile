/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant'
], function(ko, $, amplify, ui, devMode, app, constant) {

    function SubInventoryService() {
        
        this.registerService = function() {
            return registerServiceMessage();
        };
        
        this.getData = function(key) {
              return ui.getLocalStorage(key);
        };
        
        
        function getPayload() {
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            var user = app.moduleConfig.params.rootContext.userProfile;
            
            var payload;
            if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                payload = JSON.stringify({
                    "InputParameters": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },                        
                        "P_ORG_ID": constant.IO_ID_2899
                    }
                });
            } else {
                payload = JSON.stringify({
                    "InputParameters": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },                        
                        "P_ORG_ID": constant.IO_ID_2898
                    }
                });
            }            
            return payload;
        }            
        
        function registerServiceMessage() {
            var defer = $.Deferred();

            // get the default payload
            var payload = getPayload();

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputParameters.P_ORG_ID;

            // define the key for local storage
            var key =constant.P_SUB_INVENTORY_KEY + ":" + P_ORG_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/stockInquiry/subInventoryMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
            } else {

                console.log("[Amplify Request] SubInventory - " + key);
                amplify.request({
                    resourceId: constant.P_SUB_INVENTORY_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the price list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                    ui.updateDownloadRequestCount(constant.P_SUB_INVENTORY_CNT, 1);
                }).fail(function () {
                    ui.updateDownloadRequestCount(constant.P_SUB_INVENTORY_CNT, 1);
                });
                
            }
        };
    }

    return new SubInventoryService();
});
