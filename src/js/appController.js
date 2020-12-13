/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojcore', 'knockout', 'pages/common/constant', 'ojs/ojrouter', 'ojs/ojarraytabledatasource', 'ojs/ojnavigationlist'],
  function(oj, ko, constant) {
     function ControllerViewModel() {
       var self = this;
       // Router setup
       self.router = oj.Router.rootInstance;
       self.moduleConfig = $.extend(true, {}, self.router.moduleConfig, {params: {'rootContext': {}}});

                
       // default of Navigation Bar for (order, profile, visit, quotation)
       var navStated = self.moduleConfig.params.rootContext.navStateId;
        if (typeof navStated === "undefined") {
            self.moduleConfig.params.rootContext.navStateId = "orderHist";
        }
        
        // default of Navigation Bar for (Item List, Top 10, Order List)
        var newOrderNavStated = self.moduleConfig.params.rootContext.newOrderNavStateId;
        if (typeof newOrderNavStated === "undefined") {
            self.moduleConfig.params.rootContext.newOrderNavStateId = "newOrderItem";
        }
        
        // default of Navigation Bar for (Item List, Top 10, Quotation List)
        var newQuotationNavStated = self.moduleConfig.params.rootContext.newQuotationNavStateId;
        if (typeof newQuotationNavStated === "undefined") {
            self.moduleConfig.params.rootContext.newQuotationNavStateId = "newQuotationItem";
        }

        // Router setup
        function getPagePath(path) {
            return 'pages/' + path + '/' + path.substr(path.lastIndexOf('/') + 1);
        }

       self.router.configure({
         'login': {value:  getPagePath('login'), label: 'Login', isDefault: true },
         'initLoad': {value: getPagePath("initLoad"), label: 'Initial Loading'},
         'dataSync': {value: getPagePath("dataSync"), label: 'Synchronization'},
         'springboard': {value: getPagePath('springboard'), label: 'Spring Board'},
         'customer': {value: getPagePath('customer'), label: 'Customer'},
         'visitation': {value: getPagePath('visitation'), label: 'Vistation'},
         'stockInquiry': {value: getPagePath('stockInquiry'), label: 'Stock Inquiry'},
         'performance': {value: getPagePath('performance'), label: 'Performance'},
         'pickup': {value: getPagePath('delivery'), label: 'Delivery'},
         'loading': {value: getPagePath('loading'), label: 'Loading Delivery/Pickup List'},  
         'reviewLoading': {value: getPagePath('reviewLoading'), label: 'Review Confirmed Delivery/Pickup List'},  
         'dailyReceipt': {value: getPagePath('dailyReceipt'), label: 'Daily Receipt Summary'},
         'dailyOrders': {value:getPagePath('dailyOrders'), label: 'Daily Order Summary'},
         'reInitateOrder': {value: getPagePath('reInitateOrder'), label: 'Re-Initate Order List'},
         'salescustomer':{value: 'pages/customer/salescustomer', label: 'Sales Cloud Customer'},
         'printerSetup': {value: getPagePath('printerSetup'), label: 'Printer Setup'},
         'logisticsSchMaint': {value: 'pages/schedule/logisticsSchMaint', label: 'Logistics Schedule Manintenance'},
         'nonWorkingDateMaint': {value: 'pages/schedule/nonWorkingDateMaint', label: 'Non-Working Date Maintenance'},
         'routeCutoffMaint': {value: 'pages/schedule/routeCutoffMaint', label: 'Route Cutoff Maintenance'},
         'routeEarlierCutoffMaint': {value: 'pages/schedule/routeEarlierCutoffMaint', label: 'Route Earlier Cutoff Maintenance'}
       });

       oj.Router.defaults['urlAdapter'] = new oj.Router.urlParamAdapter();
       
       self.redirect = function(page, id) {
           var path = 'customer' + '/' + page + '/' + id;
           self.router.go(path);
       };
       
       self.go = function(page) {
           self.router.go(page);
       };

       // Navigation Path Setup of ORDER, PROFILE, VISIT and QUOTATION pages
       var navData = [];
       self.navDataSource = new oj.ArrayTableDataSource(navData, {idAttribute: 'id'});
       self.navChangeHandler = function (event, data) {
         if (data.option === 'selection' && data.value !== self.router.stateId()) {
               // keep track the navigation
               self.moduleConfig.params.rootContext.navStateId = data.value;
               var custId = self.moduleConfig.params.rootContext.custId;
                if (data.value === "quotation" || data.value === "orderHist" || data.value === "newQuotation" || data.value === "profile" || data.value === "vistationDetail" || data.value === "newVisitation") {
                    self.redirect(data.value, custId);
                } else {
                    self.router.go(data.value);
                }
         }
       };
       
       
        self.populateDefaultNavPath = function (user) {
            var getTranslation = oj.Translations.getTranslatedString;
            var ORDER = ko.toJS({name: getTranslation("ssa.menu.order"), id: 'orderHist', iconClass: 'oj-navigationlist-item-icon demo-icon demo-dashboard-icon'});
            var PROFILE = ko.toJS({name: getTranslation("ssa.menu.profile"), id: 'profile', iconClass: 'oj-navigationlist-item-icon demo-icon demo-incidents-icon'});
            var VISIT = ko.toJS({name: getTranslation("ssa.menu.visit"), id: 'newVisitation',iconClass: 'oj-navigationlist-item-icon demo-icon demo-suppliers-icon'});            
            var QUOTATION = ko.toJS({name: getTranslation("ssa.menu.quotation"), id: 'quotation',iconClass: 'oj-navigationlist-item-icon demo-icon demo-suppliers-icon'});            
            
            // reset all
            navData = [];
            navData.push(ORDER);
            navData.push(PROFILE);
            
            // function obsolete 
            /*
            if (user.salesRole === constant.SR_MOBILE_SALE) {
                addVisitation(VISIT);
            } else {
                removeVisitation(VISIT);
            }
            */
            
            if (user.salesRole == constant.SR_MOBILE_SALE && user.orgUnitId == constant.ORG_UNIT_ID_WINE) {
                addQuotation(QUOTATION);
            } else {
                removeQuotation(QUOTATION);
            }
            
            self.navDataSource = new oj.ArrayTableDataSource(navData, {idAttribute: 'id'});
        };
       
       function addQuotation(QUOTATION) {
            var index = navData.indexOf(QUOTATION);
            if (index <= 0) {
                navData.push(QUOTATION);
            }
       };
       
       function removeQuotation(QUOTATION) {
            var index = navData.indexOf(QUOTATION);
            if (index >=  0) {
                navData.pop(QUOTATION);
            }
       };    
       
       
       function addVisitation(VISIT) {
            var index = navData.indexOf(VISIT);
            if (index <= 0) {
                navData.push(VISIT);
            }           
       };
       
       function removeVisitation(VISIT) {
            var index = navData.indexOf(VISIT);
            if (index >=  0) {
                navData.pop(VISIT);
            }
       };          
        
        //New Order Navigation setup
        var newOrderNavData = [
            {name: 'Item List', id: 'newOrderItem',
              iconClass: 'oj-navigationlist-item-icon demo-icon demo-dashboard-icon'},
            {name: 'Top 10', id: 'topOrderItem',
              iconClass: 'oj-navigationlist-item-icon demo-icon demo-incidents-icon'},          
            {name: 'Order List', id: 'newOrder',
              iconClass: 'oj-navigationlist-item-icon demo-icon demo-incidents-icon'}
        ];
        self.newOrderNavDataSource = new oj.ArrayTableDataSource(newOrderNavData, {idAttribute: 'id'});
        self.newOrderNavChangeHandler = function (event, data) {
            if (data.option === 'selection' && data.value !== self.router.stateId()) {
                // keep track the navigation
                if (data.value != null && typeof (data.value) !== "undefined") {
                    self.moduleConfig.params.rootContext.newOrderNavStateId = data.value;
                    var orderId = self.moduleConfig.params.rootContext.orderId;
                    if (data.value === "newOrderItem" || data.value === "newOrder" || data.value === "topOrderItem") {
                        self.redirect(data.value, orderId);
                    } else {
                        self.router.go(data.value);
                    }
                }
            }
        };
        
        //New Quotation Navigation setup
        var newQuotationNavData = [
            {name: 'Item List', id: 'newQuotationItem',
              iconClass: 'oj-navigationlist-item-icon demo-icon demo-dashboard-icon'},
            {name: 'Top 10', id: 'topQuotationItem',
              iconClass: 'oj-navigationlist-item-icon demo-icon demo-dashboard-icon'},          
            {name: 'Quotation List', id: 'newQuotation',
              iconClass: 'oj-navigationlist-item-icon demo-icon demo-incidents-icon'}
        ];
        self.newQuotationNavDataSource = new oj.ArrayTableDataSource(newQuotationNavData, {idAttribute: 'id'});
        self.newQuotationNavChangeHandler = function (event, data) {
            if (data.option === 'selection' && data.value !== self.router.stateId()) {
                // keep track the navigation
                if (data.value != null && typeof (data.value) !== "undefined") {
                    self.moduleConfig.params.rootContext.newQuotationNavStateId = data.value;
                    var orderId = self.moduleConfig.params.rootContext.orderId;
                    if (data.value === "newQuotationItem" || data.value === "newQuotation" || data.value === "topQuotationItem") {
                        self.redirect(data.value, orderId);
                    } else {
                        self.router.go(data.value);
                    }
                }
            }
        };
     }

     return new ControllerViewModel();
  }
);
