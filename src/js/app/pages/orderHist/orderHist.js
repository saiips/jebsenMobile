/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your order ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/orderHist/orderHistService', 'pages/common/cartService', 'util/appui', 'util/commonhelper', 'pages/common/constant',
  'ojs/ojknockout', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'ojs/ojnavigationlist', 'promise', 'ojs/ojtoolbar', 'ojs/ojpulltorefresh', 'ojs/ojoffcanvas'],
 function(oj, ko, $, app, service, cartService, ui,  helper, constant) {
    var searchCanvas;

    searchCanvas = {
        "selector": "#searchCanvas",
        "edge": "top",
        "displayMode": "push",
        "size": "63px",
        "modality": "modeless",
        "autoDismiss": "none"
    };              

    function OrderListViewModel() {
      var self = this;
      self.router = app.router;
      
      initTranslations();
      
      // constant variables
      var RESPONSE_TABLE = 'P_ORDER_TBL_ITEM';
      var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
      var custId = app.moduleConfig.params.rootContext.custId;

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
        console.log("orderHist.js parentRouter=" + parentRouter.currentState().value);

        var childRouter = parentRouter.getChildRouter("orderHist");
        if (!childRouter) {
            childRouter = parentRouter.createChildRouter('orderHist');
        }
        self.router = childRouter.configure(function(stateId) {
          if (stateId) {
            var state = new oj.RouterState(stateId, { value: stateId,
              enter: function() {
                // Set outLetId
                self.outLetId(ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.outLetId));
                console.log("orderHist.js outLetId = " + ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.outLetId));
              }
            });
            return state;
          }
        });
        
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
            self.headerTitle(self.lng_orderInquiryList);
        }  
        
        // set the current state of Navigation Bar (Order, Profile, Visit and Quotation)
        self.navStateId(app.moduleConfig.params.rootContext.navStateId);

        
        return oj.Router.sync();
      };
      
    self.isOrderDeskAdmin = ko.computed(function () {
        var user = app.moduleConfig.params.rootContext.userProfile;
        if (user.salesRole == constant.SR_ADMIN) {
            return true;
        }
        if (!app.moduleConfig.params.rootContext.isCordova) return true;
        return false;
    });          

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

      self.handleTransitionCompleted = function(info) {
        // adjust content padding
        /*
        app.adjustContentPadding();
        if (app.pendingAnimationType === 'navChild') {
          app.postDrill();
        }
        */
      };


      self.add = function(info) {
        //var custId = app.moduleConfig.params.rootContext.custId ;         
        app.moduleConfig.params.rootContext.originalCart = ko.observableArray();
        app.moduleConfig.params.rootContext.fromPage = "orderHist";
        app.moduleConfig.params.rootContext.newOrderNavStateId = 'newOrderItem';
        app.moduleConfig.params.rootContext.isReOrder = false;
        app.redirect("newOrderItem", custId);
      };

      // handler for drill in to customer details
      self.optionChange = function(event, ui) {
        if (ui.option === 'selection' && ui.value[0]) {
          //app.pendingAnimationType = 'navChild';
          // ui.value <--- oeHeaderId
         console.log("orderHist.js orderId=" + ui.value);
         
         // get back the headerIdMap
         var headerIdMap = app.moduleConfig.params.rootContext.headerIdMap;
         var orderInfo = headerIdMap[ui.value];
         
         // and store it for later display on orderDetail page
         app.moduleConfig.params.rootContext.isReOrder = false;
         app.moduleConfig.params.rootContext.isDailyOrderSummary = false;
         app.moduleConfig.params.rootContext.isDataSync = false;
         cartService.setOrder(orderInfo);
         
         // Handle the VAN SALES workflow +
         if (orderInfo) {
             var user = app.moduleConfig.params.rootContext.userProfile;
             var orderStatus = orderInfo.status();
             if (orderStatus == constant.ORDER_STATUS_ENTERED && user.salesRole == constant.SR_SALE_VAN) {
                 app.moduleConfig.params.rootContext.isContinuePayment = true;
             } else {
                 app.moduleConfig.params.rootContext.isContinuePayment = false;
             }
         }
         // Handle the VAN SALES workflow -
         
         app.redirect("orderDetail", ui.value);
        }
      };

      self.dispose = function(info) {
        self.router.dispose();
      };

      self.headerTitle =  ko.observable();
      self.outLetId = ko.observable();
      self.allOrders = ko.observableArray();
      self.searchText = ko.observable('');
      // resolve the slow performance on the search input box
      self.searchText.extend({
        rateLimit: {
            timeout: 500,
            method: "notifyWhenChangesStop"
        }
      });      
      
      // add the Quotation for WINE salesman
      var user = app.moduleConfig.params.rootContext.userProfile;
      app.populateDefaultNavPath(user);
      
      self.navDataSource = app.navDataSource;
      self.navChangeHandler = app.navChangeHandler;
      self.navStateId = ko.observable();
      self.syncDatetime = ko.observable();
      self.showLastSyncDate = ko.observable(false);

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
      
    self.refresh = function () {
        ui.showBusy();
        var outletId = new String(ko.utils.unwrapObservable(self.outLetId)).toString();
        pullToRefresh(outletId);
    };      
      
    function getPayload(outletId) {
        // var shipToSiteId = app.moduleConfig.params.rootContext.outLetId ;
        var user = app.moduleConfig.params.rootContext.userProfile;
        var shipToSiteId =  ko.utils.unwrapObservable(outletId);
        console.log("shipToSiteId = " + shipToSiteId);

        var payload = JSON.stringify({
            "InputParameters": {
                "HeaderInfo": {
                    "UserID": user.username,
                    "UserRole": user.salesRole,
                    "CallerID": ""
                },                
                "P_ORG_ID" : orgUnitId,
                "P_ACCOUNT_NUMBER" : custId,
                "P_SHIP_TO_ORG_ID" : new String(shipToSiteId).toString()
            }
        });
        return payload;
    }      
      
      function getAllOrders(outletId) {
          ui.showBusy();
          
         var cbSuccessFn = function (data, xhr) {
             try {
                 prepareUI(data, xhr.status);
             } catch (e) {
                 console.error(e);
             } finally {
                 console.log("cbSuccessFn called");
                 ui.hideBusy();
                 app.moduleConfig.params.rootContext.requireRefresh = false;
             }
         };
         var cbFailFn = function (data, xhr) {
             console.log("cbFailFn failed");
             prepareUI(data, xhr.status);
             ui.hideBusy();
             app.moduleConfig.params.rootContext.requireRefresh = false;
         };
         if (app.moduleConfig.params.rootContext.requireRefresh) {
             service.refreshOrderListMessage(getPayload(outletId)).then(cbSuccessFn, cbFailFn);
         } else {
             service.getOrderListMessage(getPayload(outletId)).then(cbSuccessFn, cbFailFn);
         }
     }
     
    function pullToRefresh(outletId){
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
        service.refreshOrderListMessage(getPayload(outletId)).then(cbSuccessFn, cbFailFn);
    }
     
     function prepareUI(data, status) {
         // console.log("raw data = " + ko.toJSON(data));
         data = (Array.isArray(data)) ? data[0] : data;
         if (data !== null && status == 200) {
                var respJSON = data[RESPONSE_TABLE];
                var formatted = [];
                var keys = [];
                var headerIdMap = {};

                // format data for indexer groups
                for (var i = 0; i < respJSON.length; i++) {
                    var orderNumber = respJSON[i]['ORDER_NUMBER'];
                    var oeHeaderId =  respJSON[i]["OE_HEADER_ID"];
                    
                    // store the order header
                    var orderInfo= cartService.createOrder(respJSON[i]);
                    
                    // mapping for oe_header_id
                    if (typeof headerIdMap[oeHeaderId] === "undefined") {
                        headerIdMap[oeHeaderId] = orderInfo;
                    }
                    var orderDate = respJSON[i]['ORDERED_DATE'];
                    if (helper.isValid(orderDate)) {
                        orderDate = helper.formatStrDateToYYYYMMDD(orderDate);
                    }
                    if (keys.indexOf(orderDate) > -1) {
                        formatted[keys.indexOf(orderDate)].children.push({ "attr": {"id": oeHeaderId, "data": respJSON[i] }});
                    } else {
                        keys.push(orderDate);
                        formatted.push({
                            "attr": {"id": oeHeaderId, "orderDate": orderDate},
                            "children": [{ "attr": {"id": oeHeaderId, "data": respJSON[i] }}]
                        });
                    }
                }
                
                // sort by orderDate
                formatted.sort(function (a, b) {
                    return (a.attr.orderDate < b.attr.orderDate) ? 1 : (a.attr.orderDate > b.attr.orderDate) ? -1 : 0;
                });

                // sort by orderDate then refNo within each group
                formatted.forEach(function (group) {
                    group.children.sort(function (a, b) {
                        // sort by parent
                        if (a.attr.ORDERED_DATE < b.attr.ORDERED_DATE) {
                            return 1;
                        } else if (a.attr.ORDERED_DATE > b.attr.ORDERED_DATE) {
                            return -1;
                        }

                        // else sort by name
                        return (a.attr.ORDER_NUMBER < b.attr.ORDER_NUMBER) ? 1 : (a.attr.ORDER_NUMBER > b.attr.ORDER_NUMBER) ? -1 : 0;
                    });
                });

                self.allOrders(formatted);
                
                // update the header id map
                app.moduleConfig.params.rootContext.headerIdMap = headerIdMap;
                
                var shipToSiteId =  ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.outLetId);
                var key = constant.ORDER_LIST_KEY + ":" + orgUnitId + ":" + custId + ":" +
                        shipToSiteId + ":" + constant.ORDER_HISTORY_SYNC_DATETIME;
                var data = ui.getLocalStorage(key);
                if (data) {
                     self.syncDatetime(data);
                     self.showLastSyncDate(true);
                }
            }
     }      
          
      // load orders
      self.outLetId.subscribe(function(newOutletId) {
            getAllOrders(newOutletId);
      });
      
    function initTranslations() {
        // language translations
        var getTranslation = oj.Translations.getTranslatedString;
        self.lng_orderInquiryList = getTranslation("ssa.orderHistory.orderInquiryList");
        self.lng_searchPlaceHolder = getTranslation("ssa.header.search");
        self.lng_lastSyncDate = getTranslation("ssa.header.lastSyncDate");
        self.lng_orderType = getTranslation("ssa.orderHistory.orderType");
        self.lng_price = getTranslation("ssa.orderHistory.price");
        self.lng_order = getTranslation("ssa.orderHistory.order");
        self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
        self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");
    }
    
    // handle pull-to-refresh
    self.onPageReady = function () {
        try {
            oj.PullToRefreshUtils.setupPullToRefresh('#listviewContainer', function ()
            {
                var promise = new Promise(function (resolve, reject)
                {
                    self.onClearSearchText();
                    var outletId = new String(ko.utils.unwrapObservable(self.outLetId)).toString();
                    pullToRefresh(outletId);
                    setTimeout(function () {
                        resolve();
                    }, 3000);
                });
                return promise;
            }, {'primaryText': self.lng_primaryText, 'secondaryText': self.lng_secondaryText});
        } catch (e) {
            console.error(e);
        }
    };    
    
    // handle pull-to-refresh
    $(document).ready(
        function() 
        {
            oj.PullToRefreshUtils.setupPullToRefresh('#listviewContainer', function()
            {
                var promise = new Promise(function(resolve, reject)
                {
                    var outletId = new String(ko.utils.unwrapObservable(self.outLetId)).toString();
                    
                    pullToRefresh(outletId);
                    setTimeout(function () {
                        resolve();
                    }, 3000);
                });
                return promise;
            }, {'primaryText': self.lng_primaryText, 'secondaryText': self.lng_secondaryText});

            $('#listview').on({
                'ojdestroy': function()
                {
                    oj.PullToRefreshUtils.tearDownPullToRefresh('#listviewContainer');
                }
            });
        }
    );
      
      // filter orders
      self.orders = ko.computed(function() {
        if (self.searchText() && self.allOrders().length > 0) {
          var filteredOrders = [];

          var token = self.searchText().toLowerCase();

          self.allOrders().forEach(function (node) {
            node.children.forEach(function (leaf) {
              if (leaf.attr.data.ORDER_NUMBER.toLowerCase().indexOf(token) === 0) {
                filteredOrders.push(leaf);
              }
            });
          });
          return new oj.JsonTreeDataSource(filteredOrders);
        } else {
          return new oj.JsonTreeDataSource(self.allOrders());
        }
      });
      
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
          oj.OffcanvasUtils.toggle(searchCanvas);
      };

      self.onSearchTextChange = function (event, data) {
          if (data.option === 'rawValue') {
              self.searchText(data.value);
         }
      };     
     
    }
    
    // screen halt if not close the seachCanvas
    ko.bindingHandlers.searchCanvas = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
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
    return OrderListViewModel;
  }
);
