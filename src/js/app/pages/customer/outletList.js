/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your outlet ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/dataService', 'pages/customer/customerService', 
    'util/appui', 'pages/common/constant',
  'ojs/ojknockout', 'ojs/ojlistview', 'ojs/ojjsontreedatasource'],
 function(oj, ko, $, app, data, service, ui, constant) {
    var searchCanvas;

    searchCanvas = {
        "selector": "#searchCanvas",
        "edge": "top",
        "displayMode": "push",
        "size": "63px",
        "modality": "modeless",
        "autoDismiss": "none"
    };          

    function OutletListViewModel() {
      var self = this;
      self.router = app.router;
      
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
        // reset the searching criteria
         self.searchText('');
         
        var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
        console.log("outletList.js parentRouter=" +  parentRouter.currentState().value);

        var childRouter = parentRouter.getChildRouter("outletList");
        if (!childRouter) {
          childRouter =  parentRouter.createChildRouter('outletList');
        }
        
        self.router = childRouter.configure(function(stateId) {
          if (stateId) {
            var state = new oj.RouterState(stateId, { value: stateId,
              enter: function() {
                // Set currCustId
                self.currCustId(stateId);
                console.log("outletList.js stateId = " + stateId);
              }
            });
            return state;
          }
        });
        
        initTranslations();
        
        headerSetup();
        
        // get the seleced customer profile for state id
        self.currCustId(app.moduleConfig.params.rootContext.custId);
        
        
        return oj.Router.sync();
      };
      
      function headerSetup() {
          // get the seleced customer profile for header Title
        var selCustomer = app.moduleConfig.params.rootContext.selCustomerProfile;  
        if (typeof selCustomer !== "undefined") {
            var outletName = ko.utils.unwrapObservable(selCustomer.outletName);
            if(!ko.utils.unwrapObservable(self.large())){
                if(outletName.length > constant.TITLE_LENGTH){
                    outletName = outletName.substring(0, constant.TITLE_LENGTH) + "...";
                }
            }
            self.headerTitle(outletName);
        } else {
            self.headerTitle(self.lng_customerAddressList);
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
            var appLC = $('#globalBody').find('.oj-hybrid-applayout-content');
            var APPLAYOUT_SCROLLABLE = 'oj-hybrid-applayout-scrollable';

            // Note: in iOS, if parent div has 'oj-hybrid-applayout-scrollable',
            // the app shows entire white screen while a input control recieves
            // focus from a textbox or textarea (wherever softkeyboard required)
            // To avoid this, we are removing that class right before the input
            // layout is opened and set it back right before it goes back.
            if (appLC.hasClass(APPLAYOUT_SCROLLABLE)) {

                $('#searchCanvas').on('ojbeforeopen',
                        function ( /*event, offcanvas*/ ) {
                            appLC.removeClass(APPLAYOUT_SCROLLABLE);
                        });

                $('#searchCanvas').on('ojbeforeclose',
                        function ( /*event, offcanvas*/  ) {
                            appLC.addClass(APPLAYOUT_SCROLLABLE);
                        });
            }

            $('#searchCanvas').on('ojclose',
                    function ( /*event, offcanvas*/  ) {
                        // clear the search right before closing the canvas
                        self.clearSearch();
                    });
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
      
      self.headerTitle = ko.observable();
      self.currCustId = ko.observable();
      self.allOutlets = ko.observableArray();
      
      self.searchText = ko.observable('');
      
      self.large = ko.computed(function(){
          var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
          return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
      });

      self.itemOnly = function(context) {
        return context['leaf'];
      };

      self.selectTemplate = function(file, bindingContext) {
        return bindingContext.$itemContext.leaf ? 'item_template' : 'group_template';
      };
      
    function init() {
         console.log("outLetList.js init() started");
         
//         ui.showBusy();
//         
//         prepareUI();
//        
//         ui.hideBusy();
     }      
     
    self.currCustId.subscribe(function (newId) {
        ui.showBusy();
        prepareUI();
        ui.hideBusy();
    });  
     
     function prepareUI() {
         var custId= ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.custId);
         var outlets = app.moduleConfig.params.rootContext.selCustomerProfile.outletAddresses.children;

         var formatted = [];
         var keys = [];
         
         // format data for indexer groups
        for(var i = 0; i < outlets.length; i++) {
          var initial = outlets[i].attr.data.OUTLET_NAME.charAt(0).toUpperCase();
          if(keys.indexOf(initial) > -1) {
            formatted[keys.indexOf(initial)].children.push({ "attr": { "id": outlets[i].attr.data.SHIP_TO_SITE_ID, "data" : outlets[i].attr.data }});
          } else {
            keys.push(initial);
            formatted.push({
              "attr": { "id": outlets[i].attr.data.SHIP_TO_SITE_ID, "initial": initial },
              "children": [{ "attr": { "id": outlets[i].attr.data.SHIP_TO_SITE_ID, "data" : outlets[i].attr.data }} ]
            });
          }
        }         
        
        // sort by name initial
        formatted.sort(function(a, b) {
          return (a.attr.initial > b.attr.initial) ? 1 : (a.attr.initial < b.attr.initial) ? -1 : 0;
        });              
        
        // sort by name within each group
        formatted.forEach(function(group) {
          group.children.sort(function(a, b) {
            // sort by name
            if (a.attr.data.OUTLET_NAME > b.attr.data.OUTLET_NAME) {
              return 1;
            } else if (a.attr.data.OUTLET_NAME < b.attr.data.OUTLET_NAME) {
              return -1;
            } else {
              return 0;
            }
          });
        });

        self.allOutlets(formatted);        
        
        ui.hideBusy();
     }           
      
      // filter outlets
      self.outlets = ko.computed(function() {
        if (self.searchText() && self.allOutlets().length > 0) {
          var filteredOutlets = [];

          var token = self.searchText().toLowerCase();

          self.allOutlets().forEach(function (node) {
            node.children.forEach(function (leaf) {
              if (leaf.attr.data.OUTLET_NAME.toLowerCase().indexOf(token) >= 0 || 
                  leaf.attr.data.SHIP_TO_ADDRESS.toLowerCase().indexOf(token) >= 0) {
                filteredOutlets.push(leaf);
              }
            });
          });
          return new oj.JsonTreeDataSource(filteredOutlets);
        } else {
          return new oj.JsonTreeDataSource(self.allOutlets());
        }
      });
      
    self.onPageReady = function () {
//          try {
//              // update listview on pull-to-refresh
//              oj.PullToRefreshUtils.setupPullToRefresh('#listViewContainer', function () {
//                  var defer = $.Deferred();
//                  
//                  prepareUI();
//                  
//                  defer.resolve({status:200});
//
//                  return $.when(defer);
//              }, {
//                  'primaryText': 'Retrieving...',
//                  'secondaryText': 'please wait'
//              });
//          } catch (e) {
//              console.error(e);
//          }
      };      
      
      
      self.onClearSearchText = function () {
          self.clearSearch();
      };

      self.clearSearch = function () {
          var searchTextBox = $('#searchProduct');
          searchTextBox.ojInputText('option', 'value', '');
          searchTextBox.ojInputText("reset");
          self.searchText('');
      };

      self.toggleSearchCanvas = function (/*data, event*/) {
          console.log("toggleSearchCanvas triggered");
          oj.OffcanvasUtils.toggle(searchCanvas);
      };

      self.onSearchTextChange = function (event, data) {
          if (data.option === 'rawValue') {
              console.log("onSearchTextChange.data.value=" + data.value);
              self.searchText(data.value);
         }
      };            
      
      self.dispose = function(info) {
          self.router.dispose();
      };
      
    function initTranslations() {
        // language translations
        var getTranslation = oj.Translations.getTranslatedString;
        self.lng_searchPlaceHolder = getTranslation("ssa.header.search");
        self.lng_customerAddressList = getTranslation("ssa.outletList.customerAddressList");
    }
      
      // handler for drill in to outlet details
      self.optionChange = function(event, ui) {
        if (ui.option === 'selection' && ui.value[0]) {
          //app.pendingAnimationType = 'navChild';
          console.log("outletList.js outLetId =" + ui.value);
          // store the outlet id
          app.moduleConfig.params.rootContext.outLetId = ui.value;
          app.moduleConfig.params.rootContext.navStateId = 'orderHist';
          app.redirect("orderHist", ui.value);
        }
      };
      
      init();
      
    }

    ko.bindingHandlers.searchCanvas = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if (element) {
                    oj.OffcanvasUtils.close(searchCanvas);
                }
            });
        }
    };

    /*
     * Returns a constructor for the ViewModel so that the ViewModel is constrcuted
     * each time the view is displayed.  Return an instance of the ViewModel if
     * only one instance of the ViewModel is needed.
     */
    return OutletListViewModel;
  }
);
