/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'appController', 'util/commonhelper', 'pages/common/constant',
], function (ko, $, ui, devMode, app, commonHelper, constant) {

    function CustomerService() {
        
        /* data structure after formatted
          [{
		"attr": {
			"id": "8000074",
			"initial": "A"
		},
		"children": [{
				"attr": {
					"id": "8000074",
					"data": {
						"COMPANY_NAME": "ABERDEEN BOAT CLUB LTD",
						"ORG_ID": "2899",
						"SHIP_TO_SITE_ID": "302197",
						"BILL_TO_ADDRESS": "20, SHUM WAN ROAD,WONG CHUK HANG,,,HK-WONG CHUK HANG",
						"CUST_ACCOUNT_ID": "8000074",
						"PARENT_NAME": "ABERDEEN BOAT CLUB LTD",
                                                "SHIP_TO_DISTRICT": "NT-KWAI CHUNG",
						"BILL_TO_SITE_ID": "302199",
						"PRICE_LIST_ID": "790146",
						"OUTLET_NAME": "ABERDEEN BOAT CLUB LTD",
						"SALESREP_ID": "100318337",
						"ACCOUNT_NUMBER": "8000074",
						"SHIP_TO_ADDRESS": "20, SHUM WAN ROAD,WONG CHUK HANG,,,HK-WONG CHUK HANG"
					}
				}
			}]
        }]
         */

        // CLASS CustomerProfile
        var CustomerProfile = function(data) {
            // data <---- children
            this.name = ko.observable(data.COMPANY_NAME);
            this.id = ko.observable(data.CUST_ACCOUNT_ID);
            this.priceListId = ko.observable(data.PRICE_LIST_ID);
            this.shipToSiteId =ko.observable(data.SHIP_TO_SITE_ID);
            this.billToSiteId = ko.observable(data.BILL_TO_SITE_ID);
            this.paymentTermId = ko.observable(data.PAYMENT_TERM_ID);
            this.billToAddress = ko.observable(data.BILL_TO_ADDRESS);
            this.shipToAddress = ko.observable(data.SHIP_TO_ADDRESS);
            this.shipToDistrict = ko.observable(data.SHIP_TO_DISTRICT);
            this.accountNumber = ko.observable(data.ACCOUNT_NUMBER);
            this.outletName = ko.observable(data.OUTLET_NAME);
            // for data offline
            if (typeof ko.utils.unwrapObservable(this.billToSiteId) === "undefined") {
                this.billToSiteId( ko.observable(data.INVOICE_TO_ORG_ID) ); // bill to site id
            }
            if (typeof ko.utils.unwrapObservable(this.id) === "undefined" ) {
                this.id(ko.observable(data.SOLD_TO_ORG_ID)); // customer id
            }
            if (typeof ko.utils.unwrapObservable(this.shipToSiteId) === "undefined" ) {
                this.shipToSiteId(ko.observable(data.SHIP_TO_ORG_ID)); // ship to shite id 
            }
            this.realCustomer = ko.observable(data.REAL_CUSTOMER);
            this.walkInCust = ko.observable(data.WALK_IN_CUST);
            this.salesRepId = ko.observable(data.SALESREP_ID);
            if (typeof ko.utils.unwrapObservable(this.salesRepId) === "undefined" || !this.salesRepId) {
                this.salesRepId( ko.observable(data.SALES_REP_ID) ); // Sales Rep Id
            }            
            this.overrideBillToSiteId = ko.observable(data.OVERRIDE_BILL_TO);
            this.overrideSalesRepId = ko.observable(data.OVERRIDE_SALES_PERSON); 
        };
    
        this.createCustomerProfile = function (data) {
            return new CustomerProfile(data);
        };
        
        this.getCustomerPayload = function (order) {
            var outlet_name = ko.utils.unwrapObservable(order.outlet_name);
            var cust_name = ko.utils.unwrapObservable(order.cust_name);
            outlet_name = (outlet_name) ? outlet_name : cust_name;
            
            var payload = JSON.stringify({
                "COMPANY_NAME": cust_name,
                "CUST_ACCOUNT_ID": ko.utils.unwrapObservable(order.custAccountId),
                "PRICE_LIST_ID": ko.utils.unwrapObservable(order.price_list_id),
                "BILL_TO_SITE_ID": ko.utils.unwrapObservable(order.invoice_to_org_id),
                "PAYMENT_TERM_ID": ko.utils.unwrapObservable(order.payment_term_id),
                "BILL_TO_ADDRESS": ko.utils.unwrapObservable(order.billing_address),
                "SHIP_TO_ADDRESS": ko.utils.unwrapObservable(order.shipping_address),
                "SHIP_TO_DISTRICT": ko.utils.unwrapObservable(order.ship_to_district),
                "ACCOUNT_NUMBER": ko.utils.unwrapObservable(order.accountNumber),
                "OUTLET_NAME": outlet_name,
                "REAL_CUSTOMER": ko.utils.unwrapObservable(order.real_customer),
                "WALK_IN_CUST": "N",
                "SALESREP_ID": ko.utils.unwrapObservable(order.sales_rep_id)
            });
            return ko.utils.parseJson(payload);
        };        
        
        function getCustomerListMessage(payload) {
            return this.getCustomerListMessage(payload, false);
        }
        
        function getCustomerListMessage(payload, refresh) {
            var defer = $.Deferred();
            
            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var P_ORG_ID = parser.InputGetCustomers.P_ORG_ID;
            var P_SALESREP_ID = parser.InputGetCustomers.P_SALESREP_ID;

            // define the key for local storage
            var key = constant.CUSTOMER_LIST_KEY + ":" + P_ORG_ID + ":" + P_SALESREP_ID;
            
            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/customer/customerListMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
                return $.when(defer);
            }
            
            var data = ui.getLocalStorage(key);
            if (data && !refresh) {
                console.log("[Local Storage] Customer List - " + key);
                defer.resolve(data, {status:200});
            } else {
                console.log("[Amplify Request] Customer List - " + key);
                amplify.request({
                    resourceId: constant.CUSTOMER_LIST_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });
                
                // store the last sync datetime of customer list to local storage
                ui.setLocalStorage(key + ":" + constant.CUSTOMERS_SYNC_DATETIME, 
                    commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());
                    
                // store the customer list to local storage by amplify
                $.when(defer).done(function (d, textStatus, jqXHR) {
                    ui.setLocalStorage(key, d);
                });
            }
            return $.when(defer);
        };

        this.getCustomerListMessage = function(payload) {
            return getCustomerListMessage(payload);
        };     
        
        this.refreshCustomerListMessage = function(payload) {
            return getCustomerListMessage(payload, true);
        };

    }

    return new CustomerService();
});
