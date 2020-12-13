/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * stockSeach module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/appui','pages/stockInquiry/stockInquiryService', 'pages/common/constant', 'ojs/ojinputtext', 'ojs/ojjsontreedatasource'
], function (oj, ko, $, app, ui, service, constant) {
    /**
     * The view model for the main content view template
     */
    function StockSearchViewModel() {
        var self = this;
        
        self.handleActivated = function(info) {
            // // Implement if needed
            self.parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
            initTranslations();
        };
        
        var IO_ID;

        //******* by Ray, recent search starts

 
        //obtain the map from amplify and convert it into an array for the later use
        //self.recentItemCodes = $.map(amplify.store("recentItemCodes")||{}, function(value, index) {
        self.recentItemCodes = $.map(ui.getLocalStorage("recentItemCodes")||{}, function(value, index) {
                  return [value];
                });
        //self.recentItemCodes.push({label:"label", value:"value"});
        //******* recent search ends
        self.itemCode = ko.observableArray();
        self.ready = ko.observable(false);
        
        self.lot = ko.observableArray();
        self.disableLot = ko.observable(true);
//        self.disableLot = ko.computed(function(){
//            if (self.itemCode() && self.itemCode().length >=1) {
//              return false;
//            }else{
//              return true;
//            }
//        });

        //clear recent item code
        self.clearRecentItemCodes = function(data, event){
            //reset cache
            //amplify.store("recentItemCodes", null);
            ui.setLocalStorage("recentItemCodes", null);

            //set the array to empty array
            self.recentItemCodes = [];
            self.itemCodeSuggestions()[0].items = self.recentItemCodes;
            
            //force inputSearch to refresh
            $("#itemCodes").ojInputSearch('refresh');
        };

        self.lotSuggestions = ko.observableArray([{
            groupName: "Lot Suggestions",
            items: []
        }]);

        //setup Item Code Suggestions with recent Item Codes
        self.itemCodeSuggestions = ko.observableArray([{
            groupName: "Recent Item Codes",
            items: self.recentItemCodes
        }]);
    
        self.onClearSearchText = function () {
            self.clearSearch();
        };

        self.clearSearch = function () {
            var searchTextBox = $('#itemCodes');
            self.itemCode('');
            $('#oj-inputsearch-input-itemCodes').val('');
        };
        
        self.onSearchTextChange = function (event, data) {
            if (data.option === 'rawValue') {
                // self.itemCode(data.value);
            }
        };

        //debug
        //service.getItemLotMessage().then(self.cbGetItemLotSuccessFn);


        //obtain the itemcode list **** should be revamped when the actual list is available
        ui.showBusy();
        
        service.getPriceListMessage(getItemCodePayload()).then(function(response) {
        // data.getItemCodes().then(function(response) {
            try{
                var respJSON = response;
                if (typeof(response) === "string") {
                  respJSON = JSON.parse(response);
                };
                var result = respJSON.P_PRICE_LIST_TBL_ITEM;
                console.log("Prilce List length = " + result.length);
                result.forEach(function(e){
                    e.ITEM_CODE_DESCRIPTION = e.PRODUCT + "   " + e.PRODUCT_DESCRIPTION;
                    if(IO_ID) {} else {
                        IO_ID = e.ORGANIZATION_ID;
                    }
                });
                suggestionList = {};
                suggestionList.groupName = "Item Code Suggestions";
                suggestionList.items = result;
                self.itemCodeSuggestions.push(suggestionList);
                self.ready(true);
                
            }catch(e) {
                console.log(e);
            } 
            finally{
                ui.hideBusy();
            }
            
        });

        function cbGetItemLotSuccessFn (response, xhr){
            ui.hideBusy();
            if (response && xhr.status == 200) {
                console.log("cbGetItemLotSuccessFn success");
                var respJSON = response;
                if (typeof(response) === "string") {
                  respJSON = JSON.parse(response);
                };
                
                if(respJSON.P_ITEM_LOT_TBL && respJSON.P_ITEM_LOT_TBL.P_ITEM_LOT_TBL_ITEM) {
                    var result = respJSON.P_ITEM_LOT_TBL;
                    //self.lotSuggestions()[0].items = result.P_ITEM_LOT_TBL_ITEM;
                    //debug start
                     suggestionList = {};
                     suggestionList.groupName = "Lot Suggestions";
                     suggestionList.items = result.P_ITEM_LOT_TBL_ITEM;
                     self.lotSuggestions.splice(0,1,suggestionList);
                     self.disableLot(false);
                    //debug end
                    //force inputSearch to refresh
                    $("#lots").ojInputSearch('refresh');
                }
                
        }
          

        }
        function cbGetItemLotFailFn (response, xhr){
            console.log("cbGetItemLotFailFn called");
            ui.hideBusy();
        }


        self.updateEventHandler = function (context, listui) {
            //if itemcode box is empty, do nothing
            if (listui.value.length == 0) return;
            var user = app.moduleConfig.params.rootContext.userProfile;

            console.log("ITEM_CODE Value Changed: " + listui.value);
            var itemId = {"ITEM_ID": listui.value[0]};
            var payload = {
              "InputGetItemLot": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },                  
                  "P_ORG_ID" : IO_ID,
                  "P_ITEM_ID_TBL" : {"P_ITEM_ID_TBL_ITEM": new Array(itemId)}
              }
            };
            payload = JSON.stringify(payload);
            console.log(payload);
            ui.showBusy();
            service.getItemLotMessage(payload).then(cbGetItemLotSuccessFn, cbGetItemLotFailFn);
        };
        
        function getItemOnhandPayload(){
            var orgUnitId = IO_ID;
            var item_code = self.itemCode()[0];
            var user = app.moduleConfig.params.rootContext.userProfile;
            
            var payload = {
              "InputGetItemOnhandByItem": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },                  
                  "P_ORG_ID" : orgUnitId,
                  "P_ITEM_ID" : item_code
              }
            };
            
            console.log("getItemOnhand payload = " + JSON.stringify(payload));
            return JSON.stringify(payload);
        };

        function getItemCodePayload() {
            var user = app.moduleConfig.params.rootContext.userProfile;
            var orgUnitId = app.moduleConfig.params.rootContext.userProfile.orgUnitId;
            console.log("user =" + ko.toJSON(user));
            
            var priceListId;
            var priceListKeys = [];
            var P_PRICE_LIST_ID_TBL_ITEM = [];
            
            var user = app.moduleConfig.params.rootContext.userProfile;
            
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
            console.log(payload);
            return payload;
        };
        
        function isInt(x) {
            var regInteger = /^\d+$/;
            return regInteger.test(x);
        }

        self.buttonSearchClick = function(){
            //****** By Ray, recent search starts
            if (self.itemCode() && self.itemCode().length >= 1) {
                //get the value of inputSearch's current value (in array)
                var INVENTORY_ITEM_ID = self.itemCode()[0];
                if (!isInt(INVENTORY_ITEM_ID)) {
                    ui.showMessageBox(self.lng_noItemCodeSelected);
                    return;
                }

                //create cache entry
                // var item = {
                //   PRODUCT: ITEM_ID,
                //   value: ITEM_ID
                // };
                var item;
                var searchResult = $.grep(self.itemCodeSuggestions()[1].items, function(e){return e.INVENTORY_ITEM_ID == INVENTORY_ITEM_ID});
                if (searchResult.length > 0){
                  item = searchResult[0];
                }

                //obtain the current entries in cache
                //var itemCodes = amplify.store("recentItemCodes")||{};
                var itemCodes = ui.getLocalStorage("recentItemCodes")||{};

                //if no duplicates, put in cache and update recentItemCodes
                if  (! (itemCodes.hasOwnProperty(INVENTORY_ITEM_ID))){
                  itemCodes[INVENTORY_ITEM_ID] = item;
                  self.recentItemCodes = $.map(itemCodes, function(value, index) {
                    return [value];
                  });
                  console.log("before compression length: " + JSON.stringify(itemCodes).length);
                  //amplify.store("recentItemCodes", itemCodes);
                  ui.setLocalStorage("recentItemCodes", itemCodes);

                }
              
            }else{
                //if there is no search criteria, do nothing
                ui.showMessageBox("Please input search Criteria");
                return;
            }
            //******* recent search ends

            //search stock 
            ui.showBusy();
            
            service.getItemOnhandMessageByItem(getItemOnhandPayload()).then(function(response , xhr) {    
            //data.searchStock(self.itemCode(), self.lot()).then(function(response) {
                var rtnValue = searchItem(response , xhr);
                if (rtnValue != -1) {
                    self.parentRouter.go('stockList');
                }
                }, function(response, xhr){
                    ui.hideBusy();
            });
            
            function searchItem(response , xhr) {
                ui.hideBusy();
                var respJSON = response;
                if (typeof(response) === "string") {
                    respJSON = JSON.parse(response);
                }
                if(respJSON.P_ONHAND_TBL){
                    var result = respJSON.P_ONHAND_TBL.P_ONHAND_TBL_ITEM;
                    if (!$.isArray(result)) {
                        result = new Array(result);
                    }

                    //if nothing found, show dialog
                    if(result.length <= 0 ) {
                        ui.showMessageBox("No Stock Items Found");
                        return -1;
                    }
                    
                    var formatted = [];
                    var keys = [];

                    result.forEach(function(e){
//                        var key = {};
//                        key["P_ORG_ID"] = e.ORG_ID;
//                        key["P_ITEM_ID"] = e.ITEM_ID;
//                        key["P_ITEM_SUBINV"] = e.SUBINVENTORY;
//                        key["LOT"] = e.LOT;
//                        e.ID = key;
                        var warehouse = e.ORGANIZATION_NAME;
                        if(e.LOT <= 0) {
                            e.LOT = "";
                        }
                        if (keys.indexOf(warehouse) > -1) {
                            formatted[keys.indexOf(warehouse)].children.push({ "attr": {"id": e, "data": e }});
                        } else {
                            keys.push(warehouse);
                            formatted.push({
                                "attr": {"id": e, "warehouse": warehouse},
                                "children": [{ "attr": {"id": e, "data": e }}]
                            });
                        }
                    });
                    
                    // sort by warehouse
                    formatted.sort(function (a, b) {
                        return (a.attr.warehouse < b.attr.warehouse) ? 1 : (a.attr.warehouse > b.attr.warehouse) ? -1 : 0;
                    });

                    // sort by warehouse then refNo within each group
                    formatted.forEach(function (group) {
                        group.children.sort(function (a, b) {
                            // sort by parent
                            if (a.attr.ORGANIZATION_NAME < b.attr.ORGANIZATION_NAME) {
                                return 1;
                            } else if (a.attr.ORGANIZATION_NAME > b.attr.ORGANIZATION_NAME) {
                                return -1;
                            }

                            // else sort by item code
                            return (a.attr.DESCRIPTION < b.attr.DESCRIPTION) ? 1 : (a.attr.DESCRIPTION > b.attr.DESCRIPTION) ? -1 : 0;
                        });
                    });
                    var arrayDS = new oj.JsonTreeDataSource(formatted);
                    self.parentRouter.moduleConfig.params['stockSearchResult'] = arrayDS;
                    //window.alert(app.router.moduleConfig.params['stockSearchResult']);
                    console.log("parentRouter=" + self.parentRouter.currentState().value);
                } else {
                    ui.showMessageBox("No Stock Items Found");
                    return -1;
                }
            }
        };
        
        self.dispose = function(info) {
          //self.router.dispose();
        };
        
        self.onPageReady = function()  {
            
            $('#oj-inputsearch-input-itemCodes').focus(function() {
                setTimeout((function(el) {
                    var strLength = el.value.length;
                    return function() {
                        if(el.setSelectionRange !== undefined) {
                            el.setSelectionRange(0, 0);
                        } else {
                            $(el).val(el.value);
                        }
                }}(this)), 0);
              });
        }
        
        function initTranslations() {
            // language translations
            var getTranslation = oj.Translations.getTranslatedString;
            self.lng_stockInquiry = getTranslation("ssa.stockSearch.stockInquiry");
            self.lng_search = getTranslation("ssa.stockSearch.search");
            self.lng_clearRecent = getTranslation("ssa.stockSearch.clearRecent");
            self.lng_placeholderInputItemCode = getTranslation("ssa.stockSearch.inputItemCode");
            self.lng_noItemCodeSelected = getTranslation("ssa.stockSearch.noItemCodeSelected");
            self.lng_billingAddress = getTranslation("ssa.profile.billingAddress");
            self.lng_overdueAging = getTranslation("ssa.profile.overdueAging");
            self.lng_salesPerformance = getTranslation("ssa.profile.salesPerformance");
            self.lng_target = getTranslation("ssa.profile.target");
            self.lng_lastYearAndYTDPerformance = getTranslation("ssa.profile.lastYearAndYTDPerformance");
        }
    }
    

    return StockSearchViewModel;
});
