define(["knockout","jquery","module","amplify","util/devmode","util/appui","pages/common/constant","util/commonhelper","appController","pages/login/loginService","config/appconfig"],function(e,n,t,r,o,s,a,i,u,c,l){function f(){function e(e){var t=n.Deferred(),s=a.GOODS_LOADING_KEY;return o.isEnabled()&&o.isOffline()?(n.getJSON("js/app/pages/loading/loadingServiceMock.json",function(e){setTimeout(function(){t.resolve(e,{status:200})},500)}),n.when(t)):(console.log("[Amplify Request] Goods Loading - "+s),r.request({resourceId:s,success:t.resolve,error:t.reject,data:e}),n.when(t))}function t(e){var t=n.Deferred(),s=a.GOODS_UNLOADING_KEY;return o.isEnabled()&&o.isOffline()?(n.getJSON("js/app/pages/loading/unloadingServiceMock.json",function(e){setTimeout(function(){t.resolve(e,{status:200})},500)}),n.when(t)):(console.log("[Amplify Request] Goods UnLoading - "+s),r.request({resourceId:s,success:t.resolve,error:t.reject,data:e}),n.when(t))}function s(e,n,t,r){t&&""!=t||(t=null);var o=u.moduleConfig.params.rootContext.userProfile,s=JSON.stringify({InputServiceLoadingDNRMA:{HeaderInfo:{UserID:o.username,UserRole:o.salesRole,CallerID:""},P_DOCUMENT_TYPE:n,P_ORG_ID:e,P_DELIVERY_NUMBER:r,P_CP_NUMBER:t}});return s}function i(e,n,t,r){var o=u.moduleConfig.params.rootContext.userProfile,s=JSON.stringify({InputDeleteDNRMA:{HeaderInfo:{UserID:o.username,UserRole:o.salesRole,CallerID:""},P_DOCUMENT_TYPE:n,P_ORG_ID:e,P_DELIVERY_NUMBER:r,P_CP_NUMBER:t}});return s}function f(e){var t=n.Deferred();if(o.isEnabled()&&o.isOffline()){var s={result:"true"};return setTimeout(function(){t.resolve(s,{status:200})},500),n.when(t)}return r.request({resourceId:a.CHECK_PASSCODE_KEY,success:t.resolve,error:t.reject,data:e}),n.when(t)}function d(){var e=n.Deferred();try{var t=c.getOAuthToken(),r={Authorization:"Basic "+t,"Content-Type":"application/x-www-form-urlencoded; charset=utf-8"},o=r||{};n.ajaxSetup({headers:o});var s="grant_type=client_credentials&scope=urn:opc:idm:__myscopes__";g(s).done(function(t){var r=t.access_token;if(r){var o={Authorization:"Basic "+a.BASE64_GITCONTACT,"Oracle-Mobile-Backend-ID":l.get("mobileBackendId"),"Content-Type":"application/json; charset=utf-8"},s=o||{};n.ajaxSetup({headers:s}),e.resolve({status:200})}}).fail(function(e){console.log("getOAuthTokenPayload error:"+e)})}catch(e){console.log(e)}return n.when(e)}function g(e){var t=n.Deferred();if(o.isEnabled()&&o.isOffline()){var s={access_token:"ODU0NDg0NTg="};return setTimeout(function(){t.resolve(s,{status:200})},500),n.when(t)}return r.request.define("getOAuthToken","ajax",{url:l.get("tokenServer"),dataType:"json",type:"POST"}),r.request({resourceId:"getOAuthToken",success:t.resolve,error:t.reject,data:e}),n.when(t)}this.getLoadingMessage=function(n){return e(n)},this.getUnLoadingMessage=function(e){return t(e)},this.getPayload=function(e,n,t,r){return s(e,n,t,r)},this.getUnLoadingPayload=function(e,n,t,r){return i(e,n,t,r)},this.checkPasscode=function(e){return f(e)},this.setupOAuthToken=function(){return d()},this.getOAuthTokenMessage=function(e){return g(e)}}return new f});