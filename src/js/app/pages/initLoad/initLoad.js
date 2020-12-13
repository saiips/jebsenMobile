/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'amplify', 'util/appui', 'util/devmode', 'appController', 'config/appconfig', 'pages/common/constant',
    'pages/initLoad/initLoadService',  'pages/login/loginService', 'ojs/ojdialog', 'ojs/ojrouter', 'ojs/ojnavigationlist'
], function (oj, ko, $, amplify, ui, devMode, app, appConfig, constant, initLoadService, service) {

    function InitLoadViewModel() {
        var self = this;

        self.percentage = ko.observable(0);

        self.ready = ko.observable(false);

        initTranslation();
        
        var timer = setInterval(function () {
            self.percentage(getLoadedPercentage());
        }, appConfig.get("refreshProgress"));

        self.percentage.subscribe(function () {
            if (self.percentage() == 100) {
                clearTimeout(timer);
                completeInitLoad();
            }
        });
        
        function isDefined(value) {
            if (typeof value === "undefined" || !value) {
                return false;
            }
            return true;
        }
        
        function getLoadedPercentage() {
            var totalRequest = app.moduleConfig.params.rootContext.totalRequest;
            var completedRequest = app.moduleConfig.params.rootContext.completedRequest;
            var trackedRequest = app.moduleConfig.params.rootContext.trackedRequest;

            // handle the case when the percentage is 100
            if (self.percentage().toFixed(0) == 100) return 100;

            // handle the case when the initial count does not match with the actual request count
            if (self.percentage().toFixed(0) > 0 && self.percentage().toFixed(0) < 100) {
                console.log("trackedRequest=" + ko.toJSON(trackedRequest));
                if (isNaN(trackedRequest[completedRequest])) {
                    // empty the trackedRequest hashMap
                    // var emptyTracked = {};
                    // app.moduleConfig.params.rootContext.trackedRequest = emptyTracked;                    
                    for (var member in app.moduleConfig.params.rootContext.trackedRequest) {
                        delete app.moduleConfig.params.rootContext.trackedRequest[member];
                    }
                    trackedRequest[completedRequest] = 1;
                } else {
                    trackedRequest[completedRequest] = new Number(trackedRequest[completedRequest]) + 1;
                    if (new Number(trackedRequest[completedRequest]) >= constant.INIT_LOAD_WAIT_COUNT) {
                        return 100;
                    }
                }
                app.moduleConfig.params.rootContext.trackedRequest = trackedRequest;
            }
            
            if (completedRequest >= totalRequest) return 100;
            
            if (typeof totalRequest !== "undefined") {
                return ((completedRequest / totalRequest) * 100);
            } else {
                return 0;
            }
        }

        self.handleActivated = function (info) {
            console.log("handleActivated");
            var isOnline = checkNetwork();
            if (isOnline) {
                init();
            } else {
                ui.showMessageBox(self.lng_jebsenMobile, self.lng_error_00015);
                app.go("login");
            }
        };


        function checkNetwork() {
            var isOnline = app.moduleConfig.params.rootContext.isOnline;
            if (typeof isOnline === "undefined") {
                isOnline = deviceReady.isOnline();
            }
            return isOnline;
        }


        function init() {
            console.log("init");
            
            console.log("Initialize initLoadMap and completedRequest");
            var isOnline = app.moduleConfig.params.rootContext.isOnline;
            var isOrderDesk = false;
            
            // initialize the initLoadMap and completedRequest count
            app.moduleConfig.params.rootContext.initLoadMap = {};
            app.moduleConfig.params.rootContext.completedRequest = 0;
            app.moduleConfig.params.rootContext.trackedRequest = {};
            
            // clear the amplify local store
            $.each(amplify.store(), function (storeKey) {
                // Delete the current key from Amplify storage
                if (storeKey != constant.LOGIN_USER_KEY && storeKey != constant.LOGIN_REMEMBER_KEY &&
                        storeKey != constant.BASE64_LOGON_TOKEN && storeKey != constant.USER_PROFILE &&
                        storeKey != constant.CLIENT_FRONTEND_VERSION && storeKey != constant.CLIENT_BACKEND_VERSION &&
                        storeKey != constant.LOCALE_KEY && storeKey != constant.DEV_OPTS_KEY && storeKey != constant.DEV_AUTH_HEADERS_KEY && storeKey != constant.ORDER_DESK_VERSION &&
                        storeKey != constant.PRINTER_MAC_ADDRESS && storeKey != constant.PRINTER_SERIAL_NO) {
                    amplify.store(storeKey, null);
                }
            });            
            
            // get initial load count
            console.log(":::::::::: Get the Initial Request Count ::::::::::");
            var requireInitLoad = ui.getLocalStorage(constant.REQUIRE_INIT_LOAD);
            if (typeof requireInitLoad === "undefined" && !isOnline) { 
                requireInitLoad = 'N';
            } else if (typeof requireInitLoad === "undefined" && isOnline) {
                requireInitLoad = 'Y';
            }
            console.log("requireInitLoad = " + requireInitLoad);
            
            var user = app.moduleConfig.params.rootContext.userProfile;
            if (user.salesRole == constant.SR_ADMIN) {
                isOrderDesk = true;
            }
            
            if (!isOrderDesk) {
                // get initial load request
                service.getInitiaLoadRequest(requireInitLoad).then(function (data) {
                    console.log("getInitialLoadRequest = " + ko.toJSON(data));
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    if (Array.isArray(data))
                        data = data[0];
                    // var respJSON = data['OutputParameters'];
                    var respJSON = data;
                    // define the standard request
                    var numSubInventoryRequest = 1;
                    var numShipmentMethodRequest = 1;
                    var numStandardPriceRequst = 1;
                    var deliveryListCnt = 1;
                    // no. of record return from back end
                    var customerListCnt = respJSON['P_CUST_CNT'];
                    var priceListCnt = respJSON['P_PLIST_CNT'];
                    var orderListCnt = respJSON['P_ORDER_CNT'];
                    var quotationListCnt = respJSON['P_QUOTE_CNT'];
                    var deliveryDetailCnt = respJSON['P_DN_CNT'];
                    var numCustomerRequest = 1;
                    var numPriceListRequest = new Number(customerListCnt);
                    // var numOrderRequest = new Number(customerListCnt) + new Number(orderListCnt);
                    var numOrderRequest = (user.salesRole == constant.SR_SALE_VAN) ? 0 : new Number(customerListCnt);
                    var numQuotationRequest = 0;
                    if (user.salesRole == constant.SR_MOBILE_SALE && user.orgUnitId == constant.ORG_UNIT_ID_WINE) {
                        numQuotationRequest = new Number(customerListCnt) + new Number(quotationListCnt);
                    }
                    var numDeliveryRequest = 0;
                    if (user.salesRole == constant.SR_SALE_VAN) {
                        numDeliveryRequest = deliveryListCnt + new Number(deliveryDetailCnt);
                    }

                    var totalRequest = numCustomerRequest +
                            numSubInventoryRequest + numShipmentMethodRequest + numStandardPriceRequst +
                            numPriceListRequest +
                            numOrderRequest +
                            numQuotationRequest +
                            numDeliveryRequest;
                    app.moduleConfig.params.rootContext.totalRequest = totalRequest;
                    app.moduleConfig.params.rootContext.completedRequest = 0;
                    console.log("getInitialLoadRequest totalRequest = " + totalRequest);
                }).then(function () {
                    if (requireInitLoad == "Y" || typeof requireInitLoad === "undefined") {
                        // reset the value;
                        self.ready(true);
                        self.percentage(0);
                        // call web service to download the data    
                        runDataOffline();
                        // complete the data offline
                        // completeInitLoad();
                    } else {
                        self.ready(false);
                        self.percentage(100);
                        app.go("springboard");
                    }
                });
            } else {
                // define the standard request for order desk administrator
                var numSubInventoryRequest = 1;
                var numShipmentMethodRequest = 1;
                var numStandardPriceRequst = 2;
                var numCustomerRequest = 2;
                var numSalesRepRequest = 2;

                var totalRequest = numCustomerRequest +
                        numSubInventoryRequest + numShipmentMethodRequest + numStandardPriceRequst +
                        numSalesRepRequest;
                app.moduleConfig.params.rootContext.totalRequest = totalRequest;
                app.moduleConfig.params.rootContext.completedRequest = 0;
                console.log("getInitialLoadRequest totalRequest = " + totalRequest);                
                
                if (requireInitLoad == "Y" || typeof requireInitLoad === "undefined") {
                    // reset the value;
                    self.ready(true);
                    self.percentage(0);
                    // call web service to download the data    
                    runDataOffline();
                    // complete the data offline
                    // completeInitLoad();
                } else {
                    self.ready(false);
                    self.percentage(100);
                    app.go("springboard");
                }                
            }
        }

        function completeInitLoad() {
            console.log("completeInitLoad started");
            var user = app.moduleConfig.params.rootContext.userProfile;
            var isOrderDesk = false;
            if (user.salesRole == constant.SR_ADMIN) {
                isOrderDesk = true;
            }
            
            // Y - data sync is required
            // N - data sync is not required
            var requireInitLoad = ui.getLocalStorage(constant.REQUIRE_INIT_LOAD);
            if (requireInitLoad == "Y" || typeof requireInitLoad === "undefined") {
                ui.setLocalStorage(constant.REQUIRE_INIT_LOAD, "N");
                app.moduleConfig.params.rootContext.initDataSync = "N";
                app.moduleConfig.params.rootContext.requireRefresh = true;
                if (!isOrderDesk) {
                    app.moduleConfig.params.rootContext.refreshCustomerList = true;
                }
                if (self.percentage() == 100) {
                    ui.showMessageBox(self.lng_jebsenMobile, self.lng_downloadComplete);
                    showRequestCount();
                    app.go("springboard");
                }
            }
        }
        
        function showRequestCount() {
            console.log("Total Request Count :" + ko.toJSON(app.moduleConfig.params.rootContext.initLoadMap));
        }


        function runDataOffline() {
            console.log("runDataOffline started");
            var env = appConfig.get("environment");
            // skip the background process if it is dev
            // if (env == "dev") return ;
            var user = app.moduleConfig.params.rootContext.userProfile;
            var isOrderDesk = false;
            if (user.salesRole == constant.SR_ADMIN) {
                isOrderDesk = true;
            }

            ko.tasks.schedule(function () {
                initLoadService.registerSubInventoryList();
                initLoadService.registerShipmentMethodList();
                
                if (isOrderDesk) {
                    initLoadService.registerWineSalesPersonList();
                    initLoadService.registerBeerSalesPersonList();
                    initLoadService.registerWinePriceList();
                    initLoadService.registerBeerPriceList();
                    initLoadService.registerWineCustomerList();
                    initLoadService.registerBeerCustomerList();
                } else {
                    initLoadService.registerPriceList();
                    initLoadService.registerCustomerList();
                }
                
                if (user.salesRole == constant.SR_SALE_VAN) {
                    initLoadService.registerDeliveryList();
                }
            });
        }

        function initTranslation() {
            var getTranslation = oj.Translations.getTranslatedString;
            self.lng_initialLoading = getTranslation("ssa.initLoad.initialLoading");
            self.lng_jebsenMobile = getTranslation("ssa.initLoad.jebsenMobile");
            self.lng_error_00015 = getTranslation("ssa.msg.error.ERROR_00015");
            self.lng_downloadComplete = getTranslation("ssa.msg.info.downloadComplete");
            self.lng_loadingModule = getTranslation("ssa.initLoad.PRE_LOAD_MSG");
        }

    }

    ko.bindingHandlers.progressBar = {
        init: function (element) {
            return {controlsDescendantBindings: true};
        },
        update: function (element, valueAccessor, bindingContext) {
            var options = ko.unwrap(valueAccessor());
            var value = options.value().toFixed(0);
            var width = value + "%";

            $(element).addClass("progressBar");
            ko.applyBindingsToNode(element, {
                html: '<div data-bind="style: { width: \'' + width + '\' }"></div><div class="progressText" data-bind="text: \'' + value + ' %\'"></div>'
            });
            ko.applyBindingsToDescendants(bindingContext, element);
        }
    };

    return InitLoadViewModel;

});
