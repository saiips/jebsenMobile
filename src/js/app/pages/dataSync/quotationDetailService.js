/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'appController', 'pages/common/constant', 'util/devmode', 'util/appui', 'util/commonhelper'
], function (ko, $, module, amplify ,app, constant, devMode, ui, commonHelper) {

    function QuotationDetailService() {
        
        this.registerService = function(payload) {
            return registerServiceMessage(payload);
        };        
        
        function registerServiceMessage(payload) {
            var defer = $.Deferred();

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetQuotationLines.P_ORG_ID;
            var P_HEADER_ID = parser.InputGetQuotationLines.P_HEADER_ID;
            
            // define the key for local storage
            var key = constant.QUOTATION_DETAIL_KEY + ":" + P_ORG_ID + ":" + P_HEADER_ID ;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/quotation/quotationLineMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return key;
            }

            console.log("[Amplify Request] Quotation Detail - " + key);
            amplify.request({
                resourceId: constant.QUOTATION_DETAIL_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            // store the quotation line to local storage by amplify
            $.when(defer).done(function (data, textStatus, jqXHR) {
                ui.setLocalStorage(key, data);
                ui.updateDownloadRequestCount(constant.P_QUOTE_DTL_CNT, 1);
            }).fail(function () {
                ui.updateDownloadRequestCount(constant.P_QUOTE_DTL_CNT, 1);
            });

            return key;
        }
        
    }

    return new QuotationDetailService();
});
