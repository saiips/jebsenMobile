define(["knockout","jquery","module","amplify","util/appui","appController","util/devmode","util/commonhelper","pages/common/constant"],function(e,t,n,o,r,u,i,s,a){function l(){function n(n){var u=t.Deferred(),l=e.utils.parseJson(n),c=l.InputGetOrderLineList.P_ORG_ID,D=l.InputGetOrderLineList.P_HEADER_ID,d=a.ORDER_LINES_KEY+":"+c+":"+D;return i.isEnabled()&&i.isOffline()?(t.getJSON("js/app/pages/orderDetail/orderDetailMock.json",function(e){setTimeout(function(){u.resolve(e,{status:200})},500)}),d):(console.log("[Amplify Request] Order Detail - "+d),o.request({resourceId:a.ORDER_LINES_KEY,success:u.resolve,error:u.reject,data:n}),r.setLocalStorage(d+":"+a.ORDER_DETAIL_SYNC_DATETIME,s.getClientCurrentDate(a.DATETIME_FORMAT).toUpperCase()),t.when(u).done(function(e,t,n){r.setLocalStorage(d,e),r.updateDownloadRequestCount(a.P_ORDER_DTL_CNT,1)}).fail(function(){r.updateDownloadRequestCount(a.P_ORDER_DTL_CNT,1)}),d)}this.registerService=function(e){return n(e)}}return new l});