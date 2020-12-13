define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/newOrder/newOrderService', 'pages/common/cartService', 'util/commonhelper',
    'amplify', 'util/appui', 'pages/common/constant', 'promise', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'ojs/ojpagingcontrol', 'ojs/ojnavigationlist',
    'ojs/ojrouter', 'promise', 'ojs/ojtoolbar', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber',
    'ojs/ojarraytabledatasource', 'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, service, cartService, commonHelper, amplify, ui, constant) {
            var searchCanvas;

            searchCanvas = {
                "selector": "#searchCanvas",
                "edge": "top",
                "displayMode": "push",
                "size": "63px",
                "modality": "modeless",
                "autoDismiss": "none"
            };

            function NewTopOrderItemViewModel() {
                var self = this;

                initTranslation();
                // constant variables
                var RESPONSE_TABLE = 'P_PRICE_LIST_TBL_ITEM';

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
                    console.log("topOrderItem.js parentRouter=" + parentRouter.currentState().value);

                    // reset
                    self.searchText('');
                    self.scrollPos(0);

                    var childRouter = parentRouter.getChildRouter("topOrderItem");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('topOrderItem');
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

                    initTranslation();

                    self.headerSubTitle(self.lng_topOrder);

                    setupTotalCnt();

                    setupPayloadKey();

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
                        self.headerTitle(self.lng_topOrder);
                    }
                    
                    self.isOrderDeskAdmin = ko.computed(function () {
                        var user = app.moduleConfig.params.rootContext.userProfile;
                        if (user.salesRole == constant.SR_ADMIN) {
                            return true;
                        }
                        if (!app.moduleConfig.params.rootContext.isCordova) return true;
                        return false;
                    });                             
                    
                    // self.newOrderNavDataSource = app.newOrderNavDataSource;
                    self.newOrderNavDataSource = ko.computed(function () {
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

                    // set the current state of Navigation Bar (Item List, Top 10, Order List)
                    self.newOrderNavStateId(app.moduleConfig.params.rootContext.newOrderNavStateId);

                    return oj.Router.sync();
                };

                console.log("NewTopOrderItemViewModel");

                // router
                self.router = app.router;

                // observables : shopping cart and product
                self.allProduct = ko.observableArray();
                self.ready = ko.observable(false);
                self.cart = ko.observableArray();
                self.currOrderId = ko.observable();
                self.headerTitle = ko.observable('');
                self.headerSubTitle = ko.observable();
                self.newOrderNavStateId = ko.observable();
                self.totalCnt = ko.observable(0);
                self.payloadKey = ko.observable();
                self.options = ko.observableArray();
                self.selectItem = ko.observable();
                self.syncDatetime = ko.observable();
                self.showLastSyncDate = ko.observable(false);
                self.scrollPos = ko.observable(0);



                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });


                //setup recent Item Codes
                self.searchText = ko.observable('');
                self.lng_searchPlaceHolder = ko.observable(self.lng_searchPlaceHolderText);

                // resolve the slow performance on the search input box
                self.searchText.extend({
                    rateLimit: {
                        timeout: 500,
                        method: "notifyWhenChangesStop"
                    }
                });

                self.itemCode = ko.observableArray();

                self.payloadKey.subscribe(function (newKey) {
                    console.log("new payloadKey =" + newKey);
                    init();
                });
                
                self.refresh = function() {
                    ui.showBusy();
                    pullToRefresh();
                };                   

                // handle pull-to-refresh
                self.onPageReady = function () {
                    try {
                        oj.PullToRefreshUtils.setupPullToRefresh('#listviewContainer', function ()
                        {
                            var promise = new Promise(function (resolve, reject)
                            {
                                self.onClearSearchText();
                                pullToRefresh();
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

                function isVanSales() {
                    var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    if (salesRole == constant.SR_SALE_VAN)
                        return true;
                    return false;
                }

                function setupPayloadKey() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var orgUnitId = ko.utils.unwrapObservable(user.orgUnitId);
                    var selCustomerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var shipToOrgId = ko.utils.unwrapObservable(selCustomerProfile.shipToSiteId);
                    var priceListId = ko.utils.unwrapObservable(selCustomerProfile.priceListId);
                    shipToOrgId = new String(ko.utils.unwrapObservable(shipToOrgId)).toString();
                    priceListId = new String(ko.utils.unwrapObservable(priceListId)).toString();
                    self.payloadKey(user.username + ":" + orgUnitId + ":" + shipToOrgId + ":" + priceListId);
                }

                function getPayload() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var selCustomerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var priceListId = ko.utils.unwrapObservable(selCustomerProfile.priceListId);
                    priceListId = new String(ko.utils.unwrapObservable(priceListId)).toString();
                    var shipToOrgId = ko.utils.unwrapObservable(selCustomerProfile.shipToSiteId);
                    shipToOrgId = new String(ko.utils.unwrapObservable(shipToOrgId)).toString();
                    
                    var payload = JSON.stringify({
                        "InputGetTop10PriceList": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": user.orgUnitId,
                            "P_SHIP_TO_ORG_ID": shipToOrgId,
                            "P_PRICE_LIST_ID": priceListId
                        }
                    });
                    return payload;
                }

                function setupTotalCnt() {
                    // set the total item count 
                    var _cart = app.moduleConfig.params.rootContext.originalCart;
                    console.log("_cart = " + ko.toJSON(_cart));

                    if (!Array.isArray(_cart)) {
                        _cart = ko.utils.unwrapObservable(_cart);
                    }
                    console.log("isArray(_cart) = " + Array.isArray(_cart));
                    if (Array.isArray(_cart)) {
                        self.totalCnt(_cart.length);
                    }
                }

                function init() {
                    console.log("topOrderItem.js init() started");
                    self.ready(false);
                    ui.showBusy();
                    setupTotalCnt();
                    getPriceListData();
                }

                function getPriceListData() {
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                            ui.hideBusy();
                        } finally {
                            ui.hideBusy();
                            console.log("cbSuccessFn called");
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        prepareUI(data, xhr.status);
                        ui.hideBusy();
                    };
                    service.getTopItemListMessage(getPayload()).then(cbSuccessFn, cbFailFn);
                }

                function pullToRefresh() {
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            console.log("cbSuccessFn called");
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        prepareUI(data, xhr.status);
                    };
                    service.refreshTopItemListMessage(getPayload()).then(cbSuccessFn, cbFailFn);
                }

                function prepareUI(data, status) {
                    console.log("raw data = " + ko.toJSON(data));
                    data = (Array.isArray(data)) ? data[0] : data;
                    if (data !== null && status == 200) {
                        var respJSON = data[RESPONSE_TABLE];
                        var formatted = [];
                        // ensure the data is in Array Object returned from SOA
                        if (!Array.isArray(respJSON)) {
                            respJSON = new Array(respJSON);
                        }
                        for (var i = 0; i < respJSON.length; i++) {
                            var payload = JSON.stringify(
                                    {
                                        "INVENTORY_ITEM_ID": respJSON[i].INVENTORY_ITEM_ID,
                                        "PRODUCT_DESCRIPTION": respJSON[i].PRODUCT_DESCRIPTION,
                                        "DESCRIPTION": respJSON[i].DESCRIPTION,
                                        "PRODUCT": respJSON[i].PRODUCT,
                                        "LOT_NUMBER": "",
                                        "ORDER_QUANTITY_UOM": respJSON[i].PRODUCT_UOM_CODE,
                                        "UNIT_SELLING_PRICE": respJSON[i].UNIT_PRICE,
                                        "FLOW_STATUS_CODE": "",
                                        "PRODUCT_BRAND": respJSON[i].PRODUCT_BRAND,
                                        "PRINCIPAL": respJSON[i].PRINCIPAL,
                                        "CURRENCY_CODE": respJSON[i].CURRENCY_CODE,
                                        "DRAFT_BEER_FLAG": respJSON[i].DRAFT_BEER_FLAG
                                    }
                            );
                            cart_item = cartService.createCartItem(ko.utils.parseJson(payload), 0, true, commonHelper.getClientCurrentDate(), 'Y', new Array());
                            // self.allProduct.push(cart_item);
                            // console.log("cart_item = " + ko.toJSON(cart_item));
                            formatted[i] = cart_item;
                        }

//                        formatted.sort(function (a, b) {
//                            return (a.product().prod_desc() < b.product().prod_desc()) ? -1 : (a.product().prod_desc() > b.product().prod_desc()) ? 1 : 0;
//                        });
                        self.allProduct(formatted);

                        // show the last date sync time
                        populateSyncDate();
                    }
                    ui.hideBusy();
                    self.ready(true);
                }

                function populateSyncDate() {
                    var P_ORG_ID = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    var selCustomerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var P_PRICE_LIST_ID = ko.utils.unwrapObservable(selCustomerProfile.priceListId);
                    var P_SHIP_TO_ORG_ID = ko.utils.unwrapObservable(selCustomerProfile.shipToSiteId);

                    // define the key for local storage
                    var key = constant.TOP_ITEM_LIST_KEY + ":" + P_ORG_ID + ":" + P_SHIP_TO_ORG_ID + ":" + P_PRICE_LIST_ID + ":" + constant.TOP_ITEM_LIST_SYNC_DATATIME;
                    var data = ui.getLocalStorage(key);
                    if (data) {
                        self.syncDatetime(data);
                        self.showLastSyncDate(true);
                    }
                }

                // filter products
                self.products = ko.computed(function () {
                    var allProduct = ko.utils.unwrapObservable(self.allProduct());

                    if (self.searchText() && allProduct.length > 0) {
                        var token = self.searchText().toLowerCase();
                        var product = filterProduct(allProduct, token);
                        return new oj.ArrayTableDataSource(product, {idAttribute: 'id'});
                    } else {
                        return new oj.ArrayTableDataSource(allProduct, {idAttribute: 'id'});
                    }
                });

                function filterProduct(allProduct, token) {
                    if (token == constant.ALL_CODE.toString().toLowerCase()) {
                        return allProduct;
                    }
                    var product = ko.utils.arrayFilter(allProduct, function (r) {
                        return (r.product().prod_desc().toLowerCase().indexOf(token) >= 0 ||
                                r.product().prod_code().toLowerCase().indexOf(token) >= 0 ||
                                r.product().prod_brand().toLowerCase().indexOf(token) >= 0);
                    });
                    return product;
                }

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
                function addToCartUI(data, event) {
                    var aTag;
                    var sTag;
                    if (event.target.tagName == 'SPAN') {
                        sTag = $(event.target);
                        aTag = $(event.target.parentNode);
                    } else if (event.target.tagName == 'A') {
                        sTag = $(event.target).find('span');
                        aTag = $(event.target);
                    }

                    if (aTag.attr('clicked') && aTag.attr('clicked') == 'true') {
                        return;
                    }

                    if (!aTag.attr('clicked')) {
                        aTag.attr('clicked', false);
                    }
                    aTag.attr('clicked', true);

                    aTag.css("background-color", "rgb(70, 133, 191)");
                    var text = sTag.text();
                    sTag.text(self.lng_added);

                    setTimeout(function () {
                        aTag.css("background-color", "#002d72");
                        sTag.text(text);
                        aTag.attr('clicked', false);
                    }, 100);
                }

                self.addToCart = function (data, event) {
                    var payload = JSON.stringify(
                            {
                                "INVENTORY_ITEM_ID": ko.utils.unwrapObservable(data.product().id),
                                "PRODUCT_DESCRIPTION": ko.utils.unwrapObservable(data.product().prod_desc),
                                "PRODUCT": ko.utils.unwrapObservable(data.product().prod_code),
                                "LOT_NUMBER": ko.utils.unwrapObservable(data.product().lot),
                                "ORDER_QUANTITY_UOM": ko.utils.unwrapObservable(data.product().sku),
                                "UNIT_SELLING_PRICE": ko.utils.unwrapObservable(data.product().price),
                                "FLOW_STATUS_CODE": ko.utils.unwrapObservable(data.product().delivery_status),
                                "PRODUCT_BRAND": ko.utils.unwrapObservable(data.product().prod_brand),
                                "CURRENCY_CODE": ko.utils.unwrapObservable(data.product().currency_code),
                                "DRAFT_BEER_FLAG": ko.utils.unwrapObservable(data.product().draft_beer_flag)
                            }
                    );
                    var cartItem = cartService.createCartItem(ko.utils.parseJson(payload), 1, true, commonHelper.getClientCurrentDate(), 'Y', new Array());

                    // backup the shopping cart
                    var _cart = app.moduleConfig.params.rootContext.originalCart;
                    if (!Array.isArray(_cart)) {
                        _cart = ko.utils.unwrapObservable(_cart);
                    }
                    if (typeof _cart === "undefined" || _cart.length == 0) {
                        var tempCart = new Array();
                        tempCart.push(cartItem);
                        app.moduleConfig.params.rootContext.originalCart = tempCart;
                    } else {
                        app.moduleConfig.params.rootContext.originalCart.push(cartItem);
                    }

                    // update the ordered item count
                    self.totalCnt(ko.utils.unwrapObservable(self.totalCnt()) + 1);

                    // UI Effect
                    addToCartUI(data, event);
                };

                self.checkOut = function (data, event) {
                    // app.moduleConfig.params.rootContext.originalCart = self.cart;
                    app.moduleConfig.params.rootContext.fromPage = "topOrderItem";
                    var custId = app.moduleConfig.params.rootContext.custId;

                    console.log("app.moduleConfig.params.rootContext.originalCart=" + ko.toJSON(app.moduleConfig.params.rootContext.originalCart));
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
                    if (!isDataSync() && (fromPage === "orderHist" || fromPage === "newOrder" || fromPage === "newOrderItem" || fromPage === "topOrderItem")) {
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

                function isDataSync() {
                    return app.moduleConfig.params.rootContext.isDataSync;
                }      

                function initTranslation() {
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_topOrder = getTranslation("ssa.newOrderItem.topOrder");
                    self.lng_itemList = getTranslation("ssa.newOrderItem.itemList");
                    self.lng_topList = getTranslation("ssa.newOrderItem.topList");
                    self.lng_orderList = getTranslation("ssa.newOrderItem.orderList");
                    self.lng_searchPlaceHolderText = getTranslation("ssa.newOrderItem.searchPlaceHolder");
                    self.lng_addToCart = getTranslation("ssa.newOrderItem.addToCart");
                    self.lng_added = getTranslation("ssa.newOrderItem.added");
                    self.lng_principal = getTranslation("ssa.newOrderItem.principal");
                    self.lng_allPrincipal = getTranslation("ssa.newOrderItem.allPrincipal");
                    self.lng_noItemCart = getTranslation("ssa.msg.info.noItemCart");
                    self.lng_lastSyncDate = getTranslation("ssa.header.lastSyncDate");
                    self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                    self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");
                }

                // init();
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

            return new NewTopOrderItemViewModel();

        }
);
