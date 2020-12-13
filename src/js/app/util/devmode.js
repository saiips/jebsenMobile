/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'amplify', 'config/appconfig', 'util/appui'
], function (ko, $, amplify, appConfig, ui) {
    'use strict';

    var DEV_OPTS_KEY = "dev.opts";
    var DEV_AUTH_HEADERS_KEY = "dev.auth.headers";

    function DevMode() {
        var self = this;

        this.isEnabled = function() {
            return ui.getLocalStorage(DEV_OPTS_KEY) != null;
        };

        this.getDevOpts = function() {
            var devOpts = ui.getLocalStorage(DEV_OPTS_KEY);
            if (devOpts == null) {
                devOpts = {};
            }
            return devOpts;
        };

        this.setDevOpts = function(devOpts) {
            ui.setLocalStorage(DEV_OPTS_KEY, devOpts);
        };

        this.clear = function() {
            self.setDevOpts(null);
        };

        this.useMCSMock = function(newValue) {
            var devOpts = self.getDevOpts();
            if (typeof newValue === "undefined") {
                return devOpts && devOpts.useMCSMock;
            }
            else {
                devOpts.useMCSMock = newValue;
                self.setDevOpts(devOpts);
                appConfig.set('useMockDataFromMCS', newValue);
            }
        };

        this.isOffline = function(newValue) {
            var devOpts = self.getDevOpts();
            if (typeof newValue === "undefined") {
                return devOpts && devOpts.isOffline;
            }
            else {
                devOpts.isOffline = newValue;
                self.setDevOpts(devOpts);
            }
        };

        this.ensureProfile = function(params) {
            if (params && params.rootContext && params.rootContext.userProfile) {
                return params.rootContext.userProfile;
            } else {
                return {
                    "username": "BPALMER",
                    "email": "bpalmer@vision.com",
                    "firstName": "Blair",
                    "lastName": "Palmer",
                    "displayName": "Palmer, Mr. Blair D. (Blair)",
                    "pictureSrc": "img/profiles/default.svg",
                    "isManager": true,
                    "jobTitle": "Director",
                    "managerFullName": "Erickson, Mr. Barry",
                    "managerEmail": "berickso@vision.com"
                }
            }
        };
        
        this.init = function (){
          // this._ensureUseMockDataFromMCS();
          this._ensureAuthHeaders();
        }
        
        /**
         * Ensure the UseMockDataFromMCS variable correctly reflected on 
         * appConfig
         */
        this._ensureUseMockDataFromMCS = function() {
          if (this.isEnabled()) {
              var devOpts = ui.getLocalStorage(DEV_OPTS_KEY);
              if (devOpts) {
                  appConfig.set('useMockDataFromMCS', devOpts.useMCSMock);
              }
          }
        };

        /**
         * Restore auth headers from local storage. Used in development, to retain auth when page is reloaded.
         */
        this._ensureAuthHeaders = function() {            
            if (this.isEnabled()) {
                var authHeaders = ui.getLocalStorage(DEV_AUTH_HEADERS_KEY);
                if (authHeaders) {
                    $.ajaxSetup({headers: authHeaders});
                }
            }
        };

        /**
         * Store auth headers to local storage. Used in development, to retain auth when page is reloaded.
         */
        this.preserveAuthHeaders = function(headers) {
            if (this.isEnabled()) {
                ui.setLocalStorage(DEV_AUTH_HEADERS_KEY, headers);
            }
        };

    }

    return new DevMode();
});
