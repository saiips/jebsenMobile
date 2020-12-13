/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'appController','util/appui', 'pages/common/constant', 'pages/printerSetup/printerService',
    'ojs/ojknockout', 'hammerjs', 'ojs/ojjquery-hammer',
    'ojs/ojrouter', 'ojs/ojtoolbar', 'ojs/ojinputtext', 'ojs/ojbutton',
    'ojs/ojmodel', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, ui, constant, service) {


            function PrinterSetupViewModel() {
                var self = this;
                
                self.mac = ko.observable("");
                self.availablePrinters = ko.observableArray();

                self.handleActivated = function (info) {
                    // Implement if needed
                    initTranslation();
                    
                    init();
                };

                self.handleAttached = function (info) {
                    // Implement if needed
                };

                self.handleBindingsApplied = function (info) {
                    // Implement if needed
                };

                self.handleDetached = function (info) {
                    // Implement if needed
                };
                
                self.findPrinter = function () {
                    
                    self.mac(null);
                    
                    ui.showBusy();
                    
                    var isCordova = app.moduleConfig.params.rootContext.isCordova;
                    if (!isCordova) {
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00037);
                        return;
                    }
                    
                    self.asyncLoop({
                        length: 50,
                        functionToLoop: function (loop, i) {
                            setTimeout(function () {
                                console.log("Iteration " + i);
                                findPrinterMac();
                                loop();
                            }, 1000);
                        },
                        callback: function () {
                            console.log("all done!");
                            ui.hideBusy();
                        }
                    });
                };

                self.asyncLoop = function (o) {
                    var i = -1;
                    var loop = function () {
                        i++;
                        if (i == o.length || self.mac()) {
                            if (i == o.length) {
                                ui.showMessageBox(self.lng_error_00037);
                            }
                            o.callback();
                            return;
                        }
                        o.functionToLoop(loop, i);
                    };
                    loop();//init
                };   
                
                self.reset = function() {
                    self.mac("");
                };
                
                self.mac.subscribe(function(mac) {
                   console.log("mac = " + mac); 
                   if (Array.isArray(mac)) mac = mac[0];
                   mac = (mac == "-1") ? null : mac;
                   mac = (mac) ? mac.toString().trim() : mac;
                   
                   // store the mac address for android version
                   app.moduleConfig.params.rootContext.macAddress = mac;
                   ui.setLocalStorage(constant.PRINTER_MAC_ADDRESS, mac);
                   
                   // store the serial number / model number for iOS version
                   var findItem = ko.utils.arrayFirst(self.availablePrinters(), function(item) {
                      return (ko.utils.unwrapObservable(item.value) == mac);
                   });
                   
                   if (findItem) {
                       console.log("model=" + findItem.label);
                       app.moduleConfig.params.rootContext.serialNo = findItem.label;
                       ui.setLocalStorage(constant.PRINTER_SERIAL_NO, findItem.label);
                   }
                });

                function init() {
                    ui.showBusy();
                    console.log("printerSetup.js init() started");
                    
                    var mac = ui.getLocalStorage(constant.PRINTER_MAC_ADDRESS);
                    if (mac) {
                        self.mac(mac);
                    }
                    
                    service.getAllPrintersMessage().then(function(data) {
                        try {
                            var respJSON = data["items"];
                            if (respJSON) {
                                if (!Array.isArray(respJSON)) respJSON = new Array(respJSON);
                                if (self.availablePrinters().length <= 0) {
                                    self.availablePrinters.push(ko.toJS({value: "-1", label: ""}));
                                    ko.utils.arrayForEach(respJSON, function (item) {
                                        self.availablePrinters.push(ko.toJS({value: item.mac, label: item.model}));
                                    });
                                }
                            }
                        } catch (ex){
                        }                        
                    }).done(function() {
                        console.log("completed");
                        ui.hideBusy();
                    });
                }

                self.goBack = function () {
                    app.go("springboard");
                };
                
                function findPrinterMac() {
                    try {
                        cordova.plugins.zbtprinter.find(function (result) {
                            console.log("result = " + ko.toJSON(result));
                            if (result.friendlyName) {
                                var index = result.friendlyName.indexOf("XXXXJ")
                                if (index >= 0) {
                                    console.log("Found the printer");
                                    console.log("address = " + result.address);
                                    console.log("friendly name = " + result.friendlyName);
                                    self.mac(result.address);
                                    ui.hideBusy();
                                }
                            }
                        }, function (fail) {
                            console.log("try failed");
                            ui.hideBusy();
                        }
                        );
                    } catch (ex) {
                        console.log("findPrinterMac Exception : " + ex);
                        ui.hideBusy();
                    } finally {
                        // ui.hideBusy();
                    }
                }
                
                function initTranslation() {
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_macAddress = getTranslation("ssa.printerSetup.macAddress");
                    self.lng_find = getTranslation("ssa.printerSetup.find");
                    self.lng_error_00037 = getTranslation("ssa.msg.error.ERROR_00037");
                    self.lng_title = getTranslation("ssa.springboard.printerSetup");
                    self.lng_reset = getTranslation("ssa.reviewLoading.reset");
                }

                // init();
            }

            return new PrinterSetupViewModel();
        }
);
