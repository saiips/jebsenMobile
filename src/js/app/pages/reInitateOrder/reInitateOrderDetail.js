define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/reInitateOrder/reInitateOrderService',
    'pages/common/cartService', 'util/appui', 'pages/common/constant', 'pages/checkOut/checkOutService', 'pages/common/maintenance', 'util/commonhelper',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton',
    'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojnavigationlist', 'promise'],
        function (oj, ko, $, app, service, cartService, ui, constant, checkOutService, maintenance, helper) {

            function reInitateOrderDetailDetailViewModel() {
                var self = this;

                console.log("reInitateOrderDetailDetailViewModel");

                // router configuration
                self.router = app.router;

                // constant variables
                var RESPONSE_TABLE = 'InputCreateBeerOrder';
                
                /**
                 * Observable Arrays
                 */
                self.refNo = ko.observable();
                self.cust_name = ko.observable();
                self.order_no = ko.observable();
                self.purchase_order = ko.observable();
                self.order_date = ko.observable();
                self.remarks = ko.observable();
                self.delivery_cost = ko.observable();
                self.shipping_address = ko.observable();
                self.billing_address = ko.observable();
                self.status = ko.observable();
                self.currHeaderId = ko.observable();
                self.syncDatetime = ko.observable();
                self.showMSButton = ko.observable();
                self.showVSPayButton = ko.observable();
                self.shipmentMethods = {};
                self.showButtons = ko.computed(function() {
                    return true;
                });
                
                self.subtotal = ko.observable();
                self.totalItems = ko.observable();
                self.showLastSyncDate = ko.observable(false);
                self.isSavedOrder = ko.observable(false);
                
                self.isHidenForVanSale = ko.computed(function () {
                    var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    if (salesRole == constant.SR_SALE_VAN) return false;
                    return true;
                });

                // shopping cart
                self.cart = ko.observableArray([]);

                // order header
                self.order = ko.observableArray([]);
                
                self.handleActivated = function (info) {
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("reInitateOrderDetail.js parentRouter=" + parentRouter.currentState().value);
                    console.log(">>>>>> originalCart = " + ko.toJSON(app.moduleConfig.params.rootContext.originalCart));
                    if (app.moduleConfig.params.rootContext.originalCart) {
                        // reset the cart
                        self.cart.removeAll();
                        app.moduleConfig.params.rootContext.originalCart = ko.observableArray([]);
                    }

                    var childRouter = parentRouter.getChildRouter("reInitateOrderDetail");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('reInitateOrderDetail');
                    }  
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set currHeaderId
                                    self.currHeaderId(stateId);
                                    console.log("reInitateOrderDetail.js stateId=" + stateId);
                                }
                            });
                            return state;
                        }
                    });
                    
                    initTranslations();
                    
                    initShipmentMethod();
                    
                    return oj.Router.sync();
                };

                // load order details
                self.currHeaderId.subscribe(function (newHeaderId) {
                    ui.showBusy();
                    console.log("load order detail with oe header id " + newHeaderId);
                    var isMaintenance = maintenance.isMaintenance();
                    console.log("isOnline = " + isOnline);
                    console.log("isMaintenance = " + isMaintenance);
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (isOnline && !isMaintenance) {
                        fetchData(newHeaderId, constant.PAGE_REFRESH);
                    } else {
                        fetchData(newHeaderId, constant.PAGE_INITIAL);
                    }
                });



                function fetchData(newHeaderId, operation) {
                    // remove all shopping cart
                    self.cart.removeAll();
                    self.order.removeAll();

                    prepareUI(newHeaderId);
                }

                function initShipmentMethod() {
                    console.log("initShipmentMethod");
                    var cbSuccessFn = function (data, xhr) {
                        console.log("cbSuccessFn");
                        if (data !== null && xhr.status == 200) {
                            var respJSON = data['P_SHIPPING_METHOD_TBL']['P_SHIPPING_METHOD_TBL_ITEM'];
                            if (!Array.isArray(respJSON)) {
                                var temp = new Array();
                                temp.push(respJSON);
                                respJSON = temp;
                            }
                            ko.utils.arrayMap(respJSON, function (item) {
                                if (item.SHIPPING_METHOD == "-1") {
                                    self.shipmentMethods[item.SHIPPING_METHOD] = "";
                                } else {
                                    self.shipmentMethods[item.SHIPPING_METHOD] = item.MEANING;
                                }
                            });
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn");
                    };
                    checkOutService.getShipmentMethodMessage().then(cbSuccessFn, cbFailFn);
                }                
                
                function prepareUI(newHeaderId) {
                    try {
                        // get back the headerIdMap
                        var headerIdMap = app.moduleConfig.params.rootContext.headerIdMap;
                        var data = headerIdMap[newHeaderId];
                        var id = data['JsOrderTxnId'];
                        var status = data['TxnStatus'];
                        var orderDate = data['CreatedDate'];
                        orderDate = helper.formatStrDate(orderDate, "YYYY-MM-DDTHH:mm:ss.SSSZ", "YYYY/MM/DD");
                        var respJSON = data['Payload'][RESPONSE_TABLE];
                        var headerJSON = respJSON['I_HEADER_REC'];
                        var detailJSON = respJSON['I_LINE_TBL']['I_LINE_TBL_ITEM'];
                        if (!Array.isArray(detailJSON)) {
                            var temp = new Array();
                            temp.push(detailJSON);
                            detailJSON = temp;
                        }                        
                        console.log("respJSON=" + ko.toJSON(respJSON));
                        
                        // set the reference no
                        self.refNo(id);
                        
                        // create template field for display purpose
                        headerJSON.HEADER_FLOW_STATUS_CODE = status;
                        headerJSON.ORDERED_DATE = orderDate;
                        headerJSON.ORDER_NUMBER = id;

                        // fill order information
                        var order = cartService.createOrder(headerJSON);
                        fillOrderInfo(order);

                        console.log(">>>>>order detail = " + ko.toJSON(detailJSON));

                        // order detail - add to the cart array
                        var subtotal = 0;
                        var totalitems = 0;
                        ko.utils.arrayMap(detailJSON, function (item) {
                            // shipping method
                            var shipmentMethodDisplay = self.shipmentMethods[item.SHIPPING_METHOD];
                            console.log("item.SHIPPING_METHOD =" + item.SHIPPING_METHOD);
                            console.log(">>>> meaning = " + shipmentMethodDisplay);
                            // schedule ship date
                            var _shipDate = item.SCHEDULE_SHIP_DATE;
                            var shipDate = "";
                            try {
                                shipDate = helper.formatStrDate(_shipDate, "YYYY-MM-DDTHH:mm:ss.SSSZ", "DD-MMM-YYYY");
                            } catch (ex) {
                            }                            
                            var shipDate = (item.SCHEDULE_SHIP_DATE == constant.BLANK_DATE) ? "" : shipDate;
                            var cart_item = cartService.createCartItem(item, item.ORDERED_QUANTITY, false, shipDate, item.ORIGINAL_LINE, new Array(), item.SUBINVENTORY, item.SHIPPING_METHOD, shipmentMethodDisplay);
                            self.cart.push(cart_item);

                            subtotal += cart_item.cost();
                            totalitems++;
                        });
                        console.log("self.cart = " + ko.toJSON(self.cart));

                        self.totalItems(totalitems);
                        self.subtotal(subtotal);

                    } catch (e) {
                        ui.hideBusy();                        
                        console.error(e);
                    } finally {
                        ui.hideBusy();
                        console.log("cbSuccessFn called");
                    }
                }

                /**
                 * Computed Observables
                 */
                self.total = ko.computed(function () {
                    var total = 0;

                    var deliveryCost = ko.utils.unwrapObservable(self.delivery_cost);
                    var subtotal = ko.utils.unwrapObservable(self.subtotal());
                    total = new Number(deliveryCost) + subtotal;

                    return total;
                });

                /**
                 * Actions
                 */
                self.goBack = function () {
                    app.go("reInitateOrder");
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };
                
                self.cancel = function() {
                    console.log("cancel trigger");
                    if (confirm(self.lng_confirmCancel)) {
                        ui.showBusy();
                        
                        var user = app.moduleConfig.params.rootContext.userProfile;
                        var payload = JSON.stringify({
                            "InputCancelFailedOrder": {
                                "HeaderInfo": {
                                    "UserID": user.username,
                                    "UserRole": user.salesRole,
                                    "CallerID": ""
                                },
                                "OrderTxnID": self.refNo()
                            }
                        });
                        console.log("cancel failed order pyalod = " + ko.toJS(payload));
                        
                        var cbSuccessFn = function (data, xhr) {
                            console.log("raw data = " + ko.toJSON(data));
                            try {
                                if (data !== null && xhr.status == 200) {
                                    var respJSON = data['OutputParameters'];
                                    var status = respJSON['O_RESULT_CODE'];
                                    if (status != 'S') {
                                        ui.showMessageBox(self.lng_error_00029);
                                    } else {
                                        ui.showMessageBox(self.lng_cancelSuccess);
                                        app.moduleConfig.params.rootContext.isReInitateRefresh = true;
                                        app.go("reInitateOrder");
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                            } finally {
                                console.log("cbSuccessFn called");
                                ui.hideBusy();

                            }
                        };
                        var cbFailFn = function (data, xhr) {
                            console.log("cbFailFn failed");
                            ui.showMessageBox(self.lng_error_00029);
                            ui.hideBusy();
                        };                        
                        service.cancelFailedOrderMessage(payload).then(cbSuccessFn, cbFailFn);
                    }
                };
                
                self.reInitiate = function() {
                    console.log("reInitiate trigger");
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }                    
                    if (confirm(self.lng_confirmReInitate)) {
                        ui.showBusy();
                        
                        var user = app.moduleConfig.params.rootContext.userProfile;
                        var payload = JSON.stringify({
                            "InputReinitiateOrder": {
                                "HeaderInfo": {
                                    "UserID": user.username,
                                    "UserRole": user.salesRole,
                                    "CallerID": ""
                                },
                                "OrderTxnID": self.refNo()
                            }
                        });
                        console.log("Re-Initiate failed order pyalod = " + ko.toJS(payload));
                        
                        var cbSuccessFn = function (data, xhr) {
                            console.log("raw data = " + ko.toJSON(data));
                            try {
                                if (data !== null && xhr.status == 200) {
                                    var respJSON = data['OutputReinitiateOrder'];
                                    var status = respJSON['ReturnStatus'];
                                    var returnMessage = respJSON['ReturnMessage'];
                                    if (status != 'S') {
                                        ui.showMessageBox(self.lng_error_00030);
                                    } else {
                                        ui.showMessageBox(self.lng_reInitateSuccess);
                                        app.moduleConfig.params.rootContext.isReInitateRefresh = true;
                                        app.go("reInitateOrder");
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                            } finally {
                                console.log("cbSuccessFn called");
                                ui.hideBusy();
                            }
                        };
                        var cbFailFn = function (data, xhr) {
                            console.log("cbFailFn failed");
                            ui.showMessageBox(self.lng_error_00030);
                            ui.hideBusy();
                        };                        
                        service.reInitiateFailedOrderMessage(payload).then(cbSuccessFn, cbFailFn);                        
                    }
                };
                
                function fillOrderInfo(order, createDate) {
                    // debug purpose
                    console.log(">>>>> order Info = " + ko.toJSON(order));

                    // order master
                    self.cust_name(ko.utils.unwrapObservable(order.cust_name));
                    self.order_no(ko.utils.unwrapObservable(order.order_no));
                    self.purchase_order(ko.utils.unwrapObservable(order.purchase_order));
                    self.order_date(ko.utils.unwrapObservable(order.order_date));
                    self.remarks(ko.utils.unwrapObservable(order.remarks));
                    self.delivery_cost(ko.utils.unwrapObservable(order.delivery_cost));
                    self.shipping_address(ko.utils.unwrapObservable(order.shipping_address));
                    self.billing_address(ko.utils.unwrapObservable(order.billing_address));
                    self.status(ko.utils.unwrapObservable(order.status));
                }

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_overrideDeliverySchedule = getTranslation("ssa.checkOut.overrideDeliverySchedule");
                    self.lng_orderDetail = getTranslation("ssa.orderDetail.orderDetail");
                    self.lng_lastSyncDate = getTranslation("ssa.header.lastSyncDate");
                    self.lng_overview = getTranslation("ssa.orderDetail.overview");
                    self.lng_orderNo = getTranslation("ssa.orderDetail.orderNo");
                    self.lng_purchaseOrder = getTranslation("ssa.orderDetail.purchaseOrder");
                    self.lng_orderDate = getTranslation("ssa.orderDetail.orderDate");
                    self.lng_totalItems = getTranslation("ssa.orderDetail.totalItems");
                    self.lng_total = getTranslation("ssa.orderDetail.total");
                    self.lng_remarks = getTranslation("ssa.orderDetail.remarks");
                    self.lng_itemDetail = getTranslation("ssa.orderDetail.itemDetail");
                    self.lng_deliveryStatus = getTranslation("ssa.orderDetail.deliveryStatus");
                    self.lng_subInventory = getTranslation("ssa.orderDetail.subInventory");
                    self.lng_shipmentDate = getTranslation("ssa.orderDetail.shipmentDate");
                    self.lng_shipmentMethod = getTranslation("ssa.orderDetail.shipmentMethod");                    
                    self.lng_lot = getTranslation("ssa.orderDetail.lot");
                    self.lng_qty = getTranslation("ssa.orderDetail.qty");
                    self.lng_deliveryCost = getTranslation("ssa.orderDetail.deliveryCost");
                    self.lng_orderSummary = getTranslation("ssa.orderDetail.orderSummary");
                    self.lng_shippingAddress = getTranslation("ssa.orderDetail.shippingAddress");
                    self.lng_billingAddress = getTranslation("ssa.orderDetail.billingAddress");
                    self.lng_reOrder = getTranslation("ssa.orderDetail.reOrder");
                    self.lng_quickCheckOut = getTranslation("ssa.orderDetail.quickCheckOut");
                    self.lng_payByCash = getTranslation("ssa.orderDetail.payByCash");
                    self.lng_payByCheque = getTranslation("ssa.orderDetail.payByCheque");
                    self.lng_error_00016 = getTranslation("ssa.msg.error.ERROR_00016");
                    self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                    self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");
                    self.lng_cancel = getTranslation("ssa.reInitateOrderDetail.cancel");
                    self.lng_reInitate = getTranslation("ssa.reInitateOrderDetail.reInitate");
                    self.lng_confirmCancel = getTranslation("ssa.reInitateOrderDetail.confirmCancel");
                    self.lng_confirmReInitate = getTranslation("ssa.reInitateOrderDetail.confirmReInitate");
                    self.lng_reason = getTranslation("ssa.orderHistory.reason");
                    self.lng_refNo = getTranslation("ssa.orderHistory.refNo"); 
                    self.lng_cancelSuccess = getTranslation("ssa.msg.info.cancelSuccess"); 
                    self.lng_error_00029 = getTranslation("ssa.msg.error.ERROR_00029");
                    self.lng_reInitateSuccess = getTranslation("ssa.msg.info.reInitateSuccess");
                    self.lng_error_00030 = getTranslation("ssa.msg.error.ERROR_00030");
                    self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                }
            }

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

            ko.bindingHandlers.readOnly = {
                update: function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor());
                    if (value) {
                        element.setAttribute("readOnly", true);
                    } else {
                        element.removeAttribute("readOnly");
                    }
                }
            };

            return reInitateOrderDetailDetailViewModel;
        }
);
