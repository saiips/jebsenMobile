/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your order ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/dataService',
  'ojs/ojknockout', 'ojs/ojlistview', 'ojs/ojjsontreedatasource'],
 function(oj, ko, $, app, data) {

    function stockListViewModel() {
      var self = this;
      
      self.handleActivated = function(info) {

        // Implement if needed
        self.parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
        console.log("stockList parentRouter=" + self.parentRouter.currentState().value);
        
        self.stockList = self.parentRouter.moduleConfig.params['stockSearchResult'];
        initTranslation();
      };

        self.goBack = function() {
            oj.Router.rootInstance.go('stockInquiry');
        };

        self.dispose = function(info) {
//        self.router.dispose();
        };
        
        self.optionChange = function(event, ui) {
            if (ui.option === 'currentItem' && ui.value) {
                //app.pendingAnimationType = 'navChild';
                console.log("stockList ui = " + ui);
                console.log("stockList ui.value=" + ko.toJSON(ui.value));
                //self.parentRouter.go('stockDetail/' + ui.value);
                self.parentRouter.moduleConfig.params['selectedStockItem'] = ui.value; 
                self.parentRouter.go('stockDetail/selected');
            }
        };
      
      
        self.itemOnly = function(context) {
            return context['leaf'];
        };

        self.selectTemplate = function(file, bindingContext) {
            return bindingContext.$itemContext.leaf ? 'item_template' : 'group_template';
        };
        
        function initTranslation() {
            var getTranslation = oj.Translations.getTranslatedString;
            self.lng_stockInquiryResult = getTranslation("ssa.stockInquiryResult.stockInquiryResult");
            self.lng_description = getTranslation("ssa.stockInquiryResult.description");
            self.lng_subInventory = getTranslation("ssa.stockInquiryResult.subInventory");
            self.lng_lot = getTranslation("ssa.stockInquiryResult.lot");
            self.lng_onhand = getTranslation("ssa.stockInquiryResult.onhand");
            self.lng_reservation = getTranslation("ssa.stockInquiryResult.reservation");
            self.lng_available = getTranslation("ssa.stockInquiryResult.available");
        }
      
    }

    /*
     * Returns a constructor for the ViewModel so that the ViewModel is constrcuted
     * each time the view is displayed.  Return an instance of the ViewModel if
     * only one instance of the ViewModel is needed.
     */
    return new stockListViewModel();
  }
);
