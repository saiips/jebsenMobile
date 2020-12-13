/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'amplify', 'config/appconfig', 'util/devmode', 'util/appui', 'appController', 'pages/common/constant', 'pages/common/maintenance',
], function (ko, $, amplify, appConfig, devMode, ui, app, constant, maintenance) {

    var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

    function LoginService() {
        
        this.getOAuthToken = function() {
            var clientID = appConfig.get("clientID");
            var clientSecret = appConfig.get("clientSecret");
            var token =  Base64.encode(clientID + ':' + clientSecret);
            return token;
        };
    
        this.getToken = function (username, password) {
            var token =  Base64.encode(username + ':' + password);
            return token;
        };

        this.login = function (username, password) {
            
            var token = Base64.encode(username + ':' + password);
            
            // Set up MCS header params
            var authHeaders = {
                'Authorization': "Basic " + token,
                'Oracle-Mobile-Backend-ID': appConfig.get("mobileBackendId"),
                'Content-Type': "application/json; charset=utf-8",
                'Mock': appConfig.get("useMockDataFromMCS")
            };
            
            this.init(authHeaders);

            var defer = $.Deferred();
            
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/login/loginMock.json", function(data) {
                    setTimeout(function() {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
            } else {
                // For some strange reason, the amplify request doesn't work 
                // always calls reject function    
                var isOnline = app.moduleConfig.params.rootContext.isOnline;
                if (isOnline) {
                    amplify.request({
                        resourceId: "login",
                        success: defer.resolve,
                        error: defer.reject,
                        data: { id : username }
                    });
                    // store the customer list to local storage by amplify
                    $.when(defer).done(function (d, textStatus, jqXHR) {
                        if (textStatus.status == 200) {
                            ui.setLocalStorage(constant.BASE64_LOGON_TOKEN, token);
                            ui.setLocalStorage(constant.USER_PROFILE, d);                       
                        }
                    });                    
               } else {
                    var logonToken = ui.getLocalStorage(constant.BASE64_LOGON_TOKEN);
                    if (token == logonToken) {
                        var userProfile = ui.getLocalStorage(constant.USER_PROFILE);
                        defer.resolve(userProfile, {status: 200});
                    } else {
                        defer.reject(null, {status: 401});
                    }
               }
            }
            return $.when(defer);
        };
        
        this.init = function(authHeaders) {
          var ah = authHeaders || {};
          
          $.ajaxSetup({headers: ah});
          
          devMode.preserveAuthHeaders(ah);
        }
        
        
        function getInitPayload() {
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            var erpSalesId = app.moduleConfig.params.rootContext.userProfile.erpSalesId;
            var user = app.moduleConfig.params.rootContext.userProfile;
            var payload = JSON.stringify({
                "InputGetInitCount": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },
                    "P_ORG_ID": orgUnitId,
                    "P_SALESREP_ID": erpSalesId,
                    "P_APP_ROLE": user.salesRole,
                    "P_CP_NUMBER": user.licenseNo
                }
            });
            return payload;
        }        
        
        function getAppVersionPayload() {
            var user = app.moduleConfig.params.rootContext.userProfile;
            var username, salesRole, orgUnitd;
            if (!user.orgUnitId || user.orgUnitId == "") {
               username = constant.SR_DUMMY;
               salesRole = constant.SR_DUMMY;
               orgUnitId = null;
            } else {
                username = user.username;
                salesRole = user.salesRole;
                orgUnitId = user.orgUnitId;
            }
            var payload = JSON.stringify({
                "InputGetAppVersion": {
                    "HeaderInfo": {
                        "UserID": username,
                        "UserRole": salesRole,
                        "CallerID": ""
                    },
                    "P_ORG_ID": orgUnitId
                }
            });
            return payload;
        }           
        
        this.getInitiaLoadRequest = function(requireInitLoad) {
            var defer = $.Deferred();
            
            var payload = getInitPayload();
            console.log("payload =" + ko.toJS(payload));
            
            console.log("requireInitLoad = " + requireInitLoad);
              
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetInitCount.P_ORG_ID;
            var P_SALESREP_ID = parser.InputGetInitCount.P_SALESREP_ID;    
            var P_APP_ROLE = parser.InputGetInitCount.P_APP_ROLE;
            var P_CP_NUMBER = parser.InputGetInitCount.P_CP_NUMBER;
              
            // define the key for local storage
            var key = constant.INITIAL_LOAD_REQUEST_KEY + ":" + P_ORG_ID + ":" + P_SALESREP_ID + ":" +  P_APP_ROLE + ":" + P_CP_NUMBER;
             
            // run mock data if development mode is on
            if (requireInitLoad != "Y" || devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/login/getInitRequestMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }              
            
            console.log("[Amplify Request] Initial Load Request - " + key);
            amplify.request({
                resourceId: constant.INITIAL_LOAD_REQUEST_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
            
            return $.when(defer);
        };
        
        this.getAppVersion = function() {
            var defer = $.Deferred();
            
            var payload = getAppVersionPayload();
            
            var isOnline = app.moduleConfig.params.rootContext.isOnline;
            
            var isMaintenance = maintenance.isMaintenance();
            
            var isCordova = app.moduleConfig.params.rootContext.isCordova;
              
            // define the key for local storage
            var key = constant.APP_VERSION_KEY;
            
            // run mock data if development mode is on
            if (!isOnline || isMaintenance || !isCordova || (devMode.isEnabled() && devMode.isOffline())) {
                var data = JSON.stringify({
                                            "P_FRONTEND_VER": "1.0.0.1",
                                            "P_BACKEND_VER": "1.0.0.1"
                                          });   
                setTimeout(function () {
                    defer.resolve(data, {status: 200});
                }, 500); // simulate delay
                
                // skip this getJSON in desktop version
                /*
                $.getJSON("js/app/pages/login/getAppVersionMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                */
                return $.when(defer);
            }              
            
            console.log("[Amplify Request] Get App Version - " + key);
            amplify.request({
            resourceId: constant.APP_VERSION_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
            });
            
            return $.when(defer);
        };        

        this.registerDeviceForMCSPush = function () {   
            var defer = $.Deferred();
            if (devMode.isEnabled() && devMode.isOffline()) {
                // offline dev mode, do nothing
                defer.resolve();
            }
            else {
                if (typeof PushNotification !== 'undefined') {
                    console.log("Push Notification exists!!!");
                    try {
                        var senderID = appConfig.get("androidProjectID")
                        var push = PushNotification.init({
                            android: {                                
                                "senderID": senderID,
                                "icon": "ic_logo",
                                "iconColor": "blue",
                                "forceShow": "true"
                            },
                            ios: {
                                "alert": "true",
                                "badge": "true",
                                "sound": "true"
                            },
                            windows: {}
                        });
                               
                        push.on('registration', function (data) {          
                            var os = (cordova.platformId === 'ios') ? 'IOS' : 'ANDROID';
                            var payload = JSON.stringify({
                                "notificationToken": data.registrationId,
                                "mobileClient": {
                                    "id": (os === 'IOS') ? appConfig.get("bundleId") : appConfig.get("applicationId"),
                                    "version": "1.0",
                                    "platform": os
                                },
                                "notificationProvider": (os === 'IOS')? "APNS" : "FCM"
                            });
                            console.log("Reg Device PL: "+payload);                          
                            amplify.request({
                                resourceId: "registerDevice",
                                data: payload,
                                success: defer.resolve,
                                error: defer.reject
                            });                            
                        });
                        
                        push.on('notification', function(data) {
                            console.log("Push Notification from Oracle MCS= " + ko.toJSON(data));
                        });
                        
                        push.on('error', function(e) {
                            console.log("Push Notification Error=" + e.message);
                            defer.reject();
                        });
                    }
                    catch (ex) {
                        console.log("Error registering device with MCS for Push Notifications: "+ex);
                        defer.reject();
                    }
                }
                else {
                    console.log("PushNotification NOT Defined!");
                    defer.reject();
                }
            }
            
            return $.when(defer);
        }
    }

    return new LoginService();
});
