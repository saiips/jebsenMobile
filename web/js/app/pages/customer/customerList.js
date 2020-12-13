define(["ojs/ojcore","knockout","jquery","appController","pages/customer/customerService","util/appui","pages/common/constant","ojs/ojknockout","ojs/ojlistview","ojs/ojjsontreedatasource","hammerjs","ojs/ojjquery-hammer","ojs/ojrouter","ojs/ojtoolbar","ojs/ojinputtext","ojs/ojbutton","ojs/ojinputnumber","ojs/ojmodel","ojs/ojpulltorefresh","ojs/ojvalidation","ojs/ojoffcanvas"],function(e,o,t,r,s,a,n){function l(){function l(){var e=r.moduleConfig.params.rootContext.isCordova,t=r.moduleConfig.params.rootContext.userProfile,s=r.moduleConfig.params.rootContext.userProfile.orgUnitId,a=r.moduleConfig.params.rootContext.userProfile.erpSalesId;e||t.salesRole!==n.SR_ADMIN||(a=null);var l=JSON.stringify({InputGetCustomers:{HeaderInfo:{UserID:t.username,UserRole:t.salesRole,CallerID:""},P_ORG_ID:o.utils.unwrapObservable(s),P_SALESREP_ID:a}});return l}function u(){console.log("customerList.js init() started"),a.showBusy();var e=function(e,o){try{d(e,o.status)}catch(e){console.error(e)}finally{console.log("cbSuccessFn called"),a.hideBusy(),C.ready(!0)}},t=function(e,o){console.log("cbFailFn failed");try{d(e,o.status)}catch(e){console.error(e)}finally{a.hideBusy(),C.ready(!0)}},r=l();console.log("Customer List Payload = "+o.toJS(r)),s.getCustomerListMessage(r).then(e,t)}function c(){var e=function(e,o){try{d(e,o.status)}catch(e){console.error(e)}finally{console.log("cbSuccessFn called"),a.hideBusy(),C.ready(!0)}},o=function(e,o){console.log("cbFailFn failed");try{d(e,o.status)}catch(e){console.error(e)}finally{a.hideBusy(),C.ready(!0)}};s.refreshCustomerListMessage(l()).then(e,o)}function d(e,o){var t=r.moduleConfig.params.rootContext.userProfile.orgUnitId,s=r.moduleConfig.params.rootContext.userProfile.erpSalesId;if(e=Array.isArray(e)?e[0]:e,null!==e&&200==o){var l=e[g],i=l.length;console.log("customer list ="+i);for(var u=0;u<i;u++)l[u].id=l[u].CUST_ACCOUNT_ID+":"+l[u].SHIP_TO_SITE_ID+":"+l[u].BILL_TO_SITE_ID;C.allCustomers(l);var c=n.CUSTOMER_LIST_KEY+":"+t+":"+s+":"+n.CUSTOMERS_SYNC_DATETIME,e=a.getLocalStorage(c);e&&(C.syncDatetime(e),C.showLastSyncDate(!0))}}function f(e){var t,t=o.utils.arrayFirst(C.allCustomers(),function(o){return o.id==e});return t=s.createCustomerProfile(t)}function m(){var o=e.Translations.getTranslatedString;C.lng_searchPlaceHolder=o("ssa.header.customerSearch"),C.lng_lastSyncDate=o("ssa.header.lastSyncDate"),C.lng_customer=o("ssa.customerList.customer"),C.lng_customerNo=o("ssa.customerList.customerNo"),C.lng_primaryText=o("ssa.pullToRefreshUtils.primaryText"),C.lng_secondaryText=o("ssa.pullToRefreshUtils.secondaryText")}var C=this,g="P_CUSTOMER_TBL_ITEM";C.handleActivated=function(e){m(),C.scrollPos(0),C.isOrderDeskAdmin=o.computed(function(){var e=r.moduleConfig.params.rootContext.userProfile;return e.salesRole==n.SR_ADMIN||!r.moduleConfig.params.rootContext.isCordova});var t=r.moduleConfig.params.rootContext.isUserChanged,s=r.moduleConfig.params.rootContext.refreshCustomerList;"undefined"==typeof s&&(s=!0);var l=r.moduleConfig.params.rootContext.isCordova;console.log("isUserChanged="+t),console.log("isRequiredRefresh="+s),(s||t)&&(C.ready(!1),l||C.isOrderDeskAdmin()?u():(a.showBusy(),c()),r.moduleConfig.params.rootContext.refreshCustomerList=!1,r.moduleConfig.params.rootContext.isUserChanged=!1,C.ready(!0))},C.handleAttached=function(e){},C.handleBindingsApplied=function(e){var o=t("#globalBody").find(".oj-hybrid-applayout-content"),r="oj-hybrid-applayout-scrollable";o.hasClass(r)&&(t("#searchCanvas").on("ojbeforeopen",function(){o.removeClass(r)}),t("#searchCanvas").on("ojbeforeclose",function(){o.addClass(r)})),t("#searchCanvas").on("ojclose",function(){C.clearSearch()})},C.handleDetached=function(e){C.clearSearch(),C.searchText("")},C.ready=o.observable(!1),C.allCustomers=o.observableArray(),C.scrollPos=o.observable(0),C.searchText=o.observable(""),C.searchText.extend({rateLimit:{timeout:1200,method:"notifyWhenChangesStop"}}),C.searchValueComplete=o.observable(""),C.syncDatetime=o.observable(),C.showLastSyncDate=o.observable(!1),C.customers=o.computed(function(){if(C.searchText()&&C.allCustomers().length>0){var t=C.searchText().toLowerCase(),r=o.utils.arrayFilter(C.allCustomers(),function(e){return e.COMPANY_NAME.toLowerCase().indexOf(t)>=0||e.OUTLET_NAME.toLowerCase().indexOf(t)>=0||e.ACCOUNT_NUMBER.toLowerCase().indexOf(t)>=0||e.PARENT_NAME.toLowerCase().indexOf(t)>=0||e.SHIP_TO_ADDRESS.toLowerCase().indexOf(t)>=0||e.SHIP_TO_DISTRICT.toLowerCase().indexOf(t)>=0});return new e.ArrayTableDataSource(r,{idAttribute:"id"})}return new e.ArrayTableDataSource(C.allCustomers(),{idAttribute:"id"})}),C.onClearSearchText=function(){C.clearSearch()},C.clearSearch=function(){var e=t("#searchProduct");e.ojInputText("option","value",""),e.ojInputText("reset"),C.searchText("")},C.toggleSearchCanvas=function(){e.OffcanvasUtils.toggle(i)},C.onSearchTextChange=function(e,o){"rawValue"===o.option&&(o.value.length>=2||0==o.value.length)&&(C.searchText(o.value),C.scrollPos(0))},C.goBack=function(){var e=r.moduleConfig.params.rootContext.fromPage;"visitationList"==e?r.go("visitation"):r.go("springboard")},C.optionChange=function(e,t){if("selection"===t.option&&t.value[0]){console.log("ui.value[0] ="+o.toJSON(t.value[0]));var s=f(t.value[0]);console.log("customerProfile = "+o.toJSON(s)),r.moduleConfig.params.rootContext.selCustomerProfile=s;var a=o.utils.unwrapObservable(s.shipToSiteId);console.log("shipToSiteId = "+o.toJSON(a));var n=o.utils.unwrapObservable(s.billToSiteId);console.log("billToSiteId = "+o.toJSON(n)),r.moduleConfig.params.rootContext.outLetId=a,r.moduleConfig.params.rootContext.custId=o.utils.unwrapObservable(s.id),console.log("stored custid = "+r.moduleConfig.params.rootContext.custId),r.moduleConfig.params.rootContext.originalCart=o.observableArray([]),r.moduleConfig.params.rootContext.originalQuotationCart=o.observableArray([]),r.moduleConfig.params.rootContext.isNewVisitation?(r.moduleConfig.params.rootContext.navStateId="newVisitation",r.redirect("newVisitation",r.moduleConfig.params.rootContext.custId)):(r.moduleConfig.params.rootContext.navStateId="orderHist",r.redirect("orderHist",a))}},C.refresh=function(){a.showBusy(),c()},C.onPageReady=function(){try{e.PullToRefreshUtils.setupPullToRefresh("#listviewContainer",function(){var e=new Promise(function(e,o){C.onClearSearchText(),c(),setTimeout(function(){e()},3e3)});return e},{primaryText:C.lng_primaryText,secondaryText:C.lng_secondaryText})}catch(e){console.error(e)}},t(document).ready(function(){e.PullToRefreshUtils.setupPullToRefresh("#listviewContainer",function(){console.log(">>>>>>>>>>>>>> setupPullToRefresh");var e=new Promise(function(e,o){C.onClearSearchText(),c(),setTimeout(function(){e()},3e3)});return e},{primaryText:C.lng_primaryText,secondaryText:C.lng_secondaryText}),t("#listview").on({ojdestroy:function(){console.log(">>>>>>>>>>>>>> ojdestroy"),e.PullToRefreshUtils.tearDownPullToRefresh("#listviewContainer")}})})}var i;return i={selector:"#searchCanvas",edge:"top",displayMode:"push",size:"63px",modality:"modeless",autoDismiss:"none"},o.bindingHandlers.searchCanvas={init:function(t,r,s){o.utils.domNodeDisposal.addDisposeCallback(t,function(){t&&e.OffcanvasUtils.close(i)})}},new l});