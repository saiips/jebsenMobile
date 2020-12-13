/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/devmode', 'util/appui', 'appController', 'pages/common/constant', 'pages/common/cartService', 'pages/checkOut/checkOutService', 'util/commonhelper', 'pages/customer/customerService', 'pages/delivery/deliveryService',
    'promise', 'ojs/ojlistview', 'ojs/ojjsontreedatasource', 'ojs/ojpagingcontrol', 'ojs/ojnavigationlist',
    'ojs/ojrouter', 'ojs/ojtoolbar', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber',
    'ojs/ojarraytabledatasource', 'ojs/ojpulltorefresh', 'ojs/ojvalidation'
], function (ko, $, devMode, ui, app, constant, cartService, service, commonHelper, customerService, deliveryService) {

    function DataSyncViewModel() {
        var self = this;

        self.ready = ko.observable(false);

        self.targetCart = ko.observableArray();

        self.allOrders = ko.observableArray();
        
        self.processCases = ko.observable(0);
        self.failedOrders = ko.observableArray(); 
        self.failedDelivery = ko.observableArray();
        self.scrollPos = ko.observable(0);

        self.isVanSales = ko.computed(function () {
            var salesRole = app.moduleConfig.params.rootContext.userProfile.salesRole;
            if (salesRole == constant.SR_SALE_VAN)
                return true;
            return false;
        });

        self.handleActivated = function (info) {
            console.log("handleActivated");
            init();
        };

        // handler for drill in to check out page
        self.optionChange = function (event, ui) {
            if (ui.option === 'selection' && ui.value[0]) {
                console.log("ui.value =" + ko.toJSON(ui.value[0]));
                
                var foundItem = ko.utils.arrayFirst(self.allOrders(), function(item) {
                    if (item.id == ui.value[0]) return item;
                });
                console.log("foundItem =" + ko.toJSON(foundItem));
              
                var delivery = foundItem.data.delivery;
                console.log("delivery = "+ delivery);
                // sales order
                if (delivery == "N") {
                    // populate the customer profile
                    var data = foundItem.data.order;
                    var orderLine = foundItem.data.orderdetail;
                    console.log("payload =" + ko.toJSON(data));
                    var customerProfile = prepareCustomerProfile(data);
                    console.log("customerProfile=" + ko.toJSON(customerProfile));
                    
                    // populate the order
                    var order = cartService.createOrder(data);
                    cartService.setOrder(order);        
                    
                    // populate the order line item
                    app.moduleConfig.params.rootContext.originalCart = ko.observableArray();
                    var orderLine = foundItem.data.orderdetail;
                    var orderLineLength = orderLine.length;
                    for (var index = 0; index < orderLineLength; index++) {
                        var orderedQuantity = orderLine[index]['ORDERED_QUANTITY'];
                        var originalLine = orderLine[index]['ORIGINAL_LINE'];
                        var subInventory = orderLine[index]['SUBINVENTORY'];
                        
                        if (Array.isArray(subInventory) && subInventory) {
                            subInventory = subInventory[0];
                        }
                        var shippingMethod = orderLine[index]['SHIPPING_METHOD'];
                        if (Array.isArray(shippingMethod) && shippingMethod) {
                            shippingMethod = shippingMethod[0];
                        }                        
                        var shipDate = orderLine[index]['SCHEDULE_SHIP_DATE'];
                        
                        if (!commonHelper.isValid(shipDate) || !shipDate) {
                            shipDate = commonHelper.getClientCurrentDate();
                        }
                        
                        var cartItem = cartService.createCartItem(orderLine[index], orderedQuantity, true, shipDate, originalLine, new Array(), subInventory, shippingMethod);
                        app.moduleConfig.params.rootContext.originalCart.push(cartItem);
                    }

                    // redirect to checkOut page with those required parameters;
                    app.moduleConfig.params.rootContext.selCustomerProfile = customerProfile;
                    app.moduleConfig.params.rootContext.custId = ko.utils.unwrapObservable(customerProfile.id);
                    app.moduleConfig.params.rootContext.fromPage = "dataSync";
                    app.moduleConfig.params.rootContext.savedOrder = ko.toJS({status: "P", data: data});
                    app.moduleConfig.params.rootContext.savedOrderLine = ko.toJS({data: orderLine});
                    app.moduleConfig.params.rootContext.outLetId = ko.utils.unwrapObservable(customerProfile.shipToSiteId);
                    // app.redirect("checkOut",  ko.utils.unwrapObservable(customerProfile.id));    
                    app.moduleConfig.params.rootContext.isReOrder = false;
                    app.moduleConfig.params.rootContext.isDailyOrderSummary = false;
                    app.moduleConfig.params.rootContext.isDataSync = true;
                    app.redirect("orderDetail", ko.utils.unwrapObservable(order.oe_header_id));
                }
                
                // confirm delivery
                if (delivery == "Y") {
                    var data = foundItem.data.order;
                    var selDelivery = deliveryService.createDelivery(data.DELIVERY_NUMBER, data.DELIVERY_DATE, data.OUTLET_NAME, data.DELIVERY_ADDRESS, data.CAR_PLATE_NUMBER, data.ORDER_NUMBER, data.PAYMENT_TERM, data.DOCUMENT_TYPE);
                    app.moduleConfig.params.rootContext.selDeliveryProfile = selDelivery;
                    app.moduleConfig.params.rootContext.fromPage = "dataSync";
                    app.moduleConfig.params.rootContext.savedOrder = ko.toJS({status: "P", data: data});                    
                    app.redirect("deliveryDetail", data.DELIVERY_NUMBER);
                }
            }
        };

        function prepareCustomerProfile(data) {
            var customerProfile = customerService.createCustomerProfile(data);
            return customerProfile;
        }
        
        self.clearData = function() {
            if (confirm(self.lng_confirmClear)) {
                var salesOrderKey = cartService.getOfflineKey();
                ui.setLocalStorage(salesOrderKey, null);

                var deliveryKey = deliveryService.getOfflineKey();
                ui.setLocalStorage(deliveryKey, null);

                var formatted = [];
                self.allOrders(formatted);
            }
        };

        self.dataSync = function () {
            console.log("dataSync clicked");
            try {
                var isOnline = checkNetwork();
                if (!isOnline) {
                    ui.showMessageBox(self.lng_ERROR_00005);
                } else {
                    if (confirm(self.lng_confirmSync)) {
                        // reset
                        self.processCases(0);
                        self.failedOrders.removeAll();
                        self.failedDelivery.removeAll();
                        // data offline for sales order
                        var rtnSalesOrder = dataSyncSalesOrder();
                        console.log("rtnSalesOrder=" + rtnSalesOrder);
                        // data offline for delivery
                        var rtnDelivery = dataSyncDelivery();
                        console.log("rtnDelivery=" + rtnDelivery);
                        
                        var timer = setInterval(function () {
                            if (self.processCases() == (rtnSalesOrder + rtnDelivery)) {
                                var message = "";
                                
                                var foundErrorOrder = false;
                                var messageOrder = "";
                                ko.utils.arrayForEach(self.failedOrders(), function (item) {
                                    foundErrorOrder = true;
                                    if (messageOrder.length > 0) messageOrder = messageOrder + ",";
                                    messageOrder += item.ORDER_NUMBER;
                                });
                                if (messageOrder.length > 0) messageOrder = "Order " + messageOrder;
                                
                                var foundErrorDelivery = false;
                                var messageDelivery = "";
                                ko.utils.arrayForEach(self.failedDelivery(), function (item) {
                                    foundErrorDelivery = true;
                                    if (messageDelivery.length > 0) messageDelivery = messageDelivery + ",";
                                    messageDelivery += item.DELIVERY_NUMBER;
                                });             
                                if (messageDelivery.length > 0) messageDelivery = "Delivery " + messageDelivery;
                                
                                if (foundErrorOrder || foundErrorDelivery) {
                                    message =  self.lng_allDataReceived + "<br><br>" + self.lng_ERROR_00020 + "<br>" + messageOrder + "<br>" + messageDelivery;
                                }
                                if (!foundErrorOrder && !foundErrorDelivery) {
                                    message = self.lng_allDataReceived;
                                }
                                if (self.processCases() > 0) {
                                    ui.showMessageBox('', message);
                                }
                                // stop the timer
                                clearTimeout(timer);
                            }
                        }, 1500);
                        
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        
        function dataSyncDelivery() {
            // data offline of delivery
            var salesOrderKey = deliveryService.getOfflineKey();
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/dataSync/dataSyncDeliveryMock.json", function (data) {
                    ui.setLocalStorage(salesOrderKey, data);
                });
            }      
            
            var dataJSON = ui.getLocalStorage(salesOrderKey);
            console.log("dataJSON = " + ko.toJSON(dataJSON));
            var dataLength = 0;
            
            if (typeof dataJSON === "undefined") return 0;
            
            if (typeof dataJSON !== "undefined") {
                if (!Array.isArray(dataJSON)) {
                    dataJSON = ko.utils.unwrapObservable(dataJSON);
                }
                if (dataJSON.length == 0) {
                    return 0;
                }
                dataLength =  dataJSON['data'].length;
                if (dataJSON && dataLength > 0) {
                    var data = dataJSON['data'].pop();
                    while (data) {
                        prepareDeliveryUI(dataJSON['data'], data);
                        data = dataJSON['data'].pop();
                    }
                }
            }
            
            return dataLength;
        }
        
        function dataSyncSalesOrder() {
            // data offline of sales order
            var salesOrderKey = cartService.getOfflineKey();

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/dataSync/dataSyncSalesOrderMock.json", function (data) {
                    ui.setLocalStorage(salesOrderKey, data);
                });
            }

            var dataJSON = ui.getLocalStorage(salesOrderKey);
            console.log("dataJSON = " + ko.toJSON(dataJSON));
            var dataLength = 0;
            
            if (typeof dataJSON === "undefined") return 0;

            if (typeof dataJSON !== "undefined") {
                if (!Array.isArray(dataJSON)) {
                    dataJSON = ko.utils.unwrapObservable(dataJSON);
                }
                if (dataJSON.length == 0) {
                    return 0;
                }
                dataLength = dataJSON['data'].length;
                if (dataJSON && dataLength > 0) {
                    var data = dataJSON['data'].pop();
                    while (data) {
                        prepareUI(dataJSON['data'], data);
                        data = dataJSON['data'].pop();
                    }
                }
            }
            
            return dataLength;
        }


        function prepareUI(db, data) {
            ui.showBusy();
            var user = app.moduleConfig.params.rootContext.userProfile;
            var orderNo = data['order']['ORDER_NUMBER'];
            var orderDtlJSON = data['orderdetail'];
            var orderJSON = data['order'];
            var draughtBeerFlagJSON = data['draughtBeerFlag'];
            
            var reqName;
            var resName;
            if (user.orgUnitId == constant.ORG_UNIT_ID_WINE) {
                reqName = "createWineOrderService";
                resName = "OutputCreateWineOrder";
            } else {
                reqName = "createBeerOrderService";
                resName = "OutputCreateBeerOrder";
            }
            
            // reset target cart
            self.targetCart.removeAll();

            // order detail - add to the cart array
            ko.utils.arrayMap(orderDtlJSON, function (item) {
                var cart_item = cartService.createCartItem(item, item.ORDERED_QUANTITY, true, item.SCHEDULE_SHIP_DATE, item.ORIGINAL_LINE, new Array(), item.SUBINVENTORY, item.SHIPPING_METHOD);
                self.targetCart.push(cart_item);
            });
            
            // to consturct the map for draught beer
            var subInventoryMap = {};
            ko.utils.arrayMap(draughtBeerFlagJSON, function (item) {
                subInventoryMap[item.subInventoryCode] = item.dBeerFlag;
            });
            app.moduleConfig.params.rootContext.subInventoryMap = subInventoryMap;

            var payload = preparePayload4Create(orderJSON);
            console.log("payload = " + ko.toJS(payload));

            // create  sales order
            var cbSuccessFn = function (data, xhr) {
                try {
                    console.log("raw data returned = " + ko.toJSON(data));
                    var procceed = true;
                    var respJSON = data[resName];

                     if (respJSON['ReturnStatus'] != "S" && respJSON['ReturnStatus'] != "W" ) {
                        self.failedOrders.push({"ORDER_NUMBER": orderNo, "RETURN_STATUS": respJSON['ReturnStatus'], "RETURN_MESSAGE": respJSON['ReturnMessage']});
                        // ui.showMessageBox("The order " + orderNo + " cannot be processed. " + respJSON['ReturnMessage']);
                        procceed = false;
                    }

                    if (procceed) {
                        // update the UI
                        var foundItem = ko.utils.arrayFirst(self.allOrders(), function (item) {
                            if (ko.utils.unwrapObservable(item.data.order.ORDER_NUMBER) == orderNo) {
                                return item;
                            }
                        });
                        console.log("foundItem=" + ko.toJSON(foundItem));
                        self.allOrders.remove(foundItem);

                        // update the localStorage
                        updateDb(db, cartService.getOfflineKey());

                        // ui.showMessageBox("The  order " + orderNo + " is received and being processed. You will receive an notification when the transaction is completed.");
                    }

                } catch (e) {
                    console.error(e);
                    ui.hideBusy();
                    self.failedOrders.push({"ORDER_NUMBER": orderNo, "RETURN_STATUS": 'E', "RETURN_MESSAGE": 'Cannot be processed. Please contact the System Administrator.'});
                    // ui.showMessageBox("The order " + orderNo + " cannot be processed. Please re-try it later.");

                } finally {
                    ui.hideBusy();
                    self.processCases(self.processCases() + 1);
                    console.log("cbSuccessFn called");

                }
            };
            var cbFailFn = function (data, xhr) {
                console.log("cbFailFn failed");
                ui.hideBusy();
                // ui.showMessageBox("The order " + orderNo + " cannot be processed. Please re-try it later.");
                self.processCases(self.processCases() + 1);
                self.failedOrders.push({"ORDER_NUMBER": orderNo, "RETURN_STATUS": 'E', "RETURN_MESSAGE": 'Cannot be processed. Please contact the System Administrator.'});
            };
            service.createSalesOrderMessage(payload, reqName).then(cbSuccessFn, cbFailFn);
        }
        
        
        function prepareConfirmDeliveryPayload(deliveryNumber, orderDtlJSON) {
            var user = app.moduleConfig.params.rootContext.userProfile;

            var P_SHIPMENT_DETAILS_TBL_ITEM = [];
            ko.utils.arrayForEach(orderDtlJSON, function(item) {
                P_SHIPMENT_DETAILS_TBL_ITEM.push({QTY: item.QTY, DELIVERY_DETAIL_ID: item.DELIVERY_DETAIL_ID});
            });

            var payload = JSON.stringify({
                    "InputShipConfirm": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_ORG_ID": user.orgUnitId,
                        "P_DELIVERY_ID": deliveryNumber,
                        "P_SHIPMENT_DETAILS_TBL": {"P_SHIPMENT_DETAILS_TBL_ITEM": P_SHIPMENT_DETAILS_TBL_ITEM}
                    }                    
            });

            return payload;
        }        
        
        function prepareDeliveryUI(db, data) {
            ui.showBusy();
            var orderNo = data['order']['ORDER_NUMBER'];
            var deliveryNo = data['order']['DELIVERY_NUMBER'];
            var orderDtlJSON = data['orderdetail'];
            var orderJSON = data['order'];
            
            var resName = "OutputShipConfirm";

            var payload = prepareConfirmDeliveryPayload(deliveryNo, orderDtlJSON);
            console.log("payload = " + ko.toJS(payload));

            // create  sales order
            var cbSuccessFn = function (data, xhr) {
                try {
                    console.log("raw data returned = " + ko.toJSON(data));
                    var procceed = true;
                    var respJSON = data[resName];

                    if (respJSON['ReturnStatus'] != "S" && respJSON['ReturnStatus'] != "W" ) {
                        // ui.showMessageBox("The delivery number " + deliveryNo + " cannot be processed. " + respJSON['ReturnMessage']);
                        self.failedDelivery.push({"DELIVERY_NUMBER": deliveryNo, "RETURN_STATUS": respJSON['ReturnStatus'], "RETURN_MESSAGE": respJSON['ReturnMessage']});
                        procceed = false;
                    }

                    if (procceed) {
                        // update the UI
                        var foundItem = ko.utils.arrayFirst(self.allOrders(), function (item) {
                            if (ko.utils.unwrapObservable(item.data.order.DELIVERY_NUMBER) == deliveryNo) {
                                return item;
                            }
                        });
                        self.allOrders.remove(foundItem);

                        // update the localStorage
                        updateDb(db, deliveryService.getOfflineKey());

                        // ui.showMessageBox("The  delivery number " + deliveryNo + " is received and being processed.");
                    }

                } catch (e) {
                    console.error(e);
                    ui.hideBusy();
                    // ui.showMessageBox("The delivery number  " + deliveryNo + " cannot be processed. Please re-try it later.");
                    self.failedDelivery.push({"DELIVERY_NUMBER": deliveryNo, "RETURN_STATUS": respJSON['ReturnStatus'], "RETURN_MESSAGE": 'Cannot be processed. Please contact the System Administrator.'});

                } finally {
                    ui.hideBusy();
                    self.processCases(self.processCases()+1);
                    console.log("cbSuccessFn called");

                }
            };
            var cbFailFn = function (data, xhr) {
                console.log("cbFailFn failed");
                ui.hideBusy();
                 self.processCases(self.processCases()+1);
                // ui.showMessageBox("The order " + orderNo + " cannot be processed. Please re-try it later.");
                self.failedDelivery.push({"DELIVERY_NUMBER": deliveryNo, "RETURN_STATUS": respJSON['ReturnStatus'], "RETURN_MESSAGE": 'Cannot be processed. Please contact the System Administrator.'});
            };
            deliveryService.confirmDeliveryMessage(payload).then(cbSuccessFn, cbFailFn);
        }        

        function updateDb(data, key) {
            ui.setLocalStorage(key, data);
        }

        function checkNetwork() {
            var isOnline = app.moduleConfig.params.rootContext.isOnline;
            if (typeof isOnline === "undefined") {
                isOnline = deviceReady.isOnline();
            }
            return isOnline;
        }

        function preparePayload4Create(data) {
            // get the payload for create sales order
            var newOrder = prepareOrder(data);
            
            // to cater the override delivery schedule
            var overrideShipmentDate = data.OVERRIDE_SHIPMENT_DATE;
            var overrideSubInventory = data.OVERRIDE_SUB_INVENTORY;
            var overrideShipmentMethod = data.OVERRIDE_SHIPMENT_METHOD;  
            
            // cater the override bill to and sales person
            var overrideBillToSiteId = data.OVERRIDE_BILL_TO;
            var overrideSalesRepId = data.OVERRIDE_SALES_PERSON;
            if (overrideBillToSiteId) {
                newOrder.invoice_to_org_id(overrideBillToSiteId);
            }
            if (overrideSalesRepId) {
                newOrder.sales_rep_id(overrideSalesRepId);
            }
            
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                return service.getCreateWineOrderPayload(newOrder, self.targetCart, overrideShipmentDate, overrideSubInventory, overrideShipmentMethod);
            } else {
                return service.getCreateBeerOrderPayload(newOrder, self.targetCart, overrideShipmentDate, overrideSubInventory, overrideShipmentMethod);
            }
        }

        function prepareOrder(data) {
            var userProfile = app.moduleConfig.params.rootContext.userProfile;
            // get the payload for validate sales order
            var newOrder = cartService.createOrder(data);
            newOrder.sold_from_org_id(userProfile.orgUnitId);
            newOrder.ship_from_org_id(getShipFromOrgId(userProfile.orgUnitId));
            newOrder.sales_rep_id(userProfile.erpSalesId);
            return newOrder;
        }

        function getShipFromOrgId(orgUnitId) {
            if (orgUnitId == constant.ORG_UNIT_ID_WINE) {
                return constant.SHIP_FROM_ORG_ID_2922;
            } else if (orgUnitId == constant.ORG_UNIT_ID_BEER) {
                return constant.SHIP_FROM_ORG_ID_2920;
            }
        }


        function init() {
            console.log("init");
            
            self.scrollPos(0);
            
            ui.showBusy();
            
            var salesOrderKey = cartService.getOfflineKey();
            console.log("salesOrderKey=" + salesOrderKey);
            
            var deliveryKey = deliveryService.getOfflineKey();
            console.log("deliveryKey=" + deliveryKey);

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/dataSync/dataSyncSalesOrderMock.json", function (data) {
                    ui.setLocalStorage(salesOrderKey, data);
                });
                $.getJSON("js/app/pages/dataSync/dataSyncDeliveryMock.json", function (data) {
                    ui.setLocalStorage(deliveryKey, data);
                });                
            }
            
            // re-construct the stored payload with Sales Order and Delivery
            var storedPayload = new Array();
            // stored payload from sales order
            var salesOrderStoredPayload = ui.getLocalStorage(salesOrderKey);
            console.log("salesOrderStoredPayload =" + ko.toJSON(salesOrderStoredPayload));
            if (salesOrderStoredPayload) {
                salesOrderStoredPayload = salesOrderStoredPayload['data'];
                ko.utils.arrayMap(salesOrderStoredPayload, function (item) {
                    storedPayload.push(item);
                });
            }

            // stored payload from delivery
            var user = app.moduleConfig.params.rootContext.userProfile;
            if (user.salesRole == "VS") {
                var deliveryStoredPayload = ui.getLocalStorage(deliveryKey);
                console.log("deliveryStoredPayload =" + ko.toJSON(deliveryStoredPayload));
                if (deliveryStoredPayload) {
                    deliveryStoredPayload = deliveryStoredPayload['data'];
                    ko.utils.arrayMap(deliveryStoredPayload, function (item) {
                        storedPayload.push(item);
                    });
                }
            }

            storedPayload = ko.toJS({data: storedPayload});
            console.log("storedPayload= " + ko.toJSON(storedPayload['data']));
            if (storedPayload && storedPayload['data']) {
                var dataJSON = storedPayload['data'];
                console.log("dataJSON = " + ko.toJSON(dataJSON));
                var dataLength = dataJSON.length;

                if (typeof dataJSON !== "undefined") {
                    if (!Array.isArray(dataJSON)) {
                        dataJSON = ko.utils.unwrapObservable(dataJSON);
                    }
                    if (dataJSON.length == 0) {
                        ui.hideBusy();
                    }
                    
                    var order = app.moduleConfig.params.rootContext.savedOrder;
                    console.log("order in dataSync = " + ko.toJSON(order));
                    if (order && (order.status == 'S' || order.status == 'D')) {
                        if (dataJSON && dataLength > 0) {

                            if (!ko.isObservable(dataJSON)) {
                                dataJSON = ko.observableArray(dataJSON);
                            }

                            var foundItem = ko.utils.arrayFirst(dataJSON(), function (item) {
                                if (item.delivery == "N" && item.order.ORDER_NUMBER == order.data.ORDER_NUMBER)
                                    return item;
                                if (item.delivery == "Y" && item.order.DELIVERY_NUMBER == order.data.DELIVERY_NUMBER)                                
                                    return item;
                            });
                            console.log("foundItem =" + ko.toJSON(foundItem));

                            dataJSON.remove(foundItem);
                            console.log("dataJSON =" + ko.toJSON(dataJSON));
                            
                            var key;
                            if (foundItem.delivery == "Y") {
                                key = deliveryService.getOfflineKey();
                            } else {
                                key = cartService.getOfflineKey();
                            }
                            
                            if (ko.isObservable(dataJSON)) {
                                dataJSON = ko.utils.unwrapObservable(dataJSON);
                                if (dataJSON.length == 0) {
                                    updateDb(null, key);
                                    app.moduleConfig.params.rootContext.savedOrder = "undefined";
                                } else {
                                    updateDb(ko.toJS({data: dataJSON}), key);
                                    app.moduleConfig.params.rootContext.savedOrder = "undefined";
                                }
                            }
                        }
                    }
                    
                    if (dataJSON && dataLength > 0) {
                        dataSort(dataJSON);
                    }
                }
            }
            
            initTranslations();

            ui.hideBusy();
            self.ready(true);
        }

        self.orders = ko.computed(function () {
            return new oj.ArrayTableDataSource(self.allOrders(), {idAttribute: 'id'});
        });

        function dataSort(data) {
            var respJSON = data;
            var formatted = [];
            console.log("dataSort (data)  =" + ko.toJSON(data));
            
            var index = respJSON.length;

            // format data for indexer groups
            for (var i = 0; i < respJSON.length; i++) {
                var deliveryFlag = 'N';
                var orderNumber, orderDate;

                try {
                    deliveryFlag = respJSON[i]['delivery'];
                } catch (ex) {
                }
                console.log("deliveryFlag = " + deliveryFlag);

                if (deliveryFlag == "Y") {
                    orderNumber = respJSON[i]['order']['DELIVERY_NUMBER'];
                    orderDate = respJSON[i]['order']['DELIVERY_DATE'];
                } else {
                    orderNumber = respJSON[i]['order']['ORDER_NUMBER'];
                    orderDate = respJSON[i]['order']['ORDERED_DATE'];
                }
                
                // sort by record index (First In, Frist Out Principal)
                formatted.push({"id": index, "data": respJSON[i]});
                index--;
            }

            console.log("formatted = " + ko.toJSON(formatted));
            self.allOrders(formatted);
        }
        
        function initTranslations() {
            // language translations
            var getTranslation = oj.Translations.getTranslatedString;
            self.lng_synchronization = getTranslation("ssa.dataSync.synchronization");
            self.lng_order = getTranslation("ssa.dataSync.order");
            self.lng_orderDate = getTranslation("ssa.dataSync.orderDate");
            self.lng_totalAmount = getTranslation("ssa.dataSync.totalAmount");
            self.lng_confirmClear = getTranslation("ssa.dataSync.confirmClear");
            self.lng_confirmSync = getTranslation("ssa.dataSync.confirmSync");
            self.lng_allDataReceived = getTranslation("ssa.msg.info.allDataReceived");
            self.lng_ERROR_00005 = getTranslation("ssa.msg.error.ERROR_00005");
            self.lng_ERROR_00020 = getTranslation("ssa.msg.error.ERROR_00020");
        }

    }


    return DataSyncViewModel;

});
