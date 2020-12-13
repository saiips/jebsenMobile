/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'appController', 'util/commonhelper', 'pages/common/constant',
    'pages/dataSync/orderHistService',
    'pages/dataSync/newOrderService',
    'pages/dataSync/quotationService'
], function (ko, $, ui, devMode, app, commonHelper, constant, orderHistService, newOrderService, quotationService) {

    function CustomerService() {

        this.registerService = function () {
            return registerServiceMessage();
        };

        this.registerWineService = function (orgUnitId) {
            return registerServiceMessage(orgUnitId);
        };


        this.registerBeerService = function (orgUnitId) {
            return registerServiceMessage(orgUnitId);
        };

        function getPayload(orgId) {
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            if (orgId) { 
                orgUnitId = orgId;
            }
            var erpSalesId = app.moduleConfig.params.rootContext.userProfile.erpSalesId;
            var user = app.moduleConfig.params.rootContext.userProfile;
            var payload = JSON.stringify({
                "InputGetCustomers": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },
                    "P_ORG_ID": orgUnitId,
                    "P_SALESREP_ID": erpSalesId
                }
            });
            return payload;
        }


        function registerServiceMessage(orgUnitId) {
            var defer = $.Deferred();

            // get the default payload
            var payload = getPayload(orgUnitId);

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_USER_ID = parser.InputGetCustomers.HeaderInfo.UserID;
            var P_USER_ROLE = parser.InputGetCustomers.HeaderInfo.UserRole;
            var P_ORG_ID = parser.InputGetCustomers.P_ORG_ID;
            var P_SALESREP_ID = parser.InputGetCustomers.P_SALESREP_ID;

            // define the key for local storage
            var key = constant.CUSTOMER_LIST_KEY + ":" + P_ORG_ID + ":" + P_SALESREP_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/customer/customerListMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
            } else {

                console.log("[Amplify Request] Customer List - " + key);
                console.log("payload =" + ko.toJS(payload));
                amplify.request({
                    resourceId: constant.CUSTOMER_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the last sync datetime of customer list to local storage
                ui.setLocalStorage(key + ":" + constant.CUSTOMERS_SYNC_DATETIME,
                        commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());

                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);

                    var user = app.moduleConfig.params.rootContext.userProfile;

                    var respJSON = d['P_CUSTOMER_TBL_ITEM'];
                    console.log("customer list = " + respJSON.length);

                    var lastPayload4OrderList = [];
                    var lastPayload4PriceList = [];
                    var lastPayload4QuotationList = [];
                    app.moduleConfig.params.rootContext.lastPayload4QuotationDetailList = [];

                    ui.updateDownloadRequestCount(constant.P_CUST_CNT, respJSON.length);

                    if (user.salesRole != constant.SR_ADMIN) {

                        ko.utils.arrayForEach(respJSON, function (item) {
                            /////////////////////////////////////////////////////
                            // Payload for Order History - skip the download of order history for VS role
                            /////////////////////////////////////////////////////
                            if (user.salesRole == constant.SR_MOBILE_SALE) {
                                var payload = JSON.stringify({
                                    "InputParameters": {
                                        "HeaderInfo": {
                                            "UserID": P_USER_ID,
                                            "UserRole": P_USER_ROLE,
                                            "CallerID": ""
                                        },
                                        "P_ORG_ID": P_ORG_ID,
                                        "P_ACCOUNT_NUMBER": item.CUST_ACCOUNT_ID,
                                        "P_SHIP_TO_ORG_ID": item.SHIP_TO_SITE_ID
                                    }
                                });
                                var tempKey = P_ORG_ID + ":" + item.CUST_ACCOUNT_ID + ":" + item.SHIP_TO_SITE_ID;
                                if (lastPayload4OrderList.indexOf(tempKey) < 0) {
                                    lastPayload4OrderList.push(tempKey);
                                    orderHistService.registerService(payload);
                                } else {
                                    ui.updateDownloadRequestCount(constant.P_ORDER_CNT, 1);
                                }
                            }

                            /////////////////////////////////////////////////////
                            // Payload for Price List (Customer Level) - exlcude those standard price list
                            /////////////////////////////////////////////////////
                            if (user.salesRole != constant.SR_ADMIN && item.PRICE_LIST_ID != constant.PRICE_ID_BEER && item.PRICE_LIST_ID != constant.PRICE_ID_WINE) {
                                var priceListKeys = [];
                                var P_PRICE_LIST_ID_TBL_ITEM = [];
                                priceListKeys.push(item.PRICE_LIST_ID);
                                P_PRICE_LIST_ID_TBL_ITEM.push({"PRICE_LIST_ID": priceListKeys[0]});
                                payload = JSON.stringify({
                                    "InputGetPriceList": {
                                        "HeaderInfo": {
                                            "UserID": P_USER_ID,
                                            "UserRole": P_USER_ROLE,
                                            "CallerID": ""
                                        },
                                        "P_ORG_ID": P_ORG_ID,
                                        "P_PRICE_LIST_ID_TBL": {"P_PRICE_LIST_ID_TBL_ITEM": P_PRICE_LIST_ID_TBL_ITEM}
                                    }
                                });
                                var tempKey = P_ORG_ID + ":" + item.PRICE_LIST_ID;
                                if (lastPayload4PriceList.indexOf(tempKey) < 0) {
                                    lastPayload4PriceList.push(tempKey);
                                    newOrderService.registerService(payload);
                                } else {
                                    ui.updateDownloadRequestCount(constant.P_PRICE_CNT, 1);
                                }
                            } else {
                                ui.updateDownloadRequestCount(constant.P_PRICE_CNT, 1);
                            }

                            /////////////////////////////////////////////////////
                            // payload for Quotation List
                            /////////////////////////////////////////////////////
                            if (user.salesRole == "MS" && user.orgUnitId == constant.ORG_UNIT_ID_WINE) {
                                var quotationPayload = JSON.stringify({
                                    "InputGetQuotation": {
                                        "HeaderInfo": {
                                            "UserID": user.username,
                                            "UserRole": user.salesRole,
                                            "CallerID": ""
                                        },
                                        "P_ORG_ID": user.orgUnitId,
                                        "P_ACCOUNT_NUMBER": item.ACCOUNT_NUMBER,
                                        "P_SHIP_TO_ORG_ID": item.BILL_TO_SITE_ID
                                    }
                                });
                                var tempKey = user.orgUnitId + ":" + item.ACCOUNT_NUMBER + ":" + item.BILL_TO_SITE_ID;
                                if (lastPayload4QuotationList.indexOf(tempKey) < 0) {
                                    lastPayload4QuotationList.push(tempKey);
                                    quotationService.registerService(quotationPayload);
                                } else {
                                    ui.updateDownloadRequestCount(constant.P_QUOTE_CNT, 1);
                                }
                            }
                        });

                    }

                }).fail(function () {
                    console.log("Failed to download the customer list");
                });
            }
            return key;
        }

    }

    return new CustomerService();
});
