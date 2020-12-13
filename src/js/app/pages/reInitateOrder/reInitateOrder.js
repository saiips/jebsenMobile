/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your order ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/reInitateOrder/reInitateOrderService', 'pages/common/cartService', 'util/appui', 'util/commonhelper', 'pages/common/constant',
    'ojs/ojknockout', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'ojs/ojnavigationlist', 'promise', 'ojs/ojtoolbar', 'ojs/ojpulltorefresh', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, service, cartService, ui, helper, constant) {
            var searchCanvas;

            searchCanvas = {
                "selector": "#searchCanvas",
                "edge": "top",
                "displayMode": "push",
                "size": "63px",
                "modality": "modeless",
                "autoDismiss": "none"
            };

            function ReInitateOrderViewModel() {
                var self = this;
                self.router = app.router;

                // constant variables
                var RESPONSE_TABLE = 'OutputGetFailedOrder';

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
                self.handleActivated = function (info) {

                    initTranslations();

                    // reset the searching criteria
                    self.searchText('');
                    self.scrollPos(0);

                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("reInitateOrders.js parentRouter=" + parentRouter.currentState().value);

                    var childRouter = parentRouter.getChildRouter("reInitateOrders");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('reInitateOrders');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    console.log("reInitateOrders.js stateId=" + stateId);
                                }
                            });
                            return state;
                        }
                    });

                    self.headerTitle(self.lng_reInitateOrderList);

                    getAllOrders();

                    self.isOrderDeskAdmin = ko.computed(function () {
                        var user = app.moduleConfig.params.rootContext.userProfile;
                        if (user.salesRole == constant.SR_ADMIN) {
                            return true;
                        }
                        if (!app.moduleConfig.params.rootContext.isCordova) return true;
                        return false;
                    });

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
                self.handleAttached = function (info) {
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

                /*
                 * Optional ViewModel method invoked after the View is removed from the
                 * document DOM.
                 * @param {Object} info - An object with the following key-value pairs:
                 * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
                 * @param {Function} info.valueAccessor - The binding's value accessor.
                 * @param {Array} info.cachedNodes - An Array containing cached nodes for the View if the cache is enabled.
                 */
                self.handleDetached = function (info) {
                    // Implement if needed
                };

                // handler for drill in to customer details
                self.optionChange = function (event, ui) {
                    if (ui.option === 'selection' && ui.value[0]) {
                        //app.pendingAnimationType = 'navChild';
                        // ui.value <--- JsOrderTxnId
                        console.log("reInitateOrders.js orderId=" + ui.value);
                        app.redirect("reInitateOrderDetail", ui.value);
                    }
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };

                self.headerTitle = ko.observable();
                self.outLetId = ko.observable();
                self.allOrders = ko.observableArray();
                self.searchText = ko.observable('');
                self.scrollPos = ko.observable(0);
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
                self.ready = ko.observable(false);

                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });

                self.itemOnly = function (context) {
                    return context['leaf'];
                };

                self.selectTemplate = function (file, bindingContext) {
                    return bindingContext.$itemContext.leaf ? 'item_template' : 'group_template';
                };

                self.refresh = function () {
                    ui.showBusy();
                    pullToRefresh();
                };

                function getPayload() {
                    var user = app.moduleConfig.params.rootContext.userProfile;

                    var payload = JSON.stringify({
                        "InputGetFailedOrder": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            }
                        }
                    });
                    return payload;
                }

                function getAllOrders() {
                    ui.showBusy();
                    self.ready(false);
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            console.log("cbSuccessFn called");
                            ui.hideBusy();
                            getSyncDate();
                            app.moduleConfig.params.rootContext.isReInitateRefresh = false;
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        prepareUI(data, xhr.status);
                        ui.hideBusy();
                        app.moduleConfig.params.rootContext.isReInitateRefresh = false;
                    };

                    var payload = getPayload();
                    console.log("Payload =" + ko.toJS(payload));
                    var refresh = app.moduleConfig.params.rootContext.isReInitateRefresh;
                    if (refresh && typeof refresh !== "undefined") {
                        service.refreshOrderListMessage(payload).then(cbSuccessFn, cbFailFn);
                    } else {
                        service.getOrderListMessage(payload).then(cbSuccessFn, cbFailFn);
                    }
                    self.ready(true);
                }

                function pullToRefresh() {
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            getSyncDate();
                            ui.hideBusy();
                            console.log("cbSuccessFn called");
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        prepareUI(data, xhr.status);
                        ui.hideBusy();
                    };
                    var payload = getPayload();
                    service.refreshOrderListMessage(payload).then(cbSuccessFn, cbFailFn);
                }

                function prepareUI(data, status) {
                    console.log("raw data = " + ko.toJSON(data));
                    data = (Array.isArray(data)) ? data[0] : data;
                    if (data !== null && status == 200) {
                        // clear all
                        self.allOrders.removeAll();

                        var respJSON = data[RESPONSE_TABLE]['TblJsOrderTxn'];
                        var formatted = [];
                        var keys = [];
                        var headerIdMap = {};
                        
                        // handle no result return from SOACS
                        var temp = (Array.isArray(respJSON)) ? respJSON[0] : respJSON;
                        console.log("temp=" + ko.toJSON(temp));
                        if (!temp && temp == null) return;

                        // format data for indexer groups
                        for (var i = 0; i < respJSON.length; i++) {
                            var id = respJSON[i]['JsOrderTxnId'];
                            var orderType = respJSON[i]['OrderType'];
                            var errorMsg = respJSON[i]['ErrorMsg'];
                            var status = respJSON[i]['TxnStatus'];
                            var payload = respJSON[i]['Payload']['InputCreateBeerOrder'];
                            var orderTypeId = payload['I_HEADER_REC']['ORDER_TYPE_ID'];
                            console.log("orderTypeId=" + orderTypeId);

                            var outletName = payload['I_HEADER_REC']['OUTLET_NAME'];
                            var orderDate = respJSON[i]['CreatedDate'];
                            orderDate = helper.formatStrDate(orderDate, "YYYY-MM-DDTHH:mm:ss.SSSZ", "YYYY/MM/DD");
                            var key = orderDate + ":" + outletName;

                            payload['I_HEADER_REC'].ID = id;
                            payload['I_HEADER_REC'].ERROR_MSG = errorMsg;
                            payload['I_HEADER_REC'].HEADER_FLOW_STATUS_CODE = status;
                            if (orderTypeId == constant.ORDER_TYPE_ID_BEER) {
                                payload['I_HEADER_REC'].ORDER_TYPE = "13-C0 STOCK ORDER";
                            } else if (orderTypeId == constant.ORDER_TYPE_ID_WINE) {
                                payload['I_HEADER_REC'].ORDER_TYPE = "13-G0 STOCK ORDER";
                            } else {
                                payload['I_HEADER_REC'].ORDER_TYPE = orderTypeId;
                            }

                            // mapping for payload
                            if (typeof headerIdMap[id] === "undefined") {
                                headerIdMap[id] = respJSON[i];
                            }

                            if (keys.indexOf(key) > -1) {
                                formatted[keys.indexOf(key)].children.push({"attr": {"id": id, "data": respJSON[i]}});
                            } else {
                                keys.push(key);
                                formatted.push({
                                    "attr": {"id": id, "orderDate": orderDate, "outletName": outletName},
                                    "children": [{"attr": {"id": id, "data": respJSON[i]}}]
                                });
                            }
                        }

                        // sort by orderDate
                        formatted.sort(function (a, b) {
                            return (a.attr.orderDate > b.attr.orderDate) ? 1 : (a.attr.orderDate < b.attr.orderDate) ? -1 : 0;
                        });

                        // sort by orderDate then refNo within each group
                        formatted.forEach(function (group) {
                            group.children.sort(function (a, b) {
                                // sort by parent
                                if (a.attr.ORDERED_DATE > b.attr.ORDERED_DATE) {
                                    return 1;
                                } else if (a.attr.ORDERED_DATE < b.attr.ORDERED_DATE) {
                                    return -1;
                                }

                                // else sort by name
                                return (a.attr.ORDER_NUMBER < b.attr.ORDER_NUMBER) ? 1 : (a.attr.ORDER_NUMBER > b.attr.ORDER_NUMBER) ? -1 : 0;
                            });
                        });

                        self.allOrders(formatted);

                        // update the header id map
                        app.moduleConfig.params.rootContext.headerIdMap = headerIdMap;
                    }
                }

                function getSyncDate() {
                    // get the last sync datetime of daily order summary from local storage
                    var key = constant.FAILED_ORDER_LIST_KEY;
                    var data = ui.getLocalStorage(key + ":" + constant.RE_INITATE_ORDER_SYNC_DATETIME);
                    if (data) {
                        self.syncDatetime(data);
                        self.showLastSyncDate(true);
                    }
                }

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_reInitateOrderList = getTranslation("ssa.springboard.reInitiateOrderList");
                    self.lng_searchPlaceHolder = getTranslation("ssa.header.customerSearch");
                    self.lng_lastSyncDate = getTranslation("ssa.header.lastSyncDate");
                    self.lng_orderType = getTranslation("ssa.orderHistory.orderType");
                    self.lng_price = getTranslation("ssa.orderHistory.price");
                    self.lng_order = getTranslation("ssa.orderHistory.order");
                    self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                    self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");
                    self.lng_purchaseOrder = getTranslation("ssa.checkOut.purchaseOrder");
                    self.lng_reason = getTranslation("ssa.orderHistory.reason");
                    self.lng_refNo = getTranslation("ssa.orderHistory.refNo");
                }

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

                // handle pull-to-refresh
                $(document).ready(
                        function ()
                        {
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

                            $('#listview').on({
                                'ojdestroy': function ()
                                {
                                    oj.PullToRefreshUtils.tearDownPullToRefresh('#listviewContainer');
                                }
                            });
                        }
                );

                // filter orders
                self.orders = ko.computed(function () {
                    if (self.searchText() && self.allOrders().length > 0) {
                        var filteredOrders = [];

                        var token = self.searchText().toLowerCase();

                        self.allOrders().forEach(function (node) {
                            node.children.forEach(function (leaf) {
                                if (leaf.attr.data.ORDER_NUMBER.toLowerCase().indexOf(token) >= 0 ||
                                        leaf.attr.data.OUTLET_NAME.toLowerCase().indexOf(token) >= 0 ||
                                        leaf.attr.data.PARENT_NAME.toLowerCase().indexOf(token) >= 0 ||
                                        leaf.attr.data.CUSTOMER_NAME.toLowerCase().indexOf(token) >= 0) {
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
                        if (data.value.length >= 2 || data.value.length == 0) {
                            self.searchText(data.value);
                            self.scrollPos(0);
                        }
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
            return new ReInitateOrderViewModel();
        }
);
