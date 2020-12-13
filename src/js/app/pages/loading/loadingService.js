/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/devmode', 'util/appui', 'pages/common/constant', 'util/commonhelper',  'appController', 'pages/login/loginService', 'config/appconfig',
], function (ko, $, module, amplify, devMode, ui, constant, commonHelper, app, loginService, appConfig) {

    function LoadingService() {
        
        function getLoadingMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.GOODS_LOADING_KEY;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/loading/loadingServiceMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Goods Loading - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };

        this.getLoadingMessage = function (payload) {
            return getLoadingMessage(payload);
        };
        
        
        function getUnLoadingMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.GOODS_UNLOADING_KEY;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/loading/unloadingServiceMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            console.log("[Amplify Request] Goods UnLoading - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);
        };        
        
        this.getUnLoadingMessage = function (payload) {
            return getUnLoadingMessage(payload);
        };       
        
        this.getPayload = function(orgUnitId, documentType, licenseNo, barcodeNo) {
            return getPayload(orgUnitId, documentType, licenseNo, barcodeNo);
        };
        
        function getPayload(orgUnitId, documentType, licenseNo, barcodeNo) {
            if (!licenseNo || licenseNo == "") licenseNo = null; 
            var user = app.moduleConfig.params.rootContext.userProfile;
            var payload = JSON.stringify({
                    "InputServiceLoadingDNRMA": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_DOCUMENT_TYPE": documentType,      
                        "P_ORG_ID": orgUnitId,
                        "P_DELIVERY_NUMBER": barcodeNo, 
                        "P_CP_NUMBER": licenseNo
                    }
                });

            return payload;
        }        
        
        this.getUnLoadingPayload = function(orgUnitId, documentType, licenseNo, barcodeNo) {
            return getUnLoadingPayload(orgUnitId, documentType, licenseNo, barcodeNo);
        };        
        
        function getUnLoadingPayload(orgUnitId, documentType, licenseNo, barcodeNo) {
            var user = app.moduleConfig.params.rootContext.userProfile;
            var payload = JSON.stringify({
                    "InputDeleteDNRMA": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_DOCUMENT_TYPE": documentType,      
                        "P_ORG_ID": orgUnitId,
                        "P_DELIVERY_NUMBER": barcodeNo, 
                        "P_CP_NUMBER": licenseNo
                    }
                });

            return payload;
        }     
        
        this.checkPasscode = function(payload) {
            return checkPasscode(payload);
        };
        
        function checkPasscode(payload) {
            var defer = $.Deferred();
            
            /*
            var authHeaders = {
                'Authorization': "Basic d2VibG9naWM6d2VsY29tZTE=",
                'Content-Type': "application/json; charset=utf-8"
            };
            var ah = authHeaders || {};
            $.ajaxSetup({headers: ah});  
            
            
            amplify.request.define("checkPasscode", "ajax", {
                url: "http://dev.jebsen.com:8001/MobileServices/OTPRestService/checkPasscode",
                dataType: "json",
                type: "POST"
            });  
            */
           
            if (devMode.isEnabled() && devMode.isOffline()) {
                var data = {"result": "true"};
                setTimeout(function () {
                    defer.resolve(data, {status: 200});
                }, 500);
                return $.when(defer);
            }           
            
            amplify.request({
                resourceId: constant.CHECK_PASSCODE_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });            
            
            return $.when(defer);
        }
        
        this.setupOAuthToken = function() {
            return setupOAuthToken();
        };
        
        function setupOAuthToken() {
            var defer = $.Deferred();
            
            try {
                var data = loginService.getOAuthToken();
                // Set up MCS header params for oAuth
                var authHeaders = {
                    'Authorization': "Basic " + data,
                    'Content-Type': "application/x-www-form-urlencoded; charset=utf-8"
                };
                var ah = authHeaders || {};
                $.ajaxSetup({headers: ah});
                var payload = "grant_type=client_credentials&scope=urn:opc:idm:__myscopes__";
                
                // get the access token for oAuth
                getOAuthTokenMessage(payload).done(function (data) {
                    var accessToken = data['access_token'];
                    // 'Authorization': "Bearer " + accessToken,
                    // temp solution: without using oauth, using base64 of gitcontact
                    if (accessToken) {
                        var authHeaders = {
                            'Authorization': "Basic " + constant.BASE64_GITCONTACT,
                            'Oracle-Mobile-Backend-ID':  appConfig.get("mobileBackendId"),                            
                            'Content-Type': "application/json; charset=utf-8"
                        };
                        var ah = authHeaders || {};
                        $.ajaxSetup({headers: ah});
                        
                        defer.resolve({status: 200});
                    }
                }).fail(function (error) {
                    console.log("getOAuthTokenPayload error:" + error);
                });

            } catch (ex) {
                console.log(ex);
            }
            
            return $.when(defer);
        }
        
        this.getOAuthTokenMessage = function(payload) {
          return getOAuthTokenMessage(payload);  
        };
        
        function getOAuthTokenMessage(payload) {
            var defer = $.Deferred();
            
            if (devMode.isEnabled() && devMode.isOffline()) {
                var data = {"access_token": "ODU0NDg0NTg="};
                setTimeout(function () {
                    defer.resolve(data, {status: 200});
                }, 500);
                return $.when(defer);
            }                
            
            amplify.request.define("getOAuthToken", "ajax", {
                url: appConfig.get("tokenServer"),
                dataType: "json",
                type: "POST"
            });            
            
            amplify.request({
                resourceId: 'getOAuthToken',
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);            
        }

    }

    return new LoadingService();
});