define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/checkOut/checkOutService',
    'pages/common/cartService', 'util/appui', 'pages/common/constant', 'pages/common/maintenance','pages/common/receiptService',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton',
    'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojnavigationlist', 'promise'],
        function (oj, ko, $, app, service, cartService, ui, constant, maintenance, receiptService) {

            function PaymentViewModel() {
                var self = this;

                console.log("PaymentViewModel");

                // router configuration
                self.router = app.router;

                /**
                 * Observable Arrays
                 */
                self.cust_no = ko.observable();
                self.outletName = ko.observable();
                self.paymentType = ko.observable();
                self.cust_name = ko.observable();
                self.order_no = ko.observable();
                self.purchase_order = ko.observable();
                self.order_date = ko.observable();
                self.remarks = ko.observable();
                self.delivery_cost = ko.observable();
                self.shipping_address = ko.observable();
                self.billing_address = ko.observable();
                self.ship_to_district = ko.observable();
                self.status = ko.observable();
                self.currHeaderId = ko.observable();
                self.headerTitle = ko.observable();
                self.subTitle = ko.observable();
                self.real_customer = ko.observable();
                self.showRealCustomer = ko.computed(function () {
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    if (ko.utils.unwrapObservable(customerProfile.walkInCust) == "Y")
                        return true;
                    return false;
                });      
                
                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });                

                // shopping cart
                self.cart = ko.observableArray([]);

                // order header
                self.order = ko.observableArray([]);

                self.handleActivated = function (info) {
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("Payment.js parentRouter=" + parentRouter.currentState().value);

                    var childRouter = parentRouter.getChildRouter("payment");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('payment');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set currHeaderId
                                    self.currHeaderId(stateId);
                                    console.log("payment.js stateId=" + stateId);
                                }
                            });
                            return state;
                        }
                    });

                    init();

                    return oj.Router.sync();
                };

                function init() {
                    
                    console.log("isDataSync = " + isDataSync());
                    
                    initTranslations();

                    setHeader();

                    fillOrder();

                    fillOrderItem();
                    
                    // print receipt (by default)
                    if (!app.moduleConfig.params.rootContext.isContinuePayment) {
                        proceedPrint();
                    }
                }
                
                function isDataSync() {
                    return app.moduleConfig.params.rootContext.isDataSync;
                }
                
                function setHeader() {
                    // get the seleced customer profile for header Title
                    var selCustomer = app.moduleConfig.params.rootContext.selCustomerProfile;
                    if (typeof selCustomer !== "undefined") {
                        var outletName = ko.utils.unwrapObservable(selCustomer.outletName);
                        if (!ko.utils.unwrapObservable(self.large())) {
                            if (outletName && outletName.length > constant.TITLE_LENGTH) {
                                outletName = outletName.substring(0, constant.TITLE_LENGTH) + "...";
                            }
                        }
                        self.headerTitle(outletName);
                    } else {
                        self.headerTitle("");
                    }        
                    
                    // subtitle
                    var param = app.moduleConfig.params.rootContext.paymentParameter;
                    var paymentType = param.PAYMENT_TYPE;
                    if (paymentType == constant.PAY_BY_CASH) {
                        self.subTitle(self.lng_payByCash);
                    } else if (paymentType == constant.PAY_BY_CHEQUE) {
                        self.subTitle(self.lng_payByCheque);
                    } else if (paymentType == constant.PAY_BY_OTHERS) {
                        self.subTitle(self.lng_payByOthers);
                    } else if (paymentType == "-1" || typeof paymentType === "undefined") {
                        self.subTitle(self.lng_payByOthers);
                    }
                }

                function fillOrder() {
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var order = cartService.getOrder();
                    self.cust_name(ko.utils.unwrapObservable(order.cust_name));
                    self.remarks(ko.utils.unwrapObservable(order.remarks));
                    self.delivery_cost(ko.utils.unwrapObservable(order.delivery_cost));
                    self.shipping_address(ko.utils.unwrapObservable(order.shipping_address));
                    self.billing_address(ko.utils.unwrapObservable(order.billing_address));
                    self.ship_to_district(ko.utils.unwrapObservable(customerProfile.shipToDistrict));
                    self.purchase_order(ko.utils.unwrapObservable(order.purchase_order));
                    self.order_date(ko.utils.unwrapObservable(order.order_date));
                    self.real_customer(ko.utils.unwrapObservable(order.real_customer));
                    self.cust_no(ko.utils.unwrapObservable(customerProfile.accountNumber));
                    self.outletName(ko.utils.unwrapObservable(customerProfile.outletName));                    
                    
                    // the following information is returned from EBS
                    var param = app.moduleConfig.params.rootContext.paymentParameter;
                    console.log("fillOrder  param = " + ko.toJSON(param));
                    self.order_no(param.ORDER_NUMBER);
                    self.status(param.FLOW_STATUS_CODE);
                    self.paymentType(param.PAYMENT_TYPE);
                }

                function fillOrderItem() {
                    self.cart = cartService.getCart();

                    /**
                     * Computed Observables
                     */
                    self.subtotal = ko.computed(function () {
                        var subtotal = 0;
                        $(self.cart()).each(function (index, item) {
                            subtotal += item.cost();
                        });
                        return subtotal;
                    });

                    self.totalItems = ko.computed(function () {
                        var items = 0;
                        $(self.cart()).each(function (index, item) {
                            items++;
                        });
                        return items;
                    });

                    self.total = ko.computed(function () {
                        var total = 0;
                        total = new Number(self.delivery_cost()) + new Number(self.subtotal());
                        return total;
                    });
                }

                function proceedOrder(type) {
                    ui.showBusy();
                    var headerId = ko.utils.unwrapObservable(self.currHeaderId);
                    
                    var cbSuccessFn = function (data, xhr) {
                        console.log("cbSuccessFn");
                        console.log("proceedOrder raw data = " + ko.toJSON(data));
                        if (data !== null && xhr.status == 200) {
                            ui.hideBusy();

                            var returnStatus = data[resName]['ReturnStatus'];
                            var returnMessage = data[resName]['ReturnMessage'];

                            if (returnStatus == "S" || returnStatus == "W") {
                                ui.showMessageBox(self.lng_youOrder + ko.utils.unwrapObservable(self.order_no()) + self.lng_received);
                                if (isDataSync()) {
                                    var order = app.moduleConfig.params.rootContext.savedOrder;
                                    var payload = ko.toJS({status: "S", data: order.data});
                                    app.moduleConfig.params.rootContext.savedOrder = payload;
                                    app.go("dataSync");
                                } else {
                                    app.moduleConfig.params.rootContext.requireRefresh = true;
                                    var custId = app.moduleConfig.params.rootContext.custId;
                                    app.redirect("orderHist", custId);
                                }                                
                            } else {
                                ui.showMessageBox(returnMessage);
                            }
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn");
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_youOrder + ko.utils.unwrapObservable(self.order_no()) + self.lng_notReceived);
                    };                    

                    var resName;
                    if (type == "complete") {
                        resName = "OutputBookSalesOrder";
                        var param = app.moduleConfig.params.rootContext.paymentParameter;
                        service.bookSalesOrderMessage(headerId, param.PAYMENT_TYPE).then(cbSuccessFn, cbFailFn);
                    } else if (type == "cancel") {
                        resName = "OutputCancelSalesOrder";
                        service.cancelSalesOrderMessage(headerId).then(cbSuccessFn, cbFailFn);
                    }
                    
                }


                /**
                 * Actions
                 */
                self.completeOrder = function () {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }                          
                    if (confirm(self.lng_confirmPlaceOrder)) {
                        proceedOrder("complete");
                    }
                };

                self.cancelOrder = function () {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }                          
                    if (confirm(self.lng_confirmPlaceOrder)) {
                        proceedOrder("cancel");
                    }
                };
                
                self.printReceipt = function() {
                  if (confirm(self.lng_confirmPrint)) {
                      proceedPrint();
                  }  
                };

                self.goBack = function () {
                    if (app.moduleConfig.params.rootContext.isContinuePayment) {
                        app.moduleConfig.params.rootContext.requireRefresh = false;
                    } else {
                        app.moduleConfig.params.rootContext.requireRefresh = true;
                    }
                    
                    // retrun to daily order summary / order history page
                    if (app.moduleConfig.params.rootContext.isDailyOrderSummary) {
                        app.go("dailyOrders");
                    } else {
                        var custId = app.moduleConfig.params.rootContext.custId;
                        app.redirect("orderHist", custId);
                    }
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };
                
                function proceedPrint() {
                    console.log("proceed Print");
                    var time = new moment ().format("HH:mm");
                    var carPlateNo = app.moduleConfig.params.rootContext.userProfile.licenseNo;
                    var orderNo = (self.order_no()) ? self.order_no() : "";
                    var paymentType = self.paymentType();
                    
                    var data =  ko.toJS({   "DATE" : self.order_date(), 
                                            "ORDER_NUMBER": orderNo,
                                            "ACCOUNT_NUMBER": self.cust_no(),
                                            "TIME": time,
                                            "DELIVERY_NUMBER": "N/A",
                                            "CAR_PLATE_NUMBER": carPlateNo,
                                            "OUTLET_NAME": self.outletName(),
                                            "ORDER_TOT_AMT": self.total(),
                                            "PAYMENT_METHOD": paymentType,
                                            "SHIP_TO_ADDRESS": self.shipping_address(),
                                            "REMARKS": self.remarks()
                                        });
                    
                    var template = receiptService.getTemplate(data, self.cart());
                    console.log("receipt = " + template);
                    
                    var macAddress = receiptService.isPrinterPaired();
                    console.log("macAddress = " + macAddress);
                    if (!macAddress) {
                        ui.showMessageBox(self.lng_error_00038);
                        return;
                    }
                    
                    var isCordova = app.moduleConfig.params.rootContext.isCordova;
                    if (!isCordova) {
                        ui.showMessageBox(self.lng_error_00039);
                        return;
                    }
                    
                    var platform = app.moduleConfig.params.rootContext.platform;
                    var iOS = (platform.match(/ios/i) == "iOS" || platform == "iOS") ? true : false;
                    console.log("Printing on iOS = " + iOS);
                    
                    if (iOS) {
                        
                        window.plugins.CordovaPrinter.print(
                                function (success) {
                                    console.log("Receipt printed");
                                },
                                function error(fail) {
                                    console.log("receipt print failed:" + fail);
                                },
                                macAddress,
                                template);
                        
                        /*
                        window.plugins.CordovaPrinter.getPrinters(function(serialNumbers) { // Get the connect printer serial numbers
                          //Now split the serial numbers
                          var serialArray = serialNumbers.split(',');
                          console.log("serialArray = " + serialArray);
                          serialArray = serialArray.filter(function(n){ return n != undefined && n != '' });

                            // Just print to the first serial number
                            window.plugins.CordovaPrinter.print(
                              function(success) {   // Call the print method
                                console.log("Receipt printed");
                              },
                              function error(fail) {
                                console.log("receipt print failed:" + fail);
                            },
                            serialArray[0],
                            template);           // Include the serial number and your ZPL format label

                        },
                        function error(err) {
                            console.log('Error loading Printers');
                            console.log(err);
                        });                            // Log any errors
                        */
                          
                    } else {
                        cordova.plugins.zbtprinter.print(macAddress, template,
                                function (success) {
                                    console.log("Receipt printed");
                                }, function (fail) {
                                    console.log("receipt print failed:" + fail);
                                }
                        );
                    }
                }

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
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
                    self.lng_lot = getTranslation("ssa.orderDetail.lot");
                    self.lng_qty = getTranslation("ssa.orderDetail.qty");
                    self.lng_deliveryCost = getTranslation("ssa.orderDetail.deliveryCost");
                    self.lng_orderSummary = getTranslation("ssa.orderDetail.orderSummary");
                    self.lng_shippingAddress = getTranslation("ssa.orderDetail.shippingAddress");
                    self.lng_billingAddress = getTranslation("ssa.orderDetail.billingAddress");
                    self.lng_confirmPlaceOrder = getTranslation("ssa.checkOut.confirmProceed");                    
                    self.lng_completeOrder = getTranslation("ssa.checkOut.payment.completeOrder");
                    self.lng_cancelOrder = getTranslation("ssa.checkOut.payment.cancelOrder");
                    self.lng_payByCash = getTranslation("ssa.checkOut.payByCash");
                    self.lng_payByCheque = getTranslation("ssa.checkOut.payByCheque");
                    self.lng_payByOthers = getTranslation("ssa.checkOut.payByOthers");
                    self.lng_realCustomer = getTranslation("ssa.checkOut.realCustomer");
                    self.lng_youOrder = getTranslation("ssa.checkOut.payment.youOrder");
                    self.lng_received = getTranslation("ssa.checkOut.payment.received");
                    self.lng_notReceived = getTranslation("ssa.checkOut.payment.notReceived");
                    self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                    self.lng_confirmPrint = getTranslation("ssa.checkOut.payment.confirmPrint");
                    self.lng_error_00038 = getTranslation("ssa.msg.error.ERROR_00038");
                    self.lng_error_00039 = getTranslation("ssa.msg.error.ERROR_00039");
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

            return PaymentViewModel;
        }
);
