define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/data', 'util/appui',  'pages/delivery/deliveryService',
    'pages/loading/loadingService', 'pages/common/constant', 'util/commonhelper', 'pages/common/vanService',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber', 'ojs/ojselectcombobox',
    'ojs/ojlistview', 'ojs/ojmodel', 'ojs/ojpagingcontrol', 'ojs/ojpagingcontrol-model',
    'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
    function (oj, ko, $, app, data, ui, deliveryService, service, constant, commonHelper, vanService) {
        var searchCanvas;

        searchCanvas = {
            "selector": "#searchCanvas",
            "edge": "top",
            "displayMode": "push",
            "size": "63px",
            "modality": "modeless",
            "autoDismiss": "none"
        };
        
        function LoadingViewModel() {
            var self = this;
            
            console.log("LoadingViewModel");
            
            var RESPONSE_TABLE = "P_SHIPMENT_TBL_ITEM";
            
            // router configuration
            self.router = app.router;

            /**
            * Observable Arrays
            */
            self.qrcode = ko.observable();
            self.licenseNo = ko.observableArray([]);
            self.barcode = ko.observable();
            self.showError = ko.observable();
            self.s1ErrorList = ko.observableArray();
            self.s2ErrorList = ko.observableArray();
            self.s3ErrorList = ko.observableArray();
            self.proceedDocumentInput = ko.observable();
            self.totalDocumentInput = ko.observable();
            self.isFocused = ko.observable(false);
            self.onLicense = ko.observable(false);
            self.worklistData = ko.observable();
            self.allLoaded = ko.observableArray();
            self.scrollPos = ko.observable(0);
            self.searchText = ko.observable('');
            // resolve the slow performance on the search input box
            self.searchText.extend({
                rateLimit: {
                    timeout: 500,
                    method: "notifyWhenChangesStop"
                }
            });    
            self.isDummyRole = ko.computed(function() {
                var user = app.moduleConfig.params.rootContext.userProfile;
                if (typeof user === "undefined" || user.salesRole == constant.SR_DUMMY) {
                    return true;
                }
                return false;
            });
            self.availableVans = ko.observableArray();
           
            self.handleActivated = function (info) {
                var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                console.log("loading.js parentRouter=" + parentRouter.currentState().value);
                
                var childRouter = parentRouter.getChildRouter("loading");
                if (!childRouter) {
                    childRouter = parentRouter.createChildRouter('loading');
                }      
                self.router = childRouter.configure(function (stateId) {
                    if (stateId) {
                        var state = new oj.RouterState(stateId, {value: stateId,
                            enter: function () {
                                console.log("loading.js stateId=" + stateId);
                            }
                        });
                        return state;
                    }
                });    
                
                // handle the "Remove" action
                try {
                    var selDelivery = app.moduleConfig.params.rootContext.selDeliveryProfile;
                    var isRemoved = app.moduleConfig.params.rootContext.selDeliveryProfile.removed;
                    if (selDelivery && typeof selDelivery !== "undefined" && isRemoved) {
                        var allLoaded = ko.utils.unwrapObservable(self.allLoaded);
                        var document = ko.utils.arrayFirst(allLoaded, function (item) {
                            if (item.DELIVERY_NUMBER == ko.utils.unwrapObservable(selDelivery.delivery_no)) {
                                return item;
                            }
                        });
                        if (document && typeof document !== "undefined") {
                            console.log("document=" + ko.toJSON(document));
                            ko.utils.arrayRemoveItem(allLoaded, document);
                            self.worklistData(new oj.ArrayTableDataSource(allLoaded, {idAttribute: 'DELIVERY_NUMBER'}));
                            self.allLoaded = allLoaded;                            
                            app.moduleConfig.params.rootContext.selDeliveryProfile.removed = false;
                        }
                    } else {
                        reset();                       
                    }
                } catch (ex) {
                    console.log("Exception of removing action:" + ex);
                    reset();
                }
                
                return oj.Router.sync();
            };
            
            self.handleBindingsApplied = function (info) {
                var appLC = $('#globalBody').find('.oj-hybrid-applayout-content');
                var APPLAYOUT_SCROLLABLE = 'oj-hybrid-applayout-scrollable';

                if (appLC.hasClass(APPLAYOUT_SCROLLABLE)) {
                    $('#searchCanvas').on('ojbeforeopen',
                            function ( /*event, offcanvas*/ ) {
                                appLC.removeClass(APPLAYOUT_SCROLLABLE);
                            });
                    $('#searchCanvas').on('ojbeforeclose',
                            function ( /*event, offcanvas*/  ) {
                                appLC.addClass(APPLAYOUT_SCROLLABLE);
                            });
                }

                $('#searchCanvas').on('ojclose',
                        function ( /*event, offcanvas*/  ) {
                            // clear the search right before closing the canvas
                            self.clearSearch();
                        });
            };
            
            
            self.qrcode.subscribe(function (newcode) {
                console.log("New QR Code:" + newcode);
            });  
            
            self.showError.subscribe(function (flag) {
                console.log("Show Error: " + flag);
                if (flag) {
                    var lng_error = "";
                    var lng_error_00024 = "";
                    var lng_error_00025 = "";
                    var lng_error_00026 = "";
                    var s1detail = "";
                    var s2detail = "";
                    var s3detail = "";
                    
                    // handle s1ErrorList
                    ko.utils.arrayForEach(self.s1ErrorList(), function (item) {
                        s1detail = s1detail + item + "<BR>";
                        self.barcode( (self.barcode() ? self.barcode() : "") + item +";");
                    });
                    if (s1detail && s1detail.length > 0) {
                        var params = {'detail': s1detail};
                        lng_error_00024 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00024", params);
                    }                    
                    
                    // handle s2ErrorList
                    ko.utils.arrayForEach(self.s2ErrorList(), function (item) {
                        s2detail = s2detail + item.documentNo + " => " + item.carLicenseNo + "<BR>";
                        self.barcode( (self.barcode() ? self.barcode() : "") + item.documentNo +";");
                    });
                    if (s2detail && s2detail.length > 0) {
                        var params = {'detail': s2detail};
                        lng_error_00025 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00025", params);
                    }
                    
                    // handle s3ErrorList
                    ko.utils.arrayForEach(self.s3ErrorList(), function (item) {
                        s3detail = s3detail + item + "<BR>";
                        self.barcode( (self.barcode() ? self.barcode() : "") + item +";");
                    });
                    if (s3detail && s3detail.length > 0) {
                        var params = {'detail': s3detail};
                        lng_error_00026 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00026", params);
                    }                    
                    
                    // construct the final message
                    if (lng_error_00024 && lng_error_00024.length > 0) {
                        lng_error = lng_error + lng_error_00024 ;
                    }
                    if (lng_error_00025 && lng_error_00025.length > 0) {
                        if (lng_error && lng_error.length > 0) {
                            lng_error = lng_error + "<BR>" + lng_error_00025;
                        } else {
                            lng_error = lng_error + lng_error_00025;
                        }
                    }          
                    if (lng_error_00026 && lng_error_00026.length > 0) {
                        if (lng_error && lng_error.length > 0) {
                            lng_error = lng_error + "<BR>" + lng_error_00026;
                        } else {
                            lng_error = lng_error + lng_error_00026;
                        }
                    }                        
                    
                    // prompt the final message
                    if (lng_error && lng_error.length > 0) {
                        ui.showMessageBox(lng_error);
                    }
                }
            });
            
            function reset() {
                // reset
                self.scrollPos(0);
                self.licenseNo(null);
                self.barcode(null);
                self.worklistData(null);
                self.allLoaded = [];                
            }
            
            function getAllVans() {
                var cbSuccessFn = function (data, xhr) {
                    try {
                        if (data && xhr.status == 200) {
                            var respJSON = data['OutputGetVans']['TblJsVans'];
                            ko.utils.arrayMap(respJSON, function (item) {
                                self.availableVans.push(ko.toJS({value: 'VAN-' + item.LicenseNo, label: item.LicenseNo}));
                            });
                        }
                    } catch (e) {
                        console.error(e);
                    } finally {
                        console.log("cbSuccessFn called");
                    }
                };
                var cbFailFn = function (data, xhr) {
                    console.log("cbFailFn failed");
                };                
                vanService.getAllVans().then(cbSuccessFn, cbFailFn);
            }
            
            function url_query( query ) {
                query = query.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
                var expr = "[\\?&]"+query+"=([^&#]*)";
                var regex = new RegExp( expr );
                var results = regex.exec( window.location.href );
                if ( results !== null ) {
                    return results[1];
                } else {
                    return false;
                }
            }
            
            function init() {
                console.log("loading init(): started");
                
                // prepare the locale
                initTranslations();
                
                // handle 3rd party QRCode
                var user = app.moduleConfig.params.rootContext.userProfile;
                if (typeof user === "undefined" || user.salesRole == "DUMMY") {                    
                    var payload = getEncodedOTP();
                    console.log("checkPasscode payload=" + ko.toJS(payload));
                    ui.showBusy();
                    // setup the oAuth HTTP Header
                    service.setupOAuthToken().done(function () {
                        console.log("Setup oAuth HTTP Header");
                        // check passcode
                        service.checkPasscode(payload).done(function (data) {
                            console.log("check OTP result : " + ko.toJSON(data));
                            if (data && data.result == "true") {
                                 requestFrom3rdParty();
                            } else {
                                ui.hideBusy();
                                console.log("Invalid One-Time-Password");
                                ui.showMessageBox(self.lng_error_00028);
                            }
                        }).fail(function (error) {
                            ui.hideBusy();
                            console.log("checkPasscode Failed");
                            ui.showMessageBox(self.lng_error_00028);
                        });                        
                        
                    }).fail(function(error){
                        ui.hideBusy();
                        console.log("setupOAuthToken Failed");
                        ui.showMessageBox(self.lng_error_00028);
                        
                    });
                } else {
                    // populate the VANS
                    getAllVans();
                }
            }
            
            function getEncodedOTP() {
                // get cookie "_jebsenOTP"
                var cookies = get_cookies_array();
                var encodedOTP = cookies['_jebsenOTP'];
                var payload = JSON.stringify({"encryptedPasscode": encodedOTP});
                return payload;
            }
            
            function requestFrom3rdParty() {
                console.log("requestFrom3rdParty started");
                var user = app.moduleConfig.params.rootContext.userProfile;
                console.log("user = " + ko.toJSON(user));
                if (typeof user === "undefined") {
                    var dummyProfile = { "username": constant.SR_DUMMY, "email": "", "firstName": constant.SR_DUMMY, "lastName": constant.SR_DUMMY, 
                                         "displayName": constant.SR_DUMMY, "salesRole": constant.SR_DUMMY, "salesRespId": "", "orgUnitId":"", "licenseNo":"" };
                    app.moduleConfig.params.rootContext.userProfile = dummyProfile;
                    console.log("Dummy Profile=" + ko.toJSON(dummyProfile));

                    // get the defined query string from URL
                    var documentNumber = url_query('documentNumber');
                    if( documentNumber ) {
                        self.qrcode(documentNumber);
                    }    
                    var licenseNumber = url_query('licenseNumber');
                    if ( licenseNumber ) {
                        console.log(licenseNumber);
                        self.licenseNo(licenseNumber);
                    }                       
                
                    // execute the loading process
                    var licenseNo = getLicenseNo();
                    
                    // reset the error list
                    self.s1ErrorList.removeAll();
                    self.s2ErrorList.removeAll();
                    self.s3ErrorList.removeAll();                    
                    
                    // assume 1 document only
                    self.totalDocumentInput(1);
                    self.proceedDocumentInput(0);
                    
                    // proceed loading process
                    doLoadingProcess(licenseNo, self.qrcode());                    
                }                
            }
            
            function get_cookies_array() {
                var cookies = {};
                if (document.cookie && document.cookie != '') {
                    var split = document.cookie.split(';');
                    for (var i = 0; i < split.length; i++) {
                        // var name_value = split[i].split("=");
                        var name_value = split[i].split(/=(.+)/);
                        name_value[0] = name_value[0].replace(/^ /, '');
                        cookies[decodeURIComponent(name_value[0])] = decodeURIComponent(name_value[1]);
                    }
                 }
                return cookies;
            }

            function replaceAll(str, find, replace) {
                return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
            }
            
            self.valueChangeHandler = function (context, valueParam) {
                if (valueParam.option == "value") {
                    self.nextStep();
                }
            };
            
            self.nextStep = function(e) {
                try {
                    var licenseNo = new String(self.licenseNo()).toString();
                    if (typeof licenseNo !== "undefined" && licenseNo.length > 0) {
                        var licenseNo = replaceAll(licenseNo, " ", "").toUpperCase();
                        self.licenseNo(licenseNo);
                        self.isFocused(true);
                    }
                } catch (ex) {
                    self.isFocused(false);
                }
            };
            
            self.load = function () {
                try {
                    if (typeof self.licenseNo() === "undefined" || self.licenseNo().length <= 0) {
                        ui.showMessageBox(self.lng_error_00021);
                        self.onLicense(true);
                        return;
                    }
                } catch (ex) {
                    ui.showMessageBox(self.lng_error_00021);
                    self.onLicense(true);
                    return;
                }
                if (typeof self.barcode() === "undefined" || self.barcode().length <= 0) {
                    return;
                }
                // parser the license no
                var licenseNo = getLicenseNo();
                self.barcode(self.barcode().toUpperCase());
                
                // debug
                console.log("licenseNo=" + licenseNo);
                console.log("barcode=" + self.barcode());
                
                // batch input on the barcode field handling
                var barcodeList = self.barcode().split(";");
                console.log("barcodeList=" + barcodeList);
                
                // reset the error list
                self.s1ErrorList.removeAll();
                self.s2ErrorList.removeAll();
                self.s3ErrorList.removeAll();
                
                // count the document
                var countDocument = 0;
                var validDocument = [];
                for (var i = 0; i < barcodeList.length; i++) {
                    var truncateBarCode = barcodeList[i].trim();
                    if (barcodeList[i] && truncateBarCode) {
                        countDocument += 1;
                        validDocument.push(truncateBarCode);
                    }
                }
                self.totalDocumentInput(countDocument);
                self.proceedDocumentInput(0);
                
                // proceed those non-empty documents
                for (var i = 0; i < validDocument.length; i++) {
                    if (validDocument[i]) {
                        doLoadingProcess(licenseNo, validDocument[i]);
                    }
                }
            };
            
            self.enableScan = ko.computed(function(){
                var user = app.moduleConfig.params.rootContext.userProfile;
                try {
                    if ((user.salesRole == constant.SR_DRIVER_JLOG || user.salesRole == constant.SR_DRIVER_LINDE)) {
                        return true;
                    } else {
                        return false;
                    }
                } catch (ex) {
                    return false;
                }
            });            
            
            self.scanBarcode = function () {
                if (typeof cordova === "undefined") {
                    console.log("Barcode scan failed - cordova is not defined");
                    return;
                }
                console.log("Barcode scan starting......");
                
                var licenseNo = getLicenseNo();
                
                cordova.plugins.barcodeScanner.scan(
                        function (result) {
                            console.log("barcode: " + result.text);
                            console.log("format: " + result.format);
                            console.log("cancelled: " + result.cancelled);  
                            // reset the error list
                            self.s1ErrorList.removeAll();
                            self.s2ErrorList.removeAll();
                            self.s3ErrorList.removeAll();                            
                            // assume 1 document only
                            self.totalDocumentInput(1);
                            self.proceedDocumentInput(0);      
                            // proceed loading process
                            doLoadingProcess(licenseNo, result.text);
                        },
                        function (error) {
                            alert("Scanning failed: " + error);
                        },
                        {
                            "preferFrontCamera": false, // iOS and Android
                            "showFlipCameraButton": false, // iOS and Android
                            "prompt": "Place a barcode inside the scan area"//, // supported on Android only
                            //"formats" : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                            //"orientation" : "landscape" // Android only (portrait|landscape), default unset so it rotates with the device
                        }
                );
            };            

            self.goBack = function () {
                app.router.go('springboard');
            };

            self.dispose = function (info) {
                self.router.dispose();
            };
            
            // handler for drill in to delivery details
            self.optionChange = function (event, ui) {
                if (ui.option === 'selection' && ui.value[0]) {
                    // ui.value = delivery number
                    console.log("loading.js ui.value=" + ui.value);
                    var proceed = createDeliveryProfile(ui.value);
                    if (proceed) {
                        app.moduleConfig.params.rootContext.fromPage = "loading";
                        app.redirect("loadingDetail", ui.value);
                    }
                }
                
                function createDeliveryProfile(deliveryItemId) {
                    var allLoaded = ko.utils.unwrapObservable(self.allLoaded);
                    var deliveryItem = ko.utils.arrayFirst(allLoaded, function(item) {
                         if (item.DELIVERY_NUMBER == deliveryItemId) {
                             return item;
                         }
                    });
                    if (deliveryItem) {
                        console.log("delivery header=" + ko.toJSON(deliveryItem));
                        var document = deliveryService.createDocument(deliveryItem);
                        console.log("document=" + ko.toJSON(document));
                        app.moduleConfig.params.rootContext.selDeliveryProfile = document;
                        return true;
                    } else {
                        return false;
                    }
                }
            };     
            
            self.onClearSearchText = function () {
                self.clearSearch();
            };

            self.clearSearch = function () {
                var searchTextBox = $('#searchProduct');
                searchTextBox.ojInputText('option', 'value', '');
                searchTextBox.ojInputText("reset");
                self.searchText('');
            };

            self.toggleSearchCanvas = function (/*data, event*/) {
                console.log("toggleSearchCanvas triggered");
                oj.OffcanvasUtils.toggle(searchCanvas);
            };

            self.onSearchTextChange = function (event, data) {
                if (data.option === 'rawValue') {
                    console.log("onSearchTextChange.data.value=" + data.value);
                    self.searchText(data.value);
                    
                    // dirty logic here
                    var loadedFilter = new Array();
                    var recordCnt = 0;
                    try {
                        recordCnt = ko.utils.unwrapObservable(self.allLoaded).length;
                    } catch (ex) {
                    }
                    if (recordCnt > 0) {
                        if (self.searchText().length === 0) {
                            loadedFilter = ko.utils.unwrapObservable(self.allLoaded);
                        } else {
                            var tempArray = ko.utils.unwrapObservable(self.allLoaded);
                            ko.utils.arrayFilter(tempArray, function (r) {
                                var token = self.searchText().toLowerCase();
                                if (r.DELIVERY_NUMBER.toLowerCase().indexOf(token) >= 0) {
                                    loadedFilter.push(r);
                                }
                            });
                        }
                    }
                    self.worklistData(new oj.ArrayTableDataSource(loadedFilter, {idAttribute: 'DELIVERY_NUMBER'}));
                }
            };            
            
            self.isJLogAdmin = ko.computed(function () {
                var user = app.moduleConfig.params.rootContext.userProfile;
                try {
                    if (user.salesRole === constant.SR_ADMIN_JLOG) {
                        return true;
                    }
                    return false;
                } catch (ex) {
                    return false;
                }
            });  
            
            self.isLindeAdmin = ko.computed(function () {
                var user = app.moduleConfig.params.rootContext.userProfile;
                try {
                    if (user.salesRole === constant.SR_ADMIN_LINDE) {
                        return true;
                    }
                    return false;
                } catch (ex) {
                    return false;
                }
            });    
            
            function getLicenseNo() {
                var licenseNo = "";
                if (self.isJLogAdmin() || self.isLindeAdmin()) {
                    licenseNo = new String(ko.utils.unwrapObservable(self.licenseNo)).toString();
                    licenseNo = replaceAll(licenseNo, " ", "").toUpperCase();
                    self.licenseNo(licenseNo);
                } else {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    try {
                        if (user.salesRole == constant.SR_DUMMY) {
                            licenseNo = self.licenseNo();
                        } else {
                            licenseNo = user.licenseNo;
                        }
                        if (licenseNo) {
                            licenseNo = replaceAll(licenseNo, " ", "").toUpperCase();
                        }
                    } catch (ex) {
                        console.log(ex);
                    }
                }
                if (licenseNo) {
                    var pos = licenseNo.indexOf("VAN-");
                    if (pos < 0) {
                        licenseNo = "VAN-" + licenseNo;
                    }
                }
                return licenseNo;
            }
            
            function prepareUI(data, status, documentType, orgUnitId, barcode) {
                data = (Array.isArray(data)) ? data[0] : data;
                console.log("Date retrieve from backend = " + ko.toJSON(data));
                if (data !== null && status == 200) {
                    var respJSON = data[RESPONSE_TABLE];
                    var returnStatus = data['P_RETURN_STATUS'];
                    var carLicenseNo = data['P_MSG_DATA'];
                    if (returnStatus != "S" && returnStatus != "S2") {
                        if (returnStatus == "S1") {
                            // ui.showMessageBox(self.lng_error_00024);
                            self.s1ErrorList.push(barcode);
                        }
                        if (returnStatus == "S3") {
                            // ui.showMessageBox(self.lng_error_00026);
                            self.s3ErrorList.push(barcode);
                        }
                        return;
                    } else if (returnStatus == "S2") {
                        // var params = {'documentNo': barcode, 'carLicenseNo': carLicenseNo};
                        // var lng_error_00025 = oj.Translations.getTranslatedString("ssa.msg.error.ERROR_00025", params);
                        // ui.showMessageBox(lng_error_00025);
                        self.s2ErrorList.push(ko.toJS({'documentNo': barcode, 'carLicenseNo': carLicenseNo}));

                        // stop to load the document into the list
                        var allLoaded = ko.utils.unwrapObservable(self.allLoaded);
                        var document = ko.utils.arrayFirst(allLoaded, function (item) {
                            if (item.DELIVERY_NUMBER == barcode) {
                                return item;
                            }
                        });
                        if (document && typeof document !== "undefined") {
                            console.log("document=" + ko.toJSON(document));
                            return;
                        }
                    }
                    
                    // var loadedFilter = ko.observableArray([]);
                    var loadedFilter = ko.utils.unwrapObservable(self.allLoaded);
                    
                    var recordCnt = 0;
                    try {
                        recordCnt = ko.utils.unwrapObservable(self.allLoaded).length;
                        console.log("recordCnt=" + recordCnt);
                    } catch (ex) {
                    }
                    
                    ko.utils.arrayMap(respJSON, function (item) {
                        try {
                           var deliveryDate = commonHelper.formatStrDate(item.DELIVERY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                           if (deliveryDate == constant.BLANK_DATE) {
                               item.DELIVERY_DATE = "";
                           } else {
                               item.DELIVERY_DATE = commonHelper.formatStrDate(item.DELIVERY_DATE, "YYYY-MM-DDTHH:mm:ss.sssZ", "DD-MMM-YYYY").toUpperCase();
                           }
                        } catch (ex) {
                        }   
                        item.DELIVERY_ADDRESS = (item.DELIVERY_ADDRESS == "-1") ? "" : item.DELIVERY_ADDRESS;
                        item.CAR_PLATE_NUMBER = (item.CAR_PLATE_NUMBER == "-1") ? "" : item.CAR_PLATE_NUMBER;
                        item.DOCUMENT_TYPE = documentType;
                        item.ORG_UNIT_ID = orgUnitId;
                        item.P_SHIPMENT_DETAILS_TBL_ITEM = data['P_SHIPMENT_DETAILS_TBL_ITEM'];
                        
                        if (recordCnt > 0) { 
                            loadedFilter.splice(0, 0, item);  // add to the top list
                        } else {
                            loadedFilter.push(item);
                        }
                    });
                    self.worklistData(new oj.ArrayTableDataSource(loadedFilter, {idAttribute: 'DELIVERY_NUMBER'}));

                    self.allLoaded = loadedFilter;
                }
            }
            
            function doLoadingProcess(licenseNo, barcode) {
                // parser the barcode
                var parserData = parserBarcode(barcode);
                if (parserData) {
                    ui.showBusy();
                    
                    var documentType = parserData.DOCUMENT_TYPE;
                    var barcodeNo = parserData.NUMBER;
                    var orgUnitId = parserData.ORG_UNIT_ID;

                    var payload = getLoadingPayload(orgUnitId, documentType, licenseNo, barcodeNo);
                    console.log("goods loading payload =" + ko.toJS(payload));

                    var cbSuccessFn = function (data, xhr) {
                        try {
                            prepareUI(data, xhr.status, documentType, orgUnitId, barcode);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            // clear the barcode number
                            self.barcode(null);
                            // document.getElementById("text-barcode").focus();
                            ui.hideBusy();
                            console.log("cbSuccessFn called");
                        }
                    };
                    var cbFailFn = function (data, xhr) {
                        console.log("cbFailFn failed");
                        prepareUI(data, xhr.status, documentType, orgUnitId, barcode);
                        ui.hideBusy();
                    };
                    service.getLoadingMessage(payload).then(cbSuccessFn, cbFailFn).then(function() {
                        self.proceedDocumentInput(self.proceedDocumentInput() + 1);
                        if (self.proceedDocumentInput() == self.totalDocumentInput()) {
                            console.log("All document(s) completed");
                            self.showError(true);
                            self.showError(false);
                        } else {
                            self.showError(false);
                        }
                    });
                }
            }
            
            function getLoadingPayload(orgUnitId, documentType, licenseNo, barcodeNo) {
                 return service.getPayload(orgUnitId, documentType, licenseNo, barcodeNo);
            }
            
            function parserBarcode(barcode) {
                if (typeof barcode === "undefined" || !barcode) {
                    return;
                }
                /////////////////////////////////////////////////
                // Pattern 
                // Delivery Note: S999999999
                // Pick Up:       9999-9999999999 
                /////////////////////////////////////////////////
                var prefix = barcode.substring(0,1);
                var orgUnitId = barcode.substring(0, 4);
                var hypenPos = barcode.indexOf("-");
                var charSPos = chkAlphabet(prefix);
                
                if (charSPos >= 0 || hypenPos < 0) {
                    // ORG_UNIT_ID is dummy
                    if (charSPos >= 0) {
                        return {"ORG_UNIT_ID": constant.ORG_UNIT_ID_BEER, "DOCUMENT_TYPE": constant.DOCUMENT_TYPE_DELIVERY_NOTE, "NUMBER": barcode.substring(1)};
                    } else {
                        return {"ORG_UNIT_ID": constant.ORG_UNIT_ID_BEER, "DOCUMENT_TYPE": constant.DOCUMENT_TYPE_DELIVERY_NOTE, "NUMBER": barcode.substring(0)};
                    }
                } else {
                    return {"ORG_UNIT_ID":orgUnitId, "DOCUMENT_TYPE": constant.DOCUMENT_TYPE_PICKUP, "NUMBER": barcode.substring(5)};
                } 
            }
            
            function chkAlphabet(inputtxt)
            {
                var letters = /^[a-zA-Z]+$/;
                if (inputtxt.match(letters)) {
                    return 0;
                } else {
                    return -1;
                }
            }  
            
            function initTranslations() {
                // language translations
                var getTranslation = oj.Translations.getTranslatedString;
                self.lng_title = getTranslation("ssa.loading.title");
                self.lng_license = getTranslation("ssa.loading.license");
                self.lng_barcode = getTranslation("ssa.loading.barcode");
                self.lng_continue = getTranslation("ssa.loading.continue");
                self.lng_error_00021 = getTranslation("ssa.msg.error.ERROR_00021");
                self.lng_searchPlaceHolder = getTranslation("ssa.header.search");
                self.lng_primaryText = getTranslation("ssa.pullToRefreshUtils.primaryText");
                self.lng_secondaryText = getTranslation("ssa.pullToRefreshUtils.secondaryText");          
                self.lng_error_00024 = getTranslation("ssa.msg.error.ERROR_00024");
                self.lng_error_00025 = getTranslation("ssa.msg.error.ERROR_00025");
                self.lng_error_00026 = getTranslation("ssa.msg.error.ERROR_00026");
                self.lng_error_00028 = getTranslation("ssa.msg.error.ERROR_00028");
            }
            
            init();
            
            
            $(document).ready(
                    function ()
                    {
                        try {
                            document.getElementById("oj-combobox-input-text-licenseNo").focus();
                        } catch (ex) {
                            
                        }
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
        
        return new LoadingViewModel();
    }
);