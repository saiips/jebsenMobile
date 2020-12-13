define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/data', 'pages/loading/loadingService', 'pages/common/constant', 'util/appui', 'pages/common/maintenance', 'pages/delivery/deliveryService',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox',
    'ojs/ojlistview', 'ojs/ojmodel', 'ojs/ojpagingcontrol', 'ojs/ojpagingcontrol-model',
    'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
    function (oj, ko, $, app, data, service, constant, ui, maintenance, deliveryService) {
        var searchCanvas;

        searchCanvas = {
            "selector": "#searchCanvas",
            "edge": "top",
            "displayMode": "push",
            "size": "63px",
            "modality": "modeless",
            "autoDismiss": "none"
        };
        
        function LoadingDetailViewModel() {
            var self = this;
            
            console.log("LoadingDetailViewModel");
            
            var RESPONSE_TABLE = "P_SHIPMENT_DETAILS_TBL_ITEM";

            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            self.headerTitle = ko.observable();
            self.allDeliveryItem = ko.observableArray([]);
            self.currDeliveryNumber = ko.observable();
            self.documentType = ko.observable();
            self.orgUnitId = ko.observable();
            self.delivery_no = ko.observable();
            self.deliveryDate = ko.observable();
            self.outletName = ko.observable();
            self.deliveryAddress = ko.observable();
            self.orderNumber = ko.observable();
            self.carPlateNumber = ko.observable();
            self.isDummyRole = ko.computed(function() {
                var user = app.moduleConfig.params.rootContext.userProfile;
                if (typeof user === "undefined" || user.salesRole == constant.SR_DUMMY) {
                    return true;
                }
                return false;
            });
            self.isDriverRole = ko.computed(function () {
                var user = app.moduleConfig.params.rootContext.userProfile;
                if (user.salesRole == constant.SR_DRIVER_JLOG || user.salesRole == constant.SR_DRIVER_LINDE)
                    return true;
               return false; 
            });            
            
            self.isCODPayment = ko.computed(function () {
                var user = app.moduleConfig.params.rootContext.userProfile;
                // return false if userProfile is undefined
                if (typeof user === "undefined") return false;
                
                // return false if DRIVER role
                if (user.salesRole == constant.SR_DRIVER_JLOG || user.salesRole == constant.SR_DRIVER_LINDE || user.salesRole == constant.SR_DUMMY) return false;
                
                var selDelivery = app.moduleConfig.params.rootContext.selDeliveryProfile;
                if (ko.utils.unwrapObservable(selDelivery.paymentTerm) == constant.PAYMENT_TERM) return true;
                return false;
            });
            self.buttonEnabled = ko.observable();
            self.qtyModifyEnabled = ko.observable();
            
            self.handleActivated = function (info) {
                var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                console.log("loadingDetail.js parentRouter=" + parentRouter.currentState().value);

                var childRouter = parentRouter.getChildRouter("loadingDetail");
                if (!childRouter) {
                    childRouter = parentRouter.createChildRouter('loadingDetail');
                }      
                self.router = childRouter.configure(function (stateId) {
                    if (stateId) {
                        var state = new oj.RouterState(stateId, {value: stateId,
                            enter: function () {
                                // Set currOrderId
                                self.currDeliveryNumber(stateId);
                                console.log("loadingDetail.js stateId=" + stateId);
                            }
                        });
                        return state;
                    }
                });  
                
                initTranslation();
                
                headerSetup();
                
                return oj.Router.sync();
            };
            
            function headerSetup() {
                // get the seleced delivery profile for header Title
                var selDelivery = app.moduleConfig.params.rootContext.selDeliveryProfile;  
                if (typeof selDelivery !== "undefined") {
                    self.headerTitle(ko.utils.unwrapObservable(selDelivery.delivery_no));
                } else {
                    self.headerTitle(self.lng_loadingDetail);
                }
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
                init();
                getDeliveryDetail(newDeliveryNumber);
            });
            
            function getDeliveryDetail(newDeliveryNumber) {
                var deliveryDetail = app.moduleConfig.params.rootContext.selDeliveryProfile.deliveryDetail;
                if (ko.isObservable(deliveryDetail)) deliveryDetail = ko.utils.unwrapObservable(deliveryDetail);
                console.log("deliveryDetail = " + ko.toJSON(deliveryDetail));
                
                if (deliveryDetail) {
                    ko.utils.arrayMap(deliveryDetail, function (item) { 
                        item.MAXQTY = item.QTY;
                        item.QTY = null;
                        item.LOT_NUMBER = (item.LOT_NUMBER == "-1") ? "" : item.LOT_NUMBER;
                        self.allDeliveryItem.push(item);
                    });
                }                
            }

            
            function init() {
                console.log("loadingDetail.js init() started");
                var selDelivery = app.moduleConfig.params.rootContext.selDeliveryProfile;
                if (selDelivery) {
                    console.log("selDelivery=" + ko.toJSON(selDelivery));
                    self.documentType(ko.utils.unwrapObservable(selDelivery.documentType));
                    self.orgUnitId(ko.utils.unwrapObservable(selDelivery.orgUnitId));
                    self.delivery_no(ko.utils.unwrapObservable(selDelivery.delivery_no));
                    self.deliveryDate(ko.utils.unwrapObservable(selDelivery.deliveryDate));
                    self.outletName(ko.utils.unwrapObservable(selDelivery.outletName));
                    self.deliveryAddress(ko.utils.unwrapObservable(selDelivery.deliveryAddress));
                    self.orderNumber(ko.utils.unwrapObservable(selDelivery.orderNumber));
                    self.carPlateNumber(ko.utils.unwrapObservable(selDelivery.carPlateNumber));
                }
                
                var role = app.moduleConfig.params.rootContext.userProfile.salesRole;
                if(role == constant.SR_DRIVER_JLOG || role == constant.SR_DRIVER_LINDE || role == constant.SR_DUMMY) {
                    self.buttonEnabled(true);
                    self.qtyModifyEnabled(true);
                } else if (role == constant.SR_ADMIN_JLOG) {
                    self.buttonEnabled(false);
                    self.qtyModifyEnabled(false);
                }                 
            }
            
            self.goBack = function () {
                var fromPage = app.moduleConfig.params.rootContext.fromPage;
                app.go(fromPage);
            };

            self.dispose = function (info) {
                self.router.dispose();
            };
            
            self.confirmShipment = function() {
                confirmGoodsLoading("FULL");
            };
            
            self.partialConfirmShipment = function() {
                confirmGoodsLoading(null);
            };
            
            self.confirmCash = function() {
                confirmGoodsLoading(constant.PAY_BY_CASH);
            };
            
            self.confirmCheque = function() {
                confirmGoodsLoading(constant.PAY_BY_CHEQUE);
            };
            
            self.confirmOthers = function() {
                confirmGoodsLoading(constant.PAY_BY_OTHERS);
            };
            
            self.close = function() {
                // if (confirm(self.lng_confirmExit)) {
                //    closeWindows();
                // }
            };
            
            self.remove = function () {
                if (confirm(self.lng_confirmProceed)) {
                    ui.showBusy();
                    console.log("Remove " + self.carPlateNumber() + " form the document " + self.delivery_no());
                    
                    var payload = getUnLoadingPayload();
                    console.log("Remove Payload = " + ko.toJS(payload));
                    
                    service.getUnLoadingMessage(payload).done(function(data) {
                        ui.hideBusy();
                        console.log("raw data=" + ko.toJSON(data));
                        var returnStatus = data['P_RETURN_STATUS'];
                        if (returnStatus != "S") {
                            ui.showMessageBox(self.lng_error_00027);
                            return;                            
                        } 
                        app.moduleConfig.params.rootContext.selDeliveryProfile.removed = true;
                        var fromPage = app.moduleConfig.params.rootContext.fromPage;
                        app.go(fromPage);                        
                    }).fail(function(error) {
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00027);
                        return;
                    });

                }
            };
            
            function getUnLoadingPayload() {
                var orgUnitId = self.orgUnitId();
                if (!orgUnitId || typeof orgUnitId === "undefined") orgUnitId = constant.ORG_UNIT_ID_BEER;
                var documentType = self.documentType();
                var licenseNo = self.carPlateNumber();
                var barcodeNo = self.delivery_no();
                var payload = service.getUnLoadingPayload(orgUnitId, documentType, licenseNo, barcodeNo);
                return payload;
            }
            
            function confirmGoodsLoading(paymentType) {
                console.log("confirmGoodsLoading clicked");
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
                
                proceedShipConfirm(paymentType);
            }
            
            function proceedShipConfirm(paymentType) {
                ui.showBusy();
                // get the confirm goods loading payload
                var payload = deliveryService.getConfirmGoodsLoadingPayload(self.orgUnitId(), self.documentType(), self.delivery_no(), self.allDeliveryItem(), paymentType);
                console.log("confirm goods loading payload = " + ko.toJS(payload));

                var cbSuccessFn = function (data, xhr) {
                    var returnStatus, returnMessage, respJSON;
                    try {
                        if (xhr.status == 200 && data != null) {
                            respJSON = data['OutputDNRMAConfirm'];
                            returnStatus = respJSON['ReturnStatus'];
                            returnMessage = respJSON['ReturnMessage'];
                            if ("S" == returnStatus || "W" == returnStatus) {
                                ui.showMessageBox(self.lng_proceedDelivery);
                                // app.redirect("loading");
                                self.buttonEnabled(false);
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
                deliveryService.confirmGoodsLoadingMessage(payload).then(cbSuccessFn, cbFailFn);                   
            }
            
            function initTranslation() {
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_loadingDetail = getTranslation("ssa.loading.detail");
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
                self.lng_partialDelivery = getTranslation("ssa.msg.info.partialDelivery");                
                self.lng_proceedDelivery = getTranslation("ssa.msg.info.proceedDelivery");
                self.lng_error_00005 = getTranslation("ssa.msg.error.ERROR_00005");
                self.lng_error_00013 = getTranslation("ssa.msg.error.ERROR_00013");
                self.lng_error_00014 = getTranslation("ssa.msg.error.ERROR_00014");
                self.lng_error_00017 = getTranslation("ssa.msg.error.ERROR_00017");     
                self.lng_delInfoSaved = getTranslation("ssa.msg.info.delInfoSaved");    
                self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                self.lng_error_00027 = getTranslation("ssa.msg.error.ERROR_00027");
                self.lng_delInfoSaved = getTranslation("ssa.msg.info.delInfoSaved");    
                self.lng_confirmExit = getTranslation("ssa.msg.info.confirmExit");
                self.lng_originalQty = getTranslation("ssa.deliveryDetail.originalQty");
            }
            
        }
        return LoadingDetailViewModel;
    }
);