define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/data', 'pages/delivery/deliveryService', 'pages/common/constant', 'util/appui', 'pages/common/maintenance',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox',
    'ojs/ojlistview', 'ojs/ojmodel', 'ojs/ojpagingcontrol', 'ojs/ojpagingcontrol-model',
    'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
    function (oj, ko, $, app, data, service, constant, ui, maintenance) {
        var searchCanvas;

        searchCanvas = {
            "selector": "#searchCanvas",
            "edge": "top",
            "displayMode": "push",
            "size": "63px",
            "modality": "modeless",
            "autoDismiss": "none"
        };
        
        function DeliveryDetailViewModel() {
            var self = this;
            
            console.log("DeliveryDetailViewModel");
            
            var RESPONSE_TABLE = "P_SHIPMENT_DETAILS_TBL_ITEM";

            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            self.headerTitle = ko.observable();
            self.allDeliveryItem = ko.observableArray([]);
            self.currDeliveryNumber = ko.observable();
            self.delivery_no = ko.observable();
            self.orgUnitId = ko.observable();
            self.documentType = ko.observable();
            self.documentTypeDesc = ko.observable();
            self.deliveryDate = ko.observable();
            self.outletName = ko.observable();
            self.deliveryAddress = ko.observable();
            self.orderNumber = ko.observable();
            self.carPlateNumber = ko.observable();
            self.loadedDate = ko.observable();
            self.confirmedDate = ko.observable();
            self.getDataSyncCount = ko.observable(0);
            self.isCODPayment = ko.computed(function () {
                // return false if DRIVER role
                var user = app.moduleConfig.params.rootContext.userProfile;
                if (user.salesRole == constant.SR_DRIVER_JLOG || user.salesRole == constant.SR_DRIVER_LINDE) return false;
                
                var selDelivery = app.moduleConfig.params.rootContext.selDeliveryProfile;
                if (ko.utils.unwrapObservable(selDelivery.paymentTerm) == constant.PAYMENT_TERM) return true;
                return false;
            });
            self.isDriverRole = ko.computed(function () {
                var user = app.moduleConfig.params.rootContext.userProfile;
                if (user.salesRole == constant.SR_DRIVER_JLOG || user.salesRole == constant.SR_DRIVER_LINDE)
                    return true;
               return false; 
            });
            
            self.buttonEnabled = ko.observable();
            self.qtyModifyEnabled = ko.observable();
            self.showEraseButton = ko.computed( function() {
                return (isDataSync());
            });
            
            self.handleActivated = function (info) {
                var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                console.log("deliveryDetail.js parentRouter=" + parentRouter.currentState().value);

                var childRouter = parentRouter.getChildRouter("deliveryItem");
                if (!childRouter) {
                    childRouter = parentRouter.createChildRouter('deliveryItem');
                }      
                self.router = childRouter.configure(function (stateId) {
                    if (stateId) {
                        var state = new oj.RouterState(stateId, {value: stateId,
                            enter: function () {
                                // Set currOrderId
                                self.currDeliveryNumber(stateId);
                                console.log("deliveryItem.js stateId=" + stateId);
                            }
                        });
                        return state;
                    }
                });  
                
                initTranslation();
                
                headerSetup();

                // get the seleced customer profile for state id
                // self.currDeliveryId(app.moduleConfig.params.rootContext.deliveryId);
                return oj.Router.sync();
            };
            
            function headerSetup() {
                // get the seleced delivery profile for header Title
                var selDelivery = app.moduleConfig.params.rootContext.selDeliveryProfile;  
                if (typeof selDelivery !== "undefined") {
                    self.headerTitle(ko.utils.unwrapObservable(selDelivery.delivery_no));
                } else {
                    self.headerTitle(self.lng_deliveryDetail);
                }
                
                // set the counter in the header bar
                var cnt1 = 0;
                cnt1 = containSavedDelivery();
                self.getDataSyncCount(cnt1);                
            }
            
            function isDataSync() {
                return (app.moduleConfig.params.rootContext.fromPage == "dataSync") ? true : false;
            }            
            
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
            
            self.currDeliveryNumber.subscribe(function(newDeliveryNumber) {
                getDeliveryDetail(newDeliveryNumber);
            });
            
            function getDeliveryDetail(newDeliveryNumber) {
                console.log("deliveryDetail.js init() started");
                console.log("newDeliveryNumber=" + newDeliveryNumber);
                
                setupDeliveryHeader();
                
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
                service.getDeliveryItemMessage(getPayload(newDeliveryNumber)).then(cbSuccessFn, cbFailFn);
            }
            
            function getPayload(newDeliveryNumber) {
                ui.showBusy();
                
                var user = app.moduleConfig.params.rootContext.userProfile;
                var orgUnitId = user.orgUnitId;
                if (typeof orgUnitId === "undefined" || !orgUnitId) orgUnitId = constant.ORG_UNIT_ID_BEER;
                var documentNumber = newDeliveryNumber;
                var documentType = self.documentType();

                if (newDeliveryNumber.indexOf("-") > 0) {
                    var partNo = newDeliveryNumber.split(/-(.+)/);
                    orgUnitId = partNo[0];
                    documentNumber = partNo[1];
                }

                var payload = JSON.stringify({
                    "InputGetShipmentDetails": {
                        "HeaderInfo" : {
                            "UserID" : user.username,
                            "UserRole" : user.salesRole,
                            "CallerID" : ""
                        },
                        "P_ORG_ID" : orgUnitId,
                        "P_DELIVERY_NUM" : documentNumber,
                        "P_DOCUMENT_TYPE": documentType
                    }
                });
                
                console.log("Delivery Detail payload = " + payload);
                return payload;
            }
            
            
            function prepareConfirmPayload(paymentType) {
                var deliveryNumber = ko.utils.unwrapObservable(self.currDeliveryNumber);
                var user = app.moduleConfig.params.rootContext.userProfile;
                
                var P_SHIPMENT_DETAILS_TBL_ITEM = [];
                ko.utils.arrayForEach(self.allDeliveryItem(), function(item) {
                    var amount = (item.UNIT_SELLING_PRICE * item.QTY);
                    P_SHIPMENT_DETAILS_TBL_ITEM.push({QTY: item.QTY, DELIVERY_DETAIL_ID: item.DELIVERY_DETAIL_ID, AMOUNT: amount});
                });
                
                var payload = JSON.stringify({
                        "InputShipConfirm": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": user.orgUnitId,
                            "P_DELIVERY_ID": deliveryNumber,
                            "P_PAYMENT_METHOD": paymentType,
                            "P_SHIPMENT_DETAILS_TBL": {"P_SHIPMENT_DETAILS_TBL_ITEM": P_SHIPMENT_DETAILS_TBL_ITEM}
                        }                    
                });
                
                return payload;
            }
            
//            function init() {
//                console.log("deliveryDetail.js init() started");
//                
//                setupDeliveryHeader();
//                
//                var cbSuccessFn = function (data, xhr) {
//                    try {
//                        prepareUI(data, xhr.status);
//                    } catch (e) {
//                        console.error(e);
//                    } finally {
//                        console.log("cbSuccessFn called");
//                    }
//                };
//                var cbFailFn = function (data, xhr) {
//                    console.log("cbFailFn failed");
//                    prepareUI(data, xhr.status);
//                };
//                service.getDeliveryItemMessage().then(cbSuccessFn, cbFailFn);
//            }
            
            function setupDeliveryHeader() {
                var selDelivery = app.moduleConfig.params.rootContext.selDeliveryProfile;
                console.log("selDelivery=" + ko.toJSON(selDelivery)) ;
                self.documentType(ko.utils.unwrapObservable(selDelivery.documentType));
                self.documentTypeDesc((self.documentType() == 'DN') ? self.lng_deliveryNote : self.lng_pickup);

                var documentNo = ko.utils.unwrapObservable(selDelivery.delivery_no);
                if (self.documentType() == constant.DOCUMENT_TYPE_PICKUP) {
                    if (documentNo) {
                        var partNo = documentNo.split(/-(.+)/);
                        self.orgUnitId(partNo[0]);
                        self.delivery_no(partNo[1]);
                    }
                } else {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    self.orgUnitId(ko.utils.unwrapObservable(user.orgUnitId));
                    self.delivery_no(documentNo);                        
                }
                self.deliveryDate(ko.utils.unwrapObservable(selDelivery.deliveryDate));
                self.outletName(ko.utils.unwrapObservable(selDelivery.outletName));
                self.deliveryAddress(ko.utils.unwrapObservable(selDelivery.deliveryAddress));
                self.orderNumber(ko.utils.unwrapObservable(selDelivery.orderNumber));
                self.carPlateNumber(ko.utils.unwrapObservable(selDelivery.carPlateNumber));   
                self.loadedDate(ko.utils.unwrapObservable(selDelivery.loadedDate)); 
                self.confirmedDate(ko.utils.unwrapObservable(selDelivery.confirmedDate)); 
            }
            
            function prepareUI(data, status) {
                data = (Array.isArray(data)) ? data[0] : data;
                if (data !== null && status == 200) {
                    var response = data[RESPONSE_TABLE];
                    console.log("Retrieve data = " + ko.toJSON(response));
                    var deliveryItemArray = ko.utils.parseJson(JSON.stringify(response));
                    ko.utils.arrayMap(deliveryItemArray, function (item) {
                        item.MAXQTY = item.QTY;
                        item.LOT_NUMBER = (item.LOT_NUMBER == "-1") ? "" : item.LOT_NUMBER;
                        if (self.isDriverRole()) {
                            item.QTY = null;
                        }
                        self.allDeliveryItem.push(item);
                    });
                    
                    var role = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    var fromPage = app.moduleConfig.params.rootContext.fromPage; 
                    if( (role == constant.SR_SALE_VAN || role == constant.SR_DRIVER_JLOG || role == constant.SR_DRIVER_LINDE) && (fromPage == "springboard" || fromPage == "dataSync")) {
                        self.buttonEnabled(true);
                        self.qtyModifyEnabled(true);
                    } else {
                        self.buttonEnabled(false);
                        self.qtyModifyEnabled(false);
                    }
                    console.log("Delivery Items = " + ko.toJSON(self.allDeliveryItem));
                }
            }
            
            self.goBack = function () {
                if (isDataSync()) {
                    var fromPage = app.moduleConfig.params.rootContext.fromPage;
                    app.go(fromPage);
                } else {
                    var orderNumber = ko.utils.unwrapObservable(self.orderNumber);
                    console.log("orderId: " + orderNumber);
                    app.redirect("delivery", orderNumber);                    
                }
            };

            self.dispose = function (info) {
                self.router.dispose();
            };
            
            self.confirmShipment = function() {
                if (self.isDriverRole()) {
                    confirmLoadingDocument("FULL");
                } else {
                    confirmDelivery(null);
                }
            };
            
            self.partialConfirmShipment = function() {
                if (self.isDriverRole()) {
                    confirmLoadingDocument(null);
                } else {
                    confirmDelivery(null);
                }                
            };
            
            self.confirmCash = function() {
                if (self.isDriverRole()) {
                    confirmLoadingDocument(null);
                } else {
                    confirmDelivery(constant.PAY_BY_CASH);
                }
            };
            
            self.confirmCheque = function() {
                if (self.isDriverRole()) {
                    confirmLoadingDocument(null);
                } else {
                    confirmDelivery(constant.PAY_BY_CHEQUE);
                }
            };
            
            self.confirmOthers = function() {
                if (self.isDriverRole()) {
                    confirmLoadingDocument(null);
                } else {
                    confirmDelivery(constant.PAY_BY_OTHERS);
                }                
            };
            
            function confirmLoadingDocument(paymentType) {
                console.log("confirmLoadingDocument clicked");
                console.log("paymentType = " + paymentType);                

                var isMaintenance = maintenance.isMaintenance();
                if (isMaintenance) {
                    ui.showMessageBox(self.lng_maintenance);
                    return;
                }           
                // pre-check the network
                var isOnline = app.moduleConfig.params.rootContext.isOnline;
                if (!isOnline) {
                    ui.showMessageBox(self.lng_error_00005);
                    return;
                } else {
                    if (paymentType == "FULL") {
                        if (!confirm(self.lng_confirmProceed)) {
                            return;
                        }
                    } else {
                        if (!confirm(self.lng_partialDelivery)) {
                            return;
                        }                        
                    }
                }                
                ui.showBusy();
                // get the confirm goods loading payload
                var payload = service.getConfirmGoodsLoadingPayload(ko.utils.unwrapObservable(self.orgUnitId()), self.documentType(), self.delivery_no(), self.allDeliveryItem(), paymentType);
                console.log("confirm goods loading payload = " + ko.toJS(payload));

                var cbSuccessFn = function (data, xhr) {
                    var returnStatus, returnMessage, respJSON;
                    console.log("raw data = " + ko.toJSON(data));
                    try {
                        if (xhr.status == 200 && data != null) {
                            respJSON = data['OutputDNRMAConfirm'];
                            returnStatus = respJSON['ReturnStatus'];
                            returnMessage = respJSON['ReturnMessage'];
                            if ("S" == returnStatus || "W" == returnStatus) {
                                ui.showMessageBox(self.lng_proceedDelivery);
                                var orderNumber = ko.utils.unwrapObservable(self.orderNumber);
                                app.moduleConfig.params.rootContext.isConfirmed = true;
                                app.redirect("delivery", orderNumber);
                            } else {
                                if (returnMessage) {
                                    ui.showMessageBox(self.lng_error_00013 + " " + returnMessage);
                                } else {
                                    ui.showMessageBox(self.lng_error_00013);
                                }
                            }
                        }
                    } catch (e) {
                        console.error(e);
                        ui.showMessageBox(self.lng_error_00014);
                        ui.hideBusy();
                    } finally {
                        ui.hideBusy();
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    console.log("cbFailFn failed");
                    ui.showMessageBox(self.lng_error_00014);
                    ui.hideBusy();
                };
                service.confirmGoodsLoadingMessage(payload).then(cbSuccessFn, cbFailFn);                
            }
            
            function confirmDelivery(paymentType) {
                console.log("confirmDelivery clicked");
                console.log("paymentType = " + paymentType);

                var isMaintenance = maintenance.isMaintenance();
                if (isMaintenance) {
                    ui.showMessageBox(self.lng_maintenance);
                    return;
                }           
                // pre-check the network
                var isOnline = app.moduleConfig.params.rootContext.isOnline;
                if (!isOnline) {
                    ui.showMessageBox(self.lng_error_00005);
                    return;
                } else {
                    if (!confirm(self.lng_confirmProceed)) {
                        return; 
                    }
                }                
                ui.showBusy();
                // get the confirm delivery payload
                var payload = prepareConfirmPayload(paymentType);
                console.log("confirm delivery payload = " + ko.toJS(payload));

                var cbSuccessFn = function (data, xhr) {
                    var returnStatus, returnMessage, respJSON;
                    try {
                        if (xhr.status == 200 && data != null) {
                            respJSON = data['OutputShipConfirm'];
                            returnStatus = respJSON['ReturnStatus'];
                            returnMessage = respJSON['ReturnMessage'];
                            if ("S" == returnStatus || "W" == returnStatus) {
                                ui.showMessageBox(self.lng_proceedDelivery);
                                    if (isDataSync()) {
                                        var fromPage = app.moduleConfig.params.rootContext.fromPage;
                                        var order = app.moduleConfig.params.rootContext.savedOrder;
                                        var payload = ko.toJS({status: "S", data: order.data});
                                        app.moduleConfig.params.rootContext.savedOrder = payload;                                        
                                        app.go(fromPage);
                                    } else {
                                        var orderNumber = ko.utils.unwrapObservable(self.orderNumber);
                                        app.moduleConfig.params.rootContext.isConfirmed = true;
                                        app.redirect("delivery", orderNumber);
                                    }
                            } else {
                                ui.showMessageBox(self.lng_error_00013 + " " + returnMessage);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                        ui.showMessageBox(self.lng_error_00014);
                        ui.hideBusy();
                    } finally {
                        ui.hideBusy();
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    console.log("cbFailFn failed");
                    ui.showMessageBox(self.lng_error_00014);
                    ui.hideBusy();
                };
                service.confirmDeliveryMessage(payload).then(cbSuccessFn, cbFailFn);
            }
            
            self.clearData = function (data, event) {
                console.log("clear the offline data of delivery");
                if (isDataSync()) {
                    var fromPage = app.moduleConfig.params.rootContext.fromPage;
                    var order = app.moduleConfig.params.rootContext.savedOrder;
                    var payload = ko.toJS({status: "D", data: order.data});
                    app.moduleConfig.params.rootContext.savedOrder = payload;
                    app.go(fromPage);
                }
            };
            
            self.save = function (data, event) {
                console.log("save the delivery");
                try {
                    var selDelivery = app.moduleConfig.params.rootContext.selDeliveryProfile;
                    var foundPayload = false;
                    var key = service.getOfflineKey();
                    var storedPayload = ui.getLocalStorage(key);
                    console.log("storedPayload = " + ko.toJSON(storedPayload));

                    if (ko.isObservable(storedPayload)) {
                        storedPayload = ko.utils.unwrapObservable(storedPayload);
                    }

                    if (storedPayload) {
                            try {
                                foundPayload = true;
                                var dataJSON = storedPayload['data'];
                                var foundItem = ko.utils.arrayFirst(dataJSON, function (item) {
                                    return (item.order.DELIVERY_NUMBER == ko.utils.unwrapObservable(selDelivery.delivery_no));
                                });
                                if (foundItem) {
                                    storedPayload['data'].pop(foundItem);
                                }
                            } catch (ex) {
                                foundPayload = false;
                            }
                    }
                    
                    // prepare the payload for delivery and order item 
                    var payload4Delivery = service.payloadDelivery(selDelivery);
                    var payload4OrderLines = [];
                    ko.utils.arrayMap(self.allDeliveryItem(), function (item) {
                        payload4OrderLines.push(item);
                    });

                    // prepare the payload for delivery + delivery item  line
                    var payload = ko.toJS({data: [{delivery: "Y", order: payload4Delivery, orderdetail: payload4OrderLines}]});
                    if (foundPayload) {
                        storedPayload.data.push(ko.toJS({delivery: "Y", order: payload4Delivery, orderdetail: payload4OrderLines}));
                        ui.setLocalStorage(key, storedPayload);
                    } else {
                        ui.setLocalStorage(key, payload);
                    }
                    ui.showMessageBox(self.lng_delInfoSaved);
                    
                    // set the counter after saving
                    var cnt1 = 0;
                    cnt1 = containSavedDelivery();
                    self.getDataSyncCount(cnt1);

                } catch (e) {
                    console.error(e);
                    ui.showMessageBox(self.lng_error_00017);
                }
            };            
            
            function containSavedDelivery() {
                var deliveryKey = service.getOfflineKey();
                var dataJSON = ui.getLocalStorage(deliveryKey);

                if (typeof dataJSON !== "undefined") {
                    if (!Array.isArray(dataJSON)) {
                        dataJSON = ko.utils.unwrapObservable(dataJSON);
                    }
                    if (dataJSON.length == 0) return 0;
                    return dataJSON['data'].length;
                }
                return 0;
            }            
            
            function initTranslation() {
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_documentType = getTranslation("ssa.delivery.documentType");
                self.lng_deliveryNote = getTranslation("ssa.delivery.deliveryNote");
                self.lng_pickup = getTranslation("ssa.delivery.pickup");                
                self.lng_deliveryDetail = getTranslation("ssa.deliveryDetail.deliveryDetail");
                self.lng_shipmentDetail = getTranslation("ssa.deliveryDetail.shipmentDetail");
                self.lng_overview = getTranslation("ssa.deliveryDetail.overview");
                self.lng_itemDetail = getTranslation("ssa.deliveryDetail.itemDetail");
                self.lng_lot = getTranslation("ssa.deliveryDetail.lot");
                self.lng_qty = getTranslation("ssa.deliveryDetail.qty");
                self.lng_confirm = getTranslation("ssa.deliveryDetail.confirm");
                self.lng_partialConfirm = getTranslation("ssa.deliveryDetail.partialConfirm");
                self.lng_confirmByCash = getTranslation("ssa.deliveryDetail.confirmByCash");                
                self.lng_confirmByCheque = getTranslation("ssa.deliveryDetail.confirmByCheque");    
                self.lng_confirmByOthers = getTranslation("ssa.deliveryDetail.confirmByOthers");
                self.lng_confirmProceed = getTranslation("ssa.deliveryDetail.confirmProceed");
                self.lng_proceedDelivery = getTranslation("ssa.msg.info.proceedDelivery");
                self.lng_error_00005 = getTranslation("ssa.msg.error.ERROR_00005");
                self.lng_error_00013 = getTranslation("ssa.msg.error.ERROR_00013");
                self.lng_error_00014 = getTranslation("ssa.msg.error.ERROR_00014");
                self.lng_error_00017 = getTranslation("ssa.msg.error.ERROR_00017");     
                self.lng_delInfoSaved = getTranslation("ssa.msg.info.delInfoSaved");    
                self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                self.lng_partialDelivery = getTranslation("ssa.msg.info.partialDelivery");
                self.lng_originalQty = getTranslation("ssa.deliveryDetail.originalQty");
            }
            
        }
        return DeliveryDetailViewModel;
    }
);