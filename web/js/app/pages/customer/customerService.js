define(["knockout","jquery","util/appui","util/devmode","appController","util/commonhelper","pages/common/constant"],function(e,s,t,r,i,o,a){function l(){function i(e){return this.getCustomerListMessage(e,!1)}function i(i,l){var u=s.Deferred(),n=e.utils.parseJson(i),_=n.InputGetCustomers.P_ORG_ID,b=n.InputGetCustomers.P_SALESREP_ID,I=a.CUSTOMER_LIST_KEY+":"+_+":"+b;if(r.isEnabled()&&r.isOffline())return s.getJSON("js/app/pages/customer/customerListMock.json",function(e){setTimeout(function(){u.resolve(e,{status:200})},500)}),s.when(u);var T=t.getLocalStorage(I);return T&&!l?(console.log("[Local Storage] Customer List - "+I),u.resolve(T,{status:200})):(console.log("[Amplify Request] Customer List - "+I),amplify.request({resourceId:a.CUSTOMER_LIST_KEY,success:u.resolve,error:u.reject,data:i}),t.setLocalStorage(I+":"+a.CUSTOMERS_SYNC_DATETIME,o.getClientCurrentDate(a.DATETIME_FORMAT).toUpperCase()),s.when(u).done(function(e,s,r){t.setLocalStorage(I,e)})),s.when(u)}var l=function(s){this.name=e.observable(s.COMPANY_NAME),this.id=e.observable(s.CUST_ACCOUNT_ID),this.priceListId=e.observable(s.PRICE_LIST_ID),this.shipToSiteId=e.observable(s.SHIP_TO_SITE_ID),this.billToSiteId=e.observable(s.BILL_TO_SITE_ID),this.paymentTermId=e.observable(s.PAYMENT_TERM_ID),this.billToAddress=e.observable(s.BILL_TO_ADDRESS),this.shipToAddress=e.observable(s.SHIP_TO_ADDRESS),this.shipToDistrict=e.observable(s.SHIP_TO_DISTRICT),this.accountNumber=e.observable(s.ACCOUNT_NUMBER),this.outletName=e.observable(s.OUTLET_NAME),"undefined"==typeof e.utils.unwrapObservable(this.billToSiteId)&&this.billToSiteId(e.observable(s.INVOICE_TO_ORG_ID)),"undefined"==typeof e.utils.unwrapObservable(this.id)&&this.id(e.observable(s.SOLD_TO_ORG_ID)),"undefined"==typeof e.utils.unwrapObservable(this.shipToSiteId)&&this.shipToSiteId(e.observable(s.SHIP_TO_ORG_ID)),this.realCustomer=e.observable(s.REAL_CUSTOMER),this.walkInCust=e.observable(s.WALK_IN_CUST),this.salesRepId=e.observable(s.SALESREP_ID),"undefined"!=typeof e.utils.unwrapObservable(this.salesRepId)&&this.salesRepId||this.salesRepId(e.observable(s.SALES_REP_ID)),this.overrideBillToSiteId=e.observable(s.OVERRIDE_BILL_TO),this.overrideSalesRepId=e.observable(s.OVERRIDE_SALES_PERSON)};this.createCustomerProfile=function(e){return new l(e)},this.getCustomerPayload=function(s){var t=e.utils.unwrapObservable(s.outlet_name),r=e.utils.unwrapObservable(s.cust_name);t=t?t:r;var i=JSON.stringify({COMPANY_NAME:r,CUST_ACCOUNT_ID:e.utils.unwrapObservable(s.custAccountId),PRICE_LIST_ID:e.utils.unwrapObservable(s.price_list_id),BILL_TO_SITE_ID:e.utils.unwrapObservable(s.invoice_to_org_id),PAYMENT_TERM_ID:e.utils.unwrapObservable(s.payment_term_id),BILL_TO_ADDRESS:e.utils.unwrapObservable(s.billing_address),SHIP_TO_ADDRESS:e.utils.unwrapObservable(s.shipping_address),SHIP_TO_DISTRICT:e.utils.unwrapObservable(s.ship_to_district),ACCOUNT_NUMBER:e.utils.unwrapObservable(s.accountNumber),OUTLET_NAME:t,REAL_CUSTOMER:e.utils.unwrapObservable(s.real_customer),WALK_IN_CUST:"N",SALESREP_ID:e.utils.unwrapObservable(s.sales_rep_id)});return e.utils.parseJson(i)},this.getCustomerListMessage=function(e){return i(e)},this.refreshCustomerListMessage=function(e){return i(e,!0)}}return new l});