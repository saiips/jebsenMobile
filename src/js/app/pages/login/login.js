/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/appui', 'pages/login/loginService', 'util/devmode', 'config/appconfig', 'pages/common/constant', 'pages/common/maintenance',
    'ojs/ojswitch', 'ojs/ojbutton', 'ojs/ojinputtext', 'ojs/ojcheckboxset'
], function (oj, ko, $, app, ui, service, devMode, appConfig, constant, maintenance) {

    var LOGIN_USER_KEY = constant.LOGIN_USER_KEY;
    var LOGIN_REMEMBER_KEY = constant.LOGIN_REMEMBER_KEY;

    function LoginPage() {
        var self = this;
        self.router = app.router;
        var subscribers = [];

        self.username = ko.observable();
        self.password = ko.observable();
        self.isDevMode = ko.observable(devMode.isEnabled());
        self.rememberMe = ko.observable(true);
        self.forgotPasswordURL = ko.observable(appConfig.get("forgotPasswordURL"));
        self.buildVersion = ko.observable(app.moduleConfig.params.rootContext.buildVersion + " " +  "(" + app.moduleConfig.params.rootContext.environment + ")");
        self.userChanged = ko.observable(false);
        self.registerMCS = ko.observable(true);
        
        var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
        self.large = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);

        var PAGE_SPRINGBOARD = "springboard";
        var PAGE_INIT_LOAD = "initLoad";

        function init() {
            initTranslations();
            initRememberMe();
            initUser();
            self.userChanged(false);
            self.registerMCS(true);

            if (devMode.isEnabled()) {
                initDevOpts();
            }

            // exit app on device back button
            if (navigator.app) {
                navigator.app.backAction = function (e) {
                    e.preventDefault();
                    navigator.app.exitApp();
                };
            }
        }

        function initLandingPage() {
            if (isRequireInitLoad()) {
                return PAGE_INIT_LOAD;
            }
            return PAGE_SPRINGBOARD;
        }

        function isRequireInitLoad() {
            var initLoadFlag = ui.getLocalStorage(constant.REQUIRE_INIT_LOAD);
            if (initLoadFlag == "Y" || typeof initLoadFlag === "undefined") {
                return true;
            }
            return false;
        }

        // this function make sure the login information are cleared when the
        // app comes to login page (by logout or somehow thru window.history)
        function initUser() {
            setUserProfile(null);
            service.init();
        }

        function setUserProfile(_user) {
            var user = {};
            
            if (_user) {
                _user.displayName = _user.firstName + " " + _user.lastName;
                // handle the extended attributes from IDCS +
                user.displayName = _user.displayName;
                user.username = _user.username;
                user.email = _user.email;
                user.firstName = _user.firstName;
                user.lastName = _user.lastName;
                var attribute = _user.attributes[constant.EXTENTED_ATTRIBUTE];
                user.salesRole = attribute.salesRole;
                user.erpSalesId = attribute.erpSalesId;
                user.orgUnitId = attribute.orgUnitId;
                user.licenseNo = attribute.licenseNo;
                // handle the extended attributes from IDCS -
            } else {
                user = _user;
            }
            app.moduleConfig.params.rootContext.userProfile = user;
        }

        function initDevOpts() {
            self.useMCSMock = ko.observable(devMode.useMCSMock());
            self.isOffline = ko.observable(devMode.isOffline());
            // notify and update devmode values when/if changed
            subscribers.push(self.useMCSMock.subscribe(function (newValue) {
                devMode.useMCSMock(newValue);
            }));
            subscribers.push(self.isOffline.subscribe(function (newValue) {
                devMode.isOffline(newValue);
            }));
        }

        function initRememberMe() {
            // if remember me is set (or never been set) get stored user info if they exist in local storage
            // var storedRemember = ui.getLocalStorage(LOGIN_REMEMBER_KEY);
            var storedRemember = true;

            if (storedRemember === true) {
                self.rememberMe(true);
                var storedUser = ui.getLocalStorage(LOGIN_USER_KEY);
                if (storedUser !== null) {
                    self.username(storedUser);
                }
            } else {
                self.rememberMe(false);
            }
        }

        self.onPageReady = function () {
        };
        
        self.signIn = function (data, event) {
            ui.showBusy();
            
            console.log(":::::::::: Sign In ::::::::::");
            //Authenticate against MCS
            service.login(self.username(), self.password()).done(function (user) {
                // found different user and then clear the localStorage
                var storedUser = ui.getLocalStorage(LOGIN_USER_KEY);
                if (typeof storedUser === "undefined" || storedUser != self.username()) {
                    self.userChanged(true);
                    app.moduleConfig.params.rootContext.isUserChanged = true;
                    $.each(amplify.store(), function (storeKey) {
                        if (storeKey != constant.DEV_OPTS_KEY && storeKey != constant.DEV_AUTH_HEADERS_KEY) {
                            amplify.store(storeKey, null);
                        }
                    });
                } else {
                   app.moduleConfig.params.rootContext.isUserChanged = false;
                }
                // store the user profile and its id to the mobile device
                setUserProfile(user);
                storeUserId();
                
                console.log("********* initial maintenance window *******");
                maintenance.init();                

            }).then(function () {
                var token = service.getToken(self.username(), self.password());
                ui.setLocalStorage(constant.BASE64_LOGON_TOKEN, token);
                ui.setLocalStorage(constant.USER_PROFILE, app.moduleConfig.params.rootContext.userProfile);
                
            }).fail(function (error) {
                console.log(":::::::::: Logon Failed  ::::::::::");
                ui.hideBusy();
                ui.showMessageBox(self.lng_invalidLogin);
                
            }).then(function () {
                console.log(":::::::::: Get the App Version  ::::::::::");
                service.getAppVersion().then(function (data) {
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    var isMaintenance = maintenance.isMaintenance();
                    var isCordova = app.moduleConfig.params.rootContext.isCordova;
                    
                    console.log("getAppVersion = " + ko.toJSON(data));
                    if (Array.isArray(data)) data = data[0];
                    var respJSON = data;
                    
                    var frontEndVersion = respJSON['P_FRONTEND_VER'];
                    var backEndVersion = respJSON['P_BACKEND_VER'];

                    var clientBuildVersion = new String(app.moduleConfig.params.rootContext.buildVersion);
                    var cachedBuildVersion = new String(ui.getLocalStorage(constant.CLIENT_FRONTEND_VERSION));
                    var clientBackendVersion = new String(ui.getLocalStorage(constant.CLIENT_BACKEND_VERSION));

                    console.log("Server [frontend version] =" + frontEndVersion);                    
                    console.log("Config [build version] =" + clientBuildVersion)
                    console.log("Cached [build version] =" + cachedBuildVersion);
                    console.log("Server [backend version] =" + backEndVersion);
                    console.log("Client [backend version] =" + clientBackendVersion);

                    if (isOnline && !isMaintenance && !self.isDevMode() && isCordova) {
                        if (typeof cachedBuildVersion === "undefined" || typeof clientBackendVersion === "undefined") {
                            ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "Y");
                            ui.setLocalStorage(constant.CONFIRMATION_REQUIRE_INIT_LOAD, false);
                            ui.setLocalStorage(constant.CLIENT_BACKEND_VERSION, backEndVersion);
                            ui.setLocalStorage(constant.CLIENT_FRONTEND_VERSION, clientBuildVersion);                            
                        } else {
                            if ( (new String(cachedBuildVersion).valueOf() != new String(clientBuildVersion).valueOf()) || 
                                 (new String(clientBackendVersion).valueOf() != new String(backEndVersion).valueOf()) ) {
                                ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "Y");
                                ui.setLocalStorage(constant.CONFIRMATION_REQUIRE_INIT_LOAD, true);
                                ui.setLocalStorage(constant.CLIENT_BACKEND_VERSION, backEndVersion);
                                ui.setLocalStorage(constant.CLIENT_FRONTEND_VERSION, clientBuildVersion);
                            } else {
                                ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "N");
                                ui.setLocalStorage(constant.CONFIRMATION_REQUIRE_INIT_LOAD, false);
                            }
                        }
                    }
                    
                    // skip the confirmation if user changed
                    if (self.userChanged()) {
                        ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "Y");
                        ui.setLocalStorage(constant.CONFIRMATION_REQUIRE_INIT_LOAD, false);
                    }
                    
                    // skip initial download if offline / under maintenance
                    if (!isOnline || isMaintenance || self.isDevMode() || !isCordova) {
                        ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "N");
                        ui.setLocalStorage(constant.CONFIRMATION_REQUIRE_INIT_LOAD, false);
                    }
                    
                    // skip initial download if it is a DRIVER
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    if (user.salesRole == constant.SR_DRIVER_JLOG || user.salesRole == constant.SR_DRIVER_LINDE) {
                        ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "N");
                        ui.setLocalStorage(constant.CONFIRMATION_REQUIRE_INIT_LOAD, false);                        
                    }
                    
                    // turn on data loading for Order Desk Administrator
                    if (user.salesRole == constant.SR_ADMIN) {
                        var cachedOrderDeskVersion = ui.getLocalStorage(constant.ORDER_DESK_VERSION);
                        if (typeof cachedOrderDeskVersion === "undefined") {
                            ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "Y");
                            ui.setLocalStorage(constant.ORDER_DESK_VERSION, "Y");
                        } else {
                            ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "N");
                        }
                        var cachedOrderDeskVersion = ui.getLocalStorage(constant.ORDER_DESK_VERSION);
                        console.log("cachedOrderDeskVersion="+cachedOrderDeskVersion );
                    }               
                    
                    // abort logon if client build version is not matched
                    if ( (isOnline && !self.isDevMode() && !isMaintenance && isCordova) && (new String(clientBuildVersion).valueOf() !=  new String(frontEndVersion).valueOf())) {
                        self.registerMCS(false);
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_newVersion);           
                    }

                }).then(function () {
                        var page = initLandingPage();
                        console.log("initLandingPage = " + page);
                        
                        if (self.registerMCS()) {
                            // regiser device to MCS Push Notification
                            service.registerDeviceForMCSPush().then(function (data) {
                                console.log(":::::::::: Device registered for MCS Push Notifications ::::::::::");
                                console.log(ko.toJSON(data));
                            }, function (error, status, xhr) {
                                console.log("ERROR DEV REG: " + error);
                                // if device registration fails, we still continue, user will
                                // just not receive push notifications
                            }).then(function () {
                                ui.hideBusy();
                                var confirmDownload = ui.getLocalStorage(constant.CONFIRMATION_REQUIRE_INIT_LOAD);
                                console.log("confirmDownload =" + confirmDownload);
                                if (confirmDownload) {
                                    if (confirm(self.lng_requireInitalLoad)) {
                                        oj.Router.rootInstance.go(page);
                                    } else {
                                        oj.Router.rootInstance.go('login');
                                    }
                                } else {
                                    oj.Router.rootInstance.go(page);
                                }
                            });
                        } else {
                            var user = app.moduleConfig.params.rootContext.userProfile;
                            if (user.salesRole == constant.SR_ADMIN) {
                                ui.hideBusy();
                                oj.Router.rootInstance.go(page);
                            }
                        }
                        
                    });         
                    
                });
         
        };

        self.onCannotSignIn = function () {
            ui.showMessageBox(self.lng_selfServiceApp, self.lng_cantSignInMsg);
        };

        self.handleDetached = function () {
            if (navigator.app && navigator.app.backAction) {
                delete navigator.app.backAction;
            }
        };

        self.dispose = function () {
            for (var i = 0; i < subscribers.length; i++) {
                subscribers[i].dispose();
            }
        };
        
        self.showPassword = function () {
            var obj = document.getElementById('text-password');
            if (obj.type == "password") {
                obj.type = "text";
            } else {
                obj.type = "password";
            }
        };

        function storeUserId() {
            if (self.rememberMe()) {
                ui.setLocalStorage(LOGIN_USER_KEY, self.username());
                ui.setLocalStorage(LOGIN_REMEMBER_KEY, true);
            } else {
                ui.setLocalStorage(LOGIN_USER_KEY, null);
                ui.setLocalStorage(LOGIN_REMEMBER_KEY, false);
            }
        }
        
        function initTranslations() {
            // language translations
            var getTranslation = oj.Translations.getTranslatedString;
            self.lng_selfServiceApp = getTranslation("ssa.login.selfServiceApp");
            self.lng_apptitle = getTranslation("ssa.apptitle");
            self.lng_signIn = getTranslation("ssa.login.signIn");
            self.lng_username = getTranslation("ssa.login.username");
            self.lng_password = getTranslation("ssa.login.password");
            self.lng_copyright = getTranslation("ssa.login.copyright");
            self.lng_accountAccess = getTranslation("ssa.login.accountAccess");
            self.lng_rememberMe = getTranslation("ssa.login.rememberMe");
            self.lng_cancel = getTranslation("ssa.menu.cancel");
            self.lng_invalidLogin = getTranslation("ssa.login.invalidLogin");
            self.lng_cantSignInMsg = getTranslation("ssa.login.cantSignInMsg");
            self.lng_requireInitalLoad = getTranslation("ssa.msg.info.requireInitalLoad");
            self.lng_newVersion = getTranslation("ssa.msg.info.newVersion");
        }

        init();
        
        $(document).ready(
                function ()
                {
                    if (typeof self.username() === "undefined" || self.username().length <= 0) {
                        document.getElementById("text-username").focus();
                    } else {
                        document.getElementById("text-password").focus();
                    }
                }
        ); 
    }
    
    
    ko.bindingHandlers.executeOnEnter = {
        init: function (element, valueAccessor, allBindings, viewModel) {
            var callback = valueAccessor();
            $(element).keypress(function (event) {
                var keyCode = (event.which ? event.which : event.keyCode);
                if (keyCode === 13) {
                    callback.call(viewModel);
                    return false;
                }
                return true;
            });
        }
    };    

    return LoginPage;
});
