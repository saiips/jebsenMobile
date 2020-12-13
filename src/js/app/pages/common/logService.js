/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['moment', 'knockout', 'jquery', 'amplify', 'pages/common/constant', 'config/appconfig', 'appController'
], function (moment, ko, $, amplify, constant, appConfig, app) {


    function LogService() {
        
        // Payload for Database Table - Events
        this.getEventLogPayload = function(user, event, body, additionalInfo) {
            var userRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
            var env = appConfig.get("environment");
            var logDate = new String(moment(new Date()).format('YYYYMMDD'));
            var timestamp = new Date().toISOString();
            var payload = JSON.stringify({
                "InputCreateEvent":{
                    "HeaderInfo": {
                        "UserID": user,
                        "UserRole": userRole,
                        "CallerID": ""
                    },
                    "Event":event,
                    "Payload":body,
                    "AdditionalInfo":additionalInfo,
                    "LogDate": logDate,
                    "Environment": env,
                    "User":user,
                    "EventDate":timestamp
                }
            });
            return payload;
        };
        
        // Payload for Event Analytics
        this.getPayload = function(event, properties) {

            var uuid = mcs._Utils.uuid();
            var timestamp = new Date().toISOString();
            var deviceInformation = mcs.MobileBackendManager.platform.getDeviceInformation();
            var location = mcs.MobileBackendManager.platform.getGPSLocation();
            
            var payload = JSON.stringify([
                {
                    "name": "context",
                    "timestamp": timestamp,
                    "properties": {
                        "timezone": "" + new Date().getTimezoneOffset() * 60,
                        "model": deviceInformation.model,
                        "manufacturer": deviceInformation.maufacturer,
                        "osName": deviceInformation.osName,
                        "osVersion": deviceInformation.osVersion,
                        "osBuild": deviceInformation.osBuild,
                        "carrier": deviceInformation.carrier,
                        "latitude": location.latitude,
                        "longitude": location.longitude
                    },
                    "type": "system"
                }, {
                    "name": "sessionStart",
                    "timestamp": timestamp,
                    "properties": {},
                    "sessionID": uuid,
                    "type": "system"
                }, {
                    "name": event,
                    "timestamp": timestamp,
                    "properties": properties,
                    "type": "custom",
                    "sessionID": uuid
                }
            ]);
            
            return payload;
        }
        
        this.log = function(payload) {
            var defer = $.Deferred();
            
            var key = constant.EVENT_LOG_KEY;
			
            var env = appConfig.get("environment");

            if (env != "prd") {
                defer.resolve({status: 200});
            } else {
                console.log("[Amplify Request] Log Event Request - " + key);
                amplify.request({
                    resourceId: key,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
            }
            
            return $.when(defer);
        }
        
    }

    return new LogService();
});
