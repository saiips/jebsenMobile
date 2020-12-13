define(['ojs/ojcore', 'knockout', 'jquery', 'appController',  'util/appui', 'pages/common/constant', 'pages/common/cartService', 'pages/delivery/deliveryService', 'pages/common/maintenance',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox', , 'ojs/ojnavigationlist', 'promise', 'ojs/ojcollapsible'],
        function (oj, ko, $, app, ui, constant, cartService, deliveryService, maintenance) {

            function SpringBoardViewModel() {
                var self = this;
                var getTranslation = oj.Translations.getTranslatedString;
                
                // default setup
                app.moduleConfig.params.rootContext.fromPage = "springboard";
                app.moduleConfig.params.rootContext.isDataSync = false;
                app.moduleConfig.params.rootContext.savedOrder = null;
                app.moduleConfig.params.rootContext.savedOrderLine = null;

                self.buildVersion = ko.observable(app.moduleConfig.params.rootContext.buildVersion + " " +  "(" + app.moduleConfig.params.rootContext.environment + ")");
                // Observable variables
                self.dummy = ko.observable();
                self.role = ko.observable();
                self.displayName = ko.observable();
                self.licenseNo = ko.observable('');
                self.clickedSchedule = ko.observable(true);
                var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                self.large = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                
                self.orgUnit = ko.observable();
                self.availableOrgUnits = ko.observableArray([
                    {value: constant.ORG_UNIT_ID_WINE, label: getTranslation("ssa.springboard.userRoleMSW")},
                    {value: constant.ORG_UNIT_ID_BEER, label: getTranslation("ssa.springboard.userRoleMSB")}
                ]);            
                // initialize the org unit id for order desk
                if (typeof app.moduleConfig.params.rootContext.selOrgUnitId === "undefined") {
                    self.orgUnit(constant.ORG_UNIT_ID_WINE);
                    rePackOrgUnit(constant.ORG_UNIT_ID_WINE);
                } else {
                    self.orgUnit(app.moduleConfig.params.rootContext.selOrgUnitId);
                    rePackOrgUnit(app.moduleConfig.params.rootContext.selOrgUnitId);
                }

                // subscribe changed organization unit id
                self.orgUnit.subscribe(function (newOrgUnit) {
                    console.log("newOrgUnit=" + newOrgUnit);
                    rePackOrgUnit(newOrgUnit);
                });           
                
                function rePackOrgUnit(newOrgUnit) {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        if (user.salesRole === constant.SR_ADMIN) {
                            app.moduleConfig.params.rootContext.selOrgUnitId = new String(newOrgUnit).valueOf();
                            app.moduleConfig.params.rootContext.userProfile.orgUnitId = new String(newOrgUnit).valueOf();
                            app.moduleConfig.params.rootContext.refreshCustomerList = true;
                        }
                    } catch (ex) {
                    } finally {
                        self.dummy.notifySubscribers();
                    }
                }
                
                self.displayScheduleOptions = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        if (user.salesRole === constant.SR_ADMIN) {
                            return self.clickedSchedule();
                        } else {
                            return false;
                        }
                    } catch (ex) {
                        return false;
                    }
                });
                
                self.customerListEnabled = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        var role = user.salesRole;
                        if (role === constant.SR_SALE_VAN || role === constant.SR_MOBILE_SALE || role === constant.SR_ADMIN) {
                            return true;
                        } else {
                            return false;
                        }
                    } catch (ex) {
                        return false;
                    }
                });        
                
                
                self.performanceEnabled = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        var role = user.salesRole;
                        if (role === constant.SR_SALE_VAN || role === constant.SR_MOBILE_SALE) {
                            return true;
                        } else {
                            return false;
                        }
                    } catch (ex) {
                        return false;
                    }
                });                     
                
                self.pickupEnabled = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        var role = user.salesRole;
                        if (role === constant.SR_SALE_VAN || role === constant.SR_DRIVER_JLOG || role === constant.SR_DRIVER_LINDE) {
                            return true;
                        } else {
                            return false;
                        }
                    } catch (ex) {
                        return false;
                    }
                });
                
                self.loadingEnabled = ko.computed(function () {
                   var user = app.moduleConfig.params.rootContext.userProfile;
                   try {
                        if (user.salesRole === constant.SR_ADMIN_JLOG || user.salesRole === constant.SR_DRIVER_JLOG || user.salesRole === constant.SR_DRIVER_LINDE) {
                            return true;
                        } else {
                            return false;
                        }                       
                   } catch (ex) {
                       return false;
                   }
                });
                
                self.reviewLoadingEnabled = ko.computed(function() {
                   var user = app.moduleConfig.params.rootContext.userProfile;
                   try {
                        if (user.salesRole === constant.SR_ADMIN_LINDE) {
                            return true;
                        } else {
                            return false;
                        }                       
                   } catch (ex) {
                       return false;
                   }                    
                });
                
                self.scheduleEnabled = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        if (user.salesRole === constant.SR_ADMIN) {
                            return true;
                        } else {
                            return false;
                        }
                    } catch (ex) {
                        return false;
                    }
                });                
                
                self.dailyReceptEnabled = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        var role = user.salesRole;
                        if (role === constant.SR_SALE_VAN) {
                            return true;
                        } else {
                            return false;
                        }
                    } catch (ex) {
                        return false;
                    }
                });
                
                self.dailyOrderSummaryEnabled = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        var role = user.salesRole;
                        if (role === constant.SR_SALE_VAN || role === constant.SR_MOBILE_SALE) {
                            return true;
                        } else {
                            return false;
                        }
                    } catch (ex) {
                        return false;
                    }
                });                  
                
                self.visitationEnabled = ko.computed(function() {
                   var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        // function obsolete
                        /* 
                        if (user.salesRole === constant.SR_MOBILE_SALE) {
                            return true;
                        }
                        */
                        return false;
                    } catch (ex) {
                        return false;
                    }                   
                });
                
                self.stockInquiryEnabled = ko.computed(function() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        var role = user.salesRole;
                        var orgUnitId = user.orgUnitId;
                        if ( (role === constant.SR_MOBILE_SALE && orgUnitId === constant.ORG_UNIT_ID_WINE) || 
                              role === constant.SR_ADMIN) {
                            return true;
                        }
                        return false;
                    } catch (ex) {
                        return false;
                    }
                });
                
                self.isDataSyncEnabled = ko.computed(function() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        var role = user.salesRole;
                        if ( role === constant.SR_MOBILE_SALE || role === constant.SR_SALE_VAN || role === constant.SR_ADMIN) {
                            return true;
                        }
                        return false;
                    } catch (ex) {
                        return false;
                    }                    
                });
                
                self.isPrinterSetupEnabled = ko.computed(function() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        var role = user.salesRole;
                        if (role === constant.SR_SALE_VAN) {
                            return true;
                        }
                    } catch (ex) {
                        return false;
                    }
                });
                
                self.isOrderDeskAdmin = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        if (user.salesRole === constant.SR_ADMIN) {
                            return true;
                        }
                        return false;
                    } catch (ex) {
                        return false;
                    }
                });
                
                self.isJLogAdmin = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        if (user.salesRole === constant.SR_ADMIN_JLOG) {
                            return true;
                        }
                        return false;
                    } catch (ex) {
                        return false;
                    }
                });
                
                self.isLindeAdmin = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        if (user.salesRole === constant.SR_ADMIN_LINDE) {
                            return true;
                        }
                        return false;
                    } catch (ex) {
                        return false;
                    }
                });                             
                
                self.reInitiateOrderEnabled = ko.computed(function () {
                    return self.isOrderDeskAdmin();
                });

                self.userRole = ko.computed(function () {
                    var role;
                    var user = app.moduleConfig.params.rootContext.userProfile;

                    try {
                        if (user.salesRole === constant.SR_SALE_VAN) {
                            role = getTranslation("ssa.springboard.userRoleVS");
                        } else if (user.salesRole === constant.SR_MOBILE_SALE) {
                            if (user.orgUnitId === constant.ORG_UNIT_ID_WINE) {
                                role = getTranslation("ssa.springboard.userRoleMSW");
                            } else if (user.orgUnitId === constant.ORG_UNIT_ID_BEER) {
                                role = getTranslation("ssa.springboard.userRoleMSB");
                            }
                        } else if (user.salesRole === constant.SR_ADMIN) {
                            role = getTranslation("ssa.springboard.userRoleADM");
                        } else if (user.salesRole === constant.SR_ADMIN_JLOG) {
                            role = getTranslation("ssa.springboard.userRoleJLA");
                        } else if (user.salesRole === constant.SR_DRIVER_JLOG || user.salesRole === constant.SR_DRIVER_LINDE) {
                            role = getTranslation("ssa.springboard.userRoleDRIVER");
                        }
                    } catch (ex) {
                    }
                    return role;
                });

                self.handleActivated = function (info) {
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("springboard parentRouter=" + parentRouter.currentState().value);

                    var userProfile = app.moduleConfig.params.rootContext.userProfile;
                    if (typeof userProfile !== "undefined") {
                        self.displayName(userProfile.displayName);
                        self.role(userProfile.role);
                        if (typeof userProfile.licenseNo !== "undefined" && userProfile.licenseNo) {
                            self.licenseNo('(' + userProfile.licenseNo + ')');
                        } else {
                            self.licenseNo('');
                        }
                    }
                    initTranslations();
                };

                self.quotationList = function (data, event) {
                    app.router.go('quotation');
                };

                self.customer = function (data, event) {
                    app.router.go('customer');
                };
                
                self.visitation = function (data, event) {
                    app.router.go('visitation');
                };

                self.stockInquiry = function (data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (isOnline) {
                        app.router.go('stockInquiry');
                    } else {
                        ui.showMessageBox(self.lng_error_00005);
                    }
                };

                self.performance = function (data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (isOnline) {
                        app.router.go('performance');
                    } else {
                        ui.showMessageBox(self.lng_error_00005);
                    }
                };

                self.pickup = function (data, event) {
                    app.moduleConfig.params.rootContext.fromPage = "springboard";
                    app.router.go('pickup');
                };
                
                self.loading = function (data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }                    
                    app.router.go('loading');
                };    
                
                self.reviewLoading = function(data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    app.router.go('reviewLoading');
                };
                
                self.schedule = function(data, event) {
                    self.clickedSchedule(!self.clickedSchedule());
                };                  
                
                self.logisticsSchMaint = function(data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    app.router.go('logisticsSchMaint');
                };           
                
                self.nonWorkingDateMaint = function(data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    app.router.go('nonWorkingDateMaint');
                }; 
                
                self.cutoffMaint = function(data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    app.router.go('routeCutoffMaint');
                };       
                
                self.earlierCutoffMaint = function(data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    app.router.go('routeEarlierCutoffMaint');
                };                   
                
                self.dailyReceipt = function (data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (isOnline) {
                        app.router.go('dailyReceipt');
                    } else {
                        ui.showMessageBox(self.lng_error_00005);
                    }
                };
                
                self.dailyOrders = function (data, event) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (isOnline) {
                        app.moduleConfig.params.rootContext.requireRefresh = true;
                        app.router.go('dailyOrders');
                    } else {
                        app.moduleConfig.params.rootContext.requireRefresh = false;
                        ui.showMessageBox(self.lng_error_00005);
                    }
                };
                
                self.reInitiateOrderList = function (data, event) {
                    app.router.go('reInitateOrder');
                };

                self.salesCustomer = function (data, event) {
                    app.router.go('salescustomer');
                };
                
                self.printerSetup = function (data, event) {
                    app.router.go('printerSetup');
                };
                
                self.getDataSyncCount = ko.computed(function () {
                    var cnt1 = 0;
                    var cnt2 = 0;
                    
                    self.dummy();

                    cnt1 = containSavedSalesOrder();
                    cnt2 = containSavedDelivery();

                    return cnt1 + cnt2;
                });
                
                function containSavedSalesOrder() {
                    var salesOrderKey = cartService.getOfflineKey();
                    var dataJSON = ui.getLocalStorage(salesOrderKey);
                    console.log("dataJSON=" + ko.toJS(dataJSON));

                    if (typeof dataJSON !== "undefined") {
                        if (!Array.isArray(dataJSON)) {
                            dataJSON = ko.utils.unwrapObservable(dataJSON);
                        }
                        if (dataJSON.length == 0) return 0;
                        return dataJSON['data'].length;
                    }
                    return 0;
                }

                function containSavedDelivery() {
                    var deliveryKey = deliveryService.getOfflineKey();
                    var dataJSON = ui.getLocalStorage(deliveryKey);

                    if (typeof dataJSON !== "undefined") {
                        if (!Array.isArray(dataJSON)) {
                            dataJSON = ko.utils.unwrapObservable(dataJSON);
                        }
                        if (dataJSON.length == 0) return 0;
                        return dataJSON['data'].length;
                    }
                    return 0;
                }
                
                function initTranslations() {
                    // language translations
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_pickupList = "";
                    self.lng_hi = getTranslation("ssa.springboard.hi");
                    self.lng_customer = getTranslation("ssa.springboard.customer");
                    self.lng_visitation = getTranslation("ssa.springboard.visitation");
                    self.lng_stockInquiry = getTranslation("ssa.springboard.stockInquiry");
                    self.lng_performance = getTranslation("ssa.springboard.performance");
                    if (user.salesRole == constant.SR_SALE_VAN) {
                        self.lng_pickupList = getTranslation("ssa.springboard.deliveryList");
                    } else {
                        self.lng_pickupList = getTranslation("ssa.springboard.pickupList");
                    }
                    self.lng_loadingList = getTranslation("ssa.springboard.loadingList");
                    self.lng_reviewLoadingList= getTranslation("ssa.springboard.reviewLoadingList");
                    self.lng_dailyReceipt = getTranslation("ssa.springboard.dailyReceipt");
                    self.lng_dailyOrders = getTranslation("ssa.springboard.dailyOrders");
                    self.lng_printerSetup = getTranslation("ssa.springboard.printerSetup");
                    self.lng_error_00005 = getTranslation("ssa.msg.error.ERROR_00005");    
                    self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                    self.lng_reInitiateOrderList = getTranslation("ssa.springboard.reInitiateOrderList");
                    self.lng_schedule = getTranslation("ssa.springboard.schedule");
                    self.lng_logisticsSchMaint = getTranslation("ssa.schedule.logistic.title");
                    self.lng_nonWorkingDateMaint = getTranslation("ssa.schedule.nonWorkingDate.title");
                    self.lng_cutoffMaint = getTranslation("ssa.schedule.cutoff.title");
                    self.lng_earlierCutoffMaint = getTranslation("ssa.schedule.earlierCutOff.title");
                }
            }
            
            ko.bindingHandlers.fadeVisible = {
                init: function (element, valueAccessor) {
                    // Initially set the element to be instantly visible/hidden depending on the value
                    var value = valueAccessor();
                    $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
                },
                update: function (element, valueAccessor) {
                    // Whenever the value subsequently changes, slowly fade the element in or out
                    var value = valueAccessor();
                    ko.unwrap(value) ? $(element).fadeIn() : $(element).fadeOut();
                }
            };            

            return SpringBoardViewModel;
        }
);
