/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'moment', 'appController', 'util/commonhelper', 'pages/common/constant', 'config/appconfig', 'util/appui', 'util/devmode'
], function (ko, $, moment, app, commonHelper, constant, appConfig, ui, devMode) {
        
    function maintenance() {
        var self = this;
        
        var startTime;
        var endTime;
        
        self.setMaintenance = function(start, end, isMaintenance) {
            this.startTime = start;
            this.endTime = end;
        };
        
        function setM (start, end, callback, callbackObj) {
            callback.apply(callbackObj, [start, end]);
        }
        
        self.init = function () {
            getMaintenanceMessage().done(function(data) {
                if (Array.isArray(data)) data = data[0];
                var respJSON = data["items"];
                console.log("maintenance table : respJSON = " + ko.toJSON(respJSON[0]));
                
                ui.setLocalStorage(constant.MAINTENANCE_START, respJSON[0].start);
                ui.setLocalStorage(constant.MAINTENANCE_END, respJSON[0].end);

                setM(respJSON[0].start, respJSON[0].end, self.setMaintenance, this);
                
                console.log("Maintenance Window : " +  this.startTime + " - " + this.endTime);
            });
        };

        self.isMaintenance = function () {
//            console.log("********************* calling self.init()");
//            self.init();
//            console.log("********************* ending self.init()");
            
            var startTime = ui.getLocalStorage(constant.MAINTENANCE_START);
            var endTime = ui.getLocalStorage(constant.MAINTENANCE_END);
            
            var beginningTime = moment(startTime, 'HH:mm');
            var endTime = moment(endTime, 'HH:mm');

            var _currentTime = commonHelper.getClientCurrentDate("HH:mm");
            var currentTime = moment(_currentTime, 'HH:mm');
            
            var env = appConfig.get("environment");
//            if (env != "prd") {
//                return false;
//            }

            if (!currentTime.isBefore(beginningTime) && currentTime.isBefore(endTime)) {
                return true;
            }
            return false;
        };
        
        
        function getMaintenanceMessage() {
            var defer = $.Deferred();
            
            var key = constant.GET_MAINTENANCE_TIME;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/common/getMaintenanceMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: []
            });
            
            return $.when(defer); 
        }		        

    }

    return new maintenance();
});
