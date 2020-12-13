define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/checkOut/checkOutService',
    'pages/common/cartService', 'pages/newOrder/newOrderService', 'util/appui', 'util/commonhelper', 'pages/common/constant', 'pages/common/maintenance',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton',
    'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojdatetimepicker'],
        function (oj, ko, $, app, service, cartService, priceListService, ui, commonHelper, constant, maintenance) {

            function CheckOutQuotationViewModel() {
                var self = this;

                var customerProfile, userProfile, shipToOrgId;

                // constant variables
                var RESPONSE_TABLE = 'OutputQuotationOrder';

                // router configuration
                self.router = app.router;

                console.log("CheckOutQuotationViewModel");

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
                self.currQuotationId = ko.observable();
                self.ship_to_district = ko.observable();
                self.isShowLotNumber = ko.observable(true);
                self.headerTitle = ko.observable("");
                self.startDate = ko.observable();
                self.endDate = ko.observable();
                self.minStartDate = ko.observable(commonHelper.getClientCurrentDate("YYYY-MM-DD"));
                self.minEndDate = ko.observable(commonHelper.getClientCurrentDate("YYYY-MM-DD"));
                self.attention = ko.observable();
                self.salesTerms = ko.observable();
                self.availableSalesTerms = ko.observableArray();

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
                    console.log("checkOutQuotation.js parentRouter=" + parentRouter.currentState().value);

                    var childRouter = parentRouter.getChildRouter("checkOutQuotation");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('checkOutQuotation');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set current order id
                                    self.currQuotationId(stateId);
                                    console.log("checkOutQuotation.js stateId =" + stateId);
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
                self.currQuotationId.subscribe(function (newOrderId) {
                    console.log("newOrderId=" + newOrderId);
                });
                
                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                }); 
                
                
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

                function getSessionInfo() {
                    customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    userProfile = app.moduleConfig.params.rootContext.userProfile;
                    shipToOrgId = app.moduleConfig.params.rootContext.outLetId;
                }

                function resetAll() {
                    self.cart.removeAll();
                    self.real_customer("");
                    self.remarks("");
                    self.order_date("");
                    self.ship_to_district("");
                    self.shipping_address("");
                    self.billing_address("");
                    self.attention("");
                    self.salesTerms(constant.SALES_TERMS_DIRECT_SALES);
                    self.availableSalesTerms.removeAll();
                    
                    self.showRealCustomer = ko.computed(function () {
                        if (ko.utils.unwrapObservable(customerProfile.walkInCust) == "Y") return true;
                        return false;
                    });                    
                }

                function init() {
                    console.log("init called");
                    
                    getSessionInfo();            
                    
                    var isReturnFromModifier = (app.moduleConfig.params.rootContext.fromModifier == "Y") ? true : false;
                    
                    if (!isReturnFromModifier) {
                        ui.showBusy();
                        
                        // reset 
                        resetAll();

                        showLotNumber();
                        
                        var customerPriceList;
                        
                        priceListService.getPriceListMessage(getPriceListPayload()).done(function (data) {
                            console.log("Customer Price List is ready.");
                            if (data) {
                                customerPriceList = data["P_PRICE_LIST_TBL_ITEM"];
                            }
                        }).then(function() {
                            fillQuotation();

                            fillShoppingCart(customerPriceList);
                            
                            ui.hideBusy();
                        })
                    } else {
                        self.cart.removeAll();
                        
                        fillShoppingCart(customerPriceList);
                        
                        app.moduleConfig.params.rootContext.fromModifier = "N";
                    }
                }

                function fillShoppingCart(customerPriceList) {
                    // fill shopping cart
                    self.targetCart = app.moduleConfig.params.rootContext.originalQuotationCart;
                    console.log("self.targetCart = " + ko.toJSON(self.targetCart));
                    // console.log("customerPriceList = " + ko.toJSON(customerPriceList));

                    // add back to the shopping cart
                    var cartArray = ko.utils.unwrapObservable(self.targetCart);
                    var cartArrayLength = cartArray.length;

                    for (var i = 0; i < cartArrayLength; i++) {
                        // find the item in customer price list
                        if (customerPriceList) {
                            $.each(customerPriceList, function (x, v) {
                                if (v.INVENTORY_ITEM_ID == ko.utils.unwrapObservable(cartArray[i].product().id)) {
                                    cartArray[i].product().price(v.UNIT_PRICE);
                                    // console.log("found the item in the customer list");
                                }
                            });
                        }
                        
                        var cart_item = cartService.cloneCartItem(cartArray[i]);
                        console.log("cart_item = " + ko.toJSON(cart_item));
                        self.cart.push(cart_item);
                    }
                }

                function fillQuotation() {
                    self.cust_name(ko.utils.unwrapObservable(customerProfile.name));
                    self.purchase_order("");
                    self.real_customer("");
                    self.remarks("");
                    self.delivery_cost(0);
                    self.shipping_address("");
                    self.billing_address("");
                    self.ship_to_district("");
                    self.order_date(commonHelper.getClientCurrentDate());
                    self.startDate("");
                    self.endDate("");
                    self.attention("");
                    
                    // populate the available sales terms
                    var getTranslation = oj.Translations.getTranslatedString;
                    ko.utils.arrayForEach(constant.SALES_TERMS_LIST, function(item) {
                         self.availableSalesTerms.push(ko.toJS({value: item.value, label: getTranslation(item.label)}));
                    });     
                    
                    if (app.moduleConfig.params.rootContext.isExpressCopy || app.moduleConfig.params.rootContext.isCopyQuotation) {
                        var quotation = cartService.getQuotation();
                        console.log("quotation=" + ko.toJSON(quotation));
                        
                        self.real_customer(quotation.real_customer());
                        self.remarks(quotation.remarks());
                        self.attention(quotation.attention());
                        self.salesTerms(quotation.salesTerm());
                    }
                    
                }

                function getShipFromOrgId(orgUnitId) {
                    if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                        return constant.SHIP_FROM_ORG_ID_2922;
                    } else if (orgUnitId == constant.ORG_UNIT_ID_BEER) {
                        return constant.SHIP_FROM_ORG_ID_2920;
                    }
                }

                function prepareQuotation(quotationId) {
                    console.log("prepareQuotation quotationId=" + quotationId);
                    var quotation = cartService.getQuotation();

                    var newQuotation = cartService.createQuotation(quotation);
                    newQuotation.cust_name(ko.utils.unwrapObservable(customerProfile.name));
                    newQuotation.sold_to_org_id(ko.utils.unwrapObservable(customerProfile.id));
                    newQuotation.ship_to_org_id(ko.utils.unwrapObservable(customerProfile.shipToSiteId));
                    newQuotation.invoice_to_org_id(ko.utils.unwrapObservable(customerProfile.billToSiteId));
                    newQuotation.price_list_id(ko.utils.unwrapObservable(constant.PRICE_ID_WINE)); // use standard price list for Quotation
                    newQuotation.quotation_date(commonHelper.getClientCurrentDate("YYYY/MM/DD"));
                    newQuotation.sold_from_org_id(ko.utils.unwrapObservable(userProfile.orgUnitId));
                    newQuotation.ship_from_org_id(getShipFromOrgId(ko.utils.unwrapObservable(userProfile.orgUnitId)));
                    newQuotation.sales_rep_id(ko.utils.unwrapObservable(userProfile.erpSalesId));
                    newQuotation.transactional_curr_code("HKD");
                    newQuotation.payment_term_id(ko.utils.unwrapObservable(customerProfile.paymentTermId));
                    newQuotation.remarks(ko.utils.unwrapObservable(self.remarks));
                    newQuotation.real_customer(ko.utils.unwrapObservable(self.real_customer));
                    var salesTerms = ko.utils.unwrapObservable(self.salesTerms);
                    if (Array.isArray(salesTerms)) salesTerms = salesTerms[0];
                    newQuotation.salesTerm(salesTerms);
                    newQuotation.attention(ko.utils.unwrapObservable(self.attention));
                    if (quotationId == "null" || quotationId == "-1" || typeof quotationId === "undefined" || !quotationId) {
                        newQuotation.oe_header_id( null );
                    } else {
                        newQuotation.oe_header_id(quotationId);
                    }
                    return newQuotation;
                }

                function preparePayload4Quotation(quotationId) {
                    var newQuotation = prepareQuotation(quotationId);
                    console.log("newQuotation = " + ko.toJSON(newQuotation));

                    return service.getCreateQuotationPayload(newQuotation, self.cart, ko.utils.unwrapObservable(self.startDate), ko.utils.unwrapObservable(self.endDate));
                }

                function showLotNumber() {
                    var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    if (salesRole == constant.SR_SALE_VAN || orgUnitId == constant.ORG_UNIT_ID_BEER) {
                        self.isShowLotNumber(false);
                    } else {
                        self.isShowLotNumber(true);
                    }
                }
                
                self.isModifierEnabled = ko.computed(function() {
                    return true;
                });
                
                self.modifier = function (data, event) {
                    cartService.setCart(self.cart);
                    app.moduleConfig.params.rootContext.selectedItem = data;
                    app.moduleConfig.params.rootContext.enquiryMode = false;
                    app.moduleConfig.params.rootContext.quotationId = self.currQuotationId();
                    var inventoryId = data.product().id();
                    app.redirect("modifier", inventoryId);                    
                };

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


                self.placeOrder = function (data, event) {
                    console.log("clicked placeOrder");
                    var isMaintenance = maintenance.isMaintenance();
                    if (isMaintenance) {
                        ui.showMessageBox(self.lng_maintenance);
                        return;
                    }      
                    var isOnline = app.moduleConfig.params.rootContext.isOnline;
                    if (!isOnline) {
                        ui.showMessageBox(self.lng_ERROR_00005);
                    } else {
                        // validate the order item input
                        var itemCnt = self.cart().length;
                        if (itemCnt <= 0) {
                            ui.showMessageBox(self.lng_ERROR_00007);
                            return;
                        }
                        if (!self.attention()) {
                            ui.showMessageBox(self.lng_ERROR_00041);
                            return;
                        }
                        if (!self.startDate()) {
                            ui.showMessageBox(self.lng_ERROR_00019);
                            return;
                        }
                        var startDate = moment(self.startDate());
                        var endDate = moment(self.endDate());
                        if (self.endDate() && startDate > endDate) {
                            ui.showMessageBox(self.lng_ERROR_00018);
                            return;
                        }
                        if (confirm(self.lng_confirmPlaceQuotation)) {
                            proceedQuotation(self.currQuotationId());
                        }
                    }
                };

                function proceedQuotation(quotationId) {
                    console.log("proceedQuotation");
                    ui.showBusy();
                    
                    var resName = "OutputCreateQuotation";

                    var payload = preparePayload4Quotation(quotationId);
                    console.log("payload = " + ko.toJS(payload));

                    // create  quotation
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            console.log("raw data returned = " + ko.toJSON(data));
                            ui.hideBusy();

                            var returnStatus = data[resName]['ReturnStatus'];
                            var returnMessage = data[resName]['ReturnMessage'];

                            if (returnStatus == "S" || returnStatus == "W") {
                                ui.showMessageBox("Your quotation is received and being processed.");
                                var custId = app.moduleConfig.params.rootContext.custId;
                                app.moduleConfig.params.rootContext.requireRefresh = true;
                                app.redirect("quotation", custId);
                            } else {
                                ui.showMessageBox(returnMessage);
                            }

                        } catch (e) {
                            ui.hideBusy();
                            ui.showMessageBox("Your quotation cannot be processed. Please re-try it later.");
                            console.error(e);
                        } finally {
                            console.log("cbSuccessFn called");
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        ui.hideBusy();
                        ui.showMessageBox("Your quotation cannot be processed. Please re-try it later.");
                    };
                    service.createQuotationMessage(payload).then(cbSuccessFn, cbFailFn);                           
                }

                self.dispose = function (info) {
                    self.router.dispose();
                };

                self.goBack = function (data, event) {
                    console.log("goBack clicked");
                    var fromPage = app.moduleConfig.params.rootContext.fromPage;
                    var custId = app.moduleConfig.params.rootContext.custId;
                    var quotationId = app.moduleConfig.params.rootContext.quotationId;
                    console.log("checkOutQuotation.js fromPage=" + fromPage);
                    if (fromPage == "newQuotation" || fromPage == "newQuotationItem" || fromPage == "topQuotationItem") {
                        app.redirect(fromPage, custId);
                    } else if (fromPage === "quotationDetail") {
                        app.redirect(fromPage, quotationId);
                    } else {
                        var orderId = ko.utils.unwrapObservable(self.currQuotationId);
                        app.redirect("quotationDetail", orderId);
                    }
                };

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_checkOut = getTranslation("ssa.checkOut.checkOut");                    
                    self.lng_overview = getTranslation("ssa.checkOut.overview");
                    self.lng_orderDate = getTranslation("ssa.checkOut.orderDate");
                    self.lng_totalItems = getTranslation("ssa.checkOut.totalItems");
                    self.lng_total = getTranslation("ssa.checkOut.total");
                    self.lng_remarks = getTranslation("ssa.checkOut.remarks");
                    self.lng_itemDetail = getTranslation("ssa.checkOut.itemDetail");
                    self.lng_lot = getTranslation("ssa.checkOut.lot");
                    self.lng_qty = getTranslation("ssa.checkOut.qty");
                    self.lng_confirmPlaceQuotation = getTranslation("ssa.checkOut.confirmProceed");
                    self.lng_placeQuotation = getTranslation("ssa.checkOut.placeQuotation");
                    self.lng_realCustomer = getTranslation("ssa.checkOut.realCustomer");
                    self.lng_overridePriceQuotation = getTranslation("ssa.checkOut.quotation.period");
                    self.lng_startDate = getTranslation("ssa.checkOut.quotation.startDate");
                    self.lng_endDate = getTranslation("ssa.checkOut.quotation.endDate");
                    self.lng_ERROR_00005 = getTranslation("ssa.msg.error.ERROR_00005");
                    self.lng_ERROR_00007 = getTranslation("ssa.msg.error.ERROR_00007");
                    self.lng_ERROR_00018 = getTranslation("ssa.msg.error.ERROR_00018");
                    self.lng_ERROR_00019 = getTranslation("ssa.msg.error.ERROR_00019");      
                    self.lng_ERROR_00041 = getTranslation("ssa.msg.error.ERROR_00041");      
                    self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                    self.lng_attention = getTranslation("ssa.quotationDetail.attention");
                    self.lng_salesTerms = getTranslation("ssa.quotationDetail.salesTerms"); 
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

            return new CheckOutQuotationViewModel();
        }
);
