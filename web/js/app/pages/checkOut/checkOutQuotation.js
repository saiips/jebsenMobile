define(["ojs/ojcore","knockout","jquery","appController","pages/checkOut/checkOutService","pages/common/cartService","pages/newOrder/newOrderService","util/appui","util/commonhelper","pages/common/constant","pages/common/maintenance","ojs/ojrouter","ojs/ojknockout","ojs/ojinputtext","ojs/ojbutton","ojs/ojinputnumber","ojs/ojselectcombobox","ojs/ojdatetimepicker"],function(e,t,o,r,a,n,s,i,l,u,c){function d(){function d(){var e=r.moduleConfig.params.rootContext.selCustomerProfile,o=t.utils.unwrapObservable(e.priceListId),a=r.moduleConfig.params.rootContext.userProfile,n=t.utils.unwrapObservable(a.orgUnitId),s=[],i=[];s.push(o);for(var l=0;l<s.length;l++)i.push({PRICE_LIST_ID:s[l]});var u=JSON.stringify({InputGetPriceList:{HeaderInfo:{UserID:a.username,UserRole:a.salesRole,CallerID:""},P_ORG_ID:n,P_PRICE_LIST_ID_TBL:{P_PRICE_LIST_ID_TBL_ITEM:i}}});return console.log("price list payload = "+t.toJS(u)),u}function m(){I=r.moduleConfig.params.rootContext.selCustomerProfile,w=r.moduleConfig.params.rootContext.userProfile,E=r.moduleConfig.params.rootContext.outLetId}function _(){y.cart.removeAll(),y.real_customer(""),y.remarks(""),y.order_date(""),y.ship_to_district(""),y.shipping_address(""),y.billing_address(""),y.attention(""),y.salesTerms(u.SALES_TERMS_DIRECT_SALES),y.availableSalesTerms.removeAll(),y.showRealCustomer=t.computed(function(){return"Y"==t.utils.unwrapObservable(I.walkInCust)})}function g(){console.log("init called"),m();var e="Y"==r.moduleConfig.params.rootContext.fromModifier;if(e)y.cart.removeAll(),b(t),r.moduleConfig.params.rootContext.fromModifier="N";else{i.showBusy(),_(),C();var t;s.getPriceListMessage(d()).done(function(e){console.log("Customer Price List is ready."),e&&(t=e.P_PRICE_LIST_TBL_ITEM)}).then(function(){v(),b(t),i.hideBusy()})}}function b(e){y.targetCart=r.moduleConfig.params.rootContext.originalQuotationCart,console.log("self.targetCart = "+t.toJSON(y.targetCart));for(var a=t.utils.unwrapObservable(y.targetCart),s=a.length,i=0;i<s;i++){e&&o.each(e,function(e,o){o.INVENTORY_ITEM_ID==t.utils.unwrapObservable(a[i].product().id)&&a[i].product().price(o.UNIT_PRICE)});var l=n.cloneCartItem(a[i]);console.log("cart_item = "+t.toJSON(l)),y.cart.push(l)}}function v(){y.cust_name(t.utils.unwrapObservable(I.name)),y.purchase_order(""),y.real_customer(""),y.remarks(""),y.delivery_cost(0),y.shipping_address(""),y.billing_address(""),y.ship_to_district(""),y.order_date(l.getClientCurrentDate()),y.startDate(""),y.endDate(""),y.attention("");var o=e.Translations.getTranslatedString;if(t.utils.arrayForEach(u.SALES_TERMS_LIST,function(e){y.availableSalesTerms.push(t.toJS({value:e.value,label:o(e.label)}))}),r.moduleConfig.params.rootContext.isExpressCopy||r.moduleConfig.params.rootContext.isCopyQuotation){var a=n.getQuotation();console.log("quotation="+t.toJSON(a)),y.real_customer(a.real_customer()),y.remarks(a.remarks()),y.attention(a.attention()),y.salesTerms(a.salesTerm())}}function p(e){return e==u.ORG_UNIT_ID_WINE?u.SHIP_FROM_ORG_ID_2922:e==u.ORG_UNIT_ID_BEER?u.SHIP_FROM_ORG_ID_2920:void 0}function f(e){console.log("prepareQuotation quotationId="+e);var o=n.getQuotation(),r=n.createQuotation(o);r.cust_name(t.utils.unwrapObservable(I.name)),r.sold_to_org_id(t.utils.unwrapObservable(I.id)),r.ship_to_org_id(t.utils.unwrapObservable(I.shipToSiteId)),r.invoice_to_org_id(t.utils.unwrapObservable(I.billToSiteId)),r.price_list_id(t.utils.unwrapObservable(u.PRICE_ID_WINE)),r.quotation_date(l.getClientCurrentDate("YYYY/MM/DD")),r.sold_from_org_id(t.utils.unwrapObservable(w.orgUnitId)),r.ship_from_org_id(p(t.utils.unwrapObservable(w.orgUnitId))),r.sales_rep_id(t.utils.unwrapObservable(w.erpSalesId)),r.transactional_curr_code("HKD"),r.payment_term_id(t.utils.unwrapObservable(I.paymentTermId)),r.remarks(t.utils.unwrapObservable(y.remarks)),r.real_customer(t.utils.unwrapObservable(y.real_customer));var a=t.utils.unwrapObservable(y.salesTerms);return Array.isArray(a)&&(a=a[0]),r.salesTerm(a),r.attention(t.utils.unwrapObservable(y.attention)),"null"!=e&&"-1"!=e&&"undefined"!=typeof e&&e?r.oe_header_id(e):r.oe_header_id(null),r}function O(e){var o=f(e);return console.log("newQuotation = "+t.toJSON(o)),a.getCreateQuotationPayload(o,y.cart,t.utils.unwrapObservable(y.startDate),t.utils.unwrapObservable(y.endDate))}function C(){var e=r.moduleConfig.params.rootContext.userProfile.salesRole,t=r.moduleConfig.params.rootContext.userProfile.orgUnitId;e==u.SR_SALE_VAN||t==u.ORG_UNIT_ID_BEER?y.isShowLotNumber(!1):y.isShowLotNumber(!0)}function R(e){console.log("proceedQuotation"),i.showBusy();var o="OutputCreateQuotation",n=O(e);console.log("payload = "+t.toJS(n));var s=function(e,a){try{console.log("raw data returned = "+t.toJSON(e)),i.hideBusy();var n=e[o].ReturnStatus,s=e[o].ReturnMessage;if("S"==n||"W"==n){i.showMessageBox("Your quotation is received and being processed.");var l=r.moduleConfig.params.rootContext.custId;r.moduleConfig.params.rootContext.requireRefresh=!0,r.redirect("quotation",l)}else i.showMessageBox(s)}catch(e){i.hideBusy(),i.showMessageBox("Your quotation cannot be processed. Please re-try it later."),console.error(e)}finally{console.log("cbSuccessFn called")}},l=function(e,t){console.log("cbFailFn failed"),i.hideBusy(),i.showMessageBox("Your quotation cannot be processed. Please re-try it later.")};a.createQuotationMessage(n).then(s,l)}function h(){var t=e.Translations.getTranslatedString;y.lng_checkOut=t("ssa.checkOut.checkOut"),y.lng_overview=t("ssa.checkOut.overview"),y.lng_orderDate=t("ssa.checkOut.orderDate"),y.lng_totalItems=t("ssa.checkOut.totalItems"),y.lng_total=t("ssa.checkOut.total"),y.lng_remarks=t("ssa.checkOut.remarks"),y.lng_itemDetail=t("ssa.checkOut.itemDetail"),y.lng_lot=t("ssa.checkOut.lot"),y.lng_qty=t("ssa.checkOut.qty"),y.lng_confirmPlaceQuotation=t("ssa.checkOut.confirmProceed"),y.lng_placeQuotation=t("ssa.checkOut.placeQuotation"),y.lng_realCustomer=t("ssa.checkOut.realCustomer"),y.lng_overridePriceQuotation=t("ssa.checkOut.quotation.period"),y.lng_startDate=t("ssa.checkOut.quotation.startDate"),y.lng_endDate=t("ssa.checkOut.quotation.endDate"),y.lng_ERROR_00005=t("ssa.msg.error.ERROR_00005"),y.lng_ERROR_00007=t("ssa.msg.error.ERROR_00007"),y.lng_ERROR_00018=t("ssa.msg.error.ERROR_00018"),y.lng_ERROR_00019=t("ssa.msg.error.ERROR_00019"),y.lng_ERROR_00041=t("ssa.msg.error.ERROR_00041"),y.lng_maintenance=t("ssa.msg.info.maintenance"),y.lng_attention=t("ssa.quotationDetail.attention"),y.lng_salesTerms=t("ssa.quotationDetail.salesTerms")}var I,w,E,y=this;y.router=r.router,console.log("CheckOutQuotationViewModel"),y.cust_name=t.observable(),y.order_no=t.observable(),y.purchase_order=t.observable(),y.order_date=t.observable(),y.real_customer=t.observable(),y.remarks=t.observable(),y.delivery_cost=t.observable(),y.shipping_address=t.observable(),y.billing_address=t.observable(),y.status=t.observable(),y.currQuotationId=t.observable(),y.ship_to_district=t.observable(),y.isShowLotNumber=t.observable(!0),y.headerTitle=t.observable(""),y.startDate=t.observable(),y.endDate=t.observable(),y.minStartDate=t.observable(l.getClientCurrentDate("YYYY-MM-DD")),y.minEndDate=t.observable(l.getClientCurrentDate("YYYY-MM-DD")),y.attention=t.observable(),y.salesTerms=t.observable(),y.availableSalesTerms=t.observableArray(),y.cart=t.observableArray(),y.targetCart=t.observableArray(),y.dataFormat=t.observable("yyyy/MM/dd"),y.dateConverter=t.observable(e.Validation.converterFactory(e.ConverterFactory.CONVERTER_TYPE_DATETIME).createConverter({pattern:y.dataFormat()})),y.handleActivated=function(o){var a=o.valueAccessor().params.ojRouter.parentRouter;console.log("checkOutQuotation.js parentRouter="+a.currentState().value);var n=a.getChildRouter("checkOutQuotation");n||(n=a.createChildRouter("checkOutQuotation")),y.router=n.configure(function(t){if(t){var o=new e.RouterState(t,{value:t,enter:function(){y.currQuotationId(t),console.log("checkOutQuotation.js stateId ="+t)}});return o}});var s=r.moduleConfig.params.rootContext.selCustomerProfile;if("undefined"!=typeof s){var i=t.utils.unwrapObservable(s.outletName);t.utils.unwrapObservable(y.large())||i.length>u.TITLE_LENGTH&&(i=i.substring(0,u.TITLE_LENGTH)+"..."),y.headerTitle(i)}else y.headerTitle("");return h(),g(),e.Router.sync()},y.currQuotationId.subscribe(function(e){console.log("newOrderId="+e)}),y.large=t.computed(function(){var t=e.ResponsiveUtils.getFrameworkQuery(e.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);return e.ResponsiveKnockoutUtils.createMediaQueryObservable(t)}),y.isModifierEnabled=t.computed(function(){return!0}),y.modifier=function(e,t){n.setCart(y.cart),r.moduleConfig.params.rootContext.selectedItem=e,r.moduleConfig.params.rootContext.enquiryMode=!1,r.moduleConfig.params.rootContext.quotationId=y.currQuotationId();var o=e.product().id();r.redirect("modifier",o)},y.subtotal=t.computed(function(){var e=0;return o(y.cart()).each(function(o,r){e+=t.utils.unwrapObservable(r.cost())}),e}),y.totalItems=t.computed(function(){var e=0;return o(y.cart()).each(function(t,o){e++}),e}),y.total=t.computed(function(){var e=0,o=t.utils.unwrapObservable(y.delivery_cost),r=t.utils.unwrapObservable(y.subtotal());return e=new Number(o)+r}),y.converter=e.Validation.converterFactory(e.ConverterFactory.CONVERTER_TYPE_NUMBER).createConverter({maximumFractionDigits:2,minimumFractionDigits:2,minimumIntegerDigits:2,style:"decimal",useGrouping:!0}),y.placeOrder=function(e,t){console.log("clicked placeOrder");var o=c.isMaintenance();if(o)return void i.showMessageBox(y.lng_maintenance);var a=r.moduleConfig.params.rootContext.isOnline;if(a){var n=y.cart().length;if(n<=0)return void i.showMessageBox(y.lng_ERROR_00007);if(!y.attention())return void i.showMessageBox(y.lng_ERROR_00041);if(!y.startDate())return void i.showMessageBox(y.lng_ERROR_00019);var s=moment(y.startDate()),l=moment(y.endDate());if(y.endDate()&&s>l)return void i.showMessageBox(y.lng_ERROR_00018);confirm(y.lng_confirmPlaceQuotation)&&R(y.currQuotationId())}else i.showMessageBox(y.lng_ERROR_00005)},y.dispose=function(e){y.router.dispose()},y.goBack=function(e,o){console.log("goBack clicked");var a=r.moduleConfig.params.rootContext.fromPage,n=r.moduleConfig.params.rootContext.custId,s=r.moduleConfig.params.rootContext.quotationId;if(console.log("checkOutQuotation.js fromPage="+a),"newQuotation"==a||"newQuotationItem"==a||"topQuotationItem"==a)r.redirect(a,n);else if("quotationDetail"===a)r.redirect(a,s);else{var i=t.utils.unwrapObservable(y.currQuotationId);r.redirect("quotationDetail",i)}}}return t.bindingHandlers.winsize={init:function(e,t,r,a,n){o(window).resize(function(){a.screenWidth(o(window).width()),a.screenHeight(o(window).height())})}},t.bindingHandlers.currency={symbol:t.observable("$"),update:function(e,o,r){return t.bindingHandlers.text.update(e,function(){var e=+(t.utils.unwrapObservable(o())||0),a=t.utils.unwrapObservable(void 0===r().symbol?r().sybmol:"$");return a+e.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g,"$1,")})}},t.bindingHandlers.readOnly={update:function(e,o){var r=t.utils.unwrapObservable(o());r?e.setAttribute("readOnly",!0):e.removeAttribute("readOnly")}},new d});