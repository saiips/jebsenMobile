/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'appController', 'util/commonhelper', 'pages/common/constant',
], function (ko, $, ui, devMode, app, commonHelper, constant) {

    function VisitationService() {
        
        function getVisitationListMessage(payload) {
            return this.getVisitationListMessage(payload, false);
        }
        
        function getVisitationListMessage(payload, refresh) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetVisitation.P_ORG_ID;
            var P_SALESREP_ID = parser.InputGetVisitation.P_SALESREP_ID;

            // define the key for local storage
            var key = constant.VISITATION_LIST_KEY + ":" + P_ORG_ID + ":" + P_SALESREP_ID;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/visitation/visitationListMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Visitation List - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Visitation List - " + key);
                amplify.request({
                    resourceId: constant.VISITATION_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of customer list to local storage
                ui.setLocalStorage(key + ":" + constant.VISITATIONS_SYNC_DATETIME, 
                    commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());
                    
                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }
            return $.when(defer);
        };

        this.getVisitationListMessage = function(payload) {
            return getVisitationListMessage(payload);
        };     
        
        this.refreshVisitationListMessage = function(payload) {
            return getVisitationListMessage(payload, true);
        };
        
        function updateVisitationMessage(payload) {
            var defer = $.Deferred();
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/visitation/updateVisitationMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Update Visitation - " + constant.UPDATE_VISITATION_KEY);
            amplify.request({
                resourceId: constant.UPDATE_VISITATION_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });            
            
            return $.when(defer);
        }
        
        this.updateVisitationMessage = function(payload) {
            return updateVisitationMessage(payload);
        };
        
        function createVisitationMessage(payload) {
            var defer = $.Deferred();

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/visitation/newVisitationMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Create Visitation - " + constant.CREATE_VISITATION_KEY);
            amplify.request({
                resourceId: constant.CREATE_VISITATION_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });            
            
            return $.when(defer);
        }        
        
        this.createVisitationMessage = function(payload) {
            return createVisitationMessage(payload);
        };
        
    }

    return new VisitationService();
});
