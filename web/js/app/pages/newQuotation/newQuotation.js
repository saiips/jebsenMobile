define(["ojs/ojcore","knockout","jquery","appController","pages/common/cartService","util/appui","pages/common/constant","promise","ojs/ojlistview","ojs/ojjsontreedatasource","ojs/ojpagingcontrol","ojs/ojnavigationlist","ojs/ojrouter","ojs/ojtoolbar","ojs/ojinputtext","ojs/ojbutton","ojs/ojinputnumber","ojs/ojarraytabledatasource","ojs/ojpulltorefresh","ojs/ojvalidation","ojs/ojoffcanvas"],function(o,e,t,a,n,r,i){function s(){function s(){v.newQuotationNavDataSource=e.computed(function(){var e=[{name:v.lng_itemList,id:"newQuotationItem",iconClass:"oj-navigationlist-item-icon demo-icon demo-dashboard-icon"},{name:v.lng_topList,id:"topQuotationItem",iconClass:"oj-navigationlist-item-icon demo-icon demo-dashboard-icon"},{name:v.lng_quotationList,id:"newQuotation",iconClass:"oj-navigationlist-item-icon demo-icon demo-incidents-icon"}];return new o.ArrayTableDataSource(e,{idAttribute:"id"})}),v.newQuotationNavChangeHandler=a.newQuotationNavChangeHandler,v.newQuotationNavStateId=e.observable()}function u(){v.lng_searchPlaceHolder=e.observable(v.lng_searchPlaceHolderText),v.searchText.extend({rateLimit:{timeout:500,method:"notifyWhenChangesStop"}})}function c(){console.log("newQuotation.js init() started");var o=a.moduleConfig.params.rootContext.originalQuotationCart;console.log("originalQuotationCart = "+e.toJSON(o)),console.log("isArray(originalQuotationCart) = "+Array.isArray(o)),Array.isArray(o)||(o=e.utils.unwrapObservable(o)),v.totalCnt(o.length),v.allProduct(o),v.ready(!0),d(),s(),u()}function d(){var e=o.Translations.getTranslatedString;v.lng_newQuotation=e("ssa.newQuotation.newQuotation"),v.lng_itemList=e("ssa.newQuotation.itemList"),v.lng_topList=e("ssa.newQuotation.topList"),v.lng_quotationList=e("ssa.newQuotation.quotationList"),v.lng_qty=e("ssa.newQuotation.qty"),v.lng_searchPlaceHolderText=e("ssa.newQuotation.searchPlaceHolder"),v.lng_noItemCart=e("ssa.msg.info.noItemCart")}var v=this;v.handleActivated=function(t){var n=t.valueAccessor().params.ojRouter.parentRouter;console.log("newQuotation.js parentRouter="+n.currentState().value);var r=n.getChildRouter("newQuotation");r||(r=n.createChildRouter("newQuotation")),v.router=r.configure(function(e){if(e){var t=new o.RouterState(e,{value:e,enter:function(){v.currOrderId(e),console.log("stateId ="+e)}});return t}}),v.headerSubTitle(v.lng_newQuotation);var s=a.moduleConfig.params.rootContext.selCustomerProfile;if("undefined"!=typeof s){var l=e.utils.unwrapObservable(s.outletName);e.utils.unwrapObservable(v.large())||l.length>i.TITLE_LENGTH&&(l=l.substring(0,i.TITLE_LENGTH)+"..."),v.headerTitle(l)}else v.headerTitle("");return v.newQuotationNavStateId(a.moduleConfig.params.rootContext.newQuotationNavStateId),o.Router.sync()},console.log("NewQuotationViewModoel"),v.router=a.router,v.allProduct=e.observableArray(),v.ready=e.observable(!1),v.cart=e.observableArray(),v.currOrderId=e.observable(),v.headerTitle=e.observable(""),v.headerSubTitle=e.observable(""),v.totalCnt=e.observable(0),v.large=e.computed(function(){var e=o.ResponsiveUtils.getFrameworkQuery(o.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);return o.ResponsiveKnockoutUtils.createMediaQueryObservable(e)}),v.searchText=e.observable(""),v.products=e.computed(function(){var t=v.searchText().toLowerCase();if(v.searchText()&&v.allProduct().length>0){var a=e.utils.arrayFilter(v.allProduct(),function(o){return o.product().prod_desc().toLowerCase().indexOf(t)>=0||o.product().prod_code().toLowerCase().indexOf(t)>=0||o.product().prod_brand().toLowerCase().indexOf(t)>=0});return new o.ArrayTableDataSource(a,{idAttribute:"id"})}return new o.ArrayTableDataSource(v.allProduct(),{idAttribute:"id"})}),v.handleBindingsApplied=function(o){var e=t("#globalBody").find(".oj-hybrid-applayout-content"),a="oj-hybrid-applayout-scrollable";e.hasClass(a)&&(t("#searchCanvas").on("ojbeforeopen",function(){e.removeClass(a)}),t("#searchCanvas").on("ojbeforeclose",function(){e.addClass(a)})),t("#searchCanvas").on("ojclose",function(){v.clearSearch()})},v.onClearSearchText=function(){v.clearSearch()},v.clearSearch=function(){var o=t("#searchProduct");o.ojInputText("option","value",""),o.ojInputText("reset"),v.searchText("")},v.toggleSearchCanvas=function(){o.OffcanvasUtils.toggle(l)},v.onSearchTextChange=function(o,e){"rawValue"===e.option&&v.searchText(e.value)},v.removeCart=function(o){var t=e.utils.unwrapObservable(o.id),n=e.utils.unwrapObservable(o.quantity),r=e.utils.arrayFirst(v.allProduct(),function(o){var a=e.utils.unwrapObservable(o.id),r=e.utils.unwrapObservable(o.quantity);if(a==t&&r==n)return o});v.allProduct.remove(r),r&&v.totalCnt(e.utils.unwrapObservable(v.totalCnt())-1),a.moduleConfig.params.rootContext.originalQuotationCart=e.utils.unwrapObservable(v.allProduct)},v.checkOut=function(o,e){var t=n.allowCheckOut(a.moduleConfig.params.rootContext.originalQuotationCart);t?(a.moduleConfig.params.rootContext.fromPage="newQuotation",a.redirect("checkOutQuotation",null)):r.showMessageBox(v.lng_noItemCart)},v.goBack=function(o,e){console.log("goBack clicked");var t=a.moduleConfig.params.rootContext.fromPage;if("quotation"===t||"newQuotation"===t||"newQuotationItem"===t){var n=a.moduleConfig.params.rootContext.custId;a.redirect("quotation",n)}else{var r=a.moduleConfig.params.rootContext.quotationId;a.redirect("quotationDetail",r)}},v.dispose=function(o){v.router.dispose()},c()}var l;return l={selector:"#searchCanvas",edge:"top",displayMode:"push",size:"63px",modality:"modeless",autoDismiss:"none"},e.bindingHandlers.searchCanvas={init:function(t,a,n){e.utils.domNodeDisposal.addDisposeCallback(t,function(){t&&o.OffcanvasUtils.close(l)})}},e.bindingHandlers.winsize={init:function(o,e,a,n,r){t(window).resize(function(){n.screenWidth(t(window).width()),n.screenHeight(t(window).height())})}},e.bindingHandlers.currency={symbol:e.observable("$"),update:function(o,t,a){return e.bindingHandlers.text.update(o,function(){var o=+(e.utils.unwrapObservable(t())||0),n=e.utils.unwrapObservable(void 0===a().symbol?a().sybmol:"$");return n+o.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g,"$1,")})}},s});