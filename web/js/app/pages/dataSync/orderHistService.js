define(["knockout","jquery","util/appui","appController","util/devmode","util/commonhelper","pages/common/constant","pages/dataSync/orderDetailService"],function(e,t,r,o,n,s,a,u){function i(){function o(o){var u=t.Deferred(),i=e.utils.parseJson(o),c=i.InputParameters.P_ORG_ID,_=i.InputParameters.P_ACCOUNT_NUMBER,l=i.InputParameters.P_SHIP_TO_ORG_ID,p=a.ORDER_LIST_KEY+":"+c+":"+_+":"+l;return n.isEnabled()&&n.isOffline()?t.getJSON("js/app/pages/orderHist/orderHistMock.json",function(e){setTimeout(function(){u.resolve(e,{status:200})},500)}):(console.log("[Amplify Request] Order History List - "+p),amplify.request({resourceId:a.ORDER_LIST_KEY,success:u.resolve,error:u.reject,data:o}),r.setLocalStorage(p+":"+a.ORDER_HISTORY_SYNC_DATETIME,s.getClientCurrentDate(a.DATETIME_FORMAT).toUpperCase()),t.when(u).done(function(e,t,o){r.setLocalStorage(p,e);e.P_ORDER_TBL_ITEM;r.updateDownloadRequestCount(a.P_ORDER_CNT,1)}).fail(function(){r.updateDownloadRequestCount(a.P_ORDER_CNT,1)})),p}this.registerService=function(e){return o(e)}}return new i});