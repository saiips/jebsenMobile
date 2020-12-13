/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your order ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/appui','util/dataService', 'pages/stockDetail/stockDetailService', 'pages/common/constant',
  'ojs/ojknockout', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'ojs/ojnavigationlist', 'promise', 'ojs/ojtoolbar'],
 function(oj, ko, $, app, ui, data, service, constant) {

    function StockDetailViewModel() {
      var self = this;
      self.router = app.router;


      self.handleActivated = function(info) {
        // Implement if needed
        self.parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
        console.log("stockDetail parentRouter=" + self.parentRouter.currentState().value);

        var childRouter = self.parentRouter.getChildRouter("stockDetail");
        if (!childRouter) {
            childRouter = self.parentRouter.createChildRouter('stockDetail');
        }                   
        self.router = childRouter.configure(function(stateId) {
          if (stateId) {
            var state = new oj.RouterState(stateId, { value: stateId,
              enter: function() {
                // Set currStockId
                getCurrStock(stateId);
                console.log("stockDetail stateId = " + stateId);
 

              }
            });
            return state;
          }
        });
        
        initTranslation();
        return oj.Router.sync();
      };

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
        /*
        if (app.pendingAnimationType === 'navChild') {
          app.preDrill();
        }
        */
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

      self.handleTransitionCompleted = function(info) {
        // adjust content padding
        /*
        app.adjustContentPadding();
        if (app.pendingAnimationType === 'navChild') {
          app.postDrill();
        }
        */
      };
      
      self.dispose = function(info) {
        self.router.dispose();
        //self.subcription.dispose();
      };
      
      self.goBack = function() {
          self.parentRouter.go('stockList');
      };

      self.currStockId = ko.observable();
      self.currStock = ko.observable();
      self.reservationList = ko.observableArray();
      //self.reservationListDS = new oj.ArrayTableDataSource(self.reservationList, {idAttribute: "id"});
      self.reservations = ko.computed(function(){
        if (self.reservationList().length > 0) {
          return new oj.ArrayTableDataSource(self.reservationList(), {idAttribute: "ITEM_ID"});
        }
      });
      
      self.reservationEnabled = ko.observable(false);

           // load stockdetails
      self.currStockId.subscribe(function(newStockId) {
        getCurrStock(newStockId);
      });
      
      function getCurrStock(stockId) {
        var user = app.moduleConfig.params.rootContext.userProfile;
        var key = self.router.parent.moduleConfig.params['selectedStockItem'];
//        self.router.parent.moduleConfig.params['stockSearchResult'].get(key).then(function(stock_row){
        self.currStock = key;
          //window.alert(self.currStock);

//        });

        var orgUnitId = key.ORG_ID;
        var itemId = key.ITEM_ID;
        var subinventory = key.SUBINVENTORY;
        var lot = key.LOT;
        
        var payload = {
            "InputGetItemReservationDetails": {
                  "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                  },                
                  "P_ORG_ID" : orgUnitId,
                  "P_ITEM_ID" : itemId,
                  "P_ITEM_SUBINV": subinventory,
                  "LOT": lot
            }
        };
        payload = JSON.stringify(payload);
        console.log("InputGetItemReservationDetails payload = " + payload);
        ui.showBusy();
        service.getItemReservationDetailsMessage(payload).then(function(response){
            ui.hideBusy();
            var respJSON = response;
            console.log("ReservationDetails respJSON=" + ko.toJSON(respJSON));
            if (typeof(response) === "string") {
              respJSON = JSON.parse(response);
            }
            if(respJSON.P_RESERVATION_TBL) {
                self.reservationEnabled(true);
                
                var result = respJSON.P_RESERVATION_TBL.P_RESERVATION_TBL_ITEM;
                if (!$.isArray(result)) {
                  result = new Array(result);
                }
                self.reservationList(result);
            }
        }, function(response){
//            ui.hideBusy();
        });

      };
      
        function initTranslation() {
            var getTranslation = oj.Translations.getTranslatedString;
            self.lng_stockInquiryResult = getTranslation("ssa.stockInquiryResult.detail.stockInquiryResult");
            self.lng_description = getTranslation("ssa.stockInquiryResult.description");
            self.lng_subInventory = getTranslation("ssa.stockInquiryResult.subInventory");
            self.lng_lot = getTranslation("ssa.stockInquiryResult.lot");
            self.lng_onhand = getTranslation("ssa.stockInquiryResult.onhand");
            self.lng_reservation = getTranslation("ssa.stockInquiryResult.reservation");
            self.lng_available = getTranslation("ssa.stockInquiryResult.available");
            self.lng_overview = getTranslation("ssa.stockInquiryResult.detail.overview");
            self.lng_reservationStatus = getTranslation("ssa.stockInquiryResult.detail.reservationStatus");
        }

      
      //getCurrStock("cus-101");


    }

    /*
     * Returns a constructor for the ViewModel so that the ViewModel is constrcuted
     * each time the view is displayed.  Return an instance of the ViewModel if
     * only one instance of the ViewModel is needed.
     */
    return StockDetailViewModel;
  }
);
