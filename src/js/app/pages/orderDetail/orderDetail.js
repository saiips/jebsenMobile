define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/orderDetail/orderDetailService',
    'pages/common/cartService', 'util/appui', 'pages/common/constant', 'pages/checkOut/checkOutService', 'pages/common/maintenance',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton',
    'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojnavigationlist', 'promise'],
        function (oj, ko, $, app, service, cartService, ui, constant, checkOutService, maintenance) {

            function OrderDetailViewModel() {
                var self = this;

                console.log("OrderDetailViewModel");

                // router configuration
                self.router = app.router;

                // constant variables
                var RESPONSE_TABLE = 'P_ORDER_LINES_TBL_ITEM';
                
                var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                
                /**
                 * Observable Arrays
                 */
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
                self.paymentMethod = ko.observable();
                self.showButtons = ko.computed(function() {
                    return (app.moduleConfig.params.rootContext.isDailyOrderSummary == true) ? false: true;
                });
                
                self.subtotal = ko.observable();
                self.totalItems = ko.observable();
                self.showLastSyncDate = ko.observable(false);
                self.isSavedOrder = ko.observable(false);
                self.showDeliveryIcon = ko.computed(function() {
                    return !app.moduleConfig.params.rootContext.isDataSync; 
                })
                
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
                    console.log("orderDetail.js parentRouter=" + parentRouter.currentState().value);
                    console.log(">>>>>> originalCart = " + ko.toJSON(app.moduleConfig.params.rootContext.originalCart));
                    if (app.moduleConfig.params.rootContext.originalCart) {
                        // reset the cart
                        self.cart.removeAll();
                        // restore the cart 
                        // var originalCart = app.moduleConfig.params.rootContext.originalCart;
                        // self.cart = cartService.restoreCart(originalCart);
                        app.moduleConfig.params.rootContext.originalCart = ko.observableArray([]);
                    }

                    var childRouter = parentRouter.getChildRouter("orderDetail");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('orderDetail');
                    }  
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set currHeaderId
                                    self.currHeaderId(stateId);
                                    console.log("orderDetail.js stateId=" + stateId);
                                }
                            });
                            return state;
                        }
                    });
                    
                    initTranslations();
                    
                    initShipmentMethod();
                    
                    return oj.Router.sync();
                };

                function getPayload(newHeaderId) {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var payload = JSON.stringify({
                        "InputGetOrderLineList": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": orgUnitId,
                            "P_HEADER_ID": newHeaderId
                        }
                    });
                    return payload;
                }

                // load order details
                self.currHeaderId.subscribe(function (newHeaderId) {
                    ui.showBusy();
                    console.log("load order detail with oe header id " + newHeaderId);
                    var isMaintenance = maintenance.isMaintenance();
                    console.log("isOnline = " + isOnline);
                    console.log("isMaintenance = " + isMaintenance);
                    console.log("isDataSync = " + isDataSync());
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (isOnline && !isMaintenance && !isDataSync()) {
                        fetchData(newHeaderId, constant.PAGE_REFRESH);
                    } else if (!isDataSync()) {
                        fetchData(newHeaderId, constant.PAGE_INITIAL);
                    } else if (isDataSync()) {
                        fetchData(newHeaderId, constant.PAGE_DATASYNC);
                    }
                });



                function fetchData(newHeaderId, operation) {
                    // remove all shopping cart
                    self.cart.removeAll();
                    self.order.removeAll();
                    // self.shipmentMethods = {};

                    function cbSuccessFn(data, xhr) {
                        prepareUI(data, xhr);
                    }
                    function cbFailFn(data, xhr) {
                        console.log("cbFailFn failed");
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00016);
                    }
                    if (operation === constant.PAGE_INITIAL) {
                        service.getOrderDetailMessage(getPayload(newHeaderId)).then(cbSuccessFn, cbFailFn);
                    } else if (operation === constant.PAGE_REFRESH) {
                        service.refreshOrderDetailMessage(getPayload(newHeaderId)).then(cbSuccessFn, cbFailFn);
                    } else if (operation === constant.PAGE_DATASYNC) {
                        service.getDataSyncMessage().then(cbSuccessFn, cbFailFn);
                    }

                    var key = constant.ORDER_LINES_KEY + ":" + orgUnitId + ":" +
                            newHeaderId + ":" + constant.ORDER_DETAIL_SYNC_DATETIME;
                    var data = ui.getLocalStorage(key);
                    if (data) {
                        self.syncDatetime(data);
                        self.showLastSyncDate(true);
                    }
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
                
                function prepareUI(data, xhr) {
                    console.log("raw data = " + ko.toJSON(data));
                    try {
                        if (data !== null && xhr.status == 200) {
                            var respJSON;
                            var isArray = Array.isArray(data[RESPONSE_TABLE]);

                            if (!isArray) {
                                var temp = new Array();
                                temp.push(data[RESPONSE_TABLE]);
                                respJSON = temp;
                            } else {
                                respJSON = data[RESPONSE_TABLE];
                            }
                            
                            // fill order information
                            var order = cartService.getOrder();
                            fillOrderInfo(order);
                            
                            
                            // get the data set if it is from dataSync
                            if (isDataSync()) {
                                respJSON = data.data;
                            }
                            
                            console.log(">>>>>order detail = " + ko.toJSON(respJSON));

                            // order detail - add to the cart array
                            var subtotal = 0;
                            var totalitems = 0;
                            ko.utils.arrayMap(respJSON, function (item) {
                                // shipping method
                                var shipmentMethodDisplay = self.shipmentMethods[item.SHIPPING_METHOD];
                                console.log("item.SHIPPING_METHOD =" + item.SHIPPING_METHOD);
                                console.log(">>>> meaning = " + shipmentMethodDisplay);
                                // schedule ship date
                                var shipDate = (item.SCHEDULE_SHIP_DATE == constant.BLANK_DATE) ? "" : item.SCHEDULE_SHIP_DATE;
                                var cart_item = cartService.createCartItem(item, item.ORDERED_QUANTITY, false, shipDate, item.ORIGINAL_LINE, new Array(), item.SUBINVENTORY, item.SHIPPING_METHOD, shipmentMethodDisplay);
                                self.cart.push(cart_item);

                                subtotal += cart_item.cost();
                                totalitems++;
                            });
                            console.log("self.cart = " + ko.toJSON(self.cart));

                            self.totalItems(totalitems);
                            self.subtotal(subtotal);

                            app.moduleConfig.params.rootContext.orderDetail_state = "populated";

                            // backup the shopping cart
                            // var originalCart = cartService.cloneCart(self.cart);
                            // app.moduleConfig.params.rootContext.originalCart = originalCart;
                        }
                    } catch (e) {
                        ui.hideBusy();                        
                        console.error(e);
                    } finally {
                        ui.hideBusy();
                        console.log("cbSuccessFn called");
                        // Continue the Payment worflow for VAN Sales Order
                        self.continuePayment();
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


                // handle pull-to-refresh
                $(document).ready(
                        function ()
                        {
                            oj.PullToRefreshUtils.setupPullToRefresh('#orderDetail', function ()
                            {
                                var promise = new Promise(function (resolve, reject)
                                {
                                    if (self.isSavedOrder() === false) {
                                        fetchData(ko.utils.unwrapObservable(self.currHeaderId), constant.PAGE_REFRESH);
                                    }
                                    setTimeout(function () {
                                        resolve();
                                    }, 3000);
                                });
                                return promise;
                            }, {'primaryText': self.lng_primaryText, 'secondaryText': self.lng_secondaryText});

                            $('#orderDetail').on({
                                'ojdestroy': function ()
                                {
                                    oj.PullToRefreshUtils.tearDownPullToRefresh('#orderDetail');
                                }
                            });
                        }
                );

                /**
                 * Actions
                 */
                self.removeFromCart = function (cart_item, event) {
                    self.cart.remove(cart_item);
                };

                self.reOrder = function (data, event) {
                    // cartService.setCart(self.cart);
                    app.moduleConfig.params.rootContext.originalCart = ko.observableArray();
                    ko.utils.arrayMap(self.cart(), function(item) {
                        if (ko.utils.unwrapObservable(item.original) == "Y") {
                            // remove the shipment information for re-order case
                            item.shipmentMethod = "";
                            item.shipmentMethodDisplay = "";
                            item.subInventory = "";                            
                            app.moduleConfig.params.rootContext.originalCart.push(item);
                        }
                    });
                    app.moduleConfig.params.rootContext.isReOrder = true;
                    app.moduleConfig.params.rootContext.fromPage = "orderDetail";
                    var orderId = ko.utils.unwrapObservable(self.currHeaderId);
                    app.moduleConfig.params.rootContext.orderId = orderId;
                    app.moduleConfig.params.rootContext.newOrderNavStateId = 'newOrderItem';
                    app.redirect("newOrderItem", orderId);
                };
                
                self.showEraseButton = ko.computed(function () {
                    return (isDataSync());
                });                
                
                self.clearData = function (data, event) {
                    console.log("clear the offline data of sales order");
                    if (isDataSync()) {
                        if (confirm(self.lng_confirmClear)) {
                            // var fromPage = app.moduleConfig.params.rootContext.fromPage;
                            var order = app.moduleConfig.params.rootContext.savedOrder;
                            var payload = ko.toJS({status: "D", data: order.data});
                            app.moduleConfig.params.rootContext.savedOrder = payload;
                            app.go("dataSync");
                        }
                    }
                };  
                
                self.continuePayment = function (data, event) {
                    if (app.moduleConfig.params.rootContext.isContinuePayment) {
                        var paymentMethod = (self.paymentMethod() == "-1") ? constant.PAY_BY_OTHERS : self.paymentMethod();
                        var paymentParams = ko.toJS({HEADER_ID: self.currHeaderId(), ORDER_NUMBER: self.order_no(), FLOW_STATUS_CODE: self.status(), PAYMENT_TYPE: paymentMethod});
                        console.log("paymentParams=" + ko.toJSON(paymentParams));
                        cartService.setCart(self.cart);
                        app.moduleConfig.params.rootContext.paymentParameter = paymentParams;
                        app.redirect("payment", self.currHeaderId());
                    }
                };

                self.checkOut = function (data, event) {
                    // cartService.setCart(self.cart);
                    app.moduleConfig.params.rootContext.originalCart = ko.observableArray();
                    ko.utils.arrayMap(self.cart(), function(item) {
                        if (ko.utils.unwrapObservable(item.original) == "Y") {
                            // remove the shipment information for quick check out
                            item.shipmentMethod = "";
                            item.shipmentMethodDisplay = "";
                            item.subInventory = "";
                            app.moduleConfig.params.rootContext.originalCart.push(item);
                        }
                    });
                    app.moduleConfig.params.rootContext.isQuickCheckOut = true;
                    app.moduleConfig.params.rootContext.fromPage = "orderDetail";
                    app.moduleConfig.params.rootContext.orderId = ko.utils.unwrapObservable(self.currHeaderId);
                    app.redirect("checkOut", app.moduleConfig.params.rootContext.orderId);
                };

                self.payByCash = function (data, event) {
                    // cartService.setCart(self.cart);
                    app.moduleConfig.params.rootContext.originalCart = ko.observableArray();
                    ko.utils.arrayMap(self.cart(), function(item) {
                        app.moduleConfig.params.rootContext.originalCart.push(item);
                    });
                    app.moduleConfig.params.rootContext.fromPage = "orderDetail";
                    app.moduleConfig.params.rootContext.paymentMethod = constant.PAY_BY_CASH;
                    app.moduleConfig.params.rootContext.orderId = ko.utils.unwrapObservable(self.currHeaderId);
                    app.redirect("payment", app.moduleConfig.params.rootContext.orderId);
                };

                self.payByCheque = function (data, event) {
                    // cartService.setCart(self.cart);
                    app.moduleConfig.params.rootContext.originalCart =ko.observableArray();
                    ko.utils.arrayMap(self.cart(), function(item) {
                        app.moduleConfig.params.rootContext.originalCart.push(item);
                    });
                    app.moduleConfig.params.rootContext.fromPage = "orderDetail";
                    app.moduleConfig.params.rootContext.paymentMethod = constant.PAY_BY_CHEQUE;
                    app.moduleConfig.params.rootContext.orderId = ko.utils.unwrapObservable(self.currHeaderId);
                    app.redirect("payment", app.moduleConfig.params.rootContext.orderId);
                };

                self.deliveryList = function (data, event) {
                    app.moduleConfig.params.rootContext.fromPage = "orderDetail";
                    app.moduleConfig.params.rootContext.orderId = ko.utils.unwrapObservable(self.currHeaderId);
                    app.moduleConfig.params.rootContext.orderNumber = ko.utils.unwrapObservable(self.order_no);
                    var orderNo = ko.utils.unwrapObservable(self.order_no);
                    app.redirect("delivery", orderNo);
                };

                self.updateData = function (event, data) {
                    if (data['option'] === "value") {
                        // console.log("New Value : " + data.value);        //product.quantity
                        // console.log("Target ID : " + event.target.id);   // product.id
                        if (event.target.id) {
                            cartService.setCart(self.cart);
                        }
                    }
                };

                self.goBack = function () {
                    // go back to order history page by customer id
                    if (app.moduleConfig.params.rootContext.isDailyOrderSummary) {
                        app.go("dailyOrders");
                    } else {
                        console.log("isDataSync()=" + isDataSync());
                        if (!isDataSync()) {
                            var custId = app.moduleConfig.params.rootContext.custId;
                            app.redirect("orderHist", custId);
                        } else {
                            app.go("dataSync");                          
                        }
                    }
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };
                
                self.isOrderDeskAdmin = ko.computed(function () {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    if (user.salesRole == constant.SR_ADMIN) {
                        return true;
                    }
                    if (!app.moduleConfig.params.rootContext.isCordova) return true;
                    return false;
                });
                
                self.refresh = function() {
                    ui.showBusy();
                    fetchData(ko.utils.unwrapObservable(self.currHeaderId), constant.PAGE_REFRESH);
                };
                
                function isDataSync() {
                    return app.moduleConfig.params.rootContext.isDataSync;
                }                
                
                function fillOrderInfo(order) {
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
                    self.paymentMethod(ko.utils.unwrapObservable(order.payment_method));
                }

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
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
                    self.lng_confirmClear = getTranslation("ssa.checkOut.confirmClear");
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

            return OrderDetailViewModel;
        }
);
