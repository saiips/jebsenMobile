/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'appController', 'pages/common/constant', 'util/devmode', 'util/appui', 'util/commonhelper',
    'pages/dataSync/quotationDetailService'
], function (ko, $, module, amplify, app, constant, devMode, ui, commonHelper, quotationDetailService) {

    function QuotationService() {

        this.registerService = function (payload) {
            return registerServiceMessage(payload);
        };

        function registerServiceMessage(payload) {
            var defer = $.Deferred();

            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetQuotation.P_ORG_ID;
            var P_SHIP_TO_ORG_ID = parser.InputGetQuotation.P_SHIP_TO_ORG_ID;

            // define the key for local storage
            var key = constant.QUOTATION_LIST_KEY + ":" + P_ORG_ID + ":" + P_SHIP_TO_ORG_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/quotation/quotationMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return key;
            }

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
            $.when(defer).done(function (data, textStatus, jqXHR) {
                ui.setLocalStorage(key, data);
                var respJSON = data['P_QUOTATION_TBL']['P_QUOTATION_TBL_ITEM'];
                ui.updateDownloadRequestCount(constant.P_QUOTE_CNT, 1);

                // quotation detail
                ko.utils.arrayForEach(respJSON, function (item) {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var payload = JSON.stringify({
                        "InputGetQuotationLines": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": user.orgUnitId,
                            "P_HEADER_ID": item.OE_HEADER_ID
                        }
                    });
                    var tempKey = user.orgUnitId + ":" + item.OE_HEADER_ID;
                    if (app.moduleConfig.params.rootContext.lastPayload4QuotationDetailList.indexOf(tempKey) < 0) {
                        app.moduleConfig.params.rootContext.lastPayload4QuotationDetailList.push(tempKey);
                        quotationDetailService.registerService(payload);
                    }
                });

            }).fail(function () {
                ui.updateDownloadRequestCount(constant.P_QUOTE_CNT, 1);
            });

            return key;
        }
        ;

        function getQuotationItem(payload) {
            var defer = $.Deferred();

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetQuotationLines.P_ORG_ID;
            var P_HEADER_ID = parser.InputGetQuotationLines.P_HEADER_ID;

            // define the key for local storage
            var key = constant.QUOTATION_DETAIL_KEY + ":" + P_ORG_ID + ":" + P_HEADER_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/quotation/quotationLineMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return key;
            }

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

            return key;
        }
        ;

        this.getQuotationItem = function (payload) {
            return getQuotationItem(payload);
        };

    }

    return new QuotationService();
});
