define(["ojs/ojcore","knockout","jquery","appController"],function(e,r,n,o){function t(){var r=this;r.handleActivated=function(o){function t(e){return n.extend(!0,{},e,{})}var a=o.valueAccessor().params.ojRouter.parentRouter;console.log("performance parentRouter="+a.currentState().value);var u=a.getChildRouter("performance");return u||(u=a.createChildRouter("performance")),r.router=u.configure({performanceDetail:{value:"pages/performance/performanceDetail",label:"Performance",isDefault:!0}}),r.moduleConfig=t(r.router.moduleConfig),e.Router.sync()},r.handleAttached=function(e){},r.handleBindingsApplied=function(e){},r.handleDetached=function(e){},r.dispose=function(e){r.router.dispose()}}return t});