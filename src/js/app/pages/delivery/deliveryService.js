/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify', 'util/devmode', 'util/appui', 'pages/common/constant', 'util/commonhelper',  'appController'
], function (ko, $, module, amplify, devMode, ui, constant, commonHelper, app) {

    function DeliveryService() {
        
        // CLASS Delivery
        var Delivery = function(delivery_no, date, outletName, address, carPlateNumber, orderNumber, paymentTerm, documentType, loadedDate, confirmedDate) {
            this.delivery_no = ko.observable(delivery_no);
            this.deliveryDate = ko.observable(date);
            this.outletName = ko.observable(outletName);
            this.deliveryAddress = ko.observable(address);
            this.carPlateNumber = ko.observable(carPlateNumber);
            this.orderNumber = ko.observable(orderNumber);
            this.paymentTerm = ko.observable(paymentTerm);
            this.documentType = ko.observable(documentType);
            this.loadedDate = ko.observable(loadedDate);
            this.confirmedDate = ko.observable(confirmedDate);
        };
    
        this.createDelivery = function (delivery_no, date, outletName, address, carPlateNumber, orderNumber, paymentTerm, documentType, loadedDate, confirmedDate) {
            return new Delivery(delivery_no, date, outletName, address, carPlateNumber, orderNumber, paymentTerm, documentType, loadedDate, confirmedDate);
        };
        
        var Document = function(data) {
            this.documentType = ko.observable(data.DOCUMENT_TYPE);
            this.orgUnitId = ko.observable(data.ORG_UNIT_ID);
            this.delivery_no = ko.observable(data.DELIVERY_NUMBER);
            this.deliveryDate = ko.observable(data.DELIVERY_DATE);
            this.outletName = ko.observable(data.OUTLET_NUMBER);
            this.deliveryAddress = ko.observable(data.DELIVERY_ADDRESS);
            this.carPlateNumber = ko.observable(data.CAR_PLATE_NUMBER);
            this.orderNumber = ko.observable(data.ORDER_NUMBER);
            this.paymentTerm = ko.observable(data.PAYMENT_TERM); 
            this.deliveryDetail = ko.observableArray(data.P_SHIPMENT_DETAILS_TBL_ITEM);
            this.loadedDate = ko.observable(data.LOADED_DATE);
            this.confirmedDate = ko.observable(data.CONFIRMED_DATE);
        };
        
        this.createDocument = function (data) {
            return new Document(data);
        };
        
        // CLASS Delivery Item
        var DeliveryItem = function (data) {
            this.id = ko.observable(data.id);
            this.prod_desc = ko.observable(data.prod_desc);
            this.prod_code = ko.observable(data.prod_code);
            this.lot = ko.observable(data.lot);
            this.price = ko.observable(data.price);
            this.shipping_district = ko.observable(data.shipping_district);
        };
        
        this.createDeliveryItem = function (data) {
            return new DeliveryItem(data);
        };

        function getDeliveryHistMessage(payload, refresh) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var UserID = parser.InputGetShipmentListBySalesOrder.HeaderInfo.UserID;
            var UserRole = parser.InputGetShipmentListBySalesOrder.HeaderInfo.UserRole;
            var CallerID = parser.InputGetShipmentListBySalesOrder.HeaderInfo.CallerID;
            var P_ORG_ID = parser.InputGetShipmentListBySalesOrder.P_ORG_ID;
            var P_SO_NUMBER = parser.InputGetShipmentListBySalesOrder.P_SO_NUMBER;
            
            // define the key for local storage
            var key = constant.DELIVERY_LIST_KEY + ":" + UserID + ":" + UserRole + ":" 
                    + CallerID + ":" + P_ORG_ID + ":" + P_SO_NUMBER;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/delivery/deliveryMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Delivery List - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Delivery List - " + key);
                amplify.request({
                    resourceId: constant.DELIVERY_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of delivery list to local storage
                ui.setLocalStorage(key + ":" + constant.DELIVERY_LIST_SYNC_DATETIME, 
                    commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());                

                // store the delivery list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }

            return $.when(defer);
        };

        this.getDeliveryHistMessage = function (payload) {
            return getDeliveryHistMessage(payload, false);
        };
        
        this.refreshDeliveryHistMessage = function(payload) {
            return getDeliveryHistMessage(payload, true);
        };
        
        function getDeliveryByCarPlateMessage(payload, refresh) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var UserID = parser.InputGetShipmentListByCarPlate.HeaderInfo.UserID;
            var UserRole = parser.InputGetShipmentListByCarPlate.HeaderInfo.UserRole;
            var CallerID = parser.InputGetShipmentListByCarPlate.HeaderInfo.CallerID;
            var P_ORG_ID = parser.InputGetShipmentListByCarPlate.P_ORG_ID;
            var P_CP_NUMBER = parser.InputGetShipmentListByCarPlate.P_CP_NUMBER;
            
            // define the key for local storage
            var key = constant.DELIVERY_LIST_BY_CAR_PLATE_KEY + ":" + UserID + ":" + UserRole + ":" 
                    + CallerID + ":" + P_ORG_ID + ":" + P_CP_NUMBER;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/delivery/deliveryMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Delivery List by License No - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Delivery List by License No - " + key);
                amplify.request({
                    resourceId: constant.DELIVERY_LIST_BY_CAR_PLATE_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of delivery list to local storage
                ui.setLocalStorage(key + ":" + constant.DELIVERY_LIST_SYNC_DATETIME, 
                    commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());                

                // store the delivery list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }

            return $.when(defer);
        };

        this.getDeliveryByCarPlateMessage = function (payload) {
            return getDeliveryByCarPlateMessage(payload, false);
        };
        
        this.refreshDeliveryByCarPlateMessage = function (payload) {
            return getDeliveryByCarPlateMessage(payload, true);
        };        
        
        function getDeliveryItemMessage(payload) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var UserID = parser.InputGetShipmentDetails.HeaderInfo.UserID;
            var UserRole = parser.InputGetShipmentDetails.HeaderInfo.UserRole;
            var CallerID = parser.InputGetShipmentDetails.HeaderInfo.CallerID;
            var P_ORG_ID = parser.InputGetShipmentDetails.P_ORG_ID;
            var P_DELIVERY_NUM = parser.InputGetShipmentDetails.P_DELIVERY_NUM;
            
            // define the key for local storage
            var key = constant.DELIVERY_DETAIL_KEY + ":" + UserID + ":" + UserRole + ":" 
                    + CallerID + ":" + P_ORG_ID + ":" + P_DELIVERY_NUM;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/delivery/deliveryDetailMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            // var data = ui.getLocalStorage(key);
            // if (data) {
            //     console.log("[Local Storage] Delivery Detail - " + key);
            //     defer.resolve(data, {status:200});
            // } else {
                console.log("[Amplify Request] Delivery Detail - " + key);
                amplify.request({
                    resourceId: constant.DELIVERY_DETAIL_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the delivery detail to local storage by amplify
                // $.when(defer).done(function (d, textStatus, jqXHR) {
                //    ui.setLocalStorage(key, d);
                // });
            // }

            return $.when(defer);
        };

        this.getDeliveryItemMessage = function (payload) {
            return getDeliveryItemMessage(payload);
        };        
        
        function confirmDeliveryMessage(payload) {
            var defer = $.Deferred();

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/delivery/confirmDeliveryMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            amplify.request({
                resourceId: constant.CONFIRM_DELIVERY_KEY,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });            

            return $.when(defer);
        }
        
        this.confirmDeliveryMessage = function(payload) {
            return confirmDeliveryMessage(payload);
        };
        
        this.getOfflineKey = function () {
            var user = app.moduleConfig.params.rootContext.userProfile;
            var key = constant.SAVED_DELIVERY_KEY + ":" + user.orgUnitId + ":" + user.erpSalesId + ":" + user.salesRole + ":" + user.username + ":" + user.licenseNo;
            return key;
        };        
        
        this.payloadDelivery = function (selDelivery) {
            var payload = JSON.stringify({
                "DELIVERY_NUMBER": ko.utils.unwrapObservable(selDelivery.delivery_no),
                "OUTLET_NAME": ko.utils.unwrapObservable(selDelivery.outletName),
                "ORDER_NUMBER": ko.utils.unwrapObservable(selDelivery.orderNumber),
                "DELIVERY_ADDRESS": ko.utils.unwrapObservable(selDelivery.deliveryAddress),
                "DELIVERY_DATE": ko.utils.unwrapObservable(selDelivery.deliveryDate),
                "CAR_PLATE_NUMBER": ko.utils.unwrapObservable(selDelivery.carPlateNumber),
                "LOADED_DATE": ko.utils.unwarapObservable(selDelivery.loadedDate),
                "CONFIRMED_DATE": ko.utils.unwarapObservable(selDelivery.confirmedDate),
            });
            return ko.utils.parseJson(payload);
        };
        
        this.getConfirmGoodsLoadingPayload = function(orgUnitId, documentType, deliveryNo, allDeliveryItem, confirmType) {
            return getConfirmGoodsLoadingPayload(orgUnitId, documentType, deliveryNo, allDeliveryItem, confirmType);
        };
        
        function getConfirmGoodsLoadingPayload(orgUnitId, documentType, deliveryNo, allDeliveryItem, confirmType) {
            var P_SHIPMENT_DETAILS_TBL_ITEM = [];
            ko.utils.arrayForEach(allDeliveryItem, function(item) {
                if (confirmType == "FULL")  {
                    var amount = (item.UNIT_SELLING_PRICE * item.MAXQTY);
                    P_SHIPMENT_DETAILS_TBL_ITEM.push({QTY: item.MAXQTY, DELIVERY_DETAIL_ID: item.DELIVERY_DETAIL_ID, AMOUNT: amount});                    
                } else {
                    var amount = (item.UNIT_SELLING_PRICE * item.QTY);
                    P_SHIPMENT_DETAILS_TBL_ITEM.push({QTY: item.QTY, DELIVERY_DETAIL_ID: item.DELIVERY_DETAIL_ID, AMOUNT: amount});                    
                }
            });           
            
            var user = app.moduleConfig.params.rootContext.userProfile;
            var payload = JSON.stringify({
                    "InputDNRMAConfirmation": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_DOCUMENT_TYPE": documentType,      
                        "P_ORG_ID": orgUnitId,
                        "P_DELIVERY_NUM": deliveryNo,
                        "P_SHIPMENT_DETAILS_TBL": {"P_SHIPMENT_DETAILS_TBL_ITEM": P_SHIPMENT_DETAILS_TBL_ITEM}
                    }
                });
                
            return payload;
        }
        
        this.confirmGoodsLoadingMessage = function(payload) {
            return confirmGoodsLoadingMessage(payload);
        };
        
        function confirmGoodsLoadingMessage(payload) {
            var defer = $.Deferred();
            
            var key = constant.CONFIRM_GOODS_LOADING_KEY;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/delivery/confirmGoodsLoadingMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }            
            
            console.log("[Amplify Request] Confirm Goods Loading - " + key);
            amplify.request({
                resourceId: key,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });
                
            return $.when(defer);            
        }        

    }

    return new DeliveryService();
});