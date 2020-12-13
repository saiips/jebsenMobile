/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your customer ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController'],
 function(oj, ko, $, app) {

    function CustomerViewModel() {
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
        // Implement if needed
        var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
        console.log("customer.js parentRouter=" + parentRouter.currentState().value);
        
        var childRouter = parentRouter.getChildRouter("customer");
        if (!childRouter) {
            childRouter = parentRouter.createChildRouter('customer');
        }        
        
        self.router = childRouter.configure({
          'customerList': { value: 'pages/customer/customerList', label: 'Customer List', isDefault: true },
          'visitation': { value: 'pages/visitation/visitation', label: 'Visitation' },
          'visitationDetail': { value: 'pages/visitation/visitationDetail', label: 'Visitation Detail' },
          'newVisitation': { value: 'pages/visitation/newVisitation', label: 'New Visitation' },
          'outletList': { value: 'pages/customer/outletList', label: 'Outlet List' },
          'orderHist': { value: 'pages/orderHist/orderHist', label: 'Order' },
          'orderDetail': {value: 'pages/orderDetail/orderDetail', label: 'Order Detail' },
          'newOrder': {value: 'pages/newOrder/newOrder', label: 'New Order' },
          'topOrderItem': {value: 'pages/newOrder/topOrderItem', label: 'Top 10' },          
          'newOrderItem': {value: 'pages/newOrder/newOrderItem', label: 'New Order Item' },
          'checkOut': {value: 'pages/checkOut/checkOut', label: 'Check Out' },
          'checkOutQuotation': {value: 'pages/checkOut/checkOutQuotation', label: 'Check Out' },          
          'payment': {value: 'pages/payment/payment', label: 'Payment' },
          'delivery': {value: 'pages/delivery/delivery', label: 'Delivery' },
          'deliveryDetail': {value: 'pages/delivery/deliveryDetail', label: 'Delivery Detail' },
          'loadingDetail': {value: 'pages/loading/loadingDetail', label: 'Goods Loading Detail' },        
          'reviewLoadingDetail': {value: 'pages/reviewLoading/reviewDetail', label: 'Document Detail' },          
          'shipment': {value: 'pages/shipment/shipment', label: 'Shipment' },
          'profile': {value: 'pages/customer/profile', label: 'Profile' },	  
          'quotation': {value: 'pages/quotation/quotation', label: 'Quotation List' },
          'quotationDetail': {value: 'pages/quotation/quotationDetail', label: 'Quotation Detail' },
          'newQuotation': {value: 'pages/newQuotation/newQuotation', label: 'New Quotation'},
          'topQuotationItem': {value: 'pages/newQuotation/topQuotationItem', label: 'Top 10' },               
          'newQuotationItem': {value: 'pages/newQuotation/newQuotationItem', label: 'New Quotation Item'},
          'reInitateOrderDetail': {value: 'pages/reInitateOrder/reInitateOrderDetail', label: 'Re-Initate Order Detail' },
          'modifier': {value: 'pages/modifier/modifier', label: 'Modifier' }
        });

        function switcherCallback(context) {
          return app.pendingAnimationType;
        }

        function mergeConfig(original) {
          return $.extend(true, {}, original, {
            //'animation': oj.ModuleAnimations.switcher(switcherCallback)
          });
        }

        // pass animation to module transition
        self.moduleConfig = mergeConfig(self.router.moduleConfig);

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

      self.dispose = function(info) {
        self.router.dispose();
      };
    }

    /*
     * Returns a constructor for the ViewModel so that the ViewModel is constrcuted
     * each time the view is displayed.  Return an instance of the ViewModel if
     * only one instance of the ViewModel is needed.
     */
    return new CustomerViewModel();
  }
);
