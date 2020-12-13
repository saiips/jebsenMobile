define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/newOrder/newOrderService', 'pages/common/cartService', 'util/appui', 'pages/common/constant',
    'promise', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'ojs/ojpagingcontrol', 'ojs/ojnavigationlist',
    'ojs/ojrouter', 'ojs/ojtoolbar', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber',
    'ojs/ojarraytabledatasource', 'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, service, cartService, ui, constant) {
            var searchCanvas;

            searchCanvas = {
                "selector": "#searchCanvas",
                "edge": "top",
                "displayMode": "push",
                "size": "63px",
                "modality": "modeless",
                "autoDismiss": "none"
            };



            function NewOrderViewModel() {
                var self = this;

                initTranslation();

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
                self.handleActivated = function (info) {
                    // Implement if needed
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("newOrder.js parentRouter=" + parentRouter.currentState().value);

                    var childRouter = parentRouter.getChildRouter("newOrder");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('newOrder');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set current order id
                                    self.currOrderId(stateId);
                                    console.log("stateId =" + stateId);
                                }
                            });
                            return state;
                        }
                    });

                    self.headerSubTitle(self.lng_newOrder);
                    
                    // get the seleced customer profile for header Title
                    var selCustomer = app.moduleConfig.params.rootContext.selCustomerProfile;
                    if (typeof selCustomer !== "undefined") {
                        var outletName = ko.utils.unwrapObservable(selCustomer.outletName);
                        if (!ko.utils.unwrapObservable(self.large())) {
                            if (outletName.length > constant.TITLE_LENGTH) {
                                outletName = outletName.substring(0, constant.TITLE_LENGTH) + "...";
                            }
                        }
                        self.headerTitle(outletName);
                    } else {
                        self.headerTitle("");
                    }                    

                    // set the current state of Navigation Bar (Order, Profile, Visit and Quotation)
                    self.newOrderNavStateId(app.moduleConfig.params.rootContext.newOrderNavStateId);


                    return oj.Router.sync();
                };

                console.log("NewOrderViewModoel");

                // router
                self.router = app.router;

                // observables : shopping cart and product
                self.allProduct = ko.observableArray();
                self.ready = ko.observable(false);
                self.cart = ko.observableArray();
                self.currOrderId = ko.observable();
                self.headerTitle = ko.observable('');
                self.headerSubTitle = ko.observable('');
                self.totalCnt = ko.observable(0);
                
                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });                

                // self.newOrderNavDataSource = app.newOrderNavDataSource;
                self.newOrderNavDataSource = ko.computed(function () {
                    //New Order Navigation setup
                    var newOrderNavData = [
                        {name: self.lng_itemList, id: 'newOrderItem',
                            iconClass: 'oj-navigationlist-item-icon demo-icon demo-dashboard-icon'},
                        {name: self.lng_topList, id: 'topOrderItem',
                            iconClass: 'oj-navigationlist-item-icon demo-icon demo-dashboard-icon'},                            
                        {name: self.lng_orderList, id: 'newOrder',
                            iconClass: 'oj-navigationlist-item-icon demo-icon demo-incidents-icon'}
                    ];
                    return new oj.ArrayTableDataSource(newOrderNavData, {idAttribute: 'id'});
                });
                self.newOrderNavChangeHandler = app.newOrderNavChangeHandler;
                self.newOrderNavStateId = ko.observable();

                self.searchText = ko.observable('');
                self.lng_searchPlaceHolder = ko.observable(self.lng_searchPlaceHolderText);

                // resolve the slow performance on the search input box
                self.searchText.extend({
                    rateLimit: {
                        timeout: 500,
                        method: "notifyWhenChangesStop"
                    }
                });


                function init() {
                    console.log("newOrder.js init() started");

                    // restore the shopping cart
                    var originalCart = app.moduleConfig.params.rootContext.originalCart;
                    console.log("originalCart = " + ko.toJSON(originalCart));
                    console.log("isArray(originalCart) = " + Array.isArray(originalCart));
                    if (!Array.isArray(originalCart)) {
                        originalCart = ko.utils.unwrapObservable(originalCart);
                    }
                    self.totalCnt(originalCart.length);
                    self.allProduct(originalCart);

                    self.ready(true);
                }

                // filter products
                self.products = ko.computed(function () {
                    var token = self.searchText().toLowerCase();
                    if (self.searchText() && self.allProduct().length > 0) {
                        var product = ko.utils.arrayFilter(self.allProduct(), function (r) {
                            return (r.product().prod_desc().toLowerCase().indexOf(token) >= 0 ||
                                    r.product().prod_code().toLowerCase().indexOf(token) >= 0 ||
                                    r.product().prod_brand().toLowerCase().indexOf(token) >= 0);
                        });
                        return new oj.ArrayTableDataSource(product, {idAttribute: 'id'});
                    } else {
                        return new oj.ArrayTableDataSource(self.allProduct(), {idAttribute: 'id'});
                    }
                });


                self.handleBindingsApplied = function (info) {
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

                /* action */
                self.removeCart = function (data) {
                    var id = ko.utils.unwrapObservable(data.id);
                    var quantity = ko.utils.unwrapObservable(data.quantity);
                    var foundItem = ko.utils.arrayFirst(self.allProduct(), function (item) {
                        var cartId = ko.utils.unwrapObservable(item.id);
                        var cartQuantity = ko.utils.unwrapObservable(item.quantity);
                        if (cartId == id && cartQuantity == quantity) {
                            return item;
                        }
                    });
                    self.allProduct.remove(foundItem);
                    if (foundItem) {
                        self.totalCnt(ko.utils.unwrapObservable(self.totalCnt()) - 1);
                    }
                    app.moduleConfig.params.rootContext.originalCart = ko.utils.unwrapObservable(self.allProduct);

                };

                self.checkOut = function (data, event) {
                    // app.moduleConfig.params.rootContext.originalCart = self.allProduct;
                    app.moduleConfig.params.rootContext.fromPage = "newOrder";
                    var custId = app.moduleConfig.params.rootContext.custId;
                    var allowCheckOut = cartService.allowCheckOut(app.moduleConfig.params.rootContext.originalCart);
                    if (allowCheckOut) {
                        app.redirect("checkOut", custId);
                    } else {
                        ui.showMessageBox(self.lng_noItemCart);
                    }
                };

                self.goBack = function (data, event) {
                    console.log("goBack clicked");
                    var fromPage = app.moduleConfig.params.rootContext.fromPage;
                    if (!isDataSync() && (fromPage === "orderHist" || fromPage === "newOrder" || fromPage === "newOrderItem")) {
                        var custId = app.moduleConfig.params.rootContext.custId;
                        app.redirect("orderHist", custId);
                    } else {
                        var orderId = ko.utils.unwrapObservable(self.currOrderId);
                        app.redirect("orderDetail", orderId);
                    }
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };

                self.onPageReady = function () {
                };

                function isDataSync() {
                    return app.moduleConfig.params.rootContext.isDataSync;
                }    

                function initTranslation() {
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_newOrder = getTranslation("ssa.newOrder.newOrder");
                    self.lng_qty = getTranslation("ssa.newOrder.qty");
                    self.lng_itemList = getTranslation("ssa.newOrder.itemList");
                    self.lng_topList = getTranslation("ssa.newOrder.topList");                           
                    self.lng_orderList = getTranslation("ssa.newOrder.orderList");
                    self.lng_searchPlaceHolderText = getTranslation("ssa.newOrder.searchPlaceHolder");
                    self.lng_noItemCart = getTranslation("ssa.msg.info.noItemCart");
                };
                 

                init();
            } ;

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

            ko.bindingHandlers.winsize = {init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    $(window).resize(function () {
                        viewModel.screenWidth($(window).width());
                        viewModel.screenHeight($(window).height());
                    });
                }};

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



            return NewOrderViewModel;

        }
);
