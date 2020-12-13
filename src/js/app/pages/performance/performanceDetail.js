define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/data', "pages/performance/performanceService", 'util/appui', 'pages/common/constant', 'util/commonhelper',
    'ojs/ojknockout', 'ojs/ojtabs', 'ojs/ojgauge', 'ojs/ojtable', 'ojs/ojarraytabledatasource'],
    function (oj, ko, $, app, data, service, ui, constant, commonHelper) {
        
        function PerformanceViewModel() {
            var self = this;
            
            console.log("PerformanceViewModel");
            
            var RESPONSE_TABLE = 'P_SALES_TBL_ITEM';

            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            self.salesTarget = ko.observable("");
            self.salePerformanceList = ko.observableArray();
            self.productPerformance = ko.computed(function(){
              if (self.salePerformanceList().length > 0) {
                return new oj.ArrayTableDataSource(self.salePerformanceList(), {idAttribute: "PRODUCT"});
              }
            });
            self.sumLastYtdVolume = ko.observable(0);
            self.sumThisYtdVolume = ko.observable(0);
            self.netLastYtdVolume = ko.computed(function() {
                return (self.salesTarget() - self.sumLastYtdVolume());
            });
            self.netThisYtdVolume = ko.computed(function() {
                return (self.salesTarget() - self.sumThisYtdVolume());
            });
            
            /**
            * Optional ViewModel method invoked when this ViewModel is about to be
            * used for the View transition.  The application can put data fetch logic
            * here that can return a Promise which will delay the handleAttached function
            * call below until the Promise is resolved.
            * @param {Object} info - An object with the following key-value pairs:
            * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
            * @param {Function} info.valueAccessor - The binding's value accessor.
            * @return {Promise|undefined} - If the callback returns a Promise, the next phase (attaching DOM) will be delayed until
            * the promise is resolved
            */
            self.handleActivated = function(info) {
                // Implement if needed
                
                initTranslation();
            };

            /**
            * Optional ViewModel method invoked after the View is inserted into the
            * document DOM.  The application can put logic that requires the DOM being
            * attached here.
            * @param {Object} info - An object with the following key-value pairs:
            * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
            * @param {Function} info.valueAccessor - The binding's value accessor.
            * @param {boolean} info.fromCache - A boolean indicating whether the module was retrieved from cache.
            */
            self.handleAttached = function(info) {
                // Implement if needed
            };


            /**
            * Optional ViewModel method invoked after the bindings are applied on this View.
            * If the current View is retrieved from cache, the bindings will not be re-applied
            * and this callback will not be invoked.
            * @param {Object} info - An object with the following key-value pairs:
            * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
            * @param {Function} info.valueAccessor - The binding's value accessor.
            */
            self.handleBindingsApplied = function(info) {
                // Implement if needed
            };

            /*
            * Optional ViewModel method invoked after the View is removed from the
            * document DOM.
            * @param {Object} info - An object with the following key-value pairs:
            * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
            * @param {Function} info.valueAccessor - The binding's value accessor.
            * @param {Array} info.cachedNodes - An Array containing cached nodes for the View if the cache is enabled.
            */
            self.handleDetached = function(info) {
                // Implement if needed
            };
            
            function init() {
                console.log("performance.js init() started");
                ui.showBusy();
                
                // get sales performance
                var cbSuccessFn = function (data, xhr) {
                    try {
                        prepareUI(data, xhr.status);
                    } catch (e) {
                        console.error(e);
                    } finally {
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    console.log("cbFailFn failed");
                    prepareUI(data, xhr.status);
                };
                
                // get sales target
                /*
                var cbSucessSalesTarget = function (data, xhr) {
                    //ui.showBusy();
                    console.log("raw data =" + ko.toJSON(data));
                    try {
                        if (data && xhr.status == 200) {
                            var respJSON = data['OutputGetSalesTargetBySalesRep'];
                            var volume = respJSON['SALES_TARGET'];
                            if (volume < 0) {
                                self.salesTarget(0);
                            } else {
                                self.salesTarget(volume ? volume : 0);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    } finally {
                        console.log("cbSucessSalesTarget called");
                    }
                };
                var cbFailSalesTarget = function (data, xhr) {
                  console.log("cbFailSalesTarget failed");
                };  
                */
                
                service.getSalesPerformanceMessage(getPerformancePayload()).then(cbSuccessFn, cbFailFn).then(function() {
                    /* comment it since sales cloud is obsolete and defult to 0*/
                    self.salesTarget(0);
                    /*
                    service.getSalesTargetMessage(getSalesTargetPayload()).then(cbSucessSalesTarget, cbFailSalesTarget).then(function(){
                        console.log("completed");
                        ui.hideBusy();
                    });  
                    */
                    ui.hideBusy();
                });
            }
            
            function prepareUI(data, status) {
                // console.log("raw data =" + ko.toJSON(data));
                try {
                    if (data !== null && status == 200) {
                        var respJSON;
                        var isArray = Array.isArray(data[RESPONSE_TABLE]);

                        if (!isArray) {
                            var temp = new Array();
                            temp.push(data[RESPONSE_TABLE]);
                            respJSON = temp;
                        } else {
                            respJSON = data[RESPONSE_TABLE];
                        }
                        var formatted = [];
                        var sumLastYtdVolume = 0;
                        var sumThisYtdVolume = 0;
                        for(var i = 0; i < respJSON.length; i++) {
                            // var desc = respJSON[i].PRODUCT_DESCRIPTION;
                            // if(desc.length > constant.PRODUCTION_DESC_LENGTH) {
                            //     desc = desc.substring(0, constant.PRODUCTION_DESC_LENGTH) + "...";
                            // }

                            if(!respJSON[i].UOM) {
                                respJSON[i].UOM = "";
                            }
                            
                            sumLastYtdVolume = sumLastYtdVolume + new Number(respJSON[i].LAST_YTD_VOLUME);
                            sumThisYtdVolume = sumThisYtdVolume + new Number(respJSON[i].THIS_YTD_VOLUME);

                            // respJSON[i].PRODUCT_DESCRIPTION = desc;
                            formatted.push(respJSON[i]);
                        }
                        self.salePerformanceList(respJSON);
                        self.sumLastYtdVolume(sumLastYtdVolume);
                        self.sumThisYtdVolume(sumThisYtdVolume);
                    }
                } catch (e) {
                    console.error(e);
                    // ui.hideBusy();
                } finally {
                    console.log("cbSuccessFn called");
                    //ui.hideBusy();
                }
            }
            
            function getPerformancePayload() {
                var user = app.moduleConfig.params.rootContext.userProfile;
                var payload = JSON.stringify({
                    "InputGetSalesBySalesRep": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID":""
                    },
                    "P_ORG_ID": user.orgUnitId,
                    "P_SALESREP_ID": user.erpSalesId
                    }
                });
                return payload;
            }
            
            function getSalesTargetPayload() {
                var user = app.moduleConfig.params.rootContext.userProfile;
                var payload = JSON.stringify({
                    "InputGetSalesTargetBySalesRep": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID":""
                    },
                    "P_ORG_ID": user.orgUnitId,
                    "P_SALESREP_ID": user.erpSalesId
                    }
                });
                return payload;                
            }
            
            self.decimalNumberConverter = oj.Validation.converterFactory("number").createConverter({style: 'decimal', pattern: '#,##0'});
            self.shortNumberConverter = oj.Validation.converterFactory("number").createConverter({style: 'decimal', decimalFormat: 'short'});

            function initTranslation() {
                var yestersday = commonHelper.getClientYesterday("DD-MMM-YYYY").toUpperCase();
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_overdue = getTranslation("ssa.performance.overdue");
                self.lng_salesPerformance = getTranslation("ssa.performance.salesPerformance");
                self.lng_target = getTranslation("ssa.performance.target");
                self.lng_performanceSummary = getTranslation("ssa.performance.performanceSummary") + " " + yestersday;
                self.lng_performance = getTranslation("ssa.performance.performance");
                self.lng_item = getTranslation("ssa.performance.item");
                self.lng_lastYear = getTranslation("ssa.performance.lastYear");
                self.lng_ytd = getTranslation("ssa.performance.ytd");
                self.lng_volume = getTranslation("ssa.performance.volume");
                self.lng_net = getTranslation("ssa.performance.net");
            }
            
            init();
        }
        return PerformanceViewModel;
    }
);