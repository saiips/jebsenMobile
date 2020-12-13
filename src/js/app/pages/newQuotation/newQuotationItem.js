define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/newOrder/newOrderService', 'pages/common/cartService', 'util/commonhelper', 
    'util/appui', 'pages/common/constant', 'promise', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'ojs/ojpagingcontrol', 'ojs/ojnavigationlist',
    'ojs/ojrouter', 'ojs/ojtoolbar', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber',
    'ojs/ojarraytabledatasource', 'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, service, cartService, commonHelper, ui, constant) {
            var searchCanvas;

            searchCanvas = {
                "selector": "#searchCanvas",
                "edge": "top",
                "displayMode": "push",
                "size": "63px",
                "modality": "modeless",
                "autoDismiss": "none"
            };

            function NewQuotationItemViewModel() {
                var self = this;
                
                initTranslation();                

                var firstItemInPrincipal;
                
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
                    console.log("newQuotationItem.js parentRouter=" + parentRouter.currentState().value);

                    // reset
                    self.searchByPrincipal(false);
                    self.searchText('');
                    self.scrollPos(0);
                    self.selectItem = firstItemInPrincipal;                    

                    var childRouter = parentRouter.getChildRouter("newQuotationItem");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('newQuotationItem');
                    }  
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set current quotation id
                                    self.currQuotationId(stateId);
                                    console.log("stateId =" + stateId);
                                }
                            });
                            return state;
                        }
                    });
                    
                    initTranslation();                    

                    self.headerSubTitle(self.lng_newQuotation);
                    
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
                    
                    setupTotalCnt();
                    
                    setupPayloadKey();
                    
                    self.newQuotationNavDataSource = ko.computed(function () {
                        var newOrderNavData = [
                            {name: self.lng_itemList, id: 'newQuotationItem',
                                iconClass: 'oj-navigationlist-item-icon demo-icon demo-dashboard-icon'},
                            {name: self.lng_topList, id: 'topQuotationItem',
                                iconClass: 'oj-navigationlist-item-icon demo-icon demo-dashboard-icon'},
                            {name: self.lng_quotationList, id: 'newQuotation',
                                iconClass: 'oj-navigationlist-item-icon demo-icon demo-incidents-icon'}
                        ];
                        return new oj.ArrayTableDataSource(newOrderNavData, {idAttribute: 'id'});
                    });
                    self.newQuotationNavChangeHandler = app.newQuotationNavChangeHandler;

                    // set the current state of Navigation Bar (Item List, Quotation List)
                    self.newQuotationNavStateId(app.moduleConfig.params.rootContext.newQuotationNavStateId);

                    return oj.Router.sync();
                };

                console.log("NewQuotationItemViewModoel");

                // router
                self.router = app.router;

                // observables : shopping cart and product
                self.allProduct = ko.observableArray();
                self.ready = ko.observable(false);
                self.cart = ko.observableArray();
                self.currQuotationId = ko.observable();
                self.headerTitle = ko.observable('');
                self.headerSubTitle = ko.observable('');                
                self.newQuotationNavStateId = ko.observable();
                self.totalCnt = ko.observable(0);
                self.payloadKey = ko.observable();
                self.scrollPos = ko.observable(0);
                self.selectItem = ko.observable();
                
                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });                

                //setup recent Item Codes
                self.suggestions = ko.observableArray();
                self.searchText = ko.observable('');
                self.searchByPrincipal = ko.observable(false);

                self.payloadKey.subscribe(function(newKey) {
                    console.log("new payloadKey =" + newKey);
                    init();
                });

                self.lng_searchPlaceHolder = ko.observable(self.lng_searchPlaceHolderText);
                // resolve the slow performance on the search input box
                self.searchText.extend({
                    rateLimit: {
                        timeout: 500,
                        method: "notifyWhenChangesStop"
                    }
                });

                self.itemCode = ko.observableArray();
                
                function setupPayloadKey() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var orgUnitId = ko.utils.unwrapObservable(user.orgUnitId);
                    var selCustomerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var custId = ko.utils.unwrapObservable(selCustomerProfile.id);                    
                    var priceListId = constant.PRICE_ID_WINE;      
                    self.payloadKey(user.username + ":" + orgUnitId + ":" + custId + ":" + priceListId);                    
                }                

                function getPayload() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    // var selCustomerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    // var priceListId = selCustomerProfile.priceListId;
                    var priceListId = constant.PRICE_ID_WINE;  // use standard price list for quotation
                    
                    var priceListKeys = [];
                    var P_PRICE_LIST_ID_TBL_ITEM = [];
                    priceListKeys.push(priceListId);
                    for (var i = 0; i < priceListKeys.length; i++) {
                        P_PRICE_LIST_ID_TBL_ITEM.push({"PRICE_LIST_ID": priceListKeys[i]});
                    }
                    var payload = JSON.stringify({
                        "InputGetPriceList": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },                            
                            "P_ORG_ID": orgUnitId,
                            "P_PRICE_LIST_ID_TBL": {"P_PRICE_LIST_ID_TBL_ITEM": P_PRICE_LIST_ID_TBL_ITEM}
                        }
                    });
                    
                    console.log("payload = " + ko.toJS(payload));
                    return payload;
                }
                
                function setupTotalCnt() {
                    // set the total item count 
                    var _cart = app.moduleConfig.params.rootContext.originalQuotationCart;
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
                    console.log("newQuotationItem.js init() started");
                    self.ready(false);
                    ui.showBusy();
                    // set the total item count 
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
                            console.log("cbSuccessFn called");
                            ui.hideBusy();
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        prepareUI(data, xhr.status);
                        ui.hideBusy();
                    };
                    service.getPriceListMessage(getPayload()).then(cbSuccessFn, cbFailFn);                    
                }
                
                function prepareUI(data, status) {
                    console.log("prepareUI triggered");
                    data = (Array.isArray(data)) ? data[0] : data;
                    if (data !== null && status == 200) {
                        var respJSON = data[RESPONSE_TABLE];
                        var formatted = [];
                        var principals = [];
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
                            formatted[i] = cart_item;
                            // cater the sorting of principals
                            if (principals.indexOf(ko.utils.unwrapObservable(cart_item.product().principal)) < 0) {
                                principals.push(ko.utils.unwrapObservable(cart_item.product().principal));
                            }                            
                        }

//                        formatted.sort(function (a, b) {
//                            return (a.product().prod_desc() < b.product().prod_desc()) ? -1 : (a.product().prod_desc() > b.product().prod_desc()) ? 1 : 0;
//                        });
                        self.allProduct(formatted);

                        self.uniquePrincipals = ko.dependentObservable(function () {
                            return ko.utils.arrayGetDistinctValues(principals);
                        });

                        var tags = ko.utils.unwrapObservable(self.uniquePrincipals());
                        var optionMap = new Map();
                        var options = [];
                        var firstItem = '';
                        for (tagIndex in tags) {
                            if (tags[tagIndex].trim().length > 0) {
                                var _itemCode = tags[tagIndex];
                                if (optionMap.get(_itemCode) !== _itemCode) {
                                    if (firstItem === '') {
                                        firstItem = _itemCode;
                                        firstItemInPrincipal = _itemCode;
                                    }
                                    optionMap.set(_itemCode, _itemCode);
                                    var option = {
                                        value: _itemCode, label: _itemCode
                                    };
                                    options.push(option);
                                }
                            }

                        }
                        self.selectItem = firstItem;
                        self.options = ko.observableArray(options);

                        populatePrincipal();

                        // filter products
                        self.products = ko.computed(function () {
                            var allProduct = ko.utils.unwrapObservable(self.allProduct());

                            if (self.searchText() && allProduct.length > 0 && !self.searchByPrincipal() ) {
                                var token = self.searchText().toLowerCase();
                                var product = ko.utils.arrayFilter(allProduct, function (r) {
                                    return (r.product().prod_desc().toLowerCase().indexOf(token) >= 0 ||
                                            r.product().prod_code().toLowerCase().indexOf(token) >= 0 ||
                                            r.product().prod_brand().toLowerCase().indexOf(token) >= 0);
                                });
                                return new oj.ArrayTableDataSource(product, {idAttribute: 'id'});
                            } else {
                                var token = self.selectItem.toString().toLowerCase();
                                var product = ko.utils.arrayFilter(allProduct, function (r) {
                                    return (r.product().principal().toLowerCase().indexOf(token) >= 0);
                                });
                                return new oj.ArrayTableDataSource(product, {idAttribute: 'id'});
                            }
                        });

                        ui.hideBusy();
                        self.ready(true);
                    }
                }
                
                
                function populatePrincipal() {
                    self.suggestions = function (context) {
                        return new Promise(function (fulfill, reject) {
                            var term = context.term;
                            var filteredTags = [];
                            var tags = ko.utils.unwrapObservable(self.uniquePrincipals());
                            if (term) {
                                var keyPattern = new RegExp(term, "i");
                                for (tagIndex in tags) {
                                    if (ko.utils.unwrapObservable(tags[tagIndex]).search(keyPattern) >= 0) {
                                        filteredTags.push(tags[tagIndex]);
                                    }
                                }
                            } else {
                                filteredTags = tags;
                            }

                            var options = [];
                            for (tagIndex in filteredTags) {
                                var item = {
                                    itemLabel: filteredTags[tagIndex],
                                    itemCode: filteredTags[tagIndex]
                                };

                                options.push(item);
                            }
                            var suggest = {
                                groupId: 'groupId',
                                groupName: 'Item Code Suggestions',
                                items: options
                            };
                            if (options.length > 0) {
                                fulfill(suggest);
                            }

                        });
                    };
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
                        self.searchByPrincipal(false);
                        self.searchText(data.value);
                    }
                };

                /* action */
                self.searchPrincipal = function (event, ui) {
                    // ui.value[0] <--- Input Principal 
                    if (ui.option !== "value") {
                        return;
                    }
                    self.searchByPrincipal(true); 
                    self.searchText(ui.value[0]);
                    self.scrollPos(0);
                };

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
                    var procced = false;
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
                    var _cart = app.moduleConfig.params.rootContext.originalQuotationCart;
                    if (!Array.isArray(_cart)) {
                        _cart = ko.utils.unwrapObservable(_cart);
                    }
                    if (typeof _cart === "undefined" || _cart.length == 0) {
                        var tempCart = new Array();
                        tempCart.push(cartItem);
                        app.moduleConfig.params.rootContext.originalQuotationCart = tempCart;
                        procced = true;
                    } else {
                        var foundItem = ko.utils.arrayFirst(_cart, function(item) {
                            if ( ko.utils.unwrapObservable(data.product().id) == ko.utils.unwrapObservable(item.product().id) ) return item;
                        });
                        if (foundItem == null || typeof foundItem === "undefined") {
                            procced = true;
                            app.moduleConfig.params.rootContext.originalQuotationCart.push(cartItem);
                        }
                    }
                    if (procced) {
                        // update the ordered item count
                        self.totalCnt(ko.utils.unwrapObservable(self.totalCnt()) + 1);

                        // UI Effect
                        addToCartUI(data, event);
                    }
                };

                self.checkOut = function (data, event) {
                    // var custId = app.moduleConfig.params.rootContext.custId;
                    console.log("app.moduleConfig.params.rootContext.originalQuotationCart=" + ko.toJSON(app.moduleConfig.params.rootContext.originalQuotationCart));
                    var allowCheckOut = cartService.allowCheckOut(app.moduleConfig.params.rootContext.originalQuotationCart);
                    if (allowCheckOut) {
                        app.moduleConfig.params.rootContext.fromPage = "newQuotationItem";
                        app.redirect("checkOutQuotation", null);
                    } else {
                        ui.showMessageBox(self.lng_noItemCart);
                    }
                };

                self.goBack = function (data, event) {
                    console.log("goBack clicked");
                    var fromPage = app.moduleConfig.params.rootContext.fromPage;
                    if (fromPage === "quotation" || fromPage === "newQuotation" || fromPage === "newQuotationItem") {
                        var custId = app.moduleConfig.params.rootContext.custId;
                        app.redirect("quotation", custId);
                    } else {
                        var quotationId = app.moduleConfig.params.rootContext.quotationId;
                        app.redirect("quotationDetail", quotationId);
                    }
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };

                function initTranslation() {
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_newQuotation = getTranslation("ssa.newQuotationItem.newQuotation");
                    self.lng_itemList = getTranslation("ssa.newQuotationItem.itemList");
                    self.lng_topList = getTranslation("ssa.newQuotationItem.topList");       
                    self.lng_quotationList = getTranslation("ssa.newQuotationItem.quotationList");
                    self.lng_searchPlaceHolderText = getTranslation("ssa.newQuotationItem.searchPlaceHolder");
                    self.lng_addToCart = getTranslation("ssa.newQuotationItem.addToCart");
                    self.lng_added = getTranslation("ssa.newQuotationItem.added");
                    self.lng_principal = getTranslation("ssa.newQuotationItem.principal");
                    self.lng_noItemCart = getTranslation("ssa.msg.info.noItemCart");
                };

                // init();
            };

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

            return new NewQuotationItemViewModel();

        }
);
