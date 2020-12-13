/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['jquery', 'mcs', 'mcs_config'], function ($) {
    function MobileBackend() {
        var self = this;
        self.mobileBackend;
        //get default MBE info
        self.MBE_AUTH_TYPE;
        self.MBE_NAME;
        self.MBE_BaseURL;
        self.MBE_ID;
        self.MBE_AnonymousToken;
        self.MBE_ApplicationKey;
        self.MBE_OAuthClientId;
        self.MBE_OAuthClientSecret;
        self.MBE_OAuthTokenEndpoint;
        self.appId = "com.oraclecorp.internal.ent3.chinamcsdemopush";
        self.appVersion = "1.0.0";
        //Always using the same collection in this example, called JETCollection. Can 
        //be dynamic if using multiple collections, but for example using one collection.
        //    var COLLECTION_NAME = "JETCollection";
        var initMCS_config = function () {
            mcs_config.logLevel = mcs.logLevelInfo;
            //    console.log(aValue);
            // get getDefaultMBE_NAME
            var backends = new Array(mcs_config.mobileBackends);
            if (backends.length > 0)
            {
                self.MBE_NAME = Object.keys(backends[0])[0];
                var storage = window.localStorage;
                var aValue = storage.getItem("mbe_baseUrl");
                if (aValue != null && aValue.length > 0)
                {
                    backends[0][self.MBE_NAME].baseUrl = aValue;
                }

                aValue = storage.getItem("mbe_basicAuth_backendId");
                if (aValue != null && aValue.length > 0)
                {
                    backends[0][self.MBE_NAME].authorization.basicAuth.backendId = aValue;
                }

                aValue = storage.getItem("mbe_basicAuth_anonymousToken");
                if (aValue != null && aValue.length > 0)
                {
                    backends[0][self.MBE_NAME].authorization.basicAuth.anonymousToken = aValue;
                }

                aValue = storage.getItem("applicationKey");
                if (aValue != null && aValue.length > 0)
                {
                    backends[0][self.MBE_NAME].applicationKey = aValue;
                }

                aValue = storage.getItem("clientId");
                if (aValue != null && aValue.length > 0)
                {
                    backends[0][self.MBE_NAME].authorization.oAuth.clientId = aValue;
                }

                aValue = storage.getItem("clientSecret");
                if (aValue != null && aValue.length > 0)
                {
                    backends[0][self.MBE_NAME].authorization.oAuth.clientSecret = aValue;
                }

                aValue = storage.getItem("tokenEndpoint");
                if (aValue != null && aValue.length > 0)
                {
                    backends[0][self.MBE_NAME].authorization.oAuth.tokenEndpoint = aValue;
                }

                aValue = storage.getItem("authType");
                if (aValue != null && aValue.length > 0)
                {
                    backends[0][self.MBE_NAME].authType = aValue;
                }

                self.MBE_BaseURL = backends[0][self.MBE_NAME].baseUrl;
                self.MBE_ID = backends[0][self.MBE_NAME].authorization.basicAuth.backendId;
                self.MBE_AnonymousToken = backends[0][self.MBE_NAME].authorization.basicAuth.anonymousToken;
                self.MBE_ApplicationKey = backends[0][self.MBE_NAME].applicationKey;
                self.MBE_OAuthClientId = backends[0][self.MBE_NAME].authorization.oAuth.clientId;
                self.MBE_OAuthClientSecret = backends[0][self.MBE_NAME].authorization.oAuth.clientSecret;
                self.MBE_OAuthTokenEndpoint = backends[0][self.MBE_NAME].authorization.oAuth.tokenEndpoint;
                self.MBE_AUTH_TYPE = backends[0][self.MBE_NAME].authType;
                console.log("[MBE]: Done init mcs_config!");
            }
        };

        function init() {
            initMCS_config();
            //   mcs.MobileBackendManager.setConfig(mcs_config);
            //MCS backend name for example is JETSample.
            self.mobileBackend = mcs.MobileBackendManager.returnMobileBackend(self.MBE_NAME, mcs_config);
            //    self.mobileBackend = mcs.MobileBackendManager.getMobileBackend(self.MBE_NAME);
            //    self.mobileBackend.setAuthenticationType("basicAuth");
            self.mobileBackend.setAuthenticationType(self.MBE_AUTH_TYPE);
        }

        //Handles the success and failure callbacks defined here
        //Not using anonymous login for this example but including here.
        self.authAnonymous = function () {
            console.log("Authenticating anonymously");
            self.mobileBackend.Authorization.authenticateAnonymous(
                    function (response, data) {
                        console.log("Success authenticating against mobile backend");
                    },
                    function (statusCode, data) {
                        console.log("Failure authenticating against mobile backend");
                    }
            );
        };
        /*
         //This handles success and failure callbacks using parameters (unlike the
         //authAnonymous example)
         self.authenticate = function (username, password, successCallback, failureCallback) {
         self.mobileBackend.Authorization.authenticate(username, password, successCallback, failureCallback);
         };
         */
        self.authenticate = function (username, password) {
            var deferred = $.Deferred();
            self.mobileBackend.Authorization.authenticate(username, password, success, failed);

            return deferred.promise();

            function success(response, data) {
                deferred.resolve(response, data);
            }

            function failed(statusCode, data) {
                deferred.reject(statusCode, data);
            }
        };
        
        //this handles success and failure callbacks using parameters
        self.logout = function (successCallback, failureCallback) {
            self.mobileBackend.Authorization.logout();
        };
        self.isAuthorized = function () {
            return self.getAuthorizedUserName() ? true : false;
            //    return self.mobileBackend.Authorization.getIsAuthorized();
        };

        self.getAuthorizedUserName = function () {
            console.log("MBE Authorization authorizedUserName: " + self.mobileBackend.Authorization.authorizedUserName);
            return self.mobileBackend.Authorization.authorizedUserName;
        };

        self.getAccessToken = function () {
            console.log("MBE Authorization authorizedUserName: " + self.mobileBackend.Authorization.authorizedUserName);
            console.log("MBE Authorization AuthenticationType: " + self.mobileBackend.Authorization.AuthenticationType);
            console.log("MBE Authorization isAuthorized: " + self.mobileBackend.Authorization.isAuthorized());
            console.log("MBE Authorization isTokenValid: " + self.mobileBackend.Authorization.isTokenValid());
            console.log("MBE Authorization Token: " + self.mobileBackend.Authorization.getAccessToken());
            return self.mobileBackend.Authorization.getAccessToken();            
        };

        self.invokePlatformRequest = function (path, method, data, successCallback, errorCallback) {
            var mbe = self.mobileBackend;
            var headers = mbe.getHttpHeaders();
            headers["Content-Type"] = 'application/json';

            var customData = JSON.stringify(data);
            //    headers["Content-Length"] = customData.length;

            mcs.MobileBackendManager.platform.invokeService({
                method: method,
                url: mbe.getPlatformUrl(path),
                headers: headers,
                body: customData,
                success: function (response, data) {
                    if (successCallback != null) {
                        successCallback(response.status, data);
                    }
                },
                error: function (statusCode, data) {
                    if (errorCallback != null) {
                        errorCallback(statusCode, data);
                    }
                }
            });
        };


        self.getAllCollections = function (success, failed) {
            self.invokePlatformRequest("storage/collections", "GET", null,
                    success, failed);
        };

        self.getObjects = function (id, success, failed) {
            //return a storage collection with the name assigned to the collection_id variable.
            self.invokePlatformRequest("storage/collections/" + id + "/objects?orderBy=modifiedOn:desc", "GET", null,
                    success, failed);
        };

        // return blob for success
        self.getObjectById = function (collection, obj_id, success, failed) {
            self.mobileBackend.Storage.getCollection(collection, self.mobileBackend.Authorization.authorizedUserName,
                    function (storageCollection) {
                        storageCollection.getObject(obj_id, function (storageObject) {
                            success(storageObject.getPayload());
                        }, failed, 'blob');
                    }, failed);

        };


        self.uploadFile = function (COLLECTION_NAME, filename, payload, mimetype, successCallback, failCallback) {
            self.getCollection(COLLECTION_NAME).then(success, failed);
            function success(collection) {
                //create new Storage object and set its name and payload
                var obj = new mcs.StorageObject(collection);
                obj.setDisplayName(filename);
                obj.loadPayload(payload, mimetype);
                return self.postObject(collection, obj).then(successCallback, failCallback);
            }

            function failed(statusCode, message) {
                var errorMsg = "Failed to post storage object to " + COLLECTION_NAME + " collection: " + statusCode + " " + message;
                failCallback(statusCode, errorMsg);
            }
        };



        //getCollection taken from official documentation example at site https://docs.oracle.com/cloud/latest/mobilecs_gs/MCSUA/GUID-7DF6C234-8DFE-4143-B138-FA4EB1EC9958.htm#MCSUA-GUID-7A62C080-C2C4-4014-9590-382152E33B24
        //modified to use JQuery deferred instead of $q as shown in documentaion
        self.getCollection = function (COLLECTION_NAME) {
            var deferred = $.Deferred();
            //return a storage collection with the name assigned to the collection_id variable.
            self.mobileBackend.Storage.getCollection(COLLECTION_NAME,
                    self.mobileBackend.Authorization.authorizedUserName, onGetCollectionSuccess,
                    onGetCollectionFailed);
            return deferred.promise();
            function onGetCollectionSuccess(collection) {
                console.log("Collection id: " + collection.id + ", description: " +
                        collection.description);
                deferred.resolve(collection);
            }
            function onGetCollectionFailed(statusCode, message) {
                console.log(mcs.logLevelInfo, "Failed to download storage collection:" + statusCode);
                deferred.reject(statusCode, message);
            }
        };

        //postObject taken from official documentation example at site https://docs.oracle.com/cloud/latest/mobilecs_gs/MCSUA/GUID-7DF6C234-8DFE-4143-B138-FA4EB1EC9958.htm#MCSUA-GUID-7A62C080-C2C4-4014-9590-382152E33B24
        //modified to use JQuery deferred instead of $q as shown in documentaion
        self.postObject = function (collection, obj) {
            var deferred = $.Deferred();
            //post an object to the collection
            collection.postObject(obj, onPostObjectSuccess, onPostObjectFailed);
            return deferred.promise();
            function onPostObjectSuccess(status, object) {
                console.log("Posted storage object, id: " + object.id);
                deferred.resolve(object.id);
            }
            function onPostObjectFailed(statusCode, message) {
                console.log("Failed to post storage object: " + statusCode);
                deferred.reject(statusCode, message);
            }
        };

        self.invokeCustomAPI = function (path, method, data, successCallback, errorCallback) {
            var jsonData = [{}];
            if (data != null && data.length > 0)
            {
                jsonData = JSON.parse(data);
            }
            self.mobileBackend.CustomCode.invokeCustomCodeJSONRequest(path, method, jsonData, successCallback, errorCallback);
        };

        self.registerForNotifications = function (deviceToken, successCallback, errorCallback) {
            self.mobileBackend.Notifications.registerForNotifications(deviceToken, self.appId, self.appVersion,
                    successCallback, errorCallback);
        };

        init();
    }
    ;

    return new MobileBackend();
});