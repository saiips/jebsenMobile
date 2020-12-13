define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/quotation/quotationService', 'util/appui', 'util/commonhelper',
    'pages/common/constant', 'pages/common/cartService', 'ojs/ojrouter', 'ojs/ojtoolbar', 'ojs/ojknockout', 'ojs/ojinputtext',
    'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojnavigationlist', 'promise',
    'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'ojs/ojmodel', 'ojs/ojpagingcontrol', 'ojs/ojpagingcontrol-model',
    'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, service, ui, helper, constant, cartService) {
            var searchCanvas;

            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;

            searchCanvas = {
                "selector": "#searchCanvas",
                "edge": "top",
                "displayMode": "push",
                "size": "63px",
                "modality": "modeless",
                "autoDismiss": "none"
            };

            function QuotationViewModel() {
                var self = this;

                console.log("QuotationViewModel");

                var RESPONSE_TABLE = 'P_QUOTATION_TBL';

                // router
                self.router = app.router;
                self.principleRouter = app.principleRouter;

                self.allQuotation = ko.observableArray([]);
                self.ready = ko.observable(false);

                self.navDataSource = app.navDataSource;
                self.navChangeHandler = app.navChangeHandler;

                self.headerTitle = ko.observable('');
                self.navStateId = ko.observable('');
                self.syncDatetime = ko.observable();
                self.showLastSyncDate = ko.observable(false);

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

                //filters and sort value are stored in local storage. Default for filters is none, and for sort is "datelatest".
                self.searchText = ko.observable('');
                // resolve the slow performance on the search input box
                self.searchText.extend({
                    rateLimit: {
                        timeout: 500,
                        method: "notifyWhenChangesStop"
                    }
                });                

                self.lng_searchPlaceHolder = ko.observable('Input something for searching');
                self.currCustomerId = ko.observable();

                self.handleActivated = function (info) {
                    console.log("quotation handleActivated");
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("quotation.js parentRouter=" + parentRouter.currentState().value);

                    var childRouter = parentRouter.getChildRouter("quotation");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('quotation');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    console.log("quotation stateId=" + stateId);
                                    self.currCustomerId(stateId);
                                }
                            });
                            return state;
                        }
                    });
                    
                    initTranslations();
                    
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
                        self.headerTitle(self.lng_quotationList);
                    }     

                    // set the current state of Navigation Bar (Order, Profile, Visit and Quotation)
                    self.navStateId(app.moduleConfig.params.rootContext.navStateId);
                    
                    
                    return oj.Router.sync();
                };

                self.handleBindingsApplied = function (info) {
                    var appLC = $('#globalBody').find('.oj-hybrid-applayout-content');
                    var APPLAYOUT_SCROLLABLE = 'oj-hybrid-applayout-scrollable';

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

                function getAllQuotations() {
                    console.log("getAllQuotations started");
                    ui.showBusy();
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                            ui.hideBusy();
                        } finally {
                            console.log("cbSuccessFn called");
                            self.ready(true);
                            app.moduleConfig.params.rootContext.requireRefresh = false;
                            ui.hideBusy();
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        prepareUI(data, xhr.status);
                        ui.hideBusy();
                    };
                    
                    if (app.moduleConfig.params.rootContext.requireRefresh) {
                        service.refreshQuotationHistMessage(getPayload()).then(cbSuccessFn, cbFailFn);
                    } else {
                        service.getQuotationHistMessage(getPayload()).then(cbSuccessFn, cbFailFn);
                    }                    
                }

                function prepareUI(data, status) {
                    data = (Array.isArray(data)) ? data[0] : data;
                    if (data !== null && status == 200) {
                        var respJSON = data[RESPONSE_TABLE]['P_QUOTATION_TBL_ITEM'];
                        // debug purpose +
                        if (respJSON == null) {
                            console.log("raw data = " + ko.toJSON(data));
                        }
                        // debug purpose -
                        if (respJSON != null) {
                            if (!Array.isArray(respJSON)) {
                                var temp = new Array();
                                temp.push(respJSON);
                                respJSON = temp;
                            }
                            var formatted = [];
                            var keys = [];
                            var headerIdMap = {};

                            // format data for indexer groups
                            for (var i = 0; i < respJSON.length; i++) {
                                var quotationNumber = respJSON[i]['QUOTATION_NUMBER'];
                                var oeHeaderId = respJSON[i]["OE_HEADER_ID"];
                                
                                // store the quotation header
                                var quotationInfo = cartService.createQuotation(respJSON[i]);
                                
                                // mapping for oe_header_id
                                if (typeof headerIdMap[oeHeaderId] === "undefined") {
                                    headerIdMap[oeHeaderId] = quotationInfo;
                                }                                

                                var quotationDate = respJSON[i]['QUOTATION_DATE'];
                                if (helper.isValid(quotationDate)) {
                                    quotationDate = helper.formatStrDateToYYYYMMDD(quotationDate);
                                    respJSON[i]['QUOTATION_DATE'] = quotationDate;
                                }
                                // -1 means empty remarks 
                                respJSON[i]['REMARKS'] = (respJSON[i]['REMARKS'] == "-1") ? "" : respJSON[i]['REMARKS'];

                                if (keys.indexOf(quotationDate) > -1) {
                                    formatted[keys.indexOf(quotationDate)].children.push({"attr": {"id": oeHeaderId, "data": respJSON[i]}});
                                } else {
                                    keys.push(quotationDate);
                                    formatted.push({
                                        "attr": {"id": oeHeaderId, "quotationDate": quotationDate},
                                        "children": [{"attr": {"id": oeHeaderId, "data": respJSON[i]}}]
                                    });
                                }
                            }

                            // sort by orderDate
                            formatted.sort(function (a, b) {
                                return (a.attr.quotationDate < b.attr.quotationDate) ? 1 : (a.attr.quotationDate > b.attr.quotationDate) ? -1 : 0;
                            });

                            // sort by quotationDate then refNo within each group
                            formatted.forEach(function (group) {
                                group.children.sort(function (a, b) {
                                    // sort by parent
                                    if (a.attr.QUOTATION_DATE < b.attr.QUOTATION_DATE) {
                                        return 1;
                                    } else if (a.attr.QUOTATION_DATE > b.attr.QUOTATION_DATE) {
                                        return -1;
                                    }

                                    // else sort by name
                                    return (a.attr.QUOTATION_NUMBER < b.attr.QUOTATION_NUMBER) ? 1 : (a.attr.QUOTATION_NUMBER > b.attr.QUOTATION_NUMBER) ? -1 : 0;
                                });
                            });

                            self.allQuotation(formatted);
                            
                            // update the header id map
                            app.moduleConfig.params.rootContext.headerIdMap = headerIdMap;
                        }

                        // define the syn datetime
                        var ship2OrgId = ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.selCustomerProfile.billToSiteId);
                        var user = app.moduleConfig.params.rootContext.userProfile;
                        var key = constant.QUOTATION_LIST_KEY + ":" + user.orgUnitId + ":" + ship2OrgId + ":" + constant.QUOTATION_LIST_SYNC_DATETIME;
                        var data = ui.getLocalStorage(key);
                        if (data) {
                            self.syncDatetime(data);
                            self.showLastSyncDate(true);
                        }
                        
                    }
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
                    service.refreshQuotationHistMessage(getPayload()).then(cbSuccessFn, cbFailFn);
                }

                function getPayload() {
                    //billToSiteId is temporary field name, will be changed in future
                    console.log("Customer Profile = " + ko.toJSON(app.moduleConfig.params.rootContext.selCustomerProfile.billToSiteId));
                    var ship2OrgId = ko.utils.unwrapObservable(app.moduleConfig.params.rootContext.selCustomerProfile.billToSiteId);
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    // var ship2OrgId = "302158";

                    var payload = JSON.stringify({
                        "InputGetQuotation": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": orgUnitId,
                            "P_ACCOUNT_NUMBER": "",
                            "P_SHIP_TO_ORG_ID": ship2OrgId
                        }
                    });
                    return payload;
                }

                // filter Quotations
                self.quotations = ko.computed(function () {
                    if (self.searchText() && self.allQuotation().length > 0) {
                        var filteredQuotations = [];
                        var token = self.searchText().toLowerCase();

                        self.allQuotation().forEach(function (node) {
                            node.children.forEach(function (leaf) {
                                if (leaf.attr.data.QUOTATION_NUMBER.toLowerCase().indexOf(token) === 0) {
                                    filteredQuotations.push(leaf);
                                }
                            });
                        });
                        return new oj.JsonTreeDataSource(filteredQuotations);
                    } else {
                        return new oj.JsonTreeDataSource(self.allQuotation());
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
                    console.log("toggleSearchCanvas triggered");
                    oj.OffcanvasUtils.toggle(searchCanvas);
                };

                self.onSearchTextChange = function (event, data) {
                    if (data.option === 'rawValue') {
                        self.searchText(data.value);
                    }
                };

                self.loadQuotationDetailPage = function (quotation) {
                    if (quotation.id) {
                        console.log("loadQuotationDetailPage=" + ko.toJSON(quotation.id));
                        app.redirect("quotationDetail", quotation.id);
                    } else {
                        console.log("loadQuotationDetailPage= Router to Quotation Detail");
                    }
                };

                self.onEnter = function (data, event) {
                    if (event.keyCode === 13) {
                        var quotation = {};
                        quotation.id = data.id;
                        self.loadQuotationDetailPage(quotation);
                    }
                    return true;
                };

                self.changeHandler = function (page, event) {
                    if (event.option === 'selection') {
                        if (event.value[0]) {
                            var quotation = {};
                            quotation.id = event.value[0];
                            self.loadQuotationDetailPage(quotation);
                        }
                    }
                };

                // handler for drill in to quotation details
                self.optionChange = function (event, ui) {
                    if (ui.option === 'currentItem' && ui.value) {
                        // ui.value = quotation id
                        console.log("quotation id = " + ui.value);
                        // get back the headerIdMap
                        var headerIdMap = app.moduleConfig.params.rootContext.headerIdMap;
                        var quotationInfo = headerIdMap[ui.value];
                        // and store it for later display on quotationDetail page
                        cartService.setQuotation(quotationInfo);                        
                        app.redirect("quotationDetail", ui.value);
                    }
                };

                self.add = function (data, event) {
                    var custId = app.moduleConfig.params.rootContext.custId;
                    app.moduleConfig.params.rootContext.originalQuotationCart = ko.observableArray();
                    app.moduleConfig.params.rootContext.fromPage = "quotation";
                    app.moduleConfig.params.rootContext.newQuotationNavStateId = 'newQuotationItem';
                    app.moduleConfig.params.rootContext.isExpressCopy = false;
                    app.moduleConfig.params.rootContext.isCopyQuotation = false;
                    app.moduleConfig.params.rootContext.quotationId = null;
                    app.redirect("newQuotationItem", custId);
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };

                // load Quotations
                self.currCustomerId.subscribe(function (newId) {
                    getAllQuotations(newId);
                });

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_quotationList = getTranslation("ssa.quotation.quotationList");
                    self.lng_date = getTranslation("ssa.quotation.date");
                    self.lng_amount = getTranslation("ssa.quotation.amount");
                    self.lng_uom = getTranslation("ssa.quotation.uom");
                    self.lng_qty = getTranslation("ssa.quotation.qty");
                    self.lng_item = getTranslation("ssa.quotation.totalItem");
                    self.lng_remarks = getTranslation("ssa.quotation.remarks");
                    self.lng_lastSyncDate = getTranslation("ssa.header.lastSyncDate");
                    self.lng_customerName = getTranslation("ssa.quotation.customerName");
                    self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                    self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");                    
                }

                // handle pull-to-refresh
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

            return QuotationViewModel;

        }
);
