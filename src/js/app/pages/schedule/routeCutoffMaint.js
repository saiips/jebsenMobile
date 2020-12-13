define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/appui', 'pages/schedule/scheduleService', 'pages/common/constant', 'util/commonhelper', 'pages/common/maintenance',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojdatetimepicker',
    'ojs/ojlistview', 'ojs/ojmodel', 'ojs/ojpagingcontrol', 'ojs/ojpagingcontrol-model','ojs/ojdialog', 'ojs/ojnavigationlist',
    'ojs/ojtable', 'ojs/ojdatacollection-utils', 'ojs/ojarraytabledatasource', 'ojs/ojdatasource-common', 'promise', 'ojs/ojrowexpander', 'ojs/ojflattenedtreedatagriddatasource', 'ojs/ojjsontreedatasource',
    'ojs/ojvalidation', 'ojs/ojoffcanvas', 'ojs/ojpopup'],
    function (oj, ko, $, app, ui, service, constant, commonHelper, maintenance) {

        
        function RouteCutoffTimeViewModel() {
            var self = this;
            
            console.log("RouteCutoffTimeViewModel");
            
            var RESPONSE_TABLE = "P_TABLE";
            
            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            self.serviceProvider = ko.observable();
            self.availableServiceProvider = ko.observableArray();
            self.availableRouteList = ko.observableArray();            
            self.availableCutoffTime = ko.observableArray();
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
                console.log("routeCutoffMaint.js parentRouter=" + parentRouter.currentState().value);
                self.scrollPos(0);
                
                var childRouter = parentRouter.getChildRouter("routeCutoffMaint");
                if (!childRouter) {
                    childRouter = parentRouter.createChildRouter('routeCutoffMaint');
                }      
                self.router = childRouter.configure(function (stateId) {
                    if (stateId) {
                        var state = new oj.RouterState(stateId, {value: stateId,
                            enter: function () {
                                console.log("routeCutoffMaint.js stateId=" + stateId);
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
                console.log("routeCutoffMaint init(): started");
                ui.showBusy();
                
                initTranslations();
                getDefaultCriteria();
                populateAvailableCutOffTime();
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
                        }                        
                    } catch (ex) {
                    }                        
                    
                }).done(function() {
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
            
            function populateAvailableCutOffTime() {
                // populate the DOW (LOV)
                var length = self.availableCutoffTime().length;
                if (length > 0) return;
                
                ko.utils.arrayForEach(constant.CUTOFF_TIME_LIST, function (item) {
                    self.availableCutoffTime.push(ko.toJS({value: item.value, label: item.label}));
                });                 
            }

            function getDefaultCriteria() {
                self.serviceProvider("-1");
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
                    "ROUTE_CUTOFF_ROWID": null,
                    "SERVICE_PROVIDER": ko.observable(self.serviceProvider() ? self.serviceProvider() : "-1"),
                    "ROUTE": ko.observable("-1"),
                    "CUTOFF_TIME": ko.observable("-1"),
                    "ORIGINAL_SERVICE_PROVIDER": (self.serviceProvider()) ? self.serviceProvider() : "-1",
                    "ORIGINAL_ROUTE": "-1",
                    "ORIGINAL_CUTOFF_TIME": "-1",
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
                        if (Array.isArray(serviceProvider))serviceProvider = serviceProvider[0];
                        serviceProvider = (serviceProvider == "-1" || typeof serviceProvider == "undefined") ? null : serviceProvider;
                        var original_serviceProvider = ko.utils.unwrapObservable(item.ORIGINAL_SERVICE_PROVIDER);
                        original_serviceProvider = (original_serviceProvider == "-1" || typeof original_serviceProvider == "undefined") ? null : original_serviceProvider;

                        var route = ko.utils.unwrapObservable(item.ROUTE);
                        if (Array.isArray(route)) route = route[0];
                        route = (route == "-1" || typeof route == "undefined") ? null : route;
                        var original_route = ko.utils.unwrapObservable(item.ORIGINAL_ROUTE);
                        original_route = (original_route == "-1" || typeof original_route == "undefined") ? null : original_route;
                        
                        var cutoffTime = ko.utils.unwrapObservable(item.CUTOFF_TIME);
                        if (Array.isArray(cutoffTime)) cutoffTime = cutoffTime[0];
                        cutoffTime = (cutoffTime == "-1" || typeof cutoffTime == "undefined") ? null : cutoffTime;                        
                        var original_cutoffTime = ko.utils.unwrapObservable(item.ORIGINAL_CUTOFF_TIME);
                        if (Array.isArray(original_cutoffTime)) original_cutoffTime = original_cutoffTime[0];
                        original_cutoffTime = (original_cutoffTime == "-1" || typeof original_cutoffTime == "undefined") ? null : original_cutoffTime;                         
                        
                        var action = ko.utils.unwrapObservable(item.ACTION);
                        
                        if ((serviceProvider != original_serviceProvider) ||
                            (route != original_route) ||
                            (cutoffTime != original_cutoffTime) || 
                            (action == "D")) {
                            
                            // validate the input field
                            if (action != "D") {
                                foundError = validateInput(item);
                                if (foundError) return;                                 
                            }
                            
                            // check the route 
                            service.getRouteLOVMessage(getRouteLOVServicePayload(serviceProvider)).then(function (item) {
                                var respJSON = item["P_ROUTE_BY_SERVICE_PROVIDER"]["P_ROUTE_BY_SERVICE_PROVIDER_ITEM"];
                                if (respJSON && action != "D") {
                                    var foundItem = ko.utils.arrayFirst(respJSON, function (x) {
                                        if (x.LOOKUP_VALUE == route) {
                                            return x;
                                        }
                                    });
                                    if (!foundItem) {
                                        foundError = true;
                                        var params = {"SERVICE_PROVIDER": serviceProvider, "ROUTE": route};
                                        lng_error_00055 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00055", params);
                                        ui.showMessageBox(lng_error_00055);
                                    }
                                }
                            }).done(function () {
                                console.log("foundError = " + foundError);
                                if (!foundError) {
                                    P_TABLE_ITEM.push({
                                        "ROUTE_CUTOFF_ROWID": ko.utils.unwrapObservable(item.ROUTE_CUTOFF_ROWID),
                                        "SERVICE_PROVIDER": serviceProvider,
                                        "ROUTE": route,
                                        "CUTOFF_TIME": cutoffTime,
                                        "ACTION": (action == "D") ? action : ((item.ROUTE_CUTOFF_ROWID) ? "U" : "I")
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
                    console.log("routeCutoffMaint.js ui.value=" + ui.value);
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
                        console.log("raw data return =" + ko.toJSON(data));
                        if (data !== null && xhr.status == 200) {
                            var respJSON = data["OutputUpdateRouteCutoff"];
                            var returnStatus = respJSON['P_RETURN_STATUS'];
                            if (returnStatus != "S") {
                                ui.showMessageBox(self.lng_error_00032);
                            } else {
                                // update the original flag;
                                ko.utils.arrayMap(self.allLoaded(), function (item) {
                                    item.ORIGINAL_SERVICE_PROVIDER = ko.utils.unwrapObservable(item.SERVICE_PROVIDER);
                                    item.ORIGINAL_ROUTE = ko.utils.unwrapObservable(item.ROUTE);
                                    item.ORIGINAL_CUTOFF_TIME = ko.utils.unwrapObservable(item.CUTOFF_TIME);
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
                service.updateRouteCutoffMessage(payload).then(cbSuccessFn, cbFailFn);                
            }
            
            function validateInput(item) {
                var foundError = false;
                
                var serviceProvider = ko.utils.unwrapObservable(item.SERVICE_PROVIDER);
                if (Array.isArray(serviceProvider))serviceProvider = serviceProvider[0];
                serviceProvider = (serviceProvider == "-1" || typeof serviceProvider == "undefined") ? null : serviceProvider;                
                
                var route = ko.utils.unwrapObservable(item.ROUTE);
                if (Array.isArray(route))route = route[0];
                route = (route == "-1" || typeof route == "undefined") ? null : route;  
                
                var cutoffTime = ko.utils.unwrapObservable(item.CUTOFF_TIME);
                if (Array.isArray(cutoffTime))cutoffTime = cutoffTime[0];
                cutoffTime = (cutoffTime == "-1" || typeof cutoffTime == "undefined") ? null : cutoffTime;                         
                
                if (!serviceProvider || typeof serviceProvider === "undefined" || serviceProvider == "-1" || serviceProvider == "null") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00046);
                }
                
                if (!route || typeof route === "undefined" || route == "null" || route == "-1") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00047);
                }
                
                if (!cutoffTime || typeof cutoffTime === "undefined" || cutoffTime == "null" || cutoffTime == "-1") {
                    foundError = true;
                    ui.showMessageBox(self.lng_error_00053);
                }           
                
                return foundError;
            }               

            function prepareUI(data, status) {
                data = (Array.isArray(data)) ? data[0] : data;
                // console.log("raw data from backend = " + ko.toJSON(data));
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
                                "id": item.ROUTE_CUTOFF_ROWID,
                                "rowCount": item.rowCount,
                                "ROUTE_CUTOFF_ROWID": item.ROUTE_CUTOFF_ROWID,
                                "SERVICE_PROVIDER": ko.observable(item.SERVICE_PROVIDER),
                                "ROUTE": ko.observable(item.ROUTE),
                                "CUTOFF_TIME": ko.observable(item.CUTOFF_TIME),
                                "ORIGINAL_SERVICE_PROVIDER": item.SERVICE_PROVIDER,
                                "ORIGINAL_ROUTE": item.ROUTE,
                                "ORIGINAL_CUTOFF_TIME": item.CUTOFF_TIME,
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
                
                if (Array.isArray(serviceProvider)) serviceProvider = serviceProvider[0];                
                if (!serviceProvider || typeof serviceProvider === "undefined" || serviceProvider == "-1") {
                    ui.hideBusy();
                    ui.showMessageBox(self.lng_error_00046);
                    return;
                }                

                var payload = getEnquiryPaylod(serviceProvider);
                console.log("Search Route Cutoff Time Payload =" + ko.toJS(payload));
                
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
                service.searchRouteCutoffMessage(payload).then(cbSuccessFn, cbFailFn);
            }
            
            function getEnquiryPaylod(serviceProvider) {
                var user = app.moduleConfig.params.rootContext.userProfile;
                
                serviceProvider = (serviceProvider == "-1") ? null : ((serviceProvider) ? serviceProvider : null); 
                
                var payload = JSON.stringify({
                    "InputSearchRouteCutoff": {
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
            
            function getUpdatePayload(P_ROUTE_CUTOFF_UPDATE_ITEM) {
                var user = app.moduleConfig.params.rootContext.userProfile;
                var payload = JSON.stringify({
                    "InputUpdateRouteCutoff": {
                        "HeaderInfo": {
                            "UserID": user.username,
                            "UserRole": user.salesRole,
                            "CallerID": ""
                        },
                        "P_ORG_ID": user.orgUnitId,
                        "P_ROUTE_CUTOFF_UPDATE": {"P_ROUTE_CUTOFF_UPDATE_ITEM": P_ROUTE_CUTOFF_UPDATE_ITEM}
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
            
            function initTranslations() {
                // language translations
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_title = getTranslation("ssa.schedule.cutoff.title");
                self.lng_search = getTranslation("ssa.schedule.search");
                self.lng_reset = getTranslation("ssa.schedule.reset");
                self.lng_remove = getTranslation("ssa.schedule.remove");
                self.lng_confirmSave = getTranslation("ssa.schedule.confirmSave");
                self.lng_serviceProvider = getTranslation("ssa.schedule.serviceProvider");
                self.lng_route = getTranslation("ssa.schedule.route");
                self.lng_cutoffTime= getTranslation("ssa.schedule.cutoff.cutoffTime");
                self.lng_recordSaved = getTranslation("ssa.msg.info.recordSaved");
                self.lng_error_00032 = getTranslation("ssa.msg.error.ERROR_00032");
                self.lng_error_00046 = getTranslation("ssa.msg.error.ERROR_00046");
                self.lng_error_00047 = getTranslation("ssa.msg.error.ERROR_00047");
                self.lng_error_00053 = getTranslation("ssa.msg.error.ERROR_00053");                  
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
        
        return new RouteCutoffTimeViewModel();
    }
);