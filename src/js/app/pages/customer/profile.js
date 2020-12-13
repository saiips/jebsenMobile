/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your customer ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/customer/profileService', 'util/appui', 'pages/common/constant', 'util/commonhelper', 'pages/common/maintenance', 'promise',
  'ojs/ojknockout', 'ojs/ojtabs', 'ojs/ojgauge', 'ojs/ojtable', 'ojs/ojarraytabledatasource'],
 function(oj, ko, $, app, service, ui, constant, commonHelper, maintenance) {

    function ProfileViewModel() {
      var RESPONSE_TABLE = "P_SALES_TBL_ITEM";
        
      var self = this;
      // Below are a subset of the ViewModel methods invoked by the ojModule binding
      // Please reference the ojModule jsDoc for additionaly available methods.

      /**
       * Optional ViewModel method invoked when this ViewModel is about to be
       * used for the View transition.  The application can put data fetch logic
       * here that can return a Promise which will delay the handleAttached function
       * call below until the Promise is resolved.
       * @param {Object} info - An object with the following key-value pairs:
       * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
       * @param {Function} info.valueAccessor - The binding's value accessor.
       * @return {Promise|undefined} - If the callback returns a Promise, the next phase (attaching DOM) will be delayed until
       * the promise is resolved
       */
      self.handleActivated = function(info) {
        console.log("profile handleActivated");
            var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
            console.log("profile.js parentRouter=" + parentRouter.currentState().value);
            
            var childRouter = parentRouter.getChildRouter("profile");
            if (!childRouter) {
                childRouter = parentRouter.createChildRouter('profile');
            }
            self.router = childRouter.configure(function (stateId) {
                if (stateId) {
                    var state = new oj.RouterState(stateId, {value: stateId,
                        enter: function () {
                            // Set shipToSiteId
                            console.log("stateId = " + stateId);
                            var shipToSiteId = app.moduleConfig.params.rootContext.selCustomerProfile.shipToSiteId;
                            console.log("profile stateId=" + ko.utils.unwrapObservable(shipToSiteId));
                            self.currStateId(ko.utils.unwrapObservable(shipToSiteId));
                        }
                    });
                    return state;
                }
            });
            
            initTranslations();
            headerSetup();
        
         // set the current state of Navigation Bar (Order, Profile, Visit and Quotation)
        self.navStateId(app.moduleConfig.params.rootContext.navStateId);
        
        
        return oj.Router.sync();
      };
      
      function headerSetup() {
          // get the seleced customer profile for header Title
        var selCustomer = app.moduleConfig.params.rootContext.selCustomerProfile;  
        if (typeof selCustomer !== "undefined") {
            var name = ko.utils.unwrapObservable(selCustomer.outletName);
            if(!ko.utils.unwrapObservable(self.large())){
                if(name.length > constant.TITLE_LENGTH){
                    name = name.substring(0, constant.TITLE_LENGTH) + "...";
                }
            }
            self.headerTitle(name);
        } else {
            self.headerTitle(self.lng_profile);
        }     
      }

      /**
       * Optional ViewModel method invoked after the View is inserted into the
       * document DOM.  The application can put logic that requires the DOM being
       * attached here.
       * @param {Object} info - An object with the following key-value pairs:
       * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
       * @param {Function} info.valueAccessor - The binding's value accessor.
       * @param {boolean} info.fromCache - A boolean indicating whether the module was retrieved from cache.
       */
      self.handleAttached = function(info) {
        // Implement if needed
      };


      /**
       * Optional ViewModel method invoked after the bindings are applied on this View.
       * If the current View is retrieved from cache, the bindings will not be re-applied
       * and this callback will not be invoked.
       * @param {Object} info - An object with the following key-value pairs:
       * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
       * @param {Function} info.valueAccessor - The binding's value accessor.
       */
      self.handleBindingsApplied = function(info) {
        // Implement if needed
      };

      /*
       * Optional ViewModel method invoked after the View is removed from the
       * document DOM.
       * @param {Object} info - An object with the following key-value pairs:
       * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
       * @param {Function} info.valueAccessor - The binding's value accessor.
       * @param {Array} info.cachedNodes - An Array containing cached nodes for the View if the cache is enabled.
       */
      self.handleDetached = function(info) {
        // Implement if needed
      };

      self.currStateId = ko.observable();
      self.customerNo = ko.observable();
      self.shipAddress = ko.observable();
      self.billAddress = ko.observable();

      self.agingTotalAmount = ko.observable(0);
      self.salesTarget = ko.observable();
      self.agingAmount1 = ko.observable();
      self.agingAmount2 = ko.observable();
      self.agingAmount3 = ko.observable();
      self.agingAmount4 = ko.observable();
      
      self.salePerformanceList = ko.observableArray();
      self.productPerformance = ko.computed(function(){
        if (self.salePerformanceList().length > 0) {
          return new oj.ArrayTableDataSource(self.salePerformanceList(), {idAttribute: "PRODUCT"});
        }
      });
      self.sumLastYtdVolume = ko.observable(0);
      self.sumThisYtdVolume = ko.observable(0);
      self.netLastYtdVolume = ko.computed(function() {
          return (self.salesTarget() - self.sumLastYtdVolume());
      });
      self.netThisYtdVolume = ko.computed(function() {
          return (self.salesTarget() - self.sumThisYtdVolume());
      });      
      
      self.headerTitle =  ko.observable();      
      
      self.navDataSource = app.navDataSource;
      self.navChangeHandler = app.navChangeHandler;      
      
      self.navStateId = ko.observable();

      function getProfile(shipToSiteId) {
        ui.showBusy();

        var cbSuccessFn = function (data, xhr) {
            try {
                prepareUI(data, xhr.status);
            } catch (e) {
                console.error(e);
            } finally {
                console.log("cbSuccessFn called");
                ui.hideBusy();
            }
        };
        var cbFailFn = function (data, xhr) {
            console.log("cbFailFn failed");
            prepareUI(data, xhr.status);
            ui.hideBusy();
        };
        service.getProfileMessage(getPayload(shipToSiteId)).then(cbSuccessFn, cbFailFn);
      };
      
      function getSalePerformance(shipToSiteId) {
        ui.showBusy();

        var cbSuccessFn = function (data, xhr) {
            try {
                preparePerformanceUI(data, xhr.status);
            } catch (e) {
                console.error(e);
            } finally {
                console.log("cbSuccessFn called");
                ui.hideBusy();
            }
        };
        var cbFailFn = function (data, xhr) {
            console.log("cbFailFn failed");
            preparePerformanceUI(data, xhr.status);
            ui.hideBusy();
        };
        service.getSalesPerformanceMessage(getPerformancePayload(shipToSiteId)).then(cbSuccessFn, cbFailFn);
    }
      
      function prepareUI(data, status) {
        var customer = app.moduleConfig.params.rootContext.selCustomerProfile;
        self.customerNo(ko.utils.unwrapObservable(customer.accountNumber));
        self.shipAddress(ko.utils.unwrapObservable(customer.shipToAddress));
        self.billAddress(ko.utils.unwrapObservable(customer.billToAddress));
          
        var profileData = data;
        
        if (typeof(data) === "string") {
            profileData = JSON.parse(data);
        }
        
        if(profileData.P_CUSTOMER_AGING_TBL && profileData.P_CUSTOMER_AGING_TBL.P_CUSTOMER_AGING_TBL_ITEM) {
            var customerAging = profileData.P_CUSTOMER_AGING_TBL.P_CUSTOMER_AGING_TBL_ITEM;
            // console.log("customerAging=" + ko.toJSON(customerAging));
            if (Array.isArray(customerAging)) {
                customerAging = customerAging[0];
            }
            
            var day0 = Number(customerAging.OUTSTANDING_AMOUNT_EXG) - 
                    Number(customerAging.ONE_30_DAYS_PAST_DUE) -
                    Number(customerAging.ONE_60_DAYS_PAST_DUE) -
                    Number(customerAging.MORE_THAN_61_DAYS_PAST_DUE);
            
            self.agingTotalAmount(customerAging.OUTSTANDING_AMOUNT_EXG);
        
            self.agingAmount1(day0);
            self.agingAmount2(customerAging.ONE_30_DAYS_PAST_DUE);
            self.agingAmount3(customerAging.ONE_60_DAYS_PAST_DUE);
            self.agingAmount4(customerAging.MORE_THAN_61_DAYS_PAST_DUE);
        }
      }
      
      function preparePerformanceUI(data, status) {
        // console.log("raw data =" + ko.toJSON(data));
        try {
            if (data !== null && status == 200) {
                var respJSON;
                var isArray = Array.isArray(data[RESPONSE_TABLE]);

                if (!isArray) {
                    var temp = new Array();
                    temp.push(data[RESPONSE_TABLE]);
                    respJSON = temp;
                } else {
                    respJSON = data[RESPONSE_TABLE];
                }
                var formatted = [];
                var sumLastYtdVolume = 0;
                var sumThisYtdVolume = 0;                
                for(var i = 0; i < respJSON.length; i++) {
                    // var desc = respJSON[i].PRODUCT_DESCRIPTION;
                    // if(desc.length > constant.PRODUCTION_DESC_LENGTH) {
                    //     desc = desc.substring(0, constant.PRODUCTION_DESC_LENGTH) + "...";
                    // }
                    
                    if(!respJSON[i].UOM) {
                        respJSON[i].UOM = "";
                    }
                    
                    sumLastYtdVolume = sumLastYtdVolume + new Number(respJSON[i].LAST_YTD_VOLUME);
                    sumThisYtdVolume = sumThisYtdVolume + new Number(respJSON[i].THIS_YTD_VOLUME);                    
                    
                    // respJSON[i].PRODUCT_DESCRIPTION = desc;
                    formatted.push(respJSON[i]);
                }
                self.salePerformanceList(respJSON);
                self.sumLastYtdVolume(sumLastYtdVolume);
                self.sumThisYtdVolume(sumThisYtdVolume);                
            }
        } catch (e) {
            console.error(e);
        } finally {
            console.log("cbSuccessFn called");
        }
      };

    function getSalesTarget(shipToSiteId) {
            /* comment this function since sales cloud is obsolete, defult is 0 */
            self.salesTarget(0);
            
            /*
            ui.showBusy();
            var cbSucessSalesTarget = function (data, xhr) {
                console.log("raw data =" + ko.toJSON(data));
                try {
                    if (data && xhr.status == 200) {
                        var respJSON = data['OutputGetSalesTargetByCustomer'];
                        var volume = respJSON['SALES_VOLUME_VALUE'];
                        if (volume < 0) {
                            self.salesTarget(0);
                        } else {
                            self.salesTarget(volume);
                        }
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    console.log("cbSucessSalesTarget called");
                    ui.hideBusy();
                }
            };
            var cbFailSalesTarget = function (data, xhr) {
                console.log("cbFailSalesTarget failed");
                ui.hideBusy();
            };
            service.getSalesTargetMessage(getSalesTargetPayload(shipToSiteId)).then(cbSucessSalesTarget, cbFailSalesTarget);
            */
    }

      self.currStateId.subscribe(function(shipToSiteId) {
            console.log("shipToSiteId=" + shipToSiteId);
            var isMaintenance = maintenance.isMaintenance();
            if (isMaintenance) {
                ui.showMessageBox(self.lng_maintenance);
                return;
            }      
            
            populateData(shipToSiteId);
            
            // getProfile(shipToSiteId);
            // getSalePerformance(shipToSiteId);
            // getSalesTarget(shipToSiteId);
      });
      
    function populateData(shipToSiteId) {
        ui.showBusy();
        
        var cbProfileSuccessFn = function (data, xhr) {
            try {
                prepareUI(data, xhr.status);
            } catch (e) {
                console.error(e);
            } finally {
                console.log("cbProfileSuccessFn called");
            }
        };
        var cbProfileFailFn = function (data, xhr) {
            console.log("cbProfileFailFn failed");
            prepareUI(data, xhr.status);
        };
        
        var cbPerformanceSuccessFn = function (data, xhr) {
            try {
                preparePerformanceUI(data, xhr.status);
            } catch (e) {
                console.error(e);
            } finally {
                console.log("cbPerformanceSuccessFn called");
            }
        };
        var cbPerformanceFailFn = function (data, xhr) {
            console.log("cbPerformanceFailFn failed");
            preparePerformanceUI(data, xhr.status);
        };   
        
        /*
        var cbSucessSalesTarget = function (data, xhr) {
            console.log("raw data =" + ko.toJSON(data));
            try {
                if (data && xhr.status == 200) {
                    var respJSON = data['OutputGetSalesTargetByCustomer'];
                    var volume = respJSON['SALES_VOLUME_VALUE'];
                    if (volume < 0) {
                        self.salesTarget(0);
                    } else {
                        self.salesTarget(volume ? volume : 0);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                console.log("cbSucessSalesTarget called");
            }
        };
        var cbFailSalesTarget = function (data, xhr) {
            console.log("cbFailSalesTarget failed");
        };    
        */
        
        // invoke services one by one
        service.getProfileMessage(getPayload(shipToSiteId)).then(cbProfileSuccessFn, cbProfileFailFn).then(function() {
            service.getSalesPerformanceMessage(getPerformancePayload(shipToSiteId)).then(cbPerformanceSuccessFn, cbPerformanceFailFn).then(function() {
                /* comment it since sales cloud is obsolete and defult to 0*/
                self.salesTarget(0);
                /*
                service.getSalesTargetMessage(getSalesTargetPayload(shipToSiteId)).then(cbSucessSalesTarget, cbFailSalesTarget).then(function() {
                   console.log("completed");
                   ui.hideBusy();
                });
                */
                ui.hideBusy();
            });
            
        });
    }  
      
      
    function getSalesTargetPayload(shipToSiteId) {
        var user = app.moduleConfig.params.rootContext.userProfile;
        var payload = JSON.stringify({
            "InputGetSalesTargetByCustomer": {
            "HeaderInfo": {
                "UserID": user.username,
                "UserRole": user.salesRole,
                "CallerID":""
            },
            "P_ORG_ID": user.orgUnitId,
            "P_SHIP_TO_ORG_ID": shipToSiteId
            }
        });
        return payload; 
    }      
      
    function getPayload(shipToSiteId) {
        var accountNumber = ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.selCustomerProfile.accountNumber);
        var orgUnitId = ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.userProfile.orgUnitId);
        var user = app.moduleConfig.params.rootContext.userProfile;
        var payload = JSON.stringify({
            "InputGetCustomerAging": {
                "HeaderInfo": {
                    "UserID": user.username,
                    "UserRole": user.salesRole,
                    "CallerID": ""
                },
                "P_ORG_ID": orgUnitId,
                "P_ACCOUNT_NUMBER": accountNumber,
                "P_SHIP_TO_SITE_USE_ID": shipToSiteId
            }
        });
        return payload;
    }
      
      function getPerformancePayload(shipToSiteId) {
        var user = app.moduleConfig.params.rootContext.userProfile;
        var payload = JSON.stringify({
            "InputGetSalesByCustomer": {
            "HeaderInfo": {
                "UserID": user.username,
                "UserRole": user.salesRole,
                "CallerID":""
            },
            "P_ORG_ID": user.orgUnitId,
            "P_SHIP_TO_ORG_ID": shipToSiteId
            }
        });
        return payload;
      }

      self.large = ko.computed(function(){
        var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
        return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
      });
      
      self.decimalNumberConverter = oj.Validation.converterFactory("number").createConverter({style: 'decimal', pattern: '#,##0'});
      self.shortNumberConverter = oj.Validation.converterFactory("number").createConverter({style: 'decimal', decimalFormat: 'short'});
      
      self.dispose = function (info) {
            self.router.dispose();
      };

    self.isOrderDeskAdmin = ko.computed(function () {
        var user = app.moduleConfig.params.rootContext.userProfile;
        if (user.salesRole == constant.SR_ADMIN) {
            return true;
        }
        return false;
    });

      self.refresh = function() {
            var shipToSiteId = app.moduleConfig.params.rootContext.selCustomerProfile.shipToSiteId;
            shipToSiteId = ko.utils.unwrapObservable(shipToSiteId);
            var isMaintenance = maintenance.isMaintenance();
            if (isMaintenance) {
                ui.showMessageBox(self.lng_maintenance);
                return;
            }
            getProfile(shipToSiteId);
            getSalePerformance(shipToSiteId); 
            getSalesTarget(shipToSiteId);
      };
      
      function initTranslations() {
          var yestersday = commonHelper.getClientYesterday("DD-MMM-YYYY").toUpperCase();
          
            // language translations
            var getTranslation = oj.Translations.getTranslatedString;
            self.lng_profile = getTranslation("ssa.profile.profile");
            self.lng_overview = getTranslation("ssa.profile.overview");
            self.lng_customerNo = getTranslation("ssa.profile.customerNo");
            self.lng_shippingAddress = getTranslation("ssa.profile.shippingAddress");
            self.lng_billingAddress = getTranslation("ssa.profile.billingAddress");
            self.lng_overdueAging = getTranslation("ssa.profile.overdueAging") + " " + yestersday;
            self.lng_salesPerformance = getTranslation("ssa.profile.salesPerformance");
            self.lng_target = getTranslation("ssa.profile.target");
            self.lng_lastYearAndYTDPerformance = getTranslation("ssa.profile.lastYearAndYTDPerformance") + " " + yestersday;
            self.lng_0days = getTranslation("ssa.profile.days0");
            self.lng_0_30days = getTranslation("ssa.profile.days0_30");
            self.lng_31_60days = getTranslation("ssa.profile.days31_60");
            self.lng_over60days = getTranslation("ssa.profile.daysOver60");
            self.lng_totalOutstanding = getTranslation("ssa.profile.totalOutstanding");
            self.lng_item = getTranslation("ssa.profile.item");
            self.lng_lastYear = getTranslation("ssa.profile.lastYear");
            self.lng_YTD = getTranslation("ssa.profile.ytd");
            self.lng_uom = getTranslation("ssa.profile.uom");
            self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
            self.lng_volume = getTranslation("ssa.profile.volume");
            self.lng_net = getTranslation("ssa.profile.net");
            
        }
    }
    
    ko.bindingHandlers.currency = {
        symbol: ko.observable('$'),
        update: function (element, valueAccessor, allBindingsAccessor) {
            return ko.bindingHandlers.text.update(element, function () {
                var value = +(ko.utils.unwrapObservable(valueAccessor()) || 0),
                        symbol = ko.utils.unwrapObservable(allBindingsAccessor().symbol === undefined ? allBindingsAccessor().sybmol : '$');
                return symbol + value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
            });
        }
    };

    /*
     * Returns a constructor for the ViewModel so that the ViewModel is constrcuted
     * each time the view is displayed.  Return an instance of the ViewModel if
     * only one instance of the ViewModel is needed.
     */
    return ProfileViewModel;
  }
);
