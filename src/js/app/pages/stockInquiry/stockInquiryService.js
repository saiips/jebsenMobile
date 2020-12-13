define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'amplify', 'appController', 'pages/common/constant'
], function (ko, $, ui, devMode, amplify, app, constant) {
    function StockInquiryService() {
        function getPriceListMessage(payload) {
            var defer = $.Deferred();

            var P_PRICE_LIST_TBL_ITEM = "getPriceList";

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetPriceList.P_ORG_ID;
            var P_PRICE_LIST_ID = parser.InputGetPriceList.P_PRICE_LIST_ID_TBL.P_PRICE_LIST_ID_TBL_ITEM[0].PRICE_LIST_ID;

            // define the key for local storage
            var key = constant.STANDARD_PRICE_LIST_KEY + ":" + P_ORG_ID + ":" + P_PRICE_LIST_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/newOrder/newOrderMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            var data = ui.getLocalStorage(key);
            if (data) {
                console.log("[Local Storage] Price List - " + key);
                defer.resolve(data, {status: 200});
            } else {
                console.log("[Amplify Request] Price List - " + key);
                amplify.request({
                    resourceId: P_PRICE_LIST_TBL_ITEM,
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

        this.getPriceListMessage = function (payload) {
            return getPriceListMessage(payload);
        };   		
        
        function getItemLotMessage(payload){
            var defer = $.Deferred();
            
            var P_ITEM_LOT_TBL = "getItemLot";
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetItemLot.P_ORG_ID;
            var ITEM_ID = parser.InputGetItemLot.P_ITEM_ID_TBL.P_ITEM_ID_TBL_ITEM[0].ITEM_ID;

            // define the key for local storage
            var key = P_ITEM_LOT_TBL + ":" + P_ORG_ID + ":" + ITEM_ID;

           // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/stockInquiry/itemLotMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
  
            console.log("[Amplify Request] Item Lot - " + key);
            amplify.request({
                resourceId: P_ITEM_LOT_TBL,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        };
		
        this.getItemLotMessage = function(payload){
            return getItemLotMessage(payload);
        };

        function getItemOnhandMessageByItem(payload){
            var defer = $.Deferred();
            
            var P_ONHAND_TBL = "getItemOnHandByItem";
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetItemOnhandByItem.P_ORG_ID;
            var P_ITEM_ID = parser.InputGetItemOnhandByItem.P_ITEM_ID;

            // define the key for local storage
            var key = P_ONHAND_TBL + ":" + P_ORG_ID + ":" + P_ITEM_ID;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
            	var parser = ko.utils.parseJson(payload);
            	var mockDataPath = "js/app/pages/stockInquiry/";
            	if (parser.InputGetItemOnhandByItemLot) {
            		mockDataPath = mockDataPath + "itemOnhandByItemLotMock.json";
            	}else{
            		mockDataPath = mockDataPath + "itemOnhandByItemMock.json";
            	}

                $.getJSON(mockDataPath, function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Item Lot - " + key);
            amplify.request({
                resourceId: P_ONHAND_TBL,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        };
        
        this.getItemOnhandMessageByItem = function(payload){
                return getItemOnhandMessageByItem(payload);
        };
        
        function getItemOnhandMessageByItemLot(payload){
            var defer = $.Deferred();
            
            var P_ONHAND_TBL = "getItemOnHandByItemLot";
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetItemOnhandByItemLot.P_ORG_ID;
            var P_ITEM_ID = parser.InputGetItemOnhandByItemLot.P_ITEM_ID;
            var P_ITEM_LOT = parser.InputGetItemOnhandByItemLot.P_ITEM_LOT;
            
            // define the key for local storage
            var key = P_ONHAND_TBL + ":" + P_ORG_ID + ":" + P_ITEM_ID + ":" + P_ITEM_LOT;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
            	var parser = ko.utils.parseJson(payload);
            	var mockDataPath = "js/app/pages/stockInquiry/";
            	if (parser.InputGetItemOnhandByItemLot) {
            		mockDataPath = mockDataPath + "itemOnhandByItemLotMock.json";
            	}else{
            		mockDataPath = mockDataPath + "itemOnhandByItemMock.json";
            	}

                $.getJSON(mockDataPath, function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }

            console.log("[Amplify Request] Item Lot - " + key);
            amplify.request({
                resourceId: P_ONHAND_TBL,
                success: defer.resolve,
                error: defer.reject,
                data: payload
            });

            return $.when(defer);
        };
        
        this.getItemOnhandMessageByItemLot = function(payload){
                return getItemOnhandMessageByItemLot(payload);
        };
    }
    return new StockInquiryService();
});