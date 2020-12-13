define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'util/appui', 'util/devmode',
    'ojs/ojknockout', 'ojs/ojtabs', 'ojs/ojgauge', 'ojs/ojtable', 'ojs/ojarraytabledatasource'],
        function (oj, ko, $, app, ui, devMode) {

            function SalesCustomerViewModel() {
                var self = this;

                initTranslation();

                self.headerTitle = ko.observable();
                self.headerTitle(self.lng_salesCloudCustomer);
                self.allCustomers = ko.observableArray();

                ui.showBusy();

                function getCustomerListMessage() {
                    
                    console.log("getCustomerListMessage");
                    var defer = $.Deferred();
                    
                    // run mock data if development mode is on
                    if (devMode.isEnabled() && devMode.isOffline()) {
                        $.getJSON("js/app/pages/customer/salescustomerMock.json", function (data) {
                            setTimeout(function () {
                                defer.resolve(data, {status: 200});
                            }, 500); // simulate delay
                        });
                        return $.when(defer);
                    }
                    
                    console.log("[Amplify Storage] getSalesCustomer");
                    amplify.request({
                        resourceId: 'getSalesCustomer',
                        success: defer.resolve,
                        error: defer.reject,
                        data: '{}'
                    });            
                    
                    return  $.when(defer);
                }

                var cbSuccessFn = function (data, xhr) {
                    
                    console.log("data = " + ko.toJSON(data));
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
                getCustomerListMessage().then(cbSuccessFn, cbFailFn);


                function prepareUI(data, status) {
                    if (data !== null && status == 200) {
                        var respJSON = data["OutputParameters"];
                        self.allCustomers(respJSON);
                    }

                    ui.hideBusy();
                }


                self.goBack = function () {
                    app.redirect("springboard");
                };
                
                function initTranslation() {
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_salesCloudCustomer = getTranslation("ssa.salescustomer.salesCloudCustomer");
                    self.lng_organizationName = getTranslation("ssa.salescustomer.organizationName");
                    self.lng_partyNumber = getTranslation("ssa.salescustomer.partyNumber");
                }
            }

            return SalesCustomerViewModel;
        }
);
