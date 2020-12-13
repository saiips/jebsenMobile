define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/checkOut/checkOutService',
    'pages/common/cartService', 'pages/newOrder/newOrderService', 'util/appui', 'util/commonhelper', 'pages/common/constant', 'pages/common/maintenance', 'util/devmode', 'pages/common/logService',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton',
    'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojdatetimepicker',
    'ojs/ojdialog', 'ojs/ojrouter', 'ojs/ojnavigationlist'],
        function (oj, ko, $, app, service, cartService, priceListService, ui, commonHelper, constant, maintenance, devMode, logger) {

            function CheckOutViewModel() {
                var self = this;

                // constant variables
                var RESPONSE_TABLE = 'OutputValidateSalesOrder';

                // router configuration
                self.router = app.router;

                console.log("CheckOutViewModel");

                /**
                 * Observable Arrays
                 */
                self.cust_name = ko.observable();
                self.order_no = ko.observable();
                self.purchase_order = ko.observable();
                self.order_date = ko.observable();
                self.real_customer = ko.observable();
                self.remarks = ko.observable();
                self.delivery_cost = ko.observable();
                self.shipping_address = ko.observable();
                self.billing_address = ko.observable();
                self.status = ko.observable();
                self.currOrderId = ko.observable();
                self.overwriteShipDateObtained = ko.observable(false);
                self.shipDateObatined = ko.observable(false);
                // self.subtotal = ko.observable();
                // self.total = ko.observable();
                self.overrideShipmentDate = ko.observable();
                self.overrideSubInventory = ko.observable();
                self.overrideShipmentMethod = ko.observable();
                self.minShipmentDate = ko.observable();
                self.ship_to_district = ko.observable();
                self.isShowLotNumber = ko.observable(true);
                self.subInventories = ko.observableArray();
                self.overrideSubInventories = ko.observableArray();
                self.shipmentMethods = ko.observableArray();
                self.isHidenForVanSale = ko.observable(true);
                self.headerTitle = ko.observable('');
                self.validateOrderFailed = ko.observable(false);
                self.availableBillToList = ko.observableArray();
                self.availableSalesRepList = ko.observableArray();
                self.overrideBillTo = ko.observable();
                self.overrideSalesRep = ko.observable();
                self.beerShipFromOrgID = ko.observable();

                // shopping cart array
                self.cart = ko.observableArray();
                self.targetCart = ko.observableArray();
                self.dataFormat = ko.observable("yyyy/MM/dd");
                self.dateConverter = ko.observable(
                        oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_DATETIME).createConverter(
                        {
                            pattern: self.dataFormat()
                        }));

                self.handleActivated = function (info) {
                    // Implement if needed
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("checkOut.js parentRouter=" + parentRouter.currentState().value);

                    var childRouter = parentRouter.getChildRouter("checkOut");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('checkOut');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set current order id
                                    self.currOrderId(stateId);
                                    console.log("checkOut.js stateId =" + stateId);
                                }
                            });
                            return state;
                        }
                    });

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
                        self.headerTitle("");
                    }

                    initTranslations();
                    init();
                    return oj.Router.sync();
                };

                // load orders
                self.currOrderId.subscribe(function (newOrderId) {
                    console.log("newOrderId=" + newOrderId);
                });
                
                // refresh
                self.beerShipFromOrgID.subscribe(function (newOrgID) {
                   console.log("newOrgID=" + newOrgID); 
                });
                
                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });

                function resetAll() {
                    self.subInventories.removeAll();
                    self.overrideSubInventories.removeAll();
                    self.shipmentMethods.removeAll();
                    self.cart.removeAll();
                    self.overrideShipmentDate(null);
                    self.overrideSubInventory(null);
                    self.overrideShipmentMethod(null);
                    self.purchase_order("");
                    self.real_customer("");
                    self.remarks("");
                    self.order_date("");
                    self.ship_to_district("");
                    self.shipping_address("");
                    self.billing_address("");
                    self.validateOrderFailed(false);
                    self.availableBillToList.removeAll();
                    self.availableSalesRepList.removeAll();
                    self.overrideSalesRep(null);
                    self.overrideBillTo(null);
                }

                function isDataSync() {
                    return app.moduleConfig.params.rootContext.isDataSync;
                }

                function init() {
                    console.log("init called");

                    if (app.moduleConfig.params.rootContext.fromShipment != "Y") {
                        // backup the originalCart
                        var originalCart = ko.observableArray();
                        if (!ko.isObservable(app.moduleConfig.params.rootContext.originalCart)) {
                            app.moduleConfig.params.rootContext.originalCart = ko.observableArray(app.moduleConfig.params.rootContext.originalCart);
                        }
                        ko.utils.arrayForEach(app.moduleConfig.params.rootContext.originalCart(), function (item) {
                            originalCart.push(item);
                        });

                        self.isOrderDeskAdmin = ko.computed(function () {
                            var user = app.moduleConfig.params.rootContext.userProfile;
                            try {
                                if (user.salesRole === constant.SR_ADMIN) {
                                    return true;
                                }
                                return false;
                            } catch (ex) {
                                return false;
                            }
                        });

                        // reset 
                        resetAll();
                        // initSubInventory();
                        initShipmentMethod();

                        // rollback the originalCart
                        app.moduleConfig.params.rootContext.originalCart = ko.observableArray();
                        ko.utils.arrayForEach(originalCart(), function (item) {
                            app.moduleConfig.params.rootContext.originalCart.push(item);
                        });

                        self.skipValidateOrder = ko.computed(function () {
                            // if (self.isOrderDeskAdmin() && ko.utils.unwrapObservable(self.overrideSalesRep()) == "-1")
                            //     return true;
                            return false;
                        });

                        self.showEraseButton = ko.computed(function () {
                            // return (isDataSync());
                            return false;
                        });

                        self.isDisabledShipmentMethod = ko.computed(function () {
                            // enable offline mode
                            var isOnline = app.moduleConfig.params.rootContext.isOnline;
                            // isOnline = false;
                            if (!isOnline)
                                return false;

                            var overrideSubInventory = ko.utils.unwrapObservable(self.overrideSubInventory);
                            if (Array.isArray(overrideSubInventory)) {
                                overrideSubInventory = overrideSubInventory[0];
                            }
                            if (overrideSubInventory == constant.MS_WAREHSE || overrideSubInventory == constant.JL_WAREHSE) {
                                return false;
                            } else {
                                return true;
                            }
                        });

                        self.isShowQtyChangeShipment = ko.computed(function () {
                            return !isVanSales() && isBeerSalesman() && !isOrderDeskAdmin();
                        });

                        self.isShowQty = ko.computed(function () {
                            return isVanSales();
                        });

                        self.showRealCustomer = ko.computed(function () {
                            var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                            if (ko.utils.unwrapObservable(customerProfile.walkInCust) == "Y")
                                return true;
                            return false;
                        });

                        self.getDataSyncCount = ko.computed(function () {
                            var cnt1 = 0;
                            cnt1 = containSavedSalesOrder();
                            return cnt1;
                        });

                        self.isOnline = ko.computed(function () {
                            return (app.moduleConfig.params.rootContext.isOnline) ? true : false;
                        });
                        
                        self.isCreditCustomer = ko.computed(function () {
                            var user = app.moduleConfig.params.rootContext.userProfile;
                            
                            var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                            var paymentTermId =  ko.utils.unwrapObservable(customerProfile.paymentTermId);
                            if (user.salesRole == constant.SR_SALE_VAN && paymentTermId != constant.PAYMENT_TERM_ID_COD) {
                                return true;
                            } else {
                                return false;
                            }
                        });                        
                    }

                    // get price list
                    // priceListService.getPriceListMessage(getPriceListPayload());

                    showButton();

                    showLotNumber();

                    hidenForVanSale();

                    console.log("isMaintenance = " + maintenance.isMaintenance());

                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    // isOnline = false;
                    console.log("isOnline = " + isOnline);

                    var isReturnFromShipment = (app.moduleConfig.params.rootContext.fromShipment == "Y") ? true : false;
                    console.log("isReturnFromShipment = " + isReturnFromShipment);
                    console.log("isDataSync = " + isDataSync());
                    console.log("isReOrder = " + app.moduleConfig.params.rootContext.isReOrder);
                    console.log("isQuickCheckOut = " + app.moduleConfig.params.rootContext.isQuickCheckOut);
                    console.log("isDevMode = " + (devMode.isEnabled() && devMode.isOffline()));
                    console.log("skipValidateOrder = " + self.skipValidateOrder());
                    
                    if (!isDataSync()) {
                        app.moduleConfig.params.rootContext.savedOrder = "undefined";
                    }

                    // fill order information
                    fillOrder();

                    if (isOnline && !isReturnFromShipment && !(devMode.isEnabled() && devMode.isOffline()) && !self.skipValidateOrder()) {
                        ui.showBusy();
                        // ensure the standard price list is available for validate the sales order
                        priceListService.getPriceListMessage(getPriceListPayload()).done(function () {
                            
                            // get price list
                            var respJSON = getPriceList();
                            if (respJSON) {
                                self.beerShipFromOrgID(respJSON[0].ORGANIZATION_ID);
                            }

                            initSubInventory();
                            
                            if (self.isOrderDeskAdmin()) {
                                var payload = getBillToListPayload();
                                console.log("initBillToList payload =" + ko.toJS(payload));
                                service.getBillToListMessage(payload).done(function (data, xhr) {
                                    if (data !== null && xhr.status == 200) {
                                        var respJSON = data['P_BILL_TO_ADDRESS_TBL_ITEM'];
                                        if (!Array.isArray(respJSON)) {
                                            var temp = new Array();
                                            temp.push(respJSON);
                                            respJSON = temp;
                                        }
                                        self.availableBillToList.push(ko.toJS({value: '-1', label: ''})); // default
                                        ko.utils.arrayMap(respJSON, function (item) {
                                            self.availableBillToList.push(ko.toJS({value: item.BILL_TO_ADDRESS_ID, label: item.BILL_TO_ADDRESS}));
                                        });
                                    }
                                }).then(function () {
                                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                                    if (!isDataSync()) {
                                        self.overrideBillTo(ko.utils.unwrapObservable(customerProfile.billToSiteId));
                                    } else {
                                        self.overrideBillTo(ko.utils.unwrapObservable(customerProfile.overrideBillToSiteId));
                                    }

                                    if (self.isOrderDeskAdmin()) {
                                        var payload = getSalesRepListPayload();
                                        console.log("initSalesRepList payload =" + ko.toJS(payload));
                                        service.getSalesRepListMessage(payload).done(function (data, xhr) {
                                            if (data !== null && xhr.status == 200) {
                                                var respJSON = data['P_SALESREP_TBL_ITEM'];
                                                if (!Array.isArray(respJSON)) {
                                                    var temp = new Array();
                                                    temp.push(respJSON);
                                                    respJSON = temp;
                                                }
                                                self.availableSalesRepList.push(ko.toJS({value: '-1', label: ''})); // default
                                                ko.utils.arrayMap(respJSON, function (item) {
                                                    self.availableSalesRepList.push(ko.toJS({value: item.SALESREP_ID, label: item.SALESREP_NAME}));
                                                });
                                            }
                                        }).then(function () {
                                            var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                                            if (!isDataSync()) {
                                                self.overrideSalesRep(ko.utils.unwrapObservable(customerProfile.salesRepId));
                                            } else {
                                                self.overrideSalesRep(ko.utils.unwrapObservable(customerProfile.overrideSalesRepId));
                                            }

                                            if (preCheck(false)) {
                                                validateSalesOrder();
                                            } else {
                                                self.goBack();
                                            }
                                        });
                                    }

                                });
                            } else {
                                if (preCheck(false)) {
                                    validateSalesOrder();
                                } else {
                                    self.goBack();
                                }
                            }
                        });
                    } else if (isReturnFromShipment) {
                        // reset the indicator to N
                        app.moduleConfig.params.rootContext.fromShipment = "N";

                        // update the cart information
                        var cart = cartService.cloneCart(app.moduleConfig.params.rootContext.originalCart);
                        self.cart.removeAll();
                        ko.utils.arrayForEach(cart(), function (item) {
                            console.log("item = " + ko.toJSON(item));
                            self.cart.push(item);
                        });

                    } else {
                        self.targetCart = app.moduleConfig.params.rootContext.originalCart;
                        console.log("self.targetCart = " + ko.toJSON(self.targetCart));

                        // add back to the shopping cart
                        var cartArray = ko.utils.unwrapObservable(self.targetCart);
                        var cartArrayLength = cartArray.length;

                        for (var i = 0; i < cartArrayLength; i++) {
                            var cart_item = cartService.cloneCartItem(cartArray[i]);
                            console.log("cart_item = " + ko.toJSON(cart_item));
                            self.cart.push(cart_item);
                        }
                    }
                }

                function preCheck(recal) {
                    var proceedValidateSalesOrder = true;
                    var fromPage = app.moduleConfig.params.rootContext.fromPage;
                    if (fromPage == "orderDetail" || fromPage == "newOrder" || fromPage == "newOrderItem" || isDataSync()) {
                        self.targetCart = app.moduleConfig.params.rootContext.originalCart;
                        console.log("self.targetCart = " + ko.toJSON(self.targetCart));
                        // convert to observable array
                        var result = ko.isObservable(self.targetCart);
                        if (!result) {
                            self.targetCart = ko.observableArray(self.targetCart);
                        }
                        var returnStatus = isValidOrderItem(self.targetCart);
                        if (!returnStatus) {
                            if (self.targetCart().length == 0) {
                                // reset 
                                self.cart.removeAll();
                                app.moduleConfig.params.rootContext.originalCart = ko.observableArray([]);
                                ui.hideBusy();
                                ui.showMessageBox(self.lng_error_00001);
                                proceedValidateSalesOrder = false;
                            } else {
                                // proceed the validate sales order fro the remaining item(s)
                                ui.hideBusy();
                                // if (!recal && !isDataSync()) ui.showMessageBox(self.lng_error_00002);
                            }
                        } else {
                            if (self.targetCart().length == 0) {
                                ui.hideBusy();
                                // reset 
                                self.cart.removeAll();
                                app.moduleConfig.params.rootContext.originalCart = ko.observableArray([]);
                                ui.showMessageBox(self.lng_error_00001);
                                proceedValidateSalesOrder = false;
                            }
                        }
                    }
                    return proceedValidateSalesOrder;
                }


                function validateSalesOrder() {
                    console.log("validateSalesOrder started");
                    var user = app.moduleConfig.params.rootContext.userProfile;

                    ui.showBusy();

                    // self.targetCart.removeAll();
                    // self.cart.removeAll();

                    // get the cart array
                    self.targetCart = app.moduleConfig.params.rootContext.originalCart;
                    console.log("self.targetCart = " + ko.toJSON(self.targetCart));

                    // debug purpose
                    console.log("self.cart = " + ko.toJSON(self.cart));
                    console.log("self.targetCart = " + ko.toJSON(self.targetCart));

                    // prepare the payload 4 validation
                    var payload = preparePayload4Validate();
                    console.log(">>> payload =" + payload);

                    // log event - validateOrder (before)
                    var logPayload = logger.getEventLogPayload(user.username, constant.EVENT_BEFORE_VALIDATE_ORDER,
                            ko.toJS(payload),
                            ko.toJSON({"shipmentDate": self.overrideShipmentDate(), "SubInventory": self.overrideSubInventory(), "ShipmentMethod": self.overrideShipmentMethod()}));
                    logger.log(logPayload);

                    // validate sales order
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            console.log("raw data returned = " + ko.toJSON(data));
                            prepareUI(data, xhr.status);
                            // self.validateOrderFailed(false);
                        } catch (e) {
                            ui.hideBusy();
                            console.error(e);
                            if (e != "EBS-ERROR") {
                                ui.showMessageBox(self.lng_error_00011);
                            }
                            // self.goBack();
                            addBackItem();
                            self.validateOrderFailed(true);
                        } finally {
                            console.log("cbSuccessFn called");
                            ui.hideBusy();
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        ui.showMessageBox(self.lng_error_00011);
                        prepareUI(data, xhr.status);
                        // self.goBack();
                        addBackItem();
                        self.validateOrderFailed(true);
                    };
                    service.validateSalesOrderMessage(payload).then(cbSuccessFn, cbFailFn);
                }


                function addBackItem() {
                    console.log(">>>>> addBackItem ");

                    self.cart.removeAll();

                    // add back to the shopping cart
                    var cartArray = ko.utils.unwrapObservable(self.targetCart);
                    var cartArrayLength = cartArray.length;

                    for (var i = 0; i < cartArrayLength; i++) {
                        var cart_item = cartService.cloneCartItem(cartArray[i]);
                        console.log("cart_item = " + ko.toJSON(cart_item));
                        self.cart.push(cart_item);
                    }
                }


                function containSavedSalesOrder() {
                    var salesOrderKey = cartService.getOfflineKey();
                    var dataJSON = ui.getLocalStorage(salesOrderKey);

                    if (typeof dataJSON !== "undefined") {
                        if (!Array.isArray(dataJSON)) {
                            dataJSON = ko.utils.unwrapObservable(dataJSON);
                        }
                        if (dataJSON.length == 0)
                            return 0;
                        return dataJSON['data'].length;
                    }
                    return 0;
                }

                function fillOrder() {
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;

                    if (app.moduleConfig.params.rootContext.fromShipment == "Y") {
                        // no need to update it
                        console.log("fillOrder for shipment");
                        console.log("fromShipment");
                    } else if ((app.moduleConfig.params.rootContext.isReOrder == false) &&
                            (app.moduleConfig.params.rootContext.fromPage == "newOrder" || app.moduleConfig.params.rootContext.fromPage == "newOrderItem" || app.moduleConfig.params.rootContext.fromPage == "topOrderItem")) {
                        console.log("fillOrder for newOrder");
                        self.cust_name(ko.utils.unwrapObservable(customerProfile.name));
                        self.purchase_order("");
                        self.real_customer("");
                        self.remarks("");
                        self.delivery_cost(0);
                        self.shipping_address(ko.utils.unwrapObservable(customerProfile.shipToAddress));
                        self.billing_address(ko.utils.unwrapObservable(customerProfile.billToAddress));
                        self.ship_to_district(ko.utils.unwrapObservable(customerProfile.shipToDistrict));
                        self.minShipmentDate(getMinShipmentDate());
                        console.log("from newOrder");
                    } else if (isDataSync()) {
                        console.log("fillOrder for dataSync");
                        var order = cartService.getOrder();
                        self.cust_name(ko.utils.unwrapObservable(customerProfile.name));
                        self.purchase_order(ko.utils.unwrapObservable(order.purchase_order));
                        self.real_customer(ko.utils.unwrapObservable(order.real_customer));
                        self.shipping_address(ko.utils.unwrapObservable(order.shipping_address));
                        self.billing_address(ko.utils.unwrapObservable(order.billing_address));
                        self.ship_to_district(ko.utils.unwrapObservable(customerProfile.shipToDistrict));
                        self.minShipmentDate(getMinShipmentDate());
                        self.delivery_cost(ko.utils.unwrapObservable(order.delivery_cost));
                        self.remarks(ko.utils.unwrapObservable(order.remarks));
                        // override delivery schedule
                        self.overrideSubInventory(ko.utils.unwrapObservable(order.override_sub_inventory));
                        self.overrideShipmentMethod(ko.utils.unwrapObservable(order.override_shipment_method));
                        self.overrideShipmentDate(ko.utils.unwrapObservable(order.override_shipment_date));
                    } else {
                        console.log("fillOrder for re-order / order details");
                        // retrieve from re-order information
                        var order = cartService.getOrder();
                        console.log("order = " + ko.toJSON(order));
                        self.cust_name(ko.utils.unwrapObservable(order.cust_name));
                        var l_remarks = ko.utils.unwrapObservable(order.remarks);
                        self.remarks(new String(l_remarks).toString());
                        // self.delivery_cost(ko.utils.unwrapObservable(order.delivery_cost));
                        self.delivery_cost(0);
                        self.shipping_address(ko.utils.unwrapObservable(order.shipping_address));
                        self.billing_address(ko.utils.unwrapObservable(order.billing_address));
                        self.ship_to_district(ko.utils.unwrapObservable(customerProfile.shipToDistrict));
                        // self.purchase_order(ko.utils.unwrapObservable(order.purchase_order));
                        // self.real_customer(ko.utils.unwrapObservable(order.real_customer));
                        self.purchase_order("");
                        self.real_customer("");
                        self.minShipmentDate(getMinShipmentDate());
                    }
                    // override the order information
                    self.order_no("");
                    self.order_date(commonHelper.getClientCurrentDate());
                    self.status("");
                }

                function getMinShipmentDate() {
                    return commonHelper.getClientCurrentDate("YYYY-MM-DD");
                }

                function getShipFromOrgId(orgUnitId) {
                    if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                        return constant.SHIP_FROM_ORG_ID_2922;
                    } else if (orgUnitId == constant.ORG_UNIT_ID_BEER) {
                        // return constant.SHIP_FROM_ORG_ID_2920;
                        // return constant.SHIP_FROM_ORG_ID_7218;
                        // deduce by the price list "ORGANIZATION_ID"
                        return ko.utils.unwrapObservable(self.beerShipFromOrgID);
                    }
                }

                function prepareOrder(isValidate) {
                    var order = cartService.getOrder();

                    // get the stored information
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var userProfile = app.moduleConfig.params.rootContext.userProfile;
                    var shipToOrgId = app.moduleConfig.params.rootContext.outLetId;

                    // get the payload for validate sales order
                    var newOrder = cartService.cloneOrder(order);
                    newOrder.cust_name(ko.utils.unwrapObservable(customerProfile.name));
                    // required for reInitiate
                    newOrder.outlet_name(ko.utils.unwrapObservable(customerProfile.outletName));
                    newOrder.real_customer(ko.utils.unwrapObservable(customerProfile.realCustomer));
                    newOrder.shipping_address(ko.utils.unwrapObservable(customerProfile.shipToAddress));
                    newOrder.billing_address(ko.utils.unwrapObservable(customerProfile.billToAddress));
                    newOrder.sold_to_org_id(customerProfile.id);
                    // bug fixing 
                    // newOrder.ship_to_org_id(customerProfile.shipToSiteId);
                    if (Array.isArray(shipToOrgId))
                        shipToOrgId = shipToOrgId[0];
                    newOrder.ship_to_org_id(ko.utils.unwrapObservable(shipToOrgId));
                    newOrder.invoice_to_org_id(customerProfile.billToSiteId);
                    newOrder.price_list_id(customerProfile.priceListId);
                    newOrder.pricing_date(commonHelper.getClientCurrentDate("YYYY-MM-DDTHH:mm:ssZ"));
                    newOrder.order_date(commonHelper.getClientCurrentDate("YYYY/MM/DD"));
                    newOrder.sold_from_org_id(userProfile.orgUnitId);
                    newOrder.ship_from_org_id(getShipFromOrgId(userProfile.orgUnitId));
                    // Users with roles Van Driver & Mobile Sales create sales order on behalf of the sales person
                    if (userProfile.salesRole == constant.SR_SALE_VAN || userProfile.salesRole == constant.SR_MOBILE_SALE) {
                        newOrder.sales_rep_id(ko.utils.unwrapObservable(customerProfile.salesRepId));
                    } else {
                        newOrder.sales_rep_id(ko.utils.unwrapObservable(userProfile.erpSalesId));
                    }
                    // order desk admin on behalf of sales person and bill to address
                    if (self.isOrderDeskAdmin()) {
                        var overrideSalesRep = ko.utils.unwrapObservable(self.overrideSalesRep());
                        if (Array.isArray(overrideSalesRep))
                            overrideSalesRep = overrideSalesRep[0];
                        var overrideBillTo = ko.utils.unwrapObservable(self.overrideBillTo());
                        if (Array.isArray(overrideBillTo))
                            overrideBillTo = overrideBillTo[0];
                        console.log("overrideSalesRep=" + ko.toJSON(overrideSalesRep));
                        console.log("overrideBillTo=" + ko.toJSON(overrideBillTo));
                        newOrder.sales_rep_id(overrideSalesRep);
                        newOrder.invoice_to_org_id(overrideBillTo);
                    }
                    newOrder.transactional_curr_code("HKD");
                    newOrder.payment_term_id(customerProfile.paymentTermId);
                    newOrder.remarks(ko.utils.unwrapObservable(self.remarks));
                    newOrder.real_customer(ko.utils.unwrapObservable(self.real_customer));
                    if (isValidate) {
                        newOrder.delivery_cost(ko.utils.unwrapObservable(self.delivery_cost) ? ko.utils.unwrapObservable(self.delivery_cost) : 0);
                        newOrder.order_tot_amt(ko.utils.unwrapObservable(self.total) ? ko.utils.unwrapObservable(self.order_no) : 0);
                        newOrder.purchase_order(ko.utils.unwrapObservable(self.purchase_order) ? ko.utils.unwrapObservable(self.purchase_order) : "");
                    } else {
                        newOrder.delivery_cost(ko.utils.unwrapObservable(self.delivery_cost));
                        newOrder.order_tot_amt(ko.utils.unwrapObservable(self.total));
                        newOrder.purchase_order(ko.utils.unwrapObservable(self.purchase_order));
                    }

                    return newOrder;
                }

                function preparePayload4Validate() {
                    // get the payload for validate sales order
                    var newOrder = prepareOrder(true);
                    return service.getValidatePayload(newOrder, self.targetCart);
                }

                function preparePayload4Create() {
                    // get the payload for create sales order
                    var newOrder = prepareOrder(false);

                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    var overrideShipmentDate = ko.utils.unwrapObservable(self.overrideShipmentDate);
                    var overrideSubInventory = ko.utils.unwrapObservable(self.overrideSubInventory);
                    var overrideShipmentMethod = ko.utils.unwrapObservable(self.overrideShipmentMethod);

                    console.log("overrideShipmentDate = " + overrideShipmentDate);
                    console.log("overrideSubInventory = " + overrideSubInventory);
                    console.log("overrideShipmentMethod = " + overrideShipmentMethod);

                    if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                        return service.getCreateWineOrderPayload(newOrder, self.cart, overrideShipmentDate, overrideSubInventory, overrideShipmentMethod);
                    } else {
                        return service.getCreateBeerOrderPayload(newOrder, self.cart, overrideShipmentDate, overrideSubInventory, overrideShipmentMethod);
                    }
                }

                function showButton() {
                    var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    if (salesRole === constant.SR_SALE_VAN) {
                        self.showMSButton = ko.observable(false);
                        self.showVSPayButton = ko.observable(true);
                        self.showCreditButton = ko.observable(false);
                        console.log("isCreditCustomer=" + self.isCreditCustomer());
                        if (self.isCreditCustomer()) {
                            self.showMSButton = ko.observable(false);
                            self.showVSPayButton = ko.observable(false);
                            self.showCreditButton = ko.observable(true);
                        }
                    } else {
                        self.showMSButton = ko.observable(true);
                        self.showVSPayButton = ko.observable(false);
                        self.showCreditButton = ko.observable(false);
                    }
                }

                function showLotNumber() {
                    if (isOrderDeskAdmin()) {
                        self.isShowLotNumber(true);
                    } else if (isVanSales() || isBeerSalesman()) {
                        self.isShowLotNumber(false);
                    } else {
                        self.isShowLotNumber(true);
                    }
                }

                function hidenForVanSale() {
                    var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    if (salesRole == constant.SR_SALE_VAN) {
                        self.isHidenForVanSale(false);
                    } else {
                        self.isHidenForVanSale(true);
                    }
                }

                function isOrderDeskAdmin() {
                    var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    if (salesRole === constant.SR_ADMIN)
                        return true;
                    return false;
                }

                function isVanSales() {
                    var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    if (salesRole == constant.SR_SALE_VAN)
                        return true;
                    return false;
                }

                function isBeerSalesman() {
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    if (orgUnitId == constant.ORG_UNIT_ID_BEER)
                        return true;
                    return false;
                }

                function initSubInventory() {
                    console.log("iniSubInventory");
                    var cbSuccessFn = function (data, xhr) {
                        console.log("cbSuccessFn");
                        console.log("initSubInventory raw data = " + ko.toJSON(data));
                        if (data !== null && xhr.status == 200) {
                            var subInventoryMap = {};
                            var respJSON = data['P_SUBINV_TBL']['P_SUBINV_TBL_ITEM'];
                            if (!Array.isArray(respJSON)) {
                                var temp = new Array();
                                temp.push(respJSON);
                                respJSON = temp;
                            }
                            self.overrideSubInventories.push(ko.toJS({value: '-1', label: ''})); // default
                            self.subInventories.push(ko.toJS({value: '-1', label: ''})); // default
                            ko.utils.arrayMap(respJSON, function (item) {
                                var subinvCode = item.SUBINV_CODE.substr(0, item.SUBINV_CODE.toString().length - 1);
                                var draughtFlag = item.SUBINV_CODE.substr(-1);
                                
                                self.subInventories.push(ko.toJS({value: subinvCode, label: subinvCode}));
                                self.overrideSubInventories.push(ko.toJS({value: subinvCode, label: subinvCode}));
                                
                                if (typeof subInventoryMap[subinvCode] === "undefined") {
                                    subInventoryMap[subinvCode] = draughtFlag;
                                }
                            });
                            
                            // store the subInventoryMap
                            app.moduleConfig.params.rootContext.subInventoryMap = subInventoryMap;
 
                            console.log("subInventories =" + ko.toJSON(self.subInventories));
                            console.log("overrideSubInventories =" + ko.toJSON(self.overrideSubInventories));
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn");
                    };
                    
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    var ioId = "";
                    if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                        ioId = constant.IO_ID_2899;
                    } else {
                        ioId = ko.utils.unwrapObservable(self.beerShipFromOrgID);
                    }

                    service.getSubInventoryMessage(ioId).then(cbSuccessFn, cbFailFn);
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
                            self.shipmentMethods.push(ko.toJS({value: '-1', label: ''})); // default
                            ko.utils.arrayMap(respJSON, function (item) {
                                self.shipmentMethods.push(ko.toJS({value: item.SHIPPING_METHOD, label: item.MEANING}));
                            });
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn");
                    };
                    service.getShipmentMethodMessage().then(cbSuccessFn, cbFailFn);
                }

                function getBillToListPayload() {
                    var payload;
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    payload = JSON.stringify({
                        "InputGetBillToAddress": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": user.orgUnitId,
                            "P_ACCOUNT_NUMBER": ko.utils.unwrapObservable(customerProfile.accountNumber)
                        }
                    });
                    return payload;
                }

                function getSalesRepListPayload() {
                    var payload;
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    payload = JSON.stringify({
                        "InputGetSalesERPName": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": user.orgUnitId
                        }
                    });
                    return payload;
                }

                function initBillToList() {
                    var payload = getBillToListPayload();
                    console.log("initBillToList payload =" + ko.toJS(payload));
                    var cbSuccessFn = function (data, xhr) {
                        console.log("cbSuccessFn");
                        if (data !== null && xhr.status == 200) {
                            var respJSON = data['P_BILL_TO_ADDRESS_TBL_ITEM'];
                            if (!Array.isArray(respJSON)) {
                                var temp = new Array();
                                temp.push(respJSON);
                                respJSON = temp;
                            }
                            self.availableBillToList.push(ko.toJS({value: '-1', label: ''})); // default
                            ko.utils.arrayMap(respJSON, function (item) {
                                self.availableBillToList.push(ko.toJS({value: item.BILL_TO_ADDRESS_ID, label: item.BILL_TO_ADDRESS}));
                            });
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn");
                    };
                    service.getBillToListMessage(payload).then(cbSuccessFn, cbFailFn);
                }

                function initSalesRepList() {
                    var payload = getSalesRepListPayload();
                    console.log("initSalesRepList payload =" + ko.toJS(payload));
                    var cbSuccessFn = function (data, xhr) {
                        console.log("cbSuccessFn");
                        if (data !== null && xhr.status == 200) {
                            var respJSON = data['P_SALESREP_TBL_ITEM'];
                            if (!Array.isArray(respJSON)) {
                                var temp = new Array();
                                temp.push(respJSON);
                                respJSON = temp;
                            }
                            self.availableSalesRepList.push(ko.toJS({value: '-1', label: ''})); // default
                            ko.utils.arrayMap(respJSON, function (item) {
                                self.availableSalesRepList.push(ko.toJS({value: item.SALESREP_ID, label: item.SALESREP_NAME}));
                            });
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn");
                    };
                    service.getSalesRepListMessage(payload).then(cbSuccessFn, cbFailFn);
                }

                function getSubInventory() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var token = user.licenseNo.split("-");
                    return "DD-" + token[1];
                }

                function prepareUI(data, status) {
                    if (data !== null && status == 200) {
                        // handling the failed case from backend
                        var returnStatus = data[RESPONSE_TABLE]['ReturnStatus'];
                        var returnMessage = data[RESPONSE_TABLE]['ReturnMessage'];
                        if (returnStatus != "S" && returnStatus != "W") {
                            if (returnMessage) {
                                ui.showMessageBox(self.lng_error_00011 + " Reason: " + returnMessage);
                            } else {
                                ui.showMessageBox(self.lng_error_00011);
                            }
                            self.validateOrderFailed(true);
                        } else {
                            self.validateOrderFailed(false);
                        }

                        var headerJSON = data[RESPONSE_TABLE]['HeaderRecord'];
                        var lineJSON;
                        try {
                            if (typeof data[RESPONSE_TABLE]['LineRecords'] === "undefined") {
                                lineJSON = data[RESPONSE_TABLE]['HeaderRecord']['LineRecords']['O_LINE_TBL_OUT_ITEM'];
                            } else {
                                lineJSON = data[RESPONSE_TABLE]['LineRecords']['O_LINE_TBL_OUT_ITEM'];
                            }
                        } catch (error) {
                            console.log(error);
                            throw "EBS-ERROR";
                        }

                        // log event - validateOrder (after)
                        var user = app.moduleConfig.params.rootContext.userProfile;
                        var logPayload = logger.getEventLogPayload(user.username, constant.EVENT_AFTER_VALIDATE_ORDER,
                                ko.toJSON(data),
                                ko.toJSON({"shipmentDate": self.overrideShipmentDate(), "SubInventory": self.overrideSubInventory(), "ShipmentMethod": self.overrideShipmentMethod()}));
                        logger.log(logPayload);

                        // handling the LineRecords if array or not
                        var respJSON;
                        var isArray = Array.isArray(lineJSON);
                        if (!isArray) {
                            var temp = new Array();
                            temp.push(lineJSON);
                            respJSON = temp;
                        } else {
                            respJSON = lineJSON;
                        }
                        console.log("respJSON =" + ko.toJSON(respJSON));

                        // reset self.cart
                        self.cart.removeAll();

                        // order detail - add to the cart array
                        ko.utils.arrayMap(respJSON, function (item) {
                            console.log("item = " + ko.toJSON(item));

                            // get the LOT
                            var lotJSON;
                            // handle null on LOT_NUMBER
                            if (item.LOT_NUMBER_TBL) {
                                var lotItem = item.LOT_NUMBER_TBL.LOT_NUMBER_TBL_ITEM;
                                if (!Array.isArray(lotItem)) {
                                    var temp = new Array();
                                    temp.push(item.LOT_NUMBER_TBL.LOT_NUMBER_TBL_ITEM);
                                    lotJSON = temp;
                                } else {
                                    lotJSON = lotItem;
                                }
                                console.log("lotJSON = " + ko.toJSON(lotJSON));
                            }

                            var lot;
                            var LOT_NUMBER = [];
                            ko.utils.arrayMap(lotJSON, function (item) {
                                if (new String(item.LOT_NUMBER) != "-1" && new String(item.LOT_NUMBER) != "-2") {
                                    LOT_NUMBER.push(ko.toJS({value: item.LOT_NUMBER, label: item.LOT_NUMBER}));
                                } else {
                                    LOT_NUMBER.push(ko.toJS({value: "-1", label: ""}));
                                }
                            });

                            if (Array.isArray(LOT_NUMBER) && LOT_NUMBER.length >= 1) {
                                lot = LOT_NUMBER[0]['value'];
                                item.LOT_NUMBER = lot;
                            } else {
                                item.LOT_NUMBER = "";
                            }

                            if (isDataSync()) {
                                var targetCartItem = ko.utils.arrayFirst(self.targetCart(), function (cart) {
                                    return ((ko.utils.unwrapObservable(cart.product().id)) == item.INVENTORY_ITEM_ID);
                                });
                                console.log("targetCartItem=" + ko.toJSON(targetCartItem));
                                if (targetCartItem) {
                                    item.LOT_NUMBER = ko.utils.unwrapObservable(targetCartItem.product().lot);
                                    console.log("targetCartItem.lotArray=" + ko.utils.unwrapObservable(targetCartItem.product().lot));
                                }
                            }

                            // handle the shipment date
                            var shipmentDate;
                            if (commonHelper.isValid(item.SCHEDULE_SHIP_DATE)) {
                                if (commonHelper.isEBSFormat(item.SCHEDULE_SHIP_DATE)) {
                                    shipmentDate = commonHelper.formatStrDateToYYYYMMDD(item.SCHEDULE_SHIP_DATE);
                                } else {
                                    shipmentDate = item.SCHEDULE_SHIP_DATE;
                                }
                            } else {
                                shipmentDate = commonHelper.getClientNextDate();
                            }

                            // handling subinventory for van sales
                            var subInventory = item.SUBINVENTORY;
                            if (isVanSales()) {
                                subInventory = getSubInventory();
                            }

                            // add back to the shopping cart
                            var cart_item = cartService.createCartItem(item, item.ORDERED_QUANTITY, false, shipmentDate, item.ORIGINAL_LINE, LOT_NUMBER, subInventory, item.SHIPPING_METHOD);
                            console.log("cart_item = " + ko.toJSON(cart_item));
                            self.cart.push(cart_item);

                        });

                    }
                    ui.hideBusy();
                }

                /**
                 * Computed Observables
                 */
                self.subtotal = ko.computed(function () {
                    var subtotal = 0;
                    $(self.cart()).each(function (index, item) {
                        subtotal += ko.utils.unwrapObservable(item.cost());
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

                    var deliveryCost = ko.utils.unwrapObservable(self.delivery_cost);
                    var subtotal = ko.utils.unwrapObservable(self.subtotal());
                    total = new Number(deliveryCost) + subtotal;

                    return total;
                });

                self.converter = oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_NUMBER).
                        createConverter(
                                {
                                    "maximumFractionDigits": 2,
                                    "minimumFractionDigits": 2,
                                    "minimumIntegerDigits": 2,
                                    "style": "decimal",
                                    "useGrouping": true
                                });

                self.changeShippment = function (data, event) {
                    console.log("clicked changeShippment");
                    var custId = app.moduleConfig.params.rootContext.custId;
                    cartService.setCart(self.cart);
                    app.moduleConfig.params.rootContext.selectedItem = data;
                    app.redirect("shipment", custId);
                };

                self.optionChangeOverrideSubInventory = function (data, event) {
                    console.log("optionChangeOverrideSubInventory");
                    if (event.option != "value")
                        return;

                    // ignore if offline
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    // isOnline =false;
                    if (!isOnline)
                        return;

                    // ignore it if it is Data Sync
                    if (isDataSync())
                        return;

                    ui.showBusy();
                    var overrideSubInventory = event.value[0];
                    if (overrideSubInventory) {
                        var payload = service.getEarliestShipDatePayload(overrideSubInventory);
                        console.log("payload = " + ko.toJS(payload));

                        // create  sales order
                        var cbSuccessFn = function (data, xhr) {
                            try {
                                console.log("raw data returned = " + ko.toJSON(data));
                                var respJSON = data['OutputGetEarliestShipDate'];

                                if (respJSON == null)
                                    return;
                                var shipDate = respJSON['O_SHIP_DATE'];
                                if (commonHelper.isDateFormat(shipDate, "YYYY-MM-DDTHH:mm:ss.sssZ")) {
                                    shipDate = commonHelper.formatStrDate(shipDate, "YYYY-MM-DDTHH:mm:ss.sssZ", "YYYY-MM-DD");
                                }
                                if (shipDate == null) {
                                    shipDate = commonHelper.getClientCurrentDate("YYYY-MM-DD");
                                }
                                var shipMethod = respJSON['O_SHIPPING_METHOD'];
                                if (shipMethod == null) {
                                    shipMethod = "-1";
                                }
                                console.log("shipDate = " + shipDate);
                                console.log("shipMethod=" + shipMethod);

                                self.overrideShipmentMethod(shipMethod);
                                self.overrideShipmentDate(shipDate);

                            } catch (e) {
                                console.error(e);
                                ui.hideBusy();
                            } finally {
                                console.log("cbSuccessFn called");
                                self.overwriteShipDateObtained(true);
                                ui.hideBusy();
                            }
                        };
                        var cbFailFn = function (data, xhr) {
                            console.log("cbFailFn failed");
                            ui.hideBusy();
                        };
                        service.getEarliestShipDateMessage(payload).then(cbSuccessFn, cbFailFn);
                    }
                };

                self.optionChangeOverrideShipmentMethod = function (data, event) {
                    console.log("optionChangeOverrideShipmentMethod");
                    if (event.option != "value")
                        return;

                    // ignore if offline
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    // isOnline =false;
                    if (!isOnline)
                        return;

                    // ignore if sub-inventory is not MS-WAREHSE
                    var overrideSubInventory = ko.utils.unwrapObservable(self.overrideSubInventory);
                    if (Array.isArray(overrideSubInventory)) {
                        overrideSubInventory = overrideSubInventory[0];
                    }
                    // skip it
                    // if (overrideSubInventory != constant.MS_WAREHSE && overrideSubInventory != constant.PW_WAREHSE)
                    //    return;
                    
                    if (self.overwriteShipDateObtained()) {
                        self.overwriteShipDateObtained(false);
                        return;
                    }
                    
                    var overrideShipmentMethod = event.value[0];
                    if (overrideShipmentMethod) {
                        ui.showBusy();
                        var payload = service.getEarliestShipDateByCPPayload(overrideSubInventory, overrideShipmentMethod);
                        console.log("payload = " + ko.toJS(payload));

                        // create sales order
                        var cbSuccessFn = function (data, xhr) {
                            try {
                                console.log("raw data returned = " + ko.toJSON(data));
                                var respJSON = data['OutputGetEarliestShipDate'];

                                if (respJSON == null)
                                    return;
                                var shipDate = respJSON['O_SHIP_DATE'];
                                if (commonHelper.isDateFormat(shipDate, "YYYY-MM-DDTHH:mm:ss.sssZ")) {
                                    shipDate = commonHelper.formatStrDate(shipDate, "YYYY-MM-DDTHH:mm:ss.sssZ", "YYYY-MM-DD");
                                }
                                if (shipDate == null) {
                                    shipDate = commonHelper.getClientCurrentDate("YYYY-MM-DD");
                                }
                                console.log("shipDate = " + shipDate);
                                self.overrideShipmentDate(shipDate);
                                
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
                            ui.hideBusy();
                        };
                        service.getEarliestShipDateByCPMessage(payload).then(cbSuccessFn, cbFailFn);
                    }
                };

                self.optionChangeShipmentDate = function (cart, data, event) {
                    if (event.option != "value")
                        return;
                    if (cart && commonHelper.isValid(event.value)) {
                        cart.shipment(commonHelper.formatStrDate(event.value, "YYYY-MM-DD", "YYYY/MM/DD"));
                    }
                };

                self.optionChangeShipmentMethod = function (cart, data, event) {
                    console.log("optionChangeShipmentMethod");
                    if (event.option != "value")
                        return;

                    // ignore if offline
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (!isOnline)
                        return;

                    var itemIndex = self.cart().indexOf(cart);
                    var subInventory;
                    var shipmentMethod;

                    // ignore it if sub-inventory is not MS-WAREHSE
                    // get sub-inventory
                    if (ko.isObservable(cart.subInventory)) {
                        subInventory = ko.utils.unwrapObservable(cart.subInventory);
                    }
                    if (Array.isArray(subInventory)) {
                        subInventory = subInventory[0];
                    }
                    // skip it
                    // if (subInventory != constant.MS_WAREHSE && subInventory != constant.PW_WAREHSE)
                    //    return;

                    // get shipment method
                    if (ko.isObservable(cart.shipmentMethod)) {
                        shipmentMethod = ko.utils.unwrapObservable(cart.shipmentMethod);
                    }
                    if (Array.isArray(shipmentMethod)) {
                        shipmentMethod = shipmentMethod[0];
                    }
                    
                    if (self.shipDateObatined()) {
                        self.shipDateObatined(false);
                        return;
                    }

                    if (shipmentMethod) {
                        ui.showBusy();
                        var payload = service.getEarliestShipDateByCPPayload(subInventory, shipmentMethod);
                        console.log("payload = " + ko.toJS(payload));

                        // create  sales order
                        var cbSuccessFn = function (data, xhr) {
                            try {
                                // console.log("raw data returned = " + ko.toJSON(data));
                                var respJSON = data['OutputGetEarliestShipDate'];

                                if (respJSON == null)
                                    return;
                                var shipDate = respJSON['O_SHIP_DATE'];
                                if (commonHelper.isDateFormat(shipDate, "YYYY-MM-DDTHH:mm:ss.sssZ")) {
                                    shipDate = commonHelper.formatStrDate(shipDate, "YYYY-MM-DDTHH:mm:ss.sssZ", "YYYY/MM/DD");
                                }
                                if (shipDate == null) {
                                    shipDate = commonHelper.getClientCurrentDate();
                                }
                                console.log("shipDate = " + shipDate);

                                cart.shipment(shipDate);

                                self.cart.splice(itemIndex, 1, cart);

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
                            ui.hideBusy();
                        };
                        service.getEarliestShipDateByCPMessage(payload).then(cbSuccessFn, cbFailFn);
                    }
                };

                self.optionChangeOverrideBillTo = function (data, event) {
                    if (event.option != "value")
                        return;
                    console.log("event.value=" + event.value);
                };

                self.optionChangeOverrideSalesRep = function (data, event) {
                    if (event.option != "value")
                        return;
                    console.log("event.value=" + event.value);

//                    // enable the place order button
//                    self.validateOrderFailed(false);
//                    
//                    var salesRepID = ko.utils.unwrapObservable(self.overrideSalesRep());
//                    if (typeof salesRepID !== "undefined" && salesRepID != "-1") {
//                        // re-calculate again
//                        if (preCheck(true)) {
//                            validateSalesOrder();
//                        }
//                    } else {
//                        self.validateOrderFailed(true);
//                    }
                };

                self.optionChangedHandler = function (cart, data, event) {
                    console.log("optionChangedHandler");
                    if (event.option != "value")
                        return;

                    // ignore if offline
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (!isOnline)
                        return;

                    ui.showBusy();

                    var itemIndex = self.cart().indexOf(cart);
                    var userProfile = app.moduleConfig.params.rootContext.userProfile;
                    var subInventory;
                    var inventoryId = ko.utils.unwrapObservable(cart.product().id);
                    var orderedQuantity = ko.utils.unwrapObservable(cart.quantity);

                    if (ko.isObservable(cart.subInventory)) {
                        subInventory = ko.utils.unwrapObservable(cart.subInventory);
                    }

                    if (Array.isArray(subInventory)) {
                        subInventory = subInventory[0];
                    }

                    if (subInventory) {
                        var payload = service.getEarliestShipDatePayload(subInventory, userProfile.orgUnitId, inventoryId, orderedQuantity);
                        console.log("payload = " + ko.toJS(payload));

                        // create  sales order
                        var cbSuccessFn = function (data, xhr) {
                            try {
                                // console.log("raw data returned = " + ko.toJSON(data));
                                var respJSON = data['OutputGetEarliestShipDate'];

                                if (respJSON == null)
                                    return;
                                var shipDate = respJSON['O_SHIP_DATE'];
                                if (commonHelper.isDateFormat(shipDate, "YYYY-MM-DDTHH:mm:ss.sssZ")) {
                                    shipDate = commonHelper.formatStrDate(shipDate, "YYYY-MM-DDTHH:mm:ss.sssZ", "YYYY/MM/DD");
                                }
                                if (shipDate == null) {
                                    shipDate = commonHelper.getClientCurrentDate();
                                }
                                var shipMethod = respJSON['O_SHIPPING_METHOD'];
                                if (shipMethod == null) {
                                    shipMethod = "-1";
                                }
                                console.log("shipDate = " + shipDate);
                                console.log("shipMethod=" + shipMethod);
                                
                                cart.shipmentMethod(shipMethod);
                                cart.shipment(shipDate);
                                
                                // handle the lot number +
                                try {
                                    var lotJSON;
                                    var lotTable = respJSON['O_LOT_TBL_OUT'];
                                    var lotItem;
                                    if (lotTable) {
                                        lotItem = lotTable['O_LOT_TBL_OUT_ITEM'];
                                    }
                                    if (!Array.isArray(lotItem)) {
                                        var temp = new Array();
                                        temp.push(lotItem);
                                        lotJSON = temp;
                                    } else {
                                        lotJSON = lotItem;
                                    }  
                                    
                                    var lot;
                                    var LOT_NUMBER = [];
                                    ko.utils.arrayMap(lotJSON, function (item) {
                                        if (new String(item.LOT_NUMBER) != "-1" && new String(item.LOT_NUMBER) != "-2") {
                                            LOT_NUMBER.push(ko.toJS({value: item.LOT_NUMBER, label: item.LOT_NUMBER}));
                                        } else {
                                            LOT_NUMBER.push(ko.toJS({value: "-1", label: ""}));
                                        }
                                    });  
                                    
                                    if (Array.isArray(LOT_NUMBER) && LOT_NUMBER.length >= 1) {
                                        lot = LOT_NUMBER[0]['value'];
                                        cart.product().lot(lot);
                                    } else {
                                        cart.product().lot("");
                                    }        
                                    
                                    cart.lotArray(LOT_NUMBER);
                                } catch (ex) {
                                    console.log("error on getting lot Number:" + ex);
                                    cart.product().lot("");
                                    var LOT_NUMBER = [];
                                    cart.lotArray(LOT_NUMBER);
                                }     
                                // handle the lot number -
                                
                                console.log("cart = " + ko.toJSON(cart));
                                self.cart.splice(itemIndex, 1, cart);
                                // console.log("self.cart = " + ko.toJSON(self.cart));

                            } catch (e) {
                                console.error(e);
                                ui.hideBusy();
                            } finally {
                                console.log("cbSuccessFn called");
                                self.shipDateObatined(true);
                                ui.hideBusy();
                            }
                        };
                        var cbFailFn = function (data, xhr) {
                            console.log("cbFailFn failed");
                            ui.hideBusy();
                        };
                        service.getEarliestShipDateMessage(payload).then(cbSuccessFn, cbFailFn);

                    }
                };

                function getServiceName() {
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    var reqName;
                    var resName;
                    if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                        reqName = "createWineOrderService";
                        resName = "OutputCreateWineOrder";
                    } else {
                        if (isOrderDeskAdmin()) {
                            reqName = "createBeerOrderSyncService";
                        } else {
                            reqName = "createBeerOrderService";
                        }
                        resName = "OutputCreateBeerOrder";
                    }

                    return {reqName: reqName, resName: resName};
                }

                function getPriceListPayload() {
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var priceListId = ko.utils.unwrapObservable(customerProfile.priceListId);
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var orgUnitId = ko.utils.unwrapObservable(user.orgUnitId);

                    var priceListKeys = [];
                    var P_PRICE_LIST_ID_TBL_ITEM = [];
                    priceListKeys.push(priceListId);
                    for (var i = 0; i < priceListKeys.length; i++) {
                        P_PRICE_LIST_ID_TBL_ITEM.push({"PRICE_LIST_ID": priceListKeys[i]});
                    }

                    var payload = JSON.stringify({
                        "InputGetPriceList": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": orgUnitId,
                            "P_PRICE_LIST_ID_TBL": {"P_PRICE_LIST_ID_TBL_ITEM": P_PRICE_LIST_ID_TBL_ITEM}
                        }
                    });
                    console.log("price list payload = " + ko.toJS(payload));
                    return payload;
                }

                function getPriceList() {
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var userProfile = app.moduleConfig.params.rootContext.userProfile;
                    var orgUnitId = ko.utils.unwrapObservable(userProfile.orgUnitId);
                    var priceListId = ko.utils.unwrapObservable(customerProfile.priceListId);
                    var key = constant.STANDARD_PRICE_LIST_KEY + ":" + orgUnitId + ":" + priceListId;
                    var data = ui.getLocalStorage(key);
                    var respJSON = data['P_PRICE_LIST_TBL_ITEM'];
                    return respJSON;
                }

                function isValidOrderItem(cart) {
                    var normalStatus = true;
                    var removeItem = [];

                    // convert to observable array
                    var result = ko.isObservable(cart);
                    if (!result) {
                        cart = ko.observableArray(cart);
                    }
                    // get price list
                    var respJSON = getPriceList();
                    console.log("respJSON=" + respJSON[0].ORGANIZATION_ID);
//                    if (respJSON) {
//                        self.beerShipFromOrgID(respJSON[0].ORGANIZATION_ID);
//                    }

                    ko.utils.arrayForEach(cart(), function (item) {
                        var found = false;
                        var productId = ko.utils.unwrapObservable(item.product().id);
                        var original = ko.utils.unwrapObservable(item.original);

                        var foundItem = ko.utils.arrayFirst(respJSON, function (item) {
                            return item['INVENTORY_ITEM_ID'] == productId;
                        });
                        console.log("foundItem =" + ko.toJSON(foundItem));

                        if (foundItem)
                            found = true;
                        if (!found || original == "N" || typeof original === "undefined") {
                            removeItem.push(item);
                        }
                        console.log("product id " + productId + " found in price list table is " + found);
                    });
                    console.log(" removeitem = " + ko.toJSON(removeItem));

                    if (removeItem.length > 0) {
                        cart.removeAll(removeItem);
                        console.log("self.targetCart = " + ko.toJSON(self.targetCart));
                        normalStatus = false;
                    }

                    return normalStatus;
                }
                
                

                self.placeOrder = function (data, event) {
                    console.log("clicked placeOrder");
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (!isOnline) {
                        ui.showMessageBox(self.lng_error_00005);
                    } else {
                        // check the override sales resp
                        if (self.isOrderDeskAdmin()) {
                            var salesRepID = ko.utils.unwrapObservable(self.overrideSalesRep());
                            console.log("salesRepID=" + salesRepID);
                            if (typeof salesRepID === "undefined" || new String(salesRepID).valueOf() == "-1") {
                                ui.showMessageBox(self.lng_error_00022);
                                return;
                            }
                            var billToSiteID = ko.utils.unwrapObservable(self.overrideBillTo());
                            console.log("billToSiteID=" + billToSiteID);
                            if (typeof billToSiteID === "undefined" || new String(billToSiteID).valueOf() == "-1") {
                                ui.showMessageBox(self.lng_error_00023);
                                return;
                            }
                        }
                        // validate the order item input
                        var itemCnt = self.cart().length;
                        if (itemCnt <= 0) {
                            ui.showMessageBox(self.lng_error_00006);
                            return;
                        }
                        var isMaintenance = maintenance.isMaintenance();
                        if (isMaintenance) {
                            ui.showMessageBox(self.lng_maintenance);
                            return;
                        }
                        if (confirm(self.lng_confirmPlaceOrder)) {
                            proceedSalesOrder();
                        }
                    }
                };

                function proceedSalesOrder() {
                    console.log("proceedSalesOrder");
                    
                    // determine the wine / beer order service name
                    var rtn = getServiceName();
                    var reqName = rtn.reqName;
                    var resName = rtn.resName;

                    var payload = preparePayload4Create();
                    console.log("payload = " + ko.toJS(payload));
                    
                    ui.showBusy();

                    // create  sales order
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            console.log("raw data returned = " + ko.toJSON(data));
                            
                            var returnStatus = data[resName]['ReturnStatus'];
                            var returnMessage = data[resName]['ReturnMessage'];

                            if (returnStatus == "S" || returnStatus == "W") {
                                ui.showMessageBox(self.lng_orderReceived);
                                var custId = app.moduleConfig.params.rootContext.custId;
                                app.moduleConfig.params.rootContext.requireRefresh = true;
                                // update the data offline status
                                if (isDataSync()) {
                                    var order = app.moduleConfig.params.rootContext.savedOrder;
                                    var payload = ko.toJS({status: "S", data: order.data});
                                    app.moduleConfig.params.rootContext.savedOrder = payload;
                                    app.go("dataSync");
                                } else {
                                    app.redirect("orderHist", custId);
                                }
                            } else {
                                ui.showMessageBox(returnMessage);
                            }

                        } catch (e) {
                            ui.hideBusy();
                            ui.showMessageBox(self.lng_error_00008);
                            console.error(e);
                        } finally {
                            // log event - placeOrder
                            var user = app.moduleConfig.params.rootContext.userProfile;
                            var logPayload = logger.getEventLogPayload(user.username, constant.EVENT_PLACE_ORDER,
                                    ko.toJS(payload),
                                    ko.toJSON({"shipmentDate": self.overrideShipmentDate(), "SubInventory": self.overrideSubInventory(), "ShipmentMethod": self.overrideShipmentMethod()}));
                            logger.log(logPayload);                              
                            ui.hideBusy();
                            console.log("cbSuccessFn called");
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00008);
                    };
                    service.createSalesOrderMessage(payload, reqName).then(cbSuccessFn, cbFailFn);
                }

                self.payByCash = function (data, event) {
                    console.log("payByCash");
                    createVanOrder(constant.PAY_BY_CASH);
                };

                self.payByCheque = function (data, event) {
                    console.log("payByCheque");
                    createVanOrder(constant.PAY_BY_CHEQUE);
                };
                
                self.payByOthers = function (data, event) {
                    console.log("payByOthers");
                    createVanOrder(constant.PAY_BY_OTHERS);
                };
                
                self.createOrder = function (data, event) {
                    console.log("createOrder");
                    createVanOrder(null);
                };

                function createVanOrder(paymentType) {
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (!isOnline) {
                        ui.showMessageBox(self.lng_error_00005);
                    } else {
                        ui.showBusy();

                        // validate the sales order item input
                        var itemCnt = self.cart().length;
                        if (itemCnt <= 0) {
                            ui.hideBusy();
                            ui.showMessageBox(self.lng_error_00009);
                            return;
                        }

                        var newOrder = prepareOrder(false);
                        cartService.setOrder(newOrder); // keep the latest image for payment

                        var payload = service.getVanOrderPayload(newOrder, self.cart, paymentType);
                        console.log("payload = " + ko.toJS(payload));

                        var resName = "OutputCreateVanOrder";

                        // create  sales order
                        var cbSuccessFn = function (data, xhr) {
                            try {
                                console.log("raw data returned = " + ko.toJSON(data));
                                ui.hideBusy();

                                var returnStatus = data[resName]['ReturnStatus'];
                                var returnMessage = data[resName]['ReturnMessage'];
                                var headerId = data[resName]['HEADER_ID'];
                                var orderNo = data[resName]['ORDER_NUMBER'];
                                var orderStatus = data[resName]['FLOW_STATUS_CODE'];
                                var paymentParams = ko.toJS({HEADER_ID: headerId, ORDER_NUMBER: orderNo, FLOW_STATUS_CODE: orderStatus, PAYMENT_TYPE: paymentType});

                                if (returnStatus == "E") {
                                    ui.showMessageBox(returnMessage);
                                } else if (returnStatus == "S") {
                                    cartService.setCart(self.cart); // keep the latest image for payment
                                    // var custId = app.moduleConfig.params.rootContext.custId;
                                    // app.moduleConfig.params.rootContext.headerId = headerId;
                                    app.moduleConfig.params.rootContext.paymentParameter = paymentParams;
                                    app.moduleConfig.params.rootContext.isContinuePayment = false;
                                    app.redirect("payment", headerId);
                                }

                            } catch (e) {
                                ui.hideBusy();
                                ui.showMessageBox(self.lng_error_00008);
                                console.error(e);
                            } finally {
                                console.log("cbSuccessFn called");
                            }
                        };
                        var cbFailFn = function (data, xhr) {
                            console.log("cbFailFn failed");
                            ui.hideBusy();
                            ui.showMessageBox(self.lng_error_00008);
                        };
                        service.createVanOrderMessage(payload).then(cbSuccessFn, cbFailFn);
                    }
                }

                self.performCal = function (data, event) {
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (isOnline) {
                        if (preCheck(true)) {
                            validateSalesOrder();
                        }
                    }
                };

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

                self.save = function (data, event) {
                    console.log("save the checkout");
                    try {
                        var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                        var foundPayload = false;
                        var payloadCnt = 0;
                        var key = cartService.getOfflineKey();
                        var storedPayload = ui.getLocalStorage(key);
                        var indexOrderNumber = -1;
                        var savedOrderNumber = "";
                        var _savedOrderNumber = "";
                        var _maxOrderNumber = 0;
                        var orderNumber = "";
                        console.log("storedPayload = " + ko.toJSON(storedPayload));

                        if (ko.isObservable(storedPayload)) {
                            storedPayload = ko.utils.unwrapObservable(storedPayload);
                        }
                        
                        var savedOrder = app.moduleConfig.params.rootContext.savedOrder;
                        console.log("savedOrder=" + ko.toJSON(savedOrder));
                        if (savedOrder && (savedOrder != "undefined")) {
                            _savedOrderNumber = savedOrder.data.ORDER_NUMBER;
                            console.log("_savedOrderNumber = " + _savedOrderNumber);
                        }

                        if (storedPayload) {
                            try {
                                foundPayload = true;
                                payloadCnt = storedPayload.data.length;
                                
                                // handle the saved order within a same order number 
                                console.log("payloadCnt=" + payloadCnt);
                                for (var i = 0; i < payloadCnt; i++) {
                                    var _orderNumber = storedPayload.data[i].order.ORDER_NUMBER;
                                    console.log("_orderNumber = " + _orderNumber);
                                    var _maxOrderNumber = _orderNumber.split(".");
                                    _maxOrderNumber = new Number(_maxOrderNumber[1].trim());
                                    console.log("_maxOrderNumber=" + _maxOrderNumber);
                                    if (_orderNumber == _savedOrderNumber) {
                                        indexOrderNumber = i;
                                        savedOrderNumber = _orderNumber;
                                    }
                                }                                   
                                if (indexOrderNumber >= 0) {
                                    orderNumber = savedOrderNumber;
                                } else {
                                    if (_maxOrderNumber > 0) {
                                        payloadCnt = _maxOrderNumber + 1;
                                    } else {
                                        payloadCnt++;
                                    }
                                    orderNumber = "NO. " + payloadCnt;
                                }
                            } catch (ex) {
                                console.log("exception:" + ex);
                                foundPayload = false;
                                payloadCnt++;
                                orderNumber = "NO. " + payloadCnt;
                            }
                        } else {
                            payloadCnt++;
                            orderNumber = "NO. " + payloadCnt;
                        }

                        // order info
                        var newOrder = prepareOrder(false);
                        newOrder.status("SAVED");
                        newOrder.order_no(orderNumber);
                        newOrder.order_type("");
                        newOrder.order_tot_amt(ko.utils.unwrapObservable(self.total()));
                        newOrder.order_date(commonHelper.getClientCurrentDate("YYYY/MM/DD"));
                        newOrder.ship_to_district(ko.utils.unwrapObservable(customerProfile.shipToDistrict));
                        newOrder.shipping_address(ko.utils.unwrapObservable(customerProfile.shipToAddress));
                        newOrder.billing_address(ko.utils.unwrapObservable(customerProfile.billToAddress));
                        newOrder.cust_name(ko.utils.unwrapObservable(customerProfile.name));
                        newOrder.sold_to_org_id(ko.utils.unwrapObservable(customerProfile.id));
                        newOrder.invoice_to_org_id(ko.utils.unwrapObservable(customerProfile.billToSiteId));
                        newOrder.price_list_id(ko.utils.unwrapObservable(customerProfile.priceListId));
                        newOrder.payment_term_id(ko.utils.unwrapObservable(customerProfile.paymentTermId));
                        newOrder.outlet_name(ko.utils.unwrapObservable(customerProfile.outletName));
                        newOrder.walk_in_cust(ko.utils.unwrapObservable(customerProfile.walkInCust));
                        newOrder.custAccountId(ko.utils.unwrapObservable(customerProfile.id));
                        newOrder.accountNumber(ko.utils.unwrapObservable(customerProfile.accountNumber));
                        newOrder.override_billTo(self.overrideBillTo());
                        newOrder.override_salesPerson(self.overrideSalesRep());
                        var overrideSubInventory = ko.utils.unwrapObservable(self.overrideSubInventory);
                        if (Array.isArray(overrideSubInventory)) {
                            overrideSubInventory = overrideSubInventory[0];
                        }
                        newOrder.override_sub_inventory(overrideSubInventory);
                        var overrideShipmentMethod = ko.utils.unwrapObservable(self.overrideShipmentMethod);
                        if (Array.isArray(overrideShipmentMethod)) {
                            overrideShipmentMethod = overrideShipmentMethod[0];
                        }
                        newOrder.override_shipment_method((overrideShipmentMethod == "-1") ? null : overrideShipmentMethod);
                        newOrder.override_shipment_date(ko.utils.unwrapObservable(self.overrideShipmentDate));
                        console.log("newOrder = " + ko.toJSON(newOrder));
                        var payload4Order = cartService.payload4Order(newOrder);
                        console.log("newOrder=" + ko.toJSON(payload4Order));

                        // order line info
                        var payload4OrderLines = [];
                        ko.utils.arrayMap(self.cart(), function (item) {
                            var payload4OrderLine = cartService.payload4OrderLine(item);
                            payload4OrderLines.push(payload4OrderLine);
                        });
                        console.log("newOrderLines=" + ko.toJSON(payload4OrderLines));

                        if (payload4OrderLines.length <= 0) {
                            ui.showMessageBox(self.lng_error_00010);
                            return;
                        }
                        
                        // construct the subInventoryMap
                        var subInventoryMap = app.moduleConfig.params.rootContext.subInventoryMap;
                        var subInventoryList = [];
                        for (var i = 0, keys = Object.keys(subInventoryMap), ii = keys.length; i < ii; i++) {
                          var data = ko.toJS({ 'subInventoryCode' : keys[i], 'dBeerFlag' :  subInventoryMap[keys[i]] });
                          subInventoryList.push(ko.toJS(data));
                        }                  
                        // prepare the payload for order + order line
                        var payload = ko.toJS({data: [{delivery: "N", order: payload4Order, orderdetail: payload4OrderLines, draughtBeerFlag: subInventoryList}]});
                        console.log("payload = " + ko.toJSON(payload));
                        
                        if (foundPayload) {
                            console.log("foundPayload");
                            if (indexOrderNumber >= 0) {
                                storedPayload.data.splice(indexOrderNumber, 1, ko.toJS({delivery: "N", order: payload4Order, orderdetail: payload4OrderLines}));
                            } else {
                                storedPayload.data.push(ko.toJS({delivery: "N", order: payload4Order, orderdetail: payload4OrderLines}));
                            }
                            ui.setLocalStorage(key, storedPayload);
                            console.log("storedPayload = " + ko.toJSON(storedPayload));
                        } else {
                            ui.setLocalStorage(key, payload);
                        }
                        
                        ui.showMessageBox(self.lng_orderInfoSaved);
                        if (!isDataSync()) {
                            var custId = app.moduleConfig.params.rootContext.custId;
                            app.redirect("orderHist", custId);
                        } else {
                            app.go("dataSync");
                        }
                    } catch (e) {
                        console.error(e);
                        ui.showMessageBox(self.lng_error_00003);
                    }

                };

                self.dispose = function (info) {
                    self.router.dispose();
                };

                self.goBack = function (data, event) {
                    console.log("goBack clicked");

                    var fromPage = app.moduleConfig.params.rootContext.fromPage;
                    var custId = app.moduleConfig.params.rootContext.custId;
                    var orderId = app.moduleConfig.params.rootContext.orderId;
                    console.log("checkOut.js fromPage=" + fromPage);
                    if (fromPage === "newOrder" || fromPage === "newOrderItem" || fromPage === "topOrderItem") {
                        app.redirect(fromPage, custId);
                    } else if (fromPage === "orderDetail") {
                        app.redirect(fromPage, orderId);
                    } else if (isDataSync()) {
                        // app.moduleConfig.params.rootContext.savedOrder = null;
                        app.go(fromPage);
                    } else {
                        // cartService.setCart(self.cart);
                        var orderId = ko.utils.unwrapObservable(self.currOrderId);
                        app.redirect("orderDetail", orderId);
                    }
                };

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_checkOut = getTranslation("ssa.checkOut.checkOut");
                    self.lng_onBehalfOf = getTranslation("ssa.checkOut.onBehalfOf");
                    self.lng_billTo = getTranslation("ssa.checkOut.billTo");
                    self.lng_salesRep = getTranslation("ssa.checkOut.salesRep");
                    self.lng_overview = getTranslation("ssa.checkOut.overview");
                    self.lng_purchaseOrder = getTranslation("ssa.checkOut.purchaseOrder");
                    self.lng_orderDate = getTranslation("ssa.checkOut.orderDate");
                    self.lng_totalItems = getTranslation("ssa.checkOut.totalItems");
                    self.lng_total = getTranslation("ssa.checkOut.total");
                    self.lng_overrideDeliverySchedule = getTranslation("ssa.checkOut.overrideDeliverySchedule");
                    self.lng_date = getTranslation("ssa.checkOut.date");
                    self.lng_remarks = getTranslation("ssa.checkOut.remarks");
                    self.lng_itemDetail = getTranslation("ssa.checkOut.itemDetail");
                    self.lng_subInventory = getTranslation("ssa.checkOut.subInventory");
                    self.lng_shipmentDate = getTranslation("ssa.checkOut.shipmentDate");
                    self.lng_shipmentMethod = getTranslation("ssa.checkOut.shipmentMethod");
                    self.lng_lot = getTranslation("ssa.checkOut.lot");
                    self.lng_qty = getTranslation("ssa.checkOut.qty");
                    self.lng_deliveryCost = getTranslation("ssa.checkOut.deliveryCost");
                    self.lng_orderSummary = getTranslation("ssa.checkOut.orderSummary");
                    self.lng_shippingAddress = getTranslation("ssa.checkOut.shippingAddress");
                    self.lng_billingAddress = getTranslation("ssa.checkOut.billingAddress");
                    self.lng_placeOrder = getTranslation("ssa.checkOut.placeOrder");
                    self.lng_payByCash = getTranslation("ssa.checkOut.payByCash");
                    self.lng_confirmPlaceOrder = getTranslation("ssa.checkOut.confirmProceed");
                    self.lng_confirmClear = getTranslation("ssa.checkOut.confirmClear");
                    self.lng_payByCheque = getTranslation("ssa.checkOut.payByCheque");
                    self.lng_payByOthers = getTranslation("ssa.checkOut.payByOthers");
                    self.lng_realCustomer = getTranslation("ssa.checkOut.realCustomer");
                    self.lng_error_00001 = getTranslation("ssa.msg.error.ERROR_00001");
                    self.lng_error_00002 = getTranslation("ssa.msg.error.ERROR_00002");
                    self.lng_error_00003 = getTranslation("ssa.msg.error.ERROR_00003");
                    self.lng_error_00004 = getTranslation("ssa.msg.error.ERROR_00004");
                    self.lng_error_00005 = getTranslation("ssa.msg.error.ERROR_00005");
                    self.lng_error_00006 = getTranslation("ssa.msg.error.ERROR_00006");
                    self.lng_orderReceived = getTranslation("ssa.msg.info.orderReceived");
                    self.lng_error_00008 = getTranslation("ssa.msg.error.ERROR_00008");
                    self.lng_error_00009 = getTranslation("ssa.msg.error.ERROR_00009");
                    self.lng_error_00010 = getTranslation("ssa.msg.error.ERROR_00010");
                    self.lng_error_00011 = getTranslation("ssa.msg.error.ERROR_00011");
                    self.lng_error_00012 = getTranslation("ssa.msg.error.ERROR_00012");
                    self.lng_error_00022 = getTranslation("ssa.msg.error.ERROR_00022");
                    self.lng_error_00023 = getTranslation("ssa.msg.error.ERROR_00023");
                    self.lng_orderInfoSaved = getTranslation("ssa.msg.info.orderInfoSaved");
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


            return  new CheckOutViewModel();
        }
);
