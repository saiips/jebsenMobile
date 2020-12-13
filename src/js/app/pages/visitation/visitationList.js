/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your visitation ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/visitation/visitationService', 'util/appui', 'pages/common/constant', 'util/commonhelper',
    'ojs/ojknockout', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'hammerjs', 'ojs/ojjquery-hammer', 'ojs/ojswipetoreveal',
    'ojs/ojrouter', 'ojs/ojtoolbar', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojdatacollection-common',  'ojs/ojmenu',
    'ojs/ojmodel', 'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, service, ui, constant, commonHelper) {
            var searchCanvas;

            searchCanvas = {
                "selector": "#searchCanvas",
                "edge": "top",
                "displayMode": "push",
                "size": "63px",
                "modality": "modeless",
                "autoDismiss": "none"
            };

            function VisitationListViewModel() {
                var self = this;

                // constant variables
                var RESPONSE_TABLE = 'outputGetVisitation';

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
                    self.showBusy(true);
                    initTranslation();
                    self.scrollPos(0);
                    app.moduleConfig.params.rootContext.isNewVisitation = false;
                    
                    // Since this page is an instance. we need to refresh the page after inital load
                    var isRequireRefresh = app.moduleConfig.params.rootContext.isRefreshVisitation;
                    if (isRequireRefresh) {
                        self.ready(false);
                        pullToRefresh();
                        app.moduleConfig.params.rootContext.isRefreshVisitation = false;
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
                    self.showBusy(false);
                    self.clearSearch();
                    self.searchText('');
                };

                self.ready = ko.observable(false);
                self.allVisitations = ko.observableArray();
                self.showBusy = ko.observable(true);
                self.scrollPos = ko.observable(0);
                
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
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var dateFrom = commonHelper.getClientDays(-7, "YYYY-MM-DDTHH:mm:ssZ");
                    var dateTo = commonHelper.getClientDays(7, "YYYY-MM-DDTHH:mm:ssZ");
                    // var dateFrom = commonHelper.getClientCurrentDate("YYYY-MM-DDTHH:mm:ssZ");                    
                    // var dateTo = commonHelper.getClientDays(7, "YYYY-MM-DDTHH:mm:ssZ");
                    
                    var payload = JSON.stringify({
                        "InputGetVisitation": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": user.orgUnitId,
                            "P_SALESREP_ID": user.erpSalesId,
                            "START_DATE": dateFrom,
                            "END_DATE": dateTo
                        }
                    });
                    return payload;
                }
                
                function prepareUpdatePayload(data) {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var payload = JSON.stringify({
                        "InputUpdateVisitation": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "VISITATION_ID": data.VISITATION_ID,
                            "DESCRIPTION": data.DESCRIPTION,
                            "STATUS": data.STATUS
                        }
                    });
                    return payload;
                }

                function init() {
                    console.log("visitationList.js init() started");
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
                        prepareUI(data, xhr.status);
                        ui.hideBusy();
                        self.ready(true);
                    };
                    
                    var payload = getPayload();
                    console.log("payload = " + ko.toJS(payload));
                    service.getVisitationListMessage(payload).then(cbSuccessFn, cbFailFn);
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
                        prepareUI(data, xhr.status);
                        ui.hideBusy();
                        self.ready(true);                        
                    };
                    
                    var payload = getPayload();
                    console.log("payload = " + ko.toJS(payload));                    
                    service.refreshVisitationListMessage(payload).then(cbSuccessFn, cbFailFn);
                }

                function prepareUI(data, status) {
                    console.log("raw data = " + ko.toJSON(data));
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    var erpSalesId = app.moduleConfig.params.rootContext.userProfile.erpSalesId;
                    data = (Array.isArray(data)) ? data[0] : data;
                    if (data !== null && status == 200 && data != {}) {
                        var formatted = [];
                        var keys = [];
                        var respJSON = data[RESPONSE_TABLE];
                        if (respJSON) {
                            var dataLength = respJSON.length;
                            console.log("visitation list =" + dataLength);

                            // construct the ID
                            for (var i = 0; i < dataLength; i++) {
                                // event key
                                var id = respJSON[i].ACTIVITY_ID;
                                respJSON[i].id = id;
                                
                                // event start date
                                var startDate = moment(respJSON[i].START_DATE).format('YYYY/MM/DD').toUpperCase();
                                var startTime = moment(respJSON[i].START_DATE).format('YYYYMMDDHHmm').toUpperCase();
                                
                                // event status
                                if (respJSON[i].STATUS == "NOT_STARTED") {
                                    respJSON[i].STATUS_DESC = "NOT STARTED";
                                } else if (respJSON[i].STATUS == "FOLLOW_UP") {
                                    respJSON[i].STATUS_DESC = "FOLLOW-UP";
                                } else {
                                    respJSON[i].STATUS_DESC = respJSON[i].STATUS;
                                }
                    
                                // added to the formatted array
                                if (keys.indexOf(startDate) > -1) {
                                    formatted[keys.indexOf(startDate)].children.push({"attr": {"id": id, "data": respJSON[i]}});
                                } else {
                                    keys.push(startDate);
                                    formatted.push({
                                        "attr": {"id": id, "startDate": startDate, "startTime": startTime},
                                        "children": [{"attr": {"id": id, "data": respJSON[i]}}]
                                    });
                                }                                
                            }
                            
                            // sort by startDate
                            formatted.sort(function (a, b) {
                                return (b.attr.startDate < a.attr.startDate) ? 1 : (b.attr.startDate > a.attr.startDate) ? -1 : 0;
                            });                            
                            // self.allVisitations(respJSON);
                            console.log("formatted=" + ko.toJSON(formatted));
                            self.allVisitations(formatted);
                        }

                        var key = constant.VISITATION_LIST_KEY + ":" + orgUnitId + ":" + erpSalesId + ":" + constant.VISITATIONS_SYNC_DATETIME;
                        var data = ui.getLocalStorage(key);
                        if (data) {
                            self.syncDatetime(data);
                            self.showLastSyncDate(true);
                        }
                    }
                }

                // filter visitations
                self.visitations = ko.computed(function () {
                    if (self.searchText() && self.allVisitations().length > 0) {
                        var token = self.searchText().toLowerCase();
                        var filteredVisitations = [];
                         
                        self.allVisitations().forEach(function (node) {
                            node.children.forEach(function (leaf) {
                                if (leaf.attr.data.SUBJECT.toLowerCase().indexOf(token) >= 0 ||
                                    leaf.attr.data.PURPOSE.toLowerCase().indexOf(token) >= 0 ||
                                    leaf.attr.data.OUTLET_NAME.toLowerCase().indexOf(token) >= 0 ||
                                    leaf.attr.data.LOCATION.toLowerCase().indexOf(token) >= 0 ||
                                    leaf.attr.data.DESCRIPTION.toLowerCase().indexOf(token) >= 0 ||
                                    leaf.attr.data.STATUS.toLowerCase().indexOf(token) >= 0) {
                                    filteredVisitations.push(leaf);
                                }
                            });
                        });                        

                        // return new oj.ArrayTableDataSource(filteredVisitations, {idAttribute: 'id'});
                        return new oj.JsonTreeDataSource(filteredVisitations);
                    } else {
                        // return new oj.ArrayTableDataSource(self.allVisitations(),{idAttribute: 'id'});
                        return new oj.JsonTreeDataSource(self.allVisitations());
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

                // handler for drill in to visitation details
                self.optionChange = function (event, ui) {
                    if (ui.option === 'selection' && ui.value[0]) {
                        console.log("ui.value[0] =" + ko.toJSON(ui.value[0]));
                        // app.redirect("visitationDetail", ui.value[0]);
                    }
                };
                
                self.clickOptionChange = function(data, event, ui) {
                    console.log("clickOptionChange trigger");
                    console.log("data = " + ko.toJSON(data));
                    
                    app.moduleConfig.params.rootContext.selVisitation = data.data;
                    
                    // data.id == ACTIVITY_ID
                    app.redirect("visitationDetail", data.id);
                }
                
                self.addVisitation = function (event, ui) {
                    console.log("add visitation");
                    app.moduleConfig.params.rootContext.fromPage = "visitationList";
                    app.moduleConfig.params.rootContext.isNewVisitation = true;
                    app.go("customer");
                };
                
                function initTranslation() {
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_searchPlaceHolder = getTranslation("ssa.header.customerSearch");
                    self.lng_lastSyncDate = getTranslation("ssa.header.lastSyncDate");
                    self.lng_visitation = getTranslation("ssa.visitationList.visitation");
                    self.lng_purpose = getTranslation("ssa.visitationList.purpose");
                    self.lng_start = getTranslation("ssa.visitationList.start");
                    self.lng_end = getTranslation("ssa.visitationList.end");
                    self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                    self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");                    
                }

                init();
                
                // handle swipe event +
                self.handleReady = function()
                {
                    // register swipe to reveal for all new list items
                    $("#listview").find(".item-marker").each(function(index)
                    {
                        var item = $(this);
                        var id = item.prop("id");
                        var startOffcanvas = item.find(".oj-offcanvas-start").first();
                        var endOffcanvas = item.find(".oj-offcanvas-end").first();     

                        // setup swipe actions               
                        oj.SwipeToRevealUtils.setupSwipeActions(startOffcanvas);
                        oj.SwipeToRevealUtils.setupSwipeActions(endOffcanvas);

                        // make sure listener only registered once
                        endOffcanvas.off("ojdefaultaction");
                        endOffcanvas.on("ojdefaultaction", function() 
                        {
                            self.handleDefaultAction(item);
                        });
                    });
                };          
                
                self.handleDestroy = function ()
                {
                    // register swipe to reveal for all new list items
                    $("#listview").find(".item-marker").each(function (index)
                    {
                        var startOffcanvas = $(this).find(".oj-offcanvas-start").first();
                        var endOffcanvas = $(this).find(".oj-offcanvas-end").first();

                        oj.SwipeToRevealUtils.tearDownSwipeActions(startOffcanvas);
                        oj.SwipeToRevealUtils.tearDownSwipeActions(endOffcanvas);
                    });
                };

                self.handleMenuBeforeOpen = function (event, ui)
                {
                    var target = event.originalEvent.target;
                    var context = $("#listview").ojListView("getContextByNode", target);
                    if (context != null)
                    {
                        self.currentItem = $("#" + context['key']);
                    } else
                    {
                        self.currentItem = null;
                    }
                };

                self.handleMenuItemSelect = function (event, ui)
                {
                    var id = ui.item.prop("id");
                    console.log("id = " + id);
                    if (id == "cancel")
                        self.handleCancel();
                    else if (id == "complete" || id == "default")
                        self.handleComplete();
                    else if (id == "delete")
                        self.handleDelete();
                    else if (id == "follow") 
                        self.handleFollow();
                };

                self.closeToolbar = function (which, item)
                {
                    var toolbarId = "#" + which + "_toolbar_" + item.prop("id");
                    var drawer = {"displayMode": "push", "selector": toolbarId};

                    oj.OffcanvasUtils.close(drawer);
                };

                self.handleAction = function (which, action, event)
                {
                    if (event != null)
                    {
                        self.currentItem = $(event.target).closest(".item-marker");

                        // offcanvas won't be open for default action case
                        if (action != "default")
                            self.closeToolbar(which, self.currentItem);
                    }

                    if (self.currentItem != null) {
                        console.log("Handle " + action + " action on: " + self.currentItem.prop("id"));
                        var data = {};
                        // logic to handle the action
                        if (action == "cancel") {
                            data = {"VISITATION_ID": self.currentItem.prop("id"), "DESCRIPTION": "", "STATUS": "CANCEL"};
                        } else if (action == "follow") {
                            data = {"VISITATION_ID": self.currentItem.prop("id"), "DESCRIPTION": "", "STATUS": "FOLLOW_UP"};
                        } else if (action == "complete" || action == "default") {
                            data = {"VISITATION_ID": self.currentItem.prop("id"), "DESCRIPTION": "", "STATUS": "COMPLETE"};
                        }
                        var payload = prepareUpdatePayload(data);
                        console.log("payload = " + ko.toJS(payload));
                    }
                };

                this.handleRead = function (data, event)
                {
                    self.handleAction("first", "read", event);
                };

                this.handleCancel = function (data, event)
                {
                    self.handleAction("second", "cancel", event);
                };
                
                this.handleFollow = function (data, event)
                {
                    self.handleAction("second", "follow", event);
                };                

                this.handleComplete = function (data, event)
                {
                    self.handleAction("second", "complete", event);
                };

                this.handleDelete = function (data, event)
                {
                    self.handleAction("second", "delete", event);
                    self.remove(self.currentItem);
                };
                
                this.handleDefaultAction = function (item)
                {
                    self.currentItem = item;
                    self.handleAction("second", "default");
                    // self.remove(item);
                };

                this.remove = function (item)
                {
                    // unregister swipe to reveal for removed item
                    var startOffcanvas = item.find(".oj-offcanvas-start").first();
                    var endOffcanvas = item.find(".oj-offcanvas-end").first();

                    oj.SwipeToRevealUtils.tearDownSwipeActions(startOffcanvas);
                    oj.SwipeToRevealUtils.tearDownSwipeActions(endOffcanvas);

                    self.allVisitations.remove(function (current)
                    {
                        return (current.id == item.prop("id"));
                    });
                };   
                // handle swipe event - 

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
            return new VisitationListViewModel();
        }
);
