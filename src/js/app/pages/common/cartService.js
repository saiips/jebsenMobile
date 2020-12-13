/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'appController', 'util/commonhelper', 'pages/common/constant'
], function (ko, $, app, commonHelper, constant) {

    function CartService() {
        var self = this;

        self.cart = ko.observableArray([]);
        self.order = ko.observableArray([]);
        self.quotation = ko.observableArray([]);
        self.savedOrder = [];

        // CLASS Order
        var Order = function (data) {
            this.cust_name = ko.observable(data.CUSTOMER_NAME);
            this.outlet_name = ko.observable(data.OUTLET_NAME);
            this.order_no = ko.observable(data.ORDER_NUMBER);
            this.purchase_order = ko.observable(data.CUST_PO_NUMBER === "-1" ? "" : data.CUST_PO_NUMBER);
            if (!commonHelper.isDateFormat(data.ORDERED_DATE, "YYYY/MM/DD")) {
                if (commonHelper.isValid(data.ORDERED_DATE)) {
                    this.order_date = ko.observable(commonHelper.formatStrDateToYYYYMMDD(data.ORDERED_DATE));
                } else {
                    this.order_date = ko.observable(commonHelper.getClientCurrentDate());
                }
            } else {
                this.order_date = ko.observable(data.ORDERED_DATE);
            }
            this.real_customer = ko.observable(data.REAL_CUSTOMER === "-1" ? "" : data.REAL_CUSTOMER);
            this.remarks = ko.observable(data.ORDER_REMARKS === "-1" ? "" : data.ORDER_REMARKS);
            this.delivery_cost = ko.observable(data.FREIGHT_CHARGE);
            this.ship_to_district = ko.observable(data.SHIP_TO_DISTRICT);
            this.shipping_address = ko.observable(data.SHIP_TO_ADDRESS);
            this.billing_address = ko.observable(data.BILL_TO_ADDRESS);
            this.status = ko.observable(data.HEADER_FLOW_STATUS_CODE);
            this.sold_to_org_id = ko.observable(data.SOLD_TO_ORG_ID);
            this.ship_to_org_id = ko.observable(data.SHIP_TO_ORG_ID);
            this.invoice_to_org_id = ko.observable(data.INVOICE_TO_ORG_ID);
            this.price_list_id = ko.observable(data.PRICE_LIST_ID);
            this.pricing_date = ko.observable(data.PRICING_DATE);
            this.sold_from_org_id = ko.observable(data.SOLD_FROM_ORG_ID);
            this.ship_from_org_id = ko.observable(data.SHIP_FROM_ORG_ID);
            this.sales_rep_id = ko.observable(data.SALES_REP_ID);
            this.transactional_curr_code = ko.observable(data.TRANSACTIONAL_CURR_CODE);
            this.payment_term_id = ko.observable(data.PAYMENT_TERM_ID);
            this.oe_header_id = ko.observable(data.OE_HEADER_ID);
            this.order_type_id = ko.observable(data.ORDER_TYPE_ID);
            this.order_type = ko.observable(data.ORDER_TYPE);
            this.order_tot_amt = ko.observable(data.ORDER_TOT_AMT);
            this.walk_in_cust = ko.observable(data.WALK_IN_CUST);
            this.override_sub_inventory = ko.observable(data.OVERRIDE_SUB_INVENTORY === "-1" ? "": data.OVERRIDE_SUB_INVENTORY);
            this.override_shipment_method = ko.observable(data.OVERRIDE_SHIPMENT_METHOD === "-1" ? "": data.OVERRIDE_SHIPMENT_METHOD);
            this.override_shipment_date = ko.observable(data.OVERRIDE_SHIPMENT_DATE);
            this.custAccountId = ko.observable(data.CUST_ACCOUNT_ID);
            this.accountNumber = ko.observable(data.ACCOUNT_NUMBER);
            this.override_billTo = ko.observable(data.OVERRIDE_BILL_TO);
            this.override_salesPerson = ko.observable(data.OVERRIDE_SALES_PERSON);
            this.payment_method = ko.observable(data.PAYMENT_METHOD === "-1" ? null: data.PAYMENT_METHOD);
        };
        
        ko.dirtyFlag = function (root, isInitiallyDirty) {
            var result = function () {},
                    _initialState = ko.observable(ko.toJSON(root)),
                    _isInitiallyDirty = ko.observable(isInitiallyDirty);

            result.isDirty = ko.computed(function () {
                return _isInitiallyDirty() || _initialState() !== ko.toJSON(root);
            });

            result.reset = function () {
                _initialState(ko.toJSON(root));
                _isInitiallyDirty(false);
            };

            return result;
        };        
        
        var Modifier = function(data, isInitiallyDirty) {
            this.id = ko.observable(data.id);
            this.MODIFIER_NUMBER = (data.MODIFIER_NUMBER == "-1") ? ko.observable(null) : ko.observable(data.MODIFIER_NUMBER);
            this.FROM_STAGING = (data.FROM_STAGING == "Y") ? ko.observable(true) : ko.observable(false);
            this.MODIFIER_TYPE = ko.observable(data.MODIFIER_TYPE);
            this.MODIFIER_ITEM_ID = ko.observable(data.MODIFIER_ITEM_ID);
            this.MODIFIER_VALUE_FROM = (data.MODIFIER_VALUE_FROM == "-1") ? ko.observable(null) : ko.observable(data.MODIFIER_VALUE_FROM);
            this.GET_ITEM_ID = (data.GET_ITEM_ID == "-1") ? ko.observable(null) : ko.observable(new String(data.GET_ITEM_ID).toString());
            this.GET_ITEM_NUMBER = (data.GET_ITEM_NUMBER == "-1") ? ko.observable(null) : ko.observable(data.GET_ITEM_NUMBER);
            this.GET_QUANTITY = (data.GET_QUANTITY == "-1") ? ko.observable(null) : ko.observable(data.GET_QUANTITY);
            this.GET_PRICE = (data.GET_PRICE == "-1") ? ko.observable(null) : ko.observable(data.GET_PRICE);
            this.GET_PROMOTION_NATURE = (data.GET_PROMOTION_NATURE == "-1") ? ko.observable(null) : ko.observable(data.GET_PROMOTION_NATURE);            
            this.GET_PERCENT = (data.GET_PERCENT == "-1") ? ko.observable(null) : ko.observable(data.GET_PERCENT);            
            this.MODIFIER_START_DATE = ko.observable(data.MODIFIER_START_DATE);
            this.MODIFIER_END_DATE = ko.observable(data.MODIFIER_END_DATE);            
            this.MODIFIER_SHIP_TO = (data.MODIFIER_SHIP_TO == "Y") ? ko.observable(true) : ko.observable(false);
            this.dirtyFlag = new ko.dirtyFlag(data, isInitiallyDirty);
            this.SHOW_LINK_BTN = (data.SHOW_LINK_BTN == "Y") ? ko.observable(true) : ko.observable(false);
            this.SHOW_REMOVE_BTN = (data.SHOW_REMOVE_BTN == "Y") ? ko.observable(true) : ko.observable(false);
            this.ENABLE_SHIP_TO = (data.ENABLE_SHIP_TO == "Y") ? ko.observable(true) : ko.observable(false);
            // ORIGINAL IMAGE
            var startDate = data.MODIFIER_START_DATE;
            var endDate = data.MODIFIER_END_DATE;
            try {
                startDate = commonHelper.formatStrDate(data.MODIFIER_START_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "YYYY-MM-DD");
                endDate = commonHelper.formatStrDate(data.MODIFIER_END_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "YYYY-MM-DD");
            } catch (exception) {
            }
            this.ORIGINAL_MODIFIER_VALUE_FROM = (data.MODIFIER_VALUE_FROM == "-1") ? null : data.MODIFIER_VALUE_FROM;
            this.ORIGINAL_GET_ITEM_ID = (data.GET_ITEM_ID == "-1") ? null : new String(data.GET_ITEM_ID).toString();
            this.ORIGINAL_GET_QUANTITY = (data.GET_QUANTITY == "-1") ? null : data.GET_QUANTITY;
            this.ORIGINAL_GET_PRICE = (data.GET_PRICE == "-1") ? null : data.GET_PRICE;
            this.ORIGINAL_GET_PROMOTION_NATURE = (data.GET_PROMOTION_NATURE == "-1") ? null : data.GET_PROMOTION_NATURE; 
            this.ORIGINAL_GET_PERCENT = (data.GET_PERCENT == "-1") ? null : data.GET_PERCENT;
            this.ORIGINAL_MODIFIER_START_DATE = startDate;
            this.ORIGINAL_MODIFIER_END_DATE = endDate;
            this.ORIGINAL_MODIFIER_SHIP_TO = (data.MODIFIER_SHIP_TO == "Y") ? true : false;
        };

        var Quotation = function (data) {
            this.cust_name = ko.observable(data.CUSTOMER_NAME);
            this.quotation_no = ko.observable(data.QUOTATION_NUMBER);
            if (commonHelper.isValid(data.QUOTATION_DATE)) {
                this.quotation_date = ko.observable(commonHelper.formatStrDateToYYYYMMDD(data.QUOTATION_DATE));
            } else {
                this.quotation_date = ko.observable(commonHelper.getClientCurrentDate());
            }
            this.real_customer = ko.observable(data.REAL_CUSTOMER === "-1" ? "" : data.REAL_CUSTOMER);
            this.remarks = ko.observable(data.REMARKS === "-1" ? "" : data.REMARKS);
            this.shipping_address = ko.observable(data.SHIP_TO_ADDRESS);
            this.billing_address = ko.observable(data.BILL_TO_ADDRESS);
            this.status = ko.observable(data.HEADER_FLOW_STATUS_CODE);
            this.sold_to_org_id = ko.observable(data.SOLD_TO_ORG_ID);
            this.ship_to_org_id = ko.observable(data.SHIP_TO_ORG_ID);
            this.invoice_to_org_id = ko.observable(data.INVOICE_TO_ORG_ID);
            this.price_list_id = ko.observable(data.PRICE_LIST_ID);
            this.sold_from_org_id = ko.observable(data.SOLD_FROM_ORG_ID);
            this.ship_from_org_id = ko.observable(data.SHIP_FROM_ORG_ID);
            this.sales_rep_id = ko.observable(data.SALES_REP_ID);
            this.transactional_curr_code = ko.observable(data.TRANSACTIONAL_CURR_CODE);
            this.payment_term_id = ko.observable(data.PAYMENT_TERM_ID);
            this.oe_header_id = ko.observable(data.OE_HEADER_ID);
            this.order_type_id = ko.observable(data.ORDER_TYPE_ID);
            this.order_type = ko.observable(data.ORDER_TYPE);
            this.quotation_tot_qty = ko.observable(data.QUOTATION_TOT_QTY);
            this.attention = ko.observable(data.ATTENTION === "-1" ? "" : data.ATTENTION);
            this.salesTerm = ko.observable(data.SALES_TERM === "-1" ? "" : data.SALES_TERM);
        }

        // CLASS Product
        var Product = function (data) {
            this.id = ko.observable(data.INVENTORY_ITEM_ID);
            this.prod_desc = ko.observable(data.PRODUCT_DESCRIPTION);
            this.prod_code = ko.observable(data.PRODUCT);
            this.lot = ko.observable((data.LOT_NUMBER === "-1" || data.LOT_NUMBER === "-2") ? "" : data.LOT_NUMBER);
            this.sku = ko.observable(data.ORDER_QUANTITY_UOM);
            this.price = ko.observable(data.UNIT_SELLING_PRICE);
            this.shipping_district = ko.observable("");
            this.delivery_status = ko.observable(data.FLOW_STATUS_CODE);
            this.prod_brand = ko.observable(data.PRODUCT_BRAND);
            this.principal = ko.observable(data.PRINCIPAL);
            this.currency_code = ko.observable(data.CURRENCY_CODE);
            this.draft_beer_flag = ko.observable(data.DRAFT_BEER_FLAG);
            this.isEditable = ko.computed(function () {
                var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
                var user = app.moduleConfig.params.rootContext.userProfile;
                // if (orgUnitId == constant.ORG_UNIT_ID_WINE || user.salesRole == constant.SR_SALE_VAN) return false;
                if (user.salesRole == constant.SR_SALE_VAN) return false;
                if ("Y" === this.draft_beer_flag) return false;
                return true;
            });
            // for quotation line item remarks
            this.remark = ko.observable((data.REMARK === "-1") ? "" : data.REMARK);
            this.isFetchModifier = ko.observable(true);
            // for quotation modifier - promotion item
            this.promotionItem = ko.observableArray();
            // for quotation modifier - special discount
            this.specialDiscount = ko.observableArray();
            // for quotation modifier - special amount
            this.specialAmount = ko.observableArray();
        };

        // CLASS Shipment
        var Shipment = function (id, shipmentDate, quantity) {
            this.id = ko.observable(id);
            this.shipmentDate = ko.observable(shipmentDate);
            this.quantity = ko.observable(quantity);
        };

        // CLASS CartItem
        var CartItem = function (product, quantity, showBtn, shipment, original, lotArray, subInventory, shipmentMethod, shipmentMethodDisplay) {
            var self = this;

            self.product = ko.observable(product);
            self.quantity = ko.observable(quantity || 0);
            self.id = ko.observable(self.product().id);
            self.showAddCartBtn = ko.observable(showBtn);
            if (commonHelper.isValid(shipment)) {
                self.shipment = ko.observable(shipment);
            }
            self.original = ko.observable(original);
            self.lotArray = ko.observableArray(lotArray);
            self.shipmentMethod = ko.observable(shipmentMethod);
            self.shipmentMethodDisplay = ko.observable((shipmentMethodDisplay == "-1" || typeof shipmentMethodDisplay === "undefined") ? "" : shipmentMethodDisplay);
            self.subInventory = ko.observable(subInventory);
            self.isDisabledShipmentMethod = ko.computed(function () {
                if (constant.MS_WAREHSE == ko.utils.unwrapObservable(self.subInventory())) {
                    return false;
                } else if (constant.JL_WAREHSE == ko.utils.unwrapObservable(self.subInventory())) {
                    return false;
                } else if (constant.PW_WAREHSE == ko.utils.unwrapObservable(self.subInventory())) {
                    return true;
                } else {
                    self.shipmentMethod("-1");
                    return true;
                }
            });
            self.isOriginal = ko.computed(function() {
                if ("Y" == self.original()) {
                    return true;
                }
                return false;
            });

            self.cost = ko.computed(function () {
                var price = ko.utils.unwrapObservable(self.product().price);
                var quantity = ko.utils.unwrapObservable(self.quantity());
                var cost = price * quantity;
                return cost;
            });
        };
        
        this.createModifier = function(data, isInitiallyDirty) {
            return new Modifier(data, isInitiallyDirty);
        };
        
        this.createQuotation = function (data) {
            return new Quotation(data);
        };

        this.createOrder = function (data) {
            return new Order(data);
        };

        this.setQuotation = function (data) {
            self.quotation = data;
        };

        this.getQuotation = function () {
            return self.quotation;
        };

        this.setOrder = function (data) {
            self.order = data;
        };

        this.getOrder = function () {
            return self.order;
        };

        this.setSavedOrder = function (payload) {
            self.savedOrder = payload;
        };

        this.getSavedOrder = function () {
            return self.savedOrder;
        };

        this.createProduct = function (data) {
            return new Product(data);
        };

        this.createProductWithCart = function (data, cart) {
            var product = new Product(data);

            $(cart()).each(function (index, item) {
                if (ko.toJSON(item.product().id) === ko.toJSON(product.id)) {
                    product.quantity = ko.toJSON(item.product().quantity);
                }
            });

            return product;
        };

        this.createCartFromStore = function (data, cart) {
            var cart_item = ko.utils.arrayFirst(cart, function (item) {
                return ko.utils.unwrapObservable(item.product().id) == data.id;
            });

            if (cart_item != null) {
                cart_item.showAddCartBtn = ko.observable(false);
            } else if (typeof cart_item === "undefined" || cart_item === null) {
                cart_item = this.createCartItem(data, 0, true, '');
            }

            return cart_item;
        };

        this.createCartItem = function (data, quantity, shownAddCartBtn) {
            var p = new Product(data);
            return new CartItem(p, quantity, shownAddCartBtn, '');
        };

        this.createCartItem = function (data, quantity, shownAddCartBtn, shipment) {
            var p = new Product(data);
            return new CartItem(p, quantity, shownAddCartBtn, shipment, "Y");
        };

        this.createCartItem = function (data, quantity, shownAddCartBtn, shipment, original) {
            var p = new Product(data);
            var array = new Array();
            return new CartItem(p, quantity, shownAddCartBtn, shipment, original, array);
        };

        this.createCartItem = function (data, quantity, shownAddCartBtn, shipment, original, lotArray) {
            var p = new Product(data);
            return new CartItem(p, quantity, shownAddCartBtn, shipment, original, lotArray);
        };

        this.createCartItem = function (data, quantity, shownAddCartBtn, shipment, original, lotArray, subInventory, shipmentMethod) {
            var p = new Product(data);
            return new CartItem(p, quantity, shownAddCartBtn, shipment, original, lotArray, subInventory, shipmentMethod, '');
        };
        
        this.createCartItem = function (data, quantity, shownAddCartBtn, shipment, original, lotArray, subInventory, shipmentMethod, shipmentMethodDisplay) {
            var p = new Product(data);
            return new CartItem(p, quantity, shownAddCartBtn, shipment, original, lotArray, subInventory, shipmentMethod, shipmentMethodDisplay);
        };        

        this.cloneOrder = function (order) {
            var payload = this.payload4Order(order);
            var order = new Order(payload);
            return order;
        };

        this.payload4Order = function (order) {
            var payload = JSON.stringify({
                "CUST_ACCOUNT_ID": ko.utils.unwrapObservable(order.custAccountId),
                "ACCOUNT_NUMBER": ko.utils.unwrapObservable(order.accountNumber),
                "CUSTOMER_NAME": ko.utils.unwrapObservable(order.cust_name),
                "OUTLET_NAME": ko.utils.unwrapObservable(order.outlet_name),
                "ORDER_NUMBER": ko.utils.unwrapObservable(order.order_no),
                "CUST_PO_NUMBER": ko.utils.unwrapObservable(order.purchase_order),
                "ORDERED_DATE": ko.utils.unwrapObservable(order.order_date),
                "REAL_CUSTOMER": ko.utils.unwrapObservable(order.real_customer),
                "ORDER_REMARKS": ko.utils.unwrapObservable(order.remarks),
                "SHIP_TO_DISTRICT": ko.utils.unwrapObservable(order.ship_to_district),
                "SHIP_TO_ADDRESS": ko.utils.unwrapObservable(order.shipping_address),
                "BILL_TO_ADDRESS": ko.utils.unwrapObservable(order.billing_address),
                "HEADER_FLOW_STATUS_CODE": ko.utils.unwrapObservable(order.status),
                "SOLD_TO_ORG_ID": ko.utils.unwrapObservable(order.sold_to_org_id),
                "SHIP_TO_ORG_ID": ko.utils.unwrapObservable(order.ship_to_org_id),
                "INVOICE_TO_ORG_ID": ko.utils.unwrapObservable(order.invoice_to_org_id),
                "PRICE_LIST_ID": ko.utils.unwrapObservable(order.price_list_id),
                "PRICING_DATE": ko.utils.unwrapObservable(order.pricing_date),
                "SOLD_FROM_ORG_ID": ko.utils.unwrapObservable(order.sold_from_org_id),
                "SHIP_FROM_ORG_ID": ko.utils.unwrapObservable(order.ship_from_org_id),
                "SALES_REP_ID": ko.utils.unwrapObservable(order.sales_rep_id),
                "TRANSACTIONAL_CURR_CODE": ko.utils.unwrapObservable(order.transactional_curr_code),
                "PAYMENT_TERM_ID": ko.utils.unwrapObservable(order.payment_term_id),
                "FREIGHT_CHARGE": ko.utils.unwrapObservable(order.delivery_cost),
                "OE_HEADER_ID": ko.utils.unwrapObservable(order.oe_header_id),
                "ORDER_TYPE_ID": ko.utils.unwrapObservable(order.order_type_id),
                "ORDER_TYPE": ko.utils.unwrapObservable(order.order_type),
                "ORDER_TOT_AMT": ko.utils.unwrapObservable(order.order_tot_amt),
                "WALK_IN_CUST": ko.utils.unwrapObservable(order.walk_in_cust),
                "OVERRIDE_SUB_INVENTORY": ko.utils.unwrapObservable(order.override_sub_inventory),
                "OVERRIDE_SHIPMENT_METHOD": ko.utils.unwrapObservable(order.override_shipment_method),
                "OVERRIDE_SHIPMENT_DATE": ko.utils.unwrapObservable(order.override_shipment_date),
                "OVERRIDE_BILL_TO": ko.utils.unwrapObservable(order.override_billTo),
                "OVERRIDE_SALES_PERSON": ko.utils.unwrapObservable(order.override_salesPerson),
                "PAYMENT_METHOD": ko.utils.unwrapObservable(order.payment_method)
            });
            return ko.utils.parseJson(payload);
        };

        this.payload4OrderLine = function (cart) {
            var payload = JSON.stringify(
                    {
                        "INVENTORY_ITEM_ID": ko.utils.unwrapObservable(cart.product().id),
                        "PRODUCT_DESCRIPTION": ko.utils.unwrapObservable(cart.product().prod_desc),
                        "PRODUCT": ko.utils.unwrapObservable(cart.product().prod_code),
                        "LOT_NUMBER": (ko.utils.unwrapObservable(cart.product().lot)) ? ko.utils.unwrapObservable(cart.product().lot) : "",
                        "ORDER_QUANTITY_UOM": ko.utils.unwrapObservable(cart.product().sku),
                        "UNIT_SELLING_PRICE": ko.utils.unwrapObservable(cart.product().price),
                        "FLOW_STATUS_CODE": ko.utils.unwrapObservable(cart.product().delivery_status),
                        "PRODUCT_BRAND": ko.utils.unwrapObservable(cart.product().prod_brand),
                        "CURRENCY_CODE": ko.utils.unwrapObservable(cart.product().currency_code),
                        "ORDERED_QUANTITY": ko.utils.unwrapObservable(cart.quantity),
                        "SCHEDULE_SHIP_DATE": ko.utils.unwrapObservable(cart.shipment),
                        "ORIGINAL_LINE": ko.utils.unwrapObservable(cart.original),
                        "DRAFT_BEER_FLAG": ko.utils.unwrapObservable(cart.product().draft_beer_flag),
                        "SUBINVENTORY": ko.utils.unwrapObservable(cart.subInventory),
                        "SHIPPING_METHOD": (ko.utils.unwrapObservable(cart.shipmentMethod)) ? ko.utils.unwrapObservable(cart.shipmentMethod) : null
                    });

            return ko.utils.parseJson(payload);
        };

        this.cloneCartItem = function (cart) {
            var payload = JSON.stringify(
                    {
                        "INVENTORY_ITEM_ID": ko.utils.unwrapObservable(cart.product().id),
                        "PRODUCT_DESCRIPTION": ko.utils.unwrapObservable(cart.product().prod_desc),
                        "PRODUCT": ko.utils.unwrapObservable(cart.product().prod_code),
                        "LOT_NUMBER": (ko.utils.unwrapObservable(cart.product().lot)) ? ko.utils.unwrapObservable(cart.product().lot) : "",
                        "ORDER_QUANTITY_UOM": ko.utils.unwrapObservable(cart.product().sku),
                        "UNIT_SELLING_PRICE": ko.utils.unwrapObservable(cart.product().price),
                        "FLOW_STATUS_CODE": ko.utils.unwrapObservable(cart.product().delivery_status),
                        "PRODUCT_BRAND": ko.utils.unwrapObservable(cart.product().prod_brand),
                        "CURRENCY_CODE": ko.utils.unwrapObservable(cart.product().currency_code),
                        "ORDERED_QUANTITY": ko.utils.unwrapObservable(cart.quantity),
                        "SCHEDULE_SHIP_DATE": ko.utils.unwrapObservable(cart.shipment),
                        "ORIGINAL_LINE": ko.utils.unwrapObservable(cart.original),                        
                        "DRAFT_BEER_FLAG": ko.utils.unwrapObservable(cart.product().draft_beer_flag),
                        "SUBINVENTORY": ko.utils.unwrapObservable(cart.subInventory),
                        "SHIPPING_METHOD": ko.utils.unwrapObservable(cart.shipmentMethod),
                        "REMARK": ko.utils.unwrapObservable(cart.product().remark)
                    }
            );

            // convert to unobservable first
            var quantity = ko.utils.unwrapObservable(cart.quantity);
            var shipment = ko.utils.unwrapObservable(cart.shipment);
            var original = ko.utils.unwrapObservable(cart.original);
            var lotArray = ko.utils.unwrapObservable(cart.lotArray);
            var shipmentMethod = ko.utils.unwrapObservable(cart.shipmentMethod);
            var subInventory = ko.utils.unwrapObservable(cart.subInventory);

            var product = new Product(ko.utils.parseJson((payload)));
            // for quotation modifier
            product.specialDiscount = cart.product().specialDiscount;
            product.specialAmount = cart.product().specialAmount;
            product.promotionItem = cart.product().promotionItem;
            product.isFetchModifier = cart.product().isFetchModifier;
            return new CartItem(product, quantity, false, shipment, original, lotArray, subInventory, shipmentMethod);
        };

        this.restoreCart = function (cart) {
            var _cart = ko.observableArray();
            var cartLength = ko.utils.unwrapObservable(cart).length;
            for (index = 0; index < cartLength; index++) {
                var cartItem = this.cloneCartItem(cart()[index]);
                _cart.push(cartItem);
            }
            return _cart;
        };

        this.cloneCart = function (cart) {
            return this.restoreCart(cart);
        };

        this.setCart = function (cart) {
            self.cart = cart;
        };

        this.getCart = function () {
            return self.cart;
        };

        this.findProduct = function (productId, cart, allProduct) {
            var cart_item;
            $(cart()).each(function (index, item) {
                if (ko.toJSON(item.id) === ko.toJSON(productId)) {
                    cart_item = item;
                }
            });
            // not found from the shopping cart
            if (typeof cart_item === "undefined") {
                var product_item;
                $(allProduct()).each(function (index, item) {
                    if (ko.toJSON(item.id) === ko.toJSON(productId)) {
                        product_item = item;
                    }
                });
                if (typeof product_item !== "undefined") {
                    return product_item;
                }
            }
        };

        this.addToCart = function (item) {
            var cart_item;
            cart_item = item;
            cart_item.showAddCartBtn(false);
            cart_item.quantity(1);
            return cart_item;
        };

        this.createShipment = function (id, date, qty) {
            return new Shipment(id, date, qty);
        };

        this.allowCheckOut = function (cart) {
            var _cart = ko.utils.unwrapObservable(cart);
            if (typeof _cart === "undefined") {
                return false;
            } else {
                if (_cart.length > 0) {
                    return true;
                } else {
                    return false;
                }
            }
        };

        self.getOfflineKey = function () {
            var user = app.moduleConfig.params.rootContext.userProfile;
            // var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            // var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
            // var outletId = app.moduleConfig.params.rootContext.outLetId;
            // var key = constant.SAVED_ORDER_KEY + ":" + orgUnitId + ":" + ko.utils.unwrapObservable(customerProfile.id) + ":" + ko.utils.unwrapObservable(outletId);
            var key = constant.SAVED_ORDER_KEY + ":" + user.orgUnitId + ":" + user.erpSalesId + ":" + user.salesRole + ":" + user.username;
            return key;
        };

    }

    return new CartService();
});
