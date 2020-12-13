define(["knockout","jquery","util/appui","util/devmode","util/commonhelper","pages/common/constant"],function(e,r,t,n,s,o){function i(){function e(e,i){var a=r.Deferred(),u=o.FAILED_ORDER_LIST_KEY;if(n.isEnabled()&&n.isOffline())return r.getJSON("js/app/pages/reInitateOrder/reInitateOrderMock.json",function(e){setTimeout(function(){a.resolve(e,{status:200})},500)}),r.when(a);var c=t.getLocalStorage(u);return c&&!i?(console.log("[Local Storage] Re-Initiate Order List - "+u),a.resolve(c,{status:200})):(console.log("[Amplify Request] Re-Initiate Order List - "+u),amplify.request({resourceId:u,success:a.resolve,error:a.reject,data:e}),t.setLocalStorage(u+":"+o.RE_INITIATE_ORDER_SYNC_DATETIME,s.getClientCurrentDate(o.DATETIME_FORMAT).toUpperCase()),r.when(a).done(function(e,r,n){t.setLocalStorage(u,e)})),r.when(a)}function i(e){var t=r.Deferred(),s=o.CANCEL_FAILED_ORDER_KEY;return n.isEnabled()&&n.isOffline()?(r.getJSON("js/app/pages/reInitateOrder/cancelFailedOrderMock.json",function(e){setTimeout(function(){t.resolve(e,{status:200})},500)}),r.when(t)):(console.log("[Amplify Request] Cancel Failed Order - "+s),amplify.request({resourceId:s,success:t.resolve,error:t.reject,data:e}),r.when(t))}function a(e){var t=r.Deferred(),s=o.RE_INITIATE_ORDER_KEY;return n.isEnabled()&&n.isOffline()?(r.getJSON("js/app/pages/reInitateOrder/cancelFailedOrderMock.json",function(e){setTimeout(function(){t.resolve(e,{status:200})},500)}),r.when(t)):(console.log("[Amplify Request] Re-Initate Failed Order - "+s),amplify.request({resourceId:s,success:t.resolve,error:t.reject,data:e}),r.when(t))}this.getOrderListMessage=function(r){return e(r)},this.refreshOrderListMessage=function(r){return e(r,!0)},this.cancelFailedOrderMessage=function(e){return i(e)},this.reInitiateFailedOrderMessage=function(e){return a(e)}}return new i});