define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/modifier/modifierService',
    'pages/common/cartService', 'pages/stockInquiry/stockInquiryService', 'util/appui', 'util/commonhelper', 'pages/common/constant', 'pages/common/maintenance', 'util/devmode', 'pages/common/logService',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton',
    'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojdatetimepicker',
    'ojs/ojdialog', 'ojs/ojrouter', 'ojs/ojnavigationlist'],
        function (oj, ko, $, app, service, cartService, priceListService, ui, commonHelper, constant, maintenance, devMode, logger) {

            function ModifierViewModel() {
                var self = this;

                // constant variables
                var RESPONSE_TABLE = 'O_MODIFIER_TBL';

                // router configuration
                self.router = app.router;

                console.log("ModifierViewModel");

                /**
                 * Observable Arrays
                 */
                self.ready = ko.observable(false);
                self.currInventoryId = ko.observable();
                self.headerTitle = ko.observable('');
                self.specialDiscountLoaded = ko.observableArray();
                self.specialDiscountFiltered = ko.observableArray();
                self.specialAmountLoaded = ko.observableArray();
                self.specialAmountFiltered = ko.observableArray();
                self.promotionItemLoaded = ko.observableArray();
                self.promotionItemFiltered = ko.observableArray();
                self.availablePromotionNature = ko.observableArray();
                self.cart = ko.observableArray();
                
                // observable for dialog page
                self.modifierType = ko.observable();
                self.dialogItem = ko.observableArray();
                self.dialogTemplateName = ko.computed(function() {
                    var template = "dialog_promotion_item_template";
                    if (self.modifierType() == constant.MODIFIER_TYPE_ITEM) {
                        template = "dialog_promotion_item_template";
                    } else if (self.modifierType() == constant.MODIFIER_TYPE_DISCOUNT) {
                        template = "dialog_special_discount_template";
                    } else if (self.modifierType() == constant.MODIFIER_TYPE_AMOUNT) {
                        template = "dialog_special_amount_template"
                    }
                    return template;
                });
                
                self.dataFormat = ko.observable("yyyy/MM/dd");
                var dateConverterFactory = oj.Validation.converterFactory("datetime");
                self.dateConverter = dateConverterFactory.createConverter({
                    pattern: self.dataFormat()
                });
                
                self.allowAdd = ko.computed(function () {
                    return true;
                });
                
                self.addSpecialDiscount = function (data, event) {
                    console.log("addSpecialDiscount clicked");
                    var commonDate = commonHelper.getClientCurrentDate("YYYY-MM-DD");
                    var length = 0; 
                    try {
                        length = self.specialDiscountLoaded().length;
                    } catch (ex){
                    }
                    var discountData = {
                        "id": length + 1,
                        "MODIFIER_NUMBER": null,
                        "FROM_STAGING": "N",
                        "MODIFIER_TYPE": constant.MODIFIER_TYPE_DISCOUNT,        
                        "MODIFIER_ITEM_ID": self.currInventoryId(),                            
                        "MODIFIER_VALUE_FROM": null,  
                        "GET_ITEM_NUMBER": null,  
                        "GET_QUANTITY": null,
                        "GET_PRICE": null,
                        "GET_PROMOTION_NATURE": null,
                        "GET_PERCENT": 0,                        
                        "MODIFIER_START_DATE": commonDate,
                        "MODIFIER_END_DATE": commonDate,
                        "MODIFIER_SHIP_TO": "N",
                        "SHOW_LINK_BTN" : "N",
                        "SHOW_REMOVE_BTN" : "Y",
                        "ENABLE_SHIP_TO" : "Y"
                    };                    
                    var promotionDiscount = cartService.createModifier(discountData, true);
                    self.specialDiscountLoaded.push(promotionDiscount);
                };
                
                self.removeSpecialDiscountLine = function(line) {
                    self.specialDiscountLoaded.remove(line);
                };

                self.addSpecialAmount = function (data, event) {
                    console.log("addSpecialAmount clicked");
                    var commonDate = commonHelper.getClientCurrentDate("YYYY-MM-DD");
                    var length = 0; 
                    try {
                        length = self.specialAmountLoaded().length;
                    } catch (ex){
                    }       
                    var amountData = {
                        "id": length + 1,
                        "MODIFIER_NUMBER": null,
                        "FROM_STAGING": "N",
                        "MODIFIER_TYPE": constant.MODIFIER_TYPE_AMOUNT,        
                        "MODIFIER_ITEM_ID": self.currInventoryId(),                            
                        "MODIFIER_VALUE_FROM": null,  
                        "GET_ITEM_NUMBER": null,  
                        "GET_QUANTITY": null,
                        "GET_PRICE": 0,
                        "GET_PROMOTION_NATURE": null,
                        "GET_PERCENT": null,                        
                        "MODIFIER_START_DATE": commonDate,
                        "MODIFIER_END_DATE": commonDate,
                        "MODIFIER_SHIP_TO": "N",
                        "SHOW_LINK_BTN" : "N",
                        "SHOW_REMOVE_BTN" : "Y",
                        "ENABLE_SHIP_TO" : "Y"
                    };       
                    var promotionAmount = cartService.createModifier(amountData, true);
                    self.specialAmountLoaded.push(promotionAmount);                    
                };
                
                self.removeSpecialAmountLine = function (line) {
                    self.specialAmountLoaded.remove(line);
                };

                self.addPromotionItem = function (data, event) {
                    console.log("addPromotionItem clicked");
                    var commonDate = commonHelper.getClientCurrentDate("YYYY-MM-DD");
                    var length = 0; 
                    try {
                        length = self.promotionItemLoaded().length;
                    } catch (ex){
                    }      
                    var itemData = {
                        "id": length + 1,
                        "MODIFIER_NUMBER": null,
                        "FROM_STAGING": "N",
                        "MODIFIER_TYPE": constant.MODIFIER_TYPE_ITEM,        
                        "MODIFIER_ITEM_ID": self.currInventoryId(), 
                        "MODIFIER_VALUE_FROM": "1",
                        "GET_ITEM_ID": self.currInventoryId(), 
                        "GET_ITEM_NUMBER": null,
                        "GET_QUANTITY": "1",
                        "GET_PRICE": "0",
                        "GET_PROMOTION_NATURE": constant.PROMOTION_NATURE_AP,
                        "GET_PERCENT": null,
                        "MODIFIER_START_DATE": commonDate,
                        "MODIFIER_END_DATE": commonDate,                        
                        "MODIFIER_SHIP_TO": "N",
                        "SHOW_LINK_BTN" : "N",
                        "SHOW_REMOVE_BTN" : "Y",
                        "ENABLE_SHIP_TO" : "Y"
                    };
                    var promotionItem = cartService.createModifier(itemData, true);
                    self.promotionItemLoaded.push(promotionItem);                    
                };    
                
                self.removePromotionItemLine = function(line) {
                    self.promotionItemLoaded.remove(line);
                };

                self.handleActivated = function (info) {
                    // Implement if needed
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("modifier.js parentRouter=" + parentRouter.currentState().value);

                    var childRouter = parentRouter.getChildRouter("modifier");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('modifier');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    // Set current inventory id
                                    self.currInventoryId(stateId);
                                    console.log("modifier.js stateId =" + stateId);
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
                self.currInventoryId.subscribe(function (newInventoryId) {
                    console.log("newInventoryId=" + newInventoryId);
                });

                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });
                
                self.itemCodeSuggestions = ko.observableArray();

                function resetAll() {
                    self.specialDiscountLoaded.removeAll();
                    self.specialAmountLoaded.removeAll();
                    self.promotionItemLoaded.removeAll();
                }

                function init() {
                    console.log("init called");
                    
                    ui.showBusy();

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
                    
                    self.isEnquiryMode = ko.computed(function() {
                        return (app.moduleConfig.params.rootContext.enquiryMode);
                    });          
                    console.log("isEnquiryMode=" + self.isEnquiryMode());

                    // reset 
                    resetAll();


                    self.isOnline = ko.computed(function () {
                        return (app.moduleConfig.params.rootContext.isOnline) ? true : false;
                    });
                    
                    console.log("isMaintenance = " + maintenance.isMaintenance());
                    console.log("isOnline = " + self.isOnline());
                    
                    // populate the promotion nature (LOV)
                    ko.utils.arrayForEach(constant.PROMOTION_NATURE_LIST, function(item) {
                         self.availablePromotionNature.push(ko.toJS({value: item.value, label: item.label}));
                    });                  
                    
                    // set sub-header title 
                    var selectedItem = app.moduleConfig.params.rootContext.selectedItem;
                    console.log("selectedItem = " + ko.toJSON(selectedItem));
                    if (selectedItem) {
                        var prodCode = selectedItem.product().prod_code();
                        self.lng_modifier = self.lng_modifier + " : " + prodCode;
                    }
                    
                    priceListService.getPriceListMessage(getItemCodePayload()).done(function(data) {
                        console.log("getPriceListMessage Done");
                        //  console.log("priceList data =" + ko.toJSON(data));
                        var respJSON = data;
                        var result = respJSON.P_PRICE_LIST_TBL_ITEM;
                        result.forEach(function (e) {
                            e.ITEM_CODE_DESCRIPTION = e.PRODUCT + " " + e.PRODUCT_DESCRIPTION;
                        });
                        var suggestionList = {};
                        suggestionList.groupName = "Item Code Suggestions";
                        suggestionList.items = result;
                        self.itemCodeSuggestions.push(suggestionList);                        
                        
                    }).then(function () {
                        // get the selected inventory item
                        var cartItem = app.moduleConfig.params.rootContext.selectedItem;
                        console.log("cartItem = " + ko.toJSON(cartItem));
                        // prepare the modifier information
                        var specialDiscountList = cartItem.product().specialDiscount;
                        var specialAmountList = cartItem.product().specialAmount;
                        var promotionItemList = cartItem.product().promotionItem;
                        var isFetchModifier = ko.utils.unwrapObservable(cartItem.product().isFetchModifier);
                        console.log("isFetchModifier="+isFetchModifier);

                        if (isFetchModifier && !self.isEnquiryMode()) {
                            console.log("fetchModifier invoked");
                            fetchModifier();
                            
                        } else if (((specialDiscountList && specialDiscountList().length > 0) ||
                            (specialAmountList && specialAmountList().length > 0) ||
                            (specialAmountList && promotionItemList().length > 0))) {
                            console.log("cachedModifier invoked");
                            cachedModifier();                            
                            
                        } else {
                            console.log("cachedModifier invoked");
                            cachedModifier();
                        }
                        
                    }).then(function() {
                        console.log("fetch modifier done");
                        
                    });
                }
                
                
                function getModifierPaylod() {
                    // convert to null if undefined
                    var quotationId = app.moduleConfig.params.rootContext.quotationId;
                    quotationId = (typeof quotationId === "undefined" || quotationId == "null" || !quotationId) ? null : quotationId;
                    
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    var orderTypeId = service.getOrderTypeId(user.orgUnitId);
                    
                    var payload = JSON.stringify({
                        "InputGetModifierDetails": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": user.orgUnitId,
                            "P_QUOTATION_ID": quotationId,
                            "P_BILL_TO_SITE_ID": ko.utils.unwrapObservable(customerProfile.billToSiteId),
                            "P_SHIP_TO_SITE_ID": ko.utils.unwrapObservable(customerProfile.shipToSiteId),
                            "P_ORDER_TYPE_ID": orderTypeId,
                            "P_ITEM_ID": self.currInventoryId(),
                            "P_ENQUIRY_MODE": null
                        }
                    });
                    return payload;
                }
                
                function cachedModifier() {
                    var cartItem = app.moduleConfig.params.rootContext.selectedItem;
                    self.specialDiscountLoaded = cartItem.product().specialDiscount;
                    self.specialAmountLoaded = cartItem.product().specialAmount;
                    self.promotionItemLoaded = cartItem.product().promotionItem;          
                    self.ready(true);
                    ui.hideBusy();
                }

                function fetchModifier() {
                    var payload = getModifierPaylod();
                    console.log("get modifier payload =" + ko.toJS(payload));
                
                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            self.ready(true);
                            ui.hideBusy();
                            console.log("cbSuccessFn called");
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        prepareUI(data, xhr.status);
                        self.ready(true);
                        ui.hideBusy();
                    };
                    service.getModifierMessage(payload).then(cbSuccessFn, cbFailFn);
                }
                
                function prepareUI(data, status) {
                    console.log("raw data=" + ko.toJSON(data));
                    data = (Array.isArray(data)) ? data[0] : data;
                    if (data !== null && status == 200) {
                        var respJSON = data[RESPONSE_TABLE]["O_MODIFIER_TBL_ITEM"];
                        var dataLength = respJSON.length;

                        for (var i = 0; i < dataLength; i++) {
                            populateModifier(respJSON[i], data);
                        }
                    }
                    
                }
                
                function populateModifier(data, allData) {
                    console.log("populate modifier data = " + ko.toJSON(data));
                    var length = 0;

                    var modifierType = data.MODIFIER_TYPE;

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
                    
                    //data.MODIFIER_NUMBER = (data.MODIFIER_NUMBER == "-1") ? null : data.MODIFIER_NUMBER;
                    
                    var SHOW_LINK_BTN = (data.FROM_STAGING == "Y" && data.MODIFIER_NUMBER && data.MODIFIER_NUMBER != "-1") ? "Y" : "N";
                    var SHOW_REMOVE_BTN = (data.FROM_STAGING == "Y" && data.MODIFIER_NUMBER && data.MODIFIER_NUMBER != "-1") ? "Y" : "N";
                    SHOW_REMOVE_BTN = (self.isEnquiryMode()) ? "N" : SHOW_REMOVE_BTN;
                    
                    // convert the modifer start & end date
                    var startDate = commonHelper.formatStrDate(data.MODIFIER_START_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                    if (startDate == constant.BLANK_DATE) {
                        data.MODIFIER_START_DATE = "";
                    }
                    var endDate = commonHelper.formatStrDate(data.MODIFIER_END_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                    if (endDate == constant.BLANK_DATE) {
                        data.MODIFIER_END_DATE = "";
                    }       
                    
                    var enableShipTo = (data.FROM_STAGING == "N") ? "N" : "Y";
                    if (self.isEnquiryMode()) enableShipTo = "N";
                    
                    var modifierData = {
                        "id": length + 1,
                        "MODIFIER_NUMBER": (data.MODIFIER_NUMBER == "-1") ? null : data.MODIFIER_NUMBER,
                        "FROM_STAGING": data.FROM_STAGING,                        
                        "MODIFIER_TYPE": data.MODIFIER_TYPE,
                        "MODIFIER_ITEM_ID": data.MODIFIER_ITEM_ID,
                        "MODIFIER_VALUE_FROM": (data.MODIFIER_VALUE_FROM == "-1") ? null : data.MODIFIER_VALUE_FROM,    
                        "GET_ITEM_ID": (data.GET_ITEM_ID == "-1") ? null : data.GET_ITEM_ID,    
                        "GET_ITEM_NUMBER": (data.GET_ITEM_NUMBER == "-1") ? null : data.GET_ITEM_NUMBER,   
                        "GET_QUANTITY": (data.GET_QUANTITY == "-1") ? null : data.GET_QUANTITY,
                        "GET_PRICE": (data.GET_PRICE == "-1") ? null : data.GET_PRICE,
                        "GET_PROMOTION_NATURE": (data.GET_PROMOTION_NATURE == "-1") ? null : data.GET_PROMOTION_NATURE,                        
                        "GET_PERCENT": (data.GET_PERCENT == "-1") ? null : data.GET_PERCENT,
                        "MODIFIER_START_DATE": data.MODIFIER_START_DATE,
                        "MODIFIER_END_DATE": data.MODIFIER_END_DATE,                        
                        "MODIFIER_SHIP_TO": (data.MODIFIER_SHIP_TO == "-1") ? null : data.MODIFIER_SHIP_TO,
                        "SHOW_LINK_BTN": SHOW_LINK_BTN,
                        "SHOW_REMOVE_BTN": SHOW_REMOVE_BTN,
                        "ENABLE_SHIP_TO": enableShipTo
                    };
                    
                    var isModified = (data.FROM_STAGING != "Y" && data.MODIFIER_NUMBER && data.MODIFIER_NUMBER != "-1") ? false : true;
                    console.log("isModified=" + isModified);
                    var isFilterRecord = false;
                    
                    var modifierItem = cartService.createModifier(modifierData, isModified);
                    
                    // filter the PROD type if it is a COPY type record 
                    // this PROD type record shall be shown on the Detail Page (display only)
                    if (!isModified) {
                        $.each(allData.O_MODIFIER_TBL.O_MODIFIER_TBL_ITEM, function(i, v) {
                           if (v.MODIFIER_NUMBER == data.MODIFIER_NUMBER && data.MODIIFER_NUMBER != "-1" && v.FROM_STAGING == "Y") {
                               isFilterRecord = true;
                           } 
                        });
                    }
                    console.log("isFilterRecord=" + isFilterRecord);
                    
                    if (modifierType == constant.MODIFIER_TYPE_ITEM) {
                        if (!isFilterRecord) {
                            self.promotionItemLoaded.push(modifierItem);
                        } else {
                            self.promotionItemFiltered.push(modifierItem);
                        }
                    } else if (modifierType == constant.MODIFIER_TYPE_DISCOUNT) {
                        if (!isFilterRecord) {
                            self.specialDiscountLoaded.push(modifierItem);
                        } else {
                            self.specialDiscountFiltered.push(modifierItem);
                        }
                    } else if (modifierType == constant.MODIFIER_TYPE_AMOUNT) {
                        if (!isFilterRecord) {
                            self.specialAmountLoaded.push(modifierItem);
                        } else {
                            self.specialAmountFiltered.push(modifierItem);
                        }
                    }   
                }
                
                function isOrderDeskAdmin() {
                    var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
                    if (salesRole === constant.SR_ADMIN)
                        return true;
                    return false;
                }

                self.dispose = function (info) {
                    self.router.dispose();
                };

                self.goBack = function (data, event) {
                    console.log("goBack clicked");
                    var quotationId = app.moduleConfig.params.rootContext.quotationId;
                    if (self.isEnquiryMode()) {
                        app.redirect("quotationDetail", quotationId);
                    } else {
                        app.moduleConfig.params.rootContext.fromModifier = "Y";
                        app.redirect("checkOutQuotation", quotationId);
                    }
                };
                
                self.openDetail = function (data, event, ui) {
                    if (data) {
                        var modifierType = ko.utils.unwrapObservable(data.MODIFIER_TYPE);
                        var modifierNumber = ko.utils.unwrapObservable(data.MODIFIER_NUMBER);
                        var foundItem = null;
                        console.log("copy data = " + ko.toJSON(data));
                        
                        if (modifierType == constant.MODIFIER_TYPE_ITEM) {
                            foundItem = ko.utils.arrayFirst(self.promotionItemFiltered(), function(item) {
                                return (modifierNumber == ko.utils.unwrapObservable(item.MODIFIER_NUMBER));
                            });
                            self.modifierType(new String(constant.MODIFIER_TYPE_ITEM));

                        } else if (modifierType == constant.MODIFIER_TYPE_DISCOUNT) {
                            foundItem = ko.utils.arrayFirst(self.specialDiscountFiltered(), function(item) {
                                return (modifierNumber == ko.utils.unwrapObservable(item.MODIFIER_NUMBER));
                            });
                            self.modifierType(new String(constant.MODIFIER_TYPE_DISCOUNT));
                          
                        } else if (modifierType == constant.MODIFIER_TYPE_AMOUNT) {
                            foundItem = ko.utils.arrayFirst(self.specialAmountFiltered(), function(item) {
                                return (modifierNumber == ko.utils.unwrapObservable(item.MODIFIER_NUMBER));
                            });
                            self.modifierType(new String(constant.MODIFIER_TYPE_AMOUNT));
                        }
                        // TESTING +
                        /*
                        if (!foundItem) {
                            foundItem = data;
                        }
                        */
                        // TESTING -
                        // app.moduleConfig.params.rootContext.selectedModifier = foundItem;
                        // app.redirect("modifierHistory", ko.utils.unwrapObservable(data.MODIFIER_NUMBER));
                        console.log("foundItem = " + ko.toJSON(foundItem)); 
                        console.log("modifierType = " + ko.utils.unwrapObservable(self.modifierType));
                        
                        self.dialogItem.removeAll();
                        self.dialogItem.push(foundItem);
                        
                        $("#scrollingDialog").ojDialog("open");
                    }
                };
                
                self.dirty = function (isInitiallyDirty) {
                    var result = function () {},
                        _isInitiallyDirty = ko.observable(isInitiallyDirty);

                    result.isDirty = ko.computed(function () {
                        return isInitiallyDirty;
                    });

                    result.reset = function () {
                        _isInitiallyDirty(false);
                    };

                    return result;
                };
                
                self.confirm = function(data, event) {
                    console.log("confirm clicked");
                    
                    ui.showBusy();
                    
                    // update the quotation cart
                    var cartItem = app.moduleConfig.params.rootContext.selectedItem;
                    cartItem.product().specialDiscount = self.specialDiscountLoaded;
                    cartItem.product().specialAmount = self.specialAmountLoaded;
                    cartItem.product().promotionItem = self.promotionItemLoaded;
                    cartItem.product().isFetchModifier(false);
                    console.log("cartItem = " + ko.toJSON(cartItem));
                    
                    // any update on promotion item
                    ko.utils.arrayForEach(cartItem.product().promotionItem(), function (item) {
                        console.log("isDirty()=" + item.dirtyFlag.isDirty());
                        if (!item.dirtyFlag.isDirty()) {
                            if (item.ORIGINAL_MODIFIER_VALUE_FROM != ko.utils.unwrapObservable(item.MODIFIER_VALUE_FROM) ||
                                    item.ORIGINAL_GET_ITEM_ID != ko.utils.unwrapObservable(item.GET_ITEM_ID) ||
                                    item.ORIGINAL_GET_QUANTITY != ko.utils.unwrapObservable(item.GET_QUANTITY) ||
                                    item.ORIGINAL_GET_PRICE != ko.utils.unwrapObservable(item.GET_PRICE) ||
                                    item.ORIGINAL_GET_PROMOTION_NATURE != ko.utils.unwrapObservable(item.GET_PROMOTION_NATURE) ||
                                    item.ORIGINAL_GET_PERCENT != ko.utils.unwrapObservable(item.GET_PERCENT) ||
                                    item.ORIGINAL_MODIFIER_START_DATE != ko.utils.unwrapObservable(item.MODIFIER_START_DATE) ||
                                    item.ORIGINAL_MODIFIER_END_DATE != ko.utils.unwrapObservable(item.MODIFIER_END_DATE) ||
                                    item.ORIGINAL_MODIFIER_SHIP_TO != ko.utils.unwrapObservable(item.MODIFIER_SHIP_TO)
                                    ) {
                                console.log("promotion item=" + ko.toJSON(item));
                                console.log("Found Difference: to update the dirtyFlag = true");
                                item.dirtyFlag = new self.dirty(true);
                            }
                        }
                    });  
                    
                    // any update on special amount
                    ko.utils.arrayForEach(cartItem.product().specialAmount(), function (item) {
                        console.log("isDirty()=" + item.dirtyFlag.isDirty());
                        if (!item.dirtyFlag.isDirty()) {
                            if (item.ORIGINAL_MODIFIER_VALUE_FROM != ko.utils.unwrapObservable(item.MODIFIER_VALUE_FROM) ||
                                    item.ORIGINAL_GET_ITEM_ID != ko.utils.unwrapObservable(item.GET_ITEM_ID) ||
                                    item.ORIGINAL_GET_QUANTITY != ko.utils.unwrapObservable(item.GET_QUANTITY) ||
                                    item.ORIGINAL_GET_PRICE != ko.utils.unwrapObservable(item.GET_PRICE) ||
                                    item.ORIGINAL_GET_PROMOTION_NATURE != ko.utils.unwrapObservable(item.GET_PROMOTION_NATURE) ||
                                    item.ORIGINAL_GET_PERCENT != ko.utils.unwrapObservable(item.GET_PERCENT) ||
                                    item.ORIGINAL_MODIFIER_START_DATE != ko.utils.unwrapObservable(item.MODIFIER_START_DATE) ||
                                    item.ORIGINAL_MODIFIER_END_DATE != ko.utils.unwrapObservable(item.MODIFIER_END_DATE) ||
                                    item.ORIGINAL_MODIFIER_SHIP_TO != ko.utils.unwrapObservable(item.MODIFIER_SHIP_TO)
                                    ) {
                                console.log("special amount item=" + ko.toJSON(item));
                                console.log("Found Difference: to update the dirtyFlag = true");
                                item.dirtyFlag = new self.dirty(true);
                            }
                        }
                    }); 
                    
                    // any update on special discount
                    ko.utils.arrayForEach(cartItem.product().specialDiscount(), function (item) {
                        console.log("isDirty()=" + item.dirtyFlag.isDirty());
                        if (!item.dirtyFlag.isDirty()) {
                            if (item.ORIGINAL_MODIFIER_VALUE_FROM != ko.utils.unwrapObservable(item.MODIFIER_VALUE_FROM) ||
                                    item.ORIGINAL_GET_ITEM_ID != ko.utils.unwrapObservable(item.GET_ITEM_ID) ||
                                    item.ORIGINAL_GET_QUANTITY != ko.utils.unwrapObservable(item.GET_QUANTITY) ||
                                    item.ORIGINAL_GET_PRICE != ko.utils.unwrapObservable(item.GET_PRICE) ||
                                    item.ORIGINAL_GET_PROMOTION_NATURE != ko.utils.unwrapObservable(item.GET_PROMOTION_NATURE) ||
                                    item.ORIGINAL_GET_PERCENT != ko.utils.unwrapObservable(item.GET_PERCENT) ||
                                    item.ORIGINAL_MODIFIER_START_DATE != ko.utils.unwrapObservable(item.MODIFIER_START_DATE) ||
                                    item.ORIGINAL_MODIFIER_END_DATE != ko.utils.unwrapObservable(item.MODIFIER_END_DATE) ||
                                    item.ORIGINAL_MODIFIER_SHIP_TO != ko.utils.unwrapObservable(item.MODIFIER_SHIP_TO)
                                    ) {
                                console.log("special discount item=" + ko.toJSON(item));
                                console.log("Found Difference: to update the dirtyFlag = true");
                                item.dirtyFlag = new self.dirty(true);
                            }
                        }
                    });                     
                    
                    
                    var error = validateInput();
                    // abort the confirm action if error found
                    if (error) {
                        return;
                    }

                    // update the cart item to the shopping cart class
                    self.cart = cartService.getCart(self.cart);
                    var index = self.cart.indexOf(app.moduleConfig.params.rootContext.selectedItem);
                    self.cart.splice(index, 1, cartItem);
                    
                    // store it to the originalQuotationCart
                    app.moduleConfig.params.rootContext.originalQuotationCart = ko.observableArray();
                    ko.utils.arrayMap(self.cart(), function(item) {
                        app.moduleConfig.params.rootContext.originalQuotationCart.push(item);
                    });
                    
                    app.moduleConfig.params.rootContext.fromModifier = "Y"; 
                    
                    ui.hideBusy();
                    
                    // redirect back to the checkout page
                    // var custId = app.moduleConfig.params.rootContext.custId;
                    var quotationId = app.moduleConfig.params.rootContext.quotationId;
                    app.redirect("checkOutQuotation", quotationId);
                };
                
                self.cancel = function(data, event) {
                    // app.moduleConfig.params.rootContext.fromPage = "modifier";
                    self.goBack();
                };

                self.onSearchTextChange = function (event, data) {
                    if (data.option === 'rawValue') {
                        console.log("data.value = " + data.value);
                        // console.log("data =" + ko.toJSON(data));
                    }
                };                
    
                self.onClearSearchText = function (item, data, event) {
                    self.clearSearch(item, data, event);
                };

                self.clearSearch = function (item, data, event) {
                    var itemIndex = self.promotionItemLoaded.indexOf(item);
                    if (itemIndex >= 0) {
                        item.GET_ITEM_ID = ko.observable(null);
                        self.promotionItemLoaded.splice(itemIndex, 1, item);
                        var id = itemIndex + 1;
                        $('#oj-inputsearch-input-itemCode-' + id).val('');
                    } 
                };        

                function isInt(x) {
                    var regInteger = /^\d+$/;
                    return regInteger.test(x);
                }
                
                function validateInput() {
                    
                    ////////////////////////////////
                    // check the promotion item
                    ////////////////////////////////
                    var foundItem = ko.utils.arrayFirst(self.promotionItemLoaded(), function(item) {
                        var getInventoryId = item.GET_ITEM_ID();
                        if (Array.isArray(getInventoryId)) getInventoryId = getInventoryId[0];
                        
                        // return error if blank 
                        if (!getInventoryId) return item;
                        
                        // return error if non-numeric 
                        if (!isInt(getInventoryId)) return item;
                        
                        var priceListFound = ko.utils.arrayFirst(self.itemCodeSuggestions()[0].items, function(item) {
                            if (item.INVENTORY_ITEM_ID == getInventoryId) {
                                return item;
                            }
                        });
                        if (!priceListFound) return item;
                        
                        return null;
                    });
                    if (foundItem) {
                        console.log("found error item = " + ko.toJSON(foundItem));
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00042);
                        return true;
                    }
                    
                    ////////////////////////////////
                    // check start/end date on promotion item
                    ////////////////////////////////                    
                    var foundItem = ko.utils.arrayFirst(self.promotionItemLoaded(), function(item) {
                        var startDate = ko.utils.unwrapObservable(item.MODIFIER_START_DATE);
                        var endDate = ko.utils.unwrapObservable(item.MODIFIER_END_DATE);
                        if (!startDate || !endDate || endDate < startDate) {
                            return item;
                        }
                    });
                    if (foundItem) {
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00044);
                        return true;
                    }
                    
                    ////////////////////////////////
                    // check start/end date on speical discount
                    ////////////////////////////////
                    var foundItem = ko.utils.arrayFirst(self.specialDiscountLoaded(), function(item) {
                        var startDate = ko.utils.unwrapObservable(item.MODIFIER_START_DATE);
                        var endDate = ko.utils.unwrapObservable(item.MODIFIER_END_DATE);
                        if (!startDate || !endDate || endDate < startDate) {
                            return item;
                        }
                    });
                    if (foundItem) {
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00044);
                        return true;
                    }
                    
                    ////////////////////////////////
                    // check start/end date on speical amount
                    ////////////////////////////////
                    var foundItem = ko.utils.arrayFirst(self.specialAmountLoaded(), function(item) {
                        var startDate = ko.utils.unwrapObservable(item.MODIFIER_START_DATE);
                        var endDate = ko.utils.unwrapObservable(item.MODIFIER_END_DATE);
                        if (!startDate || !endDate || endDate < startDate) {
                            return item;
                        }
                    });
                    if (foundItem) {
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00045);
                        return true;
                    }
                    
                    return false;
                }
                
                function getItemCodePayload() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;

                    var priceListId;
                    var priceListKeys = [];
                    var P_PRICE_LIST_ID_TBL_ITEM = [];

                    var priceListId;
                    if (user.salesRole === constant.SR_SALE_VAN) {
                        priceListId = constant.PRICE_ID_BEER;
                    } else if (user.salesRole === constant.SR_MOBILE_SALE || user.salesRole === constant.SR_ADMIN) {
                        if (user.orgUnitId === constant.ORG_UNIT_ID_WINE) {
                            priceListId = constant.PRICE_ID_WINE;
                        } else if (user.orgUnitId === constant.ORG_UNIT_ID_BEER) {
                            priceListId = constant.PRICE_ID_BEER;
                        }
                    }

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
                    return payload;
                };    
                
                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_modifier = getTranslation("ssa.modifier.modifier");
                    self.lng_history = getTranslation("ssa.modifier.history");
                    self.lng_addBtn = getTranslation("ssa.modifier.addBtn");
                    self.lng_shipTo = getTranslation("ssa.modifier.shipTo");
                    self.lng_confirmBtn = getTranslation("ssa.modifier.confirmBtn");
                    self.lng_cancelBtn = getTranslation("ssa.modifier.cancelBtn");
                    self.lng_discountUnit = getTranslation("ssa.modifier.discountUnit");
                    self.lng_amountUnit = getTranslation("ssa.modifier.amountUnit");
                    self.lng_specialDiscount = getTranslation("ssa.modifier.specialDiscount");
                    self.lng_specialAmount = getTranslation("ssa.modifier.specialAmount");
                    self.lng_promotionItem = getTranslation("ssa.modifier.promotionItem");
                    self.lng_buyQty = getTranslation("ssa.modifier.buyQty");
                    self.lng_start = getTranslation("ssa.modifier.start");
                    self.lng_end = getTranslation("ssa.modifier.end");
                    self.lng_getItem = getTranslation("ssa.modifier.getItem");
                    self.lng_getQty = getTranslation("ssa.modifier.getQty");
                    self.lng_unitPrice = getTranslation("ssa.modifier.unitPrice");
                    self.lng_promotionNature = getTranslation("ssa.modifier.promotionNature");
                    self.lng_maintenance = getTranslation("ssa.msg.info.maintenance");
                    self.lng_placeholder = getTranslation("ssa.stockSearch.inputItemCode");
                    self.lng_from = getTranslation("ssa.modifier.from");
                    self.lng_to = getTranslation("ssa.modifier.to");
                    self.lng_error_00042 = getTranslation("ssa.msg.error.ERROR_00042");
                    self.lng_error_00043 = getTranslation("ssa.msg.error.ERROR_00043");
                    self.lng_error_00044 = getTranslation("ssa.msg.error.ERROR_00044");
                    self.lng_error_00045 = getTranslation("ssa.msg.error.ERROR_00045");
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
            
            return ModifierViewModel;
        }
);
