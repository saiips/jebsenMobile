/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/devmode', 'pages/common/constant', 'util/commonhelper', 'appController'
], function (ko, $, module, amplify, devMode, constant, commonHelper, app) {

    function ModifierService() {
        
        function getOrderTypeId(orgUnitId) {
            if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                return constant.ORDER_TYPE_ID_WINE;
            } else if (orgUnitId == constant.ORG_UNIT_ID_BEER) {
                return constant.ORDER_TYPE_ID_BEER;
            } else {
                return 0;
            }
        }        
        
        this.getOrderTypeId = function(orgUnitId) {
            return getOrderTypeId(orgUnitId);
        };
        
        function getModifierMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.MODIFIER_LIST_KEY;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/modifier/modifierServiceMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Get Modifier - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };

        this.getModifierMessage = function (payload) {
            return getModifierMessage(payload);
        };
        
    }

    return new ModifierService();
});