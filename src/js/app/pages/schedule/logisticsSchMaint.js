define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/appui', 'pages/schedule/scheduleService', 'pages/common/constant', 'util/commonhelper', 'pages/common/maintenance',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojdatetimepicker',
    'ojs/ojlistview', 'ojs/ojmodel', 'ojs/ojpagingcontrol', 'ojs/ojpagingcontrol-model','ojs/ojdialog', 'ojs/ojnavigationlist',
    'ojs/ojtable', 'ojs/ojdatacollection-utils', 'ojs/ojarraytabledatasource', 'ojs/ojdatasource-common', 'promise'],
    function (oj, ko, $, app, ui, service, constant, commonHelper, maintenance) {

        
        function LogisticsScheduleViewModel() {
            var self = this;
            
            console.log("LogisticsScheduleViewModel");
            
            var RESPONSE_TABLE = "P_TABLE";
            
            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            self.serviceProvider = ko.observable();
            self.availableServiceProvider = ko.observableArray();
            self.availableRouteList = ko.observableArray();
            self.availableRouteFullList = ko.observableArray();
            self.availableDistrict = ko.observableArray();
            self.availabvleSubInvCode = ko.observableArray();
            self.availableDOWList = ko.observableArray();
            self.availableShipMethod = ko.observableArray();
            self.route = ko.observable();
            self.district = ko.observable();
            self.isFocused = ko.observable(false);
            self.allLoaded = ko.observableArray();
            self.deleted = ko.observableArray();
            self.scrollPos = ko.observable(0);
            self.ready = ko.observable(false);
            
            self.dataFormat = ko.observable("dd/MM/yyyy");
            var dateConverterFactory = oj.Validation.converterFactory("datetime");
            self.dateConverter = dateConverterFactory.createConverter({
                pattern: self.dataFormat()
            });
            
            
            self.handleActivated = function (info) {
                var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                console.log("logisticsSchMaint.js parentRouter=" + parentRouter.currentState().value);
                self.scrollPos(0);
                
                var childRouter = parentRouter.getChildRouter("logisticsSchMaint");
                if (!childRouter) {
                    childRouter = parentRouter.createChildRouter('logisticsSchMaint');
                }      
                self.router = childRouter.configure(function (stateId) {
                    if (stateId) {
                        var state = new oj.RouterState(stateId, {value: stateId,
                            enter: function () {
                                console.log("logisticsSchMaint.js stateId=" + stateId);
                            }
                        });
                        return state;
                    }
                });   
                
                init();

                return oj.Router.sync();
            };
            
            self.handleBindingsApplied = function (info) {
            };

            function init() {
                console.log("logisticsSchMaint init(): started");
                ui.showBusy();
                
                initTranslations();
                getDefaultCriteria();
                populateDOWList();
                
                // reset
                self.allLoaded.removeAll();
                self.deleted.removeAll();
                
                // populate LOV Service
                var payload = getLOVServicePayload();
                console.log("LOV Service Payload =" + payload);
                service.getLOVMessage(payload).then(function(data) {
                    ////////////////////////////////////
                    // Service Provider
                    ////////////////////////////////////
                    try {
                        var spJSON = data["P_SERVICE_PROVIDER"]["P_SERVICE_PROVIDER_ITEM"];
                        if (spJSON) {
                            if (!Array.isArray(spJSON)) spJSON = new Array(spJSON);
                            if (self.availableServiceProvider().length <= 0) {
                                self.availableServiceProvider.push(ko.toJS({value: "-1", label: ""}));
                                ko.utils.arrayForEach(spJSON, function (item) {
                                    self.availableServiceProvider.push(ko.toJS({value: item.LOOKUP_VALUE, label: item.LOOKUP_VALUE}));
                                });
                            }
                        }
                    } catch (ex){
                    }
                    
                    ////////////////////////////////////
                    // Ship Method
                    ////////////////////////////////////
                    try {
                        var smJSON = data["P_SHIPPING_METHOD"]["P_SERVICE_PROVIDER_ITEM"];                        
                        if (smJSON) {
                            if (!Array.isArray(smJSON)) smJSON = new Array(smJSON);
                            if (self.availableShipMethod().length <= 0) {
                                self.availableShipMethod.push(ko.toJS({value: "-1", label: ""}));
                                ko.utils.arrayForEach(smJSON, function (item) {
                                    self.availableShipMethod.push(ko.toJS({value: item.LOOKUP_VALUE, label: item.LOOKUP_VALUE}));
                                });
                            }
                        }
                    } catch (ex) {
                    }
                    
                    ////////////////////////////////////
                    // District
                    ////////////////////////////////////
                    try {
                        var dtJSON = data["P_DISTRICT"]["P_SERVICE_PROVIDER_ITEM"];
                        if (dtJSON) {
                            if (!Array.isArray(dtJSON)) dtJSON = new Array(dtJSON);
                            if (self.availableDistrict().length <= 0) {
                                self.availableDistrict.push(ko.toJS({value: null, label: ""}));
                                ko.utils.arrayForEach(dtJSON, function (item) {
                                    self.availableDistrict.push(ko.toJS({value: item.LOOKUP_VALUE, label: item.LOOKUP_VALUE}));
                                });
                            }
                        }
                    } catch (ex) {
                    }
                    
                    ////////////////////////////////////
                    // SubInv Code
                    ////////////////////////////////////
                    try {
                        var scJSON = data["P_SUBINV_CODE"]["P_SERVICE_PROVIDER_ITEM"];
                        if (scJSON) {
                            if (!Array.isArray(scJSON)) scJSON = new Array(scJSON);
                            if (self.availabvleSubInvCode().length <= 0) {
                                self.availabvleSubInvCode.push(ko.toJS({value: null, label: ""}));
                                ko.utils.arrayForEach(scJSON, function (item) {
                                    self.availabvleSubInvCode.push(ko.toJS({value: item.LOOKUP_VALUE, label: item.LOOKUP_VALUE}));
                                });
                            }
                        }                        
                    } catch (ex) {
                    }
                    
                    ////////////////////////////////////
                    // Route
                    ////////////////////////////////////
                    try {
                        var rtJSON = data["P_ROUTE"]["P_SERVICE_PROVIDER_ITEM"];
                        if (rtJSON) {
                            if (!Array.isArray(rtJSON)) rtJSON = new Array(rtJSON);
                            if (self.availableRouteList().length <= 0) {
                                self.availableRouteList.push(ko.toJS({value: "-1", label: ""}));
                                ko.utils.arrayForEach(rtJSON, function (item) {
                                    self.availableRouteList.push(ko.toJS({value: item.LOOKUP_VALUE, label: item.LOOKUP_VALUE}));
                                });
                            }
                            if (self.availableRouteFullList().length <= 0) {
                                self.availableRouteFullList.push(ko.toJS({value: "-1", label: ""}));
                                ko.utils.arrayForEach(rtJSON, function (item) {
                                    self.availableRouteFullList.push(ko.toJS({value: item.LOOKUP_VALUE, label: item.LOOKUP_VALUE}));
                                });                                 
                            }
                        }                        
                    } catch (ex) {
                    }                   
                    

                }).done(function () {
                    ui.hideBusy();
                    self.ready(true);
                });
            }
            
            function getLOVServicePayload() {
                var user = app.moduleConfig.params.rootContext.userProfile;
                var payload = JSON.stringify({
                    "InputGetLOV": {
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
            
            function getRouteLOVServicePayload(serviceProvider){
                var user = app.moduleConfig.params.rootContext.userProfile;
                var payload = JSON.stringify({
                    "InputGetRouteLOV": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_ORG_ID": user.orgUnitId,
                        "P_SERVICE_PROVIDER": serviceProvider
                    }
                });
                return payload;                 
            }
            
            function getShipmentLOVServicePayload(serviceProvider, route) {
                var user = app.moduleConfig.params.rootContext.userProfile;
                var payload = JSON.stringify({
                    "InputGetShipMethodLOV": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_ORG_ID": user.orgUnitId,
                        "P_SERVICE_PROVIDER": serviceProvider,
                        "P_ROUTE": route
                    }
                });
                return payload;                    
            }
            
            function populateDOWList() {
                // populate the DOW (LOV)
                var length = self.availableDOWList().length;
                if (length > 0) return;
                
                ko.utils.arrayForEach(constant.DOW_LIST, function (item) {
                    self.availableDOWList.push(ko.toJS({value: item.value, label: item.label}));
                });                
            }
            
            function getDefaultCriteria() {
                self.serviceProvider("-1");
                self.route("-1");
                self.district(null);
            }

            self.goBack = function () {
                app.router.go('springboard');
            };

            self.dispose = function (info) {
                self.router.dispose();
            };
            
            self.search = function () {
                console.log("search");
                var isMaintenance = maintenance.isMaintenance();
                if (isMaintenance) {
                    ui.showMessageBox(self.lng_maintenance);
                    return;
                }
                fetchData();
            };

            self.reset = function () {
                console.log("reset");
                getDefaultCriteria();
            };
            
            self.add = function () {
                console.log("add");

                var length = 0;
                try {
                    length = self.allLoaded().length;
                } catch (ex) {
                }
                
                var data = {
                    "id": commonHelper.getClientDays(0, "YYYY-MM-DDTHH:mm:ssZ"),
                    "rowCount": length + 1,
                    "LOGISTIC_SCH_ROWID": null,
                    "SERVICE_PROVIDER": ko.observable(self.serviceProvider() ? self.serviceProvider() : "-1"),
                    "ROUTE": ko.observable("-1"),
                    "SCHEDULE_DOW": ko.observable("-1"),
                    "STOP_NUM": ko.observable("1"),
                    "SHIP_METHOD": ko.observable("-1"),
                    "DISTRICT": ko.observable(null),
                    "SUBINV_CODE": ko.observable(null),
                    "ORIGINAL_SERVICE_PROVIDER": (self.serviceProvider()) ? self.serviceProvider() : "-1",
                    "ORIGINAL_ROUTE": "-1",
                    "ORIGINAL_SCHEDULE_DOW": "-1",
                    "ORIGINAL_STOP_NUM": null,
                    "ORIGINAL_SHIP_METHOD": "-1",
                    "ORIGINAL_DISTRICT": null,
                    "ORIGINAL_SUBINV_CODE": null,
                    "ACTION": "I"
                };
                self.allLoaded.splice(0, 0, data);
            };
            
            self.removeLine = function(line) {
                var foundItem = ko.utils.arrayFirst(self.allLoaded(), function(item) {
                    if (item.id == line.id)  { 
                        return item;
                    }
                });
                
                self.allLoaded.remove(foundItem);
                
                if (line.ACTION != "I") {
                    line.ACTION = "D";
                    console.log("delete line =" + ko.toJSON(line));
                    self.deleted.push(line);
                }
            };
            
            self.optionChangeServiceProvider = function (data, event) {
                console.log("optionChangeServiceProvider");
                var serviceProvider = self.serviceProvider();
                if (Array.isArray(serviceProvider)) serviceProvider = serviceProvider[0];
                serviceProvider = (serviceProvider == "-1" || typeof serviceProvider == "undefined") ? null : serviceProvider;
                
                if (serviceProvider) {
                    self.availableRouteList.removeAll();
                    self.availableRouteList.push(ko.toJS({value: "-1", label: ""}));
                    service.getRouteLOVMessage(getRouteLOVServicePayload(serviceProvider)).then(function (item) {
                        var respJSON = item["P_ROUTE_BY_SERVICE_PROVIDER"]["P_ROUTE_BY_SERVICE_PROVIDER_ITEM"];
                        ko.utils.arrayForEach(respJSON, function(x) {
                            self.availableRouteList.push(ko.toJS({value: x.LOOKUP_VALUE, label: x.LOOKUP_VALUE}));
                        });
                    }).fail(function() {
                        console.log("failed");
                        self.availableRouteList.removeAll();
                        ko.utils.arrayForEach(self.availableRouteFullList(), function(x) {
                          self.availableRouteList.push(ko.toJS({value: x.value, label: x.label}))
                        });                     
                    });
                } else {
                    console.log("availableRouteFullList=" + ko.toJSON(self.availableRouteFullList));
                    self.availableRouteList.removeAll();
                    ko.utils.arrayForEach(self.availableRouteFullList(), function(x) {
                      self.availableRouteList.push(ko.toJS({value: x.value, label: x.label}))
                    });
                }
                
            };
            
            self.save = function() {
                console.log("save");
                if (confirm(self.lng_confirmSave)) {
                    var P_TABLE_ITEM = [];
                    var foundError = false;
                    
                    // merge insert / update and deleted items
                    self.allLoaded().push.apply(self.allLoaded(), self.deleted());                    

                    // handle update / insert case
                    ko.utils.arrayMap(self.allLoaded(), function (item) {
                        // compare the image
                        var serviceProvider = ko.utils.unwrapObservable(item.SERVICE_PROVIDER);
                        if (Array.isArray(serviceProvider)) serviceProvider = serviceProvider[0];
                        serviceProvider = (serviceProvider == "-1" || typeof serviceProvider == "undefined") ? null : serviceProvider;
                        var original_serviceProvider = ko.utils.unwrapObservable(item.ORIGINAL_SERVICE_PROVIDER);
                        original_serviceProvider = (original_serviceProvider == "-1" || typeof original_serviceProvider == "undefined") ? null : original_serviceProvider;
                        
                        var route = ko.utils.unwrapObservable(item.ROUTE);
                        if (Array.isArray(route)) route = route[0];
                        route = (route == "-1" || typeof route == "undefined") ? null : route;
                        var original_route = ko.utils.unwrapObservable(item.ORIGINAL_ROUTE);
                        original_route = (original_route == "-1" || typeof original_route == "undefined") ? null : original_route;
                        
                        var scheduleDow = ko.utils.unwrapObservable(item.SCHEDULE_DOW);
                        if (Array.isArray(scheduleDow)) scheduleDow = scheduleDow[0];
                        scheduleDow = (scheduleDow == "-1" || typeof scheduleDow == "undefined") ? null : scheduleDow;
                        var original_scheduleDow = ko.utils.unwrapObservable(item.ORIGINAL_SCHEDULE_DOW);
                        original_scheduleDow = (original_scheduleDow == "-1" || typeof original_scheduleDow == "undefined") ? null : original_scheduleDow;
                        
                        var stopNum = ko.utils.unwrapObservable(item.STOP_NUM);
                        var original_stopNum = ko.utils.unwrapObservable(item.ORIGINAL_STOP_NUM);
                        
                        var shipMethod = ko.utils.unwrapObservable(item.SHIP_METHOD);
                        if (Array.isArray(shipMethod)) shipMethod = shipMethod[0];
                        shipMethod = (shipMethod == "-1" || typeof shipMethod == "undefined") ? null : shipMethod;
                        var original_shipMethod = ko.utils.unwrapObservable(item.ORIGINAL_SHIP_METHOD);
                        original_shipMethod = (original_shipMethod == "-1" || typeof original_shipMethod == "undefined") ? null : original_shipMethod;
                        
                        var district = ko.utils.unwrapObservable(item.DISTRICT);
                        if (Array.isArray(district)) district = district[0];
                        district = (district == "-1" || typeof district == "undefined") ? null : district;
                        var original_district = ko.utils.unwrapObservable(item.ORIGINAL_DISTRICT);
                        original_district = (original_district == "-1" || typeof original_district == "undefined") ? null : original_district;
                        
                        var subInvCode = ko.utils.unwrapObservable(item.SUBINV_CODE);
                        if (Array.isArray(subInvCode)) subInvCode = subInvCode[0];
                        subInvCode = (subInvCode == "-1" || typeof subInvCode == "undefined") ? null : subInvCode;
                        var original_subInvCode = ko.utils.unwrapObservable(item.ORIGINAL_SUBINV_CODE);
                        original_subInvCode = (original_subInvCode == "-1" || typeof original_subInvCode == "undefined") ? null : original_subInvCode;
                        
                        var action = ko.utils.unwrapObservable(item.ACTION);
                        
                        /*
                        console.log("serviceProvider=" + serviceProvider);
                        console.log("original_serviceProvider=" + original_serviceProvider);
                        console.log("route=" + route);
                        console.log("original_route=" + original_route);
                        console.log("scheduleDow=" + scheduleDow);
                        console.log("original_scheduleDow=" + original_scheduleDow);                        
                        console.log("stopNum=" + stopNum);
                        console.log("original_stopNum=" + original_stopNum); 
                        console.log("shipMethod=" + shipMethod);
                        console.log("original_shipMethod=" + original_shipMethod); 
                        console.log("subInvCode=" + subInvCode);
                        console.log("original_subInvCode=" + original_subInvCode);   
                        */
                        
                        if ((serviceProvider != original_serviceProvider) ||
                            (route != original_route) ||
                            (scheduleDow != original_scheduleDow) ||
                            (stopNum != original_stopNum) ||
                            (shipMethod != original_shipMethod) ||
                            (district != original_district) ||
                            (subInvCode != original_subInvCode) || 
                            (action == "D")) {
                        
                            if (action != "D") {
                                // validate the input field
                                foundError = validateInput(item);
                                if (foundError) return;
                            }
                            
                            // check the route 
                            service.getRouteLOVMessage(getRouteLOVServicePayload(serviceProvider)).then(function (item) {
                                // console.log("route lov item=" + ko.toJSON(item));
                                if (action != "D") {
                                    if (!item["P_ROUTE_BY_SERVICE_PROVIDER"]) {
                                        foundError = true;
                                        var params = {"SERVICE_PROVIDER": serviceProvider, "ROUTE": route};
                                        console.log("params=" + ko.toJSON(params));
                                        lng_error_00055 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00055", params);
                                        ui.hideBusy();
                                        ui.showMessageBox(lng_error_00055);
                                    } else {
                                        var respJSON = item["P_ROUTE_BY_SERVICE_PROVIDER"]["P_ROUTE_BY_SERVICE_PROVIDER_ITEM"];
                                        if (respJSON) {
                                            var foundItem = ko.utils.arrayFirst(respJSON, function (x) {
                                                if (x.LOOKUP_VALUE == route) {
                                                    return x;
                                                }
                                            });
                                            if (!foundItem) {
                                                foundError = true;
                                                var params = {"SERVICE_PROVIDER": serviceProvider, "ROUTE": route};
                                                console.log("params=" + ko.toJSON(params));
                                                lng_error_00055 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00055", params);
                                                ui.hideBusy();
                                                ui.showMessageBox(lng_error_00055);
                                            }
                                        }
                                    }
                                }

                            }).then(function () {
                                if (!foundError && shipMethod && action != "D") {
                                    // check the shipment method
                                    service.getShipmentLOVMessage(getShipmentLOVServicePayload(serviceProvider, route)).then(function (item) {
                                        // console.log("shipment lov item=" + ko.toJSON(item));
                                        if (!item["P_SHIPPING_METHOD"]) {
                                            foundError = true;
                                            var params = {"SERVICE_PROVIDER": serviceProvider, "ROUTE": route, "SHIP_METHOD": shipMethod};
                                            lng_error_00056 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00056", params);
                                            ui.hideBusy();
                                            ui.showMessageBox(lng_error_00056);
                                        } else {
                                            var respJSON = item["P_SHIPPING_METHOD"]["P_SHIPPING_METHOD_ITEM"];
                                            if (respJSON) {
                                                var foundItem = ko.utils.arrayFirst(respJSON, function (x) {
                                                    if (x.LOOKUP_VALUE == shipMethod) {
                                                        return x;
                                                    }
                                                });
                                                if (!foundItem) {
                                                    foundError = true;
                                                    var params = {"SERVICE_PROVIDER": serviceProvider, "ROUTE": route, "SHIP_METHOD": shipMethod};
                                                    lng_error_00056 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00056", params);
                                                    ui.hideBusy();
                                                    ui.showMessageBox(lng_error_00056);
                                                }
                                            }
                                        }
                                    });
                                }
                            }).done(function(){
                                console.log("foundError = " + foundError);
                                if (!foundError) {
                                    P_TABLE_ITEM.push({
                                        "LOGISTIC_SCH_ROWID": ko.utils.unwrapObservable(item.LOGISTIC_SCH_ROWID),
                                        "SERVICE_PROVIDER": serviceProvider,
                                        "ROUTE": route,
                                        "SCHEDULE_DOW": scheduleDow,
                                        "STOP_NUM": stopNum,
                                        "SHIP_METHOD": shipMethod,
                                        "DISTRICT": district,
                                        "SUBINV_CODE": subInvCode,
                                        "ACTION": (action == "D") ? action : ((item.LOGISTIC_SCH_ROWID) ? "U" : "I")
                                    });
                                }
                            
                            }).done(function() {
                                console.log("P_TABLE_ITEM=" + ko.toJSON(P_TABLE_ITEM));
                                if (P_TABLE_ITEM.length > 0) {
                                    save2db(P_TABLE_ITEM);
                                }
                                    
                            });
                                
                        }
                    });

                }
            };
            
            // handler for drill in to delivery details
            self.optionChange = function (event, ui) {
                if (ui.option === 'selection' && ui.value[0]) {
                    console.log("logisticsSchMaint.js ui.value=" + ui.value);
                }
            };

            self.getRowTemplate = function (data, context)
            {
                  return "editRowTemplate";                
            };       
            
            function save2db(P_TABLE_ITEM) {
                ui.showBusy();
                var payload = getUpdatePayload(P_TABLE_ITEM);
                console.log("update payload=" + payload);

                var cbSuccessFn = function (data, xhr) {
                    try {
                        // console.log("raw data return =" + ko.toJSON(data));
                        if (data !== null && xhr.status == 200) {
                            var respJSON = data["OutputUpdateLogisticSchedule"];
                            var returnStatus = respJSON['P_RETURN_STATUS'];
                            if (returnStatus != "S") {
                                ui.showMessageBox(self.lng_error_00032);
                            } else {
                                // update the original flag;
                                ko.utils.arrayMap(self.allLoaded(), function (item) {
                                    item.ORIGINAL_SERVICE_PROVIDER = ko.utils.unwrapObservable(item.SERVICE_PROVIDER);
                                    item.ORIGINAL_ROUTE = ko.utils.unwrapObservable(item.ROUTE);
                                    item.ORIGINAL_SCHEDULE_DOW = ko.utils.unwrapObservable(item.SCHEDULE_DOW);
                                    item.ORIGINAL_STOP_NUM = ko.utils.unwrapObservable(item.STOP_NUM);
                                    item.ORIGINAL_SHIP_METHOD = ko.utils.unwrapObservable(item.SHIP_METHOD);
                                    item.ORIGINAL_DISTRICT = ko.utils.unwrapObservable(item.DISTRICT);
                                    item.ORIGINAL_SUBINV_CODE = ko.utils.unwrapObservable(item.SUBINV_CODE);
                                    item.ACTION = null;
                                });
                                self.allLoaded.valueHasMutated();
                                self.deleted.removeAll();
                                ui.showMessageBox(self.lng_recordSaved);
                            }
                        } else {
                            ui.showMessageBox(self.lng_error_00032);
                        }
                    } catch (e) {
                        console.error(e);
                    } finally {
                        ui.hideBusy();
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    console.log("cbFailFn failed");
                    ui.showMessageBox(self.lng_error_00032);
                    ui.hideBusy();
                };
                service.updateLogisticScheduleMessage(payload).then(cbSuccessFn, cbFailFn);                
            }
            
            function validateInput(item) {
                var foundError = false;
                var serviceProvider = ko.utils.unwrapObservable(item.SERVICE_PROVIDER);
                 if (Array.isArray(serviceProvider)) serviceProvider = serviceProvider[0];
                 serviceProvider = (serviceProvider == "-1" || typeof serviceProvider == "undefined") ? null : serviceProvider;
                
                var route = ko.utils.unwrapObservable(item.ROUTE);
                if (Array.isArray(route)) route = route[0];
                route = (route == "-1" || typeof route == "undefined") ? null : route;
                
                var scheduleDow = ko.utils.unwrapObservable(item.SCHEDULE_DOW);
                if (Array.isArray(scheduleDow)) scheduleDow = scheduleDow[0];
                scheduleDow = (scheduleDow == "-1" || typeof scheduleDow == "undefined") ? null : scheduleDow;
                
                var stopNum = ko.utils.unwrapObservable(item.STOP_NUM);
                
                var district = ko.utils.unwrapObservable(item.DISTRICT);
                if (Array.isArray(district)) district = district[0];           
                district = (district == "-1" || typeof district == "undefined") ? null : district;
                
                var subInvCode = ko.utils.unwrapObservable(item.SUBINV_CODE);
                if (Array.isArray(subInvCode)) subInvCode = subInvCode[0];
                subInvCode = (subInvCode == "-1" || typeof subInvCode == "undefined") ? null : subInvCode;
                
                var shipMethod = ko.utils.unwrapObservable(item.SHIP_METHOD);
                if (Array.isArray(shipMethod)) shipMethod = shipMethod[0];
                shipMethod = (shipMethod == "-1" || typeof shipMethod == "undefined") ? null : shipMethod;                
                
                if (!serviceProvider || typeof serviceProvider === "undefined" || serviceProvider == "-1" || serviceProvider == "null") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00046);
                }
                
                if (!route || typeof route === "undefined" || route == "null" || route == "-1") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00047);
                }
                
                if (!scheduleDow || typeof scheduleDow === "undefined" || scheduleDow == "null") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00048);
                }                
                
                if (!stopNum || typeof stopNum === "undefined" || stopNum == "null") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00049);
                }    
                
                if (!district || typeof district === "undefined" || district == "null") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00050);
                }                   
                
                if (!subInvCode || typeof subInvCode === "undefined" || subInvCode == "null") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00051);
                }
                
                return foundError;
            }

            function prepareUI(data, status) {
                data = (Array.isArray(data)) ? data[0] : data;
                // console.log("data retrieve from backend = " + ko.toJSON(data));
                if (data !== null && status == 200) {
                    
                    if (!data[RESPONSE_TABLE]) return;
                    
                    var respJSON = data[RESPONSE_TABLE]["P_TABLE_ITEM"];
                    if (respJSON != null) {
                        if (!Array.isArray(respJSON)) respJSON = new Array(respJSON);
                        var formatted = [];
                        var rowCount = 0;
                        
                        ko.utils.arrayMap(respJSON, function (item) {
                            
                            rowCount = rowCount + 1;
                            item.rowCount = rowCount;
                            
                            formatted.push({
                                "id": item.LOGISTIC_SCH_ROWID,
                                "rowCount": item.rowCount,
                                "LOGISTIC_SCH_ROWID": item.LOGISTIC_SCH_ROWID,
                                "SERVICE_PROVIDER": ko.observable(item.SERVICE_PROVIDER),
                                "ROUTE": ko.observable(item.ROUTE),
                                "SCHEDULE_DOW": ko.observable(item.SCHEDULE_DOW),
                                "STOP_NUM": ko.observable(item.STOP_NUM),
                                "SHIP_METHOD": ko.observable(item.SHIP_METHOD),
                                "DISTRICT": ko.observable(item.DISTRICT),
                                "SUBINV_CODE": ko.observable(item.SUBINV_CODE),
                                "ORIGINAL_SERVICE_PROVIDER": item.SERVICE_PROVIDER,
                                "ORIGINAL_ROUTE": item.ROUTE,
                                "ORIGINAL_SCHEDULE_DOW": item.SCHEDULE_DOW,
                                "ORIGINAL_STOP_NUM": item.STOP_NUM,
                                "ORIGINAL_SHIP_METHOD": item.SHIP_METHOD,
                                "ORIGINAL_DISTRICT": item.DISTRICT,
                                "ORIGINAL_SUBINV_CODE": item.SUBINV_CODE,
                                "ACTION": null
                            });
                        });
                        
                        self.allLoaded(formatted);
                    }
                }
            }

            
            self.datasource = ko.computed(function () {
                return new oj.ArrayTableDataSource(self.allLoaded(), {idAttribute: 'id'});
            });

            function fetchData() {
                ui.showBusy();
                
                var serviceProvider = self.serviceProvider();
                var route = self.route();
                var district = self.district();

                if (Array.isArray(serviceProvider)) serviceProvider = serviceProvider[0];                
                if (!serviceProvider || typeof serviceProvider === "undefined" || serviceProvider == "-1" || serviceProvider == "null") {
                    ui.hideBusy();
                    ui.showMessageBox(self.lng_error_00046);
                    return;
                }
                
                if (Array.isArray(route)) route = route[0]; 
                if ((!route || typeof route === "undefined" || route == "-1" || route == "null") && !district) {
                    ui.hideBusy();
                    ui.showMessageBox(self.lng_error_00057);
                    return;
                }
                
                route = (route) ? route.toString().toUpperCase() : null;
                district = (district) ? district.toString().toUpperCase() : null;

                var payload = getEnquiryPaylod(serviceProvider, route, district);
                console.log("Search Logistic Schedule Payload =" + ko.toJS(payload));
                
                // reset
                self.allLoaded.removeAll();
                self.deleted.removeAll();

                var cbSuccessFn = function (data, xhr) {
                    try {
                        prepareUI(data, xhr.status);
                    } catch (e) {
                        console.error(e);
                    } finally {
                        ui.hideBusy();
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    console.log("cbFailFn failed");
                    prepareUI(data, xhr.status);
                    ui.hideBusy();
                };
                service.searchLogisticScheduleMessage(payload).then(cbSuccessFn, cbFailFn);
            }
            
            function getEnquiryPaylod(serviceProvider, route, district) {
                var user = app.moduleConfig.params.rootContext.userProfile;

                serviceProvider = (serviceProvider == "-1") ? null : ((serviceProvider) ? serviceProvider : null); 
                route = (route == "-1") ? null : ((route) ? route : null);
                district = (district) ? district : null;
                
                var payload = JSON.stringify({
                    "InputSearchLogisticSchedule": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_ORG_ID": user.orgUnitId,
                        "P_SERVICE_PROVIDER": serviceProvider,
                        "P_ROUTE": route,
                        "P_DISTRICT": district
                    }
                });

                return payload;                
            }
            
            function getUpdatePayload(P_SCHEDULE_MAIN_UPDATE_ITEM) {
                var user = app.moduleConfig.params.rootContext.userProfile;
                var payload = JSON.stringify({
                    "InputUpdateLogisticSchedule": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_ORG_ID": user.orgUnitId,
                        "P_SCHEDULE_MAIN_UPDATE": {"P_SCHEDULE_MAIN_UPDATE_ITEM": P_SCHEDULE_MAIN_UPDATE_ITEM}
                    }
                });

                return payload;  
            }
            
            function initTranslations() {
                // language translations
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_title = getTranslation("ssa.schedule.logistic.title");
                self.lng_search = getTranslation("ssa.schedule.search");
                self.lng_reset = getTranslation("ssa.schedule.reset");
                self.lng_remove = getTranslation("ssa.schedule.remove");
                self.lng_confirmSave = getTranslation("ssa.schedule.confirmSave");
                self.lng_serviceProvider = getTranslation("ssa.schedule.serviceProvider");
                self.lng_route = getTranslation("ssa.schedule.route");
                self.lng_district = getTranslation("ssa.schedule.district");
                self.lng_dow = getTranslation("ssa.schedule.logistic.dow");
                self.lng_stopNo = getTranslation("ssa.schedule.logistic.stopNo");
                self.lng_shipMethod = getTranslation("ssa.schedule.logistic.shipMethod");
                self.lng_subinvCode = getTranslation("ssa.schedule.logistic.subinvCode");
                self.lng_recordSaved = getTranslation("ssa.msg.info.recordSaved");
                self.lng_error_00032 = getTranslation("ssa.msg.error.ERROR_00032");
                self.lng_error_00046 = getTranslation("ssa.msg.error.ERROR_00046");
                self.lng_error_00047 = getTranslation("ssa.msg.error.ERROR_00047");
                self.lng_error_00048 = getTranslation("ssa.msg.error.ERROR_00048");
                self.lng_error_00049 = getTranslation("ssa.msg.error.ERROR_00049");
                self.lng_error_00050 = getTranslation("ssa.msg.error.ERROR_00050");
                self.lng_error_00051 = getTranslation("ssa.msg.error.ERROR_00051");
                self.lng_error_00057 = getTranslation("ssa.msg.error.ERROR_00057");
            }

            $(document).ready(
                    function ()
                    {
                        console.log("document ready");
                    }
            );            

        }
           
        ko.bindingHandlers.executeOnEnter = {
            init: function (element, valueAccessor, allBindings, viewModel) {
                var callback = valueAccessor();
                $(element).keypress(function (event) {
                    var keyCode = (event.which ? event.which : event.keyCode);
                    if (keyCode === 13) {
                        callback.call(viewModel);
                        return false;
                    }
                    return true;
                });
            }
        };
        
        ko.bindingHandlers.datePicker = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {                    
                // Register change callbacks to update the model
                // if the control changes.       
                ko.utils.registerEventHandler(element, "change", function () {            
                    var value = valueAccessor();
                    value(new Date(element.value));            
                });
            },
            // Update the control whenever the view model changes
            update: function (element, valueAccessor, allBindingsAccessor, viewModel) {        
                var value = valueAccessor();
                var x = new moment(value()).format("YYYY-MM-DD");
                element.value = x;
            }
        };        
        
        return new LogisticsScheduleViewModel();
    }
);