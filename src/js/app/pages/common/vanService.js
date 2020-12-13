/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['moment', 'knockout', 'jquery', 'amplify', 'util/devmode', 'appController'
], function (moment, ko, $, amplify, devMode, app) {


    function VanService() {
        
        this.getPayload = function(licenseNo) {
            var user = app.moduleConfig.params.rootContext.userProfile;
            var payload = JSON.stringify({
                "InputCreateVan": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },
                    "LicenseNo": licenseNo,
                    "Role": "JLA",
                    "Environment": "prd",
                    "Active": "Y"
                }
            });
            return payload;
        };
        
        this.addVan = function(payload) {
            var defer = $.Deferred();
            
            var key = "addVans";
            
            console.log("[Amplify Request] add Van Request - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
            
            return $.when(defer);
        };
        
        this.getAllVans = function() {
            var defer = $.Deferred();
            
            var user = app.moduleConfig.params.rootContext.userProfile;
            
            var key = "getAllVans";
            
            var payload = JSON.stringify({
                "InputGetVans": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    }
                }
            });
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/common/vanServiceMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }            
            
            console.log("[Amplify Request] Get all Vans Request - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
            
            return $.when(defer);            
        };
        
        
    }

    return new VanService();
});
