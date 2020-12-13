define(["ojs/ojcore","knockout","jquery","appController","pages/newOrder/newOrderService","pages/common/cartService","util/commonhelper","util/appui","pages/common/constant","promise","ojs/ojlistview","ojs/ojjsontreedatasource","ojs/ojpagingcontrol","ojs/ojnavigationlist","ojs/ojrouter","ojs/ojtoolbar","ojs/ojinputtext","ojs/ojbutton","ojs/ojinputnumber","ojs/ojarraytabledatasource","ojs/ojpulltorefresh","ojs/ojvalidation","ojs/ojoffcanvas"],function(e,t,o,a,r,n,i,s,l){function u(){function u(){var e=a.moduleConfig.params.rootContext.userProfile,o=t.utils.unwrapObservable(e.orgUnitId),r=a.moduleConfig.params.rootContext.selCustomerProfile,n=t.utils.unwrapObservable(r.shipToSiteId),i=t.utils.unwrapObservable(r.priceListId);f.payloadKey(e.username+":"+o+":"+n+":"+i)}function d(){var e=a.moduleConfig.params.rootContext.userProfile,o=a.moduleConfig.params.rootContext.selCustomerProfile,r=t.utils.unwrapObservable(o.priceListId),n=t.utils.unwrapObservable(o.shipToSiteId),i=JSON.stringify({InputGetTop10PriceList:{HeaderInfo:{UserID:e.username,UserRole:e.salesRole,CallerID:""},P_ORG_ID:e.orgUnitId,P_SHIP_TO_ORG_ID:n,P_PRICE_LIST_ID:r}});return i}function p(){var e=a.moduleConfig.params.rootContext.originalQuotationCart;console.log("_cart = "+t.toJSON(e)),Array.isArray(e)||(e=t.utils.unwrapObservable(e)),console.log("isArray(_cart) = "+Array.isArray(e)),Array.isArray(e)&&f.totalCnt(e.length)}function g(){console.log("newQuotationItem.js init() started"),f.ready(!1),s.showBusy(),p(),C()}function C(){var e=function(e,t){try{b(e,t.status)}catch(e){console.error(e),s.hideBusy()}finally{console.log("cbSuccessFn called"),s.hideBusy()}},t=function(e,t){console.log("cbFailFn failed"),b(e,t.status),s.hideBusy()};r.getTopItemListMessage(d()).then(e,t)}function b(o,a){if(console.log("prepareUI triggered"),o=Array.isArray(o)?o[0]:o,null!==o&&200==a){var r=o[I],l=[];Array.isArray(r)||(r=new Array(r));for(var u=0;u<r.length;u++){var c=JSON.stringify({INVENTORY_ITEM_ID:r[u].INVENTORY_ITEM_ID,PRODUCT_DESCRIPTION:r[u].PRODUCT_DESCRIPTION,DESCRIPTION:r[u].DESCRIPTION,PRODUCT:r[u].PRODUCT,LOT_NUMBER:"",ORDER_QUANTITY_UOM:r[u].PRODUCT_UOM_CODE,UNIT_SELLING_PRICE:r[u].UNIT_PRICE,FLOW_STATUS_CODE:"",PRODUCT_BRAND:r[u].PRODUCT_BRAND,PRINCIPAL:r[u].PRINCIPAL,CURRENCY_CODE:r[u].CURRENCY_CODE,DRAFT_BEER_FLAG:r[u].DRAFT_BEER_FLAG});cart_item=n.createCartItem(t.utils.parseJson(c),0,!0,i.getClientCurrentDate(),"Y",new Array),l[u]=cart_item}f.allProduct(l),f.products=t.computed(function(){var o=t.utils.unwrapObservable(f.allProduct());if(f.searchText()&&o.length>0){var a=f.searchText().toLowerCase(),r=t.utils.arrayFilter(o,function(e){return e.product().prod_desc().toLowerCase().indexOf(a)>=0||e.product().prod_code().toLowerCase().indexOf(a)>=0||e.product().prod_brand().toLowerCase().indexOf(a)>=0});return new e.ArrayTableDataSource(r,{idAttribute:"id"})}return new e.ArrayTableDataSource(o,{idAttribute:"id"})}),s.hideBusy(),f.ready(!0)}}function m(e,t){var a,r;if("SPAN"==t.target.tagName?(r=o(t.target),a=o(t.target.parentNode)):"A"==t.target.tagName&&(r=o(t.target).find("span"),a=o(t.target)),!a.attr("clicked")||"true"!=a.attr("clicked")){a.attr("clicked")||a.attr("clicked",!1),a.attr("clicked",!0),a.css("background-color","rgb(70, 133, 191)");var n=r.text();r.text(f.lng_added),setTimeout(function(){a.css("background-color","#002d72"),r.text(n),a.attr("clicked",!1)},100)}}function v(){var t=e.Translations.getTranslatedString;f.lng_newQuotation=t("ssa.newQuotationItem.newQuotation"),f.lng_itemList=t("ssa.newQuotationItem.itemList"),f.lng_topList=t("ssa.newQuotationItem.topList"),f.lng_quotationList=t("ssa.newQuotationItem.quotationList"),f.lng_searchPlaceHolderText=t("ssa.newQuotationItem.searchPlaceHolder"),f.lng_addToCart=t("ssa.newQuotationItem.addToCart"),f.lng_added=t("ssa.newQuotationItem.added"),f.lng_principal=t("ssa.newQuotationItem.principal"),f.lng_noItemCart=t("ssa.msg.info.noItemCart")}var f=this;v();var I="P_PRICE_LIST_TBL_ITEM";f.handleActivated=function(o){var r=o.valueAccessor().params.ojRouter.parentRouter;console.log("topQuotationItem.js parentRouter="+r.currentState().value),f.searchText(""),f.scrollPos(0);var n=r.getChildRouter("topQuotationItem");n||(n=r.createChildRouter("topQuotationItem")),f.router=n.configure(function(t){if(t){var o=new e.RouterState(t,{value:t,enter:function(){f.currQuotationId(t),console.log("stateId ="+t)}});return o}}),v(),f.headerSubTitle(f.lng_newQuotation);var i=a.moduleConfig.params.rootContext.selCustomerProfile;if("undefined"!=typeof i){var s=t.utils.unwrapObservable(i.outletName);t.utils.unwrapObservable(f.large())||s.length>l.TITLE_LENGTH&&(s=s.substring(0,l.TITLE_LENGTH)+"..."),f.headerTitle(s)}else f.headerTitle("");return p(),u(),f.newQuotationNavDataSource=t.computed(function(){var t=[{name:f.lng_itemList,id:"newQuotationItem",iconClass:"oj-navigationlist-item-icon demo-icon demo-dashboard-icon"},{name:f.lng_topList,id:"topQuotationItem",iconClass:"oj-navigationlist-item-icon demo-icon demo-dashboard-icon"},{name:f.lng_quotationList,id:"newQuotation",iconClass:"oj-navigationlist-item-icon demo-icon demo-incidents-icon"}];return new e.ArrayTableDataSource(t,{idAttribute:"id"})}),f.newQuotationNavChangeHandler=a.newQuotationNavChangeHandler,f.newQuotationNavStateId(a.moduleConfig.params.rootContext.newQuotationNavStateId),e.Router.sync()},console.log("TopQuotationItemViewModoel"),f.router=a.router,f.allProduct=t.observableArray(),f.ready=t.observable(!1),f.cart=t.observableArray(),f.currQuotationId=t.observable(),f.headerTitle=t.observable(""),f.headerSubTitle=t.observable(""),f.newQuotationNavStateId=t.observable(),f.totalCnt=t.observable(0),f.payloadKey=t.observable(),f.scrollPos=t.observable(0),f.large=t.computed(function(){var t=e.ResponsiveUtils.getFrameworkQuery(e.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);return e.ResponsiveKnockoutUtils.createMediaQueryObservable(t)}),f.searchText=t.observable(""),f.payloadKey.subscribe(function(e){console.log("new payloadKey ="+e),g()}),f.lng_searchPlaceHolder=t.observable(f.lng_searchPlaceHolderText),f.searchText.extend({rateLimit:{timeout:500,method:"notifyWhenChangesStop"}}),f.itemCode=t.observableArray(),f.handleBindingsApplied=function(e){var t=o("#globalBody").find(".oj-hybrid-applayout-content"),a="oj-hybrid-applayout-scrollable";t.hasClass(a)&&(o("#searchCanvas").on("ojbeforeopen",function(){t.removeClass(a)}),o("#searchCanvas").on("ojbeforeclose",function(){t.addClass(a)})),o("#searchCanvas").on("ojclose",function(){f.clearSearch()})},f.onClearSearchText=function(){f.clearSearch()},f.clearSearch=function(){var e=o("#searchProduct");e.ojInputText("option","value",""),e.ojInputText("reset"),f.searchText("")},f.toggleSearchCanvas=function(){e.OffcanvasUtils.toggle(c)},f.onSearchTextChange=function(e,t){"rawValue"===t.option&&f.searchText(t.value)},f.addToCart=function(e,o){var r=!1,s=JSON.stringify({INVENTORY_ITEM_ID:t.utils.unwrapObservable(e.product().id),PRODUCT_DESCRIPTION:t.utils.unwrapObservable(e.product().prod_desc),PRODUCT:t.utils.unwrapObservable(e.product().prod_code),LOT_NUMBER:t.utils.unwrapObservable(e.product().lot),ORDER_QUANTITY_UOM:t.utils.unwrapObservable(e.product().sku),UNIT_SELLING_PRICE:t.utils.unwrapObservable(e.product().price),FLOW_STATUS_CODE:t.utils.unwrapObservable(e.product().delivery_status),PRODUCT_BRAND:t.utils.unwrapObservable(e.product().prod_brand),CURRENCY_CODE:t.utils.unwrapObservable(e.product().currency_code),DRAFT_BEER_FLAG:t.utils.unwrapObservable(e.product().draft_beer_flag)}),l=n.createCartItem(t.utils.parseJson(s),1,!0,i.getClientCurrentDate(),"Y",new Array),u=a.moduleConfig.params.rootContext.originalQuotationCart;if(Array.isArray(u)||(u=t.utils.unwrapObservable(u)),"undefined"==typeof u||0==u.length){var c=new Array;c.push(l),a.moduleConfig.params.rootContext.originalQuotationCart=c,r=!0}else{var d=t.utils.arrayFirst(u,function(o){if(t.utils.unwrapObservable(e.product().id)==t.utils.unwrapObservable(o.product().id))return o});null!=d&&"undefined"!=typeof d||(r=!0,a.moduleConfig.params.rootContext.originalQuotationCart.push(l))}r&&(f.totalCnt(t.utils.unwrapObservable(f.totalCnt())+1),m(e,o))},f.checkOut=function(e,o){console.log("app.moduleConfig.params.rootContext.originalQuotationCart="+t.toJSON(a.moduleConfig.params.rootContext.originalQuotationCart));var r=n.allowCheckOut(a.moduleConfig.params.rootContext.originalQuotationCart);r?(a.moduleConfig.params.rootContext.fromPage="topQuotationItem",a.redirect("checkOutQuotation",null)):s.showMessageBox(f.lng_noItemCart)},f.goBack=function(e,t){console.log("goBack clicked");var o=a.moduleConfig.params.rootContext.fromPage;if("quotation"===o||"newQuotation"===o||"topQuotationItem"===o){var r=a.moduleConfig.params.rootContext.custId;a.redirect("quotation",r)}else{var n=a.moduleConfig.params.rootContext.quotationId;a.redirect("quotationDetail",n)}},f.dispose=function(e){f.router.dispose()}}var c;return c={selector:"#searchCanvas",edge:"top",displayMode:"push",size:"63px",modality:"modeless",autoDismiss:"none"},t.bindingHandlers.searchCanvas={init:function(o,a,r){t.utils.domNodeDisposal.addDisposeCallback(o,function(){o&&e.OffcanvasUtils.close(c)})}},t.bindingHandlers.winsize={init:function(e,t,a,r,n){o(window).resize(function(){r.screenWidth(o(window).width()),r.screenHeight(o(window).height())})}},t.bindingHandlers.currency={symbol:t.observable("$"),update:function(e,o,a){return t.bindingHandlers.text.update(e,function(){var e=+(t.utils.unwrapObservable(o())||0),r=t.utils.unwrapObservable(void 0===a().symbol?a().sybmol:"$");return r+e.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g,"$1,")})}},new u});