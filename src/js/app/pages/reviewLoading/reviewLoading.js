define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/appui', 'pages/reviewLoading/reviewLoadingService', 'pages/common/constant', 'util/commonhelper', 'pages/common/maintenance',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojdatetimepicker',
    'ojs/ojlistview', 'ojs/ojmodel', 'ojs/ojpagingcontrol', 'ojs/ojpagingcontrol-model','ojs/ojdialog', 'ojs/ojnavigationlist',
    'ojs/ojtable', 'ojs/ojdatacollection-utils', 'ojs/ojarraytabledatasource', 'ojs/ojdatasource-common', 'promise', 'ojs/ojrowexpander', 'ojs/ojflattenedtreedatagriddatasource', 'ojs/ojjsontreedatasource',
    'ojs/ojvalidation', 'ojs/ojoffcanvas', 'ojs/ojpopup'],
    function (oj, ko, $, app, ui, service, constant, commonHelper, maintenance) {
        var searchCanvas;

        searchCanvas = {
            "selector": "#searchCanvas",
            "edge": "top",
            "displayMode": "push",
            "size": "63px",
            "modality": "modeless",
            "autoDismiss": "none"
        };
        
        function ReviewLoadingViewModel() {
            var self = this;
            
            console.log("ReviewLoadingViewModel");
            
            var RESPONSE_TABLE = "OutputUpdateReadDNRMAIntf";
            
            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            self.fromDate = ko.observable();
            self.toDate = ko.observable();
            self.documentNo = ko.observable();
            self.orderNo = ko.observable();
            self.customerNo = ko.observable();
            self.customerName = ko.observable();
            self.shipAddress = ko.observable();
            self.isFocused = ko.observable(false);
            self.allLoaded = ko.observableArray();
            self.scrollPos = ko.observable(0);
            self.searchText = ko.observable('');
            self.selectedAll = ko.observableArray([]);
            
            // detail fields
            self.CUSTOMER_NO = ko.observable();
            self.CUSTOMER_NAME = ko.observable();
            self.SHIP_TO_ADDRESS_LINE_1 = ko.observable();
            self.SALES_ORDER_NO  = ko.observable();
            // 
            self.DOCUMENT_NO = ko.observable();
            self.DOCUMENT_DATE = ko.observable();
            self.SHIP_TO_ADDRESS_LINE_2 = ko.observable();
            self.SHIP_TO_ADDRESS_LINE_3 = ko.observable();
            self.CURRENCY = ko.observable();
            self.LINE_NO = ko.observable();
            self.PRODUCT_NO = ko.observable();
            self.DELIVERY_QUANTITY = ko.observable();
            self.RECEIVE_QUANTITY = ko.observable();
            self.UNIT_PRICE = ko.observable();
            self.TOTAL_AMOUNT = ko.observable();
            self.DEPOSIT_PRODUCT_NO = ko.observable();
            self.DEPOSIT_UNIT_PRICE = ko.observable();
            self.DEPOSIT_TOTAL_AMOUNT = ko.observable();
            
            // resolve the slow performance on the search input box
            self.searchText.extend({
                rateLimit: {
                    timeout: 500,
                    method: "notifyWhenChangesStop"
                }
            }); 
            
            // self.dataFormat = ko.observable("yyyy/MM/dd");
            self.dataFormat = ko.observable("dd/MM/yyyy");
            var dateConverterFactory = oj.Validation.converterFactory("datetime");
            self.dateConverter = dateConverterFactory.createConverter({
                pattern: self.dataFormat()
            });
            
            self.isLindeAdmin =  ko.computed(function() {
                var user = app.moduleConfig.params.rootContext.userProfile;
                if (user.salesRole == constant.SR_AMIN_LINDE) {
                    return true;
                }
                return false;
            });
            
            self.sumOriginalDelivery = ko.computed(function () {
                var sum = 0;
                self.allLoaded().forEach(function (i) {
                    sum = sum + new Number(ko.utils.unwrapObservable(i.DELIVERY_QUANTITY));
                });
                return sum;
            });
            self.sumOutWarehouse = ko.computed(function() {
                var sum = 0;
                self.allLoaded().forEach(function (i) {
                    sum = sum + new Number(ko.utils.unwrapObservable(i.OUT_WAREHOUSE));
                });
                return sum;                
            });
            self.sumPickup = ko.computed(function() {
                var sum = 0;
                self.allLoaded().forEach(function (i) {
                    sum = sum + new Number(ko.utils.unwrapObservable(i.QUANTITY_RECEIVED));
                });
                return sum;                
            });
            self.sumDelivery = ko.computed(function() {
                var sum = 0;
                self.allLoaded().forEach(function (i) {
                    sum = sum + new Number(ko.utils.unwrapObservable(i.QUANTITY_SHIPPED));
                });
                return sum;                
            });
            
            self.fromDate.subscribe(function (newDate) {
                // var toDate = moment(newDate, "YYYY-MM-DDTHH:mm:ss").add(60, "days").format("YYYY-MM-DDTHH:mm:ss")
                var toDate = moment(newDate, "YYYY-MM-DDTHH:mm:ss").add(1, "M").format("YYYY-MM-DDTHH:mm:ss")
                self.toDate(toDate);
            });
           
            self.handleActivated = function (info) {
                var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                console.log("reviewLoading.js parentRouter=" + parentRouter.currentState().value);
                self.scrollPos(0);
                
                var childRouter = parentRouter.getChildRouter("reviewLoading");
                if (!childRouter) {
                    childRouter = parentRouter.createChildRouter('reviewLoading');
                }      
                self.router = childRouter.configure(function (stateId) {
                    if (stateId) {
                        var state = new oj.RouterState(stateId, {value: stateId,
                            enter: function () {
                                console.log("reviewLoading.js stateId=" + stateId);
                            }
                        });
                        return state;
                    }
                });   
                
                init();

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
                console.log("reviewLoading init(): started");
                initTranslations();
                getDefaultCriteria();
                // reset
                self.allLoaded.removeAll();
            }
            
            function getDefaultCriteria() {
                // var fromDate = commonHelper.getClientDays(-60, "YYYY-MM-DD");
                var fromDate = moment().add(-1, "M").format("YYYY-MM-DD");
                var toDate = commonHelper.getClientCurrentDate("YYYY-MM-DD");
                self.fromDate(fromDate);
                self.toDate(toDate);
                self.documentNo(null);
                self.orderNo(null);
                self.customerNo(null);
                self.customerName(null);
            }

            self.maxDate = ko.computed(function () {
                // var date = moment(self.fromDate(), "YYYY-MM-DD").add(60, "days").format("YYYY-MM-DDTHH:mm:ss");
                var date = moment(self.fromDate(), "YYYY-MM-DD").add(1, "M").format("YYYY-MM-DDTHH:mm:ss");
                if (date < self.toDate()) {
                    return self.toDate();
                }
                return date;
            });            
            
//            function beforeRowEditEndListener(event, data)
//            {
//                var rowIdx = data.rowContext.status.rowIndex;
//                console.log("rowIdx = " + rowIdx);
//                return oj.DataCollectionEditUtils.basicHandleRowEditEnd(event, data);
//            }

//            function beforeCurrentRowListener(event, ui) {
//                if (ui) {
//                    var rowIdx = ui.currentRow.rowIndex;
//                    console.log("row index =" + rowIdx);
//                    
//                    var rowKey = ui.currentRow.rowKey;
//                    console.log("row id=" + rowKey);
//                    
//                    // var data = self.allLoaded()[rowIdx];
//                    // console.log("row data = " + ko.toJSON(data));
//                }
//            }
            
            self.openDetail = function(data, event, ui) {
                if (data) {
                     console.log("data = " + ko.toJSON(data));
                    self.DOCUMENT_NO(data.DOCUMENT_NO);
                    self.DOCUMENT_DATE(data.DOCUMENT_DATE);
                    self.CUSTOMER_NO(data.CUSTOMER_NO);
                    self.CUSTOMER_NAME(data.CUSTOMER_NAME);
                    self.SHIP_TO_ADDRESS_LINE_1(data.SHIP_TO_ADDRESS_LINE_1);
                    self.SHIP_TO_ADDRESS_LINE_2(data.SHIP_TO_ADDRESS_LINE_2);
                    self.SHIP_TO_ADDRESS_LINE_3(data.SHIP_TO_ADDRESS_LINE_3);
                    self.SALES_ORDER_NO(data.SALES_ORDER_NO);
                    self.CURRENCY(data.CURRENCY);
                    self.LINE_NO(data.LINE_NO);
                    self.PRODUCT_NO(data.PRODUCT_NO);
                    self.DELIVERY_QUANTITY(data.DELIVERY_QUANTITY);
                    self.RECEIVE_QUANTITY(data.RECEIVE_QUANTITY);
                    self.UNIT_PRICE(data.UNIT_PRICE);
                    self.TOTAL_AMOUNT(data.TOTAL_AMOUNT);
                    self.DEPOSIT_PRODUCT_NO(data.DEPOSIT_PRODUCT_NO);
                    self.DEPOSIT_UNIT_PRICE(data.DEPOSIT_UNIT_PRICE);
                    self.DEPOSIT_TOTAL_AMOUNT(data.DEPOSIT_TOTAL_AMOUNT);
                    $("#scrollingDialog").ojDialog("open");
                }  
            };
            
            self.goBack = function () {
                app.router.go('springboard');
            };

            self.dispose = function (info) {
                self.router.dispose();
            };
            
            self.refresh = function () {
                ui.showBusy();
                fetchData();
            };
            
            self.search = function () {
                console.log("search");
                var isMaintenance = maintenance.isMaintenance();
                if (isMaintenance) {
                    ui.showMessageBox(self.lng_maintenance);
                    return;
                }
                fetchData();
            };

            self.reset = function () {
                console.log("reset");
                getDefaultCriteria();
            };
            
            self.report = function() {
                ui.showBusy();
                console.log("export report");
                var fromDate = self.fromDate();
                var toDate = self.toDate();
                
                if (!fromDate) fromDate = null;
                if (!toDate) toDate = null;                
                
                var payload = service.getReportPayload(fromDate, toDate);
                console.log("payload = " + ko.toJS(payload));
                
                var cbSuccessFn = function (data, xhr) {
                    try {
                        // console.log("raw data return =" + ko.toJSON(data));
                        if (data !== null && xhr.status == 200) {
                            var respJSON = data[RESPONSE_TABLE];
                            var returnStatus = respJSON['P_RETURN_STATUS'];
                            if (returnStatus != "S") {
                                ui.showMessageBox(self.lng_error_00040);
                                return;
                            } else {
                                ui.showMessageBox(self.lng_exportSuccess);
                                return;
                            }
                        } else {
                            ui.showMessageBox(self.lng_error_00040);
                            return;
                        }
                    } catch (e) {
                        console.error(e);
                    } finally {
                        ui.hideBusy();
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    console.log("cbFailFn failed");
                    ui.showMessageBox(self.lng_error_00040);
                    ui.hideBusy();
                };                        
                service.updateLoadingListMessage(payload).then(cbSuccessFn, cbFailFn);                
            };
            
            self.save = function() {
                console.log("save");
                if (confirm(self.lng_confirmSave)) {
                    var P_INTF_TBL_I_ITEM = [];
                    ko.utils.arrayMap(self.allLoaded(), function (item) {
                        // console.log("item=" + ko.toJSON(item));
                        
                        var isProcessFlag = ko.utils.unwrapObservable(item.PROCESS_FLAG);
                        var originalProcessFlag = ko.utils.unwrapObservable(item.ORIGINAL_PROCESS_FLAG);
                        var originalExpiryDate = item.ORIGINAL_EXPIRY_DATE;
                        var expiryDate = ko.utils.unwrapObservable(item.EXPIRY_DATE);
                        var originalActualDeliveryDate = item.ORIGINAL_ACTUAL_DELIVERY_DATE;
                        var actualDeliveryDate = ko.utils.unwrapObservable(item.ACTUAL_DELIVERY_DATE);

//                        if (commonHelper.isDateFormat(item.ORIGINAL_EXPIRY_DATE, "YYYY-MM-DDTHH:mm:ss")) {
//                            originalExpiryDate = commonHelper.formatStrDate(item.ORIGINAL_EXPIRY_DATE, "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD");
//                        }
//                        if (commonHelper.isDateFormat(expiryDate, "YYYY-MM-DDTHH:mm:ss")) {
//                            expiryDate = commonHelper.formatStrDate(expiryDate, "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD");
//                        } 
//                        if (commonHelper.isDateFormat(item.ORIGINAL_ACTUAL_DELIVERY_DATE, "YYYY-MM-DDTHH:mm:ss")) {
//                            originalActualDeliveryDate = commonHelper.formatStrDate(item.ORIGINAL_ACTUAL_DELIVERY_DATE, "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD");
//                        }
//                        if (commonHelper.isDateFormat(actualDeliveryDate, "YYYY-MM-DDTHH:mm:ss")) {
//                            actualDeliveryDate = commonHelper.formatStrDate(actualDeliveryDate, "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD");
//                        }  

                        if (actualDeliveryDate) {
                            actualDeliveryDate = new moment(actualDeliveryDate).format("YYYY-MM-DD");
                        }
                        if (originalActualDeliveryDate) {
                            originalActualDeliveryDate = new moment(originalActualDeliveryDate).format("YYYY-MM-DD");
                        }
                        if (expiryDate) {
                            expiryDate = new moment(expiryDate).format("YYYY-MM-DD");
                        }
                        if (originalExpiryDate) {
                            originalExpiryDate = new moment(originalExpiryDate).format("YYYY-MM-DD");
                        }
                        
                        if ( item.ORIGINAL_QUANTITY_RECEIVED != ko.utils.unwrapObservable(item.QUANTITY_RECEIVED) ||
                             item.ORIGINAL_QUANTITY_SHIPPED != ko.utils.unwrapObservable(item.QUANTITY_SHIPPED) ||
                             item.ORIGINAL_LOT_NUMBER != ko.utils.unwrapObservable(item.LOT_NUMBER) ||
                             originalExpiryDate != expiryDate ||
                             originalActualDeliveryDate != actualDeliveryDate ||
                             originalProcessFlag != isProcessFlag ||
                             item.ORIGINAL_IN_WAREHOUSE != ko.utils.unwrapObservable(item.IN_WAREHOUSE) ||
                             item.ORIGINAL_OUT_WAREHOUSE != ko.utils.unwrapObservable(item.OUT_WAREHOUSE) || 
                             item.ORIGINAL_LINDE_REMARK != ko.utils.unwrapObservable(item.LINDE_REMARK)) {
                             // console.log("item modified = " + ko.toJSON(item));
                             P_INTF_TBL_I_ITEM.push({"DELIVERY_DETAIL_ID": (item.DELIVERY_DETAIL_ID == -1) ? null : item.DELIVERY_DETAIL_ID, 
                                                     "ORDER_HEADER_ID": (item.ORDER_HEADER_ID == -1) ? null : item.ORDER_HEADER_ID,
                                                     "ORDER_LINE_ID": (item.ORDER_LINE_ID == -1) ? null : item.ORDER_LINE_ID,
                                                     "LOT_NUMBER": (ko.utils.unwrapObservable(item.LOT_NUMBER)) ? new String(ko.utils.unwrapObservable(item.LOT_NUMBER)).toUpperCase() : ko.utils.unwrapObservable(item.LOT_NUMBER),
                                                     "EXPIRY_DATE": ko.utils.unwrapObservable(item.EXPIRY_DATE),
                                                     "ACTUAL_DELIVERY_DATE": ko.utils.unwrapObservable(item.ACTUAL_DELIVERY_DATE),
                                                     "QUANTITY_SHIPPED": ko.utils.unwrapObservable(item.QUANTITY_SHIPPED),
                                                     "QUANTITY_RECEIVED": ko.utils.unwrapObservable(item.QUANTITY_RECEIVED),
                                                     "IN_WAREHOUSE": (ko.utils.unwrapObservable(item.IN_WAREHOUSE)) ? (ko.utils.unwrapObservable(item.IN_WAREHOUSE)): null,
                                                     "OUT_WAREHOUSE": (ko.utils.unwrapObservable(item.OUT_WAREHOUSE)) ? ko.utils.unwrapObservable((item.OUT_WAREHOUSE)) : null,
                                                     "LINDE_REMARK": (ko.utils.unwrapObservable(item.LINDE_REMARK)) ? ko.utils.unwrapObservable(item.LINDE_REMARK) : null,
                                                     "PROCESS_FLAG": isProcessFlag ? 'S' : null
                             });    
                        }
                    });

                    if (P_INTF_TBL_I_ITEM.length > 0) {
                        ui.showBusy();
                        var payload = service.getUpdatePayload(P_INTF_TBL_I_ITEM);
                        console.log("update payload=" + payload); 
                        
                        var cbSuccessFn = function (data, xhr) {
                            try {
                                // console.log("raw data return =" + ko.toJSON(data));
                                if (data !== null && xhr.status == 200) {
                                    var respJSON = data[RESPONSE_TABLE];
                                    var returnStatus = respJSON['P_RETURN_STATUS'];
                                    if (returnStatus != "S") {
                                        ui.showMessageBox(self.lng_error_00032);
                                        return;
                                    } else {
                                        // update the original process flag;
                                        ko.utils.arrayMap(self.allLoaded(), function (item) {
                                            console.log("after update = " + ko.utils.unwrapObservable(item.PROCESS_FLAG));
                                            if (ko.utils.unwrapObservable(item.PROCESS_FLAG)) {
                                                item.ORIGINAL_PROCESS_FLAG = true;
                                            } else {
                                                item.ORIGINAL_PROCESS_FLAG = false;
                                            }
                                            // item.ORIGINAL_PROCESS_FLAG = (item.PROCESS_FLAG) ? true : false;
                                        });                                        
                                        self.allLoaded.valueHasMutated();
                                        ui.showMessageBox(self.lng_recordSaved);
                                        return;
                                    }
                                } else {
                                    ui.showMessageBox(self.lng_error_00032);
                                    return;
                                }
                            } catch (e) {
                                console.error(e);
                            } finally {
                                ui.hideBusy();
                                console.log("cbSuccessFn called");
                            }
                        };
                        var cbFailFn = function (data, xhr) {
                            console.log("cbFailFn failed");
                            ui.showMessageBox(self.lng_error_00032);
                            ui.hideBusy();
                        };                        
                        service.updateLoadingListMessage(payload).then(cbSuccessFn, cbFailFn);
                    }
                }                
            };
            
            self.process_flag_hdr_func = function(context) {
                context.columnHeaderSortableIconRenderer(null, function (headerContentDiv)
                {
                    console.log("process header column");
                    var headerTextDiv = $(document.createElement('div'));
                    headerTextDiv.attr('style', 'display: inline-block; padding-right: 0.5em;');
                    headerTextDiv.text(self.lng_proceed);
                    var checkBoxDiv = $(document.createElement('input'));
                    checkBoxDiv.attr('style', 'vertical-align: middle;');
                    checkBoxDiv.attr('type', 'checkbox');
                    checkBoxDiv.attr('id', 'selectAllDocuments');
                    headerContentDiv.append(headerTextDiv);
                    headerContentDiv.append(checkBoxDiv);
                });
            };
            
            // handler for drill in to delivery details
            self.optionChange = function (event, ui) {
                if (ui.option === 'selection' && ui.value[0]) {
                    console.log("reviewLoading.js ui.value=" + ui.value);
                }
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
                console.log("toggleSearchCanvas triggered");
                oj.OffcanvasUtils.toggle(searchCanvas);
            };

            self.onSearchTextChange = function (event, data) {
                if (data.option === 'rawValue') {
                    console.log("onSearchTextChange.data.value=" + data.value);
                    self.searchText(data.value);
                    var token = self.searchText().toLowerCase();
                    // dirty logic here
                    var loadedFilter = new Array();
                    if (self.allLoaded().length !== 0) {
                        if (self.searchText().length === 0) {
                            loadedFilter = self.allLoaded();
                        } else {
                            ko.utils.arrayFilter(self.allLoaded(), function (r) {
                                if (r.DELIVERY_NUMBER.toLowerCase().indexOf(token) >= 0) {
                                    loadedFilter.push(r);
                                }
                            });
                        }
                    }
                }
            };   
            
            self.getRowTemplate = function (data, context)
            {
                  return "editRowTemplate";                
//                var template = 'rowTemplate';
//                var mode = context.$rowContext['mode'];
//                if (mode === 'edit')
//                {
//                    template = 'editRowTemplate';
//                } else if (mode === 'navigation')
//                {
//                    template = 'rowTemplate';
//                } else {
//                    template = 'rowTemplate';
//                }
//                return template;
            };            
            
            function prepareUI(data, status) {
                data = (Array.isArray(data)) ? data[0] : data;
                console.log("Date retrieve from backend = " + ko.toJSON(data));
                if (data !== null && status == 200) {
                    var formatted = [];
                    var options = [];
                    var rowCount = 0;
                    var respJSON = data[RESPONSE_TABLE];
                    var returnStatus = respJSON['P_RETURN_STATUS'];
                    if (returnStatus != "S") {
                        ui.showMessageBox(self.lng_error_00031);
                        return;
                    }
                    if (!respJSON['P_INTF_TBL_O']) {
                        self.allLoaded(formatted);
                        return;
                    }
                    var resultJSON = respJSON['P_INTF_TBL_O']['P_INTF_TBL_I_ITEM'];
                    if (!resultJSON) {
                        ui.showMessageBox(self.lng_error_00031);
                        return;                        
                    }
                    console.log("resultJSON.length=" + resultJSON.length);
                    ko.utils.arrayMap(resultJSON, function (item) {
                        try {
                            var documentDate = commonHelper.formatStrDate(item.DOCUMENT_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                            if (documentDate == constant.BLANK_DATE) {
                                item.DOCUMENT_DATE = "";
                            } else {
                                item.DOCUMENT_DATE = documentDate;
                            }
                            
                            var expiry = commonHelper.formatStrDate(item.EXPIRY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                            if (expiry == constant.BLANK_DATE) {
                                item.expiry = "";
                                item.EXPIRY_DATE = "";
                                item.ORIGINAL_EXPIRY_DATE = "";
                            } else {
                                item.expiry = commonHelper.formatStrDate(item.EXPIRY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD/MM/YYYY").toUpperCase();
                                item.EXPIRY_DATE = commonHelper.formatStrDate(item.EXPIRY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "YYYY-MM-DDTHH:mm:ss").toUpperCase();
                                // item.EXPIRY_DATE = expiry;
                                item.ORIGINAL_EXPIRY_DATE = item.EXPIRY_DATE;
                            }    
                            
                            var actualDelivery = commonHelper.formatStrDate(item.ACTUAL_DELIVERY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                            if (actualDelivery == constant.BLANK_DATE) {
                                item.ACTUAL_DELIVERY_DATE = "";
                                item.ORIGINAL_ACTUAL_DELIVERY_DATE = "";
                            } else {
                                item.ACTUAL_DELIVERY_DATE = commonHelper.formatStrDate(item.ACTUAL_DELIVERY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "YYYY-MM-DDTHH:mm:ss").toUpperCase();
                                // item.ACTUAL_DELIVERY_DATE = actualDelivery;
                                item.ORIGINAL_ACTUAL_DELIVERY_DATE = item.ACTUAL_DELIVERY_DATE;
                            }    
                            
                            item.LOT_NUMBER = (item.LOT_NUMBER == "-1") ? "" : item.LOT_NUMBER;
                        } catch (ex) {
                        }
                        item.id = item.DELIVERY_DETAIL_ID + ":" + item.ORDER_HEADER_ID + ":" + item.ORDER_LINE_ID + ":" + item.DEPOSIT_LINE_ID;
                        
                        
                        // configure the max qty
                        if (item.DOCUMENT_TYPE == 'DELIVERY NOTE') {
                            item.MAX_QTY = item.DELIVERY_QUANTITY;
                        } else {
                            item.MAX_QTY = 9999;
                        }
                        
                        // define row count
                        rowCount = rowCount + 1;
                        item.rowCount = rowCount;
                        
                        // define the actual quantity
                        if (item.DOCUMENT_TYPE == 'DELIVERY NOTE') {
                            item.actualQty = item.DELIVERY_QUANTITY;
                        } else {
                            item.actualQty = item.RECEIVE_QUANTITY;
                        }
                        
                        // handle null value on address fields
                        item.SHIP_TO_ADDRESS_LINE_1 = (item.SHIP_TO_ADDRESS_LINE_1 == "-1") ? "" : item.SHIP_TO_ADDRESS_LINE_1;
                        item.SHIP_TO_ADDRESS_LINE_2 = (item.SHIP_TO_ADDRESS_LINE_2 == "-1") ? "" : item.SHIP_TO_ADDRESS_LINE_2;
                        item.SHIP_TO_ADDRESS_LINE_3 = (item.SHIP_TO_ADDRESS_LINE_3 == "-1") ? "" : item.SHIP_TO_ADDRESS_LINE_3;
                        
                        // store the original value
                        item.ORIGINAL_LOT_NUMBER = item.LOT_NUMBER;
                        item.ORIGINAL_QUANTITY_SHIPPED = item.QUANTITY_SHIPPED;
                        item.ORIGINAL_QUANTITY_RECEIVED = item.QUANTITY_RECEIVED;
                        // item.ORIGINAL_EXPIRY_DATE = item.EXPIRY_DATE;
                        // item.ORIGINAL_ACTUAL_DELIVERY_DATE = item.ACTUAL_DELIVERY_DATE;
                        item.IN_WAREHOUSE = (item.IN_WAREHOUSE == "-1") ? null: item.IN_WAREHOUSE;
                        item.OUT_WAREHOUSE = (item.OUT_WAREHOUSE == "-1") ? null: item.OUT_WAREHOUSE;
                        item.ORIGINAL_IN_WAREHOUSE = item.IN_WAREHOUSE;
                        item.ORIGINAL_OUT_WAREHOUSE = item.OUT_WAREHOUSE;
                        
                        item.isDeliveryNote = (item.DOCUMENT_TYPE == 'DELIVERY NOTE') ? true : false;
                        item.isPickupNote = (item.DOCUMENT_TYPE == 'PICKUP NOTE') ? true : false;
                        
                        // define readyOnly flag
                        item.isLotReadOnly = true;
                        item.isExpReadOnly = true;
                        if (item.DOCUMENT_TYPE == 'PICKUP NOTE') {
                            item.isLotReadOnly = (item.LOT_ENABLE == 'Y') ? false : true;
                            item.isExpReadOnly = (item.EXPIRY_ENABLE == 'Y') ? false: true;
                        }
                        item.documentType = (item.DOCUMENT_TYPE == 'DELIVERY NOTE') ? 'DELIVERY' : 'PICKUP';
                        if (item.PROCESS_FLAG == "-1" || !(item.PROCESS_FLAG)) {
                            item.PROCESS_FLAG = false;
                        } else if (item.PROCESS_FLAG) {
                            item.PROCESS_FLAG = true;
                        }
                        // item.PROCESS_FLAG = (item.PROCESS_FLAG == "-1") ? null : item.PROCESS_FLAG;
                        item.ORIGINAL_PROCESS_FLAG = item.PROCESS_FLAG;
                        // remark field
                        // item.LINDE_REMARK = (item.LINDE_REMARK == "-1") ? null : item.LINDE_REMARK;
                        if (item.LINDE_REMARK == "-1" || !(item.LINDE_REMARK)) {
                            item.LINDE_REMARK = null;
                        }
                        item.ORIGINAL_LINDE_REMARK = item.LINDE_REMARK;

                        formatted.push({
                            "id": item.id,
                            "DELIVERY_DETAIL_ID": item.DELIVERY_DETAIL_ID,
                            "ORDER_HEADER_ID": item.ORDER_HEADER_ID,
                            "ORDER_LINE_ID": item.ORDER_LINE_ID,
                            "DEPOSIT_LINE_ID": item.DEPOSIT_LINE_ID,
                            "DOCUMENT_TYPE": item.DOCUMENT_TYPE,
                            "SALES_ORDER_NO": item.SALES_ORDER_NO,
                            "PAYMENT_TERM": item.PAYMENT_TERM,
                            "CUSTOMER_NO": item.CUSTOMER_NO,
                            "CUSTOMER_NAME": item.CUSTOMER_NAME,
                            "SHIP_TO_ADDRESS_LINE_1": item.SHIP_TO_ADDRESS_LINE_1,
                            "PRODUCT_DESCRIPTION": item.PRODUCT_DESCRIPTION,
                            "LOT_NUMBER": ko.observable(item.LOT_NUMBER),
                            "UOM": item.UOM,
                            "EXPIRY_DATE": ko.observable(item.EXPIRY_DATE),
                            "expiry": item.expiry,
                            "ACTUAL_DELIVERY_DATE": ko.observable(item.ACTUAL_DELIVERY_DATE),
                            "QUANTITY_SHIPPED": ko.observable(item.QUANTITY_SHIPPED),
                            "QUANTITY_RECEIVED": ko.observable(item.QUANTITY_RECEIVED),
                            "ORIGINAL_LOT_NUMBER": item.ORIGINAL_LOT_NUMBER,
                            "ORIGINAL_EXPIRY_DATE": item.ORIGINAL_EXPIRY_DATE,
                            "ORIGINAL_ACTUAL_DELIVERY_DATE": item.ORIGINAL_ACTUAL_DELIVERY_DATE,
                            "ORIGINAL_QUANTITY_SHIPPED": item.ORIGINAL_QUANTITY_SHIPPED,
                            "ORIGINAL_QUANTITY_RECEIVED": item.ORIGINAL_QUANTITY_RECEIVED,
                            "ORIGINAL_IN_WAREHOUSE": item.ORIGINAL_IN_WAREHOUSE,
                            "ORIGINAL_OUT_WAREHOUSE": item.ORIGINAL_OUT_WAREHOUSE,
                            "actualQty": item.actualQty,
                            "OUT_WAREHOUSE": ko.observable(item.OUT_WAREHOUSE),
                            "rowCount": item.rowCount,
                            "isDeliveryNote": item.isDeliveryNote,
                            "isPickupNote": item.isPickupNote,
                            "isLotReadOnly": item.isLotReadOnly,
                            "isExpReadOnly": item.isExpReadOnly,
                            "documentType": item.documentType,
                            "PROCESS_FLAG": (item.PROCESS_FLAG) ? ko.observable(true) : ko.observable(false),
                            "ORIGINAL_PROCESS_FLAG": (item.ORIGINAL_PROCESS_FLAG) ? true : false,
                            "LINDE_REMARK": ko.observable(item.LINDE_REMARK),
                            "ORIGINAL_LINDE_REMARK": item.ORIGINAL_LINDE_REMARK,
                            "MAX_QTY": item.MAX_QTY,
                            "DOCUMENT_NO": item.DOCUMENT_NO,
                            "DOCUMENT_DATE": item.DOCUMENT_DATE,
                            "SHIP_TO_ADDRESS_LINE_2": item.SHIP_TO_ADDRESS_LINE_2,
                            "SHIP_TO_ADDRESS_LINE_3": item.SHIP_TO_ADDRESS_LINE_3,
                            "CURRENCY": item.CURRENCY,
                            "LINE_NO": item.LINE_NO,
                            "PRODUCT_NO": item.PRODUCT_NO,
                            "DELIVERY_QUANTITY": item.DELIVERY_QUANTITY,
                            "RECEIVE_QUANTITY": item.RECEIVE_QUANTITY,
                            "UNIT_PRICE": item.UNIT_PRICE,
                            "TOTAL_AMOUNT": item.TOTAL_AMOUNT,
                            "IN_WAREHOUSE": ko.observable(item.IN_WAREHOUSE),
                            "DEPOSIT_PRODUCT_NO": item.DEPOSIT_PRODUCT_NO,
                            "DEPOSIT_UNIT_PRICE": item.DEPOSIT_UNIT_PRICE,
                            "DEPOSIT_TOTAL_AMOUNT": item.DEPOSIT_TOTAL_AMOUNT
                        });
                        
                    });
                    
                    self.allLoaded(formatted);
                }
            }
            
            
            self.datasource = ko.computed(function () {
                return new oj.ArrayTableDataSource(self.allLoaded(), {idAttribute: 'id'});
            });

            function fetchData() {
                ui.showBusy();

                var fromDate = self.fromDate();
                var toDate = self.toDate();
                var documentNo = self.documentNo();
                var orderNo = self.orderNo();
                var customerNo = self.customerNo();
                var customerName = self.customerName();
                if (customerName) customerName = customerName.toString().toUpperCase();
                var shipAddress = self.shipAddress();
                if (shipAddress) shipAddress = shipAddress.toString().toUpperCase();
                
                if (!fromDate) fromDate = null;
                if (!toDate) toDate = null;
                if (!documentNo) documentNo = null;
                
                console.log("fromDate=" + fromDate);
                console.log("toDate=" + toDate);
                console.log("documentNo=" + documentNo);
                console.log("orderNo=" + orderNo);
                console.log("customerNo=" + customerNo);
                console.log("customerName=" + customerName);
                console.log("shipAddress=" + shipAddress);

                var payload = getEnquiryPaylod(fromDate, toDate, documentNo, orderNo, customerNo, customerName, shipAddress);
                console.log("reviewLoading payload =" + ko.toJS(payload));
                
                // reset
                self.allLoaded.removeAll();

                var cbSuccessFn = function (data, xhr) {
                    try {
                        prepareUI(data, xhr.status);
                    } catch (e) {
                        console.error(e);
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
                service.getReviewLoadingListMessage(payload).then(cbSuccessFn, cbFailFn);
            }
            
            function getEnquiryPaylod(fromDate, toDate, documentNo, orderNo, customerNo, customerName, shipAddress) {
                 return service.getEnquiryPayload(fromDate, toDate, documentNo, orderNo, customerNo, customerName, shipAddress);
            }
            
            function initTranslations() {
                // language translations
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_title = getTranslation("ssa.reviewLoading.title");
                self.lng_fromDate = getTranslation("ssa.reviewLoading.fromDate");
                self.lng_toDate = getTranslation("ssa.reviewLoading.toDate");
                self.lng_documentNo = getTranslation("ssa.reviewLoading.documentNo");
                self.lng_documentType = getTranslation("ssa.reviewLoading.documentType");
                self.lng_documentDate = getTranslation("ssa.reviewLoading.documentDate");
                self.lng_orderNo = getTranslation("ssa.reviewLoading.orderNo");
                self.lng_customerNo = getTranslation("ssa.reviewLoading.customerNo");
                self.lng_customerName = getTranslation("ssa.reviewLoading.customerName");
                self.lng_paymentTerm = getTranslation("ssa.reviewLoading.paymentTerm");
                self.lng_shipAddress1 = getTranslation("ssa.reviewLoading.shipAddress1");
                self.lng_shipAddress2 = getTranslation("ssa.reviewLoading.shipAddress2");
                self.lng_shipAddress3 = getTranslation("ssa.reviewLoading.shipAddress3");
                self.lng_currency = getTranslation("ssa.reviewLoading.currency");
                self.lng_lineNo = getTranslation("ssa.reviewLoading.lineNo");
                self.lng_product = getTranslation("ssa.reviewLoading.product");
                self.lng_productDescription = getTranslation("ssa.reviewLoading.productDescription");
                self.lng_uom = getTranslation("ssa.reviewLoading.uom");
                self.lng_lot = getTranslation("ssa.reviewLoading.lot");
                self.lng_expiryDate = getTranslation("ssa.reviewLoading.expiryDate");
                self.lng_actualDeliveryDate = getTranslation("ssa.reviewLoading.actualDeliveryDate");
                self.lng_quantityShipped = getTranslation("ssa.reviewLoading.quantityShipped");
                self.lng_quantityReceived = getTranslation("ssa.reviewLoading.quantityReceived");
                self.lng_deliveryQuantity = getTranslation("ssa.reviewLoading.deliveryQuantity");
                self.lng_receiveQuantity = getTranslation("ssa.reviewLoading.receiveQuantity");
                self.lng_actualQuantity = getTranslation("ssa.reviewLoading.actualQuantity");
                self.lng_quantity = getTranslation("ssa.reviewLoading.quantity");
                self.lng_unitPrice = getTranslation("ssa.reviewLoading.unitPrice");
                self.lng_totalAmount = getTranslation("ssa.reviewLoading.totalAmount");
                self.lng_depositItem = getTranslation("ssa.reviewLoading.depositItem");
                self.lng_searchPlaceHolder = getTranslation("ssa.header.search");
                self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");
                self.lng_search = getTranslation("ssa.reviewLoading.search");
                self.lng_reset = getTranslation("ssa.reviewLoading.reset");
                self.lng_export = getTranslation("ssa.reviewLoading.export");
                self.lng_error_00031 = getTranslation("ssa.msg.error.ERROR_00031");
                self.lng_error_00032 = getTranslation("ssa.msg.error.ERROR_00032");
                self.lng_error_00040 = getTranslation("ssa.msg.error.ERROR_00040");
                self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                self.lng_confirmSave = getTranslation("ssa.reviewLoading.confirmSave");
                self.lng_recordSaved = getTranslation("ssa.msg.info.recordSaved");
                self.lng_exportSuccess = getTranslation("ssa.msg.info.exportSuccess");
                self.lng_documentInfo = getTranslation("ssa.reviewLoading.documentInfo");
                self.lng_customerInfo = getTranslation("ssa.reviewLoading.customerInfo");
                self.lng_orderItemInfo = getTranslation("ssa.reviewLoading.orderItemInfo");
                self.lng_depositItemInfo = getTranslation("ssa.reviewLoading.depositItemInfo");
                self.lng_proceed = getTranslation("ssa.reviewLoading.proceed");
                self.lng_inWarehouse = getTranslation("ssa.reviewLoading.inWarehouse");
                self.lng_outWarehouse = getTranslation("ssa.reviewLoading.outWarehouse");
                self.lng_sumOriginalDelivery = getTranslation("ssa.reviewLoading.sumOriginalDelivery");
                self.lng_sumOutWarehouse = getTranslation("ssa.reviewLoading.sumOutWarehouse");
                self.lng_sumPickUp = getTranslation("ssa.reviewLoading.sumPickUp");
                self.lng_sumDelivery = getTranslation("ssa.reviewLoading.sumDelivery");
                self.lng_lindeRemark = getTranslation("ssa.reviewLoading.lindeRemark");
            }

            $(document).ready(
                    function ()
                    {
                            document.getElementById("text-orderNo").focus();
                            // $('#documentTable').on('ojbeforeroweditend', beforeRowEditEndListener);
                            // $('#documentTable').on('ojbeforecurrentrow', beforeCurrentRowListener);
                            $('#selectAllDocuments').click(function() {
                                var action = this.checked;
                                console.log("action=" + action);
                                $('input:checkbox').not(this).prop('checked', this.checked);
                                self.allLoaded().forEach(function (i) {
                                    console.log(">>>>>>>>>>>>>>" + ko.utils.unwrapObservable(i.PROCESS_FLAG));
                                    if (action) {
                                        i.PROCESS_FLAG = ko.observable(true);
                                    } else {
                                        i.PROCESS_FLAG = ko.observable(false);
                                    }
                                    console.log(ko.utils.unwrapObservable(i.PROCESS_FLAG));
                                }); 
                                self.allLoaded.valueHasMutated();
                            });     
                    }
            );            

        }
           
        ko.bindingHandlers.executeOnEnter = {
            init: function (element, valueAccessor, allBindings, viewModel) {
                var callback = valueAccessor();
                $(element).keypress(function (event) {
                    var keyCode = (event.which ? event.which : event.keyCode);
                    if (keyCode === 13) {
                        callback.call(viewModel);
                        return false;
                    }
                    return true;
                });
            }
        };
        
        ko.bindingHandlers.datePicker = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {                    
                // Register change callbacks to update the model
                // if the control changes.       
                ko.utils.registerEventHandler(element, "change", function () {            
                    var value = valueAccessor();
                    value(new Date(element.value));            
                });
            },
            // Update the control whenever the view model changes
            update: function (element, valueAccessor, allBindingsAccessor, viewModel) {        
                var value = valueAccessor();
                var x = new moment(value()).format("YYYY-MM-DD");
                element.value = x;
            }
        };        
        
        return new ReviewLoadingViewModel();
    }
);