define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/data', 'util/appui', 'pages/dailyReceipt/dailyReceiptService', 'pages/common/constant', 'util/commonhelper',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox',
    'ojs/ojlistview', 'ojs/ojmodel', 'ojs/ojpagingcontrol', 'ojs/ojpagingcontrol-model',
    'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
    function (oj, ko, $, app, data, ui, service, constant, commonHelper) {
        var searchCanvas;

        searchCanvas = {
            "selector": "#searchCanvas",
            "edge": "top",
            "displayMode": "push",
            "size": "63px",
            "modality": "modeless",
            "autoDismiss": "none"
        };
        
        function DailyReceiptViewModel() {
            var self = this;
            
            console.log("DailyReceiptViewModel");

            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            //filters and sort value are stored in local storage. Default for filters is none, and for sort is "datelatest".
            self.worklistData = ko.observable();
            self.searchText = ko.observable('');
            // resolve the slow performance on the search input box
            self.searchText.extend({
                rateLimit: {
                    timeout: 500,
                    method: "notifyWhenChangesStop"
                }
            });            
            self.searchValueComplete = ko.observable('');
            
            self.handleActivated = function (info) {
                var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                console.log("dailyReceipt.js parentRouter=" + parentRouter.currentState().value);

                var childRouter = parentRouter.getChildRouter("dailyReceipt");
                if (!childRouter) {
                    childRouter = parentRouter.createChildRouter('dailyReceipt');
                }
                self.router = childRouter.configure(function (stateId) {
                    if (stateId) {
                        var state = new oj.RouterState(stateId, {value: stateId,
                            enter: function () {
                                console.log("dailyReceipt.js stateId=" + stateId);
                            }
                        });
                        return state;
                    }
                });                
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
            
            function init() {
                console.log("dailyReceipt.js init() started");
                // check network;
                var isOnline = app.moduleConfig.params.rootContext.isOnline;
                if (!isOnline) {
                    ui.showMessageBox(self.lng_error_00005);
                    return;
                }
                ui.showBusy();
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
                };
                var payload = preparePayload();
                console.log("daily receipt summary payload = " + ko.toJS(payload));
                service.getDailyReceiptMessage(payload).then(cbSuccessFn, cbFailFn);
            }

            function prepareUI(data, status) {
                console.log("raw data = " + ko.toJSON(data));
                data = (Array.isArray(data)) ? data[0] : data;
                if (data !== null && status == 200) {
                    var index = 0;
                    var dailyReceiptFilter = ko.observableArray([]);
                    var respJSON = data['OutputGetVanOrderSummary'];
                    ko.utils.arrayMap(respJSON, function (item) {
                        var date  = commonHelper.formatStrDate(item.OrderDate, "YYYY-MM-DDTHH:mm:ssZ", "YYYY/MM/DD");
                        if (commonHelper.isDateFormat(date, "YYYY/MM/DD")) {
                            var chequeAmount = item.TotalChequeAmount;
                            var cashAmount = item.TotalCashAmount;
                            var othersAmount = item.TotalOthersAmount;
                            dailyReceiptFilter.push(ko.toJS({"id": index, "date": date, "chequeAmount": chequeAmount, "cashAmount": cashAmount, "othersAmount": othersAmount}));
                            index ++;
                        }
                    });
                    self.worklistData(new oj.ArrayTableDataSource(dailyReceiptFilter, {idAttribute: 'id'}));
                }
            }
            
            self.goBack = function () {
                app.router.go('springboard');
            };

            self.dispose = function (info) {
                self.router.dispose();
            };
            
            function initTranslations() {
                // language translations
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_searchPlaceHolder = getTranslation("ssa.header.search");
                self.lng_dailyReceiptSummary = getTranslation("ssa.dailyReceipt.dailyReceiptSummary");
                self.lng_date = getTranslation("ssa.dailyReceipt.date");
                self.lng_chequeAmount = getTranslation("ssa.dailyReceipt.chequeAmount");
                self.lng_cashAmount = getTranslation("ssa.dailyReceipt.cashAmount");
                self.lng_byCheque = getTranslation("ssa.dailyReceipt.byCheque");
                self.lng_byCash = getTranslation("ssa.dailyReceipt.byCash");
                self.lng_byOthers = getTranslation("ssa.dailyReceipt.byOthers");
                self.lng_error_00005 = getTranslation("ssa.msg.error.ERROR_00005");
            }
            
            function preparePayload() {
                var user = app.moduleConfig.params.rootContext.userProfile;
                var dateFrom = commonHelper.getClientDays(-7, "YYYY-MM-DDTHH:mm:ssZ");
                var dateTo = commonHelper.getClientCurrentDate("YYYY-MM-DDTHH:mm:ssZ");
                var payload = JSON.stringify({
                        "InputGetVanOrderSummary": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "DateFrom": dateFrom,
                            "DateTo": dateTo
                        }             
                });
                return payload;                
            }
            
            initTranslations();
            init();
        }
        
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
        
        return DailyReceiptViewModel;
    }
);