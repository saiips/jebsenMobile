define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/quotation/quotationService', 'pages/common/cartService', 'util/appui', 'pages/common/constant',  'util/commonhelper',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox', , 'ojs/ojnavigationlist', 'promise'],
        function (oj, ko, $, app, service, cartService, ui, constant, commonHelper) {

            function QuotationDetailViewModel() {
                var self = this;

                console.log("QuotationDetailViewModel");

                // router configuration
                self.router = app.router;

                /**
                 * Observable Arrays
                 */
                self.cust_name = ko.observable();
                self.quotation_no = ko.observable();
                self.quotation_date = ko.observable();
                self.real_customer = ko.observable();
                self.remarks = ko.observable();
                self.attention = ko.observable();
                self.salesTerms = ko.observable();
                self.availableSalesTerms = ko.observableArray();
                //self.delivery_cost = ko.observable();
                self.shipping_address = ko.observable();
                self.billing_address = ko.observable();
                self.status = ko.observable();
                self.currQuotationId = ko.observable();
                self.totalItems = ko.observable();
                self.total = ko.observable();
                self.headerTitle = ko.observable('');

                self.quotationItems = ko.observableArray([]);
                self.promotionItemLoaded = ko.observableArray();
                self.specialAmountLoaded = ko.observableArray();
                self.specialDiscountLoaded = ko.observableArray();
                
                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });                

                self.handleActivated = function (info) {
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("quotationDetail.js parentRouter=" + parentRouter.currentState().value);
                    console.log(">>>>>> originalCart = " + ko.toJSON(app.moduleConfig.params.rootContext.originalQuotationCart));
                    if (app.moduleConfig.params.rootContext.originalQuotationCart) {
                        app.moduleConfig.params.rootContext.originalQuotationCart = ko.observableArray([]);
                    }

                    var childRouter = parentRouter.getChildRouter("quotationDetail");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('quotationDetail');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set currQuotationId
                                    self.currQuotationId(stateId);
                                    console.log("quotationDetail.js stateId=" + stateId);
                                }
                            });
                            return state;
                        }
                    });
                    
                    initTranslations();
                                        
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
                        self.headerTitle(self.lng_quotationDetail);
                    }                         

                    return oj.Router.sync();
                };

                // load order details
                self.currQuotationId.subscribe(function (newQuotationId) {
                    ui.showBusy();
                    console.log("load quotation detail with " + newQuotationId);

                    var customer = app.moduleConfig.params.rootContext.selCustomerProfile;
                    self.cust_name(ko.utils.unwrapObservable(customer.name));
                    
                    self.showRealCustomer = ko.computed(function () {
                        if (ko.utils.unwrapObservable(customer.walkInCust) == "Y")
                            return true;
                        return false;
                    });                        

                    fillQuotationHeader();

                    function cbSuccessFn(data, xhr) {
                        console.log("raw data = " + ko.toJSON(data));
                        
                        // reset 
                        self.quotationItems.removeAll();
                        
                        try {
                            var respJSON = data;
                            if (typeof (data) === "string") {
                                respJSON = JSON.parse(data);
                            }
                            if (respJSON.P_QUOTATION_LINES_TBL) {
                                var result = respJSON.P_QUOTATION_LINES_TBL.P_QUOTATION_LINES_TBL_ITEM;
                                if (!$.isArray(result)) {
                                    result = new Array(result);
                                }

                                result.forEach(function (e) {
                                    e.REMARK = (e.REMARKS == "-1") ? "" : e.REMARKS;
                                    
                                    try {
                                        var modifierJSON = e.MODIFIER_TBL.MODIFIER_TBL_ITEM;
                                        if (typeof modifierJSON === "undefined") {
                                            e.MODIIFER_EXISTS = false;
                                        } else {
                                            if (!Array.isArray(e.MODIFIER_TBL.MODIFIER_TBL_ITEM)) {
                                                modifierJSON = new Array(e.MODIFIER_TBL.MODIFIER_TBL_ITEM);
                                            }
                                            e.MODIFIER_EXISTS = (modifierJSON && modifierJSON.length > 0) ? true : false;
                                        }
                                    } catch (ex) {
                                        e.MODIIFER_EXISTS = false;
                                    }
                                    
                                    self.quotationItems.push(e);
                                });
                                self.totalItems(result.length);
                                self.total(result[0].ORDER_TOT_AMT);
                                // console.log("Datasource = " + ko.toJSON(self.quotationItems));
                            }
                        } catch (e) {
                            console.error(e);
                            ui.hideBusy();
                        } finally {
                            console.log("cbSuccessFn called");
                            ui.hideBusy();
                        }
                    }

                    function cbFailFn(data, xhr) {
                        console.log("cbFailFn failed");
                        ui.hideBusy();
                    }
                    service.getQuotationItemMessage(getPayload(newQuotationId)).then(cbSuccessFn, cbFailFn);
                });
                
                self.modifier = function (data, event) {
                    console.log("modifier clicked");
                    console.log("data = " + ko.toJSON(data));
                    
                    // get the quotation header id
                    var quotationId = self.currQuotationId();
                    app.moduleConfig.params.rootContext.quotationId = quotationId;         
                    
                    // convert to cart item class
                    data.PRODUCT = data.ORDERED_ITEM;
                    var cartItem = cartService.createCartItem(data, 1, true, commonHelper.getClientCurrentDate(), 'Y', new Array());
                    
                    // assign the modifier item
                    var modifierJSON;
                    try {
                        modifierJSON = data.MODIFIER_TBL.MODIFIER_TBL_ITEM;
                        if (modifierJSON) {
                            if (!Array.isArray(modifierJSON)) modifierJSON = new Array(modifierJSON);
                        }
                    } catch (ex) {
                        modifierJSON = null;
                    }
                    
                    if (modifierJSON) {
                        var promotionItem = ko.observableArray();
                        var specialDiscount = ko.observableArray();
                        var specialAmount = ko.observableArray();

                        for (var index = 0; index < modifierJSON.length; index++) {
                            var modifierItem = cartService.createModifier(modifierJSON[index]);

                            if (modifierJSON[index].MODIFIER_TYPE == constant.MODIFIER_TYPE_ITEM) {
                                promotionItem.push(modifierItem);
                            } else if (modifierJSON[index].MODIFIER_TYPE == constant.MODIFIER_TYPE_DISCOUNT) {
                                specialDiscount.push(modifierItem);
                            } else if (modifierJSON[index].MODIFIER_TYPE == constant.MODIFIER_TYPE_AMOUNT) {
                                specialAmount.push(modifierItem);
                            }
                        }
                        cartItem.product().specialDiscount = specialDiscount;
                        cartItem.product().specialAmount = specialAmount;
                        cartItem.product().promotionItem = promotionItem;
                        console.log("cartItem = " + ko.toJSON(cartItem));
                    }

                    app.moduleConfig.params.rootContext.selectedItem = cartItem;
                    // set as enquiry Mode
                    app.moduleConfig.params.rootContext.enquiryMode = true;
                    
                    var inventoryId = data.INVENTORY_ITEM_ID;
                    app.redirect("modifier", inventoryId);                    
                };                

                function fillQuotationHeader() {
                    console.log("fillQuotationHeader");
                    var quotation = cartService.getQuotation();
                    console.log("quotation = " + ko.toJSON(quotation));
                    self.quotation_no(ko.utils.unwrapObservable(quotation.quotation_no));
                    self.quotation_date(ko.utils.unwrapObservable(quotation.quotation_date));
                    self.remarks(ko.utils.unwrapObservable(quotation.remarks));
                    self.status(ko.utils.unwrapObservable(quotation.status));
                    self.real_customer(ko.utils.unwrapObservable(quotation.real_customer));
                    self.attention(ko.utils.unwrapObservable(quotation.attention));
                    self.salesTerms(ko.utils.unwrapObservable(quotation.salesTerm));
                    
                    // populate the available sales terms
                    var getTranslation = oj.Translations.getTranslatedString;
                    ko.utils.arrayForEach(constant.SALES_TERMS_LIST, function(item) {
                         self.availableSalesTerms.push(ko.toJS({value: item.value, label: getTranslation(item.label)}));
                    });                    
                }

                function getPayload(newQuotationId) {
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                    var user = app.moduleConfig.params.rootContext.userProfile;

                    var payload = JSON.stringify({
                        "InputGetQuotationLines": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": orgUnitId,
                            "P_HEADER_ID": newQuotationId
                        }
                    });
                    return payload;
                }

                self.updateData = function (event, data) {
                    if (data['option'] === "value") {
                        // console.log("New Value : " + data.value);        // product.quantity
                        // console.log("Target ID : " + event.target.id);   // product.id
                        if (event.target.id) {
                            cartService.setCart(self.cart);
                        }
                    }
                };

                self.goBack = function () {
                    // go back to order history page by customer id
                    var custId = app.moduleConfig.params.rootContext.custId;
                    app.redirect("quotation", custId);
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };
                
                self.copyQuotation = function () {
                    app.moduleConfig.params.rootContext.originalQuotationCart = ko.observableArray();
                    ko.utils.arrayMap(self.quotationItems(), function(item) {
                        item.PRODUCT = item.ORDERED_ITEM;
                        var cartItem = cartService.createCartItem(item, 1, true, commonHelper.getClientCurrentDate(), 'Y', new Array());
                        // assign the modifier
                        populateModifier(cartItem, item); 
                        // console.log("cartItem = " + ko.toJSON(cartItem));                        
                        app.moduleConfig.params.rootContext.originalQuotationCart.push(cartItem);
                    });
                    app.moduleConfig.params.rootContext.isCopyQuotation = true;                    
                    app.moduleConfig.params.rootContext.fromPage = "quotationDetail";
                    app.moduleConfig.params.rootContext.newQuotationNavStateId = 'newQuotationItem';
                    var quotationId = self.currQuotationId();
                    app.moduleConfig.params.rootContext.quotationId = quotationId;
                    // var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    // var custId = ko.utils.unwrapObservable(customerProfile.id);
                    app.redirect("newQuotationItem", quotationId);                    
                };
                
                self.expressCopy = function () {
                    app.moduleConfig.params.rootContext.originalQuotationCart = ko.observableArray();
                    ko.utils.arrayMap(self.quotationItems(), function(item) {
                        item.PRODUCT = item.ORDERED_ITEM;
                        var cartItem = cartService.createCartItem(item, 1, true, commonHelper.getClientCurrentDate(), 'Y', new Array());
                        // assign the modifier
                        populateModifier(cartItem, item);
                        // console.log("cartItem = " + ko.toJSON(cartItem));
                        app.moduleConfig.params.rootContext.originalQuotationCart.push(cartItem);
                    });
                    app.moduleConfig.params.rootContext.isExpressCopy = true;
                    app.moduleConfig.params.rootContext.fromPage = "quotationDetail";
                    var quotationId = self.currQuotationId();
                    app.moduleConfig.params.rootContext.quotationId = quotationId;                    
                    // var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    // var custId = ko.utils.unwrapObservable(customerProfile.id);
                    app.redirect("checkOutQuotation", quotationId);                    
                }; 
                
                function resetModifier() {
                    self.specialDiscountLoaded.removeAll();
                    self.specialAmountLoaded.removeAll();
                    self.promotionItemLoaded.removeAll();                    
                }
                
                function populateModifier(cartItem, data) {
                    console.log("populate modifier data = " + ko.toJSON(data));
                    resetModifier();
                    
                    var length = 0;
                    var modifierJSON;
                    try {
                        modifierJSON = data.MODIFIER_TBL.MODIFIER_TBL_ITEM;
                        if (modifierJSON) {
                            if (!Array.isArray(modifierJSON)) modifierJSON = new Array(modifierJSON);
                            length = modifierJSON ? modifierJSON.length : 0;
                        } else {
                            length = 0;
                        }
                    } catch (ex) {
                        length = 0;
                    }

                    for (var index = 0; index < length; index ++) {
                        var modifierType = modifierJSON[index].MODIFIER_TYPE;
                        try {
                            if (modifierType == constant.MODIFIER_TYPE_ITEM) {
                                length = self.promotionItemLoaded().length;
                            } else if (modifierType == constant.MODIFIER_TYPE_DISCOUNT) {
                                length = self.specialDiscountLoaded().length;
                            } else if (modifierType == constant.MODIFIER_TYPE_AMOUNT) {
                                length = self.specialAmountLoaded().length;
                            }
                        } catch (ex) {
                        }     

                        var SHOW_LINK_BTN = (modifierJSON[index].FROM_STAGING == "Y" && modifierJSON[index].MODIFIER_NUMBER) ? "Y" : "N";
                        var SHOW_REMOVE_BTN = (modifierJSON[index].FROM_STAGING == "Y" && modifierJSON[index].MODIFIER_NUMBER) ? "Y" : "N";
                        var modifierData = {
                            "id": length + 1,
                            "MODIFIER_NUMBER": modifierJSON[index].MODIFIER_NUMBER,
                            "FROM_STAGING": modifierJSON[index].FROM_STAGING,
                            "MODIFIER_TYPE": modifierJSON[index].MODIFIER_TYPE,
                            "MODIFIER_ITEM_ID": modifierJSON[index].MODIFIER_ITEM_ID,
                            "MODIFIER_VALUE_FROM": modifierJSON[index].MODIFIER_VALUE_FROM,
                            "GET_ITEM_ID": modifierJSON[index].GET_ITEM_ID,
                            "GET_ITEM_NUMBER": modifierJSON[index].GET_ITEM_NUMBER,
                            "GET_QUANTITY": modifierJSON[index].GET_QUANTITY,
                            "GET_PRICE": modifierJSON[index].GET_PRICE,
                            "GET_PROMOTION_NATURE": modifierJSON[index].GET_PROMOTION_NATURE,
                            "GET_PERCENT": modifierJSON[index].GET_PERCENT,
                            "MODIFIER_START_DATE": modifierJSON[index].MODIFIER_START_DATE,
                            "MODIFIER_END_DATE": modifierJSON[index].MODIFIER_END_DATE,
                            "MODIFIER_SHIP_TO": modifierJSON[index].MODIFIER_SHIP_TO,
                            "SHOW_LINK_BTN": SHOW_LINK_BTN,
                            "SHOW_REMOVE_BTN": SHOW_REMOVE_BTN
                        };      
                        var modifierItem = cartService.createModifier(modifierData, true);
                        
                        if (modifierType == constant.MODIFIER_TYPE_ITEM) {
                            self.promotionItemLoaded.push(modifierItem);
                        } else if (modifierType == constant.MODIFIER_TYPE_DISCOUNT) {
                            self.specialDiscountLoaded.push(modifierItem);
                        } else if (modifierType == constant.MODIFIER_TYPE_AMOUNT) {
                            self.specialAmountLoaded.push(modifierItem);
                        }   
                        
                        // assign back to the cartitem
                        cartItem.product().specialDiscount = self.specialDiscountLoaded;
                        cartItem.product().specialAmount = self.specialAmountLoaded;
                        cartItem.product().promotionItem = self.promotionItemLoaded;      
                        cartItem.product().isFetchModifier(true);
                    }
                }                

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_quotationDetail = getTranslation("ssa.quotationDetail.quotationDetail");
                    self.lng_overview = getTranslation("ssa.quotationDetail.overview");
                    self.lng_quotationNo = getTranslation("ssa.quotationDetail.quotationNo");
                    self.lng_quotationDate = getTranslation("ssa.quotationDetail.quotationDate");
                    self.lng_totalItems = getTranslation("ssa.quotationDetail.totalItems");
                    self.lng_total = getTranslation("ssa.quotationDetail.total");
                    self.lng_remarks = getTranslation("ssa.quotationDetail.remarks");
                    self.lng_itemsDetail = getTranslation("ssa.quotationDetail.itemsDetail");
                    self.lng_lot = getTranslation("ssa.quotationDetail.lot");
                    self.lng_qty = getTranslation("ssa.quotationDetail.qty");
                    self.lng_quotationSummary = getTranslation("ssa.quotationDetail.quotationSummary");
                    self.lng_shippingAddress = getTranslation("ssa.quotationDetail.shippingAddress");
                    self.lng_billingAddress = getTranslation("ssa.quotationDetail.billingAddress");
                    self.lng_realCustomer = getTranslation("ssa.quotationDetail.realCustomer");
                    self.lng_copyQuotation = getTranslation("ssa.quotationDetail.copyQuotation");
                    self.lng_expressCopy = getTranslation("ssa.quotationDetail.expressCopy");
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

            return new QuotationDetailViewModel();
        }
);
