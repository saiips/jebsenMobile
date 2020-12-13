/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/devmode', 'pages/common/constant',  'util/appui'
], function (ko, $, module, amplify, devMode, constant, ui) {

    function PrinterService() {
        
        ///////////////////////////////////////////////////////////////////////
        // LOV Service for Service Provider, Ship Method, District, Subin Code
        ///////////////////////////////////////////////////////////////////////
        function getAllPrintersMessage() {
            var defer = $.Deferred();
            
            var key = constant.GET_ALL_PRINTERS;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/printerSetup/getAllPrinterMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] Get All Printers" + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Get All Printers - " + key);
                amplify.request({
                    resourceId: key,
                    success: defer.resolve,
                    error: defer.reject,
                    data: []
                });
                
                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });                
            }
            return $.when(defer);            
        }
        
        
        this.getAllPrintersMessage = function () {
            return getAllPrintersMessage();
        };
      
  }

    return new PrinterService();
});