/**
 Copyright (c) 2015, 2016, Oracle and/or its affiliates.
 The Universal Permissive License (UPL), Version 1.0
 */
/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
'use strict';

/**
 * Example of Require.js boostrap javascript
 */

requirejs.config(
        {
            baseUrl: 'js',

            // Path mappings for the logical module names
            paths:
                    //injector:mainReleasePaths
                            {
                                'knockout': 'libs/knockout/knockout-3.4.0.debug',
                                "mapping": "libs/knockout/knockout.mapping-latest",
                                'jquery': 'libs/jquery/jquery-3.1.0',
                                'jqueryui-amd': 'libs/jquery/jqueryui-amd-1.12.0',
                                'promise': 'libs/es6-promise/es6-promise',
                                'hammerjs': 'libs/hammer/hammer-2.0.8',
                                'ojdnd': 'libs/dnd-polyfill/dnd-polyfill-1.0.0',
                                'ojs': 'libs/oj/v2.2.0/debug',
                                'ojL10n': 'libs/oj/v2.2.0/ojL10n',
                                'ojtranslations': 'libs/oj/v2.2.0/resources',
                                'text': 'libs/require/text',
                                'signals': 'libs/js-signals/signals',
                                'moment': 'libs/moment/moment.min',
                                'mcs': 'mcs/mcs',
                                'mcs_config': 'mcs/oracle_mobile_cloud_config',
                                'mbe': 'mbe/mbe',
                                'json': 'libs/require/json',
                                'amplify': 'libs/amplify/amplify.min',
                                'config': 'app/config',
                                'pages': 'app/pages',
                                'util': 'app/util',
                                'lzstring': 'libs/lz-string/lz-string.min',
                                'components': 'app/components'
                            }
                    //endinjector
                    ,
                    // Shim configurations for modules that do not expose AMD
                    shim: {
                        'jquery': {
                            exports: ['jQuery', '$']
                        },
                        'amplify': {
                            deps: ['jquery'], exports: 'amplify'
                        },
                        'maps': {
                            deps: ['jquery', 'i18n'],
                            exports: ['MVMapView']
                        }
                    },
                    // This section configures the i18n plugin. It is merging the Oracle JET built-in translation
                    // resources with a custom translation file.
                    // Any resource file added, must be placed under a directory named "nls". You can use a path mapping or you can define
                    // a path that is relative to the location of this main.js file.
                    config: {
                        ojL10n: {
                            merge: {
                                'ojtranslations/nls/ojtranslations': 'app/resources/nls/translations'
                            }
                        }
                    }
                });

        require(['ojs/ojcore', 'knockout', 'jquery', 'config/appconfig', 'appController', 'mbe', 'util/deviceready', 'util/devmode', 'util/errorhandler', 'util/appui',  'pages/common/constant', 'pages/common/maintenance', 'mcs_config', 'ojs/ojknockout',
            'ojs/ojmodule', 'ojs/ojrouter', 'ojs/ojnavigationlist', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojtable', 'ojs/ojarraytabledatasource', 'promise',
            'ojs/ojinputtext', 'ojs/ojselectcombobox', 'ojs/ojcollapsible'],
                function (oj, ko, $, appConfig, app, mbe, deviceReady, devMode, errorHandler, ui, constant, maintenance) { // this callback gets executed when all required modules are loaded
                    var getTranslation = oj.Translations.getResource;
                    var moduleConfig;
                    
                    oj.ModuleBinding.defaults.modelPath = 'app/';
                    oj.ModuleBinding.defaults.viewPath = 'text!app/';
                    
                    // init the devMode
                    devMode.init();
                    
                    // Register custom components
                    ko.components.register('header-bar', {require: 'app/components/header-bar/header-bar'});

                    function RootViewModel() {
                        var self = this;
                        self.router = app.router;

                        self.navDataSource = app.navDataSource;
                        self.navChangeHandler = app.navChangeHandler;

                        moduleConfig = $.extend(true, {}, self.router.moduleConfig, {params: {'rootContext': {}}});
                        self.moduleConfig = moduleConfig;
                        
                        // status of internet access
                        app.moduleConfig.params.rootContext.isOnline = deviceReady.isOnline();
                        
                        // type to access the app
                        app.moduleConfig.params.rootContext.isCordova = deviceReady.isCordova();
                        console.log("Mobile app runs on Cordova is " + app.moduleConfig.params.rootContext.isCordova);
                        
                        // if is dev build enable dev mode
                        var devBuild = appConfig.get("devMode");
                        console.log("devBuild=" + devBuild + "; isEnabled=" + devMode.isEnabled());
                        if (devBuild && !devMode.isEnabled()) {
                            devMode.setDevOpts({
                                useMCSMock: false,
                                isOffline: false
                            });
                        } else if (devBuild && devMode.isEnabled()) {
                            devMode.setDevOpts({
                                useMCSMock: true,
                                isOffline: true
                            });
                        } else if (!devBuild) {
                            devMode.clear();
                        }          
                        
                        var buildVersion = appConfig.get("buildVersion");
                        app.moduleConfig.params.rootContext.buildVersion = buildVersion;
                        var environment = appConfig.get("environment");
                        app.moduleConfig.params.rootContext.environment = environment;
                        var isShowTranslation = appConfig.get("translation");
                        
                        self.showTranslation = ko.computed(function () {
                            return isShowTranslation;
                        });
                        
                        // default client locale
                        if (isShowTranslation) {
                            var root = url_query('root');
                            var lang = url_query('lang');
                            if (root == "loading") {
                                if (lang) {
                                    oj.Config.setLocale(lang);
                                } else {
                                    oj.Config.setLocale(constant.ZH_LOCALE);
                                }
                            } else {
                                var storedLocale = ui.getLocalStorage(constant.LOCALE_KEY);
                                console.log("stored locale = " + storedLocale);
                                if (typeof storedLocale === "undefined" || !storedLocale) {
                                    oj.Config.setLocale(constant.DEFAULT_LOCALE);
                                } else {
                                    oj.Config.setLocale(storedLocale);
                                }
                            }
                        } else {
                            oj.Config.setLocale(constant.DEFAULT_LOCALE);
                        }
                        
                        self.logout = function () {
                            mbe.logout();
                            mbe.isLoggedIn = false;
                            oj.Router.rootInstance.go('login');
                        };
                        
                        self.clearStore = function () {
                            console.log("clearStore");
                            var isOnline = app.moduleConfig.params.rootContext.isOnline;
                            var lng_error_00005 = getTranslation("ssa.msg.error.ERROR_00005");
                            var lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                            
                            if (isOnline) {
                                var isMaintenance = maintenance.isMaintenance();
                                if (isMaintenance) {
                                    ui.showMessageBox(lng_maintenance);
                                    return;
                                }  
                                if (confirm(getTranslation("ssa.msg.info.initialLoad"))) {
                                    // clear the amplify local store
                                    $.each(amplify.store(), function (storeKey) {
                                        // Delete the current key from Amplify storage
                                        if (storeKey != constant.LOGIN_USER_KEY && storeKey != constant.LOGIN_REMEMBER_KEY &&
                                                storeKey != constant.BASE64_LOGON_TOKEN && storeKey != constant.USER_PROFILE &&
                                                storeKey != constant.CLIENT_FRONTEND_VERSION && storeKey != constant.CLIENT_BACKEND_VERSION &&
                                                storeKey != constant.LOCALE_KEY && storeKey != constant.DEV_OPTS_KEY && storeKey != constant.DEV_AUTH_HEADERS_KEY &&
                                                storeKey != constant.PRINTER_MAC_ADDRESS && storeKey != constant.PRINTER_SERIAL_NO) {
                                            amplify.store(storeKey, null);
                                        }
                                    });
                                    // require inital load again
                                    ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "Y");
                                    ui.setLocalStorage(constant.ORDER_DESK_VERSION, "Y");
                                    // ui.showMessageBox("The offline data is cleared successfully.");
                                    oj.Router.rootInstance.go('initLoad');
                                }
                            } else {
                                ui.showMessageBox(lng_error_00005);
                            }
                        };
                        
                        self.dataSync = function() {
                            app.go("dataSync");
                        };
                        
                        self.translate = function() {
                            var storedLocale = ui.getLocalStorage(constant.LOCALE_KEY);
                            var currentLocale = getTranslation("ssa.locale");
                            console.log("stored locale = " + storedLocale);
                            console.log("current locale =" + currentLocale);
                            if (typeof storedLocale !== "undefined" && storedLocale) {
                                oj.Config.setLocale(storedLocale);
                            } else {
                                storedLocale = currentLocale;
                            }
                            var newLocale = constant.DEFAULT_LOCALE;
                            if (storedLocale != constant.DEFAULT_LOCALE) {
                                newLocale = constant.DEFAULT_LOCALE;
                            } else  {
                                newLocale = constant.ZH_LOCALE;
                            }
                            console.log("newLocale = " + newLocale);
                            ui.setLocalStorage(constant.LOCALE_KEY, newLocale);                            
                            oj.Config.setLocale(newLocale, function () {
                                console.log("refresh page");
                                oj.Router.sync().then(function () {
                                    $('#globalBody').hide();
                                    ko.cleanNode(document.getElementById('globalBody'));
                                    ko.applyBindings(new RootViewModel(), document.getElementById('globalBody'));
                                    $('#globalBody').show();
                                },
                                        function (error) {
                                            oj.Logger.error('Error in root start: ' + error.message);
                                        }
                                );                                
                            });

                        };
                    }
                    
                    function url_query(query) {
                        query = query.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
                        var expr = "[\\?&]" + query + "=([^&#]*)";
                        var regex = new RegExp(expr);
                        var results = regex.exec(window.location.href);
                        if (results !== null) {
                            return results[1];
                        } else {
                            return false;
                        }
                    }    
            

                    deviceReady(function (isCordova, platform) {
                        if (isCordova) {
                            try {
                                console.log("Mobile app runs on platform " + platform);
                                app.moduleConfig.params.rootContext.platform = platform;

                                var onlinecallback = function () {
                                    console.log('onlinecallback');
                                    errorHandler.clearError();
                                    app.moduleConfig.params.rootContext.isOnline = true;
                                };

                                var offlinecallback = function () {
                                    console.log('offlinecallback');
                                    errorHandler.setError("ERROR_NETWORK_NOT_CONNECTED");
                                    app.moduleConfig.params.rootContext.isOnline = false;
                                };

                                var pauseAppCallback = function () {
                                    console.log('pauseAppCallback');
                                    app.moduleConfig.params.rootContext.isPause = true;
                                };

                                var resumeAppCallback = function () {
                                    console.log('pauseAppCallback');
                                    app.moduleConfig.params.rootContext.isPause = false;
                                };

                                // register callbacks in case the state changed!
                                document.addEventListener("offline", offlinecallback, false);
                                document.addEventListener("online", onlinecallback, false);
                                document.addEventListener("resume", resumeAppCallback, false);
                                document.addEventListener("pause", pauseAppCallback, false);
                            } catch (e) {
                                console.error(e);
                            }

                            // handle device back button
                            document.addEventListener("backbutton", function(e) {
                                if (document.getElementById('payment') || document.getElementById('springboard')) {
                                    // nothing to do
                                } else if (document.getElementById('loginPage')) {
                                    e.preventDefault();
                                    navigator.app.exitApp();
                                } else {
                                    if (navigator.app.backAction) {
                                        navigator.app.backAction(e);
                                    } else {
                                        navigator.app.backHistory();
                                    }
                                }
                            }, false);                
                        }
                        oj.Router.defaults['urlAdapter'] = new oj.Router.urlParamAdapter();
                        oj.Router.sync().then(function () {
                            ko.applyBindings(new RootViewModel(), document.getElementById('globalBody'));
                            $('#globalBody').show();
                        },
                                function (error) {
                                    oj.Logger.error('Error in root start: ' + error.message);
                                }
                        );
                    });

                }
        );
