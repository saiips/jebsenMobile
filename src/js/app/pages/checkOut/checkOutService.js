/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant', 'util/commonhelper'
], function (ko, $, module, amplify, ui, devMode, app, constant, commonHelper) {

    function CheckOutService() {

        function getOrderTypeId(orgUnitId) {
            if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                return constant.ORDER_TYPE_ID_WINE;
            } else if (orgUnitId == constant.ORG_UNIT_ID_BEER) {
                return constant.ORDER_TYPE_ID_BEER;
            } else {
                return 0;
            }
        }

        function getSubInventoryPayload(ioId) {
            var payload;
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            var user = app.moduleConfig.params.rootContext.userProfile;
            if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                payload = JSON.stringify({
                    "InputParameters": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },                               
                        "P_ORG_ID": constant.IO_ID_2899
                    }
                });
            } else {
                payload = JSON.stringify({
                    "InputParameters": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },                               
                        "P_ORG_ID": ioId
                    }
                });
            }

            return payload;
        }
        
        function getCreateQuotationPayload(order, cart, startDate, endDate) {
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
            
            var headerPayload = getHeaderPayload(order);
            var I_LINE_TBL_ITEM = getQutationDetail(cart, startDate, endDate);
            var I_MODIFIER_TBL_ITEM = getModifierDetail(order, cart);
            
            var payload = JSON.stringify({
                InputCreateQuotation: {
                    HeaderInfo: {
                        UserID: userName,
                        UserRole: salesRole,
                        CallerID: ""
                    },
                    I_HEADER_REC: headerPayload,
                    I_LINE_TBL: {I_LINE_TBL_ITEM: I_LINE_TBL_ITEM},
                    I_MODIFIER_TBL: {I_MODIFIER_TBL_ITEM: I_MODIFIER_TBL_ITEM}
                }
            });
            return payload;            
        }
        
        this.getCreateQuotationPayload = function (order, cart, startDate, endDate) {
            return getCreateQuotationPayload(order, cart, startDate, endDate);
        };

        function getShipmentMethodPayload() {
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
            var payload = JSON.stringify({
                "InputGetShippingMethod": {
                    "HeaderInfo": {
                        "UserID": userName,
                        "UserRole": salesRole,
                        "CallerID": ""
                    }
                }
            });
            return payload;
        }

        function getVanOrderPayload(order, cart, paymentType) {
            console.log("getVanOrderPayload paymentType = " + paymentType);
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;

            var headerPayload = getHeaderPayload(order, paymentType);
            var I_LINE_TBL_ITEM = getOrderDetail(cart);

            var payload = JSON.stringify({
                InputCreateVanOrder: {
                    HeaderInfo: {
                        UserID: userName,
                        UserRole: salesRole,
                        CallerID: ""
                    },
                    I_HEADER_REC: headerPayload,
                    I_LINE_TBL: {I_LINE_TBL_ITEM: I_LINE_TBL_ITEM}
                }
            });
            return payload;
        }
        
        this.getVanOrderPayload = function (order, cart, paymentType) {
            return getVanOrderPayload(order, cart, paymentType);
        };

        function getHeaderPayload(order) {
            return getHeaderPayload(order, null);
        }

        function getHeaderPayload(order, paymentType) {
            var headerPayload = "";
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;

            // get order type id            
            var orderTypeId = getOrderTypeId(orgUnitId);
            
            if (salesRole == constant.SR_SALE_VAN) {
                orderTypeId = constant.ORDER_TYPE_ID_VANS;
            }

            if (order) {
                // prepare the order master information
                headerPayload = ko.toJS({
                    "ORDER_TYPE_ID": orderTypeId,
                    "SOLD_TO_ORG_ID": ko.utils.unwrapObservable(order.sold_to_org_id),
                    "SHIP_TO_ORG_ID": ko.utils.unwrapObservable(order.ship_to_org_id),
                    "INVOICE_TO_ORG_ID": ko.utils.unwrapObservable(order.invoice_to_org_id),
                    "ORDER_SOURCE_ID": "0",
                    "PRICE_LIST_ID": ko.utils.unwrapObservable(order.price_list_id),
                    "PRICING_DATE": ko.utils.unwrapObservable(order.pricing_date),
                    "FLOW_STATUS_CODE": "ENTERED",
                    "CUST_PO_NUMBER": ko.utils.unwrapObservable(order.purchase_order),
                    "SOLD_FROM_ORG_ID": ko.utils.unwrapObservable(order.sold_from_org_id),
                    "SHIP_FROM_ORG_ID": ko.utils.unwrapObservable(order.ship_from_org_id),
                    "SALESREP_ID": ko.utils.unwrapObservable(order.sales_rep_id),
                    "TRANSACTIONAL_CURR_CODE": ko.utils.unwrapObservable(order.transactional_curr_code),
                    "PAYMENT_TERM_ID": ko.utils.unwrapObservable(order.payment_term_id),
                    "REAL_CUSTOMER": ko.utils.unwrapObservable(order.real_customer),
                    "REMARKS": ko.utils.unwrapObservable(order.remarks),
                    "FREIGHT_CHARGE": ko.utils.unwrapObservable(order.delivery_cost),
                    "USER_ID": userName,
                    "USER_ROLE": salesRole,
                    "PAYMENT_TYPE": paymentType,
                    "TOLAL_AMOUNT": (ko.utils.unwrapObservable(order.order_tot_amt)) ? ko.utils.unwrapObservable(order.order_tot_amt) : 0,
                    "CUSTOMER_NAME": ko.utils.unwrapObservable(order.cust_name),
                    "OUTLET_NAME": ko.utils.unwrapObservable(order.outlet_name),
                    "REAL_CUSTOMER": ko.utils.unwrapObservable(order.real_customer),  
                    "SHIP_TO_ADDRESS": ko.utils.unwrapObservable(order.shipping_address),
                    "BILL_TO_ADDRESS": ko.utils.unwrapObservable(order.billing_address),
                    "ATTENTION": ko.utils.unwrapObservable(order.attention),
                    "SALES_TERMS": ko.utils.unwrapObservable(order.salesTerm)
                });
            }

            return headerPayload;
        }
        
        function getOrderDetail(cart) {
            return getOrderDetail(cart, null, null, null);
        }
        
        function getModifierItemPayload(quotationId, item) {
            // session variables
            var user = app.moduleConfig.params.rootContext.userProfile;
            var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
            var orderTypeId = getOrderTypeId(user.orgUnitId); 
            
            // convert the date format to ISO standard format
            var startDate = ko.utils.unwrapObservable(item.MODIFIER_START_DATE);
            var endDate = ko.utils.unwrapObservable(item.MODIFIER_END_DATE);
            try {
                startDate = commonHelper.formatStrDateToISO(startDate, "YYYY-MM-DD");
                endDate = commonHelper.formatStrDateToISO(endDate, "YYYY-MM-DD");
            } catch (ex) {
            }

            var modifierNumber = ko.utils.unwrapObservable(item.MODIFIER_NUMBER);
            var modifierType = ko.utils.unwrapObservable(item.MODIFIER_TYPE);
            var modifierItemId = ko.utils.unwrapObservable(item.MODIFIER_ITEM_ID);
            var modifierValueFrom = ko.utils.unwrapObservable(item.MODIFIER_VALUE_FROM);
            var getItemId = ko.utils.unwrapObservable(item.GET_ITEM_ID);
            console.log("getItemId=" + getItemId);
            if (typeof getItemId === "undefined" || getItemId == "undefined" || getItemId == "null" || getItemId == "-1") getItemId = null;
            var getItemUom = ko.utils.unwrapObservable(item.GET_ITEM_UOM);
            var getPercent = ko.utils.unwrapObservable(item.GET_PERCENT);
            var getPrice = ko.utils.unwrapObservable(item.GET_PRICE);
            var getQuantity = ko.utils.unwrapObservable(item.GET_QUANTITY);
            var getPromotionNature = ko.utils.unwrapObservable(item.GET_PROMOTION_NATURE);
            if (Array.isArray(getPromotionNature)) getPromotionNature = getPromotionNature[0];
            var modifierShipTo = ko.utils.unwrapObservable(item.MODIFIER_SHIP_TO);

            var itemPayload = {
                "ORG_ID": user.orgUnitId,
                "BILL_TO_SITE_ID": ko.utils.unwrapObservable(customerProfile.billToSiteId),
                "SHIP_TO_SITE_ID": (modifierShipTo) ? ko.utils.unwrapObservable(customerProfile.shipToSiteId) : null,
                "ORDER_TYPE_ID": orderTypeId,
                "QUOTATION_ID": (quotationId) ? quotationId : null,
                "MODIFIER_NUMBER": (modifierNumber) ? modifierNumber : null,
                "MODIFIER_TYPE": modifierType,
                "MODIFIER_START_DATE": (startDate) ? startDate : null,
                "MODIFIER_END_DATE": (endDate) ? endDate : null,
                "MODIFIER_ITEM_ID": modifierItemId,
                "MODIFIER_VALUE_FROM": modifierValueFrom,
                "GET_ITEM_ID": (getItemId) ? getItemId : null,
                "GET_ITEM_UOM": (getItemUom) ? getItemUom : null,
                "GET_PERCENT": getPercent,
                "GET_PRICE": getPrice,
                "GET_QUANTITY": getQuantity,
                "GET_PROMOTION_NATURE": getPromotionNature
            };   
            
            return itemPayload;
        }
        
        function getModifierDetail(order, cart) {
            var I_MODIFIER_TBL_ITEM = [];
            var cartArray = ko.utils.unwrapObservable(cart);
            var cartArrayLength = cartArray.length;           
            var quotationId = ko.utils.unwrapObservable(order.oe_header_id);
            
            for (index = 0; index < cartArrayLength; index++) {
                var promotionItem = cartArray[index].product().promotionItem;
                var specialDiscount = cartArray[index].product().specialDiscount;
                var specialAmount = cartArray[index].product().specialAmount;

                // fetch the promotion item
                ko.utils.arrayForEach(promotionItem(), function (item) {
                    if (item.dirtyFlag.isDirty()) {
                        var itemPayload = getModifierItemPayload(quotationId, item);
                        I_MODIFIER_TBL_ITEM.push(itemPayload);                        
                    }
                });
                
                // fetch the special discount
                ko.utils.arrayForEach(specialDiscount(), function (item) {
                    if (item.dirtyFlag.isDirty()) {
                        var itemPayload = getModifierItemPayload(quotationId, item);
                        I_MODIFIER_TBL_ITEM.push(itemPayload);                        
                    }
                });

                // fetch the special amount
                ko.utils.arrayForEach(specialAmount(), function (item) {
                    if (item.dirtyFlag.isDirty()) {
                        var itemPayload = getModifierItemPayload(quotationId, item);
                        I_MODIFIER_TBL_ITEM.push(itemPayload);                        
                    }
                });
            }
            
            return I_MODIFIER_TBL_ITEM;
        }
        
        function getQutationDetail(cart, startDate, endDate) {
            var I_LINE_TBL_ITEM = [];
            var cartArray = ko.utils.unwrapObservable(cart);
            var cartArrayLength = cartArray.length;
            
            if (commonHelper.isValid(startDate)) {
                startDate = commonHelper.formatStrDateToISO(startDate, "YYYY-MM-DD");
            }
            if (commonHelper.isValid(endDate)) {
                endDate = commonHelper.formatStrDateToISO(endDate, "YYYY-MM-DD");
            }

            // prepare the order line items
            for (index = 0; index < cartArrayLength; index++) {
                var original = ko.utils.unwrapObservable(cartArray[index].original);
                var shipmentMethod = ko.utils.unwrapObservable(cartArray[index].shipmentMethod);
                var subInventory = ko.utils.unwrapObservable(cartArray[index].subInventory);
                var shipDate = ko.utils.unwrapObservable(cartArray[index].shipment);
                var lot = ko.utils.unwrapObservable(cartArray[index].product().lot);
                var remark = ko.utils.unwrapObservable(cartArray[index].product().remark);
                
                if (Array.isArray(shipmentMethod)) {
                    shipmentMethod = shipmentMethod[0];
                }
                if (Array.isArray(lot)) {
                    lot = lot[0];
                }
                if (commonHelper.isValid(shipDate)) {
                    shipDate = commonHelper.formatStrDateToISO(shipDate);
                }
                if (Array.isArray(subInventory)) {
                    subInventory = subInventory[0];
                }
                
                if (original == "Y") {
                    var itemPayload = {
                        "LINE_NUMBER": index + 1,
                        "INVENTORY_ITEM_ID": ko.utils.unwrapObservable(cartArray[index].product().id),
                        "ORDERED_QUANTITY": ko.utils.unwrapObservable(cartArray[index].quantity),
                        "UNIT_SELLING_PRICE": ko.utils.unwrapObservable(cartArray[index].product().price),
                        "ORIGINAL_LINE": ko.utils.unwrapObservable(cartArray[index].original),
                        "LOT_NUMBER": lot,
                        "SUBINVENTORY": (subInventory) ? subInventory: null,
                        "SHIPPING_METHOD":  (shipmentMethod) ? shipmentMethod : null,
                        "SCHEDULE_SHIP_DATE":  (shipDate) ? shipDate: null,
                        "START_DATE": (startDate) ? startDate: null,
                        "END_DATE": (endDate)? endDate: null,
                        "REMARK": (remark)? remark: null
                    };
                    I_LINE_TBL_ITEM.push(itemPayload);
                }
            }
            return I_LINE_TBL_ITEM;            
        }
        

        function getOrderDetail(cart, subInventory, shipDate, shipMethod) {
            var I_LINE_TBL_ITEM = [];
            var cartArray = ko.utils.unwrapObservable(cart);
            var cartArrayLength = cartArray.length;
            var overrideShipmentDate = ko.utils.unwrapObservable(shipDate);
            var overrideSubInventory = ko.utils.unwrapObservable(subInventory);
            var overrideShipmentMethod = ko.utils.unwrapObservable(shipMethod);
            if (overrideSubInventory != null && Array.isArray(overrideSubInventory)) {
                overrideSubInventory = overrideSubInventory[0];
            }      
            if (overrideShipmentMethod != null && Array.isArray(overrideShipmentMethod)) {
                overrideShipmentMethod = overrideShipmentMethod[0];
            }                  
            if (overrideShipmentDate != null) {
                overrideShipmentDate = commonHelper.formatStrDateToISO(overrideShipmentDate, "YYYY-MM-DD");
            }
            // get back the Draught Beer Indicator
            var subInventoryMap = app.moduleConfig.params.rootContext.subInventoryMap;

            // prepare the order line items
            for (index = 0; index < cartArrayLength; index++) {
                var original = ko.utils.unwrapObservable(cartArray[index].original);
                var shipmentMethod = ko.utils.unwrapObservable(cartArray[index].shipmentMethod);
                var subInventory = ko.utils.unwrapObservable(cartArray[index].subInventory);
                var shipDate = ko.utils.unwrapObservable(cartArray[index].shipment);
                var lot = ko.utils.unwrapObservable(cartArray[index].product().lot);
                var draftBeerFlag = ko.utils.unwrapObservable(cartArray[index].product().draft_beer_flag);
                
                if (Array.isArray(shipmentMethod)) {
                    shipmentMethod = shipmentMethod[0];
                }
                if (Array.isArray(lot)) {
                    lot = lot[0];
                }
                if (commonHelper.isValid(shipDate)) {
                    shipDate = commonHelper.formatStrDateToISO(shipDate);
                }
                if (Array.isArray(subInventory)) {
                    subInventory = subInventory[0];
                }
                
                var isOverrideSchedule= ko.computed( function() {
                    var dBeerFlag = subInventoryMap[overrideSubInventory];
                    if ("Y" == dBeerFlag) return true;
                    if ("N" == draftBeerFlag) return true;
                    return false;
                });
                console.log("is Override Delivery Schedule = " + isOverrideSchedule());
                
                if (isOverrideSchedule()) {
                    shipmentMethod = (overrideShipmentMethod != null )? overrideShipmentMethod : shipmentMethod;
                    subInventory = (overrideSubInventory != null) ? overrideSubInventory : subInventory;
                }
                
                shipDate = (overrideShipmentDate != null) ? overrideShipmentDate: shipDate;

                if (original == "Y") {
                    var itemPayload = {
                        "LINE_NUMBER": index + 1,
                        "INVENTORY_ITEM_ID": ko.utils.unwrapObservable(cartArray[index].product().id),
                        "ORDERED_QUANTITY": ko.utils.unwrapObservable(cartArray[index].quantity),
                        "UNIT_SELLING_PRICE": ko.utils.unwrapObservable(cartArray[index].product().price),
                        "ORIGINAL_LINE": ko.utils.unwrapObservable(cartArray[index].original),
                        "LOT_NUMBER": lot,
                        "SUBINVENTORY": (subInventory) ? subInventory: null,
                        "SHIPPING_METHOD":  (shipmentMethod) ? shipmentMethod : null,
                        "SCHEDULE_SHIP_DATE": (shipDate) ? shipDate : null,
                        "PRODUCT": ko.utils.unwrapObservable(cartArray[index].product().prod_code),
                        "PRODUCT_DESCRIPTION": ko.utils.unwrapObservable(cartArray[index].product().prod_desc)
                    };
                    I_LINE_TBL_ITEM.push(itemPayload);
                }
            }
            return I_LINE_TBL_ITEM;
        }

        function getCreateWineOrderPayload(order, cart, shipDate, subInventory, shipMethod) {
            var user = app.moduleConfig.params.rootContext.userProfile;

            var headerPayload = getHeaderPayload(order);

            var I_LINE_TBL_ITEM = getOrderDetail(cart, subInventory, shipDate, shipMethod);

            // prepare the payload for validation of sales order
            var payload = JSON.stringify({
                InputCreateWineOrder: {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },                           
                    "I_HEADER_REC": headerPayload,
                    "I_LINE_TBL": {I_LINE_TBL_ITEM: I_LINE_TBL_ITEM}
                }
            });

            return payload;
        }

        this.getCreateWineOrderPayload = function (order, cart, shipDate, subInventory, shipMethod) {
            return getCreateWineOrderPayload(order, cart, shipDate, subInventory, shipMethod);
        };
        
        function getCreateBeerOrderPayload(order, cart, shipDate, subInventory, shipMethod) {
            var user = app.moduleConfig.params.rootContext.userProfile;

            var headerPayload = getHeaderPayload(order);

            var I_LINE_TBL_ITEM = getOrderDetail(cart, subInventory, shipDate, shipMethod);

            // prepare the payload for validation of sales order
            var payload = JSON.stringify({
                InputCreateBeerOrder: {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },                             
                    "I_HEADER_REC": headerPayload,
                    "I_LINE_TBL": {I_LINE_TBL_ITEM: I_LINE_TBL_ITEM}
                }
            });

            return payload;
        }

        this.getCreateBeerOrderPayload = function (order, cart, shipDate, subInventory, shipMethod) {
            return getCreateBeerOrderPayload(order, cart, shipDate, subInventory, shipMethod);
        };

        function getValidatePayload(order, cart) {
            var I_LINE_TBL_ITEM = [];
            var headerPayload = "";
            var cartArray = ko.utils.unwrapObservable(cart);
            var cartArrayLength = cartArray.length;
            
            var user = app.moduleConfig.params.rootContext.userProfile;
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;

            // get order type id
            var orderTypeId = getOrderTypeId(orgUnitId);
            
            if (salesRole == constant.SR_SALE_VAN) {
                orderTypeId = constant.ORDER_TYPE_ID_VANS;
            }

            if (order) {
                // prepare the order master information
                headerPayload = ko.toJS({
                    "ORDER_TYPE_ID": orderTypeId,
                    "SOLD_TO_ORG_ID": ko.utils.unwrapObservable(order.sold_to_org_id),
                    "SHIP_TO_ORG_ID": ko.utils.unwrapObservable(order.ship_to_org_id),
                    "INVOICE_TO_ORG_ID": ko.utils.unwrapObservable(order.invoice_to_org_id),
                    "PRICE_LIST_ID": ko.utils.unwrapObservable(order.price_list_id),
                    "PRICING_DATE": ko.utils.unwrapObservable(order.pricing_date),
                    "CUST_PO_NUMBER": ko.utils.unwrapObservable(order.purchase_order),
                    "SOLD_FROM_ORG_ID": ko.utils.unwrapObservable(order.sold_from_org_id),
                    "SHIP_FROM_ORG_ID": ko.utils.unwrapObservable(order.ship_from_org_id),
                    "SALESREP_ID": ko.utils.unwrapObservable(order.sales_rep_id),
                    "TRANSACTIONAL_CURR_CODE": ko.utils.unwrapObservable(order.transactional_curr_code),
                    "PAYMENT_TERM_ID": ko.utils.unwrapObservable(order.payment_term_id),
                    "REAL_CUSTOMER": ko.utils.unwrapObservable(order.real_customer),
                    "REMARKS": ko.utils.unwrapObservable(order.remarks),
                    "FREIGHT_CHARGE": ko.utils.unwrapObservable(order.delivery_cost),
                    "USER_ID": userName,
                    "USER_ROLE": salesRole
                });
            }

            // prepare the order line items
            for (index = 0; index < cartArrayLength; index++) {
                // convert to ISO date format
                var shipDate = ko.utils.unwrapObservable(cartArray[index].shipment);
                if (commonHelper.isDateFormat(shipDate, 'YYYY/MM/DD')) {
                    shipDate = commonHelper.formatStrDateToISO(shipDate);
                }
                if (commonHelper.isDateFormat(shipDate, 'YYYY-MM-DD')) {
                    shipDate = commonHelper.formatStrDateToISO(shipDate, 'YYYY-MM-DD');
                }
                if (commonHelper.isDateFormat(shipDate, 'DD-MMM-YYYY')) {
                    shipDate = commonHelper.formatStrDateToISO(shipDate, 'DD-MMM-YYYY');
                }                
                var itemPayload = {
                    "LINE_NUMBER": index + 1,
                    "INVENTORY_ITEM_ID": ko.utils.unwrapObservable(cartArray[index].product().id),
                    "ORDERED_QUANTITY": ko.utils.unwrapObservable(cartArray[index].quantity),
                    "UNIT_SELLING_PRICE": ko.utils.unwrapObservable(cartArray[index].product().price),
                    "ORIGINAL_LINE": ko.utils.unwrapObservable(cartArray[index].original),
                    "SCHEDULE_SHIP_DATE":  shipDate,
                    "SUBINVENTORY":  ko.utils.unwrapObservable(cartArray[index].subInventory),
                    "SHIPPING_METHOD":  ko.utils.unwrapObservable(cartArray[index].shipmentMethod)
                };
                I_LINE_TBL_ITEM.push(itemPayload);
            }

            // prepare the payload for validation of sales order
            var payload = JSON.stringify({
                "InputValidateSalesOrder": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },                    
                    "I_HEADER_REC": headerPayload,
                    "I_LINE_TBL": {I_LINE_TBL_ITEM: I_LINE_TBL_ITEM}
                }
            });

            return payload;
        }

        this.getValidatePayload = function (order, cart) {
            return getValidatePayload(order, cart);
        };
        
        
        function getEarliestShipDatePayload(subInventory, shipFromOrgId, inventoryId, orderedQuantity) {
            var user = app.moduleConfig.params.rootContext.userProfile;
            var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
            var district = ko.utils.unwrapObservable(customerProfile.shipToDistrict);
            district = (district == "-1") ? null : district;            
            var payload = JSON.stringify({
                "InputGetEarliestShipDate": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },
                    "I_ORG_ID": user.orgUnitId,
                    "I_DISTRICT": district,
                    "I_SUBINV": subInventory,
                    "I_SHIP_FROM_ORG_ID": shipFromOrgId,
                    "I_INVENTORY_ITEM_ID": inventoryId,
                    "I_ORDERED_QUANTITY": orderedQuantity
                }
            });
            return payload;
        }
        
        function getEarliestShipDateByCPPayload(subInventory, shipmentMethod) {
            var user = app.moduleConfig.params.rootContext.userProfile;
            var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
            var district = ko.utils.unwrapObservable(customerProfile.shipToDistrict);
            district = (district == "-1") ? null : district;
            var payload = JSON.stringify({
                "InputGetEarliestShipDate": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },
                    "I_ORG_ID": user.orgUnitId,
                    "I_DISTRICT": district,
                    "I_SUBINV": subInventory,
                    "I_SHIPPING_METHOD": shipmentMethod
                }
            });
            return payload;
        }        
       
       this.getEarliestShipDatePayload = function(subInventory) {
           return getEarliestShipDatePayload(subInventory, NULL, NULL, NULL);
       };
       
       this.getEarliestShipDatePayload = function(subInventory, shipFromOrgId, inventoryId, orderedQuantity) {
           return getEarliestShipDatePayload(subInventory, shipFromOrgId, inventoryId, orderedQuantity);
       };       
       
       this.getEarliestShipDateByCPPayload = function(subInventory, shipmentMethod) {
           return getEarliestShipDateByCPPayload(subInventory, shipmentMethod);
       };       
       
        function getEarliestShipDateMessage(payload) {
            var defer = $.Deferred();

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/getEarliestShipDateMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Get Earliest Ship Date - " + constant.P_GET_EARLIEST_SHIP_DATE_KEY);
            amplify.request({
                resourceId: constant.P_GET_EARLIEST_SHIP_DATE_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        };
        
        function getEarliestShipDateByCPMessage(payload) {
            var defer = $.Deferred();

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/getEarliestShipDateByCPMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Get Earliest Ship Date By CP - " + constant.P_GET_EARLIEST_SHIP_DATE_BY_CP_KEY);
            amplify.request({
                resourceId: constant.P_GET_EARLIEST_SHIP_DATE_BY_CP_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        };        
        
       this.getEarliestShipDateMessage = function(payload) {
           return getEarliestShipDateMessage(payload);
       };
       
       this.getEarliestShipDateByCPMessage = function(payload) {
           return getEarliestShipDateByCPMessage(payload);
       };       

        function validateSalesOrderMessage(payload) {
            var defer = $.Deferred();

            var P_VALIDATE_SALES_ORDER = "validateSalesOrder";

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/validateSalesOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Validate Sales Order");
            amplify.request({
                resourceId: P_VALIDATE_SALES_ORDER,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        } ;

        this.validateSalesOrderMessage = function (payload) {
            return validateSalesOrderMessage(payload);
        };


        function createSalesOrderMessage(payload, reqName) {
            var defer = $.Deferred();

            // var reqName = { "createWineOrderService", "createBeerOrderService"};

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/createSalesOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Create Sales Order");
            amplify.request({
                resourceId: reqName,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        }
        ;

        this.createSalesOrderMessage = function (payload, reqName) {
            return createSalesOrderMessage(payload, reqName);
        };


        function createVanOrderMessage(payload) {
            var defer = $.Deferred();

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/createVanOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Create Van Order - " + constant.P_CREATE_VAN_SALES_KEY);
            amplify.request({
                resourceId: constant.P_CREATE_VAN_SALES_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        }
        ;

        this.createVanOrderMessage = function (payload) {
            return createVanOrderMessage(payload);
        };
        
        function createQuotationMessage(payload) {
            var defer = $.Deferred();
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/createQuotationMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Create Quotation - " + constant.P_CREATE_QUOTATION);
            amplify.request({
                resourceId: constant.P_CREATE_QUOTATION,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        }
        
        this.createQuotationMessage = function (payload) {
            return createQuotationMessage(payload);
        };        


        function getBookSalesOrderPayload(headerId, paymentType) {
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            var payload = JSON.stringify({
                InputBookSalesOrder: {
                    HeaderInfo: {
                        UserID: userName,
                        UserRole: salesRole,
                        CallerID: ""
                    },
                    I_ORG_ID: orgUnitId,
                    I_HEADER_ID: headerId,
                    I_PAYMENT_TYPE: paymentType
                }
            });
            return payload;
        }

        function getCancelSalesOrderPayload(headerId) {
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            var payload = JSON.stringify({
                InputCancelSalesOrder: {
                    HeaderInfo: {
                        UserID: userName,
                        UserRole: salesRole,
                        CallerID: ""
                    },
                    I_ORG_ID: orgUnitId,
                    I_HEADER_ID: headerId
                }
            });
            return payload;
        }

        function bookSalesOrderMessage(headerId, paymentType) {
            var defer = $.Deferred();

            var payload = getBookSalesOrderPayload(headerId, paymentType);
            console.log("bookSalesOrderMessage payload =" + ko.toJS(payload));

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/bookSalesOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] book sales order - " + constant.P_BOOK_SALES_ORDER_KEY);
            amplify.request({
                resourceId: constant.P_BOOK_SALES_ORDER_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
            return $.when(defer);
        }

        this.bookSalesOrderMessage = function (headerId, paymentType) {
            return bookSalesOrderMessage(headerId, paymentType);
        };

        function cancelSalesOrderMessage(headerId) {
            var defer = $.Deferred();

            var payload = getCancelSalesOrderPayload(headerId);
            console.log("cancelSalesOrderMessage payload = " + ko.toJS(payload));

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/cancelSalesOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] cancel sales order - " + constant.P_CANCEL_SALES_ORDER_KEY);
            amplify.request({
                resourceId: constant.P_CANCEL_SALES_ORDER_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
            
            return $.when(defer);
        }

        this.cancelSalesOrderMessage = function (headerId) {
            return cancelSalesOrderMessage(headerId);
        };


        function getSubInventoryMessage(ioId) {
            var defer = $.Deferred();

            var payload = getSubInventoryPayload(ioId);
            console.log("getSubInventoryMessage payload =" + ko.toJS(payload));
            // var ioId;

            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            var userName = app.moduleConfig.params.rootContext.userProfile.username;
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;

//            if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
//                ioId = constant.IO_ID_2899;
//            } else {
//                ioId = constant.IO_ID_2898;
//            }

            var key = constant.P_SUB_INVENTORY_KEY + ":" + ioId;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/stockInquiry/subInventoryMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] SubInventory - " + key);
                defer.resolve(data, {status: 200});
            } else {
                console.log("[Amplify Request] SubInventory - " + key);
                amplify.request({
                    resourceId: constant.P_SUB_INVENTORY_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }

            return $.when(defer);
        }
        ;

        this.getSubInventoryMessage = function (ioId) {
            return getSubInventoryMessage(ioId);
        };

        function getShipmentMethodMessage() {
            var defer = $.Deferred();

            var payload = getShipmentMethodPayload();
            console.log("getShipmentMethodMessage payload=" + ko.toJS(payload));

            var key = constant.P_SHIPMENT_METHOD_KEY;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/stockInquiry/shipmentMethodMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] Shipment Method - " + key);
                defer.resolve(data, {status: 200});
            } else {
                console.log("[Amplify Request] Shipment Method - " + key);
                amplify.request({
                    resourceId: constant.P_SHIPMENT_METHOD_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }

            return $.when(defer);
        }
        ;

        this.getShipmentMethodMessage = function () {
            return getShipmentMethodMessage();
        };
        
        
        function getBillToListMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.BILL_TO_LIST_KEY;
            
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/billToListMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }   

            console.log("[Amplify Request] Bill To List - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
            
            return $.when(defer);
        }

        this.getBillToListMessage = function (payload) {
            return getBillToListMessage(payload);
        };
        
        function getSalesRepListMessage(payload) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetSalesERPName.P_ORG_ID;
            
            var key = constant.SALES_REP_LIST_KEY + ":" + P_ORG_ID            
            
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/checkOut/salesRepListMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }         
            
            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] Sales Rep List - " + key);
                defer.resolve(data, {status: 200});
            } else {
                console.log("[Amplify Request] Sales Rep List - " + key);
                amplify.request({
                    resourceId: constant.SALES_REP_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }            
            
            return $.when(defer);
        };
        
        this.getSalesRepListMessage = function(payload) {
            return getSalesRepListMessage(payload);
        };

    }

    return new CheckOutService();
});
