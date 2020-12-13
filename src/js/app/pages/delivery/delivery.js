define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/data', 'util/appui', 'pages/delivery/deliveryService', 
    'pages/common/constant', 'util/commonhelper',
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
        
        function DeliveryViewModel() {
            var self = this;
            
            console.log("DeliveryViewModel");
            
            var RESPONSE_TABLE = "P_SHIPMENT_TBL_ITEM";

            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            self.currOrderId = ko.observable();
            self.allDelivery = ko.observableArray();
            
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
            self.ready = ko.observable(false);
            self.syncDatetime = ko.observable();
            self.showLastSyncDate = ko.observable(false);
            self.headerTitle = ko.observable();
            
            self.enableScan = ko.computed(function(){
                var isCordova = app.moduleConfig.params.rootContext.isCordova;
                if (!isCordova) return false;
                var fromPage = app.moduleConfig.params.rootContext.fromPage; 
                var role = app.moduleConfig.params.rootContext.userProfile.salesRole;
                if( (role == constant.SR_DRIVER_JLOG || role == constant.SR_DRIVER_LINDE || role == constant.SR_SALE_VAN) && fromPage == "springboard" ) {
                    return true;
                } else {
                    return false;
                }
            });
            
            self.handleActivated = function (info) {
                var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                console.log("delivery.js parentRouter=" + parentRouter.currentState().value);
                
                var childRouter = parentRouter.getChildRouter("delivery");
                if (!childRouter) {
                    childRouter = parentRouter.createChildRouter('delivery');
                }      
                self.router = childRouter.configure(function (stateId) {
                    if (stateId) {
                        var state = new oj.RouterState(stateId, {value: stateId,
                            enter: function () {
                                // Set currOrderId
                                self.currOrderId(stateId);
                                console.log("delivery.js stateId=" + stateId);
                            }
                        });
                        return state;
                    }
                });  
                
                if (self.isVanSales()) {
                    self.headerTitle(self.lng_delivery);
                } else {
                    self.headerTitle(self.lng_loading);
                }                

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
                ui.showBusy();
                console.log("delivery.js init() started");
                console.log("isConfirmed=" + app.moduleConfig.params.rootContext.isConfirmed);
                
                var fromPage = app.moduleConfig.params.rootContext.fromPage;
                var cbSuccessFn = function (data, xhr) {
                    try {
                        prepareUI(data, xhr.status);
                    } catch (e) {
                        console.error(e);
                        ui.hideBusy();
                    } finally {
                        ui.hideBusy();
                        getSyncDate();
                        self.ready(true);
                        app.moduleConfig.params.rootContext.requireRefresh = false;
                        app.moduleConfig.params.rootContext.isConfirmed = false;
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    console.log("cbFailFn failed");
                    prepareUI(data, xhr.status);
                    ui.hideBusy();
                };
                // No need to refresh since it is cached from init load
                // var refresh = app.moduleConfig.params.rootContext.requireRefresh;
                var refresh = false;
                if (app.moduleConfig.params.rootContext.isConfirmed) {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    service.refreshDeliveryByCarPlateMessage(getPayloadByCarPlate(user.licenseNo)).then(cbSuccessFn, cbFailFn);                
                } else if (fromPage === "springboard") {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    if (!refresh) {
                        service.getDeliveryByCarPlateMessage(getPayloadByCarPlate(user.licenseNo)).then(cbSuccessFn, cbFailFn);
                    } else {
                        service.refreshDeliveryByCarPlateMessage(getPayloadByCarPlate(user.licenseNo)).then(cbSuccessFn, cbFailFn);
                    }
                } else {
                    var orderNumber = app.moduleConfig.params.rootContext.orderNumber;
                    if (!refresh) {
                        service.getDeliveryHistMessage(getPayload(orderNumber)).then(cbSuccessFn, cbFailFn);
                    } else {
                        service.refreshDeliveryHistMessage(getPayload(orderNumber)).then(cbSuccessFn, cbFailFn);
                    }
                }
            }

            function getSyncDate() {
                var key;
                var fromPage = app.moduleConfig.params.rootContext.fromPage;
                var user = app.moduleConfig.params.rootContext.userProfile;
                var orderNumber = app.moduleConfig.params.rootContext.orderNumber;
                if (fromPage === "springboard") {
                    var UserID = user.username;
                    var UserRole = user.salesRole;
                    var CallerID = "";
                    var P_ORG_ID = user.orgUnitId;
                    var P_CP_NUMBER = user.licenseNo;
                    key = constant.DELIVERY_LIST_BY_CAR_PLATE_KEY + ":" + UserID + ":" + UserRole + ":" + CallerID + ":" + P_ORG_ID + ":" + P_CP_NUMBER + ":" + constant.DELIVERY_LIST_SYNC_DATETIME;
                } else {
                    var UserID = user.username;
                    var UserRole = user.salesRole;
                    var CallerID = "";
                    var P_ORG_ID = user.orgUnitId;
                    var P_SO_NUMBER = orderNumber;
                    key = constant.DELIVERY_LIST_KEY + ":" + UserID + ":" + UserRole + ":" + CallerID + ":" + P_ORG_ID + ":" + P_SO_NUMBER + ":" + constant.DELIVERY_LIST_SYNC_DATETIME;
                }
                // store the last sync datetime of delivery list to local storage
                var data = ui.getLocalStorage(key);
                if (data) {
                    self.syncDatetime(data);
                    self.showLastSyncDate(true);
                }
            }

            function prepareUI(data, status) {
                data = (Array.isArray(data)) ? data[0] : data;
                console.log("Date retrieve from backend = " + ko.toJSON(data));
                if (data !== null) {
                    var respJSON = data[RESPONSE_TABLE];
                    var deliveryFilter = ko.observableArray([]);
                    
                    ko.utils.arrayMap(respJSON, function (item) {
                        try {
                           var deliveryDate = commonHelper.formatStrDate(item.DELIVERY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                           if (deliveryDate == constant.BLANK_DATE) {
                               item.DELIVERY_DATE = "";
                           } else {
                               item.DELIVERY_DATE = commonHelper.formatStrDate(item.DELIVERY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                           }
                           
                           var loadedDate = commonHelper.formatStrDate(item.LOADED_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                           if (loadedDate == constant.BLANK_DATE) {
                               item.LOADED_DATE = "";
                           } else {
                               item.LOADED_DATE = commonHelper.formatStrDate(item.LOADED_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY HH:mm").toUpperCase();
                           }
                           
                           var confirmedDate = commonHelper.formatStrDate(item.CONFIRMED_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                           if (confirmedDate == constant.BLANK_DATE) {
                               item.CONFIRMED_DATE = "";
                           } else {
                               item.CONFIRMED_DATE = commonHelper.formatStrDate(item.CONFIRMED_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY HH:mm").toUpperCase();
                           }                           
                        } catch (ex) {
                        } 
                        item.DELIVERY_ADDRESS = (item.DELIVERY_ADDRESS == "-1") ? "" : item.DELIVERY_ADDRESS;
                        item.CAR_PLATE_NUMBER = (item.CAR_PLATE_NUMBER == "-1") ? "" : item.CAR_PLATE_NUMBER;
                        if (typeof item.DOCUMENT_TYPE === "undefined" || !item.DOCUMENT_TYPE) item.DOCUMENT_TYPE = constant.DOCUMENT_TYPE_DELIVERY_NOTE;
                        deliveryFilter.push(item);
                    });
                    self.worklistData(new oj.ArrayTableDataSource(deliveryFilter, {idAttribute: 'DELIVERY_NUMBER'}));

                    self.allDelivery = deliveryFilter;
                }
            }
            
            function getPayload(orderId) {
                var user = app.moduleConfig.params.rootContext.userProfile;

                var payload = JSON.stringify({
                    "InputGetShipmentListBySalesOrder": {
                        "HeaderInfo" : {
                            "UserID" : user.username,
                            "UserRole" : user.salesRole,
                            "CallerID" : ""
                        },
                        "P_ORG_ID" : user.orgUnitId,
                        "P_SO_NUMBER" : orderId
                    }
                });
                
                console.log("Delivery list payload = " + payload);
                return payload;              
            }
            
            function getPayloadByCarPlate(carPlate) {
                var user = app.moduleConfig.params.rootContext.userProfile;
                var orgUnitId = null;
                if (!user || typeof user === "undefined" || typeof user.orgUnitId === "undefined" || !user.orgUnitId ) {
                    orgUnitId = constant.ORG_UNIT_ID_BEER;
                } else {
                    orgUnitId = user.orgUnitId;
                }

                var payload = JSON.stringify({
                    "InputGetShipmentListByCarPlate": {
                        "HeaderInfo" : {
                            "UserID" : user.username,
                            "UserRole" : user.salesRole,
                            "CallerID" : ""
                        },
                        "P_ORG_ID" : orgUnitId,
                        "P_CP_NUMBER" : carPlate
                    }
                });
                
                console.log("Delivery list by car plate payload = " + payload);
                return payload;              
            }

            function pullToRefresh() {
                var cbSuccessFn = function (data, xhr) {
                    try {
                        prepareUI(data, xhr.status);
                    } catch (e) {
                        console.error(e);
                    } finally {
                        getSyncDate();
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    prepareUI(data, xhr.status);
                };
                var fromPage = app.moduleConfig.params.rootContext.fromPage;
                if (fromPage === "springboard") {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    service.refreshDeliveryByCarPlateMessage(getPayloadByCarPlate(user.licenseNo)).then(cbSuccessFn, cbFailFn);
                } else {
                    var orderNumber = app.moduleConfig.params.rootContext.orderNumber;
                    service.refreshDeliveryHistMessage(getPayload(orderNumber)).then(cbSuccessFn, cbFailFn);
                }
            }            

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
                    
                    // dirty logic here
                    var deliveryFilter = new Array();
                    if (self.allDelivery().length !== 0) {
                        if (self.searchText().length === 0) {
                            deliveryFilter = self.allDelivery();
                        } else {
                            ko.utils.arrayFilter(self.allDelivery(), function (r) {
                                var token = self.searchText().toLowerCase();
                                if (r.DELIVERY_NUMBER.toLowerCase().indexOf(token) >= 0) {
                                    deliveryFilter.push(r);
                                }
                            });
                        }
                    }
                    self.worklistData(new oj.ArrayTableDataSource(deliveryFilter, {idAttribute: 'DELIVERY_NUMBER'}));
                }
            };
            
            // handler for drill in to delivery details
            self.optionChange = function (event, ui) {
                if (ui.option === 'selection' && ui.value[0]) {
                    // ui.value = delivery number
                    console.log("delivery.js ui.value=" + ui.value);
                    createDeliveryProfile(ui.value);
                    app.redirect("deliveryDetail", ui.value);
                }
                
                function createDeliveryProfile(deliveryItemId) {
                    $(self.allDelivery()).each(function (index, item) {
                        if (item.DELIVERY_NUMBER == deliveryItemId) {
                            var selDelivery = service.createDelivery(item.DELIVERY_NUMBER, item.DELIVERY_DATE, item.OUTLET_NUMBER, item.DELIVERY_ADDRESS, item.CAR_PLATE_NUMBER, item.ORDER_NUMBER, item.PAYMENT_TERM, item.DOCUMENT_TYPE, item.LOADED_DATE, item.CONFIRMED_DATE);
                            
                            // store the selected customer profile
                            app.moduleConfig.params.rootContext.selDeliveryProfile = selDelivery;
                        }
                    });
                }
            };
            
            self.scanBarcode = function() {
                console.log("Barcode scan starting......");
                cordova.plugins.barcodeScanner.scan(
                    function (result) {
                        var selDelivery;
                        for(var i = 0; i < self.allDelivery().length; i++){
                            var item = self.allDelivery()[i];
                            var barcode = parserBarcode(result.text);
                            if(item.DELIVERY_NUMBER == barcode){
                                selDelivery = service.createDelivery(item.DELIVERY_NUMBER, item.DELIVERY_DATE, item.OUTLET_NUMBER, item.DELIVERY_ADDRESS, item.CAR_PLATE_NUMBER, item.ORDER_NUMBER, item.PAYMENT_TERM, item.DOCUMENT_TYPE, item.LOADED_DATE, item.CONFIRMED_DATE);
                            
                                // store the selected customer profile
                                app.moduleConfig.params.rootContext.selDeliveryProfile = selDelivery;
                                break;
                            };
                        }
                        if(selDelivery) {
                            console.log("barcode: " + result.text);
                            console.log("format: " + result.format);
                            console.log("cancelled: " + result.cancelled);
                            app.redirect("deliveryDetail", item.DELIVERY_NUMBER);
                        } else {
                            ui.showMessageBox(self.lng_apptitle, self.lng_cantMatchBarCode);
                        }
                    },
                    function (error) {
                        alert("Scanning failed: " + error);
                    },
                    {
                        "preferFrontCamera" : false, // iOS and Android
                        "showFlipCameraButton" : false, // iOS and Android
                        "prompt" : "Place a barcode inside the scan area"//, // supported on Android only
                        //"formats" : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                        //"orientation" : "landscape" // Android only (portrait|landscape), default unset so it rotates with the device
                    }
                );
              };
            
            self.goBack = function () {
                console.log("orderId: " + app.moduleConfig.params.rootContext.orderId);
                var user = app.moduleConfig.params.rootContext.userProfile;
                
                var fromPage = app.moduleConfig.params.rootContext.fromPage;
                if (fromPage === "springboard") {
                    if (user.salesRole == constant.SR_ADMIN) {
                        app.router.go('inputLicense');
                    } else {
                        app.router.go('springboard');
                    }
                } else {
                    app.redirect("orderDetail", app.moduleConfig.params.rootContext.orderId);
                }
            };

            self.dispose = function (info) {
                self.router.dispose();
            };
            
            self.isVanSales = ko.computed(function () {
                var user = app.moduleConfig.params.rootContext.userProfile;
                try {
                    var role = user.salesRole;
                    if (role === constant.SR_SALE_VAN) {
                        return true;
                    } else {
                        return false;
                    }
                } catch (ex) {
                    return false;
                }
            });          
            
            function parserBarcode(barcode) {
                if (typeof barcode === "undefined" || !barcode) {
                    return;
                }
                /////////////////////////////////////////////////
                // Pattern 
                // Delivery Note: S999999999
                // Pick Up:       9999-9999999999 
                /////////////////////////////////////////////////
                var prefix = barcode.substring(0,1);
                var orgUnitId = barcode.substring(0, 4);
                var hypenPos = barcode.indexOf("-");
                var charSPos = chkAlphabet(prefix);
                
                if (charSPos >= 0 || hypenPos < 0) {
                    // ORG_UNIT_ID is dummy
                    if (charSPos >= 0) {
                        return barcode.substring(1);
                    } else {
                        return barcode.substring(0);
                    }
                } else {
                    return barcode;
                } 
            }            
            
            function chkAlphabet(inputtxt)
            {
                var letters = /^[a-zA-Z]+$/;
                if (inputtxt.match(letters)) {
                    return 0;
                } else {
                    return -1;
                }
            }             
            
            function initTranslations() {
                // language translations
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_delivery = getTranslation("ssa.delivery.delivery");
                self.lng_documentType = getTranslation("ssa.delivery.documentType");
                self.lng_deliveryNote = getTranslation("ssa.delivery.deliveryNote");
                self.lng_pickup = getTranslation("ssa.delivery.pickup");
                self.lng_loading = getTranslation("ssa.springboard.pickupList");
                self.lng_cantMatchBarCode = getTranslation("ssa.delivery.cantMatchBarCode");
                self.lng_apptitle = getTranslation("ssa.apptitle");
                self.lng_searchPlaceHolder = getTranslation("ssa.header.search");
                self.lng_lastSyncDate = getTranslation("ssa.header.lastSyncDate");
                self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");
            }
            
            initTranslations();
            init();
            
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
        
        return DeliveryViewModel;
    }
);