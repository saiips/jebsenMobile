/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/devmode', 'pages/common/constant',  'util/appui'
], function (ko, $, module, amplify, devMode, constant, ui) {

    function ScheduleService() {
        
        ///////////////////////////////////////////////////////////////////////
        // LOV Service for Service Provider, Ship Method, District, Subin Code
        ///////////////////////////////////////////////////////////////////////
        function getLOVMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.GET_LOV_SERVICE;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/getLOV.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            
            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] Get LOV (schedule maintenance) - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Get LOV - " + key);
                amplify.request({
                    resourceId: key,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });                
            }
            return $.when(defer);            
        }
        
        
        this.getLOVMessage = function (payload) {
            return getLOVMessage(payload);
        };
        
        function getRouteLOVMessage(payload) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_SERVICE_PROVIDER = parser.InputGetRouteLOV.P_SERVICE_PROVIDER;
            var key = constant.GET_ROUTE_LOV_SERVICE + ":" + P_SERVICE_PROVIDER                    
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/getRouteLOV.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] Get Route LOV  - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Get Route LOV - " + key);
                amplify.request({
                    resourceId: constant.GET_ROUTE_LOV_SERVICE,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });                 
            }
            return $.when(defer);            
        }
        
        this.getRouteLOVMessage = function (payload) {
            return getRouteLOVMessage(payload);
        };
        
        function getShipmentLOVMessage(payload) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_SERVICE_PROVIDER = parser.InputGetShipMethodLOV.P_SERVICE_PROVIDER;
            var key = constant.GET_SHIPMENT_LOV_SERVICE + ":" + P_SERVICE_PROVIDER                    
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/getShipmentLOVService.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] Get Shipment LOV  - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Get Shipment LOV - " + key);
                amplify.request({
                    resourceId: constant.GET_SHIPMENT_LOV_SERVICE,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });                 
            }
            return $.when(defer);            
        }        
        
        this.getShipmentLOVMessage = function (payload) {
            return getShipmentLOVMessage(payload);
        };
        
        ///////////////////////////////////////////////////////////////////////
        // Logistic Schedule Maintenance
        ///////////////////////////////////////////////////////////////////////        
        function searchLogisticScheduleMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.SEARCH_LOGISTICS_SCHEDULE;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/searchLogisticsSchedule.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Search Logistics Schedule - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };

        this.searchLogisticScheduleMessage = function (payload) {
            return searchLogisticScheduleMessage(payload);
        };
        
        
        function updateLogisticScheduleMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.UPDATE_LOGISTICS_SCHEDULE;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/updateLogisticSchedule.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Update Logistics Schedule - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };        
        
        this.updateLogisticScheduleMessage = function (payload) {
            return updateLogisticScheduleMessage(payload);
        };
        
        ///////////////////////////////////////////////////////////////////////
        // Non-Working Date Maintenance
        ///////////////////////////////////////////////////////////////////////        
        function searchNonWorkingDateMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.SEARCH_NON_WORKING_DATE;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/searchNonWorkingDate.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Search Non-Working Date - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };
        
        this.searchNonWorkingDateMessage = function (payload) {
            return searchNonWorkingDateMessage(payload);
        };
        
        function updateNonWorkingDateMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.UPDATE_NON_WORKING_DATE;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/updateNonWorkingDate.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Update Non-Working Date - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };        
        
        this.updateNonWorkingDateMessage = function (payload) {
            return updateNonWorkingDateMessage(payload);
        };     
        
        ///////////////////////////////////////////////////////////////////////
        // Route Cutoff Time Maintenance
        ///////////////////////////////////////////////////////////////////////             
        function searchRouteCutoffMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.SEARCH_ROUTE_CUTOFF;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/searchRouteCutoff.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Search Route Cutoff Time - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };
        
        this.searchRouteCutoffMessage = function (payload) {
            return searchRouteCutoffMessage(payload);
        };
        
        function updateRouteCutoffMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.UPDATE_ROUTE_CUTOFF;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/updateRouteCutoff.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Update Route Cutoff Time - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };        
        
        this.updateRouteCutoffMessage = function (payload) {
            return updateRouteCutoffMessage(payload);
        };           
        
        ///////////////////////////////////////////////////////////////////////
        // Route Earlier Cutoff Time Maintenance
        ///////////////////////////////////////////////////////////////////////           
        function searchRouteEarlierCutoffMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.SEARCH_ROUTE_EARLIER_CUTOFF;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/searchRouteEarlyCutoff.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Search Route Earlier Cutoff Time - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };
        
        this.searchRouteEarlierCutoffMessage = function (payload) {
            return searchRouteEarlierCutoffMessage(payload);
        };
        
        function updateRouteEarlierCutoffMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.UPDATE_ROUTE_EARLIER_CUTOFF;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/schedule/updateRouteEarlyCutoff.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Update Route Earlier Cutoff Time - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };        
        
        this.updateRouteEarlierCutoffMessage = function (payload) {
            return updateRouteEarlierCutoffMessage(payload);
        };           
  }

    return new ScheduleService();
});