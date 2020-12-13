/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your customer ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/customer/customerService', 'util/appui', 'pages/common/constant',
    'ojs/ojknockout', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'hammerjs', 'ojs/ojjquery-hammer',
    'ojs/ojrouter', 'ojs/ojtoolbar', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber',
    'ojs/ojmodel', 'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, service, ui, constant) {
            var searchCanvas;

            searchCanvas = {
                "selector": "#searchCanvas",
                "edge": "top",
                "displayMode": "push",
                "size": "63px",
                "modality": "modeless",
                "autoDismiss": "none"
            };

            function CustomerListViewModel() {
                var self = this;

                // constant variables
                var RESPONSE_TABLE = 'P_CUSTOMER_TBL_ITEM';

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
                    // Implement if needed
                    // self.showBusy(true);
                    initTranslation();
                    self.scrollPos(0);
                    
                    self.isOrderDeskAdmin = ko.computed(function () {
                        var user = app.moduleConfig.params.rootContext.userProfile;
                        if (user.salesRole == constant.SR_ADMIN) {
                            return true;
                        }
                        if (!app.moduleConfig.params.rootContext.isCordova) return true;
                        return false;
                    });                     

                    // Since this page is an instance. we need to refresh the page after inital load
                    var isUserChanged = app.moduleConfig.params.rootContext.isUserChanged;
                    var isRequireRefresh = app.moduleConfig.params.rootContext.refreshCustomerList;
                    if (typeof isRequireRefresh === "undefined") isRequireRefresh = true;
                    var isCordova = app.moduleConfig.params.rootContext.isCordova;
                    console.log("isUserChanged=" + isUserChanged);
                    console.log("isRequiredRefresh=" + isRequireRefresh);                    
                    if (isRequireRefresh || isUserChanged) {
                        self.ready(false);
                        if (isCordova || self.isOrderDeskAdmin()) {
                            init();
                        } else {
                            ui.showBusy();
                            pullToRefresh();
                        }
                        app.moduleConfig.params.rootContext.refreshCustomerList = false;
                        app.moduleConfig.params.rootContext.isUserChanged = false;
                        self.ready(true);
                    }
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
                    // reset the searching criteria
                    // self.showBusy(false);
                    self.clearSearch();
                    self.searchText('');
                };

                self.ready = ko.observable(false);
                self.allCustomers = ko.observableArray();
                // self.showBusy = ko.observable(true);
                self.scrollPos = ko.observable(0);

                //filters and sort value are stored in local storage. Default for filters is none, and for sort is "datelatest".
                // self.worklistData = ko.observable();
                self.searchText = ko.observable('');

                // resolve the slow performance on the search input box
                self.searchText.extend({
                    rateLimit: {
                        timeout: 1200,
                        method: "notifyWhenChangesStop"
                    }
                });

                self.searchValueComplete = ko.observable('');

                self.syncDatetime = ko.observable();
                self.showLastSyncDate = ko.observable(false);

                function getPayload() {
                    var isCordova = app.moduleConfig.params.rootContext.isCordova;
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    var erpSalesId = app.moduleConfig.params.rootContext.userProfile.erpSalesId;
                    // var selOrgUnitId = app.moduleConfig.params.rootContext.selOrgUnitId;
                    if (!isCordova && user.salesRole === constant.SR_ADMIN) {
                        // orgUnitId = selOrgUnitId;
                        erpSalesId = null;
                    }
                    var payload = JSON.stringify({
                        "InputGetCustomers": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": ko.utils.unwrapObservable(orgUnitId),
                            "P_SALESREP_ID": erpSalesId
                        }
                    });
                    return payload;
                }

                function init() {
                    console.log("customerList.js init() started");
                    ui.showBusy();

                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            console.log("cbSuccessFn called");
                            ui.hideBusy();
                            self.ready(true);
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            ui.hideBusy();
                            self.ready(true);
                        }
                    };
                    var payload = getPayload();
                    console.log("Customer List Payload = " + ko.toJS(payload));
                    service.getCustomerListMessage(payload).then(cbSuccessFn, cbFailFn);
                }

                function pullToRefresh() {
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            console.log("cbSuccessFn called");
                            ui.hideBusy();
                            self.ready(true);
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            ui.hideBusy();
                            self.ready(true);
                        }                        
                    };
                    service.refreshCustomerListMessage(getPayload()).then(cbSuccessFn, cbFailFn);
                }

                function prepareUI(data, status) {
                    // console.log("raw data = " + ko.toJSON(data));
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    var erpSalesId = app.moduleConfig.params.rootContext.userProfile.erpSalesId;
                    data = (Array.isArray(data)) ? data[0] : data;
                    if (data !== null && status == 200) {
                        var respJSON = data[RESPONSE_TABLE];
                        var dataLength = respJSON.length;
                        console.log("customer list =" + dataLength);

                        // construct the ID
                        for (var i = 0; i < dataLength; i++) {
                            respJSON[i].id = respJSON[i].CUST_ACCOUNT_ID + ":" + respJSON[i].SHIP_TO_SITE_ID + ":" + respJSON[i].BILL_TO_SITE_ID;
                        }

                        self.allCustomers(respJSON);

                        var key = constant.CUSTOMER_LIST_KEY + ":" + orgUnitId + ":" +
                                erpSalesId + ":" + constant.CUSTOMERS_SYNC_DATETIME;
                        var data = ui.getLocalStorage(key);
                        if (data) {
                            self.syncDatetime(data);
                            self.showLastSyncDate(true);
                        }
                    }
                }

                // filter customers
                self.customers = ko.computed(function () {
                    // if (self.showBusy()) ui.showBusy();
                    if (self.searchText() && self.allCustomers().length > 0) {
                        var token = self.searchText().toLowerCase();
                        var filteredCustomers = ko.utils.arrayFilter(self.allCustomers(), function (data) {
                            return (data.COMPANY_NAME.toLowerCase().indexOf(token) >= 0 ||
                                    data.OUTLET_NAME.toLowerCase().indexOf(token) >= 0 ||
                                    data.ACCOUNT_NUMBER.toLowerCase().indexOf(token) >= 0 ||
                                    data.PARENT_NAME.toLowerCase().indexOf(token) >= 0 ||
                                    data.SHIP_TO_ADDRESS.toLowerCase().indexOf(token) >= 0 ||
                                    data.SHIP_TO_DISTRICT.toLowerCase().indexOf(token) >= 0);
                        });
                        // if (self.showBusy()) ui.hideBusy();
                        return new oj.ArrayTableDataSource(filteredCustomers, {idAttribute: 'id'});
                    } else {
                        // if (self.showBusy()) ui.hideBusy();
                        return new oj.ArrayTableDataSource(self.allCustomers(),{idAttribute: 'id'});
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

                self.goBack = function () {
                    var fromPage = app.moduleConfig.params.rootContext.fromPage;
                    if (fromPage == "visitationList") {
                        app.go("visitation");
                    } else {
                        app.go("springboard");
                    }
                };

                // handler for drill in to customer details
                self.optionChange = function (event, ui) {
                    if (ui.option === 'selection' && ui.value[0]) {
                        // app.pendingAnimationType = 'navChild';
                        // ui.value[0] <------- CUST_ACCOUNT_ID + ":" + SHIP_TO_SITE_ID + ":" + BILL_TO_SITE_ID
                        // var token = ui.value[0].split(":");
                        // var custId = token[0];
                        // var shipToId = token[1];
                        // var billToId = token[2];
                        console.log("ui.value[0] =" + ko.toJSON(ui.value[0]));
                        var customerProfile = createCustomerProfile(ui.value[0]);
                        console.log("customerProfile = " + ko.toJSON(customerProfile));

                        // store the selected customer profile
                        app.moduleConfig.params.rootContext.selCustomerProfile = customerProfile;

                        var shipToSiteId = ko.utils.unwrapObservable(customerProfile.shipToSiteId);
                        console.log("shipToSiteId = " + ko.toJSON(shipToSiteId));
                        var billToSiteId = ko.utils.unwrapObservable(customerProfile.billToSiteId);
                        console.log("billToSiteId = " + ko.toJSON(billToSiteId));

                        // init the context for the selected customer
                        app.moduleConfig.params.rootContext.outLetId = shipToSiteId;
                        app.moduleConfig.params.rootContext.custId = ko.utils.unwrapObservable(customerProfile.id);
                        console.log("stored custid = " + app.moduleConfig.params.rootContext.custId);

                        // clear the shopping cart
                        app.moduleConfig.params.rootContext.originalCart = ko.observableArray([]);
                        // clear the quotation shopping cart
                        app.moduleConfig.params.rootContext.originalQuotationCart = ko.observableArray([]);
                        // new visitation or order history list
                        if (app.moduleConfig.params.rootContext.isNewVisitation) {
                            app.moduleConfig.params.rootContext.navStateId = 'newVisitation';
                            app.redirect("newVisitation", app.moduleConfig.params.rootContext.custId);
                        } else {
                            app.moduleConfig.params.rootContext.navStateId = 'orderHist';
                            app.redirect("orderHist", shipToSiteId);
                        }
                    }
                };
                
                self.refresh = function() {
                    ui.showBusy();
                    pullToRefresh();
                };

                function createCustomerProfile(custId) {
                    var selCustomer;

                    var selCustomer = ko.utils.arrayFirst(self.allCustomers(), function (data) {
                        return data.id == custId;
                    });

                    selCustomer = service.createCustomerProfile(selCustomer);

                    return selCustomer;
                }

                function initTranslation() {
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_searchPlaceHolder = getTranslation("ssa.header.customerSearch");
                    self.lng_lastSyncDate = getTranslation("ssa.header.lastSyncDate");
                    self.lng_customer = getTranslation("ssa.customerList.customer");
                    self.lng_customerNo = getTranslation("ssa.customerList.customerNo");
                    self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                    self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");
                }

                // init();


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

                $(document).ready(
                        function ()
                        {
                            oj.PullToRefreshUtils.setupPullToRefresh('#listviewContainer', function ()
                            {
                                console.log(">>>>>>>>>>>>>> setupPullToRefresh");
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
                                    console.log(">>>>>>>>>>>>>> ojdestroy");
                                    oj.PullToRefreshUtils.tearDownPullToRefresh('#listviewContainer');
                                }
                            });
                        }
                );

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
            return new CustomerListViewModel();
        }
);
