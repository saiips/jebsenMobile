define(["knockout","jquery","module","amplify"],function(e,r,t,n){function u(){function e(){var e=r.Deferred();return n.request({resourceId:"productItem",success:e.resolve,error:e.reject}),r.when(e)}this.getProductItemMessage=function(){return e()}}return new u});