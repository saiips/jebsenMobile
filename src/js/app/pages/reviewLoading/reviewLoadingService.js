/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/devmode', 'pages/common/constant', 'util/commonhelper', 'appController'
], function (ko, $, module, amplify, devMode, constant, commonHelper, app) {

    function ReviewLoadingService() {
        
        function getReviewLoadingListMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.UPDATE_READ_DNRMA_KEY;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/reviewLoading/reviewLoadingServiceMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Get Linde Confirmed Loading List - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };

        this.getReviewLoadingListMessage = function (payload) {
            return getReviewLoadingListMessage(payload);
        };
        
        this.updateLoadingListMessage = function (payload) {
            return getReviewLoadingListMessage(payload); 
        };
        
        this.getEnquiryPayload = function(fromDate, toDate, documentNo, orderNo, customerNo, customerName, shipAddress) {
            return getEnquiryPayload(fromDate, toDate, documentNo, orderNo, customerNo, customerName, shipAddress);
        };
        
        function getEnquiryPayload(fromDate, toDate, documentNo, orderNo, customerNo, customerName, shipAddress) {
            var user = app.moduleConfig.params.rootContext.userProfile;
            if (fromDate) {
                fromDate = commonHelper.formatStrDateToISO(fromDate, "YYYY-MM-DD");
            }
            if (toDate) {
                toDate = commonHelper.formatStrDateToISO(toDate, "YYYY-MM-DD");
            }
            
            var payload = JSON.stringify({
                    "InputUpdateReadDNRMAIntf": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_DOCUMENT_NUMBER": documentNo,    
                        "P_FROM_DATE": fromDate,
                        "P_TO_DATE": toDate, 
                        "P_ORDER_NUMBER": orderNo,
                        "P_CUSTOMER_NUMBER": customerNo,
                        "P_CUSTOMER_NAME": customerName,
                        "P_SHIP_ADDRESS": shipAddress,   
                        "P_EMAIL_ADDRESS": null,
                        "P_ACTION_TYPE": null,
                        "P_INTF_TBL_I": null
                    }
                });

            return payload;
        }        
        
        this.getUpdatePayload = function(P_INTF_TBL_I_ITEM) {
            return getUpdatePayload(P_INTF_TBL_I_ITEM);
        };      
        
        function getUpdatePayload(P_INTF_TBL_I_ITEM) {
            var user = app.moduleConfig.params.rootContext.userProfile;
            var payload = JSON.stringify({
                    "InputUpdateReadDNRMAIntf": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_DOCUMENT_NUMBER": null,
                        "P_FROM_DATE": null,
                        "P_TO_DATE": null, 
                        "P_ORDER_NUMBER": null,
                        "P_CUSTOMER_NUMBER": null,
                        "P_CUSTOMER_NAME": null,
                        "P_SHIP_ADDRESS": null,    
                        "P_EMAIL_ADDRESS": null,
                        "P_ACTION_TYPE": null,                        
                        "P_INTF_TBL_I": {P_INTF_TBL_I_ITEM: P_INTF_TBL_I_ITEM}
                    }
                });

            return payload;            
        }
        
        this.getReportPayload = function(fromDate, toDate) {
            return getReportPayload(fromDate, toDate);
        };
        
        function getReportPayload(fromDate, toDate) {
            var user = app.moduleConfig.params.rootContext.userProfile;
            if (fromDate) {
                fromDate = commonHelper.formatStrDateToISO(fromDate, "YYYY-MM-DD");
            }
            if (toDate) {
                toDate = commonHelper.formatStrDateToISO(toDate, "YYYY-MM-DD");
            }
            
            var payload = JSON.stringify({
                    "InputUpdateReadDNRMAIntf": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_DOCUMENT_NUMBER": null,    
                        "P_FROM_DATE": fromDate,
                        "P_TO_DATE": toDate, 
                        "P_ORDER_NUMBER": null,
                        "P_CUSTOMER_NUMBER": null,
                        "P_CUSTOMER_NAME": null,
                        "P_SHIP_ADDRESS": null,   
                        "P_EMAIL_ADDRESS": user.email,
                        "P_ACTION_TYPE": "RPT",
                        "P_INTF_TBL_I": null
                    }
                });
                
            return payload;
        }
        
    }

    return new ReviewLoadingService();
});