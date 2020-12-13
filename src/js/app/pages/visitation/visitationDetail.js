define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/visitation/visitationService',
    'util/appui', 'pages/common/constant', 'util/commonhelper',
    'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojdatetimepicker', 'ojs/ojtimezonedata',
    'ojs/ojinputnumber', 'ojs/ojselectcombobox', 'ojs/ojnavigationlist', 'promise'],
        function (oj, ko, $, app, service, ui, constant, commonHelper) {

            function VisitationDetailViewModel() {
                var self = this;

                console.log("VisitationDetailViewModel");

                // router configuration
                self.router = app.router;

                /**
                 * Observable Arrays
                 */
                self.id = ko.observable();
                self.subject = ko.observable();
                self.person = ko.observable();
                self.purpose = ko.observable();
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
                    
                    return oj.Router.sync();
                };
                
                
                function init() {
                    var data = app.moduleConfig.params.rootContext.selVisitation;
                    console.log("data = " + ko.toJSON(data));
                    self.id(data.ACTIVITY_ID);
                    self.subject(data.SUBJECT);
                    self.person(data.VISIT_PERSON);
                    self.purpose(data.PURPOSE);
                    self.outletName(data.OUTLET_NAME);
                    self.location(data.LOCATION);
                    self.start(data.START_DATE);
                    self.end(data.END_DATE);
                    self.description(data.DESCRIPTION);
                    self.status(data.STATUS);
                    self.minStartDate(data.START_DATE);
                    self.minEndDate(data.END_DATE);
                    // populate the status
                    var getTranslation = oj.Translations.getTranslatedString;
                    ko.utils.arrayForEach(constant.VISITATION_STATUS_LIST, function(item) {
                         self.availableStatus.push(ko.toJS({value: item.value, label: getTranslation(item.label)}));
                    });
                }
                
                function setupHeaderTitle() {
                    var outletName = self.outletName();
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
                    console.log("update the visitation record");
                    var payload = getPayload();
                    console.log("payload = " + ko.toJS(payload));
                    ui.showBusy();
                    
                    service.updateVisitationMessage(payload).done(function(data, xhr) {
                        console.log("raw data = " + ko.toJSON(data));
                        ui.hideBusy();
                        if (data && xhr.status == 200) {
                            var respJSON = data['outputUpdateVisitation'];
                            var returnStatus = respJSON['returnStatus'];
                            if (returnStatus != 'S') {
                                ui.showMessageBox(self.lng_error_00032);
                            } else {
                                ui.showMessageBox(self.lng_updateSuccess);
                                app.moduleConfig.params.rootContext.isRefreshVisitation = true;
                                app.router.go('visitation');                                
                            }
                        }
                    }).fail(function(data, xhr) {
                        console.log("update visitation failed");
                        ui.hideBusy();
                        ui.showMessageBox(self.lng_error_00032);
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
                    console.log("customerProfile = " + ko.toJSON(customerProfile));
                    
                    var activityId = self.id();
                    var description = self.description();
                    var status = self.status();
                    if (Array.isArray(status)) status = status[0];
                    
                    var payload = JSON.stringify({
                        "InputUpdateVisitation": {
                            "HeaderInfo": {
                                "UserID": user.username,
                                "UserRole": user.salesRole,
                                "CallerID": ""
                            },
                            "ACTIVITY_ID": activityId,
                            "DESCRIPTION": description,
                            "STATUS": status
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
                    self.lng_status = getTranslation("ssa.visitationList.status");
                    self.lng_description = getTranslation("ssa.visitationList.description");
                    self.lng_location = getTranslation("ssa.visitationList.location");
                    self.lng_confirm = getTranslation("ssa.visitationList.confirmCreate");
                    self.lng_updateSuccess = getTranslation("ssa.msg.info.recordSaved");
                    self.lng_error_00032 = getTranslation("ssa.msg.error.ERROR_00032");     
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

            return VisitationDetailViewModel;
        }
);
