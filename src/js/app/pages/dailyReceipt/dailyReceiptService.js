/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/devmode', 'pages/common/constant'
], function (ko, $, module, amplify, devMode, constant) {

    function DailyReceiptService() {
        
        // CLASS Daily Receipt
        var DailyReceipt = function(id, date, chequeAmount, cashAmount) {
            this.id = ko.observable(id);
            this.date = ko.observable(date);
            this.chequeAmount = ko.observable(chequeAmount);
            this.cashAmount = ko.observable(cashAmount);
        };
    
        this.createDailyReceipt = function (id, date, chequeAmount, cashAmount) {
            return new DailyReceipt(id, date, chequeAmount, cashAmount);
        };
        
        function getDailyReceiptMessage(payload) {
            var defer = $.Deferred();
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/dailyReceipt/dailyReceiptMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }            
            
            console.log("[Amplify Request] Daily Receipt Summary - " + constant.DAILY_RECEIPT_SUMMARY_KEY);
            amplify.request({
                resourceId: constant.DAILY_RECEIPT_SUMMARY_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        };

        this.getDailyReceiptMessage = function (payload) {
            return getDailyReceiptMessage(payload);
        };        

    }

    return new DailyReceiptService();
});