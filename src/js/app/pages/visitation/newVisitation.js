define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/visitation/visitationService',
    'util/appui', 'pages/common/constant', 'util/commonhelper',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojdatetimepicker', 'ojs/ojtimezonedata',
    'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojnavigationlist', 'promise'],
        function (oj, ko, $, app, service, ui, constant, commonHelper) {

            function NewVisitationViewModel() {
                var self = this;

                console.log("NewVisitationViewModel");

                // router configuration
                self.router = app.router;

                /**
                 * Observable Arrays
                 */
                // add the Quotation for WINE salesman
                var user = app.moduleConfig.params.rootContext.userProfile;
                app.populateDefaultNavPath(user);

                self.navDataSource = app.navDataSource;
                self.navChangeHandler = app.navChangeHandler;
                self.navStateId = ko.observable();
      
                self.subject = ko.observable();
                self.person = ko.observable();
                self.purpose = ko.observable();
                self.availablePurpose = ko.observableArray(constant.VISITATION_PURPOSE_LIST);                    
                self.start = ko.observable();
                self.end = ko.observable();
                self.outletName = ko.observable();
                self.description = ko.observable();
                self.location = ko.observable();
                self.status = ko.observable();
                self.headerTitle = ko.observable();
                self.minStartDate = ko.observable();
                self.minEndDate = ko.observable();
                self.availableStatus = ko.observableArray();
                self.statusDesc = ko.computed(function() {
                    var status = self.status();
                    if (self.status() == constant.VISITATION_STATUS_NOT_STARTED) {
                        status = "NOT STARTED";
                    } else if (self.status() == constant.VISITATION_STATUS_FOLLOW_UP) {
                        status = "FOLLOW-UP";
                    } else if (self.status() == constant.VISITATION_STATUS_IN_PROGRESS) {   
                        status = "IN PROGRESS";
                    }  else if (self.status() == constant.VISITATION_STATUS_ON_HOLD) {   
                        status = "ON HOLD";  
                    }
                    return status;
                });                
                
                self.dataFormat = ko.observable("yyyy/MM/dd HH:mm");
                self.dateConverter = ko.observable(
                        oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_DATETIME).createConverter(
                        {
                            pattern: self.dataFormat()
                        }));                
                
                self.large = ko.computed(function () {
                    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
                    return oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
                });    
                
                self.handleActivated = function (info) {
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];

                    var childRouter = parentRouter.getChildRouter("visitationDetail");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('visitationDetail');
                    }
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    console.log("visitationDetail.js stateId=" + stateId);
                                }
                            });
                            return state;
                        }
                    });

                    initTranslations();
                    
                    init();
                    
                    setupHeaderTitle();
                    
                    // set the current state of Navigation Bar (Order, Profile, Visit and Quotation)
                    self.navStateId(app.moduleConfig.params.rootContext.navStateId);
                    
                    return oj.Router.sync();
                };
                
                
                function init() {
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    self.outletName(ko.utils.unwrapObservable(customerProfile.outletName));
                    self.location(ko.utils.unwrapObservable(customerProfile.billToAddress));
                    self.status(constant.VISITATION_STATUS_DEFAULT);
                    // self.purpose(constant.VISITATION_PURPOSE_DEFAULT);
                    self.minStartDate(commonHelper.getClientCurrentDate("YYYY-MM-DD"));
                    self.minEndDate(commonHelper.getClientCurrentDate("YYYY-MM-DD"));
                    self.start(commonHelper.getClientCurrentDate("YYYY-MM-DDTHH:mm:ss"));
                    var endDate = moment(self.start(), "YYYY-MM-DDTHH:mm:ss").add(1, 'hours').format("YYYY-MM-DDTHH:mm:ss");
                    self.end(endDate);
                    // self.end(commonHelper.getClientCurrentDate("YYYY-MM-DDTHH:mm:ss"));
                    
                    // Start Date 
                    self.start.subscribe(function (newDate) {
                        var endDate = self.end();
                        var toDate = moment(endDate, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DD");
                        var toTime = moment(endDate, "YYYY-MM-DDTHH:mm:ss").format("HH:mm:ss");
                        
                        var frDate = moment(newDate, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DD");
                        var frTime = moment(newDate, "YYYY-MM-DDTHH:mm:ss").format("HH:mm:ss");
                        
                        if (frTime > toTime) {
                            self.end(frDate + 'T' + frTime);
                        } else {
                            self.end(frDate + 'T' + toTime);
                        }
                    });
                    // End Date
                    self.end.subscribe(function (newDate) {
                        var toDate = moment(newDate, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DD");
                        var toTime = moment(newDate, "YYYY-MM-DDTHH:mm:ss").format("HH:mm:ss");
                        
                        var startDate = self.start();
                        var frDate = moment(startDate, "YYYY-MM-DDTHH:mm:ss").format("YYYY-MM-DD");
                        var frTime = moment(startDate, "YYYY-MM-DDTHH:mm:ss").format("HH:mm:ss");
                        
                        if (frTime > toTime) {
                            self.start(toDate + 'T' + toTime);
                        } else {
                            self.start(toDate + 'T' + frTime);
                        }
                    });        
                    // populate the status
                    var getTranslation = oj.Translations.getTranslatedString;
                    ko.utils.arrayForEach(constant.VISITATION_STATUS_LIST, function(item) {
                         self.availableStatus.push(ko.toJS({value: item.value, label: getTranslation(item.label)}));
                    });
                }
                
                function setupHeaderTitle() {
                    var outletName = ko.utils.unwrapObservable(self.outletName);
                    if (!ko.utils.unwrapObservable(self.large())) {
                        if (outletName.length > constant.TITLE_LENGTH) {
                            outletName = outletName.substring(0, constant.TITLE_LENGTH) + "...";
                        }
                    }
                    self.headerTitle(outletName);
                }


                /**
                 * Actions
                 */
                self.update = function (data, event) {
                    if (!confirm(self.lng_confirm)) {
                        return;
                    }
                    if (!self.subject()) {
                        ui.showMessageBox(self.lng_error_00034);
                        return;
                    }
                    if (!self.person()) {
                        ui.showMessageBox(self.lng_error_00035);
                        return;                        
                    }
                    if (!self.purpose()) {
                        ui.showMessageBox(self.lng_error_00036);
                        return;                        
                    }                    
                    console.log("create a new visitation record");
                    var payload = getPayload();
                    console.log("payload = " + ko.toJS(payload));
                    ui.showBusy();
                    
                    service.createVisitationMessage(payload).done(function(data, xhr) {
                        console.log("raw data = " + ko.toJSON(data));
                        ui.hideBusy();
                        if (data && xhr.status == 200) {
                            var respJSON = data['outputCreateVisitation'];
                            var returnStatus = respJSON['returnStatus'];
                            if (returnStatus != 'S') {
                                ui.showMessageBox(self.lng_error_00033);
                            } else {
                                ui.showMessageBox(self.lng_createSuccess);
                                app.moduleConfig.params.rootContext.isRefreshVisitation = true;
                                app.router.go('visitation');                                
                            }
                        }
                    }).fail(function(data, xhr) {
                        console.log("create visitation failed");
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00033);
                    });
                };

                self.goBack = function () {
                    app.go("visitation");
                };

                self.dispose = function (info) {
                    self.router.dispose();
                };
                
                function getPayload() {
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    var customerProfile = app.moduleConfig.params.rootContext.selCustomerProfile;
                    // customerProfile.accountNumber = "8000052";
                    // customerProfile.shipToSiteId = "312198";                    
                    console.log("customerProfile = " + ko.toJSON(customerProfile));
                    var dateFrom = null;
                    var dateTo = null;
                    
                    if (self.start()) {
                        dateFrom = commonHelper.formatStrDateToISO(self.start(), "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DDTHH:mm:ssZ");
                    }
                    if (self.end()) {
                        dateTo = commonHelper.formatStrDateToISO(self.end(), "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DDTHH:mm:ssZ");
                    }
                    
                    var subject = self.subject();
                    var purpose = self.purpose();
                    if (Array.isArray(purpose)) purpose = purpose[0];
                    var description = self.description();
                    if (!description) description = "";
                    var visitPerson = self.person();
                    var status = self.status();
                    if (Array.isArray(status)) status = status[0];
                    
                    var payload = JSON.stringify({
                        "InputCreateVisitation": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "P_ORG_ID": user.orgUnitId,
                            "P_SALESREP_ID": user.erpSalesId,
                            "ACCOUNT_NUMBER": ko.utils.unwrapObservable(customerProfile.accountNumber),
                            "SHIP_TO_SITE_ID": ko.utils.unwrapObservable(customerProfile.shipToSiteId),
                            "SUBJECT": subject,
                            "PURPOSE": purpose,
                            "START_DATE": dateFrom,
                            "END_DATE": dateTo,
                            "DESCRIPTION": description,
                            "STATUS": status,
                            "VISIT_PERSON": visitPerson
                        }
                    });
                    return payload;
                }

                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_overview = getTranslation("ssa.visitationList.overview");
                    self.lng_visitPerson = getTranslation("ssa.visitationList.visitPerson");                    
                    self.lng_purpose = getTranslation("ssa.visitationList.purpose");
                    self.lng_subject = getTranslation("ssa.visitationList.subject");
                    self.lng_start = getTranslation("ssa.visitationList.start");
                    self.lng_end = getTranslation("ssa.visitationList.end");
                    self.lng_description = getTranslation("ssa.visitationList.description");
                    self.lng_location = getTranslation("ssa.visitationList.location");
                    self.lng_confirm = getTranslation("ssa.visitationList.confirmCreate");
                    self.lng_createSuccess = getTranslation("ssa.msg.info.visitationCreated");
                    self.lng_error_00033 = getTranslation("ssa.msg.error.ERROR_00033");
                    self.lng_error_00034 = getTranslation("ssa.msg.error.ERROR_00034");
                    self.lng_error_00035 = getTranslation("ssa.msg.error.ERROR_00035");
                    self.lng_error_00036 = getTranslation("ssa.msg.error.ERROR_00036");
                }
            }

            ko.bindingHandlers.winsize = {init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    $(window).resize(function () {
                        viewModel.screenWidth($(window).width());
                        viewModel.screenHeight($(window).height());
                    });
                }};

            ko.bindingHandlers.currency = {
                symbol: ko.observable('$'),
                update: function (element, valueAccessor, allBindingsAccessor) {
                    return ko.bindingHandlers.text.update(element, function () {
                        var value = +(ko.utils.unwrapObservable(valueAccessor()) || 0),
                                symbol = ko.utils.unwrapObservable(allBindingsAccessor().symbol === undefined ? allBindingsAccessor().sybmol : '$');
                        return symbol + value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
                    });
                }
            };

            ko.bindingHandlers.readOnly = {
                update: function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor());
                    if (value) {
                        element.setAttribute("readOnly", true);
                    } else {
                        element.removeAttribute("readOnly");
                    }
                }
            };

            return NewVisitationViewModel;
        }
);
