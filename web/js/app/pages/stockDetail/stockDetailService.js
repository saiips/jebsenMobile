define(["knockout","jquery","util/appui","util/devmode","amplify","appController","pages/common/constant"],function(e,t,s,o,n,r,i){function a(e){var s=t.Deferred();return o.isEnabled()&&o.isOffline()?(t.getJSON("js/app/pages/stockDetail/itemReservationDetails.json",function(e){setTimeout(function(){s.resolve(e,{status:200})},500)}),t.when(s)):(console.log("[Amplify Request] Item Lot - "+i.P_RESERVATION_TBL),n.request({resourceId:i.P_RESERVATION_TBL,success:s.resolve,error:s.reject,data:e}),t.when(s))}return{getItemReservationDetailsMessage:a}});