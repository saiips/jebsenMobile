/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant', 'util/commonhelper'
], function(ko, $, amplify, ui, devMode, app, constant, commonHelper) {

    function PriceListService() {
        
        this.registerService = function() {
            return registerServiceMessage(null);
        };
        
        this.registerWineService = function() {
            var payload = getPayload(constant.ORG_UNIT_ID_WINE);
            return registerServiceMessage(payload);
        };
        
        this.registerBeerService = function() {
            var payload = getPayload(constant.ORG_UNIT_ID_BEER);
            return registerServiceMessage(payload);
        };
        
        this.getData = function(key) {
              return ui.getLocalStorage(key);
        };
        
        function getPriceId(orgUnitId) {
            if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                return constant.PRICE_ID_WINE;
            } else if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                return constant.PRICE_ID_BEER;
            } else {
                return 0;
            }
        }        
        
        function getPayload(_orgUnitId) {
            var orgUnitId = null;
            var priceListId = 0;
            if (_orgUnitId) {
                orgUnitId = _orgUnitId;
                priceListId = getPriceId(_orgUnitId);
            } else {
                orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                priceListId = getPriceId(orgUnitId);
            }
            var user = app.moduleConfig.params.rootContext.userProfile;            
            
            var priceListKeys = [];
            var P_PRICE_LIST_ID_TBL_ITEM = [];
            priceListKeys.push(priceListId);
            for (var i = 0; i < priceListKeys.length; i++) {
                P_PRICE_LIST_ID_TBL_ITEM.push({"PRICE_LIST_ID": priceListKeys[i]});
            }
            var payload = JSON.stringify({
                "InputGetPriceList": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },                    
                    "P_ORG_ID": orgUnitId,
                    "P_PRICE_LIST_ID_TBL": {"P_PRICE_LIST_ID_TBL_ITEM": P_PRICE_LIST_ID_TBL_ITEM}
                }
            });
            return payload;
        }        
        
        function registerServiceMessage(_payload) {
            var defer = $.Deferred();

            // get the default payload
            var payload = null;
            if (_payload) {
                payload = _payload;
            } else {
                payload = getPayload();
            }
            console.log("payload = " + ko.toJS(payload));

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetPriceList.P_ORG_ID;
            var P_PRICE_LIST_ID = parser.InputGetPriceList.P_PRICE_LIST_ID_TBL.P_PRICE_LIST_ID_TBL_ITEM[0].PRICE_LIST_ID;

            // define the key for local storage
            var key =constant.STANDARD_PRICE_LIST_KEY + ":" + P_ORG_ID + ":" + P_PRICE_LIST_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/dataSync/priceListMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
            } else {

                console.log("[Amplify Request] Standard Price List - " + key);
                amplify.request({
                    resourceId: constant.STANDARD_PRICE_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of order history to local storage
                // ui.setLocalStorage(key + ":" + constant.NEW_ORDER_LIST_SYNC_DATETIME, commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());                        

                // store the price list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                    ui.updateDownloadRequestCount(constant.P_STANDARD_PRICE_CNT, 1);
                }).fail(function () {
                    ui.updateDownloadRequestCount(constant.P_STANDARD_PRICE_CNT, 1);
                });
                
            }
        };
    }

    return new PriceListService();
});
